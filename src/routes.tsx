import { createBrowserRouter, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/admin/Dashboard'
import Produtos from './pages/admin/Produtos'
import Categorias from './pages/admin/Categorias'
import Eventos from './pages/admin/Eventos'
import Estabelecimento from './pages/admin/Estabelecimento'
import Configuracoes from './pages/admin/Configuracoes'
import Vitrine from './pages/vitrine/Vitrine'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/capixabas-bar" replace />,
  },
  {
    path: '/:slug',
    element: <Vitrine />,
  },
  {
    path: '/admin/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'produtos', element: <Produtos /> },
      { path: 'produtos/novo', element: <Produtos /> },
      { path: 'produtos/:id', element: <Produtos /> },
      { path: 'categorias', element: <Categorias /> },
      { path: 'categorias/novo', element: <Categorias /> },
      { path: 'categorias/:id', element: <Categorias /> },
      { path: 'eventos', element: <Eventos /> },
      { path: 'eventos/novo', element: <Eventos /> },
      { path: 'eventos/:id', element: <Eventos /> },
      { path: 'estabelecimento', element: <Estabelecimento /> },
      { path: 'configuracoes', element: <Configuracoes /> },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
          <p className="text-gray-500">A página que você procura não existe.</p>
        </div>
      </div>
    ),
  },
])