-- ============================================
-- RLS POLICIES PARA BUCKET 'public' NO SUPABASE STORAGE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Habilitar RLS no bucket 'public' (se não estiver habilitado)
-- Nota: O bucket 'public' já deve existir. Se não existir, crie-o primeiro:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('public', 'public', true);

-- Habilitar RLS na tabela storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA BUCKET 'public'
-- ============================================

-- 1. SELECT (Leitura) - Público pode ver arquivos do bucket 'public'
CREATE POLICY "public_select_public_bucket" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public');

-- 2. INSERT (Upload) - Usuários autenticados podem fazer upload no bucket 'public'
CREATE POLICY "public_insert_public_bucket" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public');

-- 3. UPDATE (Atualização/Sobrescrita) - Usuários autenticados podem atualizar seus arquivos no bucket 'public'
CREATE POLICY "public_update_public_bucket" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'public')
  WITH CHECK (bucket_id = 'public');

-- 4. DELETE (Exclusão) - Usuários autenticados podem deletar seus arquivos no bucket 'public'
CREATE POLICY "public_delete_public_bucket" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'public');

-- ============================================
-- ALTERNATIVA MAIS PERMISSIVA (se necessário)
-- Se as políticas acima não funcionarem devido a ownership,
-- use estas políticas mais permissivas baseadas em auth.uid():
-- ============================================

-- Política INSERT alternativa (permite qualquer autenticado inserir no bucket public)
-- CREATE POLICY "public_insert_public_bucket_v2" ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'public'
--     AND auth.role() = 'authenticated'
--   );

-- Política UPDATE alternativa
-- CREATE POLICY "public_update_public_bucket_v2" ON storage.objects
--   FOR UPDATE
--   TO authenticated
--   USING (
--     bucket_id = 'public'
--     AND auth.role() = 'authenticated'
--   )
--   WITH CHECK (
--     bucket_id = 'public'
--     AND auth.role() = 'authenticated'
--   );

-- Política DELETE alternativa
-- CREATE POLICY "public_delete_public_bucket_v2" ON storage.objects
--   FOR DELETE
--   TO authenticated
--   USING (
--     bucket_id = 'public'
--     AND auth.role() = 'authenticated'
--   );

-- ============================================
-- VERIFICAÇÃO: Listar políticas existentes
-- ============================================
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. O bucket 'public' deve ser criado como público (public = true)
-- 2. As políticas acima assumem que o bucket já existe
-- 3. Se o bucket não existir, crie-o primeiro no Dashboard do Supabase
--    ou via SQL: INSERT INTO storage.buckets (id, name, public) VALUES ('public', 'public', true);
-- 4. Os caminhos usados pelo código:
--    - estabelecimentos/logos/{timestamp}.{ext}
--    - estabelecimentos/capas/{timestamp}.{ext}
-- 5. Se ainda houver erro de RLS, verifique se o usuário está autenticado
--    (auth.uid() não é nulo) e se o bucket 'public' existe e está público