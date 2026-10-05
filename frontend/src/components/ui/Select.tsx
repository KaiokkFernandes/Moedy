import { useId, type SelectHTMLAttributes } from 'react'
import { controlAria, controlClasses } from './control'
import { Field } from './Field'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
}

export function Select({ label, error, hint, className, children, ...selectProps }: SelectProps) {
  const id = useId()
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <select {...controlAria(id, error)} className={controlClasses(error, className)} {...selectProps}>
        {children}
      </select>
    </Field>
  )
}
