import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ESTABELECIMENTO_SLUG = 'capixabas-bar'

// ============================================
// DADOS DO CARDÁPIO FORNECIDOS
// ============================================

// Categorias
const categoriasData = [
  {
    nome: 'Porções',
    icone: '🍟',
    cor: '#EF4444', // vermelho
    ordem: 1,
  },
  {
    nome: 'Lanches (X-...)',
    icone: '🍔',
    cor: '#3B82F6', // azul
    ordem: 2,
  },
]

// Produtos - Porções (itens 12-27 do original, renumerados)
const porcoes = [
  { nome: 'Salada Completa', descricao: 'Mix de folhas, tomate, cenoura, pepino e molho da casa', valor: 35.00, unidade: 'UN' },
  { nome: 'Batata à Moda da Casa', descricao: 'Batata rústica com bacon, mussarela, calabresa e cheddar', valor: 60.00, unidade: 'UN' },
  { nome: 'Meia Batata à Moda da Casa', descricao: 'Porção menor da batata à moda da casa', valor: 36.00, unidade: 'UN' },
  { nome: 'Batata Frita (bacon e mussarela)', descricao: 'Batata frita coberta com bacon crocante e mussarela derretida', valor: 50.00, unidade: 'UN' },
  { nome: 'Meia Batata Frita (bacon e mussarela)', descricao: 'Porção menor de batata frita com bacon e mussarela', valor: 31.00, unidade: 'UN' },
  { nome: 'Batata Frita (sem bacon e mussarela)', descricao: 'Batata frita tradicional crocante', valor: 45.00, unidade: 'UN' },
  { nome: 'Meia Batata Frita (sem bacon e mussarela)', descricao: 'Porção menor de batata frita tradicional', valor: 31.00, unidade: 'UN' },
  { nome: 'Batata (com cheddar e bacon)', descricao: 'Batata rústica com cheddar cremoso e bacon crocante', valor: 60.00, unidade: 'UN' },
  { nome: 'Meia Batata (com cheddar e bacon)', descricao: 'Porção menor de batata com cheddar e bacon', valor: 36.00, unidade: 'UN' },
]

// Produtos - Lanches (itens 1-8)
const lanches = [
  { nome: 'X-Frango', descricao: 'Hambúrguer de frango, queijo, alface, tomate e maionese', valor: 26.00, unidade: 'UN' },
  { nome: 'X-Egg', descricao: 'Hambúrguer, queijo, ovo, alface, tomate e maionese', valor: 29.00, unidade: 'UN' },
  { nome: 'X-Burguer', descricao: 'Hambúrguer, queijo, alface, tomate e maionese', valor: 22.00, unidade: 'UN' },
  { nome: 'X-Salada', descricao: 'Hambúrguer, queijo, alface, tomate, cebola e maionese', valor: 24.00, unidade: 'UN' },
  { nome: 'X-Bacon', descricao: 'Hambúrguer, queijo, bacon, alface, tomate e maionese', valor: 29.00, unidade: 'UN' },
  { nome: 'X-Tudo', descricao: 'Hambúrguer, queijo, bacon, ovo, alface, tomate, cebola e maionese', valor: 34.00, unidade: 'UN' },
  { nome: 'X-Calabresa', descricao: 'Hambúrguer, queijo, calabresa, alface, tomate e maionese', valor: 26.00, unidade: 'UN' },
  { nome: 'X-Capixaba', descricao: 'Hambúrguer especial da casa com ingredientes selecionados', valor: 34.00, unidade: 'UN' },
]

// Imagens disponíveis (10 imagens)
const menuImages = [
  '/images/capixabas-bar/menu-01.webp',
  '/images/capixabas-bar/menu-02.webp',
  '/images/capixabas-bar/menu-03.webp',
  '/images/capixabas-bar/menu-04.webp',
  '/images/capixabas-bar/menu-05.webp',
  '/images/capixabas-bar/menu-06.webp',
  '/images/capixabas-bar/menu-07.webp',
  '/images/capixabas-bar/menu-08.webp',
  '/images/capixabas-bar/menu-09.webp',
  '/images/capixabas-bar/menu-10.jpg',
]

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function findEstabelecimento() {
  console.log(`🔍 Buscando estabelecimento com slug: ${ESTABELECIMENTO_SLUG}`)
  const { data, error } = await supabase
    .from('estabelecimentos')
    .select('id, nome, slug')
    .eq('slug', ESTABELECIMENTO_SLUG)
    .single()

  if (error) {
    console.error('❌ Erro ao buscar estabelecimento:', error.message)
    process.exit(1)
  }

  console.log(`✅ Estabelecimento encontrado: ${data.nome} (ID: ${data.id})`)
  return data.id
}

