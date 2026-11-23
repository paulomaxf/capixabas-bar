-- ============================================
-- FIX EVENTOS PARA VITRINE
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA EVENTOS
-- ------------------------------------------
-- O TypeScript espera: artista, whatsapp_reserva, recorrencia
-- Estas colunas são usadas no formulário de admin mas não existem no banco

alter table public.eventos
add column if not exists artista text;

alter table public.eventos
add column if not exists whatsapp_reserva text;

alter table public.eventos
add column if not exists recorrencia jsonb default null;

-- Comentários para documentação
comment on column public.eventos.artista is 'Nome do artista/banda para shows e música ao vivo';
comment on column public.eventos.whatsapp_reserva is 'WhatsApp para reservas (apenas números, ex: 5543999389549)';
comment on column public.eventos.recorrencia is 'Configuração de recorrência do evento (JSON)';

-- 2. ATUALIZAR ENUM TIPO_EVENTO PARA INCLUIR TODOS OS TIPOS DO TYPESCRIPT
-- ------------------------------------------
-- O TypeScript tem: 'show' | 'promocao' | 'evento' | 'fechado' | 'reservado' | 'outro'
-- O banco só tem: 'evento', 'promocao', 'show'
-- Adicionar os tipos faltantes (opcional - manter compatibilidade)

do $$
begin
    -- Adicionar 'fechado' se não existir
    if not exists (select 1 from pg_enum where enumlabel = 'fechado' and enumtypid = 'tipo_evento'::regtype) then
        alter type tipo_evento add value 'fechado';
    end if;

    -- Adicionar 'reservado' se não existir
    if not exists (select 1 from pg_enum where enumlabel = 'reservado' and enumtypid = 'tipo_evento'::regtype) then
        alter type tipo_evento add value 'reservado';
    end if;

    -- Adicionar 'outro' se não existir
    if not exists (select 1 from pg_enum where enumlabel = 'outro' and enumtypid = 'tipo_evento'::regtype) then
        alter type tipo_evento add value 'outro';
    end if;
end $$;

-- 3. CORRIGIR POLÍTICA RLS PARA VITRINE PÚBLICA
-- ------------------------------------------
-- PROBLEMA: A política atual exige data_inicio <= now()
-- Mas useEventosVigentes NÃO filtra por data_inicio <= now()
-- Isso causa eventos futuros serem retornados pelo hook mas bloqueados pelo RLS

-- Remover política antiga
drop policy if exists "Public read active eventos" on public.eventos;

-- Criar política corrigida - permite eventos que:
-- 1. Estão ativos
-- 2. Começaram OU começam no futuro (data_inicio pode ser futura)
-- 3. Não terminaram ainda (data_fim é null ou >= now)
-- 4. Do estabelecimento ativo
create policy "Public read active eventos"
  on public.eventos for select
  using (
    ativo = true
    and (data_fim is null or data_fim >= now())
    and estabelecimento_id in (
      select id from public.estabelecimentos where ativo = true
    )
  );

-- 4. VERIFICAR SE AS COLUNAS FORAM ADICIONADAS
-- ------------------------------------------
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'eventos'
order by ordinal_position;

-- 5. VERIFICAR POLÍTICA RLS
-- ------------------------------------------
select policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'eventos'
and policyname = 'Public read active eventos';

-- 6. TESTE: INSERIR EVENTO DE TESTE (opcional)
-- ------------------------------------------
-- Descomente e ajuste o estabelecimento_id para testar
/*
insert into public.eventos (
  estabelecimento_id,
  titulo,
  descricao,
  tipo,
  data_inicio,
  data_fim,
  cor,
  ativo,
  artista,
  whatsapp_reserva
) values (
  'SEU_ESTABELECIMENTO_ID_AQUI',
  'Evento Teste Vitrine',
  'Evento de teste para verificar se aparece na vitrine',
  'evento',
  now() + interval '1 hour',  -- Começa daqui 1 hora
  now() + interval '3 hours', -- Termina daqui 3 horas
  '#EF4444',
  true,
  'Artista Teste',
  '5543999389549'
);
*/

-- 7. TESTE: CONSULTAR EVENTOS VIGENTES (como faria a vitrine)
-- ------------------------------------------
-- Substitua SEU_ESTABELECIMENTO_ID_AQUI pelo ID real
/*
select * from public.eventos
where estabelecimento_id = 'SEU_ESTABELECIMENTO_ID_AQUI'
  and ativo = true
  and (data_fim is null or data_fim >= now())
order by data_inicio;
*/