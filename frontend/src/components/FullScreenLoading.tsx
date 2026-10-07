import { ConectandoAviso } from '@/components/ConectandoAviso'
import { useDemora } from '@/hooks/useDemora'

/** Carregamento em tela cheia: sessão sendo verificada ou código da página chegando. */
export function FullScreenLoading() {
  const demorando = useDemora(true)

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 text-sm text-fg-3">
      {demorando ? <ConectandoAviso /> : <p role="status">Carregando…</p>}
    </div>
  )
}
