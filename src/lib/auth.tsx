import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import type { Perfil } from '../types'

interface AuthContextType {
  user: { id: string; email: string } | null
  perfil: Perfil | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  updatePerfil: (updates: Partial<Perfil>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
        await fetchPerfil(session.user.id)
      }
      setLoading(false)
    }
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
        await fetchPerfil(session.user.id)
      } else {
        setUser(null)
        setPerfil(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchPerfil = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setPerfil(data)
      else setPerfil(null)
    } catch {
      // If perfil doesn't exist or error, set to null but don't block
      setPerfil(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchPerfil(session.user.id)
    }
  }

  const updatePerfil = async (updates: Partial<Perfil>) => {
    if (!user) return { error: new Error('Usuário não autenticado') }
    const { error } = await supabase
      .from('perfis')
      .update(updates)
      .eq('id', user.id)
    if (error) return { error: new Error(error.message) }
    await fetchPerfil(user.id)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signIn, signOut, refreshSession, updatePerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export function useRequireAuth() {
  const { user, loading } = useAuth()
  return { user, loading, isAuthenticated: !!user }
}

export function useRequireRole(...roles: Perfil['papel'][]) {
  const { perfil, loading } = useAuth()
  const hasRole = perfil ? roles.includes(perfil.papel) : false
  return { perfil, loading, hasRole, isAuthorized: hasRole && !loading }
}