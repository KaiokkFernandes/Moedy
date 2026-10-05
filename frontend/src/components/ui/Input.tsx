import { useId, type InputHTMLAttributes } from 'react'
import { controlAria, controlClasses } from './control'
import { Field } from './Field'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...inputProps }: InputProps) {
  const id = useId()
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <input {...controlAria(id, error)} className={controlClasses(error, className)} {...inputProps} />
    </Field>
  )
}
