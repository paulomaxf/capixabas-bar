import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, uploadImage } from '../lib/supabase'
import type { Estabelecimento, Categoria, Produto, Evento, CategoriaInsert, ProdutoInsert, EventoInsert } from '../types'

// ============================================
// ESTABELECIMENTO (admin)
// ============================================
export function useEstabelecimentoAdmin(estabelecimentoId: string) {
  return useQuery({
    queryKey: ['estabelecimento', 'admin', estabelecimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('id', estabelecimentoId)
        .single()
      if (error) throw error
      return data as Estabelecimento
    },
    enabled: !!estabelecimentoId,
  })
}

export function useAtualizarEstabelecimento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Estabelecimento> & { id: string }) => {
      const { id, ...updateData } = updates

      // Debug: log what's being sent to Supabase
      const payloadStr = JSON.stringify(updateData)
      const payloadSizeKB = (payloadStr.length / 1024).toFixed(2)
      console.log('[useAtualizarEstabelecimento] Update payload size:', `${payloadSizeKB} KB`)
      console.log('[useAtualizarEstabelecimento] Update payload:', payloadStr.length > 5000 ? payloadStr.substring(0, 5000) + '... (truncated)' : payloadStr)

      const { data, error } = await supabase
        .from('estabelecimentos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[useAtualizarEstabelecimento] Supabase error:', error)
        // Log full error details for debugging
        console.error('[useAtualizarEstabelecimento] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }

      console.log('[useAtualizarEstabelecimento] Success:', data)
      return data as Estabelecimento
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimento'] })
      queryClient.setQueryData(['estabelecimento', 'admin', data.id], data)
    },
  })
}

export function useUploadEstabelecimentoImagem() {
  return useMutation({
    mutationFn: async ({ file, tipo }: { file: File; tipo: 'logo' | 'capa' }) => {
      const ext = file.name.split('.').pop()
      const path = `estabelecimentos/${tipo}s/${Date.now()}.${ext}`
      return uploadImage('public', path, file)
    },
  })
}

// ============================================
// CATEGORIAS (admin)
// ============================================
export function useCategoriasAdmin(estabelecimentoId: string) {
  return useQuery({
    queryKey: ['categorias', 'admin', estabelecimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('ordem')
      if (error) throw error
      return data as Categoria[]
    },
    enabled: !!estabelecimentoId,
  })
}

export function useCriarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categoria: CategoriaInsert) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert(categoria)
        .select()
        .single()
      if (error) throw error
      return data as Categoria
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categorias', 'admin', variables.estabelecimento_id] })
    },
  })
}

export function useAtualizarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Categoria> & { id: string }) => {
      const { id, ...updateData } = updates
      const { data, error } = await supabase
        .from('categorias')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Categoria
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias', 'admin'] })
    },
  })
}

export function useExcluirCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categorias').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias', 'admin'] })
    },
  })
}

export function useReordenarCategorias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categorias: { id: string; ordem: number }[]) => {
      const updates = categorias.map((cat, index) =>
        supabase.from('categorias').update({ ordem: index }).eq('id', cat.id)
      )
      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias', 'admin'] })
    },
  })
}

// ============================================
// PRODUTOS (admin)
// ============================================
export function useProdutosAdmin(estabelecimentoId: string) {
  return useQuery({
    queryKey: ['produtos', 'admin', estabelecimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias!inner(nome, ordem)')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('nome')
      if (error) throw error

      // Sort by categoria ordem then by nome in JavaScript to avoid PostgREST foreign table ordering issues
      const sorted = (data as (Produto & { categorias: { nome: string; ordem: number } })[]).sort((a, b) => {
        const ordemA = a.categorias?.ordem ?? 999
        const ordemB = b.categorias?.ordem ?? 999
        if (ordemA !== ordemB) return ordemA - ordemB
        return (a.nome || '').localeCompare(b.nome || '')
      })

      return sorted
    },
    enabled: !!estabelecimentoId,
  })
}

export function useCriarProduto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (produto: ProdutoInsert) => {
      console.log('[useCriarProduto] Inserindo produto:', JSON.stringify(produto, null, 2))
      const { data, error } = await supabase
        .from('produtos')
        .insert(produto)
        .select()
        .single()
      if (error) {
        console.error('[useCriarProduto] Erro Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }
      console.log('[useCriarProduto] Produto criado:', data)
      return data as Produto
    },
    onSuccess: (_data, variables) => {
      console.log('[useCriarProduto] Sucesso, invalidando cache para:', variables.estabelecimento_id)
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin', variables.estabelecimento_id] })
    },
    onError: (error) => {
      console.error('[useCriarProduto] Mutation error:', error)
    },
  })
}

export function useAtualizarProduto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Produto> & { id: string }) => {
      console.log('[useAtualizarProduto] Atualizando:', JSON.stringify(updates, null, 2))
      const { id, ...updateData } = updates
      const { data, error } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('[useAtualizarProduto] Erro Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }
      console.log('[useAtualizarProduto] Produto atualizado:', data)
      return data as Produto
    },
    onSuccess: () => {
      console.log('[useAtualizarProduto] Sucesso, invalidando cache')
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin'] })
    },
    onError: (error) => {
      console.error('[useAtualizarProduto] Mutation error:', error)
    },
  })
}

