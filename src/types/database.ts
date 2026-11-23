import type { Estabelecimento, Categoria, Produto, Evento, Perfil } from './index'

export interface Database {
  public: {
    Tables: {
      estabelecimentos: {
        Row: Estabelecimento
        Insert: Omit<Estabelecimento, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Estabelecimento, 'id' | 'created_at' | 'updated_at'>>
      }
      categorias: {
        Row: Categoria
        Insert: Omit<Categoria, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Categoria, 'id' | 'created_at' | 'updated_at'>>
      }
      produtos: {
        Row: Produto
        Insert: Omit<Produto, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Produto, 'id' | 'created_at' | 'updated_at'>>
      }
      eventos: {
        Row: Evento
        Insert: Omit<Evento, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Evento, 'id' | 'created_at' | 'updated_at'>>
      }
      perfis: {
        Row: Perfil
        Insert: Omit<Perfil, 'created_at'>
        Update: Partial<Omit<Perfil, 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      produto_disponibilidade: 'indisponivel' | 'disponivel' | 'com_estoque'
      evento_tipo: 'show' | 'promocao' | 'evento' | 'fechado' | 'reservado' | 'outro'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}