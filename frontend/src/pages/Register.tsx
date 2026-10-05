import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { FormAlert } from '@/components/FormAlert'
import { FormField } from '@/components/FormField'
import { SubmitButton } from '@/components/SubmitButton'
import { useAuth } from '@/hooks/useAuth'
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
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Comece a organizar suas finanças"
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormAlert message={formError} />
        <FormField
          label="Nome"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          error={errors.nome}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <FormField
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder={`Mínimo de ${SENHA_MIN} caracteres`}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          error={errors.senha}
        />
        <FormField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          error={errors.confirmacao}
        />
        <SubmitButton loading={loading}>{loading ? 'Criando conta…' : 'Criar conta'}</SubmitButton>
      </form>
    </AuthLayout>
  )
}
