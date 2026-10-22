import { useRef } from 'react'
import { Landmark, Target, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface BoasVindasProps {
  aberto: boolean
  nome: string
  onFazerTour: () => void
  onAgoraNao: () => void
}

const DESTAQUES = [
  { icone: Landmark, texto: 'Cadastre suas contas e cartões' },
  { icone: Upload, texto: 'Importe o extrato do banco, sem digitar' },
  { icone: Target, texto: 'Defina orçamentos e receba alertas' },
]

/** Convite do primeiro acesso: fazer o tour guiado agora ou explorar sozinho. */
export function BoasVindas({ aberto, nome, onFazerTour, onAgoraNao }: BoasVindasProps) {
  const primeiroNome = nome.trim().split(/\s+/)[0]
  // O <dialog> avisa que fechou também quando quem fecha é o próprio app (ao começar o tour);
  // só fechar pelo usuário (Esc, fundo ou "Explorar sozinho") conta como "agora não"
  const escolheuTour = useRef(false)
  const fazerTour = () => {
    escolheuTour.current = true
    onFazerTour()
  }
  const aoFechar = () => {
    if (!escolheuTour.current) onAgoraNao()
  }

  return (
    <Modal open={aberto} onClose={aoFechar} title={primeiroNome ? `Boas-vindas, ${primeiroNome}!` : 'Boas-vindas!'}>
      <p className="text-sm text-fg-2">Aqui você organiza suas finanças em poucos passos:</p>
      <ul className="mt-4 space-y-3">
        {DESTAQUES.map(({ icone: Icone, texto }) => (
          <li key={texto} className="flex items-center gap-3 text-sm text-fg">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft-strong text-success">
              <Icone className="size-4" aria-hidden />
            </span>
            {texto}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-fg-2">Quer um tour rápido? Leva cerca de um minuto.</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onAgoraNao}>
          Explorar sozinho
        </Button>
        <Button onClick={fazerTour}>Fazer o tour</Button>
      </div>
    </Modal>
  )
}
