import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ErrorState, Loading } from '@/components/ui/States'
import { useTheme } from '@/hooks/useTheme'
import { TEMA_LABEL, TEMAS } from '@/lib/theme'
import { useAiSettings, useUpdateAiSettings } from '@/hooks/useAi'
import { getErrorMessage } from '@/lib/api'
import { formatDate } from '@/lib/format'

export function Configuracoes() {
  const settings = useAiSettings()
  const { preferencia, setPreferencia } = useTheme()
  const update = useUpdateAiSettings()
  const [avisando, setAvisando] = useState(false)
  const [aceite, setAceite] = useState(false)
  const [erro, setErro] = useState('')

  if (settings.isPending) {
    return (
      <>
        <PageHeader title="Configurações" />
        <Loading />
      </>
    )
  }

  if (settings.isError) {
    return (
      <>
        <PageHeader title="Configurações" />
        <ErrorState message={getErrorMessage(settings.error, 'Não foi possível carregar as configurações.')} onRetry={settings.refetch} />
      </>
    )
  }

  const data = settings.data
  const ligada = data.usarIaImportacao

  async function alterar(usar: boolean) {
    setErro('')
    try {
      await update.mutateAsync(usar ? { usarIaImportacao: true, confirmaEnvioAnthropic: true } : { usarIaImportacao: false })
      setAvisando(false)
      setAceite(false)
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível salvar a configuração.'))
    }
  }

  return (
    <>
      <PageHeader title="Configurações" />

      <section aria-labelledby="aparencia-titulo" className="mb-6 max-w-2xl rounded-2xl bg-surface p-6 ring-1 ring-line">
        <h2 id="aparencia-titulo" className="font-medium text-fg">
          Aparência
        </h2>
        <p className="mt-1 text-sm text-fg-2">
          Sistema segue o modo do aparelho e muda junto se ele mudar com o app aberto.
        </p>
        <div className="mt-4 max-w-sm">
          <SegmentedControl
            label="Tema"
            value={preferencia}
            onChange={setPreferencia}
            options={TEMAS.map((opcao) => ({ value: opcao, label: TEMA_LABEL[opcao] }))}
          />
        </div>
      </section>

      <section aria-labelledby="ia-titulo" className="max-w-2xl rounded-2xl bg-surface p-6 ring-1 ring-line">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ai-soft text-ai-fg">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="ia-titulo" className="font-medium text-fg">
              Sugerir categorias com IA na importação
            </h2>
            <p className="mt-1 text-sm text-fg-2">
              Para os lançamentos que as regras e a memória não reconhecem, a IA sugere uma categoria. Ela só sugere: nada é
              gravado sem a sua revisão.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ligada}
            aria-label="Usar IA para sugerir categorias"
            disabled={update.isPending}
            onClick={() => (ligada ? alterar(false) : setAvisando(true))}
            className={clsx(
              'relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60',
              ligada ? 'bg-accent' : 'bg-line-strong',
            )}
          >
            <span
              aria-hidden
              className={clsx('inline-block size-5 rounded-full bg-surface shadow transition-transform', ligada ? 'translate-x-5' : 'translate-x-0.5')}
            />
          </button>
        </div>

        <p className="mt-4 text-sm text-fg-2">
          Status:{' '}
          <strong className={ligada ? 'text-accent-fg' : 'text-fg'}>{ligada ? 'ligada' : 'desligada'}</strong>
          {ligada && data.iaConsentidaEm && <> · aceita em {formatDate(data.iaConsentidaEm.slice(0, 10))}</>}
        </p>

        {!data.iaDisponivel && (
          <p role="status" className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-strong">
            O servidor não tem a chave da API configurada (ANTHROPIC_API_KEY). Enquanto isso, a importação segue só com regras e
            memória.
          </p>
        )}

        {avisando && !ligada && (
          <div className="mt-5 rounded-xl border border-warning-line bg-warning-soft p-4 text-sm text-warning-strong">
            <p className="font-medium">Antes de ligar, leia com atenção:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                As <strong>descrições e os valores</strong> dos lançamentos que a IA precisar classificar serão enviados à API da
                Anthropic (modelo {data.modelo}).
              </li>
              <li>Não enviamos seu nome, e-mail, número de conta, saldo nem identificadores do banco.</li>
              <li>Os dados enviados não são usados para treinar modelos pela Anthropic, segundo a política da API.</li>
              <li>Você pode desligar a qualquer momento; sem IA, a importação continua funcionando com regras e memória.</li>
            </ul>
            <label className="mt-4 flex items-start gap-2">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
                className="mt-0.5 size-4 rounded border-line-strong accent-accent"
              />
              <span>Entendi que as descrições e os valores serão enviados à Anthropic para gerar sugestões.</span>
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => alterar(true)} disabled={!aceite} loading={update.isPending}>
                Ativar IA
              </Button>
              <Button variant="secondary" onClick={() => setAvisando(false)} disabled={update.isPending}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {erro && (
          <p role="alert" className="mt-4 text-sm text-danger-strong">
            {erro}
          </p>
        )}
      </section>

      <p className="mt-6 max-w-2xl text-sm text-fg-2">
        As regras de categorização continuam funcionando com a IA desligada. Elas são criadas na página{' '}
        <Link to="/regras" className="font-medium text-accent-fg hover:underline">
          Regras
        </Link>
        .
      </p>
    </>
  )
}
