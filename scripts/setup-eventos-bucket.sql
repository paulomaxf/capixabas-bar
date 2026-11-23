-- ============================================
-- SETUP COMPLETO DO BUCKET "EVENTOS" NO SUPABASE STORAGE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR/ATUALIZAR O BUCKET "EVENTOS"
-- ------------------------------------------
-- Se o bucket não existir, será criado.
-- Se já existir, será atualizado com as configurações corretas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'eventos',
  'eventos',
  true,                              -- Público: permite leitura direta via URL pública
  10485760,                          -- 10MB (banners podem ser maiores que imagens de produtos)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. VERIFICAR SE O BUCKET FOI CRIADO/ATUALIZADO CORRETAMENTE
-- ------------------------------------------
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'eventos';

-- 3. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM) PARA EVITAR CONFLITOS
-- ------------------------------------------
drop policy if exists "Public read eventos images" on storage.objects;
drop policy if exists "Members upload eventos images" on storage.objects;
drop policy if exists "Members update eventos images" on storage.objects;
drop policy if exists "Members delete eventos images" on storage.objects;

-- 4. CRIAR POLÍTICAS RLS PARA O BUCKET "EVENTOS"
-- ------------------------------------------

-- 4.1 LEITURA PÚBLICA - Qualquer um pode ver as imagens (para exibir na vitrine)
create policy "Public read eventos images"
  on storage.objects for select
  using (bucket_id = 'eventos');

-- 4.2 UPLOAD - Apenas membros do estabelecimento podem fazer upload
-- O path deve começar com o estabelecimento_id (ex: "uuid-do-estab/eventos/...")
create policy "Members upload eventos images"
  on storage.objects for insert
  with check (
    bucket_id = 'eventos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- 4.3 ATUALIZAÇÃO - Apenas membros do estabelecimento podem atualizar
create policy "Members update eventos images"
  on storage.objects for update
  using (
    bucket_id = 'eventos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- 4.4 EXCLUSÃO - Apenas membros do estabelecimento podem deletar
create policy "Members delete eventos images"
  on storage.objects for delete
  using (
    bucket_id = 'eventos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- 5. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ------------------------------------------
select policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
and policyname like '%eventos%';

-- 6. TESTE DE UPLOAD (OPCIONAL - execute apenas para testar)
-- ------------------------------------------
-- Substitua 'SEU_ESTABELECIMENTO_ID' pelo UUID real do estabelecimento
-- insert into storage.objects (bucket_id, name, owner, metadata)
-- values ('eventos', 'SEU_ESTABELECIMENTO_ID/eventos/teste/123.jpg', auth.uid(), '{}');

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. O path do upload DEVE começar com o estabelecimento_id
--    Exemplo correto: "abc-123/eventos/evt-456/1700000000.jpg"
--    Exemplo incorreto: "eventos/evt-456/1700000000.jpg" (falha no RLS)
--
-- 2. O usuário DEVE estar autenticado (auth.uid() not null)
--    e ter um perfil com estabelecimento_id preenchido
--
-- 3. A função current_estabelecimento_id() deve existir e funcionar:
--    create or replace function public.current_estabelecimento_id()
--    returns uuid language sql stable as $$
--      select estabelecimento_id from public.perfis where id = auth.uid()
--    $$;
--
-- 4. Se o erro persistir, verifique:
--    - Se o usuário tem perfil na tabela 'perfis' com estabelecimento_id
--    - Se o bucket "eventos" aparece em Storage no painel do Supabase
--    - Se as políticas estão ativas (pg_policies)
--    - Logs do Supabase > Logs > Storage para ver detalhes do erro 400