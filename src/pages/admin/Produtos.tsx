import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProdutosAdmin, useCategoriasAdmin, useCriarProduto, useAtualizarProduto, useExcluirProduto, useUploadProdutoImagem, useReordenarProdutos, useToggleProdutoTag } from '../../hooks/useAdmin'
import { Plus, Search, Edit, Trash2, Image, Loader2, ArrowLeft, Star, Zap, Sparkles, Trophy, Copy, Check, GripVertical, ShoppingBag, Calendar } from 'lucide-react'
import { Button, Input, Select, ConfirmDialog, ImageUpload, Card, Badge } from '../../components/ui'
import { useAuth } from '../../lib/auth'

const unidades = ['UN', 'KG', 'G', 'L', 'ML', 'CX', 'PCT', 'BD', 'LT']
const disponibilidades = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'indisponivel', label: 'Indisponível' },
  { value: 'sob_encomenda', label: 'Sob Encomenda' },
]


export default function Produtos() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isEditing = !!params.id
  const { perfil } = useAuth()
  const estabelecimentoId = perfil?.estabelecimento_id || ''

  const { data: produtos, isLoading: loadingProdutos, refetch: refetchProdutos } = useProdutosAdmin(estabelecimentoId)
  const { data: categorias } = useCategoriasAdmin(estabelecimentoId)
  const createProduto = useCriarProduto()
  const updateProduto = useAtualizarProduto()
  const deleteProduto = useExcluirProduto()
  const uploadImage = useUploadProdutoImagem()
  const reordenarProdutos = useReordenarProdutos()
  const toggleTag = useToggleProdutoTag()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(isEditing)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [editingProduto, setEditingProduto] = useState<any>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Load product for editing
  if (isEditing && !editingProduto && produtos) {
    const prod = produtos.find(p => p.id === params.id)
    if (prod) setEditingProduto(prod)
  }

  const handleSubmit = async (data: any) => {
    console.log('[handleSubmit] Dados recebidos do form:', JSON.stringify(data, null, 2))
    console.log('[handleSubmit] isEditing:', isEditing, 'params.id:', params.id)
    console.log('[handleSubmit] estabelecimentoId:', estabelecimentoId)
    console.log('[handleSubmit] perfil:', perfil)

    // Handle tags - already an array from form, don't split
    const tags = Array.isArray(data.tags)
      ? data.tags
      : data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []

    // Only include fields that exist in the database schema / TypeScript types
    const { combinac, combinag, grupoc, ...restData } = data
    const valor = Number(restData.valor)
    console.log('[handleSubmit] valor convertido:', valor, 'original:', restData.valor)

    if (isNaN(valor)) {
      alert('Valor inválido. Digite um número válido.')
      return
    }

    const payload = {
      ...restData,
      valor,
      destaque: Boolean(restData.destaque),
      ativo: Boolean(restData.ativo),
      tags,
    }

    console.log('[handleSubmit] Payload final:', JSON.stringify(payload, null, 2))

    try {
      if (isEditing) {
        console.log('[handleSubmit] Atualizando produto:', params.id)
        await updateProduto.mutateAsync({ id: params.id!, ...payload })
      } else {
        console.log('[handleSubmit] Criando novo produto')
        if (!estabelecimentoId) {
          console.error('[handleSubmit] ERRO: estabelecimentoId está vazio!')
          alert('Erro: Estabelecimento não identificado. Faça login novamente.')
          return
        }
        // Include image URL and estabelecimento_id for new products
        const payloadWithImage = {
          ...payload,
          estabelecimento_id: estabelecimentoId,
          imagem_url: restData.imagem_url || null,
        }
        console.log('[handleSubmit] Payload com imagem:', JSON.stringify(payloadWithImage, null, 2))
        await createProduto.mutateAsync(payloadWithImage)
      }

      console.log('[handleSubmit] Sucesso! Fechando formulário...')
      // Success - close form and navigate back
      setShowForm(false)
      setEditingProduto(null)
      navigate('/admin/produtos')
      refetchProdutos()
    } catch (error: any) {
      console.error('[handleSubmit] ERRO COMPLETO:', error)
      console.error('[handleSubmit] Error message:', error?.message)
      console.error('[handleSubmit] Error code:', error?.code)
      console.error('[handleSubmit] Error details:', error?.details)
      console.error('[handleSubmit] Error hint:', error?.hint)
      // Show user-friendly error message
      const message = error?.message || error?.code || 'Erro desconhecido ao salvar produto'
      alert(`Erro ao salvar produto: ${message}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduto.mutateAsync(id)
      refetchProdutos()
    } catch (error: any) {
      console.error('[handleDelete] Erro ao excluir produto:', error)
      // Show user-friendly error message
      const message = error?.message || error?.code || 'Erro desconhecido ao excluir produto'
      alert(`Erro ao excluir produto: ${message}`)
    } finally {
      setShowDeleteDialog(null)
    }
  }

  const handleImageUpload = async (file: File) => {
    // For new products, use a temporary ID to upload the image first
    // The image will be associated with the product after creation
    const produtoId = editingProduto?.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const result = await uploadImage.mutateAsync({ produtoId, file })
    return result || ''
  }

  const handleReorder = async (produtoId: string, newOrdem: number) => {
    try {
      await reordenarProdutos.mutateAsync({ produtoId, ordem: newOrdem })
      refetchProdutos()
    } catch (error) {
      console.error('Erro ao reordenar:', error)
    }
  }

  const openEdit = (prod: any) => {
    setEditingProduto(prod)
    setShowForm(true)
  }

  const openNew = () => {
    setEditingProduto(null)
    setShowForm(true)
  }

  const duplicateProduto = async (prod: any) => {
    try {
      await createProduto.mutateAsync({
        ...prod,
        nome: `${prod.nome} (Cópia)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        estabelecimento_id: estabelecimentoId,
      })
      refetchProdutos()
    } catch (error) {
      console.error('Erro ao duplicar:', error)
    }
  }

  const toggleDestaque = async (prod: any) => {
    try {
      await updateProduto.mutateAsync({ id: prod.id, destaque: !prod.destaque })
      refetchProdutos()
    } catch (error) {
      console.error('Erro ao alternar destaque:', error)
    }
  }

  const handleToggleTag = (prod: any, tag: string) => {
    const currentlyHasTag = prod.tags?.includes(tag) || false
    toggleTag.mutate({ id: prod.id, tag, add: !currentlyHasTag })
  }

  const filteredProdutos = produtos?.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  ) || []

  if (showForm) {
    return (
      <ProdutoForm
        produto={editingProduto}
        categorias={categorias || []}
        onSubmit={handleSubmit}
        onCancel={() => { setShowForm(false); setEditingProduto(null); navigate('/admin/produtos') }}
        loading={createProduto.isPending || updateProduto.isPending}
        onImageUpload={handleImageUpload}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com Ações Rápidas */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos & Cardápio</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie os produtos da sua vitrine digital</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openNew} className="w-full sm:w-auto">
            Novo Produto
          </Button>
          <Button variant="outline" size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={() => {}} className="w-full sm:w-auto">
            Novidades
          </Button>
          <Button variant="outline" size="sm" icon={<Zap className="h-4 w-4" />} onClick={() => {}} className="w-full sm:w-auto">
            Mais Pedidos
          </Button>
          <Button variant="outline" size="sm" icon={<ShoppingBag className="h-4 w-4" />} onClick={() => window.open('/capixabas-bar', '_blank')} className="w-full sm:w-auto">
            Vitrine
          </Button>
          <Button variant="outline" size="sm" icon={<Image className="h-4 w-4" />} onClick={() => window.open('/admin', '_blank')} className="w-full sm:w-auto">
            Config
          </Button>
          <Button variant="outline" size="sm" icon={<Calendar className="h-4 w-4" />} onClick={() => window.open('/admin/eventos', '_blank')} className="w-full sm:w-auto">
            Eventos
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <Card padding="sm" className="bg-gray-50 border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
          <div className="p-2">
            <p className="text-xl font-bold text-gray-900">{produtos?.length || 0}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="p-2">
            <p className="text-xl font-bold text-green-600">{produtos?.filter(p => p.ativo && p.disponibilidade === 'disponivel').length || 0}</p>
            <p className="text-[10px] text-gray-500">Disponíveis</p>
          </div>
          <div className="p-2">
            <p className="text-xl font-bold text-amber-600">{produtos?.filter(p => p.destaque).length || 0}</p>
            <p className="text-[10px] text-gray-500">Em Destaque</p>
          </div>
          <div className="p-2">
            <p className="text-xl font-bold text-primary-600">{produtos?.filter(p => p.tags?.includes('novidade')).length || 0}</p>
            <p className="text-[10px] text-gray-500">Novidades</p>
          </div>
          <div className="p-2">
            <p className="text-xl font-bold text-red-600">{produtos?.filter(p => p.tags?.includes('mais-pedido')).length || 0}</p>
            <p className="text-[10px] text-gray-500">Mais Pedidos</p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar produtos por nome, descrição ou tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Products Table */}
      <Card padding="none">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider w-8 hidden md:table-cell">Ordem</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider w-10">Img</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Produto</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell min-w-[80px]">Categoria</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider w-24">Valor</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[70px]">Status</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell min-w-[100px]">Badges</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider w-36">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingProdutos ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredProdutos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500 text-sm">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProdutos.map((prod, index) => (
                  <tr key={prod.id} className={`hover:bg-gray-50 transition-colors ${draggingId === prod.id ? 'bg-blue-50' : ''}`} draggable onDragStart={() => setDraggingId(prod.id)} onDragEnd={() => setDraggingId(null)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (draggingId && draggingId !== prod.id) handleReorder(draggingId, index + 1) }}>
                    {/* Drag Handle / Ordem */}
                    <td className="px-2 py-1.5 hidden md:table-cell">
                      <button
                        className="p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                        onClick={(e) => { e.stopPropagation(); }}
                        title="Arraste para reordenar"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                    </td>

                    {/* Imagem */}
                    <td className="px-2 py-1.5">
                      {prod.imagem_url ? (
                        <img src={prod.imagem_url} alt={prod.nome} className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Image className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                      )}
                    </td>

                    {/* Nome + Descrição */}
                    <td className="px-2 py-1.5">
                      <div className="flex items-start gap-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{prod.nome}</p>
                          {prod.descricao && <p className="text-[10px] text-gray-500 line-clamp-1">{prod.descricao}</p>}
                        </div>
                        {prod.ativo && prod.disponibilidade === 'disponivel' && (
                          <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded hidden sm:inline-flex">
                            <Check className="h-2 w-2" /> Vitrine
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-2 py-1.5 hidden lg:table-cell">
                      {prod.categoria_id ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                          {categorias?.find(c => c.id === prod.categoria_id)?.nome || '—'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">Sem categoria</span>
                      )}
                    </td>

                    {/* Valor */}
                    <td className="px-2 py-1.5">
                      <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                        {prod.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      {prod.unidade !== 'UN' && <span className="text-gray-500 ml-1 text-[10px]">/{prod.unidade}</span>}
                    </td>

                    {/* Status */}
                    <td className="px-2 py-1.5 hidden md:table-cell">
                      <Badge
                        variant={
                          prod.disponibilidade === 'disponivel' ? 'success' :
                          prod.disponibilidade === 'indisponivel' ? 'danger' :
                          'warning'
                        }
                        size="sm"
                        className="px-1.5 py-0.5"
                      >
                        {disponibilidades.find(d => d.value === prod.disponibilidade)?.label || prod.disponibilidade}
                      </Badge>
                      {!prod.ativo && (
                        <Badge variant="secondary" size="sm" className="ml-1 px-1 py-0.5">Inativo</Badge>
                      )}
                    </td>

                    {/* Badges Especiais */}
                    <td className="px-2 py-1.5 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {prod.destaque && (
                          <Badge variant="secondary" size="sm" className="bg-amber-100 text-amber-700 border-amber-200 px-1.5 py-0.5">
                            <Star className="h-2 w-2 mr-0.5" /> Destaque
                          </Badge>
                        )}
                        {prod.tags?.includes('novidade') && (
                          <Badge variant="secondary" size="sm" className="bg-primary-100 text-primary-700 border-primary-200 px-1.5 py-0.5">
                            <Sparkles className="h-2 w-2 mr-0.5" /> Novidade
                          </Badge>
                        )}
                        {prod.tags?.includes('mais-pedido') && (
                          <Badge variant="secondary" size="sm" className="bg-red-100 text-red-700 border-red-200 px-1.5 py-0.5">
                            <Zap className="h-2 w-2 mr-0.5" /> Mais Pedido
                          </Badge>
                        )}
                        {prod.tags?.includes('promocao') && (
                          <Badge variant="secondary" size="sm" className="bg-green-100 text-green-700 border-green-200 px-1.5 py-0.5">
                            <Trophy className="h-2 w-2 mr-0.5" /> Promoção
                          </Badge>
                        )}
                        {!prod.destaque && !prod.tags?.some((t: string) => ['novidade', 'mais-pedido', 'promocao'].includes(t)) && (
                          <span className="text-[10px] text-gray-400 px-1 py-0.5 bg-gray-50 rounded">Sem badges</span>
                        )}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {/* Quick Toggle Destaque */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDestaque(prod)}
                          aria-label={prod.destaque ? 'Remover destaque' : 'Marcar como destaque'}
                          className={prod.destaque ? 'text-amber-600 p-1' : 'text-gray-400 hover:text-amber-600 p-1'}
                        >
                          <Star className={`h-3.5 w-3.5 ${prod.destaque ? 'fill-current' : ''}`} />
                        </Button>

                        {/* Quick Toggle Novidade */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTag(prod, 'novidade')}
                          aria-label={prod.tags?.includes('novidade') ? 'Remover novidade' : 'Marcar como novidade'}
                          className={prod.tags?.includes('novidade') ? 'text-primary-600 p-1' : 'text-gray-400 hover:text-primary-600 p-1'}
                        >
                          <Sparkles className={`h-3.5 w-3.5 ${prod.tags?.includes('novidade') ? 'fill-current' : ''}`} />
                        </Button>

                        {/* Quick Toggle Mais Pedido */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTag(prod, 'mais-pedido')}
                          aria-label={prod.tags?.includes('mais-pedido') ? 'Remover mais pedido' : 'Marcar como mais pedido'}
                          className={prod.tags?.includes('mais-pedido') ? 'text-red-600 p-1' : 'text-gray-400 hover:text-red-600 p-1'}
                        >
                          <Zap className={`h-3.5 w-3.5 ${prod.tags?.includes('mais-pedido') ? 'fill-current' : ''}`} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(prod)}
                          icon={<Edit className="h-3.5 w-3.5" />}
                          aria-label="Editar"
                          className="p-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateProduto(prod)}
                          icon={<Copy className="h-3.5 w-3.5" />}
                          aria-label="Duplicar"
                          className="text-gray-400 hover:text-blue-600 p-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteDialog(prod.id)}
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          aria-label="Excluir"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                        />
                      </div>
                    </td>
                  </tr>
                ))
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
          title="Excluir Produto"
          message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          variant="destructive"
          loading={deleteProduto.isPending}
        />
      )}

      {/* Legenda dos Badges */}
      <Card padding="md" className="bg-gray-50 border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" /> Entenda os badges que aparecem na vitrine:
        </p>
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            <Star className="h-3 w-3 mr-1 fill-current" /> Destaque = Aparece com anel dourado e no topo
          </Badge>
          <Badge variant="secondary" className="bg-primary-100 text-primary-700 border-primary-200">
            <Sparkles className="h-3 w-3 mr-1 fill-current" /> Novidade = Badge "✨ Novidade" no card
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
            <Zap className="h-3 w-3 mr-1 fill-current" /> Mais Pedido = Badge "🔥 Mais Pedido" no card
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            <Trophy className="h-3 w-3 mr-1 fill-current" /> Promoção = Badge "🏷️ Promoção" no card
          </Badge>
        </div>
      </Card>
    </div>
  )
}

