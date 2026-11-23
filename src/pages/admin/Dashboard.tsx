import { useEstabelecimentoAdmin, useCategoriasAdmin, useProdutosAdmin, useEventosAdmin } from '../../hooks/useAdmin'
import { useAuth } from '../../lib/auth'
import { Package, Tag, Calendar, Building2, AlertCircle, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui'

export default function Dashboard() {
  const { perfil } = useAuth()
  const estabelecimentoId = perfil?.estabelecimento_id || ''

  const { data: estab } = useEstabelecimentoAdmin(estabelecimentoId)
  const { data: categorias } = useCategoriasAdmin(estabelecimentoId)
  const { data: produtos } = useProdutosAdmin(estabelecimentoId)
  const { data: eventos } = useEventosAdmin(estabelecimentoId)

  const stats = [
    {
      name: 'Produtos Ativos',
      value: produtos?.filter(p => p.ativo).length || 0,
      icon: Package,
      color: 'bg-blue-500',
      trend: '+12%',
      trendColor: 'text-green-600',
    },
    {
      name: 'Categorias',
      value: categorias?.filter(c => c.ativo).length || 0,
      icon: Tag,
      color: 'bg-purple-500',
      trend: '+2',
      trendColor: 'text-green-600',
    },
    {
      name: 'Eventos Ativos',
      value: eventos?.filter(e => e.ativo).length || 0,
      icon: Calendar,
      color: 'bg-orange-500',
      trend: '+5',
      trendColor: 'text-green-600',
    },
    {
      name: 'Estabelecimento',
      value: estab ? 'Configurado' : 'Pendente',
      icon: Building2,
      color: estab ? 'bg-green-500' : 'bg-yellow-500',
      trend: estab ? 'Completo' : 'Configurar',
      trendColor: estab ? 'text-green-600' : 'text-yellow-600',
    },
  ]

  const recentProducts = produtos?.slice(0, 5) || []
  const upcomingEvents = eventos?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral da sua vitrine digital</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className={`text-sm font-medium mt-1 ${stat.trendColor}`}>{stat.trend}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/admin/produtos/novo"
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Package className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Novo Produto</span>
              </a>
              <a
                href="/admin/categorias/novo"
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <Tag className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Nova Categoria</span>
              </a>
              <a
                href="/admin/eventos/novo"
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors"
              >
                <Calendar className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Novo Evento</span>
              </a>
              <a
                href="/admin/estabelecimento"
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <Building2 className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Configurar Loja</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card padding="md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produtos Recentes</CardTitle>
            <a href="/admin/produtos" className="text-sm text-blue-600 hover:underline">Ver todos</a>
          </CardHeader>
          <CardContent>
            {recentProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum produto cadastrado</p>
                <a href="/admin/produtos/novo" className="mt-3 inline-block text-blue-600 hover:underline text-sm">
                  Criar primeiro produto
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProducts.map((prod) => (
                  <div key={prod.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {prod.imagem_url && (
                      <img src={prod.imagem_url} alt={prod.nome} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{prod.nome}</p>
                      <p className="text-sm text-gray-500">
                        {prod.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {prod.categoria_id && <span className="mx-2">•</span>}
                        {prod.categoria_id && 'Categoria'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      prod.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {prod.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card padding="md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximos Eventos</CardTitle>
            <a href="/admin/eventos" className="text-sm text-blue-600 hover:underline">Ver todos</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((evt) => (
                <div key={evt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-10 rounded" style={{ backgroundColor: evt.cor }} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{evt.titulo}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(evt.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      {evt.data_fim && ` – ${new Date(evt.data_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    evt.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {evt.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Checklist */}
      {!estab && (
        <Card variant="outlined" padding="md" className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Configuração Incompleta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              Sua vitrine ainda não está configurada. Complete as informações do estabelecimento para começar a exibir seu cardápio.
            </p>
            <a href="/admin/estabelecimento" className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              Configurar Estabelecimento
              <TrendingUp className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}