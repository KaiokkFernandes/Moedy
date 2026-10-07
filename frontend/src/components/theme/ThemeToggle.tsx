import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { TEMA_LABEL, TEMAS, type Preferencia } from '@/lib/theme'

const ICONE: Record<Preferencia, LucideIcon> = { claro: Sun, escuro: Moon, sistema: Monitor }

/** Botão do topo com o tema atual; abre as três opções (claro, escuro, sistema), com a atual marcada. */
export function ThemeToggle() {
  const { preferencia, setPreferencia } = useTheme()
  const [aberto, setAberto] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const Icone = ICONE[preferencia]

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return
    const aoClicar = (evento: PointerEvent) => {
      if (!container.current?.contains(evento.target as Node)) setAberto(false)
    }
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={`Tema: ${TEMA_LABEL[preferencia]}. Alterar tema`}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
        className="rounded-lg p-2 text-fg-2 hover:bg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <Icone className="size-5" aria-hidden />
      </button>

      {aberto && (
        <div
          role="menu"
          aria-label="Tema"
          className="absolute right-0 z-50 mt-2 w-44 rounded-xl bg-elevated p-1 shadow-xl ring-1 ring-line"
        >
          {TEMAS.map((opcao) => {
            const selecionado = opcao === preferencia
            const Icon = ICONE[opcao]
            return (
              <button
                key={opcao}
                type="button"
                role="menuitemradio"
                aria-checked={selecionado}
                onClick={() => {
                  setPreferencia(opcao)
                  setAberto(false)
                }}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                  selecionado ? 'bg-accent-soft text-accent-fg font-medium' : 'text-fg-2 hover:bg-subtle hover:text-fg',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="flex-1 text-left">{TEMA_LABEL[opcao]}</span>
                {selecionado && <Check className="size-4" aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
