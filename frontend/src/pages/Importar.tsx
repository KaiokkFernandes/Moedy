import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Check, CircleCheck, Landmark } from 'lucide-react'
import { ColumnMapping } from '@/components/import/ColumnMapping'
import { FileDropzone } from '@/components/import/FileDropzone'
import { ImportReview } from '@/components/import/ImportReview'
import { RuleSuggestions } from '@/components/import/RuleSuggestions'
import { AiNotice } from '@/components/categorizacao/AiNotice'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, Loading } from '@/components/ui/States'
import { useAccounts } from '@/hooks/useAccounts'
import { useAiSettings } from '@/hooks/useAi'
import { useCategories } from '@/hooks/useCategories'
import { useImportConfirm, useImportPreview } from '@/hooks/useImport'
import { getErrorMessage } from '@/lib/api'
import { pluralize } from '@/lib/format'
import type { CsvMapping, CsvMappingStep, ImportItem, ImportResult, ImportReview as ImportReviewData } from '@/types/import'

const MAX_FILE_SIZE = 5 * 1024 * 1024

type Step =
  | { name: 'arquivo' }
  | { name: 'colunas'; mapping: CsvMappingStep; chosen?: CsvMapping }
  | { name: 'revisao'; review: ImportReviewData; mapping?: CsvMappingStep; chosen?: CsvMapping }
  | { name: 'concluido'; result: ImportResult; aceitos: ImportItem[] }

/** Checagens rápidas antes de enviar; a API valida tudo de novo. */
function validateFile(file: File) {
  if (!/\.(ofx|csv)$/i.test(file.name)) return 'Formato não suportado: escolha um arquivo .ofx ou .csv.'
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > MAX_FILE_SIZE) return 'O arquivo deve ter no máximo 5 MB.'
  return ''
}

function Steps({ current, csv }: { current: Step['name']; csv: boolean }) {
  const steps: { name: Step['name']; label: string }[] = [
    { name: 'arquivo', label: 'Arquivo' },
    ...(csv ? [{ name: 'colunas' as const, label: 'Colunas' }] : []),
    { name: 'revisao', label: 'Revisão' },
    { name: 'concluido', label: 'Concluído' },
  ]
  const currentIndex = steps.findIndex((step) => step.name === current)

  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {steps.map((step, index) => (
        <li key={step.name} aria-current={index === currentIndex ? 'step' : undefined} className="flex items-center gap-2">
          <span
            className={clsx(
              'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
              index < currentIndex && 'bg-accent-soft-strong text-accent-fg',
              index === currentIndex && 'bg-accent text-on-solid',
              index > currentIndex && 'bg-line text-fg-3',
            )}
          >
            {index < currentIndex ? <Check className="size-3.5" aria-hidden /> : index + 1}
          </span>
          <span className={index === currentIndex ? 'font-medium text-fg' : 'text-fg-3'}>{step.label}</span>
          {index < steps.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-line-strong" />}
        </li>
      ))}
    </ol>
  )
}

