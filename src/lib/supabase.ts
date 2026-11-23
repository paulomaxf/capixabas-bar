import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Copie .env.example para .env e preencha com suas credenciais do Supabase.'
  )
}

// Custom fetch with timeout to prevent "Failed to fetch" errors on slow networks
const fetchWithTimeout = async (url: RequestInfo | URL, options: RequestInit = {}, timeout = 30000): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error: any) {
    clearTimeout(id)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

// Use untyped client to avoid complex type inference issues with manual types
// Type safety is enforced via manual assertions in hooks (e.g., `as Estabelecimento`)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    fetch: fetchWithTimeout,
  },
})

// Helper para tipagem do user autenticado
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Helper para upload de imagens - SEM fallback base64 (evita payloads gigantes e falhas silenciosas)
export const uploadImage = async (
  bucket: string,
  path: string,
  file: File
): Promise<string> => {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
    contentType: file.type,
  })

  if (error) {
    // Log detalhado para debugging
    console.error(`[uploadImage] Erro no bucket "${bucket}" path "${path}":`, {
      message: error.message,
      statusCode: error.statusCode,
    })

    // Erro claro e acionável para o usuário
    let message = error.message || 'Erro desconhecido no upload'
    if (message.includes('row-level security') || message.includes('RLS')) {
      message = `Permissão negada no Storage (RLS). Configure as políticas do bucket "${bucket}". Verifique: 1) Bucket existe e é público, 2) Políticas RLS permitem upload com path começando pelo estabelecimento_id, 3) Usuário autenticado tem perfil com estabelecimento_id.`
    } else if (message.includes('File size') || message.includes('size limit')) {
      message = `Arquivo excede o limite de tamanho do bucket "${bucket}" (máx: ${getBucketSizeLimit(bucket)}MB).`
    } else if (message.includes('mime') || message.includes('content-type')) {
      message = `Tipo de arquivo não permitido no bucket "${bucket}". Verifique allowed_mime_types no Supabase.`
    } else if (Number(error.statusCode) === 400) {
      message = `Erro 400 no upload: ${message}. Verifique se o bucket "${bucket}" existe e aceita este tipo/tamanho de arquivo.`
    } else if (Number(error.statusCode) === 404) {
      message = `Bucket "${bucket}" não encontrado. Execute o script de setup do bucket no SQL Editor do Supabase.`
    }
    throw new Error(`Falha no upload: ${message}`)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  console.log(`[uploadImage] Upload bem-sucedido: ${data.publicUrl}`)
  return data.publicUrl
}

// Helper para obter limite de tamanho do bucket (para mensagens de erro)
const getBucketSizeLimit = (bucket: string): number => {
  const limits: Record<string, number> = {
    'eventos': 10,
    'produtos': 5,
    'estabelecimento': 5,
  }
  return limits[bucket] || 5
}

// Helper para upload de imagens da galeria no bucket do estabelecimento
// Suporta: image/jpeg, image/png, image/webp, image/gif
// Reutiliza uploadImage para evitar duplicação e garantir tratamento de erros consistente
export const uploadGalleryImage = async (
  estabelecimentoId: string,
  file: File
): Promise<string> => {
  // Validar tipo de arquivo - apenas imagens
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não suportado: ${file.type}. Use JPG, PNG, WebP ou GIF.`)
  }

  // Validar tamanho (5MB para imagens)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Limite: 5MB`)
  }

  const ext = file.name.split('.').pop() || 'jpg'
  // Path deve começar com estabelecimento_id para passar na política RLS
  const path = `${estabelecimentoId}/galeria/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`

  return uploadImage('estabelecimento', path, file)
}

// Helper para deletar imagens do Storage
export const deleteImage = async (bucket: string, path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) {
      console.error(`[deleteImage] Erro ao deletar do bucket "${bucket}" path "${path}":`, error)
      throw error
    }
    console.log(`[deleteImage] Deletado com sucesso: ${bucket}/${path}`)
  } catch (storageError: any) {
    // Log detalhado mas não falha silenciosamente
    console.error(`[deleteImage] Erro ao deletar:`, {
      message: storageError?.message,
      code: storageError?.code,
      statusCode: storageError?.statusCode,
    })
    throw storageError
  }
}