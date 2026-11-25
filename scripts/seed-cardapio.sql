-- ============================================
-- SEED CARDÁPIO - CAPIXABA'S BAR
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. ENCONTRAR O ESTABELECIMENTO
DO $$
DECLARE
    v_estabelecimento_id uuid;
    v_cat_na_chapa_id uuid;
    v_cat_baguetes_id uuid;
    v_cat_drinks_id uuid;
    v_cat_pasteis_id uuid;
    v_cat_mistos_id uuid;
    v_cat_dogs_id uuid;
    v_cat_porcoes_lanches_id uuid;
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
    -- 2. REMOVER PRODUTOS EXISTENTES
    -- ============================================
    DELETE FROM public.produtos
    WHERE estabelecimento_id = v_estabelecimento_id;

    RAISE NOTICE 'Produtos existentes removidos';

    -- ============================================
    -- 3. CRIAR/ATUALIZAR CATEGORIAS (7 categorias)
    -- ============================================

    -- Categoria 1: Na Chapa Combos e Saladas
    SELECT id INTO v_cat_na_chapa_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Na Chapa Combos e Saladas';

    IF v_cat_na_chapa_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Na Chapa Combos e Saladas', '🥩', '#EF4444', 1, true)
        RETURNING id INTO v_cat_na_chapa_id;
    END IF;
    RAISE NOTICE 'Categoria Na Chapa Combos e Saladas: %', v_cat_na_chapa_id;

    -- Categoria 2: Baguetes
    SELECT id INTO v_cat_baguetes_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Baguetes';

    IF v_cat_baguetes_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Baguetes', '🥖', '#F97316', 2, true)
        RETURNING id INTO v_cat_baguetes_id;
    END IF;
    RAISE NOTICE 'Categoria Baguetes: %', v_cat_baguetes_id;

    -- Categoria 3: Drinks e Adicionais
    SELECT id INTO v_cat_drinks_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Drinks e Adicionais';

    IF v_cat_drinks_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Drinks e Adicionais', '🍹', '#06B6D4', 3, true)
        RETURNING id INTO v_cat_drinks_id;
    END IF;
    RAISE NOTICE 'Categoria Drinks e Adicionais: %', v_cat_drinks_id;

    -- Categoria 4: Pasteis
    SELECT id INTO v_cat_pasteis_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Pasteis';

    IF v_cat_pasteis_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Pasteis', '🥟', '#8B5CF6', 4, true)
        RETURNING id INTO v_cat_pasteis_id;
    END IF;
    RAISE NOTICE 'Categoria Pasteis: %', v_cat_pasteis_id;

    -- Categoria 5: Mistos
    SELECT id INTO v_cat_mistos_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Mistos';

    IF v_cat_mistos_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Mistos', '🍞', '#3B82F6', 5, true)
        RETURNING id INTO v_cat_mistos_id;
    END IF;
    RAISE NOTICE 'Categoria Mistos: %', v_cat_mistos_id;

    -- Categoria 6: Dogs
    SELECT id INTO v_cat_dogs_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Dogs';

    IF v_cat_dogs_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Dogs', '🌭', '#EC4899', 6, true)
        RETURNING id INTO v_cat_dogs_id;
    END IF;
    RAISE NOTICE 'Categoria Dogs: %', v_cat_dogs_id;

    -- Categoria 7: Porções e Lanches
    SELECT id INTO v_cat_porcoes_lanches_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Porções e Lanches';

    IF v_cat_porcoes_lanches_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Porções e Lanches', '🍟', '#10B981', 7, true)
        RETURNING id INTO v_cat_porcoes_lanches_id;
    END IF;
    RAISE NOTICE 'Categoria Porções e Lanches: %', v_cat_porcoes_lanches_id;

    -- ============================================
    -- 4. INSERIR PRODUTOS - NA CHAPA COMBOS E SALADAS
    -- ============================================

    -- 1. Combo Na Chapa 1
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_na_chapa_id,
        'Combo Na Chapa 1',
        'Picanha na chapa, arroz, feijão, farofa, vinagrete e batata frita',
        89.90, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', true, true, true, ARRAY['combo', 'picanha', 'mais-pedido'], 0
    );

    -- 2. Combo Na Chapa 2
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_na_chapa_id,
        'Combo Na Chapa 2',
        'Contra-filé na chapa, arroz, feijão, farofa, vinagrete e mandioca frita',
        79.90, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', true, true, true, ARRAY['combo', 'contra-filé'], 1
    );

    -- 3. Salada Capixaba
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_na_chapa_id,
        'Salada Capixaba',
        'Mix de folhas, tomate cereja, palmito, queijo coalho grelhado e molho de maracujá',
        42.90, 'UN',
        '/images/capixabas-bar/menu-03.webp',
        'disponivel', false, true, true, ARRAY['salada', 'vegetariano', 'leve'], 2
    );

    -- 4. Salada Caesar com Frango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_na_chapa_id,
        'Salada Caesar com Frango',
        'Alface americana, frango grelhado, croutons, parmesão e molho Caesar',
        38.90, 'UN',
        '/images/capixabas-bar/menu-04.webp',
        'disponivel', false, true, true, ARRAY['salada', 'frango'], 3
    );

    -- 5. Picanha na Chapa (Prato Individual)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_na_chapa_id,
        'Picanha na Chapa',
        'Picanha grelhada na brasa com alho, acompanha arroz, feijão e farofa',
        68.90, 'UN',
        '/images/capixabas-bar/menu-05.webp',
        'disponivel', true, true, true, ARRAY['picanha', 'prato-individual'], 4
    );

    -- ============================================
    -- 5. INSERIR PRODUTOS - BAGUETES
    -- ============================================

    -- 1. Baguete de Pernil
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_baguetes_id,
        'Baguete de Pernil',
        'Pernil assado desfiado, queijo mussarela, vinagrete e pimenta da casa no pão baguete',
        32.90, 'UN',
        '/images/capixabas-bar/menu-06.webp',
        'disponivel', true, true, true, ARRAY['pernil', 'mais-pedido'], 0
    );

    -- 2. Baguete de Frango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_baguetes_id,
        'Baguete de Frango',
        'Frango desfiado com catupiry, alface, tomate e maionese no pão baguete',
        28.90, 'UN',
        '/images/capixabas-bar/menu-07.webp',
        'disponivel', false, true, true, ARRAY['frango', 'catupiry'], 1
    );

    -- 3. Baguete de Calabresa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_baguetes_id,
        'Baguete de Calabresa',
        'Calabresa fatiada grelhada, queijo mussarela, cebola caramelizada e mostarda no pão baguete',
        29.90, 'UN',
        '/images/capixabas-bar/menu-08.webp',
        'disponivel', false, true, true, ARRAY['calabresa', 'grelhado'], 2
    );

    -- 4. Baguete Vegetariana
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_baguetes_id,
        'Baguete Vegetariana',
        'Berinjela grelhada, abobrinha, pimentão, queijo brie e rúcula no pão baguete',
        31.90, 'UN',
        '/images/capixabas-bar/menu-09.webp',
        'disponivel', false, true, true, ARRAY['vegetariana', 'saudavel'], 3
    );

    -- 5. Baguete Capixaba
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_baguetes_id,
        'Baguete Capixaba',
        'Carne de sol desfiada, queijo coalho, manteiga de garrafa e vinagrete no pão baguete',
        34.90, 'UN',
        '/images/capixabas-bar/menu-10.jpg',
        'disponivel', true, true, true, ARRAY['capixaba', 'carne-de-sol', 'especialidade'], 4
    );

    -- ============================================
    -- 6. INSERIR PRODUTOS - DRINKS E ADICIONAIS
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

    -- 6. Chopp Brahma 300ml
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Chopp Brahma 300ml',
        'Chopp bem gelado, cremoso e refrescante',
        8.90, 'UN',
        '/images/capixabas-bar/gallery-06.jpg',
        'disponivel', false, true, true, ARRAY['chopp', 'cerveja', 'gelado'], 5
    );

    -- 7. Refrigerante Lata 350ml
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Refrigerante Lata 350ml',
        'Coca-Cola, Guaraná Antarctica, Sprite ou Fanta Laranja',
        6.90, 'UN',
        '/images/capixabas-bar/gallery-07.jpg',
        'disponivel', false, true, true, ARRAY['refrigerante', 'sem-alcool'], 6
    );

    -- 8. Suco Natural
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Suco Natural',
        'Laranja, Maracujá, Abacaxi, Melancia ou Morango',
        9.90, 'UN',
        '/images/capixabas-bar/gallery-08.jpg',
        'disponivel', false, true, true, ARRAY['suco', 'natural', 'sem-alcool'], 7
    );

    -- 9. Adicional: Bacon
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Adicional: Bacon',
        'Bacon crocante em tiras',
        5.00, 'UN',
        '/images/capixabas-bar/gallery-09.jpg',
        'disponivel', false, true, true, ARRAY['adicional', 'bacon'], 8
    );

    -- 10. Adicional: Queijo Extra
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Adicional: Queijo Extra',
        'Porção extra de queijo mussarela derretido',
        4.00, 'UN',
        '/images/capixabas-bar/gallery-10.jpg',
        'disponivel', false, true, true, ARRAY['adicional', 'queijo'], 9
    );

    -- 11. Adicional: Ovo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_drinks_id,
        'Adicional: Ovo',
        'Ovo frito ou cozido',
        3.00, 'UN',
        '/images/capixabas-bar/gallery-11.jpg',
        'disponivel', false, true, true, ARRAY['adicional', 'ovo'], 10
    );

    -- ============================================
    -- 7. INSERIR PRODUTOS - PASTEIS
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

    -- ============================================
    -- 8. INSERIR PRODUTOS - MISTOS
    -- ============================================

    -- 1. Misto Quente
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_mistos_id,
        'Misto Quente',
        'Pão de forma, presunto, queijo mussarela tostado na chapa',
        14.90, 'UN',
        '/images/capixabas-bar/menu-09.webp',
        'disponivel', true, true, true, ARRAY['classico', 'mais-pedido'], 0
    );

    -- 2. Misto Quente com Ovo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_mistos_id,
        'Misto Quente com Ovo',
        'Pão de forma, presunto, queijo mussarela, ovo frito tostado na chapa',
        17.90, 'UN',
        '/images/capixabas-bar/menu-10.jpg',
        'disponivel', false, true, true, ARRAY['classico', 'ovo'], 1
    );

    -- 3. Misto de Frango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_mistos_id,
        'Misto de Frango',
        'Pão de forma, frango desfiado, queijo mussarela, milho tostado na chapa',
        16.90, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', false, true, true, ARRAY['frango', 'milho'], 2
    );

    -- 4. Misto de Calabresa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_mistos_id,
        'Misto de Calabresa',
        'Pão de forma, calabresa fatiada, queijo mussarela, cebola tostado na chapa',
        16.90, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', false, true, true, ARRAY['calabresa', 'cebola'], 3
    );

    -- 5. Misto Vegetariano
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_mistos_id,
        'Misto Vegetariano',
        'Pão de forma, queijo brie, tomate, rúcula, pesto tostado na chapa',
        18.90, 'UN',
        '/images/capixabas-bar/menu-03.webp',
        'disponivel', false, true, true, ARRAY['vegetariano', 'brie', 'pesto'], 4
    );

    -- 6. Misto Capixaba
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_mistos_id,
        'Misto Capixaba',
        'Pão de forma, carne de sol desfiada, queijo coalho, manteiga de garrafa tostado na chapa',
        21.90, 'UN',
        '/images/capixabas-bar/menu-04.webp',
        'disponivel', true, true, true, ARRAY['capixaba', 'carne-de-sol', 'queijo-coalho', 'especialidade'], 5
    );

    -- ============================================
    -- 9. INSERIR PRODUTOS - DOGS
    -- ============================================

    -- 1. Dog Tradicional
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_dogs_id,
        'Dog Tradicional',
        'Salsicha artesanal, pão macio, molho de tomate caseiro, mostarda, ketchup e batata palha',
        18.90, 'UN',
        '/images/capixabas-bar/menu-05.webp',
        'disponivel', true, true, true, ARRAY['tradicional', 'mais-pedido'], 0
    );

    -- 2. Dog com Bacon
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_dogs_id,
        'Dog com Bacon',
        'Salsicha artesanal, pão macio, bacon crocante, queijo mussarela derretido, molho de tomate e batata palha',
        22.90, 'UN',
        '/images/capixabas-bar/menu-06.webp',
        'disponivel', false, true, true, ARRAY['bacon', 'queijo'], 1
    );

    -- 3. Dog Completo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_dogs_id,
        'Dog Completo',
        'Salsicha artesanal, pão macio, bacon, queijo mussarela, ovo de codorna, milho, ervilha, molho de tomate e batata palha',
        26.90, 'UN',
        '/images/capixabas-bar/menu-07.webp',
        'disponivel', true, true, true, ARRAY['completo', 'bacon', 'queijo', 'ovo'], 2
    );

    -- 4. Dog Calabresa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_dogs_id,
        'Dog Calabresa',
        'Calabresa grelhada no lugar da salsicha, pão macio, queijo mussarela, cebola caramelizada, mostarda e batata palha',
        23.90, 'UN',
        '/images/capixabas-bar/menu-08.webp',
        'disponivel', false, true, true, ARRAY['calabresa', 'cebola-caramelizada'], 3
    );

    -- 5. Dog Vegetariano
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_dogs_id,
        'Dog Vegetariano',
        'Salsicha vegetal grelhada, pão integral, queijo brie, rúcula, tomate seco, maionese de alho e batata doce palha',
        24.90, 'UN',
        '/images/capixabas-bar/menu-09.webp',
        'disponivel', false, true, true, ARRAY['vegetariano', 'integral', 'batata-doce'], 4
    );

    -- 6. Dog Capixaba
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_dogs_id,
        'Dog Capixaba',
        'Salsicha artesanal, pão macio, carne de sol desfiada, queijo coalho derretido, vinagrete, manteiga de garrafa e batata palha',
        28.90, 'UN',
        '/images/capixabas-bar/menu-10.jpg',
        'disponivel', true, true, true, ARRAY['capixaba', 'carne-de-sol', 'queijo-coalho', 'especialidade'], 5
    );

    -- ============================================
    -- 10. INSERIR PRODUTOS - PORÇÕES E LANCHES
    -- ============================================

    -- 1. Batata Frita Tradicional
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
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
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
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
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
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
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
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
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'Frango à Passarinho',
        'Frango frito em pedaços pequenos com alho, limão e batatas rústicas',
        38.90, 'UN',
        '/images/capixabas-bar/menu-05.webp',
        'disponivel', true, true, true, ARRAY['frango', 'frito', 'mais-pedido'], 4
    );

    -- 6. Bolinho de Bacalhau
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'Bolinho de Bacalhau (6 unid.)',
        'Bolinhos crocantes de bacalhau desfiado com batata, salsa e azeitonas',
        32.90, 'UN',
        '/images/capixabas-bar/menu-06.webp',
        'disponivel', false, true, true, ARRAY['bacalhau', 'tradicional', 'petisco'], 5
    );

    -- 7. X-Burguer
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'X-Burguer',
        'Hambúrguer artesanal 150g, queijo mussarela, alface, tomate e maionese da casa no pão brioche',
        26.90, 'UN',
        '/images/capixabas-bar/menu-07.webp',
        'disponivel', false, true, true, ARRAY['hamburguer', 'classico'], 6
    );

    -- 8. X-Bacon
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'X-Bacon',
        'Hambúrguer artesanal 150g, bacon crocante, queijo cheddar, alface, tomate e maionese especial no pão brioche',
        32.90, 'UN',
        '/images/capixabas-bar/menu-08.webp',
        'disponivel', true, true, true, ARRAY['hamburguer', 'bacon', 'cheddar', 'mais-pedido'], 7
    );

    -- 9. X-Salada
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'X-Salada',
        'Hambúrguer artesanal 150g, queijo mussarela, alface, tomate, cebola roxa, picles e maionese da casa no pão brioche',
        28.90, 'UN',
        '/images/capixabas-bar/menu-09.webp',
        'disponivel', false, true, true, ARRAY['hamburguer', 'salada', 'completo'], 8
    );

    -- 10. X-Tudo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'X-Tudo',
        'Hambúrguer artesanal 150g, bacon, queijo cheddar, ovo, alface, tomate, cebola, picles e maionese especial no pão brioche',
        36.90, 'UN',
        '/images/capixabas-bar/menu-10.jpg',
        'disponivel', true, true, true, ARRAY['hamburguer', 'tudo', 'completo', 'mais-pedido'], 9
    );

    -- 11. X-Frango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'X-Frango',
        'Filé de frango grelhado, queijo mussarela, alface, tomate, maionese de alho no pão brioche',
        28.90, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', false, true, true, ARRAY['frango', 'grelhado'], 10
    );

    -- 12. X-Calabresa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_cat_porcoes_lanches_id,
        'X-Calabresa',
        'Hambúrguer artesanal 150g, calabresa grelhada, queijo mussarela, cebola caramelizada, mostarda e maionese no pão brioche',
        31.90, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', false, true, true, ARRAY['hamburguer', 'calabresa', 'cebola'], 11
    );

    RAISE NOTICE '✅ Seed concluído com sucesso!';
    RAISE NOTICE '   Estabelecimento: %', v_estabelecimento_id;
    RAISE NOTICE '   Categorias criadas: 7';
    RAISE NOTICE '   Produtos por categoria:';
    RAISE NOTICE '   - Na Chapa Combos e Saladas: 5 produtos';
    RAISE NOTICE '   - Baguetes: 5 produtos';
    RAISE NOTICE '   - Drinks e Adicionais: 11 produtos';
    RAISE NOTICE '   - Pasteis: 8 produtos';
    RAISE NOTICE '   - Mistos: 6 produtos';
    RAISE NOTICE '   - Dogs: 6 produtos';
    RAISE NOTICE '   - Porções e Lanches: 12 produtos';
    RAISE NOTICE '   Total: 53 produtos criados';
    RAISE NOTICE '   Imagens: 10 imagens de menu + 11 imagens de galeria reutilizadas ciclicamente';

END $$;