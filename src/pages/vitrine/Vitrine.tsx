import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useEstabelecimento, useEventosVigentes, useCategorias, useProdutosVitrine } from '../../hooks/useVitrine'
import type { Evento } from '../../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MapPin, Phone, Clock, ShoppingBag, X, Music, Camera,
  ChevronLeft, ChevronRight, Expand, MessageSquare,
  AlertCircle, Copy, Check, MapPin as MapPinIcon,
  Search, Sparkles, Zap, Trophy, ArrowUp, Settings,
  Calendar, Users, Bug, ChevronDown
} from 'lucide-react'

const WHATSAPP_NUMBER = '4399389549'
const WHATSAPP_LINK = `https://wa.me/55${WHATSAPP_NUMBER}`
const WHATSAPP_ORDER_MSG = encodeURIComponent('Olá! Gostaria de fazer um pedido no Capixaba\'s Bar.')
const WHATSAPP_RESERVE_MSG = encodeURIComponent('Olá! Gostaria de reservar uma mesa no Capixaba\'s Bar.')
const WHATSAPP_PHOTO_MSG = encodeURIComponent('Olá! Gostaria de enviar uma foto para a galeria do Capixaba\'s Bar.')

// Debug: Mostrar botão de refresh apenas se tiver parâmetro ?debug=true na URL
const isDebugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

// Legendas da galeria (opcional - pode vir do banco depois)
const GALLERY_CAPTIONS: Record<string, string> = {
  'gallery-01.jpg': 'Ambiente aconchegante para happy hour',
  'gallery-02.jpg': 'Mesa de frios preparada com carinho',
  'gallery-03.jpg': 'Clientes aproveitando a noite',
  'gallery-04.jpg': 'Chopp gelado na medida certa',
  'gallery-05.jpg': 'Caipirinha de limão artesanal',
  'gallery-06.jpg': 'Drinks coloridos da casa',
  'gallery-07.jpg': 'Refrigerantes e sucos naturais',
  'gallery-08.jpg': 'Suco natural de maracujá',
  'gallery-09.jpg': 'Pudim de leite condensado caseiro',
  'gallery-10.jpg': 'Petit gateau com sorvete de baunilha',
  'gallery-11.jpg': 'Música ao vivo na sexta',
  'gallery-12.jpg': 'Roda de samba no sábado',
  'gallery-13.jpg': 'Fachada iluminada à noite',
  'gallery-14.jpg': 'Área externa do bar',
  'gallery-15.jpg': 'Detalhes da decoração',
  'gallery-16.jpg': 'Equipe pronta para atender',
  'gallery-17.jpg': 'Porção de batata frita crocante',
  'gallery-18.jpg': 'Tábua de queijos selecionados',
  'gallery-19.jpg': 'Bolinho de bacalhau dourado',
  'gallery-20.jpg': 'Moqueca capixaba tradicional',
  'gallery-21.jpg': 'Feijoada completa de sábado',
  'gallery-22.jpg': 'X-Bacon Capixaba artesanal',
}

// Type for gallery items (images only)
type GalleryItem = { id?: string; type: 'image'; url: string }

