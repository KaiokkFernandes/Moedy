import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { seletorDoAlvo, type PassoTour } from '@/lib/onboarding/passos'
import { areaDestacada, posicionarBalao, type Retangulo } from '@/lib/onboarding/posicao'

/** Quanto esperar o alvo aparecer (página carregando sob demanda) antes de mostrar o balão no centro. */
const ESPERA_ALVO_MS = 1500
const BALAO_PADRAO = { width: 320, height: 200 }

interface TourGuiadoProps {
  passo: PassoTour
  indice: number
  total: number
  onAvancar: () => void
  onVoltar: () => void
  onEncerrar: () => void
  /** Último passo: encerra o tour e leva para a página de contas. */
  onComecar: () => void
}

/** Primeiro elemento marcado com o alvo que está de fato visível (o menu fechado no celular não conta). */
function encontrarAlvo(alvo: string): HTMLElement | null {
  for (const elemento of document.querySelectorAll<HTMLElement>(seletorDoAlvo(alvo))) {
    const caixa = elemento.getBoundingClientRect()
    if (caixa.width > 0 && caixa.height > 0 && getComputedStyle(elemento).visibility !== 'hidden') return elemento
  }
  return null
}

const mesmoRetangulo = (a: Retangulo | null, b: Retangulo | null) =>
  a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height)

/**
 * Tour guiado: escurece a tela, destaca o elemento do passo atual e mostra o balão com a explicação.
 * Nos passos de clique, o elemento destacado continua clicável e o clique avança o tour.
 */
