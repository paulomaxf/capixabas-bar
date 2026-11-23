import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Estabelecimento, Categoria, Produto, Evento } from '../types'

// ============================================
// ESTABELECIMENTO (por slug - URL amigável)
// ============================================
export function useEstabelecimento(slug: string) {
  return useQuery({
    queryKey: ['estabelecimento', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .single()
      if (error) throw error
      return data as Estabelecimento
    },
    enabled: !!slug,
    staleTime: 30 * 1000, // 30 seconds - vitrine needs fresh data for gallery updates
    gcTime: 2 * 60 * 1000, // 2 minutes cache garbage collection
    retry: 1,
  })
}

// ============================================
// CATEGORIAS (públicas do estabelecimento)
// ============================================
export function useCategorias(estabelecimentoId: string) {
  return useQuery({
    queryKey: ['categorias', estabelecimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .order('ordem')
      if (error) throw error
      return data as Categoria[]
    },
    enabled: !!estabelecimentoId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// PRODUTOS (vitrine pública - agrupados por categoria)
// ============================================
export function useProdutosVitrine(
  estabelecimentoId: string,
  opts?: {
    categoriaId?: string
    apenasDestaques?: boolean
    busca?: string
  }
) {
  return useQuery({
    queryKey: ['produtos', 'vitrine', estabelecimentoId, opts],
    queryFn: async () => {
      // Use explicit join with !inner to get categoria ordem, avoid PostgREST foreign table ordering bug
      let query = supabase
        .from('produtos')
        .select('*, categorias!inner(nome, cor, icone, ordem)')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .eq('visivel_vitrine', true)
        .order('destaque', { ascending: false })
        .order('nome')

      if (opts?.categoriaId) query = query.eq('categoria_id', opts.categoriaId)
      if (opts?.apenasDestaques) query = query.eq('destaque', true)
      if (opts?.busca) query = query.ilike('nome', `%${opts.busca}%`)

      const { data, error } = await query
      if (error) throw error

      // Sort by categoria ordem then by destaque/nome in JavaScript
      const sorted = (data as (Produto & { categorias: Categoria })[]).sort((a, b) => {
        const ordemA = a.categorias?.ordem ?? 999
        const ordemB = b.categorias?.ordem ?? 999
        if (ordemA !== ordemB) return ordemA - ordemB
        // Destaque first
        if (a.destaque !== b.destaque) return a.destaque ? -1 : 1
        return (a.nome || '').localeCompare(b.nome || '')
      })

      return sorted
    },
    enabled: !!estabelecimentoId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================
// EVENTOS VIGENTES
// ============================================
export function useEventosVigentes(estabelecimentoId: string) {
  const now = new Date().toISOString()
  return useQuery({
    queryKey: ['eventos', 'vigentes', estabelecimentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .or(`data_fim.is.null,data_fim.gte.${now}`)
        .order('data_inicio')

      if (error) {
        console.error('[useEventosVigentes] Erro na query:', error)
        throw error
      }

      return data as Evento[]
    },
    enabled: !!estabelecimentoId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 2 * 60 * 1000,
    retry: 1,
  })
}

// ============================================
// PRODUTO ÚNICO (para detalhes)
// ============================================
export function useProduto(produtoId: string) {
  return useQuery({
    queryKey: ['produto', produtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(*)')
        .eq('id', produtoId)
        .single()
      if (error) throw error
      return data as Produto & { categorias: Categoria }
    },
    enabled: !!produtoId,
  })
}