export default function Vitrine() {
  const { slug } = useParams<{ slug: string }>()
  const { data: estab, isLoading: loadingEstab, error: estabError } = useEstabelecimento(slug!)
  const { data: eventos, isLoading: loadingEventos, error: eventosError, refetch: refetchEventos } = useEventosVigentes(estab?.id || '')

  // Lightweight logging only for error/empty states
  useEffect(() => {
    if (eventosError) {
      console.error('[Vitrine] Erro ao carregar eventos:', eventosError.message);
    }
    if (!loadingEventos && eventos?.length === 0) {
      console.log('[Vitrine] Nenhum evento vigente para este estabelecimento');
    }
  }, [eventos, loadingEventos, eventosError, estab?.id])

  // Dados do cardápio: USA BANCO DE DADOS (hooks da vitrine)
  const { data: categorias, isLoading: loadingCategorias, error: categoriasError } = useCategorias(estab?.id || '')
  const { data: produtos, isLoading: loadingProdutos, error: produtosError } = useProdutosVitrine(estab?.id || '')

  // Log errors
  useEffect(() => {
    if (categoriasError) console.error('[Vitrine] Erro ao carregar categorias:', categoriasError.message)
    if (produtosError) console.error('[Vitrine] Erro ao carregar produtos:', produtosError.message)
  }, [categoriasError, produtosError])

  // Estados
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null)
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>('todos')
  const menuRef = useRef<HTMLDivElement>(null)

  // Status Aberto/Fechado
  const isOpen = useMemo(() => {
    if (!estab?.horario_funcionamento) return null
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
    const hoje = dias[new Date().getDay()]
    const h = estab.horario_funcionamento[hoje]
    if (!h || h.fechado || !h.abre || !h.fecha) return false
    const agora = new Date()
    const [abreH, abreM] = h.abre.split(':').map(Number)
    const [fechaH, fechaM] = h.fecha.split(':').map(Number)
    const abre = new Date(); abre.setHours(abreH, abreM, 0, 0)
    const fecha = new Date(); fecha.setHours(fechaH, fechaM, 0, 0)
    // Se fecha depois da meia-noite
    if (fechaH < abreH || (fechaH === abreH && fechaM <= abreM)) {
      fecha.setDate(fecha.getDate() + 1)
    }
    return agora >= abre && agora <= fecha
  }, [estab?.horario_funcionamento])

  // Evento em destaque (música ao vivo)
  const eventoDestaque = useMemo(() => {
    if (!eventos?.length) return null

    const now = new Date()

    // Helper to normalize tipo comparison (handle case/whitespace)
    const isShowOrArtista = (e: Evento) => {
      const tipo = (e.tipo || '').toString().trim().toLowerCase()
      const artista = (e.artista || '').toString().trim()
      return tipo === 'show' || artista.length > 0
    }

    // Helper to safely parse date
    const parseDate = (dateStr: string | null | undefined): Date | null => {
      if (!dateStr) return null
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? null : d
    }

    // 1. Primeiro: show/artista que ainda vai acontecer (data_inicio >= agora)
    const showFuturo = eventos.find(e => {
      const dataInicio = parseDate(e.data_inicio)
      return isShowOrArtista(e) && dataInicio && dataInicio >= now
    })
    if (showFuturo) return showFuturo

    // 2. Segundo: próximo evento futuro (qualquer tipo) - o mais próximo de agora
    const futuros = eventos
      .filter(e => {
        const dataInicio = parseDate(e.data_inicio)
        return dataInicio && dataInicio >= now
      })
      .sort((a, b) => {
        const da = parseDate(a.data_inicio)?.getTime() || 0
        const db = parseDate(b.data_inicio)?.getTime() || 0
        return da - db
      })
    if (futuros.length > 0) return futuros[0]

    // 3. Terceiro: show/artista mais recente (mesmo que já tenha passado)
    const showRecente = eventos
      .filter(e => isShowOrArtista(e))
      .sort((a, b) => {
        const da = parseDate(b.data_inicio)?.getTime() || 0
        const db = parseDate(a.data_inicio)?.getTime() || 0
        return da - db
      })[0]
    if (showRecente) return showRecente

    // 4. Fallback: evento mais recente (por data_inicio)
    return eventos
      .sort((a, b) => {
        const da = parseDate(b.data_inicio)?.getTime() || 0
        const db = parseDate(a.data_inicio)?.getTime() || 0
        return da - db
      })[0]
  }, [eventos])

  // Busca no cardápio (apenas para busca por texto - não filtra por categoria aqui)
  const filteredProdutos = useMemo(() => {
    let result = produtos || []
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        p.descricao?.toLowerCase().includes(term) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(term))
      )
    }
    return result
  }, [produtos, searchTerm])

  // Produtos agrupados por categoria (sempre todos os produtos da categoria, sem filtro de busca)
  const produtosPorCategoria = useMemo(() => {
    return categorias?.reduce((acc, cat) => {
      const items = produtos?.filter(p => p.categoria_id === cat.id) || []
      if (items.length > 0) acc[cat.id] = items
      return acc
    }, {} as Record<string, typeof produtos>) || {}
  }, [categorias, produtos])

  // Process gallery items from estabelecimento data (images only)
  const galleryItems = useMemo((): GalleryItem[] => {
    if (!estab) return []
    const galeria = (estab as any).galeria || []
    if (!galeria.length) return []
    return galeria.map((item: any, index: number) => {
      // If it's already a GalleryItem object, use it directly
      if (typeof item === 'object' && item !== null && item.url) {
        return {
          id: item.id || `gallery-${index}`,
          type: 'image' as const,
          url: item.url,
        }
      }
      // If it's a string (old format), treat as image
      if (typeof item === 'string') {
        return {
          id: `gallery-${index}`,
          type: 'image' as const,
          url: item,
        }
      }
      // Fallback: return empty (will be filtered out)
      return {
        id: `gallery-${index}`,
        type: 'image' as const,
        url: '',
      }
    }).filter((item: GalleryItem) => item.url) // Filter out invalid items
  }, [estab])

  // WhatsApp flutuante
  useEffect(() => {
    const handleScroll = () => {
      const btn = document.getElementById('whatsapp-float')
      if (btn) {
        btn.style.opacity = window.scrollY > 200 ? '1' : '0.7'
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Copiar para clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(label)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (e) {
      console.error('Erro ao copiar:', e)
    }
  }

  // Montar mensagem WhatsApp para item
  const getWhatsAppItemMsg = (nome: string, valor: number) =>
    encodeURIComponent(`Olá! Gostaria de pedir: *${nome}* (${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).`)

  if (loadingEstab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Carregando vitrine...</p>
        </div>
      </div>
    )
  }

  if (estabError || !estab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estabelecimento não encontrado</h1>
          <p className="text-gray-500">Verifique a URL e tente novamente.</p>
        </div>
      </div>
    )
  }

  const telefoneFormatado = '(43) 99938-9549'
  const enderecoCompleto = estab.endereco
    ? `${estab.endereco.rua}, ${estab.endereco.numero || ''}${estab.endereco.bairro ? `, ${estab.endereco.bairro}` : ''}${estab.endereco.cidade ? `, ${estab.endereco.cidade}` : ''}${estab.endereco.estado ? ` - ${estab.endereco.estado}` : ''}${estab.endereco.cep ? `, ${estab.endereco.cep}` : ''}`
    : ''
  const mapsUrl = enderecoCompleto
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`
    : '#'

  return (
    <main className="min-h-screen bg-gray-50 min-w-0">
      {/* Botão WhatsApp Flutuante */}
      <a
        id="whatsapp-float"
        href={`${WHATSAPP_LINK}?text=${WHATSAPP_ORDER_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl transition-all duration-300 animate-bounce-opacity opacity-70"
        aria-label="Pedir pelo WhatsApp"
        title="Fazer pedido pelo WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.466-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.194 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a22.3 22.3 0 01-4.889-1.08 19.78 19.78 0 01-3.414-1.826c-.273-.15-.572-.324-.871-.498l-.446-.247a27.7 27.7 0 01-1.6-.81c-.324-.198-.524-.297-.698-.396-.174-.098-.347-.198-.52-.198-.174 0-.347.075-.52.198-.173.099-.497.324-.645.52-.148.199-.422.474-.595.723a4.5 4.5 0 00-.396 1.297 7.6 7.6 0 00-.075 1.598 10.7 10.7 0 00.149 2.542 9.4 9.4 0 00.52 2.273c.149.324.497.723.87.948.373.224.698.398 1.071.547.372.15 2.345.84 5.148 1.773.607.208 1.213.324 1.871.324.421 0 .87-.075 1.314-.224.445-.149 1.066-.668 1.313-1.307.273-.693.248-1.388.148-1.613-.074-.248-.248-.473-.422-.698-.174-.224-.422-.473-.596-.723-.173-.248-.372-.523-.52-.847-.148-.323-.222-.598-.222-.872 0-.273.099-.472.198-.67.074-.173.298-.497.52-.822.223-.324.697-.972.948-1.49.223-.523.323-.947.323-1.297 0-.297-.099-.497-.174-.67-.075-.174-.248-.323-.473-.473z"/></svg>
      </a>

      {/* Top Bar com Status + Telefone + Copiar */}
      <div className="bg-primary-600 text-white py-1.5">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Status Aberto/Fechado */}
            {isOpen !== null && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isOpen
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'}`}>
                {isOpen ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Aberto agora
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Fechado agora
                  </>
                )}
              </span>
            )}

            <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
              <Phone className="h-4 w-4" />
              <a href={`${WHATSAPP_LINK}?text=${WHATSAPP_ORDER_MSG}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {telefoneFormatado}
              </a>
              <button
                onClick={() => copyToClipboard('43999389549', 'telefone')}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                aria-label="Copiar telefone"
                title={copiedItem === 'telefone' ? 'Copiado!' : 'Copiar telefone'}
              >
                {copiedItem === 'telefone' ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
              </button>
            </span>

            {enderecoCompleto && (
              <span className="flex items-center gap-1.5 hidden md:inline-flex whitespace-nowrap">
                <MapPin className="h-4 w-4" />
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline max-w-[200px] truncate block">
                  {enderecoCompleto}
                </a>
                <button
                  onClick={() => copyToClipboard(enderecoCompleto, 'endereco')}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label="Copiar endereço"
                  title={copiedItem === 'endereco' ? 'Copiado!' : 'Copiar endereço'}
                >
                  {copiedItem === 'endereco' ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
                </button>
              </span>
            )}

            {estab.horario_funcionamento && (
              <span className="flex items-center gap-1.5 hidden lg:inline-flex whitespace-nowrap">
                <Clock className="h-4 w-4" />
                {formatHorario(estab.horario_funcionamento)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`${WHATSAPP_LINK}?text=${WHATSAPP_ORDER_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/30 transition-colors whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4" />
              Pedir Agora
            </a>
            <a
              href="/admin/login"
              className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm hover:bg-white/20 transition-colors whitespace-nowrap"
              title="Acesso ao painel administrativo"
            >
              <Settings className="h-4 w-4" />
              Admin
            </a>
          </div>
        </div>
      </div>

      {/* Debug Panel - apenas com ?debug=true na URL */}
      {isDebugMode && (
        <div className="container mx-auto px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <details className="group">
            <summary className="flex items-center gap-3 cursor-pointer p-2 bg-yellow-100 rounded-lg">
              <Bug className="h-5 w-5 text-yellow-700" />
              <span className="font-medium text-yellow-800">Debug Vitrine</span>
              <ChevronDown className="h-4 w-4 text-yellow-600 transition-transform group-open:rotate-180 ml-auto" />
            </summary>
            <div className="p-3 bg-white border-t border-yellow-200 text-xs font-mono text-yellow-900 max-h-64 overflow-y-auto">
              <div className="mb-2"><strong>Estabelecimento:</strong> {estab?.id || 'não carregado'}</div>
              <div className="mb-2"><strong>Eventos loading:</strong> {loadingEventos ? 'sim' : 'não'}</div>
              <div className="mb-2"><strong>Eventos error:</strong> {eventosError?.message || 'nenhum'}</div>
              <div className="mb-2"><strong>Eventos count:</strong> {eventos?.length || 0}</div>
              <div className="mb-2"><strong>Now (ISO):</strong> {new Date().toISOString()}</div>
              <button
                onClick={() => refetchEventos()}
                disabled={loadingEventos}
                className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 disabled:opacity-50"
              >
                {loadingEventos ? 'Atualizando...' : 'Forçar Refresh Eventos'}
              </button>
              {eventos && eventos.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-yellow-700">Ver eventos brutos</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto text-[10px] max-h-60 overflow-y-auto">
                    {JSON.stringify(eventos.map(e => ({
                      id: e.id,
                      titulo: e.titulo,
                      tipo: e.tipo,
                      ativo: e.ativo,
                      data_inicio: e.data_inicio,
                      data_fim: e.data_fim,
                      artista: e.artista,
                      whatsapp_reserva: e.whatsapp_reserva,
                      banner_url: e.banner_url,
                      banner_url_len: e.banner_url?.length || 0,
                      banner_is_base64: e.banner_url?.startsWith('data:') || false,
                      banner_is_url: e.banner_url?.startsWith('http') || false,
                      cor: e.cor
                    })), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </details>
        </div>
      )}

      {/* Header / Hero com Foto da Fachada */}
      <header className="relative">
        {estab.capa_url && (
          <div
            className="absolute inset-0 h-[45vh] min-h-[300px] md:h-[55vh] lg:h-[65vh] bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${estab.capa_url})` }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 h-[45vh] min-h-[300px] md:h-[55vh] lg:h-[65vh] bg-gradient-to-b from-black/70 via-black/50 to-black/30" />
        <div className="relative h-[45vh] min-h-[300px] md:h-[55vh] lg:h-[65vh] flex items-end">
          <div className="container mx-auto px-4 pb-10 md:pb-16 lg:pb-20">
            <div className="max-w-4xl">
              {estab.logo_url && (
                <img
                  src={estab.logo_url}
                  alt={estab.nome}
                  className="h-24 md:h-28 lg:h-32 w-auto rounded-xl shadow-2xl mb-6 animate-slide-up"
                />
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 animate-slide-up delay-100 tracking-tight">
                {estab.nome}
              </h1>
              {estab.descricao && (
                <p className="text-white/90 text-lg md:text-xl lg:text-2xl mb-6 max-w-2xl animate-slide-up delay-200 font-light leading-relaxed">
                  {estab.descricao}
                </p>
              )}
              <div className="flex flex-wrap gap-3 animate-slide-up delay-300">
                <a
                  href={`${WHATSAPP_LINK}?text=${WHATSAPP_ORDER_MSG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Fazer Pedido no WhatsApp</span>
                  <Phone className="h-5 w-5" />
                </a>
                {eventoDestaque && (
                  <a
                    href={`${WHATSAPP_LINK}?text=${WHATSAPP_RESERVE_MSG}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Music className="h-5 w-5" />
                    <span>Reservar Mesa</span>
                  </a>
                )}
                {enderecoCompleto && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full text-base font-medium transition-all duration-200 backdrop-blur-sm"
                  >
                    <MapPinIcon className="h-5 w-5" />
                    <span>Como Chegar</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* EVENTO EM DESTAQUE - Música Ao Vivo */}
      {eventoDestaque && (
        <section className="relative -mt-4 md:-mt-8 lg:-mt-10 pb-4 md:pb-6 lg:pb-8">
          <div className="container mx-auto px-3 md:px-4">
            <div className="max-w-5xl mx-auto">
              <article className="group relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Banner container - balanced aspect ratio: taller on mobile, wider on desktop */}
                <div className="relative aspect-[3/4] md:aspect-[4/5] lg:aspect-[16/9] xl:aspect-[2/1] min-h-[260px] md:min-h-[280px] lg:min-h-[300px] xl:min-h-[320px] bg-gray-100">
                  {eventoDestaque.banner_url ? (
                    <>
                      {/* Background layer: blurred & scaled to fill - creates "side fill" for vertical images */}
                      <div className="absolute inset-0 bg-cover bg-center" style={{
                        backgroundImage: `url(${eventoDestaque.banner_url})`,
                        filter: 'blur(50px) brightness(0.35)',
                        transform: 'scale(1.15)'
                      }} aria-hidden="true" />

                      {/* Foreground: actual image with object-contain to show full photo centered */}
                      <img
                        src={eventoDestaque.banner_url}
                        alt={eventoDestaque.titulo}
                        className="absolute inset-0 w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center">
                      <span className="text-6xl">📅</span>
                    </div>
                  )}

                  {/* Gradient overlays for text readability - subtle, only at edges */}
                  {/* Bottom gradient for artist name & date */}
                  <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                  {/* Top gradient for badge */}
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />

                  {/* Side gradients */}
                  <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-[20%] bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />

                  {/* Badge - top left */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium border border-white/10 shadow-lg">
                      <Music className="h-3.5 w-3.5" />
                      {eventoDestaque.tipo === 'show' ? 'Música Ao Vivo' : eventoDestaque.tipo === 'promocao' ? 'Promoção' : 'Evento'}
                    </span>
                  </div>

                  {/* Artist name - bottom left */}
                  {eventoDestaque.artista && (
                    <div className="absolute bottom-20 left-4 right-4 z-10">
                      <p className="text-white/90 text-xs font-medium mb-1 flex items-center gap-1 drop-shadow-lg">
                        <Music className="h-3 w-3" /> Atração:
                      </p>
                      <h3 className="text-white text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold drop-shadow-xl tracking-tight">
                        {eventoDestaque.artista}
                      </h3>
                    </div>
                  )}

                  {/* Date - bottom right */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg text-white border border-white/10 shadow-lg">
                      <p className="text-xs font-medium drop-shadow-sm">
                        {format(new Date(eventoDestaque.data_inicio), 'EEEE, dd/MM', { locale: ptBR })}
                      </p>
                      <p className="text-xs opacity-85">A partir das 20h</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 lg:p-6">
                  <div className="space-y-4 md:grid md:grid-cols-2 gap-4 lg:gap-6 items-center">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Music className="h-5 w-5 text-primary-600 shrink-0" />
                        Evento em Destaque
                      </h2>
                      {eventoDestaque.descricao && (
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                          {eventoDestaque.descricao}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                          <Clock className="h-3 w-3" />
                          {format(new Date(eventoDestaque.data_inicio), 'EEEE, dd/MM', { locale: ptBR })}
                        </span>
                        {eventoDestaque.data_fim && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            Até {format(new Date(eventoDestaque.data_fim), 'dd/MM', { locale: ptBR })}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          <Music className="h-3 w-3" />
                          Ao Vivo
                        </span>
                      </div>
                    </div>
                    <div className="w-full">
                      <a
                        href={`${WHATSAPP_LINK}?text=${WHATSAPP_RESERVE_MSG}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group w-full justify-center"
                      >
                        <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform shrink-0" />
                        <span>Reservar Mesa pelo WhatsApp</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      )}

      {/* OUTROS EVENTOS / PROMOÇÕES */}
      {eventos && eventos.filter(e => e.id !== eventoDestaque?.id).length > 0 && (
        <section className="py-4 md:py-8 lg:py-10 bg-gray-50">
          <div className="container mx-auto px-3 md:px-4">
            <header className="max-w-4xl mx-auto text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Próximos Eventos & Promoções</h2>
              <p className="text-gray-500 text-sm md:text-base">Clique em um evento para ver detalhes e reservar</p>
            </header>
            <div className="overflow-x-auto pb-4 -mx-3 md:mx-0 md:pb-0">
              <div className="flex gap-2.5 min-w-max px-3 md:px-0">
                {eventos?.filter(e => e.id !== eventoDestaque?.id).map((evt) => (
                  <article
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="flex-shrink-0 w-64 sm:w-72 md:w-80 lg:w-88 bg-white rounded-xl shadow-md overflow-hidden border-l-4 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                    style={{ borderColor: evt.cor }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEvent(evt); } }}
                  >
                    {evt.banner_url ? (
                      <img
                        src={evt.banner_url}
                        alt={evt.titulo}
                        className="w-full h-36 object-cover"
                        onError={(e) => {
                          console.error('[Vitrine] Erro ao carregar banner:', evt.titulo, evt.banner_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-3xl">📅</span>
                      </div>
                    )}
                    <div className="p-3 md:p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-full text-white"
                          style={{ backgroundColor: evt.cor }}
                        >
                          {evt.tipo === 'promocao' ? '🔥 Promoção' : evt.tipo === 'show' ? '🎵 Show' : '📅 Evento'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1.5 text-base">{evt.titulo}</h3>
                      {evt.descricao && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{evt.descricao}</p>}
                      {evt.artista && (
                        <p className="text-sm text-primary-600 mb-2 font-medium flex items-center gap-1">
                          <Music className="h-3.5 w-3.5" /> {evt.artista}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <span>{format(new Date(evt.data_inicio), 'dd/MM', { locale: ptBR })}</span>
                        {evt.data_fim && <span>– {format(new Date(evt.data_fim), 'dd/MM', { locale: ptBR })}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Clique para detalhes
                        </span>
                        <a
                          href={`${WHATSAPP_LINK}?text=${WHATSAPP_RESERVE_MSG}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm font-semibold"
                          style={{ color: evt.cor }}
                        >
                          Reservar →
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal do Evento */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 md:p-4"
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[95vh] md:max-w-2xl overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.banner_url ? (
              <div className="relative h-48 md:h-56 lg:h-64">
                <img
                  src={selectedEvent.banner_url}
                  alt={selectedEvent.titulo}
                  className="w-full h-full object-cover rounded-t-2xl"
                  onError={(e) => {
                    console.error('[Vitrine] Erro ao carregar banner modal:', selectedEvent.titulo, selectedEvent.banner_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-t-2xl" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 text-xs font-semibold rounded-full text-white"
                    style={{ backgroundColor: selectedEvent.cor }}
                  >
                    {selectedEvent.tipo === 'promocao' ? '🔥 Promoção' : selectedEvent.tipo === 'show' ? '🎵 Show' : '📅 Evento'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  aria-label="Fechar detalhes do evento"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="relative h-48 md:h-56 lg:h-64 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-t-2xl flex items-center justify-center">
                <span className="text-5xl md:text-6xl">📅</span>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 text-xs font-semibold rounded-full text-white"
                    style={{ backgroundColor: selectedEvent.cor }}
                  >
                    {selectedEvent.tipo === 'promocao' ? '🔥 Promoção' : selectedEvent.tipo === 'show' ? '🎵 Show' : '📅 Evento'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  aria-label="Fechar detalhes do evento"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
            <div className="p-4 md:p-6">
              <h2 id="event-modal-title" className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{selectedEvent.titulo}</h2>

              {selectedEvent.artista && (
                <div className="mb-3 flex items-center gap-2 text-primary-600 font-medium">
                  <Music className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">{selectedEvent.artista}</span>
                </div>
              )}

              {selectedEvent.descricao && (
                <p className="text-gray-600 text-base leading-relaxed mb-4 md:mb-6">{selectedEvent.descricao}</p>
              )}

              <div className="flex flex-wrap gap-3 mb-4 md:mb-6 text-xs md:text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                  <span>{format(new Date(selectedEvent.data_inicio), 'EEEE, dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                {selectedEvent.data_fim && (
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                    <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                    <span>Até {format(new Date(selectedEvent.data_fim), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                  <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
                  <span>Música ao vivo</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={`${WHATSAPP_LINK}?text=${encodeURIComponent(`Olá! Gostaria de reservar uma mesa para "${selectedEvent.titulo}" no Capixaba's Bar.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-base transition-colors"
                >
                  <MessageSquare className="h-4.5 w-4.5 md:h-5 md:w-5" />
                  Reservar Mesa pelo WhatsApp
                </a>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setTimeout(() => {
                      menuRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-3 rounded-xl font-semibold text-base transition-colors"
                >
                  <ShoppingBag className="h-4.5 w-4.5 md:h-5 md:w-5" />
                  Ver Cardápio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUSCA RÁPIDA NO CARDÁPIO */}
      <section className="py-6 md:py-8 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar no cardápio... (nome, descrição, tags)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              aria-label="Buscar no cardápio"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Limpar busca"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {searchTerm && (
              <p className="text-center text-sm text-gray-500 mt-2">
                {filteredProdutos?.length || 0} item{filteredProdutos?.length !== 1 ? 'ns' : ''} encontrado{filteredProdutos?.length !== 1 ? 's' : ''} para "<span className="font-medium">{searchTerm}</span>"
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CARDÁPIO POR CATEGORIAS - Implementação limpa e direta */}
      <section ref={menuRef} className="py-8 md:py-12 lg:py-16 bg-gray-50" id="cardapio">
        <div className="container mx-auto px-4">
          {/* Loading state for cardápio */}
          {(loadingCategorias || loadingProdutos) && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
              <p className="text-gray-600">Carregando cardápio...</p>
            </div>
          )}

          {/* Error state for cardápio */}
          {(categoriasError || produtosError) && !loadingCategorias && !loadingProdutos && (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar cardápio</h3>
              <p className="text-gray-500 mb-4">
                {categoriasError?.message || produtosError?.message || 'Erro desconhecido'}
              </p>
              <button
                onClick={() => { /* refetch would need to be exposed from hooks */ }}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Cardápio content */}
          {(!loadingCategorias && !loadingProdutos && !categoriasError && !produtosError) && (
            <>
              {/* Abas de Categorias - SEMPRE mostra as categorias do banco + "Todos" */}
              <div className="mb-4">
                <div className="overflow-x-auto -mx-3 px-3 pb-2" role="tablist" aria-label="Categorias do cardápio">
                  <div className="flex gap-1.5 min-w-max">
                    <button
                      role="tab"
                      aria-selected={selectedCategoriaId === 'todos'}
                      onClick={() => setSelectedCategoriaId('todos')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        selectedCategoriaId === 'todos'
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-primary-50 hover:text-primary-600 border border-gray-200'
                      }`}
                    >
                      Todos
                    </button>
                    {(categorias || []).map((cat) => (
                      <button
                        key={cat.id}
                        role="tab"
                        aria-selected={selectedCategoriaId === cat.id}
                        onClick={() => setSelectedCategoriaId(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                          selectedCategoriaId === cat.id
                            ? 'text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:text-gray-900 border border-gray-200'
                        }`}
                        style={{
                          backgroundColor: selectedCategoriaId === cat.id ? cat.cor : 'white',
                          borderColor: selectedCategoriaId === cat.id ? cat.cor : '#e5e7eb',
                          color: selectedCategoriaId === cat.id ? 'white' : '#374151',
                        }}
                      >
                        {cat.icone && <span className="text-base">{cat.icone}</span>}
                        {cat.nome}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedCategoriaId !== 'todos' && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Mostrando: <strong>{categorias?.find(c => c.id === selectedCategoriaId)?.nome}</strong>
                    {' '}• {produtosPorCategoria[selectedCategoriaId]?.length || 0} item{produtosPorCategoria[selectedCategoriaId]?.length !== 1 ? 'ns' : ''}
                  </p>
                )}
                {selectedCategoriaId === 'todos' && searchTerm && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {filteredProdutos?.length || 0} item{filteredProdutos?.length !== 1 ? 'ns' : ''} encontrado{filteredProdutos?.length !== 1 ? 's' : ''} para "<span className="font-medium">{searchTerm}</span>"
                  </p>
                )}
              </div>

              {/* Empty state - no categories */}
              {(categorias || []).length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhuma categoria cadastrada</h3>
                  <p className="text-gray-500 text-sm">Adicione categorias no painel administrativo para exibir o cardápio.</p>
                </div>
              )}

              {/* Renderização do Cardápio */}
              {selectedCategoriaId === 'todos' ? (
            /* VISTA "TODOS": Grade compacta 2-4 colunas com 1 card por categoria */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
              {(categorias || []).map((cat) => {
                const itens = produtosPorCategoria[cat.id] || []
                if (itens.length === 0) return null
                const primeiroItem = itens[0]
                const showVerMais = itens.length > 1

                return (
                  <article
                    key={cat.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
                    style={{ borderTop: `3px solid ${cat.cor}` }}
                  >
                    {/* Cabeçalho compacto da categoria */}
                    <div className="p-2 pb-1" style={{ backgroundColor: `${cat.cor}15` }}>
                      <div className="flex items-center gap-2 mb-1">
                        {cat.icone && <span className="text-lg">{cat.icone}</span>}
                        <h3 className="font-bold text-gray-900 text-sm" style={{ color: cat.cor }}>
                          {cat.nome}
                        </h3>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {itens.length} item{itens.length !== 1 ? 'ns' : ''}
                      </span>
                    </div>

                    {/* Card do primeiro item - compacto */}
                    <div className="p-1.5">
                      <ProdutoCardCompacto
                        produto={primeiroItem}
                        whatsappNumber={WHATSAPP_NUMBER}
                        getWhatsAppItemMsg={getWhatsAppItemMsg}
                      />
                    </div>

                    {/* Botão Ver mais */}
                    {showVerMais && (
                      <div className="px-1.5 pb-2">
                        <button
                          onClick={() => setSelectedCategoriaId(cat.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border-2 rounded-lg font-medium text-sm transition-all duration-200 hover:shadow-md"
                          style={{
                            borderColor: cat.cor,
                            color: cat.cor,
                          }}
                        >
                          <span>Ver mais</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <p className="mt-1 text-center text-[10px] text-gray-500">
                          +{itens.length - 1} variedade{itens.length - 1 !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            /* VISTA CATEGORIA ESPECÍFICA: mostra todos os itens da categoria */
            (() => {
              const cat = (categorias || []).find(c => c.id === selectedCategoriaId)
              const itens = cat ? (produtosPorCategoria[cat.id] || []) : []
              if (!cat || itens.length === 0) return null

              return (
                <div className="mb-6 lg:mb-8">
                  <header className="mb-4 pb-2 border-b border-gray-200">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <div>
                        {cat.icone && <span className="text-xl md:text-2xl mr-2 inline-block">{cat.icone}</span>}
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold inline" style={{ color: cat.cor }}>
                          {cat.nome}
                        </h2>
                      </div>
                      <span className="self-end text-gray-500 text-sm mt-1 ml-auto">
                        {itens.length} item{itens.length !== 1 ? 'ns' : ''}
                      </span>
                    </div>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {itens.map((prod) => (
                      <ProdutoCard key={prod.id} produto={prod} whatsappNumber={WHATSAPP_NUMBER} getWhatsAppItemMsg={getWhatsAppItemMsg} />
                    ))}
                  </div>
                </div>
              )
            })()
          )}
            </>
          )}
        </div>
      </section>

      {/* GALERIA DE FOTOS E VÍDEOS */}
      <section className="py-4 md:py-8 lg:py-10 bg-white">
        <div className="container mx-auto px-3 md:px-4">
          <header className="max-w-4xl mx-auto text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Camera className="h-5 w-5 md:h-6 md:w-6 text-primary-600" />
              Galeria do Bar
            </h2>
            <p className="text-gray-500 text-sm md:text-base">Ambiente, clientes e momentos especiais</p>
          </header>

          {galleryItems.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhuma foto na galeria ainda</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 max-w-7xl mx-auto" role="list">
                {galleryItems.map((item, index) => {
                  const fileName = item.url.split('/').pop() || ''
                  const caption = GALLERY_CAPTIONS[fileName]
                  return (
                    <button
                      key={item.id || index}
                      onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                      className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer focus:outline-none focus:ring-3 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label={`Ver foto ${index + 1} da galeria${caption ? `: ${caption}` : ''}`}
                    >
                      <img
                        src={item.url}
                        alt={`Galeria Capixaba's Bar - Foto ${index + 1}${caption ? ` - ${caption}` : ''}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {caption}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                        <span className="text-white text-xs font-medium flex items-center gap-1 w-full justify-center">
                          <Expand className="h-3 w-3" />
                          Ampliar
                        </span>
                      </div>
                      <div className="absolute top-1.5 left-1.5">
                        <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          <Camera className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Botão WhatsApp para enviar foto */}
              <div className="text-center mt-6 md:mt-8">
                <a
                  href={`${WHATSAPP_LINK}?text=${WHATSAPP_PHOTO_MSG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  <Camera className="h-4 w-4" />
                  <span>Enviar sua foto pelo WhatsApp</span>
                  <MessageSquare className="h-4 w-4" />
                </a>
                <p className="text-gray-500 text-sm mt-2">Tem uma foto legal? Manda pra gente que a gente posta!</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox / Modal da Galeria */}
      {lightboxOpen && galleryItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 md:p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Galeria ampliada"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors md:top-6 md:right-6 md:w-12 md:h-12"
            aria-label="Fechar galeria"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* Desktop navigation arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + galleryItems.length) % galleryItems.length); }}
            className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:block md:left-4 md:w-12 md:h-12"
            aria-label="Item anterior"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % galleryItems.length); }}
            className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors hidden md:block md:right-4 md:w-12 md:h-12"
            aria-label="Próximo item"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <img
              src={galleryItems[lightboxIndex]?.url || ''}
              alt={`Foto ${lightboxIndex + 1} da galeria`}
              className="w-full h-auto max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            {galleryItems[lightboxIndex] && GALLERY_CAPTIONS[galleryItems[lightboxIndex].url.split('/').pop() || ''] && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1.5 rounded-lg text-white text-xs text-center max-w-xl md:bottom-4 md:px-4 md:py-2 md:text-sm">
                {GALLERY_CAPTIONS[galleryItems[lightboxIndex].url.split('/').pop() || '']}
              </div>
            )}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white/70 text-xs flex items-center gap-1.5 md:bottom-8 md:text-sm md:gap-2">
              <span><Camera className="h-3 w-3 md:h-4 md:w-4" /></span>
              <span>{lightboxIndex + 1} / {galleryItems.length}</span>
            </div>
          </div>

          {/* Mobile navigation arrows - bottom centered */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-3 md:hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + galleryItems.length) % galleryItems.length); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Item anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % galleryItems.length); }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Próximo item"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* FOOTER COMPLETO E LIMPO */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                {estab.logo_url && <img src={estab.logo_url} alt="" className="h-8 w-auto rounded-lg" />}
                <div>
                  <h3 className="font-bold text-lg">{estab.nome}</h3>
                  <p className="text-gray-400 text-xs">O melhor bar da região</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                Petiscos, cerveja gelada, música ao vivo e a famosa Moqueca Capixaba. Venha viver a melhor experiência!
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`${WHATSAPP_LINK}?text=${WHATSAPP_ORDER_MSG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-xs font-medium transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pedir pelo WhatsApp</span>
                </a>
                <a
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-medium transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Acesso Admin</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4 text-primary-400" />
                Localização & Contato
              </h4>
              <div className="space-y-2 text-gray-400 text-xs">
                {enderecoCompleto && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 hover:text-white transition-colors group">
                    <MapPinIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary-400" />
                    <span className="group-hover:underline">{enderecoCompleto}</span>
                  </a>
                )}
                <a href={`https://wa.me/55${WHATSAPP_NUMBER}?text=${WHATSAPP_ORDER_MSG}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="group-hover:underline">{telefoneFormatado}</span>
                </a>
                <a href={`https://wa.me/55${WHATSAPP_NUMBER}?text=${WHATSAPP_RESERVE_MSG}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                  <span className="group-hover:underline">Reservar mesa</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary-400" />
                Horário
              </h4>
              <div className="text-gray-400 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between gap-3"><span>Seg-Qua</span><span>17h–01h</span></div>
                <div className="flex justify-between gap-3"><span>Qui</span><span>17h–02h</span></div>
                <div className="flex justify-between gap-3"><span>Sex</span><span>16h–03h</span></div>
                <div className="flex justify-between gap-3"><span>Sáb</span><span>11h–03h</span></div>
                <div className="flex justify-between gap-3"><span>Dom</span><span>11h–00h</span></div>
              </div>
            </div>
          </div>

          {/* Divider + Bottom bar */}
          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
              <p className="text-gray-500 text-xs">
                Vitrine digital desenvolvida com <span className="text-primary-400 font-medium">RoomHouse</span>
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <a href="#top" className="flex items-center gap-1 hover:text-white transition-colors" title="Voltar ao topo">
                  <ArrowUp className="h-3.5 w-3.5" />
                  Topo
                </a>
                <a href="/admin/login" className="flex items-center gap-1 hover:text-white transition-colors">
                  <Settings className="h-3.5 w-3.5" />
                  Admin
                </a>
                <a href={`${WHATSAPP_LINK}?text=${WHATSAPP_ORDER_MSG}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-400 transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Botão Voltar ao Topo (Mobile) */}
      <a href="#top" className="fixed bottom-6 right-4 z-40 w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm flex items-center justify-center text-white shadow-lg hover:bg-gray-900 transition-all duration-300 md:bottom-24 md:right-6 md:w-12 md:h-12" aria-label="Voltar ao topo" title="Voltar ao topo">
        <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
      </a>
    </main>
  )
}

function ProdutoCard({ produto, whatsappNumber, getWhatsAppItemMsg }: {
  produto: any,
  whatsappNumber: string,
  getWhatsAppItemMsg: (nome: string, valor: number) => string
}) {
  const isIndisponivel = produto.disponibilidade === 'indisponivel'

  return (
    <article
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
        produto.destaque ? 'ring-2 ring-amber-400' : ''
      } ${isIndisponivel ? 'opacity-60' : ''}`}
    >
      {produto.imagem_url && (
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {produto.destaque && (
              <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <Trophy className="h-2.5 w-2.5" />
                Destaque
              </span>
            )}
            {produto.tags?.includes('novidade') && (
              <span className="inline-flex items-center gap-1 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <Sparkles className="h-2.5 w-2.5" />
                Novidade
              </span>
            )}
            {produto.tags?.includes('mais-pedido') && (
              <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <Zap className="h-2.5 w-2.5" />
                Mais pedido
              </span>
            )}
          </div>
          {isIndisponivel && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-900 shadow">
                Indisponível
              </span>
            </div>
          )}
        </div>
      )}
      <div className="p-3">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-sm">{produto.nome}</h3>
        {produto.descricao && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-snug">{produto.descricao}</p>
        )}
        {produto.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {produto.tags.filter((t: string) => !['novidade', 'mais-pedido'].includes(t)).map((tag: string) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-primary-50 text-primary-700 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-baseline justify-between pt-1.5 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">
            {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          {produto.unidade !== 'UN' && (
            <span className="text-xs text-gray-500">/{produto.unidade}</span>
          )}
        </div>
        {/* Botão Pedir no WhatsApp */}
        {!isIndisponivel && (
          <a
            href={`https://wa.me/55${whatsappNumber}?text=${getWhatsAppItemMsg(produto.nome, produto.valor)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Pedir no WhatsApp
          </a>
        )}
      </div>
    </article>
  )
}

/* Card compacto para vista "Todos" do cardápio - mais enxuto */
function ProdutoCardCompacto({ produto, whatsappNumber, getWhatsAppItemMsg }: {
  produto: any,
  whatsappNumber: string,
  getWhatsAppItemMsg: (nome: string, valor: number) => string
}) {
  const isIndisponivel = produto.disponibilidade === 'indisponivel'

  return (
    <article className={`relative transition-all duration-300 hover:shadow-sm ${isIndisponivel ? 'opacity-60' : ''}`}>
      {/* Imagem quadrada compacta */}
      {produto.imagem_url && (
        <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-2">
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          {/* Badge Destaque */}
          {produto.destaque && (
            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              <Trophy className="h-2 w-2" />
              Destaque
            </span>
          )}
          {isIndisponivel && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-semibold text-gray-900 shadow">
                Indisponível
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info compacta */}
      <div className="space-y-1">
        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{produto.nome}</h4>
        {produto.descricao && (
          <p className="text-[10px] text-gray-500 line-clamp-1 leading-snug">{produto.descricao}</p>
        )}

        {/* Preço + botão WhatsApp na mesma linha */}
        <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-gray-100">
          <span className="text-base font-bold text-gray-900 flex-shrink-0">
            {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            {produto.unidade !== 'UN' && <span className="text-xs font-normal text-gray-500">/{produto.unidade}</span>}
          </span>
          {!isIndisponivel && (
            <a
              href={`https://wa.me/55${whatsappNumber}?text=${getWhatsAppItemMsg(produto.nome, produto.valor)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap"
            >
              <MessageSquare className="h-3 w-3" />
              Pedir
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function formatHorario(horario: Record<string, any>): string {
  const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  const hoje = dias[new Date().getDay()]
  const h = horario[hoje]
  if (!h || !h.abre || !h.fecha) return 'Fechado hoje'
  return `${h.abre} – ${h.fecha}`
}