export function TourGuiado({ passo, indice, total, onAvancar, onVoltar, onEncerrar, onComecar }: TourGuiadoProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const balaoRef = useRef<HTMLDivElement>(null)
  const [alvo, setAlvo] = useState<{ elemento: HTMLElement | null; caixa: Retangulo | null; procurando: boolean }>({
    elemento: null,
    caixa: null,
    procurando: Boolean(passo.alvo),
  })
  const [tamanhoBalao, setTamanhoBalao] = useState(BALAO_PADRAO)
  const [tela, setTela] = useState({ width: window.innerWidth, height: window.innerHeight })
  const ultimo = indice === total - 1
  const esperaClique = passo.acao === 'clique' && alvo.elemento !== null

  // Leva à página do passo, se ele estiver em outra
  useEffect(() => {
    if (passo.rota && passo.rota !== pathname) navigate(passo.rota)
  }, [passo.rota, pathname, navigate])

  // Acompanha o alvo a cada quadro: ele pode surgir depois (página carregando) ou se mover (rolagem)
  useEffect(() => {
    // Sem alvo, o estado inicial já basta (o componente é recriado a cada passo)
    if (!passo.alvo) return
    const nome = passo.alvo
    const inicio = performance.now()
    let rolou = false
    let quadro = 0
    const acompanhar = () => {
      const elemento = encontrarAlvo(nome)
      if (elemento && !rolou) {
        elemento.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        rolou = true
      }
      const caixa = elemento ? elemento.getBoundingClientRect() : null
      const procurando = !elemento && performance.now() - inicio < ESPERA_ALVO_MS
      const retangulo = caixa && { top: caixa.top, left: caixa.left, width: caixa.width, height: caixa.height }
      setAlvo((atual) =>
        atual.elemento === elemento && atual.procurando === procurando && mesmoRetangulo(atual.caixa, retangulo)
          ? atual
          : { elemento, caixa: retangulo, procurando },
      )
      quadro = requestAnimationFrame(acompanhar)
    }
    quadro = requestAnimationFrame(acompanhar)
    return () => cancelAnimationFrame(quadro)
  }, [passo.alvo])

  useEffect(() => {
    const aoRedimensionar = () => setTela({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', aoRedimensionar)
    return () => window.removeEventListener('resize', aoRedimensionar)
  }, [])

  // Mede o balão para posicioná-lo sem sair da tela
  useLayoutEffect(() => {
    const balao = balaoRef.current
    if (!balao) return
    const { width, height } = balao.getBoundingClientRect()
    setTamanhoBalao((atual) => (atual.width === width && atual.height === height ? atual : { width, height }))
  }, [passo.id, alvo.procurando, tela])

  // Foco no balão a cada passo, para leitores de tela e para o teclado
  useEffect(() => {
    if (!alvo.procurando) balaoRef.current?.focus({ preventScroll: true })
  }, [passo.id, alvo.procurando])

  // Passo de clique: o clique do usuário no elemento destacado avança
  useEffect(() => {
    if (!esperaClique || !alvo.elemento) return
    const elemento = alvo.elemento
    elemento.addEventListener('click', onAvancar)
    return () => elemento.removeEventListener('click', onAvancar)
  }, [esperaClique, alvo.elemento, onAvancar])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        onEncerrar()
      } else if (evento.key === 'ArrowRight' && !esperaClique && !ultimo) {
        onAvancar()
      } else if (evento.key === 'ArrowLeft' && indice > 0) {
        onVoltar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [esperaClique, ultimo, indice, onAvancar, onVoltar, onEncerrar])

  if (alvo.procurando) return null

  const destaque = alvo.caixa && areaDestacada(alvo.caixa, tela)
  const posicao = posicionarBalao(destaque, tamanhoBalao, tela)
  const tituloId = `tour-titulo-${passo.id}`

  return createPortal(
    // O contêiner deixa os cliques passarem; só os bloqueios em volta do destaque e o balão os capturam
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {destaque ? (
        <>
          {/* Recorte: a sombra enorme escurece tudo em volta do elemento destacado */}
          <div
            aria-hidden
            className="pointer-events-none fixed rounded-xl ring-2 ring-accent motion-safe:transition-all motion-safe:duration-200"
            style={{ ...destaque, boxShadow: '0 0 0 9999px var(--overlay)' }}
          />
          {/* Bloqueia cliques fora do destaque; no passo de clique, o próprio destaque fica livre */}
          <div aria-hidden className="pointer-events-auto fixed inset-x-0 top-0" style={{ height: destaque.top }} />
          <div aria-hidden className="pointer-events-auto fixed inset-x-0 bottom-0" style={{ top: destaque.top + destaque.height }} />
          <div aria-hidden className="pointer-events-auto fixed left-0" style={{ top: destaque.top, height: destaque.height, width: destaque.left }} />
          <div
            aria-hidden
            className="pointer-events-auto fixed right-0"
            style={{ top: destaque.top, height: destaque.height, left: destaque.left + destaque.width }}
          />
          {!esperaClique && <div aria-hidden className="pointer-events-auto fixed" style={destaque} />}
        </>
      ) : (
        <div aria-hidden className="pointer-events-auto fixed inset-0 bg-overlay" />
      )}

      <div
        ref={balaoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={`${tituloId}-texto`}
        tabIndex={-1}
        className="pointer-events-auto fixed w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl bg-elevated p-5 shadow-xl ring-1 ring-line outline-none motion-safe:transition-[top,left] motion-safe:duration-200"
        style={{ top: posicao.top, left: posicao.left }}
      >
        <p className="text-xs font-medium text-fg-3">
          {indice + 1} de {total}
        </p>
        <h2 id={tituloId} className="mt-1 font-semibold text-fg">
          {passo.titulo}
        </h2>
        <p id={`${tituloId}-texto`} className="mt-1.5 text-sm text-fg-2">
          {passo.texto}
        </p>

        <div className="mt-3 flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= indice ? 'bg-accent' : 'bg-line'}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {ultimo ? (
            <Button variant="secondary" size="sm" onClick={onEncerrar}>
              Concluir
            </Button>
          ) : (
            <button type="button" onClick={onEncerrar} className="text-sm font-medium text-fg-3 hover:text-fg">
              Pular tour
            </button>
          )}
          <div className="flex gap-2">
            {indice > 0 && (
              <Button variant="secondary" size="sm" onClick={onVoltar}>
                Voltar
              </Button>
            )}
            {ultimo ? (
              <Button size="sm" onClick={onComecar}>
                Cadastrar minha conta
              </Button>
            ) : esperaClique ? (
              <span className="self-center text-xs font-medium text-accent-fg">Clique no destaque</span>
            ) : (
              <Button size="sm" onClick={onAvancar}>
                Próximo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
