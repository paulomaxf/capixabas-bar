-- ============================================
-- CAPIXABA'S BAR - DADOS COMPLETOS PARA VITRINE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR BUCKETS DE STORAGE (se não existirem)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('estabelecimento', 'estabelecimento', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('produtos', 'produtos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('eventos', 'eventos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- 2. OBTER ID DO ESTABELECIMENTO
do $$
declare
  v_estab_id uuid;
begin
  select id into v_estab_id
  from public.estabelecimentos
  where slug = 'capixabas-bar' and ativo = true;

  if v_estab_id is null then
    raise notice 'Estabelecimento capixabas-bar não encontrado!';
    return;
  end if;

  raise notice 'Estabelecimento ID: %', v_estab_id;

  -- 3. CRIAR CATEGORIAS
  insert into public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
  values
    (v_estab_id, 'Entradas & Petiscos', '🍽️', '#F97316', 1, true),
    (v_estab_id, 'Pratos Principais', '🍛', '#EF4444', 2, true),
    (v_estab_id, 'Lanches & Burgers', '🍔', '#3B82F6', 3, true),
    (v_estab_id, 'Porções para Compartilhar', '🍗', '#8B5CF6', 4, true),
    (v_estab_id, 'Bebidas & Drinks', '🍺', '#06B6D4', 5, true),
    (v_estab_id, 'Sobremesas', '🍰', '#EC4899', 6, true)
  on conflict (estabelecimento_id, nome) do update set
    icone = excluded.icone,
    cor = excluded.cor,
    ordem = excluded.ordem,
    ativo = excluded.ativo,
    updated_at = timezone('utc'::text, now());

  -- 4. CRIAR PRODUTOS
  -- Usar URLs públicas das imagens (servidas pelo Vite/Vercel)
  -- Em produção (Vercel): https://seu-dominio.vercel.app/images/capixabas-bar/...
  -- Em desenvolvimento: http://localhost:3000/images/capixabas-bar/...

  -- Buscar IDs das categorias
  declare
    v_cat_entradas uuid;
    v_cat_pratos uuid;
    v_cat_lanches uuid;
    v_cat_porcoes uuid;
    v_cat_bebidas uuid;
    v_cat_sobremesas uuid;
  begin
    select id into v_cat_entradas from public.categorias where estabelecimento_id = v_estab_id and nome = 'Entradas & Petiscos';
    select id into v_cat_pratos from public.categorias where estabelecimento_id = v_estab_id and nome = 'Pratos Principais';
    select id into v_cat_lanches from public.categorias where estabelecimento_id = v_estab_id and nome = 'Lanches & Burgers';
    select id into v_cat_porcoes from public.categorias where estabelecimento_id = v_estab_id and nome = 'Porções para Compartilhar';
    select id into v_cat_bebidas from public.categorias where estabelecimento_id = v_estab_id and nome = 'Bebidas & Drinks';
    select id into v_cat_sobremesas from public.categorias where estabelecimento_id = v_estab_id and nome = 'Sobremesas';

    -- Inserir produtos
    insert into public.produtos (estabelecimento_id, categoria_id, nome, descricao, valor, unidade, imagem_url, disponibilidade, destaque, ativo, tags, ordem)
    values
      -- Entradas & Petiscos
      (v_estab_id, v_cat_entradas, 'Bolinho de Bacalhau', 'Bolinhos crocantes de bacalhau desfiado com batata e salsa', 28.90, 'UN', '/images/capixabas-bar/menu-01.webp', 'disponivel', true, true, ARRAY['tradicional', 'frito'], 1),
      (v_estab_id, v_cat_entradas, 'Pastel de Carne', 'Pastel artesanal recheado com carne moída temperada e azeitonas', 12.90, 'UN', '/images/capixabas-bar/menu-02.webp', 'disponivel', false, true, ARRAY['frito', 'rapido'], 2),
      (v_estab_id, v_cat_entradas, 'Pastel de Queijo', 'Pastel artesanal com muçarela derretida e orégano', 10.90, 'UN', '/images/capixabas-bar/menu-03.webp', 'disponivel', false, true, ARRAY['vegetariano', 'frito'], 3),
      (v_estab_id, v_cat_entradas, 'Caldo Verde', 'Sopa tradicional portuguesa com couve, batata e chouriço', 18.90, 'UN', '/images/capixabas-bar/menu-04.webp', 'disponivel', true, true, ARRAY['sopa', 'quente'], 4),

      -- Pratos Principais
      (v_estab_id, v_cat_pratos, 'Bacalhau à Brás', 'Bacalhau desfiado com batata palha, ovos, cebola e azeitonas pretas', 58.90, 'UN', '/images/capixabas-bar/menu-05.webp', 'disponivel', true, true, ARRAY['bacalhau', 'tradicional'], 1),
      (v_estab_id, v_cat_pratos, 'Feijoada Completa', 'Feijão preto com carnes defumadas, arroz, farofa, couve e laranja', 42.90, 'UN', '/images/capixabas-bar/menu-06.webp', 'disponivel', true, true, ARRAY['brasileiro', 'completo'], 2),
      (v_estab_id, v_cat_pratos, 'Moqueca Capixaba', 'Peixe branco cozido no azeite de dendê com tomate, cebola, pimentão e coentro', 65.90, 'UN', '/images/capixabas-bar/menu-07.webp', 'disponivel', true, true, ARRAY['peixe', 'capixaba', 'especialidade'], 3),
      (v_estab_id, v_cat_pratos, 'Frango à Passarinho', 'Frango frito em pedaços pequenos com alho, limão e batatas rústicas', 38.90, 'UN', '/images/capixabas-bar/menu-08.webp', 'disponivel', false, true, ARRAY['frango', 'frito'], 4),

      -- Lanches & Burgers
      (v_estab_id, v_cat_lanches, 'X-Bacon Capixaba', 'Hambúrguer artesanal 180g, bacon crocante, queijo cheddar, alface, tomate e molho especial', 32.90, 'UN', '/images/capixabas-bar/menu-09.webp', 'disponivel', true, true, ARRAY['hamburguer', 'bacon', 'artesanal'], 1),
      (v_estab_id, v_cat_lanches, 'X-Salada', 'Hambúrguer artesanal, queijo, alface, tomate, cebola e molho da casa', 26.90, 'UN', '/images/capixabas-bar/menu-10.jpg', 'disponivel', false, true, ARRAY['hamburguer', 'classico'], 2),

      -- Porções para Compartilhar
      (v_estab_id, v_cat_porcoes, 'Porção de Batata Frita', 'Batatas fritas crocantes com alecrim e alho', 22.90, 'UN', '/images/capixabas-bar/gallery-01.jpg', 'disponivel', false, true, ARRAY['batata', 'compartilhar', 'vegetariano'], 1),
      (v_estab_id, v_cat_porcoes, 'Porção de Mandioca Frita', 'Mandioca frita na hora com molho de alho', 24.90, 'UN', '/images/capixabas-bar/gallery-02.jpg', 'disponivel', false, true, ARRAY['mandioca', 'compartilhar'], 2),
      (v_estab_id, v_cat_porcoes, 'Tábua de Frios', 'Seleção de queijos, embutidos, azeitonas, pães e geleias', 54.90, 'UN', '/images/capixabas-bar/gallery-03.jpg', 'disponivel', true, true, ARRAY['frios', 'queijos', 'compartilhar'], 3),

      -- Bebidas & Drinks
      (v_estab_id, v_cat_bebidas, 'Chopp Brahma 300ml', 'Chopp bem gelado, cremoso e refrescante', 8.90, 'UN', '/images/capixabas-bar/gallery-04.jpg', 'disponivel', false, true, ARRAY['chopp', 'gelado', 'alcoolico'], 1),
      (v_estab_id, v_cat_bebidas, 'Caipirinha de Limão', 'Cachaça premium, limão, açúcar e muito gelo', 18.90, 'UN', '/images/capixabas-bar/gallery-05.jpg', 'disponivel', true, true, ARRAY['caipirinha', 'drink', 'classico'], 2),
      (v_estab_id, v_cat_bebidas, 'Caipiroska de Frutas Vermelhas', 'Vodka, morango, framboesa, limão e açúcar', 22.90, 'UN', '/images/capixabas-bar/gallery-06.jpg', 'disponivel', false, true, ARRAY['caipiroska', 'frutas', 'drink'], 3),
      (v_estab_id, v_cat_bebidas, 'Refrigerante Lata 350ml', 'Coca-Cola, Guaraná, Sprite ou Fanta', 6.90, 'UN', '/images/capixabas-bar/gallery-07.jpg', 'disponivel', false, true, ARRAY['refrigerante', 'sem-alcool'], 4),
      (v_estab_id, v_cat_bebidas, 'Suco Natural', 'Laranja, Maracujá, Abacaxi ou Melancia', 9.90, 'UN', '/images/capixabas-bar/gallery-08.jpg', 'disponivel', false, true, ARRAY['suco', 'natural', 'sem-alcool'], 5),

      -- Sobremesas
      (v_estab_id, v_cat_sobremesas, 'Pudim de Leite Condensado', 'Pudim caseiro com calda de caramelo', 12.90, 'UN', '/images/capixabas-bar/gallery-09.jpg', 'disponivel', true, true, ARRAY['pudim', 'caseiro', 'doce'], 1),
      (v_estab_id, v_cat_sobremesas, 'Petit Gateau', 'Bolo de chocolate com centro cremoso, sorvete de baunilha e calda', 18.90, 'UN', '/images/capixabas-bar/gallery-10.jpg', 'disponivel', true, true, ARRAY['chocolate', 'sorvete', 'quente-frio'], 2)
    on conflict (estabelecimento_id, nome) do update set
      categoria_id = excluded.categoria_id,
      descricao = excluded.descricao,
      valor = excluded.valor,
      imagem_url = excluded.imagem_url,
      disponibilidade = excluded.disponibilidade,
      destaque = excluded.destaque,
      ativo = excluded.ativo,
      tags = excluded.tags,
      ordem = excluded.ordem,
      updated_at = timezone('utc'::text, now());

    -- 5. CRIAR EVENTOS
    insert into public.eventos (estabelecimento_id, titulo, descricao, tipo, data_inicio, data_fim, cor, banner_url, ativo)
    values
      (v_estab_id, 'Quinta do Chopp em Dobro', 'Todas as quintas-feiras: peça 1 chopp e ganhe o 2º! Válido das 17h às 22h.', 'promocao',
        date_trunc('week', now()) + interval '4 days' + interval '17 hours', null, '#F97316', '/images/capixabas-bar/hero-01.jpg', true),
      (v_estab_id, 'Sexta com Música Ao Vivo', 'Toda sexta-feira a partir das 20h: show acústico com o melhor do MPB e rock nacional.', 'show',
        date_trunc('week', now()) + interval '5 days' + interval '20 hours', null, '#EF4444', '/images/capixabas-bar/hero-02.jpg', true),
      (v_estab_id, 'Sábado de Feijoada', 'Feijoada completa servida no almoço de sábado (11h às 15h). Reserve sua mesa!', 'evento',
        date_trunc('week', now()) + interval '6 days' + interval '11 hours', null, '#8B5CF6', '/images/capixabas-bar/hero-03.jpg', true),
      (v_estab_id, 'Happy Hour Estendido', 'De terça a quinta, das 17h às 20h: 50% off em todos os drinks e petiscos selecionados.', 'promocao',
        now(), null, '#06B6D4', '/images/capixabas-bar/hero-04.webp', true),
      (v_estab_id, 'Festival de Bacalhau', 'Durante todo o mês: pratos especiais com bacalhau a preços promocionais. Confira o cardápio!', 'evento',
        date_trunc('month', now()), date_trunc('month', now()) + interval '1 month' - interval '1 second', '#EC4899', '/images/capixabas-bar/hero-05.webp', true)
    on conflict do nothing;

    -- 6. ATUALIZAR ESTABELECIMENTO COM LOGO, CAPA E INFO COMPLETA
    update public.estabelecimentos
    set
      logo_url = '/images/capixabas-bar/logo.png',
      capa_url = '/images/capixabas-bar/hero-05.webp',
      descricao = 'O melhor bar da região com petiscos, cerveja gelada, música ao vivo e a famosa Moqueca Capixaba!',
      telefone = '(27) 99999-9999',
      endereco = '{"rua": "Av. Beira Mar", "numero": "1500", "complemento": "Loja 12", "bairro": "Praia do Canto", "cidade": "Vitória", "estado": "ES", "cep": "29055-000"}'::jsonb,
      horario_funcionamento = '{"seg": {"abre": "17:00", "fecha": "01:00", "fechado": false}, "ter": {"abre": "17:00", "fecha": "01:00", "fechado": false}, "qua": {"abre": "17:00", "fecha": "01:00", "fechado": false}, "qui": {"abre": "17:00", "fecha": "02:00", "fechado": false}, "sex": {"abre": "16:00", "fecha": "03:00", "fechado": false}, "sab": {"abre": "11:00", "fecha": "03:00", "fechado": false}, "dom": {"abre": "11:00", "fecha": "00:00", "fechado": false}}'::jsonb,
      updated_at = timezone('utc'::text, now())
    where id = v_estab_id;

    raise notice '✅ Dados do Capixaba''s Bar inseridos com sucesso!';
    raise notice '📋 Categorias: 6 | 🍽️ Produtos: 20 | 🎪 Eventos: 5';
    raise notice '🖼️ Imagens referenciadas via URLs públicas (/images/capixabas-bar/...)';
  end;
end $$;

-- 7. VERIFICAR DADOS INSERIDOS
select 'Categorias' as tabela, count(*) as total from public.categorias where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
union all
select 'Produtos', count(*) from public.produtos where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
union all
select 'Eventos', count(*) from public.eventos where estabelecimento_id = (select id from public.estabelecimentos where slug = 'capixabas-bar')
union all
select 'Estabelecimento', count(*) from public.estabelecimentos where slug = 'capixabas-bar';