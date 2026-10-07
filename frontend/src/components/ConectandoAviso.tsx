/** Aviso para a espera longa da primeira requisição, enquanto o servidor acorda. */
export function ConectandoAviso() {
  return (
    <p role="status" className="text-center text-sm text-fg-2">
      Conectando ao servidor…
      <span className="mt-1 block text-xs text-fg-3">
        Depois de um tempo sem uso, a primeira conexão pode levar até um minuto.
      </span>
    </p>
  )
}
