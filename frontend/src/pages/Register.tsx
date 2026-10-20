import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { ConectandoAviso } from '@/components/ConectandoAviso'
import { FormAlert } from '@/components/FormAlert'
import { GoogleButton } from '@/components/GoogleButton'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useDemora } from '@/hooks/useDemora'
import { useRegistrationEnabled } from '@/hooks/useRegistrationEnabled'
import { getErrorMessage, getFieldErrors } from '@/lib/api'
import { onlyErrors, validateEmail } from '@/lib/validation'

const SENHA_MIN = 8

interface FieldErrors {
  nome?: string
  email?: string
  senha?: string
  confirmacao?: string
}

export function Register() {
  const { register } = useAuth()
  const registrationEnabled = useRegistrationEnabled()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const demorando = useDemora(loading)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')

    const validation = onlyErrors({
      nome: nome.trim().length >= 2 ? '' : 'Informe seu nome',
      email: validateEmail(email),
      senha: senha.length >= SENHA_MIN ? '' : `A senha deve ter pelo menos ${SENHA_MIN} caracteres`,
      confirmacao: confirmacao === senha ? '' : 'As senhas não conferem',
    })
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      // Com a sessão iniciada, o PublicOnlyRoute redireciona para a área logada
      await register({ nome, email, senha })
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      // Erros por campo já aparecem nos inputs; o alerta fica para os demais (ex.: email já cadastrado)
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(getErrorMessage(error, 'Não foi possível criar a conta. Tente novamente.'))
      }
      setLoading(false)
    }
  }

  // Com o cadastro desligado no servidor, esta página não tem o que oferecer
  if (!registrationEnabled) return <Navigate to="/login" replace />

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Comece a organizar suas finanças"
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-accent-fg hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton texto="signup_with" onErro={setFormError} onCarregando={setLoading} />
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormAlert message={formError} />
          <Input
            label="Nome"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
          />
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
            autoComplete="new-password"
            placeholder={`Mínimo de ${SENHA_MIN} caracteres`}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={errors.senha}
          />
          <Input
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            error={errors.confirmacao}
          />
          <Button type="submit" fullWidth loading={loading}>Criar conta</Button>
          {demorando && <ConectandoAviso />}
        </form>
      </div>
    </AuthLayout>
  )
}
