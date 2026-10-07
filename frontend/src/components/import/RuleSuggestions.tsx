import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useCategoryRules, useSaveCategoryRule } from '@/hooks/useCategoryRules'
import { getErrorMessage } from '@/lib/api'
import { pluralize } from '@/lib/format'
import { normalizeText, suggestKeyword } from '@/lib/text'
import type { Category } from '@/types/finance'
import type { ImportItem } from '@/types/import'

interface Proposal {
  palavraChave: string
  categoryId: string
  categoriaNome: string
  exemplo: string
}

/**
 * Depois de importar, propõe regras para as sugestões da IA que o usuário aceitou. Ele marca
 * quais quer; nada é criado sem essa escolha.
 */
export function RuleSuggestions({ itens, categories }: { itens: ImportItem[]; categories: Category[] }) {
  const rules = useCategoryRules()
  const saveRule = useSaveCategoryRule()
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [resultado, setResultado] = useState('')
  const [erro, setErro] = useState('')
  const [criando, setCriando] = useState(false)

  const propostas = useMemo<Proposal[]>(() => {
    const existentes = new Set((rules.data ?? []).map((rule) => normalizeText(rule.palavraChave)))
    const porPalavra = new Map<string, Proposal>()

    for (const item of itens) {
      if (!item.categoryId) continue
      const palavraChave = suggestKeyword(item.descricao)
      const chave = normalizeText(palavraChave)
      if (chave.length < 2 || existentes.has(chave) || porPalavra.has(chave)) continue
      porPalavra.set(chave, {
        palavraChave,
        categoryId: item.categoryId,
        categoriaNome: categories.find((category) => category.id === item.categoryId)?.nome ?? '',
        exemplo: item.descricao,
      })
    }
    return [...porPalavra.values()]
  }, [itens, categories, rules.data])

  if (propostas.length === 0) return null

  function toggle(palavraChave: string) {
    setMarcadas((prev) => {
      const next = new Set(prev)
      if (next.has(palavraChave)) next.delete(palavraChave)
      else next.add(palavraChave)
      return next
    })
  }

  async function criar() {
    setCriando(true)
    setErro('')
    setResultado('')
    const escolhidas = propostas.filter((proposal) => marcadas.has(proposal.palavraChave))
    let criadas = 0
    let falhas = 0
    // Uma a uma: cada palavra-chave tem a sua própria validação no servidor
    for (const proposal of escolhidas) {
      try {
        await saveRule.mutateAsync({
          data: { palavraChave: proposal.palavraChave, categoryId: proposal.categoryId },
        })
        criadas += 1
      } catch (error) {
        falhas += 1
        setErro(getErrorMessage(error, 'Algumas regras não puderam ser criadas.'))
      }
    }
    setCriando(false)
    setMarcadas(new Set())
    if (criadas > 0) setResultado(`${pluralize(criadas, 'regra criada', 'regras criadas')}. Elas valem para as próximas importações.`)
    if (falhas > 0 && criadas === 0) setErro('Não foi possível criar as regras selecionadas.')
  }

  return (
    <section aria-label="Criar regras para as sugestões aceitas" className="rounded-2xl bg-surface p-5 ring-1 ring-line">
      <h2 className="font-medium text-fg">Criar regras para as sugestões que você aceitou?</h2>
      <p className="mt-1 text-sm text-fg-2">
        Uma regra faz as próximas transações com essa palavra-chave já chegarem categorizadas, sem a IA. Marque as que quiser.
      </p>

      <ul className="mt-4 divide-y divide-line">
        {propostas.map((proposal) => (
          <li key={proposal.palavraChave}>
            <label className="flex cursor-pointer items-center gap-3 py-2.5">
              <input
                type="checkbox"
                checked={marcadas.has(proposal.palavraChave)}
                onChange={() => toggle(proposal.palavraChave)}
                className="size-4 rounded border-line-strong accent-accent"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">
                  "{proposal.palavraChave}" → {proposal.categoriaNome}
                </span>
                <span className="block truncate text-xs text-fg-3">ex.: {proposal.exemplo}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={criar} loading={criando} disabled={marcadas.size === 0}>
          Criar {pluralize(marcadas.size, 'regra', 'regras')} selecionada{marcadas.size === 1 ? '' : 's'}
        </Button>
        {resultado && (
          <p role="status" className="text-sm text-success-strong">
            {resultado}
          </p>
        )}
        {erro && (
          <p role="alert" className="text-sm text-danger-strong">
            {erro}
          </p>
        )}
      </div>
    </section>
  )
}
