import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const IMAGES_DIR = 'C:/Users/Luiz/Desktop/Projetos/RoomHouse-Manager-System/public/images/capixabas-bar'
const ESTAB_SLUG = 'capixabas-bar'

async function main() {
  console.log('🚀 Starting Capixabas Bar population...')

  // 1. Get estabelecimento ID
  const { data: estab, error: estabError } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('slug', ESTAB_SLUG)
    .eq('ativo', true)
    .single()

  if (estabError || !estab) {
    console.error('❌ Estabelecimento not found:', estabError)
    process.exit(1)
  }

  const estabelecimentoId = estab.id
  console.log(`✅ Found estabelecimento: ${estabelecimentoId}`)

  // 2. Upload all images to storage
  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpg|jpeg|png|webp|jfif)$/i.test(f))
  console.log(`📁 Found ${files.length} images to upload`)

  const uploadedUrls = {}

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file)
    const fileBuffer = fs.readFileSync(filePath)
    const mimeType = getMimeType(file)

    // Determine bucket based on filename prefix
    let bucket = 'produtos'
    let folder = 'produtos'
    if (file.startsWith('hero-') || file.startsWith('capa-') || file.startsWith('banner-')) {
      bucket = 'eventos'
      folder = 'eventos'
    } else if (file.startsWith('logo-') || file.startsWith('logo.')) {
      bucket = 'estabelecimento'
      folder = 'estabelecimento'
    }

    const storagePath = `${estabelecimentoId}/${file}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      })

    if (uploadError) {
      console.error(`❌ Failed to upload ${file}:`, uploadError.message)
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
      uploadedUrls[file] = data.publicUrl
      console.log(`✅ Uploaded ${file} → ${bucket}/${storagePath}`)
    }
  }

  console.log(`\n📤 Uploaded ${Object.keys(uploadedUrls).length} images`)

  // 3. Create categories
  const categories = [
    { nome: 'Entradas & Petiscos', icone: '🍽️', cor: '#F97316', ordem: 1 },
    { nome: 'Pratos Principais', icone: '🍛', cor: '#EF4444', ordem: 2 },
    { nome: 'Lanches & Burgers', icone: '🍔', cor: '#3B82F6', ordem: 3 },
    { nome: 'Porções para Compartilhar', icone: '🍗', cor: '#8B5CF6', ordem: 4 },
    { nome: 'Bebidas & Drinks', icone: '🍺', cor: '#06B6D4', ordem: 5 },
    { nome: 'Sobremesas', icone: '🍰', cor: '#EC4899', ordem: 6 },
  ]

  const categoryIds = {}
  for (const cat of categories) {
    const { data, error } = await supabase
      .from('categorias')
      .upsert({
        estabelecimento_id: estabelecimentoId,
        ...cat,
        ativo: true
      }, { onConflict: 'estabelecimento_id,nome' })
      .select('id')
      .single()

    if (error) {
      console.error(`❌ Failed to create category ${cat.nome}:`, error.message)
    } else {
      categoryIds[cat.nome] = data.id
      console.log(`✅ Category: ${cat.nome} (${data.id})`)
    }
  }

  // 4. Create products with images
  const products = [
    // Entradas & Petiscos
    { nome: 'Bolinho de Bacalhau', descricao: 'Bolinhos crocantes de bacalhau desfiado com batata e salsa', valor: 28.90, categoria: 'Entradas & Petiscos', imagem: 'menu-01.webp', destaque: true, tags: ['tradicional', 'frito'] },
    { nome: 'Pastel de Carne', descricao: 'Pastel artesanal recheado com carne moída temperada e azeitonas', valor: 12.90, categoria: 'Entradas & Petiscos', imagem: 'menu-02.webp', destaque: false, tags: ['frito', 'rapido'] },
    { nome: 'Pastel de Queijo', descricao: 'Pastel artesanal com muçarela derretida e orégano', valor: 10.90, categoria: 'Entradas & Petiscos', imagem: 'menu-03.webp', destaque: false, tags: ['vegetariano', 'frito'] },
    { nome: 'Caldo Verde', descricao: 'Sopa tradicional portuguesa com couve, batata e chouriço', valor: 18.90, categoria: 'Entradas & Petiscos', imagem: 'menu-04.webp', destaque: true, tags: ['sopa', 'quente'] },

    // Pratos Principais
    { nome: 'Bacalhau à Brás', descricao: 'Bacalhau desfiado com batata palha, ovos, cebola e azeitonas pretas', valor: 58.90, categoria: 'Pratos Principais', imagem: 'menu-05.webp', destaque: true, tags: ['bacalhau', 'tradicional'] },
    { nome: 'Feijoada Completa', descricao: 'Feijão preto com carnes defumadas, arroz, farofa, couve e laranja', valor: 42.90, categoria: 'Pratos Principais', imagem: 'menu-06.webp', destaque: true, tags: ['brasileiro', 'completo'] },
    { nome: 'Moqueca Capixaba', descricao: 'Peixe branco cozido no azeite de dendê com tomate, cebola, pimentão e coentro', valor: 65.90, categoria: 'Pratos Principais', imagem: 'menu-07.webp', destaque: true, tags: ['peixe', 'capixaba', 'especialidade'] },
    { nome: 'Frango à Passarinho', descricao: 'Frango frito em pedaços pequenos com alho, limão e batatas rústicas', valor: 38.90, categoria: 'Pratos Principais', imagem: 'menu-08.webp', destaque: false, tags: ['frango', 'frito'] },

    // Lanches & Burgers
    { nome: 'X-Bacon Capixaba', descricao: 'Hambúrguer artesanal 180g, bacon crocante, queijo cheddar, alface, tomate e molho especial', valor: 32.90, categoria: 'Lanches & Burgers', imagem: 'menu-09.webp', destaque: true, tags: ['hamburguer', 'bacon', 'artesanal'] },
    { nome: 'X-Salada', descricao: 'Hambúrguer artesanal, queijo, alface, tomate, cebola e molho da casa', valor: 26.90, categoria: 'Lanches & Burgers', imagem: 'menu-10.jpg', destaque: false, tags: ['hamburguer', 'classico'] },

    // Porções para Compartilhar
    { nome: 'Porção de Batata Frita', descricao: 'Batatas fritas crocantes com alecrim e alho', valor: 22.90, categoria: 'Porções para Compartilhar', imagem: 'gallery-01.jpg', destaque: false, tags: ['batata', 'compartilhar', 'vegetariano'] },
    { nome: 'Porção de Mandioca Frita', descricao: 'Mandioca frita na hora com molho de alho', valor: 24.90, categoria: 'Porções para Compartilhar', imagem: 'gallery-02.jpg', destaque: false, tags: ['mandioca', 'compartilhar'] },
    { nome: 'Tábua de Frios', descricao: 'Seleção de queijos, embutidos, azeitonas, pães e geleias', valor: 54.90, categoria: 'Porções para Compartilhar', imagem: 'gallery-03.jpg', destaque: true, tags: ['frios', 'queijos', 'compartilhar'] },

    // Bebidas & Drinks
    { nome: 'Chopp Brahma 300ml', descricao: 'Chopp bem gelado, cremoso e refrescante', valor: 8.90, categoria: 'Bebidas & Drinks', imagem: 'gallery-04.jpg', destaque: false, tags: ['chopp', 'gelado', 'alcoolico'] },
    { nome: 'Caipirinha de Limão', descricao: 'Cachaça premium, limão, açúcar e muito gelo', valor: 18.90, categoria: 'Bebidas & Drinks', imagem: 'gallery-05.jpg', destaque: true, tags: ['caipirinha', 'drink', 'classico'] },
    { nome: 'Caipiroska de Frutas Vermelhas', descricao: 'Vodka, morango, framboesa, limão e açúcar', valor: 22.90, categoria: 'Bebidas & Drinks', imagem: 'gallery-06.jpg', destaque: false, tags: ['caipiroska', 'frutas', 'drink'] },
    { nome: 'Refrigerante Lata 350ml', descricao: 'Coca-Cola, Guaraná, Sprite ou Fanta', valor: 6.90, categoria: 'Bebidas & Drinks', imagem: 'gallery-07.jpg', destaque: false, tags: ['refrigerante', 'sem-alcool'] },
    { nome: 'Suco Natural', descricao: 'Laranja, Maracujá, Abacaxi ou Melancia', valor: 9.90, categoria: 'Bebidas & Drinks', imagem: 'gallery-08.jpg', destaque: false, tags: ['suco', 'natural', 'sem-alcool'] },

    // Sobremesas
    { nome: 'Pudim de Leite Condensado', descricao: 'Pudim caseiro com calda de caramelo', valor: 12.90, categoria: 'Sobremesas', imagem: 'gallery-09.jpg', destaque: true, tags: ['pudim', 'caseiro', 'doce'] },
    { nome: 'Petit Gateau', descricao: 'Bolo de chocolate com centro cremoso, sorvete de baunilha e calda', valor: 18.90, categoria: 'Sobremesas', imagem: 'gallery-10.jpg', destaque: true, tags: ['chocolate', 'sorvete', 'quente-frio'] },
  ]

  for (let i = 0; i < products.length; i++) {
    const prod = products[i]
    const categoriaId = categoryIds[prod.categoria]
    const imagemUrl = uploadedUrls[prod.imagem] || ''

    const { error } = await supabase
      .from('produtos')
      .upsert({
        estabelecimento_id: estabelecimentoId,
        categoria_id: categoriaId,
        nome: prod.nome,
        descricao: prod.descricao,
        valor: prod.valor,
        unidade: 'UN',
        imagem_url: imagemUrl,
        disponibilidade: 'disponivel',
        destaque: prod.destaque,
        ativo: true,
        tags: prod.tags,
        ordem: i + 1
      }, { onConflict: 'estabelecimento_id,nome' })

    if (error) {
      console.error(`❌ Failed to create product ${prod.nome}:`, error.message)
    } else {
      console.log(`✅ Product: ${prod.nome} (${prod.categoria})${prod.destaque ? ' ⭐' : ''}`)
    }
  }

  // 5. Create events
  const now = new Date()
  const events = [
    {
      titulo: 'Quinta do Chopp em Dobro',
      descricao: 'Todas as quintas-feiras: peça 1 chopp e ganhe o 2º! Válido das 17h às 22h.',
      tipo: 'promocao',
      data_inicio: new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((4 - now.getDay() + 7) % 7)).toISOString(),
      data_fim: null,
      cor: '#F97316',
      banner: 'hero-01.jpg'
    },
    {
      titulo: 'Sexta com Música Ao Vivo',
      descricao: 'Toda sexta-feira a partir das 20h: show acústico com o melhor do MPB e rock nacional.',
      tipo: 'show',
      data_inicio: new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((5 - now.getDay() + 7) % 7)).toISOString(),
      data_fim: null,
      cor: '#EF4444',
      banner: 'hero-02.jpg'
    },
    {
      titulo: 'Sábado de Feijoada',
      descricao: 'Feijoada completa servida no almoço de sábado (11h às 15h). Reserve sua mesa!',
      tipo: 'evento',
      data_inicio: new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((6 - now.getDay() + 7) % 7)).toISOString(),
      data_fim: null,
      cor: '#8B5CF6',
      banner: 'hero-03.jpg'
    },
    {
      titulo: 'Happy Hour Estendido',
      descricao: 'De terça a quinta, das 17h às 20h: 50% off em todos os drinks e petiscos selecionados.',
      tipo: 'promocao',
      data_inicio: now.toISOString(),
      data_fim: null,
      cor: '#06B6D4',
      banner: 'hero-04.webp'
    },
    {
      titulo: 'Festival de Bacalhau',
      descricao: 'Durante todo o mês: pratos especiais com bacalhau a preços promocionais. Confira o cardápio!',
      tipo: 'evento',
      data_inicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      data_fim: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      cor: '#EC4899',
      banner: 'hero-05.webp'
    },
  ]

  for (const evt of events) {
    const bannerUrl = uploadedUrls[evt.banner] || ''

    const { error } = await supabase
      .from('eventos')
      .upsert({
        estabelecimento_id: estabelecimentoId,
        titulo: evt.titulo,
        descricao: evt.descricao,
        tipo: evt.tipo,
        data_inicio: evt.data_inicio,
        data_fim: evt.data_fim,
        cor: evt.cor,
        banner_url: bannerUrl,
        ativo: true
      }, { onConflict: 'estabelecimento_id,titulo' })

    if (error) {
      console.error(`❌ Failed to create event ${evt.titulo}:`, error.message)
    } else {
      console.log(`✅ Event: ${evt.titulo} (${evt.tipo})`)
    }
  }

  // 6. Update estabelecimento with logo and capa
  const logoUrl = uploadedUrls['logo.png'] || uploadedUrls['logo.jpg'] || uploadedUrls['logo.jfif'] || ''
  const capaUrl = uploadedUrls['hero-05.webp'] || uploadedUrls['hero-01.jpg'] || ''

  if (logoUrl || capaUrl) {
    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        logo_url: logoUrl,
        capa_url: capaUrl,
        descricao: 'O melhor bar da região com petiscos, cerveja gelada, música ao vivo e a famosa Moqueca Capixaba!',
        telefone: '(27) 99999-9999',
        endereco: {
          rua: 'Av. Beira Mar',
          numero: '1500',
          complemento: 'Loja 12',
          bairro: 'Praia do Canto',
          cidade: 'Vitória',
          estado: 'ES',
          cep: '29055-000'
        },
        horario_funcionamento: {
          seg: { abre: '17:00', fecha: '01:00', fechado: false },
          ter: { abre: '17:00', fecha: '01:00', fechado: false },
          qua: { abre: '17:00', fecha: '01:00', fechado: false },
          qui: { abre: '17:00', fecha: '02:00', fechado: false },
          sex: { abre: '16:00', fecha: '03:00', fechado: false },
          sab: { abre: '11:00', fecha: '03:00', fechado: false },
          dom: { abre: '11:00', fecha: '00:00', fechado: false }
        }
      })
      .eq('id', estabelecimentoId)

    if (error) {
      console.error('❌ Failed to update estabelecimento:', error.message)
    } else {
      console.log(`✅ Estabelecimento updated: logo=${!!logoUrl}, capa=${!!capaUrl}`)
    }
  }

  console.log('\n🎉 Population complete!')
  console.log(`🔗 View at: http://localhost:3000/${ESTAB_SLUG}`)
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case '.jpg': case '.jpeg': return 'image/jpeg'
    case '.png': return 'image/png'
    case '.webp': return 'image/webp'
    case '.jfif': return 'image/jpeg'
    default: return 'application/octet-stream'
  }
}

main().catch(console.error)