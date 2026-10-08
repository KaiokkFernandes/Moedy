import { Link } from 'react-router-dom'

/** Página 404: endereço que não corresponde a nenhuma tela do app. */
export function NaoEncontrada() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 text-center ring-1 ring-line">
        <p className="text-sm font-medium text-fg-3">Erro 404</p>
        <h1 className="mt-1 text-xl font-semibold text-fg">Página não encontrada</h1>
        <p className="mt-2 text-sm text-fg-2">O endereço que você abriu não existe ou foi movido.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
