-- ============================================
-- SEED CARDÁPIO - CAPIXABA'S BAR
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. ENCONTRAR O ESTABELECIMENTO
DO $$
DECLARE
    v_estabelecimento_id uuid;
    v_cat_porcoes_id uuid;
    v_cat_bebidas_id uuid;
    v_cat_lanches_id uuid;
    v_cat_drinks_id uuid;
    v_cat_pasteis_id uuid;
BEGIN
    -- Buscar estabelecimento pelo slug
    SELECT id INTO v_estabelecimento_id
    FROM public.estabelecimentos
    WHERE slug = 'capixabas-bar';

    IF v_estabelecimento_id IS NULL THEN
        RAISE EXCEPTION 'Estabelecimento com slug "capixabas-bar" não encontrado';
    END IF;

    RAISE NOTICE 'Estabelecimento encontrado: %', v_estabelecimento_id;

    -- ============================================
    -- 2. REMOVER PRODUTOS E CATEGORIAS ANTIGAS (limpeza total)
    -- ============================================
    DELETE FROM public.produtos
    WHERE estabelecimento_id = v_estabelecimento_id;

    -- Remover categorias antigas que não estão na nova lista de 5
    DELETE FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id
      AND nome NOT IN ('Porções', 'Bebidas', 'Lanches', 'Drinks', 'Pasteis');

    RAISE NOTICE 'Produtos e categorias antigas removidos';

    -- ============================================
    -- 3. CRIAR/ATUALIZAR CATEGORIAS (5 categorias) - UPSERT GARANTIDO
    -- ============================================
    -- Usa INSERT ... ON CONFLICT (estabelecimento_id, nome) DO UPDATE
    -- para garantir que a categoria exista SEMPRE com ativo=true e ID válido

    -- Categoria 1: Porções
    INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
    VALUES (v_estabelecimento_id, 'Porções', '🍟', '#EF4444', 1, true)
    ON CONFLICT (estabelecimento_id, nome) DO UPDATE SET
        icone = EXCLUDED.icone,
        cor = EXCLUDED.cor,
        ordem = EXCLUDED.ordem,
        ativo = true,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_cat_porcoes_id;

    RAISE NOTICE 'Categoria Porções: %', v_cat_porcoes_id;

    -- Categoria 2: Bebidas (sem álcool)
    INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
    VALUES (v_estabelecimento_id, 'Bebidas', '🥤', '#3B82F6', 2, true)
    ON CONFLICT (estabelecimento_id, nome) DO UPDATE SET
        icone = EXCLUDED.icone,
        cor = EXCLUDED.cor,
        ordem = EXCLUDED.ordem,
        ativo = true,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_cat_bebidas_id;

    RAISE NOTICE 'Categoria Bebidas: %', v_cat_bebidas_id;

    -- Categoria 3: Lanches (hambúrgueres e sanduíches)
    INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
    VALUES (v_estabelecimento_id, 'Lanches', '🍔', '#F97316', 3, true)
    ON CONFLICT (estabelecimento_id, nome) DO UPDATE SET
        icone = EXCLUDED.icone,
        cor = EXCLUDED.cor,
        ordem = EXCLUDED.ordem,
        ativo = true,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_cat_lanches_id;

    RAISE NOTICE 'Categoria Lanches: %', v_cat_lanches_id;

    -- Categoria 4: Drinks (com álcool)
    INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
    VALUES (v_estabelecimento_id, 'Drinks', '🍹', '#EC4899', 4, true)
    ON CONFLICT (estabelecimento_id, nome) DO UPDATE SET
        icone = EXCLUDED.icone,
        cor = EXCLUDED.cor,
        ordem = EXCLUDED.ordem,
        ativo = true,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_cat_drinks_id;

    RAISE NOTICE 'Categoria Drinks: %', v_cat_drinks_id;

    -- Categoria 5: Pasteis
    INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
    VALUES (v_estabelecimento_id, 'Pasteis', '🥟', '#8B5CF6', 5, true)
    ON CONFLICT (estabelecimento_id, nome) DO UPDATE SET
        icone = EXCLUDED.icone,
        cor = EXCLUDED.cor,
        ordem = EXCLUDED.ordem,
        ativo = true,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_cat_pasteis_id;

    RAISE NOTICE 'Categoria Pasteis: %', v_cat_pasteis_id;

    -- Garantia extra: se por algum motivo o RETURNING falhar, busca o ID
    IF v_cat_porcoes_id IS NULL THEN
        SELECT id INTO v_cat_porcoes_id FROM public.categorias WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Porções';
    END IF;
    IF v_cat_bebidas_id IS NULL THEN
        SELECT id INTO v_cat_bebidas_id FROM public.categorias WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Bebidas';
    END IF;
    IF v_cat_lanches_id IS NULL THEN
        SELECT id INTO v_cat_lanches_id FROM public.categorias WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Lanches';
    END IF;
    IF v_cat_drinks_id IS NULL THEN
        SELECT id INTO v_cat_drinks_id FROM public.categorias WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Drinks';
    END IF;
    IF v_cat_pasteis_id IS NULL THEN
        SELECT id INTO v_cat_pasteis_id FROM public.categorias WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Pasteis';
    END IF;

    -- Validação final: todas as categorias devem ter ID válido
    IF v_cat_porcoes_id IS NULL OR v_cat_bebidas_id IS NULL OR v_cat_lanches_id IS NULL OR v_cat_drinks_id IS NULL OR v_cat_pasteis_id IS NULL THEN
        RAISE EXCEPTION 'Falha ao obter IDs das categorias - verifique constraints unique (estabelecimento_id, nome)';
    END IF;

    RAISE NOTICE '✅ Todas as 5 categorias garantidas com IDs válidos e ativo=true';

    -- ============================================
    -- 4. INSERIR PRODUTOS - PORÇÕES
    -- ============================================

    -- 1. Batata Frita Tradicional
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_id,
        'Batata Frita Tradicional',
        'Batata frita crocante por fora, macia por dentro, salgada na hora',
        24.90, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', false, true, true, ARRAY['batata', 'tradicional', 'vegetariano'], 0
    );

    -- 2. Batata Frita com Bacon e Cheddar
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_id,
        'Batata Frita com Bacon e Cheddar',
        'Batata frita coberta com bacon crocante e cheddar cremoso derretido',
        34.90, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', true, true, true, ARRAY['batata', 'bacon', 'cheddar', 'mais-pedido'], 1
    );

    -- 3. Mandioca Frita
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_id,
        'Mandioca Frita',
        'Mandioca frita na hora, crocante por fora, macia por dentro, com molho de alho',
        26.90, 'UN',
        '/images/capixabas-bar/menu-03.webp',
        'disponivel', false, true, true, ARRAY['mandioca', 'vegetariano'], 2
    );

    -- 4. Onion Rings
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_id,
        'Onion Rings',
        'Anéis de cebola empanados e fritos, crocantes, com molho barbecue',
        28.90, 'UN',
        '/images/capixabas-bar/menu-04.webp',
        'disponivel', false, true, true, ARRAY['cebola', 'emapanado', 'vegetariano'], 3
    );

    -- 5. Frango à Passarinho
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_id,
        'Frango à Passarinho',
        'Frango frito em pedaços pequenos com alho, limão e batatas rústicas',
        38.90, 'UN',
        '/images/capixabas-bar/menu-05.webp',
        'disponivel', true, true, true, ARRAY['frango', 'frito', 'mais-pedido'], 4
    );

    -- 6. Bolinho de Bacalhau (6 unid.)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_id,
        'Bolinho de Bacalhau (6 unid.)',
        'Bolinhos crocantes de bacalhau desfiado com batata, salsa e azeitonas',
        32.90, 'UN',
        '/images/capixabas-bar/menu-06.webp',
        'disponivel', false, true, true, ARRAY['bacalhau', 'tradicional', 'petisco'], 5
    );

    -- ============================================
    -- 5. INSERIR PRODUTOS - BEBIDAS (sem álcool)
    -- ============================================

    -- 1. Chopp Brahma 300ml
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_bebidas_id,
        'Chopp Brahma 300ml',
        'Chopp bem gelado, cremoso e refrescante',
        8.90, 'UN',
        '/images/capixabas-bar/gallery-06.jpg',
        'disponivel', false, true, true, ARRAY['chopp', 'cerveja', 'gelado'], 0
    );

    -- 2. Refrigerante Lata 350ml
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_bebidas_id,
        'Refrigerante Lata 350ml',
        'Coca-Cola, Guaraná Antarctica, Sprite ou Fanta Laranja',
        6.90, 'UN',
        '/images/capixabas-bar/gallery-07.jpg',
        'disponivel', false, true, true, ARRAY['refrigerante', 'sem-alcool'], 1
    );

    -- 3. Suco Natural
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_bebidas_id,
        'Suco Natural',
        'Laranja, Maracujá, Abacaxi, Melancia ou Morango',
        9.90, 'UN',
        '/images/capixabas-bar/gallery-08.jpg',
        'disponivel', false, true, true, ARRAY['suco', 'natural', 'sem-alcool'], 2
    );

    -- 4. Água Mineral 500ml
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_bebidas_id,
        'Água Mineral 500ml',
        'Água mineral sem gás gelada',
        4.90, 'UN',
        '/images/capixabas-bar/gallery-09.jpg',
        'disponivel', false, true, true, ARRAY['agua', 'sem-alcool'], 3
    );

    -- 5. Água com Gás 500ml
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_bebidas_id,
        'Água com Gás 500ml',
        'Água mineral com gás gelada',
        5.90, 'UN',
        '/images/capixabas-bar/gallery-10.jpg',
        'disponivel', false, true, true, ARRAY['agua', 'com-gas', 'sem-alcool'], 4
    );

    -- ============================================
    -- 6. INSERIR PRODUTOS - LANCHES (hambúrgueres)
    -- ============================================

    -- 1. X-Burguer
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'X-Burguer',
        'Hambúrguer artesanal 150g, queijo mussarela, alface, tomate e maionese da casa no pão brioche',
        26.90, 'UN',
        '/images/capixabas-bar/menu-07.webp',
        'disponivel', false, true, true, ARRAY['hamburguer', 'classico'], 0
    );

    -- 2. X-Bacon
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'X-Bacon',
        'Hambúrguer artesanal 150g, bacon crocante, queijo cheddar, alface, tomate e maionese especial no pão brioche',
        32.90, 'UN',
        '/images/capixabas-bar/menu-08.webp',
        'disponivel', true, true, true, ARRAY['hamburguer', 'bacon', 'cheddar', 'mais-pedido'], 1
    );

    -- 3. X-Salada
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'X-Salada',
        'Hambúrguer artesanal 150g, queijo mussarela, alface, tomate, cebola roxa, picles e maionese da casa no pão brioche',
        28.90, 'UN',
        '/images/capixabas-bar/menu-09.webp',
        'disponivel', false, true, true, ARRAY['hamburguer', 'salada', 'completo'], 2
    );

    -- 4. X-Tudo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'X-Tudo',
        'Hambúrguer artesanal 150g, bacon, queijo cheddar, ovo, alface, tomate, cebola, picles e maionese especial no pão brioche',
        36.90, 'UN',
        '/images/capixabas-bar/menu-10.jpg',
        'disponivel', true, true, true, ARRAY['hamburguer', 'tudo', 'completo', 'mais-pedido'], 3
    );

    -- 5. X-Frango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'X-Frango',
        'Filé de frango grelhado, queijo mussarela, alface, tomate, maionese de alho no pão brioche',
        28.90, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', false, true, true, ARRAY['frango', 'grelhado'], 4
    );

    -- 6. X-Calabresa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'X-Calabresa',
        'Hambúrguer artesanal 150g, calabresa grelhada, queijo mussarela, cebola caramelizada, mostarda e maionese no pão brioche',
        31.90, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', false, true, true, ARRAY['hamburguer', 'calabresa', 'cebola'], 5
    );

    -- 7. Adicional: Bacon
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'Adicional: Bacon',
        'Bacon crocante em tiras para adicionar no lanche',
        5.00, 'UN',
        '/images/capixabas-bar/gallery-09.jpg',
        'disponivel', false, true, true, ARRAY['adicional', 'bacon'], 6
    );

    -- 8. Adicional: Queijo Extra
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'Adicional: Queijo Extra',
        'Porção extra de queijo mussarela derretido',
        4.00, 'UN',
        '/images/capixabas-bar/gallery-10.jpg',
        'disponivel', false, true, true, ARRAY['adicional', 'queijo'], 7
    );

    -- 9. Adicional: Ovo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_lanches_id,
        'Adicional: Ovo',
        'Ovo frito para adicionar no lanche',
        3.00, 'UN',
        '/images/capixabas-bar/gallery-11.jpg',
        'disponivel', false, true, true, ARRAY['adicional', 'ovo'], 8
    );

    -- ============================================
    -- 7. INSERIR PRODUTOS - DRINKS (com álcool)
    -- ============================================

    -- 1. Caipirinha de Limão
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Caipirinha de Limão',
        'Cachaça premium, limão tahiti, açúcar e muito gelo',
        18.90, 'UN',
        '/images/capixabas-bar/gallery-01.jpg',
        'disponivel', true, true, true, ARRAY['caipirinha', 'classico', 'mais-pedido'], 0
    );

    -- 2. Caipirinha de Maracujá
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Caipirinha de Maracujá',
        'Cachaça premium, maracujá fresco, açúcar e gelo',
        20.90, 'UN',
        '/images/capixabas-bar/gallery-02.jpg',
        'disponivel', false, true, true, ARRAY['caipirinha', 'frutas'], 1
    );

    -- 3. Caipiroska de Frutas Vermelhas
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Caipiroska de Frutas Vermelhas',
        'Vodka, morango, framboesa, amora, limão e açúcar',
        22.90, 'UN',
        '/images/capixabas-bar/gallery-03.jpg',
        'disponivel', true, true, true, ARRAY['caipiroska', 'frutas-vermelhas'], 2
    );

    -- 4. Mojito Clássico
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Mojito Clássico',
        'Rum branco, hortelã fresca, limão, açúcar e água com gás',
        21.90, 'UN',
        '/images/capixabas-bar/gallery-04.jpg',
        'disponivel', false, true, true, ARRAY['mojito', 'rum', 'refrescante'], 3
    );

    -- 5. Gin Tônica
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Gin Tônica',
        'Gin premium, água tônica, limão siciliano e zimbro',
        24.90, 'UN',
        '/images/capixabas-bar/gallery-05.jpg',
        'disponivel', false, true, true, ARRAY['gin', 'tonica', 'premium'], 4
    );

    -- 6. Caipirinha de Morango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Caipirinha de Morango',
        'Cachaça premium, morangos frescos, açúcar e gelo',
        20.90, 'UN',
        '/images/capixabas-bar/gallery-06.jpg',
        'disponivel', false, true, true, ARRAY['caipirinha', 'frutas'], 5
    );

    -- 7. Caipiroska de Maracujá
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Caipiroska de Maracujá',
        'Vodka, maracujá fresco, açúcar e gelo',
        22.90, 'UN',
        '/images/capixabas-bar/gallery-07.jpg',
        'disponivel', false, true, true, ARRAY['caipiroska', 'frutas'], 6
    );

    -- ============================================
    -- 8. INSERIR PRODUTOS - PASTEIS
    -- ============================================

    -- 1. Pastel de Carne
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel de Carne',
        'Pastel artesanal recheado com carne moída temperada, azeitonas e cebola',
        12.90, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', true, true, true, ARRAY['carne', 'tradicional', 'mais-pedido'], 0
    );

    -- 2. Pastel de Queijo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel de Queijo',
        'Pastel artesanal com muçarela derretida e orégano',
        10.90, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', false, true, true, ARRAY['queijo', 'vegetariano'], 1
    );

    -- 3. Pastel de Frango com Catupiry
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel de Frango com Catupiry',
        'Pastel artesanal com frango desfiado e catupiry cremoso',
        13.90, 'UN',
        '/images/capixabas-bar/menu-03.webp',
        'disponivel', true, true, true, ARRAY['frango', 'catupiry'], 2
    );

    -- 4. Pastel de Calabresa com Queijo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel de Calabresa com Queijo',
        'Pastel artesanal com calabresa fatiada e muçarela',
        13.90, 'UN',
        '/images/capixabas-bar/menu-04.webp',
        'disponivel', false, true, true, ARRAY['calabresa', 'queijo'], 3
    );

    -- 5. Pastel de Palmito
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel de Palmito',
        'Pastel artesanal com palmito cremoso, tomate e cheiro-verde',
        12.90, 'UN',
        '/images/capixabas-bar/menu-05.webp',
        'disponivel', false, true, true, ARRAY['palmito', 'vegetariano'], 4
    );

    -- 6. Pastel de Bacalhau
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel de Bacalhau',
        'Pastel artesanal com bacalhau desfiado, batata, azeitonas e ovos',
        16.90, 'UN',
        '/images/capixabas-bar/menu-06.webp',
        'disponivel', true, true, true, ARRAY['bacalhau', 'especialidade'], 5
    );

    -- 7. Pastel Doce de Banana com Canela
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel Doce de Banana com Canela',
        'Pastel artesanal com banana, canela, açúcar e leite condensado',
        11.90, 'UN',
        '/images/capixabas-bar/menu-07.webp',
        'disponivel', false, true, true, ARRAY['doce', 'banana', 'sobremesa'], 6
    );

    -- 8. Pastel Doce de Chocolate com Morango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_pasteis_id,
        'Pastel Doce de Chocolate com Morango',
        'Pastel artesanal com chocolate ao leite e morangos frescos',
        13.90, 'UN',
        '/images/capixabas-bar/menu-08.webp',
        'disponivel', false, true, true, ARRAY['doce', 'chocolate', 'morango'], 7
    );

    RAISE NOTICE '✅ Seed concluído com sucesso!';
    RAISE NOTICE '   Estabelecimento: %', v_estabelecimento_id;
    RAISE NOTICE '   Categorias garantidas (upsert): 5';
    RAISE NOTICE '   - Porções: % (6 produtos)', v_cat_porcoes_id;
    RAISE NOTICE '   - Bebidas: % (5 produtos)', v_cat_bebidas_id;
    RAISE NOTICE '   - Lanches: % (9 produtos)', v_cat_lanches_id;
    RAISE NOTICE '   - Drinks: % (7 produtos)', v_cat_drinks_id;
    RAISE NOTICE '   - Pasteis: % (8 produtos)', v_cat_pasteis_id;
    RAISE NOTICE '   Total: 35 produtos com categoria_id NÃO NULO';
    RAISE NOTICE '   Todos com visivel_vitrine=true, ativo=true';
    RAISE NOTICE '   Imagens: 10 menu + 11 galeria reutilizadas';

END $$;