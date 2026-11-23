import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useEventosAdmin, useCriarEvento, useAtualizarEvento, useExcluirEvento, useUploadEventoBanner } from '../../hooks/useAdmin'
import { Plus, Search, Edit, Trash2, Calendar, Image, Loader2, ArrowLeft, Link2, Music, MessageSquare, Copy, ShoppingBag, Building2, Star, CheckCircle, Info, Zap, AlertCircle, X } from 'lucide-react'
import { Button, Input, Textarea, Select, ConfirmDialog, ImageUpload, Card, Badge } from '../../components/ui'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../../lib/auth'
import type { EventoTipo } from '../../types'

const tiposEvento = [
  { value: 'evento', label: '📅 Evento', icon: '📅', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'promocao', label: '🔥 Promoção', icon: '🔥', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'show', label: '🎵 Show/Música', icon: '🎵', color: 'bg-red-100 text-red-700 border-red-200' },
]

const WHATSAPP_DEFAULT = '5543999389549'

// Yup validation schema for event form
const eventoSchema = yup.object().shape({
  titulo: yup.string().required('Título é obrigatório'),
  tipo: yup.string().oneOf(tiposEvento.map(t => t.value)).required('Tipo é obrigatório'),
  data_inicio: yup.string().required('Data de início é obrigatória'),
  data_fim: yup.string().nullable().notRequired(),
  cor: yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal (ex: #EF4444)'),
  ativo: yup.boolean(),
  descricao: yup.string().nullable().notRequired(),
  artista: yup.string().nullable().notRequired(),
  whatsapp_reserva: yup.string().nullable().notRequired().matches(/^\d{10,15}$/, 'WhatsApp deve ter apenas números (ex: 5543999389549)'),
  link_externo: yup.string().nullable().notRequired().url('URL inválida'),
  banner_url: yup.string().nullable().notRequired().url('URL do banner inválida'),
})

type EventoFormData = yup.InferType<typeof eventoSchema>

export default function Eventos() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isEditing = !!params.id
  const { perfil } = useAuth()
  const estabelecimentoId = perfil?.estabelecimento_id || ''

  const { data: eventos, isLoading: loadingEventos, refetch: refetchEventos } = useEventosAdmin(estabelecimentoId)
  const createEvento = useCriarEvento()
  const updateEvento = useAtualizarEvento()
  const deleteEvento = useExcluirEvento()
  const uploadBanner = useUploadEventoBanner()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(isEditing)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [editingEvento, setEditingEvento] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load event for editing
  if (isEditing && !editingEvento && eventos) {
    const evt = eventos.find(e => e.id === params.id)
    if (evt) setEditingEvento(evt)
  }

  const handleSubmit = async (data: {
    titulo: string
    tipo: string
    data_inicio: string | null
    data_fim: string | null
    ativo: boolean
    descricao?: string | null
    artista?: string | null
    whatsapp_reserva?: string | null
    link_externo?: string | null
    cor?: string | null
    banner_url?: string | null
    estabelecimento_id?: string
  }) => {
    // Form already validates and converts dates to ISO strings
    // Convert null/undefined to null for fields that expect string | null in DB schema
    const toNullable = <T,>(value: T | null | undefined): T | null => (value == null ? null : value)

    const payload = {
      titulo: data.titulo,
      tipo: data.tipo as EventoTipo,
      data_inicio: data.data_inicio!, // Required by form validation
      data_fim: toNullable(data.data_fim),
      ativo: Boolean(data.ativo),
      descricao: toNullable(data.descricao),
      artista: toNullable(data.artista),
      whatsapp_reserva: toNullable(data.whatsapp_reserva),
      link_externo: toNullable(data.link_externo),
      cor: data.cor || '#EF4444', // Required string, has default value in form
      banner_url: toNullable(data.banner_url),
      recorrencia: null,
      estabelecimento_id: estabelecimentoId,
    }

    console.log('[Eventos] handleSubmit payload:', {
      isEditing,
      eventoId: params.id,
      payload: {
        ...payload,
        now_iso: new Date().toISOString(),
        data_inicio_is_future: payload.data_inicio ? new Date(payload.data_inicio) > new Date() : false
      }
    })

    try {
      if (isEditing) {
        await updateEvento.mutateAsync({ id: params.id!, ...payload })
      } else {
        await createEvento.mutateAsync(payload)
      }
      setMessage({ type: 'success', text: isEditing ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!' })
      setShowForm(false)
      setEditingEvento(null)
      navigate('/admin/eventos')
      refetchEventos()
    } catch (error: any) {
      console.error('[Eventos] Erro ao salvar evento:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      })
      setMessage({ type: 'error', text: `Erro ao salvar: ${error.message || 'Tente novamente'}` })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEvento.mutateAsync(id)
      refetchEventos()
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
    } finally {
      setShowDeleteDialog(null)
    }
  }

  const handleImageUpload = async (file: File) => {
    // Para novos eventos, usar um ID temporário para o path do upload
    const tempEventoId = editingEvento?.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    try {
      const url = await uploadBanner.mutateAsync({
        eventoId: tempEventoId,
        file,
        estabelecimentoId
      })
      console.log('[Eventos] handleImageUpload: upload bem-sucedido', { tempEventoId, url })
      return url || ''
    } catch (error: any) {
      console.error('[Eventos] handleImageUpload: erro ao fazer upload:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      })
      throw error
    }
  }

  const openEdit = (evt: any) => {
    setEditingEvento(evt)
    setShowForm(true)
  }

  const openNew = () => {
    setEditingEvento(null)
    setShowForm(true)
  }

  const duplicateEvento = async (evt: any) => {
    try {
      await createEvento.mutateAsync({
        ...evt,
        titulo: `${evt.titulo} (Cópia)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        estabelecimento_id: estabelecimentoId,
      })
      refetchEventos()
    } catch (error) {
      console.error('Erro ao duplicar:', error)
    }
  }

  const toggleAtivo = async (evt: any) => {
    try {
      await updateEvento.mutateAsync({ id: evt.id, ativo: !evt.ativo })
      refetchEventos()
    } catch (error) {
      console.error('Erro ao alternar status:', error)
    }
  }

  const copyWhatsAppLink = (evt: any) => {
    const baseMsg = encodeURIComponent(`Olá! Gostaria de reservar uma mesa para "${evt.titulo}" no Capixaba's Bar.`)
    const link = `https://wa.me/${evt.whatsapp_reserva || WHATSAPP_DEFAULT}?text=${baseMsg}`
    navigator.clipboard.writeText(link)
  }

  const filteredEventos = eventos?.filter(e =>
    e.titulo.toLowerCase().includes(search.toLowerCase())
  ) || []

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  const getTipoInfo = (tipo: string) => {
    return tiposEvento.find(t => t.value === tipo) || { value: tipo, label: tipo, icon: '📅', color: 'bg-gray-100 text-gray-700' }
  }

  if (showForm) {
    return (
      <EventoForm
        evento={editingEvento}
        onSubmit={handleSubmit}
        onCancel={() => { setShowForm(false); setEditingEvento(null); navigate('/admin/eventos') }}
        loading={createEvento.isPending || updateEvento.isPending}
        onImageUpload={handleImageUpload}
      />
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos & Promoções</h1>
          <p className="text-gray-500 mt-1">Crie eventos, shows e promoções para sua vitrine</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Novo Evento
          </Button>
          <Button variant="outline" size="sm" icon={<Music className="h-4 w-4" />} onClick={() => openNew()} className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            Novo Show
          </Button>
          <Button variant="outline" size="sm" icon={<Zap className="h-4 w-4" />} onClick={() => openNew()} className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
            Nova Promoção
          </Button>
          <Button variant="outline" size="sm" icon={<ShoppingBag className="h-4 w-4" />} onClick={() => window.open('/capixabas-bar', '_blank')}>
            Ver na Vitrine
          </Button>
          <Button variant="outline" size="sm" icon={<Building2 className="h-4 w-4" />} onClick={() => window.open('/admin', '_blank')}>
            Config. Estabelecimento
          </Button>
          <Button variant="outline" size="sm" icon={<Star className="h-4 w-4" />} onClick={() => window.open('/admin/produtos', '_blank')}>
            Cardápio
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <Card padding="sm" className="bg-gray-50 border-gray-100 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{eventos?.length || 0}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{eventos?.filter(e => e.ativo).length || 0}</p>
            <p className="text-xs text-gray-500">Ativos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{eventos?.filter(e => e.tipo === 'show').length || 0}</p>
            <p className="text-xs text-gray-500">Shows</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{eventos?.filter(e => e.tipo === 'promocao').length || 0}</p>
            <p className="text-xs text-gray-500">Promoções</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{eventos?.filter(e => e.tipo === 'evento').length || 0}</p>
            <p className="text-xs text-gray-500">Eventos</p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar eventos por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Events Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Banner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artista/Detalhes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-56">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingEventos ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredEventos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum evento encontrado
                  </td>
                </tr>
              ) : (
                filteredEventos.map((evt) => {
                  const tipoInfo = getTipoInfo(evt.tipo)
                  return (
                    <tr key={evt.id} className="hover:bg-gray-50">
                      {/* Banner */}
                      <td className="px-4 py-3">
                        {evt.banner_url ? (
                          <img src={evt.banner_url} alt={evt.titulo} className="w-24 h-14 rounded-lg object-cover shadow-sm" />
                        ) : (
                          <div className="w-24 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Image className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>

                      {/* Título + Descrição */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{evt.titulo}</p>
                          {evt.descricao && <p className="text-sm text-gray-500 line-clamp-1">{evt.descricao}</p>}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <Badge variant="secondary" size="sm" className={tipoInfo.color}>
                          {tipoInfo.icon} {tipoInfo.label}
                        </Badge>
                      </td>

                      {/* Período */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1 text-gray-900">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {evt.data_inicio && formatDate(evt.data_inicio)}
                          </span>
                          {evt.data_fim && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              até {formatDate(evt.data_fim)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Artista / Detalhes Especiais */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {evt.artista && (
                            <span className="flex items-center gap-1 text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded">
                              <Music className="h-3.5 w-3.5" /> {evt.artista}
                            </span>
                          )}
                          {evt.link_externo && (
                            <a href={evt.link_externo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                              <Link2 className="h-3.5 w-3.5" /> Ingressos/Link
                            </a>
                          )}
                          {evt.whatsapp_reserva && (
                            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Reservas
                            </span>
                          )}
                          {!evt.artista && !evt.link_externo && !evt.whatsapp_reserva && (
                            <span className="text-xs text-gray-400">Sem detalhes extras</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={evt.ativo ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {evt.ativo ? 'Ativo na vitrine' : 'Inativo'}
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Toggle Ativo */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtivo(evt)}
                            aria-label={evt.ativo ? 'Desativar' : 'Ativar'}
                            className={evt.ativo ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>

                          {/* Copy WhatsApp Link */}
                          {evt.whatsapp_reserva && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyWhatsAppLink(evt)}
                              icon={<Copy className="h-4 w-4" />}
                              aria-label="Copiar link WhatsApp"
                              className="text-green-600 hover:text-green-700"
                            />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(evt)}
                            icon={<Edit className="h-4 w-4" />}
                            aria-label="Editar"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateEvento(evt)}
                            icon={<Copy className="h-4 w-4" />}
                            aria-label="Duplicar"
                            className="text-gray-400 hover:text-blue-600"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteDialog(evt.id)}
                            icon={<Trash2 className="h-4 w-4" />}
                            aria-label="Excluir"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen
          onClose={() => setShowDeleteDialog(null)}
          onConfirm={() => handleDelete(showDeleteDialog!)}
          title="Excluir Evento"
          message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          variant="destructive"
          loading={deleteEvento.isPending}
        />
      )}

      {/* Legenda */}
      <Card padding="md" className="bg-gray-50 border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" /> Dicas para eventos na vitrine:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-3 bg-white rounded-lg border border-gray-100">
            <p className="font-medium text-gray-900 mb-1 flex items-center gap-1">
              <Music className="h-4 w-4 text-red-500" /> Shows com Artista
            </p>
            <p>Preencha o campo "Artista" para aparecer em destaque na vitrine com botão "Reservar Mesa"</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-100">
            <p className="font-medium text-gray-900 mb-1 flex items-center gap-1">
              <Zap className="h-4 w-4 text-orange-500" /> Promoções
            </p>
            <p>Use tipo "Promoção" para happy hours e ofertas - aparecem com badge laranja</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-100">
            <p className="font-medium text-gray-900 mb-1 flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-green-500" /> WhatsApp Reservas
            </p>
            <p>Configure o WhatsApp de reserva para botão direto na vitrine do evento</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function EventoForm({
  evento,
  onSubmit,
  onCancel,
  loading,
  onImageUpload,
}: {
  evento: any
  onSubmit: (data: {
    titulo: string
    tipo: string
    data_inicio: string | null
    data_fim: string | null
    ativo: boolean
    descricao?: string | null
    artista?: string | null
    whatsapp_reserva?: string | null
    link_externo?: string | null
    cor?: string | null
    banner_url?: string | null
    estabelecimento_id?: string
  }) => Promise<void>
  onCancel: () => void
  loading: boolean
  onImageUpload: (file: File) => Promise<string>
}) {
  const isEditing = !!evento
  const [currentImage, setCurrentImage] = useState(evento?.banner_url || '')

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventoFormData>({
    resolver: yupResolver(eventoSchema),
    defaultValues: {
      titulo: evento?.titulo || '',
      tipo: evento?.tipo || 'evento',
      descricao: evento?.descricao || '',
      artista: evento?.artista || '',
      whatsapp_reserva: evento?.whatsapp_reserva || WHATSAPP_DEFAULT,
      data_inicio: evento?.data_inicio ? format(new Date(evento.data_inicio), "yyyy-MM-dd'T'HH:mm") : '',
      data_fim: evento?.data_fim ? format(new Date(evento.data_fim), "yyyy-MM-dd'T'HH:mm") : '',
      cor: evento?.cor || '#EF4444',
      link_externo: evento?.link_externo || '',
      ativo: evento?.ativo !== false,
      banner_url: evento?.banner_url || '',
    },
    mode: 'onChange',
  })

  // Watch cor input to sync color picker with text input
  const watchedCor = watch('cor')

  const handleFormSubmitWrapper = async (data: EventoFormData) => {
    // Convert data_inicio and data_fim to ISO strings for the API
    const payload = {
      ...data,
      data_inicio: data.data_inicio ? new Date(data.data_inicio).toISOString() : null,
      data_fim: data.data_fim ? new Date(data.data_fim).toISOString() : null,
    }
    await onSubmit(payload as any)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Evento' : 'Novo Evento'}</h1>
          <p className="text-gray-500">{isEditing ? 'Atualize as informações do evento' : 'Crie um evento, show ou promoção para sua vitrine'}</p>
        </div>
      </div>

      <Card padding="lg">
        <form onSubmit={handleFormSubmit(handleFormSubmitWrapper)} className="space-y-6">
          {/* Banner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Banner do Evento (16:9)
            </label>
            <ImageUpload
              onUpload={async (file: File) => {
                const url = await onImageUpload(file)
                setCurrentImage(url)
                setValue('banner_url', url)
                return url
              }}
              value={currentImage}
              onChange={setCurrentImage}
              accept="image/*"
              maxSizeMB={5}
              aspectRatio="16/9"
            />
            <p className="text-xs text-gray-500 mt-1">Recomendado: 1200x675px. Aparece no card do evento e na seção de destaque.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <Input
                {...register('titulo')}
                placeholder="Ex: Sexta com Música Ao Vivo, Happy Hour, Festival de Bacalhau"
                error={errors.titulo?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
              <Select
                {...register('tipo')}
                options={tiposEvento.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
                error={errors.tipo?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <Textarea
              {...register('descricao')}
              placeholder="Descreva o evento... (aparece no card e na seção de destaque)"
              rows={3}
            />
          </div>

          {/* Campos Especiais para Shows/Eventos Musicais */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-red-50 rounded-xl border border-purple-100">
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Music className="h-5 w-5 text-red-500" />
              Detalhes para Shows e Música Ao Vivo
            </label>
            <p className="text-xs text-gray-600 mb-4">Estes campos aparecem em destaque na vitrine quando o tipo for "Show"</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artista / Atração</label>
                <Input
                  {...register('artista')}
                  placeholder="Ex: Banda Acústica Raízes, DJ João, Roda de Samba"
                  error={errors.artista?.message}
                />
                <p className="text-xs text-gray-500 mt-1">Nome do artista/banda - aparece em destaque na vitrine</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp para Reservas</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  <Input
                    {...register('whatsapp_reserva')}
                    type="tel"
                    placeholder="5543999389549"
                    className="pl-10"
                    error={errors.whatsapp_reserva?.message}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Apenas números. Botão "Reservar Mesa" aparece no evento.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
              <Input
                {...register('data_inicio')}
                type="datetime-local"
                error={errors.data_inicio?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
              <Input
                {...register('data_fim')}
                type="datetime-local"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Evento</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={watchedCor || '#EF4444'}
                  onChange={(e) => setValue('cor', e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  {...register('cor')}
                  type="text"
                  placeholder="#EF4444"
                  className="flex-1 font-mono text-sm"
                  error={errors.cor?.message}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Cor da borda esquerda do card e badges na vitrine</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Externo (Ingressos/Site)</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register('link_externo')}
                  type="url"
                  placeholder="https://exemplo.com/ingressos"
                  className="pl-10"
                  error={errors.link_externo?.message}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Botão "Ingressos/Link" aparece no card do evento</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('ativo')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Evento ativo na vitrine</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}