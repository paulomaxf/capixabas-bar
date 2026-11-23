import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Button, Input, Card } from '../../components/ui'

const loginSchema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup.string().min(6, 'Senha deve ter pelo menos 6 caracteres').required('Senha é obrigatória'),
})

type LoginForm = yup.InferType<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, loading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as any)?.from?.pathname || '/admin'
  const loading = authLoading

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      const result = await signIn(data.email, data.password)
      if (result.error) {
        setError(result.error.message)
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acesso Admin</h1>
          <p className="text-gray-500 mt-1">Entre para gerenciar sua vitrine</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="relative">
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {loading ? <Loader2 className="h-5 w-5" /> : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Não tem conta? Entre em contato com o administrador.
        </p>
      </Card>
    </div>
  )
}