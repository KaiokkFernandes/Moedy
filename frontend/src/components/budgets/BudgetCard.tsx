import { Link } from 'react-router-dom'
import { Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { CategoryIcon } from '@/components/categories/CategoryIcon'
import { IconButton } from '@/components/ui/Button'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { Budget } from '@/types/budgets'
import { BudgetProgress, BudgetStatusPill } from './BudgetProgress'

interface BudgetCardProps {
  budget: Budget
  /** Link para as transações da categoria no mês. */
  transactionsHref: string
  onEdit: (budget: Budget) => void
  onDelete: (budget: Budget) => void
}

export function BudgetCard({ budget, transactionsHref, onEdit, onDelete }: BudgetCardProps) {
  const { categoria, projecao } = budget

  return (
    <li className="relative rounded-2xl bg-surface p-5 ring-1 ring-line hover:ring-line-strong">
      {/* O card inteiro leva às transações; os botões ficam por cima do link */}
      <Link
        to={transactionsHref}
        aria-label={`Ver transações de ${categoria.nome}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />

      <div className="flex items-start gap-3">
        <CategoryIcon icone={categoria.icone} cor={categoria.cor} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-fg">{categoria.nome}</h3>
          <BudgetStatusPill status={budget.status} />
        </div>
        <div className="relative z-10 -m-2 flex">
          <IconButton label={`Editar orçamento de ${categoria.nome}`} onClick={() => onEdit(budget)}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton label={`Excluir orçamento de ${categoria.nome}`} danger onClick={() => onDelete(budget)}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>

      <p className="mt-4 flex items-baseline justify-between gap-2 text-sm text-fg-2">
        <span>
          <strong className="text-lg font-semibold text-fg">{formatCurrency(budget.gasto)}</strong> de{' '}
          {formatCurrency(budget.valorLimite)}
        </span>
        <span className="tabular-nums">{formatPercent(budget.percentual)}</span>
      </p>
      <div className="mt-2">
        <BudgetProgress percentual={budget.percentual} status={budget.status} label={`Orçamento de ${categoria.nome}`} />
      </div>

      <p className="mt-2 text-sm text-fg-2">
        {budget.restante > 0
          ? `Restam ${formatCurrency(budget.restante)}`
          : budget.restante === 0
            ? 'Limite atingido'
            : `Passou ${formatCurrency(-budget.restante)} do limite`}
      </p>

      {projecao && budget.status !== 'ESTOURADO' && budget.gasto > 0 && (
        <p className="mt-2 flex items-start gap-1.5 border-t border-line pt-2 text-xs text-fg-3">
          {projecao.vaiEstourar && <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning-fg" aria-hidden />}
          <span>
            Projeção: deve fechar o mês em <span className="font-medium text-fg-2">{formatCurrency(projecao.valor)}</span>
            {projecao.vaiEstourar
              ? `, ${formatCurrency(projecao.valor - budget.valorLimite)} acima do limite`
              : ', dentro do limite'}
          </span>
        </p>
      )}
    </li>
  )
}
