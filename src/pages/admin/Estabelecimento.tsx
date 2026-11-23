import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEstabelecimentoAdmin, useAtualizarEstabelecimento, useUploadEstabelecimentoImagem } from '../../hooks/useAdmin'
import { uploadGalleryImage } from '../../lib/supabase'
import { Save, Loader2, Building2, MapPin, Phone, Clock, Image, Camera, Zap, Star, Music, Palette, Trash2, CheckCircle, AlertCircle, RotateCcw, Plus } from 'lucide-react'
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardContent, ImageUpload, Badge, Modal } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import type { GalleryItem } from '../../types'

const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
const diasLabels = { dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado' }

export default function Estabelecimento() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const estabelecimentoId = perfil?.estabelecimento_id || ''

  const { data: estab, isLoading, refetch } = useEstabelecimentoAdmin(estabelecimentoId)
  const updateEstabelecimento = useAtualizarEstabelecimento()
  const uploadLogo = useUploadEstabelecimentoImagem()
  const uploadCapa = useUploadEstabelecimentoImagem()

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    telefone: '',
    endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
    horario_funcionamento: {} as Record<string, { abre: string; fecha: string; fechado: boolean }>,
    logo_url: '',
    capa_url: '',
    galeria: [] as GalleryItem[],
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState<'logo' | 'capa' | null>(null)
  const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)

  // Initialize form data and gallery when estab loads
  useEffect(() => {
    if (estab && !isLoading) {
      const galeria = (estab as any).galeria || []
      const items: GalleryItem[] = galeria.map((item: any, index: number) => {
        if (typeof item === 'string') {
          return {
            id: `gallery-${index}-${Date.now()}`,
            type: 'image' as const,
            url: item,
          }
        }
        // Ensure existing items have the correct type
        return { ...item, type: 'image' as const }
      })
      setFormData({
        nome: estab.nome || '',
        descricao: estab.descricao || '',
        telefone: estab.telefone || '',
        endereco: (estab.endereco as { rua: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; cep: string }) || { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
        horario_funcionamento: estab.horario_funcionamento || {},
        logo_url: estab.logo_url || '',
        capa_url: estab.capa_url || '',
        galeria: items,
      })
      setGalleryItems(items)
    }
  }, [estab, isLoading])

  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleEnderecoChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, [field]: value } }))
  }, [])

  const handleHorarioChange = useCallback((dia: string, field: 'abre' | 'fecha' | 'fechado', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      horario_funcionamento: {
        ...prev.horario_funcionamento,
        [dia]: { ...prev.horario_funcionamento[dia], [field]: value },
      },
    }))
  }, [])

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    setUploading('logo')
    try {
      const url = await uploadLogo.mutateAsync({ file, tipo: 'logo' })
      if (url) {
        setMessage({ type: 'success', text: 'Logo atualizada com sucesso!' })
        return url
      }
      return null
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao fazer upload da logo: ${error.message}` })
      return null
    } finally {
      setUploading(null)
    }
  }

  const handleCapaUpload = async (file: File): Promise<string | null> => {
    setUploading('capa')
    try {
      const url = await uploadCapa.mutateAsync({ file, tipo: 'capa' })
      if (url) {
        setMessage({ type: 'success', text: 'Capa atualizada com sucesso!' })
        return url
      }
      return null
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao fazer upload da capa: ${error.message}` })
      return null
    } finally {
      setUploading(null)
    }
  }

  const handleRemoveImage = (tipo: 'logo' | 'capa') => {
    handleChange(`${tipo}_url`, '')
    setMessage({ type: 'success', text: `${tipo === 'logo' ? 'Logo' : 'Capa'} removida.` })
  }

  const handleGalleryUpload = async (files: FileList) => {
    if (!estabelecimentoId) {
      setMessage({ type: 'error', text: 'Erro: ID do estabelecimento não encontrado.' })
      return
    }

    setUploadingGallery(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadGalleryImage(estabelecimentoId, file)
        return { url, type: 'image' as const }
      })
      const results = await Promise.all(uploadPromises)
      const newItems: GalleryItem[] = results.map((r, index) => ({
        id: `gallery-${Date.now()}-${index}`,
        type: r.type,
        url: r.url,
      }))
      // Use functional update to avoid stale closure
      setGalleryItems(prev => {
        const updated = [...prev, ...newItems]
        // Also update formData.galeria via functional setFormData
        setFormData(formPrev => ({ ...formPrev, galeria: updated }))
        return updated
      })
      setMessage({ type: 'success', text: `${newItems.length} foto(s) adicionada(s) à galeria!` })
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao fazer upload: ${error.message}` })
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleRemoveGalleryItem = (index: number) => {
    setGalleryItems(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setFormData(formPrev => ({ ...formPrev, galeria: updated }))
      return updated
    })
    setMessage({ type: 'success', text: 'Item removido da galeria.' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!estabelecimentoId) {
      setMessage({ type: 'error', text: 'Erro: ID do estabelecimento não encontrado. Recarregue a página.' })
      return
    }
    if (!formData.nome?.trim()) {
      setMessage({ type: 'error', text: 'Erro: Nome do estabelecimento é obrigatório.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Use galleryItems state directly to ensure latest gallery is saved
      const dataToSave = {
        ...formData,
        galeria: galleryItems,
      }

      // Debug: log the payload being sent
      console.log('[Estabelecimento] Salvando:', JSON.stringify(dataToSave, null, 2))

      const result = await updateEstabelecimento.mutateAsync({ id: estabelecimentoId, ...dataToSave })

      // Debug: log the result
      console.log('[Estabelecimento] Salvo com sucesso:', result)

      setMessage({ type: 'success', text: 'Salvo com sucesso!' })
      refetch()
    } catch (error: any) {
      // Log full error for debugging
      console.error('[Estabelecimento] Erro ao salvar:', error)
      console.error('[Estabelecimento] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      })

      // Show the actual error message for debugging
      const errorMessage = error?.message || error?.error?.message || error?.details || 'Erro ao salvar. Tente novamente.'
      setMessage({ type: 'error', text: `Erro ao salvar: ${errorMessage}` })
    } finally {
      setSaving(false)
    }
  }

  const handleQuickSetup = (tipo: 'logo' | 'capa' | 'evento' | 'horario' | 'menu' | 'fotos') => {
    switch (tipo) {
      case 'logo':
      case 'capa':
      case 'horario':
        // Scroll to the relevant section
        const element = document.getElementById(`section-${tipo}`)
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      case 'evento':
        navigate('/admin/eventos')
        break
      case 'menu':
        navigate('/admin/produtos')
        break
      case 'fotos':
        setShowGalleryModal(true)
        break
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const hasLogo = !!formData.logo_url
  const hasCapa = !!formData.capa_url
  const hasHorario = Object.keys(formData.horario_funcionamento).length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Estabelecimento</h1>
            <p className="text-gray-500 mt-1">Gerencie as informações da sua vitrine digital</p>
          </div>
        </div>

        {/* Ações Rápidas - Shortcuts para o dono */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" icon={<Zap className="h-4 w-4" />} onClick={() => handleQuickSetup('logo')}>
            Trocar Logo
          </Button>
          <Button variant="outline" size="sm" icon={<Image className="h-4 w-4" />} onClick={() => handleQuickSetup('capa')}>
            Trocar Capa
          </Button>
          <Button variant="outline" size="sm" icon={<Music className="h-4 w-4" />} onClick={() => handleQuickSetup('evento')}>
            Próximo Evento
          </Button>
          <Button variant="outline" size="sm" icon={<Clock className="h-4 w-4" />} onClick={() => handleQuickSetup('horario')}>
            Ajustar Horários
          </Button>
          <Button variant="outline" size="sm" icon={<Star className="h-4 w-4" />} onClick={() => handleQuickSetup('menu')}>
            Cardápio
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => handleQuickSetup('fotos')}>
            Galeria
          </Button>
        </div>
      </div>

      {/* Status Visual - Quick Overview */}
      <Card padding="md" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasLogo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {hasLogo ? <CheckCircle className="h-5 w-5" /> : <Image className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Logo</p>
              <p className="text-xs text-gray-500">{hasLogo ? 'Configurada' : 'Não definida'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasCapa ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {hasCapa ? <CheckCircle className="h-5 w-5" /> : <Image className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Capa/Banner</p>
              <p className="text-xs text-gray-500">{hasCapa ? 'Configurada' : 'Não definida'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasHorario ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {hasHorario ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Horários</p>
              <p className="text-xs text-gray-500">{hasHorario ? 'Configurados' : 'Pendentes'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-100 text-primary-600">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Cores/Tema</p>
              <p className="text-xs text-gray-500">Padrão do sistema</p>
            </div>
          </div>
        </div>
      </Card>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo e Capa - Seção Principal com Preview Grande */}
        <Card padding="lg" id="section-logo">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Imagens da Vitrine
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => { if (hasLogo) handleRemoveImage('logo'); if (hasCapa) handleRemoveImage('capa'); }}>
                  Limpar Tudo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo - Preview Grande */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Logo do Estabelecimento
                  {hasLogo && <Badge variant="success" size="sm">Ativa</Badge>}
                </label>
                <ImageUpload
                  onUpload={handleLogoUpload}
                  onChange={(url) => handleChange('logo_url', url)}
                  value={formData.logo_url}
                  accept="image/*"
                  maxSizeMB={2}
                  aspectRatio="1"
                  placeholder="Logo quadrada (1:1) - 200x200px recomendado"
                  disabled={uploading === 'logo'}
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Exibida no cabeçalho da vitrine, rodapé e admin</span>
                  {uploading === 'logo' && <span className="text-primary-600">Enviando...</span>}
                </div>
                {hasLogo && (
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} className="text-red-600 hover:text-red-700" onClick={() => handleRemoveImage('logo')}>
                    Remover Logo
                  </Button>
                )}
              </div>

              {/* Capa - Preview Grande */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Capa / Banner Principal
                  {hasCapa && <Badge variant="success" size="sm">Ativa</Badge>}
                </label>
                <ImageUpload
                  onUpload={handleCapaUpload}
                  onChange={(url) => handleChange('capa_url', url)}
                  value={formData.capa_url}
                  accept="image/*"
                  maxSizeMB={5}
                  aspectRatio="16/9"
                  placeholder="Banner retangular (16:9) - 1200x675px recomendado"
                  disabled={uploading === 'capa'}
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Imagem de fundo do cabeçalho da vitrine (hero section)</span>
                  {uploading === 'capa' && <span className="text-primary-600">Enviando...</span>}
                </div>
                {hasCapa && (
                  <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} className="text-red-600 hover:text-red-700" onClick={() => handleRemoveImage('capa')}>
                    Remover Capa
                  </Button>
                )}
              </div>
            </div>

            {/* Preview da Vitrine */}
            {(hasLogo || hasCapa) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Preview de como aparece na vitrine
                </p>
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <div className="aspect-video relative bg-gradient-to-br from-gray-800 to-gray-900">
                    {hasCapa && (
                      <img
                        src={formData.capa_url}
                        alt="Preview capa"
                        className="w-full h-full object-cover opacity-60"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                      <div>
                        {hasLogo && (
                          <img
                            src={formData.logo_url}
                            alt="Preview logo"
                            className="h-16 w-auto rounded-lg shadow-xl"
                          />
                        )}
                        <h2 className="text-white text-xl md:text-2xl font-bold mt-2 drop-shadow-lg">{formData.nome || 'Nome do Estabelecimento'}</h2>
                      </div>
                      <div className="text-right text-white">
                        <p className="text-sm opacity-80">Vitrine Digital</p>
                        <p className="text-xs opacity-60">Configurado via Admin</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card padding="lg" id="section-capa">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento *</label>
              <Input
                name="nome"
                placeholder="Ex: Capixaba's Bar"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <Textarea
                name="descricao"
                placeholder="Descreva seu estabelecimento... (aparece no hero da vitrine)"
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Texto exibido abaixo do nome no cabeçalho da vitrine</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone para WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  name="telefone"
                  placeholder="(43) 99938-9549"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Usado nos botões de WhatsApp da vitrine (apenas números: 43999389549)</p>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço Completo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                <Input name="rua" placeholder="Av. Beira Mar" value={formData.endereco.rua} onChange={(e) => handleEnderecoChange('rua', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <Input name="numero" placeholder="1500" value={formData.endereco.numero} onChange={(e) => handleEnderecoChange('numero', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <Input name="complemento" placeholder="Loja 12, Bloco B" value={formData.endereco.complemento} onChange={(e) => handleEnderecoChange('complemento', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <Input name="bairro" placeholder="Praia do Canto" value={formData.endereco.bairro} onChange={(e) => handleEnderecoChange('bairro', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <Input name="cidade" placeholder="Vitória" value={formData.endereco.cidade} onChange={(e) => handleEnderecoChange('cidade', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <Input name="estado" placeholder="ES" value={formData.endereco.estado} onChange={(e) => handleEnderecoChange('estado', e.target.value)} maxLength={2} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <Input name="cep" placeholder="29055-000" value={formData.endereco.cep} onChange={(e) => handleEnderecoChange('cep', e.target.value)} />
            </div>
            <p className="text-xs text-gray-500">Usado no botão "Como Chegar" (Google Maps) e no rodapé da vitrine</p>
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card padding="lg" id="section-horario">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Configure os horários para exibir o badge "Aberto/Fechado" automaticamente na vitrine</p>
            <div className="space-y-3">
              {diasSemana.map((dia) => {
                const horario = formData.horario_funcionamento[dia] || { abre: '', fecha: '', fechado: false }
                return (
                  <div key={dia} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                    <div className="w-24 flex-shrink-0 font-medium text-gray-700 capitalize">
                      {diasLabels[dia as keyof typeof diasLabels]}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={horario.fechado}
                        onChange={(e) => handleHorarioChange(dia, 'fechado', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Fechado</span>
                    </label>
                    <div className={`flex-1 flex items-center gap-2 ${horario.fechado ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Input
                        type="time"
                        name={`abre_${dia}`}
                        value={horario.abre}
                        onChange={(e) => handleHorarioChange(dia, 'abre', e.target.value)}
                        className="w-28"
                        disabled={horario.fechado}
                        placeholder="Abre"
                      />
                      <span className="text-gray-400">às</span>
                      <Input
                        type="time"
                        name={`fecha_${dia}`}
                        value={horario.fecha}
                        onChange={(e) => handleHorarioChange(dia, 'fecha', e.target.value)}
                        className="w-28"
                        disabled={horario.fechado}
                        placeholder="Fecha"
                      />
                    </div>
                    {horario.abre && horario.fecha && !horario.fechado && (
                      <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded">
                        {horario.abre} – {horario.fecha}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <strong>Dica:</strong> Marque 'Fechado' para dias que não abre. O badge na vitrine atualiza automaticamente baseado no horário atual.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Galeria de Fotos */}
        <Card padding="lg" id="section-fotos">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Galeria de Fotos da Vitrine
              </CardTitle>
              <Button variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowGalleryModal(true)}>
                + Adicionar Foto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Adicione fotos do ambiente, pratos, eventos para enriquecer a vitrine digital</p>
            {galleryItems.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <Image className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma foto na galeria</p>
                <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Foto" para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {galleryItems.map((item, index) => (
                  <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={item.url} alt={`Galeria ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="text-white hover:text-red-300" onClick={() => handleRemoveGalleryItem(index)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 flex justify-end">
                      <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">{index + 1}</span>
                    </div>
                    <div className="absolute top-1 left-1">
                      <span className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">🖼️</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {galleryItems.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                Total: {galleryItems.length} foto(s). Passe o mouse para remover.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
            Voltar ao Dashboard
          </Button>
          <Button type="submit" icon={<Save className="h-4 w-4" />} loading={saving} size="lg">
            Salvar Todas as Alterações
          </Button>
        </div>
      </form>

      {/* Gallery Modal */}
      <Modal isOpen={showGalleryModal} onClose={() => setShowGalleryModal(false)} title="Adicionar Foto à Galeria" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione uma ou mais fotos para adicionar à galeria da vitrine.
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)}
              className="sr-only"
              id="gallery-upload"
              disabled={uploadingGallery}
            />
            <label htmlFor="gallery-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <Image className="h-12 w-12 text-gray-400" />
              <span className="text-gray-600">Clique ou arraste fotos aqui</span>
              <span className="text-xs text-gray-400">PNG, JPG até 5MB cada</span>
            </label>
          </div>
          {uploadingGallery && (
            <div className="flex items-center gap-2 text-primary-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enviando imagens...</span>
            </div>
          )}
          {galleryItems.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Fotos atuais na galeria ({galleryItems.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {galleryItems.map((item, index) => (
                  <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={item.url} alt={`Galeria ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}