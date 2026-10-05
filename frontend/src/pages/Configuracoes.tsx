import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { ErrorState, Loading } from '@/components/ui/States'
import { useAiSettings, useUpdateAiSettings } from '@/hooks/useAi'
import { getErrorMessage } from '@/lib/api'
import { formatDate } from '@/lib/format'

export function Configuracoes() {
  const settings = useAiSettings()
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

      <section aria-labelledby="ia-titulo" className="max-w-2xl rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="ia-titulo" className="font-medium text-slate-900">
              Sugerir categorias com IA na importação
            </h2>
            <p className="mt-1 text-sm text-slate-600">
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
              'relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60',
              ligada ? 'bg-emerald-600' : 'bg-slate-300',
            )}
          >
            <span
              aria-hidden
              className={clsx('inline-block size-5 rounded-full bg-white shadow transition-transform', ligada ? 'translate-x-5' : 'translate-x-0.5')}
            />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Status:{' '}
          <strong className={ligada ? 'text-emerald-700' : 'text-slate-900'}>{ligada ? 'ligada' : 'desligada'}</strong>
          {ligada && data.iaConsentidaEm && <> · aceita em {formatDate(data.iaConsentidaEm.slice(0, 10))}</>}
        </p>

        {!data.iaDisponivel && (
          <p role="status" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            O servidor não tem a chave da API configurada (ANTHROPIC_API_KEY). Enquanto isso, a importação segue só com regras e
            memória.
          </p>
        )}

        {avisando && !ligada && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
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
                className="mt-0.5 size-4 rounded border-slate-300 accent-emerald-600"
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
          <p role="alert" className="mt-4 text-sm text-red-700">
            {erro}
          </p>
        )}
      </section>

      <p className="mt-6 max-w-2xl text-sm text-slate-600">
        As regras de categorização continuam funcionando com a IA desligada. Elas são criadas na página{' '}
        <Link to="/regras" className="font-medium text-emerald-700 hover:underline">
          Regras
        </Link>
        .
      </p>
    </>
  )
}