export function Importar() {
  const accounts = useAccounts()
  const categories = useCategories()
  const preview = useImportPreview()
  const confirm = useImportConfirm()
  const ai = useAiSettings()
  const usarIa = ai.data?.usarIaImportacao ?? false
  const [step, setStep] = useState<Step>({ name: 'arquivo' })
  const [accountId, setAccountId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')

  if (accounts.isPending || categories.isPending) {
    return (
      <>
        <PageHeader title="Importar extrato" />
        <Loading />
      </>
    )
  }

  if (accounts.isError || categories.isError) {
    return (
      <>
        <PageHeader title="Importar extrato" />
        <ErrorState
          message={getErrorMessage(accounts.error ?? categories.error, 'Não foi possível carregar os dados.')}
          onRetry={() => {
            accounts.refetch()
            categories.refetch()
          }}
        />
      </>
    )
  }

  if (accounts.data.length === 0) {
    return (
      <>
        <PageHeader title="Importar extrato" />
        <EmptyState
          icon={Landmark}
          title="Cadastre uma conta primeiro"
          description="As transações importadas entram em uma conta. Crie a conta de destino antes de importar."
          action={
            <Link
              to="/contas"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-accent-hover"
            >
              Ir para Contas
            </Link>
          }
        />
      </>
    )
  }

  // Sem escolha explícita, a conta de destino é a primeira
  const destino = accounts.data.find((account) => account.id === accountId) ?? accounts.data[0]!
  const isCsv = file ? /\.csv$/i.test(file.name) : step.name === 'colunas'

  function selectFile(next: File | null) {
    setFile(next)
    setFileError(next ? validateFile(next) : '')
    preview.reset()
  }

  /** Envia o arquivo para leitura. Sem mapeamento, um CSV volta pedindo as colunas. */
  async function readFile(mapeamento?: CsvMapping, mapping?: CsvMappingStep) {
    if (!file) {
      setFileError('Escolha o arquivo do extrato.')
      return
    }
    if (validateFile(file)) return

    try {
      const data = await preview.mutateAsync({ accountId: destino.id, file, mapeamento })
      setStep(
        data.etapa === 'mapeamento'
          ? { name: 'colunas', mapping: data }
          : { name: 'revisao', review: data, mapping, chosen: mapeamento },
      )
    } catch {
      // O erro aparece na etapa atual
    }
  }

  async function importItems(itens: ImportItem[]) {
    try {
      const result = await confirm.mutateAsync({ accountId: destino.id, itens })
      // As sugestões da IA que o usuário aceitou são as candidatas a virar regra
      const aceitos = itens.filter((item) => item.origemCategoria === 'IA' && item.categoryId)
      setStep({ name: 'concluido', result, aceitos })
    } catch {
      // O erro aparece na revisão
    }
  }

  function restart() {
    setStep({ name: 'arquivo' })
    setFile(null)
    setFileError('')
    preview.reset()
    confirm.reset()
  }

  const previewError = preview.isError ? getErrorMessage(preview.error, 'Não foi possível ler o arquivo.') : ''

  return (
    <>
      <PageHeader title="Importar extrato" />
      <Steps current={step.name} csv={isCsv} />

      {step.name === 'arquivo' && (
        <div className="max-w-2xl space-y-5">
          <div className="rounded-2xl bg-surface p-5 ring-1 ring-line">
            <Select
              label="Conta de destino"
              value={destino.id}
              onChange={(e) => setAccountId(e.target.value)}
              hint="As transações do arquivo serão lançadas nesta conta."
            >
              {accounts.data.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome}
                </option>
              ))}
            </Select>
          </div>

          <FileDropzone file={file} onSelect={selectFile} error={fileError || previewError} />

          <div className="flex justify-end">
            <Button onClick={() => readFile()} loading={preview.isPending} disabled={Boolean(fileError)}>
              {preview.isPending && usarIa ? 'Lendo e sugerindo categorias…' : 'Ler arquivo'}
            </Button>
          </div>
        </div>
      )}

      {step.name === 'colunas' && (
        <ColumnMapping
          data={step.mapping}
          initial={step.chosen}
          loading={preview.isPending}
          error={previewError}
          onBack={() => {
            preview.reset()
            setStep({ name: 'arquivo' })
          }}
          onSubmit={(mapeamento) => readFile(mapeamento, step.mapping)}
        />
      )}

      {step.name === 'revisao' && (
        <>
          <p className="mb-4 text-sm text-fg-2">
            Confira as transações de <strong className="text-fg">{file?.name}</strong> que entrarão na conta{' '}
            <strong className="text-fg">{destino.nome}</strong>. Nada foi gravado ainda.
          </p>
          <AiNotice ia={step.review.ia} />
          <ImportReview
            data={step.review}
            categories={categories.data}
            loading={confirm.isPending}
            error={confirm.isError ? getErrorMessage(confirm.error, 'Não foi possível importar as transações.') : ''}
            onBack={() => {
              confirm.reset()
              setStep(step.mapping ? { name: 'colunas', mapping: step.mapping, chosen: step.chosen } : { name: 'arquivo' })
            }}
            onConfirm={importItems}
          />
        </>
      )}

      {step.name === 'concluido' && (
        <div className="flex max-w-2xl flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center ring-1 ring-line">
          <CircleCheck className="size-12 text-success" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-fg">
            {step.result.importadas === 0
              ? 'Nenhuma transação nova foi importada'
              : `${pluralize(step.result.importadas, 'transação importada', 'transações importadas')}`}
          </h2>
          <p className="mt-1 text-sm text-fg-2">
            Conta: {destino.nome}.
            {step.result.ignoradas > 0 &&
              ` ${pluralize(step.result.ignoradas, 'transação ignorada', 'transações ignoradas')} por já ${step.result.ignoradas === 1 ? 'existir' : 'existirem'} na conta.`}
          </p>
          {step.result.alertas > 0 && (
            <p role="status" className="mt-2 rounded-lg bg-warning-soft px-3 py-1.5 text-sm text-warning-strong">
              {step.result.alertas === 1 ? 'A importação gerou 1 alerta novo' : `A importação gerou ${step.result.alertas} alertas novos`}. Veja no
              sino de alertas.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              to={`/transacoes?conta=${destino.id}&periodo=tudo`}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ver transações da conta
            </Link>
            <Button variant="secondary" onClick={restart}>
              Importar outro arquivo
            </Button>
          </div>
        </div>
      )}

      {step.name === 'concluido' && step.aceitos.length > 0 && (
        <div className="mt-6 max-w-2xl">
          <RuleSuggestions itens={step.aceitos} categories={categories.data} />
        </div>
      )}
    </>
  )
}
