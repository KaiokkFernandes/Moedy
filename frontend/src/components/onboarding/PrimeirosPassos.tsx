import { Link } from 'react-router-dom'
import { CircleCheck, Circle, PartyPopper, X } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { useAccounts } from '@/hooks/useAccounts'
import { useAuth } from '@/hooks/useAuth'
import { useBudgets } from '@/hooks/useBudgets'
import { useAtualizarOnboarding } from '@/hooks/useOnboarding'
import { useTour } from '@/hooks/useTour'
import { useTransactions } from '@/hooks/useTransactions'
import { primeirosPassos } from '@/lib/onboarding/primeirosPassos'
import { currentMonth } from '@/lib/periods'

/** Checklist do Painel para quem está começando. Cada item é marcado pelo que já existe de verdade. */
export function PrimeirosPassos() {
  const { user } = useAuth()
  const { iniciarTour } = useTour()
  const { mutate: salvar } = useAtualizarOnboarding()
  const mes = currentMonth()
  const contas = useAccounts()
  const transacoes = useTransactions({ page: 1, pageSize: 1 })
  const orcamentos = useBudgets({ ano: Number(mes.slice(0, 4)), mes: Number(mes.slice(5, 7)) })

  if (!user || user.primeirosPassosOcultosEm) return null
  // Só aparece com tudo carregado, para não marcar itens errado enquanto os dados chegam
  if (!contas.data || !transacoes.data || !orcamentos.data) return null

  const { itens, feitos, total, completo } = primeirosPassos({
    contas: contas.data.length,
    transacoes: transacoes.data.total,
    orcamentos: orcamentos.data.orcamentos.length,
    tourFeito: Boolean(user.onboardingTourEm),
  })
  const ocultar = () => salvar({ primeirosPassosOcultos: true })

  return (
    <section aria-labelledby="primeiros-passos-titulo" className="mb-6 rounded-2xl bg-surface p-5 ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="primeiros-passos-titulo" className="font-medium text-fg">
            {completo ? 'Tudo pronto!' : 'Primeiros passos'}
          </h2>
          <p className="mt-0.5 text-sm text-fg-3">
            {completo ? 'Você já configurou o essencial. Bom controle!' : `${feitos} de ${total} concluídos`}
          </p>
        </div>
        <IconButton label="Ocultar primeiros passos" onClick={ocultar} className="-m-1.5">
          <X className="size-4.5" />
        </IconButton>
      </div>

      <div
        role="progressbar"
        aria-label="Progresso dos primeiros passos"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={feitos}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle"
      >
        <div className="h-full rounded-full bg-accent motion-safe:transition-[width]" style={{ width: `${(feitos / total) * 100}%` }} />
      </div>

      {completo ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-fg-2">
          <PartyPopper className="size-5 shrink-0 text-success" aria-hidden />
          <span className="flex-1">Os próximos passos ficam por sua conta: o Painel mostra como o mês está indo.</span>
          <button type="button" onClick={ocultar} className="font-medium text-accent-fg hover:underline">
            Ocultar
          </button>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {itens.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              {item.feito ? (
                <CircleCheck className="size-5 shrink-0 text-success" aria-label="Concluído" />
              ) : (
                <Circle className="size-5 shrink-0 text-fg-4" aria-label="Pendente" />
              )}
              <div className="min-w-0 flex-1">
                <p className={item.feito ? 'text-sm text-fg-3 line-through' : 'text-sm font-medium text-fg'}>{item.titulo}</p>
                {!item.feito && <p className="text-xs text-fg-3">{item.descricao}</p>}
              </div>
              {!item.feito &&
                (item.rota ? (
                  <Link to={item.rota} className="text-sm font-medium text-accent-fg hover:underline">
                    {item.acao}
                  </Link>
                ) : (
                  <button type="button" onClick={iniciarTour} className="text-sm font-medium text-accent-fg hover:underline">
                    {item.acao}
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
