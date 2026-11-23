import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { User, Shield, Key, Bell, Palette, Save, AlertCircle } from 'lucide-react'
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent } from '../../components/ui'

const papéis = [
  { value: 'owner', label: 'Proprietário' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'editor', label: 'Editor' },
]

const temas = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

const idiomas = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
]

export default function Configuracoes() {
  const { user, perfil, updatePerfil } = useAuth()
  const [activeTab, setActiveTab] = useState<'perfil' | 'aparencia' | 'notificacoes' | 'seguranca'>('perfil')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    nome: perfil?.nome || '',
    email: user?.email || '',
    papel: perfil?.papel || 'editor',
    tema: 'system',
    idioma: 'pt-BR',
    notificacoes_email: true,
    notificacoes_push: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSavePerfil = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const result = await updatePerfil({ nome: formData.nome })
      if (result.error) throw result.error
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAparencia = async () => {
    setSaving(true)
    setMessage(null)
    try {
      // Save to localStorage for now, could be saved to user preferences in DB
      localStorage.setItem('tema', formData.tema)
      localStorage.setItem('idioma', formData.idioma)
      setMessage({ type: 'success', text: 'Preferências salvas!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar.' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const { supabase } = await import('../../lib/supabase')
      const { error } = await supabase.auth.updateUser({ password: formData.newPassword })
      if (error) throw error
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha. Verifique a senha atual.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <Shield className="h-7 w-7 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 mt-1">Gerencie suas preferências e conta</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3" aria-label="Configurações">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'perfil' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4 inline mr-1" />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('aparencia')}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'aparencia' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Palette className="h-4 w-4 inline mr-1" />
            Aparência
          </button>
          <button
            onClick={() => setActiveTab('notificacoes')}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'notificacoes' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell className="h-4 w-4 inline mr-1" />
            Notificações
          </button>
          <button
            onClick={() => setActiveTab('seguranca')}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'seguranca' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="h-4 w-4 inline mr-1" />
            Segurança
          </button>
        </nav>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">{formData.nome || 'Nome não definido'}</p>
                <p className="text-gray-500">{formData.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                  bg-blue-100 text-blue-800
                ">
                  {papéis.find(p => p.value === formData.papel)?.label || formData.papel}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <Input
                name="nome"
                placeholder="Seu nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado aqui.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Papel no Sistema</label>
              <Select
                name="papel"
                options={papéis}
                value={formData.papel}
                onChange={(e) => handleChange('papel', e.target.value)}
                disabled={perfil?.papel === 'owner'}
              />
              {perfil?.papel === 'owner' && (
                <p className="text-xs text-gray-500 mt-1">Proprietários não podem alterar seu próprio papel.</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button onClick={handleSavePerfil} icon={<Save className="h-4 w-4" />} loading={saving}>
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aparência Tab */}
      {activeTab === 'aparencia' && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
              <Select
                name="tema"
                options={temas}
                value={formData.tema}
                onChange={(e) => handleChange('tema', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Define a aparência da interface do painel admin.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
              <Select
                name="idioma"
                options={idiomas}
                value={formData.idioma}
                onChange={(e) => handleChange('idioma', e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button onClick={handleSaveAparencia} icon={<Save className="h-4 w-4" />} loading={saving}>
                Salvar Preferências
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notificações Tab */}
      {activeTab === 'notificacoes' && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Notificações por Email</p>
                <p className="text-sm text-gray-500">Receba atualizações importantes por email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notificacoes_email"
                  checked={formData.notificacoes_email}
                  onChange={(e) => handleChange('notificacoes_email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Notificações Push</p>
                <p className="text-sm text-gray-500">Receba alertas no navegador (quando disponível)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notificacoes_push"
                  checked={formData.notificacoes_push}
                  onChange={(e) => handleChange('notificacoes_push', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Notificações Push em Desenvolvimento</p>
                  <p className="text-sm text-blue-700 mt-1">A funcionalidade de notificações push no navegador será implementada em uma versão futura.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segurança Tab */}
      {activeTab === 'seguranca' && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Autenticação de Dois Fatores (2FA)</p>
                  <p className="text-sm text-gray-500">Adicione uma camada extra de segurança à sua conta</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Configurar 2FA (Em breve)
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Alterar Senha</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                  <Input
                    type="password"
                    name="currentPassword"
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                  <Input
                    type="password"
                    name="newPassword"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  />
                </div>
                <Button onClick={handleChangePassword} icon={<Key className="h-4 w-4" />} loading={saving} variant="outline">
                  Alterar Senha
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sessões Ativas</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Gerenciamento de sessões ativas será implementado em uma versão futura.</p>
                <Button variant="ghost" size="sm" className="mt-2" disabled>
                  Sair de todas as sessões
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}