// Need to import Info icon
import { Info } from 'lucide-react'

function ProdutoForm({
  produto,
  categorias,
  onSubmit,
  onCancel,
  loading,
  onImageUpload,
}: {
  produto: any
  categorias: any[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  loading: boolean
  onImageUpload: (file: File) => Promise<string>
}) {
  const isEditing = !!produto
  const [currentImage, setCurrentImage] = useState(produto?.imagem_url || '')
  const [formData, setFormData] = useState({
    nome: produto?.nome || '',
    categoria_id: produto?.categoria_id || '',
    descricao: produto?.descricao || '',
    valor: produto?.valor || '',
    unidade: produto?.unidade || 'UN',
    disponibilidade: produto?.disponibilidade || 'disponivel',
    destaque: produto?.destaque || false,
    tags: produto?.tags || [],
    ordem: produto?.ordem || 0,
    ativo: produto?.ativo !== false,
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tags: checked
        ? [...new Set([...prev.tags, tag])]
        : prev.tags.filter((t: string) => t !== tag)
    }))
  }

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.nome?.trim()) {
      alert('Nome do produto é obrigatório')
      return
    }
    if (!formData.valor || Number(formData.valor) <= 0) {
      alert('Valor deve ser maior que zero')
      return
    }
    // Categoria is optional but warn if not selected
    if (!formData.categoria_id) {
      const confirmSave = window.confirm('Nenhuma categoria selecionada. Deseja continuar mesmo assim?')
      if (!confirmSave) return
    }

    const payload = {
      ...formData,
      imagem_url: currentImage,
      valor: Number(formData.valor),
      destaque: Boolean(formData.destaque),
      ativo: Boolean(formData.ativo),
      tags: formData.tags,
    }
    onSubmit(payload)
  }

  // Build category options: only active categories, but include current category if it's inactive (for editing)
  const activeCategories = categorias.filter((c: any) => c.ativo)
  const currentCat = categorias.find((c: any) => c.id === formData.categoria_id)
  const categoryOptions = currentCat && !currentCat.ativo
    ? [...activeCategories, currentCat].map((c: any) => ({ value: c.id, label: c.nome + (c.ativo ? '' : ' (inativa)') }))
    : activeCategories.map((c: any) => ({ value: c.id, label: c.nome }))

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h1>
          <p className="text-gray-500 text-sm">{isEditing ? 'Atualize as informações do produto' : 'Preencha os dados para cadastrar um novo produto'}</p>
        </div>
      </div>

      <Card padding="md" className="sm:p-6">
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* Imagem com Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Imagem do Produto
            </label>
            <ImageUpload
              onUpload={async (file: File) => {
                const url = await onImageUpload(file)
                setCurrentImage(url)
                return url
              }}
              value={currentImage}
              onChange={setCurrentImage}
              accept="image/*"
              maxSizeMB={5}
              aspectRatio="1"
            />
            {currentImage && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Imagem atualizada
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <Input
                name="nome"
                placeholder="Ex: X-Burger Especial"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <Select
                name="categoria_id"
                options={categoryOptions}
                placeholder="Selecione uma categoria"
                value={formData.categoria_id}
                onChange={(e) => handleChange('categoria_id', e.target.value)}
              />
              {categorias.some((c: any) => !c.ativo) && (
                <p className="mt-1 text-xs text-gray-500">
                  Apenas categorias ativas são mostradas. <a href="/admin/categorias" className="underline hover:text-primary-600">Gerenciar categorias</a>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              name="descricao"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Descreva o produto... (aparece no card da vitrine)"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
              <Input
                type="number"
                name="valor"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <Select
                name="unidade"
                options={unidades.map(u => ({ value: u, label: u }))}
                value={formData.unidade}
                onChange={(e) => handleChange('unidade', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilidade</label>
              <Select
                name="disponibilidade"
                options={disponibilidades}
                value={formData.disponibilidade}
                onChange={(e) => handleChange('disponibilidade', e.target.value)}
              />
            </div>
          </div>

          {/* Badges Especiais - Seção Destacada */}
          <div className="p-3 bg-gradient-to-r from-primary-50 to-amber-50 rounded-lg border border-primary-100">
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Badges Especiais na Vitrine
            </label>
            <p className="text-xs text-gray-600 mb-2">Marque as opções para destacar o produto na vitrine do cliente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.destaque}
                  onChange={(e) => handleChange('destaque', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-900">⭐ Destaque Principal</span>
                <span className="ml-auto text-[10px] text-gray-500">Anel dourado + topo da lista</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.tags.includes('novidade')}
                  onChange={(e) => handleTagChange('novidade', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-900">✨ Novidade</span>
                <span className="ml-auto text-[10px] text-gray-500">Badge roxo no card</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.tags.includes('mais-pedido')}
                  onChange={(e) => handleTagChange('mais-pedido', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-900">🔥 Mais Pedido</span>
                <span className="ml-auto text-[10px] text-gray-500">Badge vermelho no card</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.tags.includes('promocao')}
                  onChange={(e) => handleTagChange('promocao', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-900">🏷️ Promoção</span>
                <span className="ml-auto text-[10px] text-gray-500">Badge verde no card</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags Adicionais (vírgula)</label>
              <Input
                placeholder="Ex: vegetariano, sem glúten, apimentado"
                value={formData.tags.filter((t: string) => !['novidade', 'mais-pedido', 'promocao', 'destaque'].includes(t)).join(', ')}
                onChange={(e) => {
                  const extraTags = e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean)
                  const specialTags = formData.tags.filter((t: string) => ['novidade', 'mais-pedido', 'promocao', 'destaque'].includes(t))
                  handleChange('tags', [...specialTags, ...extraTags])
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição</label>
              <Input
                type="number"
                name="ordem"
                min="0"
                value={formData.ordem}
                onChange={(e) => handleChange('ordem', Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.ativo}
              onChange={(e) => handleChange('ativo', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Produto ativo na vitrine</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}