export function useToggleProdutoStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Produto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin'] })
    },
  })
}

export function useToggleProdutoDestaque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, destaque }: { id: string; destaque: boolean }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update({ destaque })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Produto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin'] })
    },
  })
}

export function useExcluirProduto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('[useExcluirProduto] Deleting product:', id)
      // Hard delete - remove from database completely
      const { error } = await supabase.from('produtos').delete().eq('id', id)
      if (error) {
        console.error('[useExcluirProduto] Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }
      console.log('[useExcluirProduto] Product deleted successfully:', id)
    },
    onSuccess: (_data, variables) => {
      console.log('[useExcluirProduto] Invalidating cache for produtos admin')
      // Invalidate both specific and general cache keys
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin', variables] })
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin'] })
    },
    onError: (error) => {
      console.error('[useExcluirProduto] Mutation error:', error)
    },
  })
}

export function useUploadProdutoImagem() {
  return useMutation({
    mutationFn: async ({ produtoId, file }: { produtoId: string; file: File }) => {
      const ext = file.name.split('.').pop()
      const path = `produtos/${produtoId}/${Date.now()}.${ext}`
      return uploadImage('public', path, file)
    },
  })
}

export function useReordenarProdutos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ produtoId, ordem }: { produtoId: string; ordem: number }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update({ ordem })
        .eq('id', produtoId)
        .select()
        .single()
      if (error) throw error
      return data as Produto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin'] })
    },
  })
}

export function useToggleProdutoTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, tag, add }: { id: string; tag: string; add: boolean }) => {
      const { data: current, error: fetchError } = await supabase
        .from('produtos')
        .select('tags')
        .eq('id', id)
        .single()
      if (fetchError) throw fetchError

      const currentTags = (current?.tags as string[]) || []
      const newTags = add
        ? [...new Set([...currentTags, tag])]
        : currentTags.filter((t: string) => t !== tag)

      const { data, error } = await supabase
        .from('produtos')
        .update({ tags: newTags })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Produto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', 'admin'] })
    },
  })
}

// ============================================
// EVENTOS (admin)
// ============================================
export function useEventosAdmin(estabelecimentoId: string) {
  return useQuery({
    queryKey: ['eventos', 'admin', estabelecimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('data_inicio', { ascending: false })
      if (error) throw error
      return data as Evento[]
    },
    enabled: !!estabelecimentoId,
  })
}

export function useCriarEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (evento: EventoInsert) => {
      console.log('[useCriarEvento] Creating event:', JSON.stringify(evento, null, 2))
      const { data, error } = await supabase
        .from('eventos')
        .insert(evento)
        .select()
        .single()
      if (error) {
        console.error('[useCriarEvento] Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }
      console.log('[useCriarEvento] Event created:', data)
      return data as Evento
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventos', 'admin', variables.estabelecimento_id] })
      queryClient.invalidateQueries({ queryKey: ['eventos', 'vigentes', variables.estabelecimento_id] })
    },
  })
}

export function useAtualizarEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Evento> & { id: string }) => {
      const { id, ...updateData } = updates
      console.log('[useAtualizarEvento] Updating event:', id, JSON.stringify(updateData, null, 2))
      const { data, error } = await supabase
        .from('eventos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('[useAtualizarEvento] Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }
      console.log('[useAtualizarEvento] Event updated:', data)
      return data as Evento
    },
    onSuccess: (_data, variables) => {
      // variables contém o payload original passado para mutateAsync
      const estabId = (variables as any).estabelecimento_id
      console.log('[useAtualizarEvento] Cache invalidation for estabId:', estabId)
      queryClient.invalidateQueries({ queryKey: ['eventos', 'admin', estabId] })
      queryClient.invalidateQueries({ queryKey: ['eventos', 'admin'] })
      queryClient.invalidateQueries({ queryKey: ['eventos', 'vigentes', estabId] })
    },
  })
}

export function useExcluirEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('eventos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos', 'admin'] })
    },
  })
}

export function useUploadEventoBanner() {
  return useMutation({
    mutationFn: async ({ eventoId, file, estabelecimentoId }: { eventoId: string; file: File; estabelecimentoId: string }) => {
      const ext = file.name.split('.').pop()
      // Path deve começar com estabelecimento_id para passar na política RLS
      const path = `${estabelecimentoId}/eventos/${eventoId}/${Date.now()}.${ext}`
      console.log('[useUploadEventoBanner] Uploading to bucket "eventos":', { path, fileType: file.type, fileSize: file.size })
      const url = await uploadImage('eventos', path, file)
      console.log('[useUploadEventoBanner] Upload successful, URL:', url)
      return url
    },
  })
}

// ============================================
// AUTH (admin)
// ============================================
export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: perfil } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .single()

      return { user, perfil }
    },
    staleTime: 5 * 60 * 1000,
  })
}