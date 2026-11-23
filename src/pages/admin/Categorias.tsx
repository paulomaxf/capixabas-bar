import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCategoriasAdmin, useCriarCategoria, useAtualizarCategoria, useExcluirCategoria, useReordenarCategorias } from '../../hooks/useAdmin'
import { useAuth } from '../../lib/auth'
import { Plus, Search, Edit, Trash2, GripVertical, Loader2, ArrowLeft } from 'lucide-react'
import { Button, Input, ConfirmDialog, Card } from '../../components/ui'

export default function Categorias() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isEditing = !!params.id
  const { perfil } = useAuth()
  const estabelecimentoId = perfil?.estabelecimento_id || ''

  const { data: categorias, isLoading: loadingCategorias, refetch: refetchCategorias } = useCategoriasAdmin(estabelecimentoId)
  const createCategoria = useCriarCategoria()
  const updateCategoria = useAtualizarCategoria()
  const deleteCategoria = useExcluirCategoria()
  const reorderCategorias = useReordenarCategorias()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(isEditing)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [editingCategoria, setEditingCategoria] = useState<any>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Load category for editing
  if (isEditing && !editingCategoria && categorias) {
    const cat = categorias.find(c => c.id === params.id)
    if (cat) setEditingCategoria(cat)
  }

  const handleSubmit = async (data: any) => {
    const payload = {
      ...data,
      ativo: Boolean(data.ativo),
      ordem: Number(data.ordem) || 0,
    }

    try {
      if (isEditing) {
        await updateCategoria.mutateAsync({ id: params.id!, ...payload })
      } else {
        await createCategoria.mutateAsync({ ...payload, estabelecimento_id: estabelecimentoId })
      }
      setShowForm(false)
      setEditingCategoria(null)
      navigate('/admin/categorias')
      refetchCategorias()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCategoria.mutateAsync(id)
      refetchCategorias()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
    } finally {
      setShowDeleteDialog(null)
    }
  }

  const handleReorder = async (newOrder: { id: string; ordem: number }[]) => {
    try {
      await reorderCategorias.mutateAsync(newOrder)
      refetchCategorias()
    } catch (error) {
      console.error('Erro ao reordenar:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) return

    const items = [...(categorias || [])]
    const fromIndex = items.findIndex(c => c.id === draggingId)
    const toIndex = items.findIndex(c => c.id === targetId)

    if (fromIndex === -1 || toIndex === -1) return

    const [removed] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, removed)

    const newOrder = items.map((item, index) => ({
      id: item.id,
      ordem: index,
    }))

    handleReorder(newOrder)
    setDraggingId(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  const openEdit = (cat: any) => {
    setEditingCategoria(cat)
    setShowForm(true)
  }

  const openNew = () => {
    setEditingCategoria(null)
    setShowForm(true)
  }

  const filteredCategorias = categorias?.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  ) || []

  if (showForm) {
    return (
      <CategoriaForm
        categoria={editingCategoria}
        onSubmit={handleSubmit}
        onCancel={() => { setShowForm(false); setEditingCategoria(null); navigate('/admin/categorias') }}
        loading={createCategoria.isPending || updateCategoria.isPending}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">Organize seu cardápio por categorias</p>
        </div>
        <Button onClick={openNew} icon={<Plus className="h-4 w-4" />}>
          Nova Categoria
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar categorias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories List with Drag & Drop */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            Arraste e solte para reordenar as categorias na vitrine
          </p>
        </div>

        {loadingCategorias ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhuma categoria encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCategorias.map((cat) => (
              <div
                key={cat.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cat.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, cat.id)}
                onDragEnd={handleDragEnd}
                className={`p-4 flex items-center gap-4 transition-colors ${
                  draggingId === cat.id ? 'bg-blue-50 opacity-50' : 'hover:bg-gray-50'
                }`}
              >
                <GripVertical
                  className="h-6 w-6 text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0"
                  aria-label="Arrastar para reordenar"
                />
                {cat.icone && (
                  <span className="text-2xl">{cat.icone}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900 truncate">{cat.nome}</p>
                    {cat.cor && (
                      <span
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: cat.cor }}
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Ordem: {cat.ordem}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    cat.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cat.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} icon={<Edit className="h-4 w-4" />} aria-label="Editar" />
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(cat.id)} icon={<Trash2 className="h-4 w-4" />} aria-label="Excluir" className="text-red-600 hover:text-red-700 hover:bg-red-50" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen
          onClose={() => setShowDeleteDialog(null)}
          onConfirm={() => handleDelete(showDeleteDialog!)}
          title="Excluir Categoria"
          message="Tem certeza que deseja excluir esta categoria? Os produtos vinculados ficarão sem categoria."
          confirmText="Excluir"
          variant="destructive"
          loading={deleteCategoria.isPending}
        />
      )}
    </div>
  )
}

function CategoriaForm({
  categoria,
  onSubmit,
  onCancel,
  loading,
}: {
  categoria: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  loading: boolean
}) {
  const isEditing = !!categoria

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h1>
          <p className="text-gray-500">{isEditing ? 'Atualize as informações da categoria' : 'Crie uma nova categoria para organizar seus produtos'}</p>
        </div>
      </div>

      <Card padding="lg">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <Input
              name="nome"
              placeholder="Ex: Lanches, Bebidas, Sobremesas"
              defaultValue={categoria?.nome || ''}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ícone (Emoji)</label>
              <Input
                name="icone"
                placeholder="🍔"
                defaultValue={categoria?.icone || ''}
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="cor"
                  defaultValue={categoria?.cor || '#3B82F6'}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  name="cor"
                  type="text"
                  placeholder="#3B82F6"
                  defaultValue={categoria?.cor || '#3B82F6'}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição</label>
              <Input
                type="number"
                name="ordem"
                min="0"
                defaultValue={categoria?.ordem || 0}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer w-full">
                <input
                  type="checkbox"
                  name="ativo"
                  defaultChecked={categoria?.ativo !== false}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Categoria ativa na vitrine</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}