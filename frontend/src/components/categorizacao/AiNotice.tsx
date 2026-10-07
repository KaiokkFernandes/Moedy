import type { IaSummary } from '@/types/import'
import { pluralize } from '@/lib/format'

/** Aviso discreto sobre a IA: só aparece quando há algo a saber (falha, limite, desligada). */
export function AiNotice({ ia }: { ia: IaSummary }) {
  if (ia.status === 'OK' && ia.naoEnviadas === 0) return null

  if (ia.status === 'DESLIGADA') {
    return <p className="text-sm text-fg-3">As sugestões por IA estão desligadas. Você pode ativá-las em Configurações.</p>
  }

  let texto: string
  if (ia.status === 'SEM_CHAVE') {
    texto = 'A IA não está disponível neste servidor (sem chave configurada). As categorias vieram só de regras e memória.'
  } else if (ia.status === 'FALHOU') {
    texto = `A IA não respondeu${ia.motivo ? `: ${ia.motivo}` : ''}. As categorias vieram só de regras e memória.`
  } else if (ia.status === 'PARCIAL') {
    texto = `Parte das sugestões da IA falhou${ia.motivo ? `: ${ia.motivo}` : ''}. O que faltou ficou sem categoria.`
  } else {
    texto = `Passou do limite por vez: ${pluralize(ia.naoEnviadas, 'lançamento ficou', 'lançamentos ficaram')} sem sugestão da IA.`
  }

  return (
    <p role="status" className="rounded-xl bg-subtle px-4 py-2.5 text-sm text-fg-2">
      {texto}
    </p>
  )
}
