import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../lib/auth'
import { LayoutDashboard, Package, Tag, Calendar, Settings, LogOut, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Produtos', href: '/admin/produtos', icon: Package },
  { name: 'Categorias', href: '/admin/categorias', icon: Tag },
  { name: 'Eventos', href: '/admin/eventos', icon: Calendar },
  { name: 'Estabelecimento', href: '/admin/estabelecimento', icon: Building2 },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

export default function AdminLayout() {
  const { user, perfil, signOut, loading } = useAuth()
  const { isAuthenticated } = useRequireAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } hidden lg:flex flex-col`}
        aria-label="Menu lateral"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <span className="font-bold text-xl text-blue-600 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              RoomHouse
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navegação principal">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
                ${!sidebarOpen ? 'justify-center' : ''}
              `}
              title={sidebarOpen ? undefined : item.name}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {sidebarOpen && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{perfil?.nome || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{perfil?.papel || 'editor'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center" title={perfil?.nome || user?.email} />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu lateral mobile"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <span className="font-bold text-xl text-blue-600 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            RoomHouse
          </span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Fechar menu"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col lg:ml-64 min-w-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Abrir menu"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
              >
                {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm text-gray-500 hidden sm:block truncate max-w-xs">
                {perfil?.estabelecimento_id ? `Estabelecimento: ${perfil.estabelecimento_id.slice(0, 8)}...` : 'Nenhum estabelecimento'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 lg:p-6 min-w-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}