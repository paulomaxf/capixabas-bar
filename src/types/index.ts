export interface GalleryItem {
  id: string
  type: 'image'
  url: string
}

export interface Estabelecimento {
  id: string
  nome: string
  slug: string
  cnpj: string | null
  endereco: Record<string, any> | null
  telefone: string | null
  email: string | null
  logo_url: string | null
  capa_url: string | null
  descricao: string | null
  horario_funcionamento: Record<string, any> | null
  galeria: GalleryItem[] | null
  configuracoes: Record<string, any>
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface EstabelecimentoInsert extends Omit<Estabelecimento, 'id' | 'created_at' | 'updated_at'> {}
export interface EstabelecimentoUpdate extends Partial<EstabelecimentoInsert> {}

export interface Categoria {
  id: string
  estabelecimento_id: string
  nome: string
  descricao: string | null
  icone: string | null
  cor: string
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CategoriaInsert extends Omit<Categoria, 'id' | 'created_at' | 'updated_at'> {}
export interface CategoriaUpdate extends Partial<CategoriaInsert> {}

export type ProdutoDisponibilidade = 'indisponivel' | 'disponivel' | 'com_estoque'

export interface Produto {
  id: string
  estabelecimento_id: string
  categoria_id: string | null
  codigo_interno: string | null
  nome: string
  descricao: string | null
  valor: number
  custo: number | null
  disponibilidade: ProdutoDisponibilidade
  qtd_estoque: number
  unidade: string
  imagem_url: string | null
  destaque: boolean
  visivel_vitrine: boolean
  opcoes_preparo: any[]
  tags: string[]
  ativo: boolean
  created_at: string
  updated_at: string
  categorias?: Categoria
}

export interface ProdutoInsert extends Omit<Produto, 'id' | 'created_at' | 'updated_at' | 'categorias'> {}
export interface ProdutoUpdate extends Partial<ProdutoInsert> {}

export type EventoTipo = 'show' | 'promocao' | 'evento' | 'fechado' | 'reservado' | 'outro'

export interface Evento {
  id: string
  estabelecimento_id: string
  titulo: string
  descricao: string | null
  tipo: EventoTipo
  data_inicio: string
  data_fim: string | null
  recorrencia: Record<string, any> | null
  banner_url: string | null
  cor: string
  link_externo: string | null
  artista: string | null
  whatsapp_reserva: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface EventoInsert extends Omit<Evento, 'id' | 'created_at' | 'updated_at'> {}
export interface EventoUpdate extends Partial<EventoInsert> {}

export interface Perfil {
  id: string
  estabelecimento_id: string | null
  nome: string | null
  papel: 'owner' | 'gerente' | 'editor'
  created_at: string
}

export interface PerfilInsert extends Omit<Perfil, 'created_at'> {}