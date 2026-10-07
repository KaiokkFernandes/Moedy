import { useState } from 'react'
import clsx from 'clsx'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { CategoriesTab } from '@/components/reports/CategoriesTab'
import { EvolutionTab } from '@/components/reports/EvolutionTab'
import { MerchantsTab } from '@/components/reports/MerchantsTab'
import { RecurringTab } from '@/components/reports/RecurringTab'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAccounts } from '@/hooks/useAccounts'
import { REPORT_TABS, useReportFilters } from '@/hooks/useReportFilters'
import { getErrorMessage } from '@/lib/api'
import { last3Months, lastMonth, thisMonth, thisYear, type Period } from '@/lib/periods'
import * as reportsService from '@/services/reports'

const SHORTCUTS: { label: string; period: () => Period }[] = [
  { label: 'Este mês', period: thisMonth },
  { label: 'Mês passado', period: lastMonth },
  { label: 'Últimos 3 meses', period: last3Months },
  { label: 'Este ano', period: thisYear },
]

export function Relatorios() {
  const filters = useReportFilters()
  const { values, range, update } = filters
  const accounts = useAccounts()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const setPeriod = (inicio: string, fim: string) => {
    // Os relatórios precisam das duas datas; um campo apagado é ignorado
    if (inicio && fim) update({ inicio, fim })
  }

  async function exportCsv() {
    setExporting(true)
    setExportError('')
    try {
      const { blob, filename } = await reportsService.exportCsv(range)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(getErrorMessage(error, 'Não foi possível exportar o CSV.'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        action={
          <Button variant="secondary" onClick={exportCsv} loading={exporting}>
            {!exporting && <Download className="size-4" aria-hidden />}
            Exportar CSV
          </Button>
        }
      />

      {exportError && (
        <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-strong">
          {exportError}
        </p>
      )}

      <section aria-label="Filtros" className="mb-6 rounded-2xl bg-surface p-4 ring-1 ring-line">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SHORTCUTS.map(({ label, period }) => {
            const { inicio, fim } = period()
            const active = inicio === values.inicio && fim === values.fim
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setPeriod(inicio, fim)}
                className={clsx(
                  'rounded-full px-3 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  active ? 'bg-accent text-on-solid' : 'bg-subtle text-fg-2 hover:bg-line',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-2xl">
          <Input
            label="De"
            type="date"
            value={values.inicio}
            max={values.fim}
            onChange={(e) => setPeriod(e.target.value, values.fim)}
          />
          <Input
            label="Até"
            type="date"
            value={values.fim}
            min={values.inicio}
            onChange={(e) => setPeriod(values.inicio, e.target.value)}
          />
          <div className="col-span-2 sm:col-span-1">
            <Select label="Conta" value={values.conta} onChange={(e) => update({ conta: e.target.value })}>
              <option value="">Todas</option>
              {accounts.data?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <div role="tablist" aria-label="Relatórios" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {REPORT_TABS.map((tab) => {
          const selected = tab.id === values.aba
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`aba-${tab.id}`}
              aria-selected={selected}
              aria-controls="painel-relatorio"
              onClick={() => update({ aba: tab.id === 'categorias' ? null : tab.id })}
              className={clsx(
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                selected
                  ? 'border-accent text-accent-fg'
                  : 'border-transparent text-fg-2 hover:border-line-strong hover:text-fg',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="painel-relatorio" aria-labelledby={`aba-${values.aba}`}>
        {values.aba === 'categorias' && <CategoriesTab filters={filters} />}
        {values.aba === 'evolucao' && <EvolutionTab accountId={range.accountId} />}
        {values.aba === 'estabelecimentos' && <MerchantsTab range={range} />}
        {values.aba === 'recorrentes' && <RecurringTab accountId={range.accountId} />}
      </div>
    </>
  )
}
