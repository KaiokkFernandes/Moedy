const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string) {
  if (!email.trim()) return 'Informe o email'
  if (!EMAIL_REGEX.test(email.trim())) return 'Email inválido'
  return ''
}

/** Remove as chaves sem mensagem, deixando só os campos com erro. */
export function onlyErrors<T extends Record<string, string>>(errors: T) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as Partial<T>
}
