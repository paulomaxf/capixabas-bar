-- ============================================
-- ATUALIZAÇÕES VITRINE CAPIXABA'S BAR
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. ATUALIZAR ESTABELECIMENTO: telefone + capa (fachada) + horários
update public.estabelecimentos
set
  telefone = '(43) 99938-9549',
  capa_url = '/images/capixabas-bar/hero-01.jpg',  -- Fachada como capa principal
  logo_url = '/images/capixabas-bar/logo.png',
  descricao = 'O melhor bar da região com petiscos, cerveja gelada, música ao vivo e a famosa Moqueca Capixaba!',
  endereco = '{"rua": "Av. Beira Mar", "numero": "1500", "complemento": "Loja 12", "bairro": "Praia do Canto", "cidade": "Vitória", "estado": "ES", "cep": "29055-000"}'::jsonb,
  horario_funcionamento = '{"seg": {"abre": "17:00", "fecha": "01:00", "fechado": false}, "ter": {"abre": "17:00", "fecha": "01:00", "fechado": false}, "qua": {"abre": "17:00", "fecha": "01:00", "fechado": false}, "qui": {"abre": "17:00", "fecha": "02:00", "fechado": false}, "sex": {"abre": "16:00", "fecha": "03:00", "fechado": false}, "sab": {"abre": "11:00", "fecha": "03:00", "fechado": false}, "dom": {"abre": "11:00", "fecha": "00:00", "fechado": false}}'::jsonb,
  updated_at = timezone('utc'::text, now())
where slug = 'capixabas-bar';

-- 2. ATUALIZAR EVENTOS: usar fotos DIFERENTES da capa (hero-02, hero-03, hero-04, hero-05, hero-06)
-- Evento: Quinta do Chopp em Dobro
update public.eventos
set banner_url = '/images/capixabas-bar/hero-02.jpg',
    data_inicio = date_trunc('week', now()) + interval '4 days' + interval '17 hours'
where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
  and titulo = 'Quinta do Chopp em Dobro';

-- Evento: Sexta com Música Ao Vivo
update public.eventos
set banner_url = '/images/capixabas-bar/hero-03.jpg',
    data_inicio = date_trunc('week', now()) + interval '5 days' + interval '20 hours'
where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
  and titulo = 'Sexta com Música Ao Vivo';

-- Evento: Sábado de Feijoada
update public.eventos
set banner_url = '/images/capixabas-bar/hero-04.jpg',
    data_inicio = date_trunc('week', now()) + interval '6 days' + interval '11 hours'
where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
  and titulo = 'Sábado de Feijoada';

-- Evento: Happy Hour Estendido
update public.eventos
set banner_url = '/images/capixabas-bar/hero-05.webp'
where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
  and titulo = 'Happy Hour Estendido';

-- Evento: Festival de Bacalhau
update public.eventos
set banner_url = '/images/capixabas-bar/hero-06.webp'
where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
  and titulo = 'Festival de Bacalhau';

-- 3. ADICIONAR CAMPO 'artista' E 'whatsapp_reserva' NOS EVENTOS (se não existirem)
-- Nota: Se as colunas não existirem, execute este ALTER TABLE primeiro:
-- alter table public.eventos add column if not exists artista text;
-- alter table public.eventos add column if not exists whatsapp_reserva text;

-- Atualizar evento "Sexta com Música Ao Vivo" com artista e WhatsApp de reserva
update public.eventos
set artista = 'Banda Acústica Raízes + Convidados',
    whatsapp_reserva = '5543999389549',
    descricao = 'Toda sexta-feira a partir das 20h: show acústico com a Banda Raízes tocando o melhor do MPB, rock nacional e sertanejo. Reserve sua mesa!'
where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
  and titulo = 'Sexta com Música Ao Vivo';

-- Atualizar evento "Sábado de Feijoada" com artista
update public.eventos
set artista = 'Roda de Samba do Bar',
    whatsapp_reserva = '5543999389549',
    descricao = 'Feijoada completa no almoço de sábado (11h às 15h) com roda de samba ao vivo. Reserve sua mesa!'
where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
  and titulo = 'Sábado de Feijoada';

-- 4. VERIFICAR
select 'Estabelecimento' as tabela, telefone, capa_url from public.estabelecimentos where slug = 'capixabas-bar'
union all
select 'Eventos', count(*), string_agg(titulo || ' (' || banner_url || ')', '; ')
from public.eventos where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar');