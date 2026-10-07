import { useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { FormAlert } from '@/components/FormAlert'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { pluralize } from '@/lib/format'
import type { CsvMapping, CsvMappingStep } from '@/types/import'

interface ColumnMappingProps {
  data: CsvMappingStep
  /** Mapeamento já escolhido (ao voltar da revisão); sem ele, vale a sugestão da API. */
  initial?: CsvMapping
  loading: boolean
  error: string
  onBack: () => void
  onSubmit: (mapping: CsvMapping) => void
}

type ValueMode = 'valor' | 'separadas'

const VALUE_MODES = [
  { value: 'valor' as const, label: 'Uma coluna de valor' },
  { value: 'separadas' as const, label: 'Entrada e saída separadas' },
]

const toField = (index: number | undefined) => (index === undefined ? '' : String(index))
const toIndex = (field: string) => (field === '' ? undefined : Number(field))

/** Etapa do CSV em que o usuário diz qual coluna é a data, a descrição e o valor. */
export function ColumnMapping({ data, initial, loading, error, onBack, onSubmit }: ColumnMappingProps) {
  const suggested: Partial<CsvMapping> = initial ?? data.mapeamentoSugerido
  const [mode, setMode] = useState<ValueMode>(
    suggested.entrada !== undefined || suggested.saida !== undefined ? 'separadas' : 'valor',
  )
  const [columns, setColumns] = useState({
    data: toField(suggested.data),
    descricao: toField(suggested.descricao),
    valor: toField(suggested.valor),
    entrada: toField(suggested.entrada),
    saida: toField(suggested.saida),
  })
  const [validation, setValidation] = useState('')

  const set = (key: keyof typeof columns) => (value: string) => setColumns((prev) => ({ ...prev, [key]: value }))

  // Só as colunas que valem no modo escolhido
  const active: Partial<Record<keyof typeof columns, string>> =
    mode === 'valor'
      ? { data: columns.data, descricao: columns.descricao, valor: columns.valor }
      : { data: columns.data, descricao: columns.descricao, entrada: columns.entrada, saida: columns.saida }

  const roleByColumn = new Map<number, string>()
  const ROLE_LABELS = { data: 'Data', descricao: 'Descrição', valor: 'Valor', entrada: 'Entrada', saida: 'Saída' }
  for (const [key, value] of Object.entries(active)) {
    if (value !== '') roleByColumn.set(Number(value), ROLE_LABELS[key as keyof typeof ROLE_LABELS])
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const chosen = Object.values(active).filter((value) => value !== '')
    let message = ''
    if (!columns.data || !columns.descricao) message = 'Escolha as colunas de data e de descrição.'
    else if (mode === 'valor' && !columns.valor) message = 'Escolha a coluna de valor.'
    else if (mode === 'separadas' && !columns.entrada && !columns.saida)
      message = 'Escolha a coluna de entrada, a de saída ou as duas.'
    else if (new Set(chosen).size !== chosen.length) message = 'Cada coluna só pode ser usada uma vez.'

    setValidation(message)
    if (message) return

    onSubmit({
      data: Number(columns.data),
      descricao: Number(columns.descricao),
      ...(mode === 'valor'
        ? { valor: Number(columns.valor) }
        : { entrada: toIndex(columns.entrada), saida: toIndex(columns.saida) }),
    })
  }

  const columnSelect = (label: string, key: keyof typeof columns, optional = false) => (
    <Select label={label} value={columns[key]} onChange={(e) => set(key)(e.target.value)}>
      <option value="">{optional ? 'Não tem' : 'Escolha…'}</option>
      {data.cabecalhos.map((header, index) => (
        <option key={index} value={index}>
          {header || `Coluna ${index + 1}`}
        </option>
      ))}
    </Select>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="rounded-2xl bg-surface p-5 ring-1 ring-line">
        <h2 className="font-medium text-fg">Quais colunas usar?</h2>
        <p className="mt-1 text-sm text-fg-2">
          O arquivo tem {pluralize(data.totalLinhas, 'linha', 'linhas')} e {data.cabecalhos.length} colunas. Confira a
          sugestão abaixo e ajuste se precisar.
        </p>

        <div className="mt-4 space-y-4">
          <FormAlert message={validation || error} />
          <div className="grid gap-4 sm:grid-cols-2">
            {columnSelect('Coluna da data', 'data')}
            {columnSelect('Coluna da descrição', 'descricao')}
          </div>
          <div className="max-w-md">
            <SegmentedControl label="Formato do valor" value={mode} onChange={setMode} options={VALUE_MODES} />
          </div>
          {mode === 'valor' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                {columnSelect('Coluna do valor', 'valor')}
                <p className="mt-1 text-xs text-fg-3">Valores negativos viram despesas; positivos, receitas.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {columnSelect('Coluna de entrada (receitas)', 'entrada', true)}
              {columnSelect('Coluna de saída (despesas)', 'saida', true)}
            </div>
          )}
        </div>
      </div>

      <section aria-label="Prévia do arquivo" className="rounded-2xl bg-surface ring-1 ring-line">
        <h2 className="border-b border-line px-5 py-3 font-medium text-fg">
          Prévia das primeiras linhas
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {data.cabecalhos.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={clsx('px-4 py-2 font-medium whitespace-nowrap', roleByColumn.has(index) ? 'bg-accent-soft text-success-strong' : 'text-fg-3')}
                  >
                    {header || `Coluna ${index + 1}`}
                    {roleByColumn.has(index) && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-on-solid">
                        {roleByColumn.get(index)}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.amostra.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {data.cabecalhos.map((_, index) => (
                    <td
                      key={index}
                      className={clsx('px-4 py-2 whitespace-nowrap', roleByColumn.has(index) ? 'bg-accent-soft text-fg' : 'text-fg-3')}
                    >
                      {row[index] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Voltar
        </Button>
        <Button type="submit" loading={loading}>
          Continuar
        </Button>
      </div>
    </form>
  )
}
