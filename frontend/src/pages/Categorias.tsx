import { useState } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { CategoryFormModal } from '@/components/categories/CategoryFormModal'
import { CategoryIcon } from '@/components/categories/CategoryIcon'
import { PageHeader } from '@/components/PageHeader'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState, Loading } from '@/components/ui/States'
import { useCategories, useDeleteCategory } from '@/hooks/useCategories'
import { getErrorMessage } from '@/lib/api'
import type { Category, TransactionType } from '@/types/finance'

/** `null` = modal fechado; `{ tipo }` = nova categoria; `{ category }` = edição. */
type FormState = { category?: Category; tipo?: TransactionType } | null

const SECTIONS: { tipo: TransactionType; title: string }[] = [
  { tipo: 'DESPESA', title: 'Despesas' },
  { tipo: 'RECEITA', title: 'Receitas' },
]

export function Categorias() {
  const categories = useCategories()
  const deleteCategory = useDeleteCategory()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  function closeDelete() {
    setDeleting(null)
    deleteCategory.reset()
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteCategory.mutateAsync(deleting.id)
      closeDelete()
    } catch {
      // O erro aparece dentro do diálogo
    }
  }

  return (
    <>
      <PageHeader
        title="Categorias"
        action={
          <Button onClick={() => setForm({})}>
            <Plus className="size-4" aria-hidden />
            Nova categoria
          </Button>
        }
      />

      {categories.isPending ? (
        <Loading />
      ) : categories.isError ? (
        <ErrorState
          message={getErrorMessage(categories.error, 'Não foi possível carregar as categorias.')}
          onRetry={categories.refetch}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {SECTIONS.map(({ tipo, title }) => {
            const items = categories.data.filter((category) => category.tipo === tipo)
            return (
              <section key={tipo} aria-label={title} className="rounded-2xl bg-surface ring-1 ring-line">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <h2 className="font-medium text-fg">
                    {title} <span className="text-sm font-normal text-fg-3">({items.length})</span>
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setForm({ tipo })}>
                    <Plus className="size-4" aria-hidden />
                    Adicionar
                  </Button>
                </div>
                {items.length === 0 ? (
                  <p className="flex items-center gap-2 px-5 py-8 text-sm text-fg-3">
                    <Tags className="size-4" aria-hidden />
                    Nenhuma categoria de {tipo === 'DESPESA' ? 'despesa' : 'receita'}.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((category) => (
                      <li key={category.id} className="flex items-center gap-3 px-5 py-2.5">
                        <CategoryIcon icone={category.icone} cor={category.cor} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                          {category.nome}
                        </span>
                        <div className="-mr-2 flex">
                          <IconButton label={`Editar ${category.nome}`} onClick={() => setForm({ category })}>
                            <Pencil className="size-4" />
                          </IconButton>
                          <IconButton label={`Excluir ${category.nome}`} danger onClick={() => setDeleting(category)}>
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      <CategoryFormModal
        open={form !== null}
        category={form?.category}
        defaultTipo={form?.tipo}
        onClose={() => setForm(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        title="Excluir categoria"
        confirmLabel="Excluir categoria"
        loading={deleteCategory.isPending}
        error={
          deleteCategory.isError ? getErrorMessage(deleteCategory.error, 'Não foi possível excluir a categoria.') : ''
        }
      >
        <p>
          Excluir a categoria <strong className="text-fg">{deleting?.nome}</strong>?
        </p>
        <p>As transações dela não são apagadas: ficam sem categoria.</p>
      </ConfirmDialog>
    </>
  )
}
