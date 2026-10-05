import { useId, type ChangeEvent } from 'react'
import { formatCurrency } from '@/lib/format'
import { controlAria, controlClasses } from './control'
import { Field } from './Field'

/** Mesmo limite da API: R$ 10 milhões. */
const MAX_CENTAVOS = 1_000_000_000

interface CurrencyInputProps {
  label: string
  /** Valor em centavos. */
  value: number
  onChange: (centavos: number) => void
  error?: string
  hint?: string
  /** Permite valores negativos: a tecla "-" inverte o sinal. */
  allowNegative?: boolean
  autoFocus?: boolean
}

/**
 * Campo de moeda com máscara: o usuário digita só os números e eles entram
 * pela direita, como em um caixa eletrônico (1, 12, 123 → R$ 0,01, R$ 0,12, R$ 1,23).
 */
export function CurrencyInput({ label, value, onChange, error, hint, allowNegative, autoFocus }: CurrencyInputProps) {
  const id = useId()

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    const centavos = Math.min(Number(raw.replace(/\D/g, '')), MAX_CENTAVOS)
    // O texto já traz o "-" do valor atual; digitar outro "-" resulta em dois, o que desfaz o sinal
    const negativo = allowNegative && (raw.match(/-/g)?.length ?? 0) % 2 === 1
    onChange(negativo ? -centavos : centavos)
  }

  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <input
        {...controlAria(id, error)}
        className={controlClasses(error)}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={formatCurrency(value)}
        onChange={handleChange}
      />
    </Field>
  )
}
