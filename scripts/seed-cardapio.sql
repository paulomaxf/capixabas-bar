-- ============================================
-- SEED CARDÁPIO - CAPIXABA'S BAR
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. ENCONTRAR O ESTABELECIMENTO
DO $$
DECLARE
    v_estabelecimento_id uuid;
    v_categoria_porcoes_id uuid;
    v_categoria_lanches_id uuid;
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
    -- 3. CRIAR/ATUALIZAR CATEGORIAS
    -- ============================================

    -- Categoria: Porções
    INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
    VALUES (v_estabelecimento_id, 'Porções', '🍟', '#EF4444', 1, true)
    ON CONFLICT (id) DO NOTHING; -- Se já existe, não faz nada (precisa de ID para ON CONFLICT)

    -- Buscar ou criar categoria Porções
    SELECT id INTO v_categoria_porcoes_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Porções';

    IF v_categoria_porcoes_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Porções', '🍟', '#EF4444', 1, true)
        RETURNING id INTO v_categoria_porcoes_id;
    END IF;

    RAISE NOTICE 'Categoria Porções: %', v_categoria_porcoes_id;

    -- Categoria: Lanches (X-...)
    SELECT id INTO v_categoria_lanches_id
    FROM public.categorias
    WHERE estabelecimento_id = v_estabelecimento_id AND nome = 'Lanches (X-...)';

    IF v_categoria_lanches_id IS NULL THEN
        INSERT INTO public.categorias (estabelecimento_id, nome, icone, cor, ordem, ativo)
        VALUES (v_estabelecimento_id, 'Lanches (X-...)', '🍔', '#3B82F6', 2, true)
        RETURNING id INTO v_categoria_lanches_id;
    END IF;

    RAISE NOTICE 'Categoria Lanches: %', v_categoria_lanches_id;

    -- ============================================
    -- 4. INSERIR PRODUTOS - PORÇÕES
    -- ============================================

    -- Imagens disponíveis (10 imagens, reutilizadas ciclicamente)
    -- /images/capixabas-bar/menu-01.webp até menu-10.jpg

    -- 1. Salada Completa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Salada Completa',
        'Mix de folhas, tomate, cenoura, pepino e molho da casa',
        35.00, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', true, true, true, ARRAY['novidade'], 0
    );

    -- 2. Batata à Moda da Casa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Batata à Moda da Casa',
        'Batata rústica com bacon, mussarela, calabresa e cheddar',
        60.00, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', true, true, true, ARRAY['mais-pedido'], 1
    );

    -- 3. Meia Batata à Moda da Casa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Meia Batata à Moda da Casa',
        'Porção menor da batata à moda da casa',
        36.00, 'UN',
        '/images/capixabas-bar/menu-03.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 2
    );

    -- 4. Batata Frita (bacon e mussarela)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Batata Frita (bacon e mussarela)',
        'Batata frita coberta com bacon crocante e mussarela derretida',
        50.00, 'UN',
        '/images/capixabas-bar/menu-04.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 3
    );

    -- 5. Meia Batata Frita (bacon e mussarela)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Meia Batata Frita (bacon e mussarela)',
        'Porção menor de batata frita com bacon e mussarela',
        31.00, 'UN',
        '/images/capixabas-bar/menu-05.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 4
    );

    -- 6. Batata Frita (sem bacon e mussarela)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Batata Frita (sem bacon e mussarela)',
        'Batata frita tradicional crocante',
        45.00, 'UN',
        '/images/capixabas-bar/menu-06.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 5
    );

    -- 7. Meia Batata Frita (sem bacon e mussarela)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Meia Batata Frita (sem bacon e mussarela)',
        'Porção menor de batata frita tradicional',
        31.00, 'UN',
        '/images/capixabas-bar/menu-07.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 6
    );

    -- 8. Batata (com cheddar e bacon)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Batata (com cheddar e bacon)',
        'Batata rústica com cheddar cremoso e bacon crocante',
        60.00, 'UN',
        '/images/capixabas-bar/menu-08.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 7
    );

    -- 9. Meia Batata (com cheddar e bacon)
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_porcoes_id,
        'Meia Batata (com cheddar e bacon)',
        'Porção menor de batata com cheddar e bacon',
        36.00, 'UN',
        '/images/capixabas-bar/menu-09.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 8
    );

    -- ============================================
    -- 5. INSERIR PRODUTOS - LANCHES (X-...)
    -- ============================================

    -- 1. X-Frango
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Frango',
        'Hambúrguer de frango, queijo, alface, tomate e maionese',
        26.00, 'UN',
        '/images/capixabas-bar/menu-10.jpg',
        'disponivel', true, true, true, ARRAY['novidade'], 0
    );

    -- 2. X-Egg
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Egg',
        'Hambúrguer, queijo, ovo, alface, tomate e maionese',
        29.00, 'UN',
        '/images/capixabas-bar/menu-01.webp',
        'disponivel', true, true, true, ARRAY['mais-pedido'], 1
    );

    -- 3. X-Burguer
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Burguer',
        'Hambúrguer, queijo, alface, tomate e maionese',
        22.00, 'UN',
        '/images/capixabas-bar/menu-02.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 2
    );

    -- 4. X-Salada
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Salada',
        'Hambúrguer, queijo, alface, tomate, cebola e maionese',
        24.00, 'UN',
        '/images/capixabas-bar/menu-03.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 3
    );

    -- 5. X-Bacon
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Bacon',
        'Hambúrguer, queijo, bacon, alface, tomate e maionese',
        29.00, 'UN',
        '/images/capixabas-bar/menu-04.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 4
    );

    -- 6. X-Tudo
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Tudo',
        'Hambúrguer, queijo, bacon, ovo, alface, tomate, cebola e maionese',
        34.00, 'UN',
        '/images/capixabas-bar/menu-05.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 5
    );

    -- 7. X-Calabresa
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Calabresa',
        'Hambúrguer, queijo, calabresa, alface, tomate e maionese',
        26.00, 'UN',
        '/images/capixabas-bar/menu-06.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 6
    );

    -- 8. X-Capixaba
    INSERT INTO public.produtos (
        estabelecimento_id, categoria_id, nome, descricao, valor, unidade,
        imagem_url, disponibilidade, destaque, visivel_vitrine, ativo, tags, ordem
    ) VALUES (
        v_estabelecimento_id, v_categoria_lanches_id,
        'X-Capixaba',
        'Hambúrguer especial da casa com ingredientes selecionados',
        34.00, 'UN',
        '/images/capixabas-bar/menu-07.webp',
        'disponivel', false, true, true, ARRAY[]::text[], 7
    );

    RAISE NOTICE '✅ Seed concluído com sucesso!';
    RAISE NOTICE '   Estabelecimento: %', v_estabelecimento_id;
    RAISE NOTICE '   Categoria Porções: % (9 produtos)', v_categoria_porcoes_id;
    RAISE NOTICE '   Categoria Lanches: % (8 produtos)', v_categoria_lanches_id;
    RAISE NOTICE '   Total: 17 produtos criados';
    RAISE NOTICE '   Imagens: 10 imagens reutilizadas ciclicamente';

END $$;