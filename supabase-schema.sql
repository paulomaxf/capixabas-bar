-- RoomHouse Manager System - Supabase Schema
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- EXTENSÕES
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- TIPOS PERSONALIZADOS
-- ============================================
create type papel_usuario as enum ('owner', 'gerente', 'editor');
create type tipo_evento as enum ('evento', 'promocao', 'show');
create type disponibilidade_produto as enum ('disponivel', 'indisponivel', 'sob_encomenda');
create type unidade_medida as enum ('UN', 'KG', 'G', 'L', 'ML', 'CX', 'PCT', 'BD', 'LT');

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Estabelecimentos
create table public.estabelecimentos (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nome text not null,
  descricao text,
  telefone text,
  endereco jsonb default '{}'::jsonb,
  horario_funcionamento jsonb default '{}'::jsonb,
  logo_url text,
  capa_url text,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Perfis de Usuário (estende auth.users)
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  estabelecimento_id uuid references public.estabelecimentos(id) on delete set null,
  nome text,
  papel papel_usuario default 'editor',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Categorias
create table public.categorias (
  id uuid primary key default uuid_generate_v4(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  nome text not null,
  icone text,
  cor text default '#3B82F6',
  ordem integer default 0,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Produtos
create table public.produtos (
  id uuid primary key default uuid_generate_v4(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  categoria_id uuid references public.categorias(id) on delete set null,
  nome text not null,
  descricao text,
  valor numeric(10,2) not null default 0,
  unidade unidade_medida default 'UN',
  imagem_url text,
  disponibilidade disponibilidade_produto default 'disponivel',
  destaque boolean default false,
  ativo boolean default true,
  combinac boolean default false,
  combinag boolean default false,
  grupoc boolean default false,
  tags text[] default '{}',
  ordem integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Eventos
create table public.eventos (
  id uuid primary key default uuid_generate_v4(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  titulo text not null,
  descricao text,
  tipo tipo_evento default 'evento',
  data_inicio timestamp with time zone not null,
  data_fim timestamp with time zone,
  cor text default '#EF4444',
  banner_url text,
  link_externo text,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ============================================
-- ÍNDICES
-- ============================================
create index idx_estabelecimentos_slug on public.estabelecimentos(slug);
create index idx_perfis_estabelecimento on public.perfis(estabelecimento_id);
create index idx_categorias_estabelecimento on public.categorias(estabelecimento_id);
create index idx_categorias_ativo_ordem on public.categorias(estabelecimento_id, ativo, ordem);
create index idx_produtos_estabelecimento on public.produtos(estabelecimento_id);
create index idx_produtos_categoria on public.produtos(categoria_id);
create index idx_produtos_ativo_destaque on public.produtos(estabelecimento_id, ativo, destaque, ordem);
create index idx_eventos_estabelecimento on public.eventos(estabelecimento_id);
create index idx_eventos_ativo_data on public.eventos(estabelecimento_id, ativo, data_inicio, data_fim);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
alter table public.estabelecimentos enable row level security;
alter table public.perfis enable row level security;
alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.eventos enable row level security;

-- ============================================
-- FUNÇÕES AUXILIARES PARA RLS
-- ============================================

-- Função para obter o estabelecimento_id do usuário atual
create or replace function public.current_estabelecimento_id()
returns uuid language sql stable as $$
  select estabelecimento_id from public.perfis where id = auth.uid()
$$;

-- Função para verificar se o usuário é owner do estabelecimento
create or replace function public.is_owner(p_estabelecimento_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid()
    and estabelecimento_id = p_estabelecimento_id
    and papel = 'owner'
  )
$$;

-- Função para verificar se o usuário tem acesso ao estabelecimento (owner ou gerente)
create or replace function public.can_manage(p_estabelecimento_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid()
    and estabelecimento_id = p_estabelecimento_id
    and papel in ('owner', 'gerente')
  )
$$;

-- Função para verificar se o usuário pode editar (owner, gerente ou editor)
create or replace function public.can_edit(p_estabelecimento_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid()
    and estabelecimento_id = p_estabelecimento_id
    and papel in ('owner', 'gerente', 'editor')
  )
$$;

-- ============================================
-- POLÍTICAS RLS - ESTABELECIMENTOS
-- ============================================

-- Público pode ver estabelecimentos ativos (para vitrine)
create policy "Public read active estabelecimentos"
  on public.estabelecimentos for select
  using (ativo = true);

-- Usuários autenticados podem ver seu próprio estabelecimento
create policy "Users read own estabelecimento"
  on public.estabelecimentos for select
  using (id = current_estabelecimento_id());

-- Apenas owners podem criar estabelecimentos (feito via signup/admin)
create policy "Owners insert estabelecimentos"
  on public.estabelecimentos for insert
  with check (auth.uid() is not null);

-- Owners e gerentes podem atualizar
create policy "Managers update estabelecimentos"
  on public.estabelecimentos for update
  using (can_manage(id));

-- ============================================
-- POLÍTICAS RLS - PERFIS
-- ============================================

-- Usuários podem ver seu próprio perfil
create policy "Users read own perfil"
  on public.perfis for select
  using (id = auth.uid());

-- Admins do estabelecimento podem ver perfis do mesmo estabelecimento
create policy "Establishment members read perfis"
  on public.perfis for select
  using (
    estabelecimento_id = current_estabelecimento_id()
    and auth.uid() is not null
  );

-- Usuários podem atualizar seu próprio perfil
create policy "Users update own perfil"
  on public.perfis for update
  using (id = auth.uid());

-- Owners podem gerenciar perfis do seu estabelecimento
create policy "Owners manage perfis"
  on public.perfis for all
  using (
    estabelecimento_id = current_estabelecimento_id()
    and is_owner(estabelecimento_id)
  );

-- ============================================
-- POLÍTICAS RLS - CATEGORIAS
-- ============================================

-- Público pode ver categorias ativas de estabelecimentos ativos (vitrine)
create policy "Public read active categorias"
  on public.categorias for select
  using (
    ativo = true
    and estabelecimento_id in (
      select id from public.estabelecimentos where ativo = true
    )
  );

-- Membros do estabelecimento podem ver todas as categorias
create policy "Members read categorias"
  on public.categorias for select
  using (estabelecimento_id = current_estabelecimento_id());

-- Membros com permissão de edição podem criar
create policy "Editors insert categorias"
  on public.categorias for insert
  with check (can_edit(estabelecimento_id));

-- Membros com permissão de edição podem atualizar
create policy "Editors update categorias"
  on public.categorias for update
  using (can_edit(estabelecimento_id));

-- Apenas gerentes e owners podem deletar
create policy "Managers delete categorias"
  on public.categorias for delete
  using (can_manage(estabelecimento_id));

-- ============================================
-- POLÍTICAS RLS - PRODUTOS
-- ============================================

-- Público pode ver produtos ativos de categorias ativas de estabelecimentos ativos (vitrine)
create policy "Public read active produtos"
  on public.produtos for select
  using (
    ativo = true
    and disponibilidade = 'disponivel'
    and estabelecimento_id in (
      select id from public.estabelecimentos where ativo = true
    )
    and (
      categoria_id is null
      or categoria_id in (
        select id from public.categorias where ativo = true
      )
    )
  );

-- Membros do estabelecimento podem ver todos os produtos
create policy "Members read produtos"
  on public.produtos for select
  using (estabelecimento_id = current_estabelecimento_id());

-- Membros com permissão de edição podem criar
create policy "Editors insert produtos"
  on public.produtos for insert
  with check (can_edit(estabelecimento_id));

-- Membros com permissão de edição podem atualizar
create policy "Editors update produtos"
  on public.produtos for update
  using (can_edit(estabelecimento_id));

-- Apenas gerentes e owners podem deletar
create policy "Managers delete produtos"
  on public.produtos for delete
  using (can_manage(estabelecimento_id));

-- ============================================
-- POLÍTICAS RLS - EVENTOS
-- ============================================

-- Público pode ver eventos ativos e vigentes de estabelecimentos ativos (vitrine)
create policy "Public read active eventos"
  on public.eventos for select
  using (
    ativo = true
    and data_inicio <= now()
    and (data_fim is null or data_fim >= now())
    and estabelecimento_id in (
      select id from public.estabelecimentos where ativo = true
    )
  );

-- Membros do estabelecimento podem ver todos os eventos
create policy "Members read eventos"
  on public.eventos for select
  using (estabelecimento_id = current_estabelecimento_id());

-- Membros com permissão de edição podem criar
create policy "Editors insert eventos"
  on public.eventos for insert
  with check (can_edit(estabelecimento_id));

-- Membros com permissão de edição podem atualizar
create policy "Editors update eventos"
  on public.eventos for update
  using (can_edit(estabelecimento_id));

-- Apenas gerentes e owners podem deletar
create policy "Managers delete eventos"
  on public.eventos for delete
  using (can_manage(estabelecimento_id));

-- ============================================
-- TRIGGERS PARA updated_at
-- ============================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger handle_updated_at_estabelecimentos
  before update on public.estabelecimentos
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_perfis
  before update on public.perfis
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_categorias
  before update on public.categorias
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_produtos
  before update on public.produtos
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_eventos
  before update on public.eventos
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket para imagens do estabelecimento (logo, capa, galeria)
-- ATENÇÃO: Se o bucket já existe, execute o UPDATE abaixo separadamente no SQL Editor
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'estabelecimento',
  'estabelecimento',
  true,
  5242880, -- 5MB (apenas imagens)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) on conflict (id) do nothing;

-- ============================================
-- CORREÇÃO OBRIGATÓRIA: Atualizar bucket existente
-- Execute ESTE BLOCO no SQL Editor do Supabase se o bucket "estabelecimento" já existir
-- ============================================
update storage.buckets
set file_size_limit = 5242880,              -- 5MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'estabelecimento';

-- Verificar se a coluna galeria existe na tabela estabelecimentos
-- Se não existir, execute:
-- alter table public.estabelecimentos add column if not exists galeria jsonb default '[]'::jsonb;

-- Bucket para imagens de produtos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produtos',
  'produtos',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) on conflict (id) do nothing;

-- Bucket para banners de eventos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'eventos',
  'eventos',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) on conflict (id) do nothing;

-- ============================================
-- POLÍTICAS DE STORAGE
-- ============================================

-- Estabelecimento - público pode ler
create policy "Public read estabelecimento images"
  on storage.objects for select
  using (bucket_id = 'estabelecimento');

-- Membros do estabelecimento podem upload
create policy "Members upload estabelecimento images"
  on storage.objects for insert
  with check (
    bucket_id = 'estabelecimento'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Membros do estabelecimento podem atualizar
create policy "Members update estabelecimento images"
  on storage.objects for update
  using (
    bucket_id = 'estabelecimento'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Membros do estabelecimento podem deletar
create policy "Members delete estabelecimento images"
  on storage.objects for delete
  using (
    bucket_id = 'estabelecimento'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Produtos - público pode ler
create policy "Public read produtos images"
  on storage.objects for select
  using (bucket_id = 'produtos');

-- Membros do estabelecimento podem upload
create policy "Members upload produtos images"
  on storage.objects for insert
  with check (
    bucket_id = 'produtos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Membros do estabelecimento podem atualizar
create policy "Members update produtos images"
  on storage.objects for update
  using (
    bucket_id = 'produtos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Membros do estabelecimento podem deletar
create policy "Members delete produtos images"
  on storage.objects for delete
  using (
    bucket_id = 'produtos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Eventos - público pode ler
create policy "Public read eventos images"
  on storage.objects for select
  using (bucket_id = 'eventos');

-- Membros do estabelecimento podem upload
create policy "Members upload eventos images"
  on storage.objects for insert
  with check (
    bucket_id = 'eventos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Membros do estabelecimento podem atualizar
create policy "Members update eventos images"
  on storage.objects for update
  using (
    bucket_id = 'eventos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- Membros do estabelecimento podem deletar
create policy "Members delete eventos images"
  on storage.objects for delete
  using (
    bucket_id = 'eventos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = current_estabelecimento_id()::text
  );

-- ============================================
-- REALTIME
-- ============================================

-- Habilitar realtime para as tabelas principais
alter publication supabase_realtime add table public.categorias;
alter publication supabase_realtime add table public.produtos;
alter publication supabase_realtime add table public.eventos;
alter publication supabase_realtime add table public.estabelecimentos;

-- ============================================
-- DADOS INICIAIS (EXEMPLO)
-- ============================================

-- Inserir estabelecimento de exemplo (ajuste o slug conforme necessário)
-- insert into public.estabelecimentos (slug, nome, descricao, telefone, endereco, horario_funcionamento)
-- values (
--   'capixabas-bar',
--   'Capixaba''s Bar',
--   'O melhor bar da região com petiscos, cerveja gelada e música ao vivo!',
--   '(11) 99999-9999',
--   '{"rua": "Rua das Flores", "numero": "123", "bairro": "Centro", "cidade": "São Paulo", "estado": "SP", "cep": "01000-000"}',
--   '{"seg": {"abre": "17:00", "fecha": "02:00", "fechado": false}, "ter": {"abre": "17:00", "fecha": "02:00", "fechado": false}, "qua": {"abre": "17:00", "fecha": "02:00", "fechado": false}, "qui": {"abre": "17:00", "fecha": "02:00", "fechado": false}, "sex": {"abre": "16:00", "fecha": "03:00", "fechado": false}, "sab": {"abre": "16:00", "fecha": "03:00", "fechado": false}, "dom": {"abre": "16:00", "fecha": "00:00", "fechado": false}}'
-- );

-- ============================================
-- MIGRAÇÃO: Adicionar coluna galeria à tabela estabelecimentos
-- Execute este bloco no SQL Editor do Supabase se a coluna não existir
-- ============================================
alter table public.estabelecimentos
add column if not exists galeria jsonb default '[]'::jsonb;

comment on column public.estabelecimentos.galeria is 'Galeria de fotos e vídeos do estabelecimento (array de objetos GalleryItem)';

-- ============================================
-- COMENTÁRIOS
-- ============================================
comment on table public.estabelecimentos is 'Estabelecimentos (bares, restaurantes, etc.)';
comment on table public.perfis is 'Perfis de usuários vinculados a estabelecimentos';
comment on table public.categorias is 'Categorias de produtos do cardápio';
comment on table public.produtos is 'Produtos do cardápio (pratos, lanches, bebidas)';
comment on table public.eventos is 'Eventos, promoções e shows do estabelecimento';