import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { ConectandoAviso } from '@/components/ConectandoAviso'
import { FormAlert } from '@/components/FormAlert'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useDemora } from '@/hooks/useDemora'
import { useRegistrationEnabled } from '@/hooks/useRegistrationEnabled'
import { getErrorMessage } from '@/lib/api'
import { onlyErrors, validateEmail } from '@/lib/validation'

export function Login() {
  const { login } = useAuth()
  const registrationEnabled = useRegistrationEnabled()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const demorando = useDemora(loading)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    const validation = onlyErrors({
      email: validateEmail(email),
      senha: senha ? '' : 'Informe a senha',
    })
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      // Com a sessão iniciada, o PublicOnlyRoute redireciona para a área logada
      await login({ email, senha })
    } catch (error) {
      setFormError(getErrorMessage(error, 'Não foi possível entrar. Tente novamente.'))
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse suas finanças pessoais"
      footer={
        registrationEnabled ? (
          <>
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="font-medium text-accent-fg hover:underline">
              Criar conta
            </Link>
          </>
        ) : null
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormAlert message={formError} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          error={errors.senha}
        />
        <Button type="submit" fullWidth loading={loading}>Entrar</Button>
        {demorando && <ConectandoAviso />}
      </form>
    </AuthLayout>
  )
}
