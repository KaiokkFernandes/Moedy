import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  falhou: boolean
}

/**
 * Tela de erro global: se um componente quebrar durante a renderização, o usuário vê uma
 * mensagem com saída, em vez de uma página em branco. Também cobre o caso de uma versão nova
 * ter sido publicada com o app aberto (o arquivo antigo de uma página deixa de existir):
 * recarregar resolve.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { falhou: false }

  static getDerivedStateFromError(): State {
    return { falhou: true }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // Fica no console do navegador para diagnóstico; não há serviço de monitoramento configurado
    console.error('Erro não tratado na interface:', erro, info.componentStack)
  }

  render() {
    if (!this.state.falhou) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-4">
        <div role="alert" className="w-full max-w-sm rounded-2xl bg-surface p-8 text-center ring-1 ring-line">
          <h1 className="text-xl font-semibold text-fg">Algo deu errado</h1>
          <p className="mt-2 text-sm text-fg-2">
            A página encontrou um erro inesperado. Seus dados não foram afetados. Recarregue para continuar.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Recarregar a página
            </button>
            <a href="/" className="rounded-lg px-4 py-2 text-sm font-medium text-accent-fg hover:underline">
              Voltar ao início
            </a>
          </div>
        </div>
      </main>
    )
  }
}
