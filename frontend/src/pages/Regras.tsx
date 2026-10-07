import { useState } from 'react'
import { Pencil, Plus, Trash2, WandSparkles } from 'lucide-react'
import { CategoryIcon } from '@/components/categories/CategoryIcon'
import { PageHeader } from '@/components/PageHeader'
import { RuleFormModal } from '@/components/rules/RuleFormModal'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { EmptyState, ErrorState, Loading } from '@/components/ui/States'
import { useCategories } from '@/hooks/useCategories'
import { useApplyCategoryRules, useCategoryRules, useDeleteCategoryRule } from '@/hooks/useCategoryRules'
import { getErrorMessage } from '@/lib/api'
import { pluralize } from '@/lib/format'
import { normalizeText } from '@/lib/text'
import type { CategoryRule } from '@/types/import'

/** `null` = modal fechado; `{}` = nova regra; `{ rule }` = edição. */
type FormState = { rule?: CategoryRule } | null

export function Regras() {
  const rules = useCategoryRules()
  const categories = useCategories()
  const deleteRule = useDeleteCategoryRule()
  const applyRules = useApplyCategoryRules()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<CategoryRule | null>(null)
  const [busca, setBusca] = useState('')

  function closeDelete() {
    setDeleting(null)
    deleteRule.reset()
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteRule.mutateAsync(deleting.id)
      closeDelete()
    } catch {
      // O erro aparece dentro do diálogo
    }
  }

  const newButton = (
    <Button onClick={() => setForm({})}>
      <Plus className="size-4" aria-hidden />
      Nova regra
    </Button>
  )

  if (rules.isPending || categories.isPending) {
    return (
      <>
        <PageHeader title="Regras" />
        <Loading />
      </>
    )
  }

  if (rules.isError || categories.isError) {
    return (
      <>
        <PageHeader title="Regras" />
        <ErrorState
          message={getErrorMessage(rules.error ?? categories.error, 'Não foi possível carregar as regras.')}
          onRetry={() => {
            rules.refetch()
            categories.refetch()
          }}
        />
      </>
    )
  }

  const termo = normalizeText(busca)
  const visible = rules.data.filter(
    (rule) => normalizeText(rule.palavraChave).includes(termo) || normalizeText(rule.category.nome).includes(termo),
  )

  return (
    <>
      <PageHeader title="Regras" action={newButton} />

      <p className="mb-6 max-w-2xl text-sm text-fg-2">
        Uma regra liga uma palavra-chave a uma categoria. Ao importar um extrato, as transações cuja descrição contém a
        palavra-chave já chegam categorizadas. Quando mais de uma regra serve, vale a palavra-chave mais longa.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
        <Button variant="secondary" onClick={() => applyRules.mutate()} loading={applyRules.isPending}>
          <WandSparkles className="size-4" aria-hidden />
          Aplicar regras às transações sem categoria
        </Button>
        {applyRules.isSuccess && (
          <p role="status" className="text-sm text-fg-2">
            {applyRules.data.categorizadas === 0
              ? 'Nenhuma transação sem categoria corresponde às regras.'
              : `${pluralize(applyRules.data.categorizadas, 'transação categorizada', 'transações categorizadas')}.`}{' '}
            {applyRules.data.semCategoria > 0 &&
              `${pluralize(applyRules.data.semCategoria, 'continua', 'continuam')} sem categoria.`}
          </p>
        )}
        {applyRules.isError && (
          <p role="alert" className="text-sm text-danger-strong">
            {getErrorMessage(applyRules.error, 'Não foi possível aplicar as regras.')}
          </p>
        )}
      </div>

      {rules.data.length === 0 ? (
        <EmptyState
          icon={WandSparkles}
          title="Nenhuma regra cadastrada"
          description="Crie regras para categorizar automaticamente as transações importadas."
          action={newButton}
        />
      ) : (
        <section aria-label="Lista de regras" className="rounded-2xl bg-surface ring-1 ring-line">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-3">
            <h2 className="font-medium text-fg">
              {pluralize(rules.data.length, 'regra', 'regras')}
            </h2>
            <div className="w-full sm:w-64">
              <Input
                label="Filtrar regras"
                type="search"
                placeholder="Palavra-chave ou categoria…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="px-5 py-8 text-sm text-fg-3">Nenhuma regra corresponde ao filtro.</p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((rule) => (
                <li key={rule.id} className="flex items-center gap-3 px-5 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{rule.palavraChave}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-fg-2">
                    <CategoryIcon icone={rule.category.icone} cor={rule.category.cor} size="sm" />
                    <span className="truncate">{rule.category.nome}</span>
                  </span>
                  <div className="-mr-2 flex">
                    <IconButton label={`Editar regra ${rule.palavraChave}`} onClick={() => setForm({ rule })}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label={`Excluir regra ${rule.palavraChave}`} danger onClick={() => setDeleting(rule)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <RuleFormModal open={form !== null} rule={form?.rule} categories={categories.data} onClose={() => setForm(null)} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Excluir regra"
        confirmLabel="Excluir regra"
        loading={deleteRule.isPending}
        error={deleteRule.isError ? getErrorMessage(deleteRule.error, 'Não foi possível excluir a regra.') : ''}
      >
        <p>
          Excluir a regra <strong className="text-fg">{deleting?.palavraChave}</strong>?
        </p>
        <p>As transações já categorizadas por ela continuam como estão.</p>
      </ConfirmDialog>
    </>
  )
}