async function deleteExistingProducts(estabelecimentoId: string) {
  console.log('🗑️  Removendo produtos existentes...')
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('estabelecimento_id', estabelecimentoId)

  if (error) {
    console.error('❌ Erro ao remover produtos:', error.message)
    process.exit(1)
  }
  console.log('✅ Produtos existentes removidos')
}

async function upsertCategories(estabelecimentoId: string) {
  console.log('📂 Criando/atualizando categorias...')

  // Buscar categorias existentes
  const { data: existingCats, error: fetchError } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('estabelecimento_id', estabelecimentoId)

  if (fetchError) {
    console.error('❌ Erro ao buscar categorias:', fetchError.message)
    process.exit(1)
  }

  const categoryMap = new Map<string, string>() // nome -> id

  for (const catData of categoriasData) {
    const existing = existingCats?.find(c => c.nome === catData.nome)

    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('categorias')
        .update({ ...catData, estabelecimento_id: estabelecimentoId })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error(`❌ Erro ao atualizar categoria ${catData.nome}:`, error.message)
        process.exit(1)
      }
      categoryMap.set(catData.nome, data.id)
      console.log(`  🔄 Categoria atualizada: ${catData.nome} (ID: ${data.id})`)
    } else {
      // Criar nova
      const { data, error } = await supabase
        .from('categorias')
        .insert({ ...catData, estabelecimento_id: estabelecimentoId, ativo: true })
        .select()
        .single()

      if (error) {
        console.error(`❌ Erro ao criar categoria ${catData.nome}:`, error.message)
        process.exit(1)
      }
      categoryMap.set(catData.nome, data.id)
      console.log(`  ➕ Categoria criada: ${catData.nome} (ID: ${data.id})`)
    }
  }

  return categoryMap
}

function assignImage(index: number): string {
  // Distribuir as 10 imagens entre os 17 produtos
  return menuImages[index % menuImages.length]
}

async function createProducts(
  estabelecimentoId: string,
  categoryMap: Map<string, string>,
  produtosData: typeof porcoes,
  categoriaNome: string,
  startIndex: number
) {
  const categoriaId = categoryMap.get(categoriaNome)
  if (!categoriaId) {
    console.error(`❌ Categoria "${categoriaNome}" não encontrada`)
    process.exit(1)
  }

  console.log(`🍽️  Criando produtos da categoria: ${categoriaNome}`)

  for (let i = 0; i < produtosData.length; i++) {
    const prod = produtosData[i]
    const imageIndex = startIndex + i

    const produtoInsert = {
      estabelecimento_id: estabelecimentoId,
      categoria_id: categoriaId,
      nome: prod.nome,
      descricao: prod.descricao,
      valor: prod.valor,
      unidade: prod.unidade,
      imagem_url: assignImage(imageIndex),
      disponibilidade: 'disponivel' as const,
      destaque: i < 2, // Primeiros 2 de cada categoria em destaque
      visivel_vitrine: true,
      ativo: true,
      tags: i === 0 ? ['novidade'] : i === 1 ? ['mais-pedido'] : [], // Primeiro = novidade, segundo = mais pedido
      ordem: i,
    }

    const { data, error } = await supabase
      .from('produtos')
      .insert(produtoInsert)
      .select()
      .single()

    if (error) {
      console.error(`❌ Erro ao criar produto ${prod.nome}:`, error.message)
      process.exit(1)
    }

    console.log(`  ✅ ${prod.nome} - R$ ${prod.valor.toFixed(2).replace('.', ',')} (${prod.unidade}) - Imagem: ${assignImage(imageIndex)}`)
  }
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function main() {
  console.log('🚀 Iniciando seed do cardápio do Capixaba\'s Bar\n')

  try {
    // 1. Encontrar estabelecimento
    const estabelecimentoId = await findEstabelecimento()

    // 2. Remover produtos existentes
    await deleteExistingProducts(estabelecimentoId)

    // 3. Criar/atualizar categorias
    const categoryMap = await upsertCategories(estabelecimentoId)

    // 4. Criar produtos - Porções
    await createProducts(estabelecimentoId, categoryMap, porcoes, 'Porções', 0)

    // 5. Criar produtos - Lanches
    await createProducts(estabelecimentoId, categoryMap, lanches, 'Lanches (X-...)', porcoes.length)

    console.log('\n🎉 Seed concluído com sucesso!')
    console.log(`   Total de produtos criados: ${porcoes.length + lanches.length}`)
    console.log(`   Categorias: ${categoriasData.length}`)
    console.log(`   Imagens utilizadas: ${menuImages.length} (reutilizadas ciclicamente)`)

  } catch (error) {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  }
}

main()