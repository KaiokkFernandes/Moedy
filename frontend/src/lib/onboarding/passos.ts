/**
 * Um passo do tour guiado. O `alvo` é o valor do atributo data-tour do elemento destacado; sem
 * alvo (ou se ele não estiver visível, como o menu fechado no celular), o balão aparece no centro.
 */
export interface PassoTour {
  id: string
  titulo: string
  texto: string
  alvo?: string
  /** Página onde o alvo está; o tour navega até ela antes de mostrar o passo. */
  rota?: string
  /** "clique": o próprio usuário clica no elemento destacado para avançar. */
  acao?: 'clique'
}

export const PASSOS_TOUR: PassoTour[] = [
  {
    id: 'boas-vindas',
    titulo: 'Vamos conhecer o Moedy',
    texto: 'Em um minuto você vê onde fica cada coisa. Use as setas do teclado para navegar ou Esc para sair quando quiser.',
  },
  {
    id: 'painel',
    alvo: 'nav-painel',
    rota: '/',
    titulo: 'Painel',
    texto: 'O resumo do mês: quanto entrou, quanto saiu, o saldo e para onde foi o dinheiro.',
  },
  {
    id: 'contas',
    alvo: 'nav-contas',
    acao: 'clique',
    titulo: 'Tudo começa pelas contas',
    texto: 'Conta corrente, poupança, cartão ou dinheiro: cada transação pertence a uma conta. Clique em Contas para continuar.',
  },
  {
    id: 'nova-conta',
    alvo: 'nova-conta',
    rota: '/contas',
    titulo: 'Cadastre suas contas',
    texto: 'Use este botão para criar cada conta, com o saldo que ela tem hoje. Você faz isso depois do tour.',
  },
  {
    id: 'importar',
    alvo: 'nav-importar',
    titulo: 'Importe o extrato do banco',
    texto: 'Em vez de digitar tudo, envie o arquivo OFX ou CSV do banco. O app sugere a categoria de cada lançamento.',
  },
  {
    id: 'transacoes',
    alvo: 'nav-transacoes',
    titulo: 'Transações',
    texto: 'Todas as entradas e saídas, com filtros e busca. Dá para lançar uma nova à mão e corrigir a categoria de qualquer uma.',
  },
  {
    id: 'regras',
    alvo: 'nav-regras',
    titulo: 'Regras de categorização',
    texto: 'Ensine o app uma vez: "uber" é Transporte, "ifood" é Alimentação. As próximas importações já chegam categorizadas.',
  },
  {
    id: 'orcamentos',
    alvo: 'nav-orcamentos',
    titulo: 'Orçamentos',
    texto: 'Defina quanto quer gastar por categoria no mês e acompanhe o quanto já foi.',
  },
  {
    id: 'alertas',
    alvo: 'notificacoes',
    titulo: 'Alertas',
    texto: 'Você é avisado aqui quando um orçamento chega a 80% ou estoura, e quando aparece um gasto fora do normal.',
  },
  {
    id: 'relatorios',
    alvo: 'nav-relatorios',
    titulo: 'Relatórios',
    texto: 'A evolução mês a mês, os maiores gastos e as cobranças que se repetem todo mês.',
  },
  {
    id: 'fim',
    titulo: 'Pronto para começar',
    texto: 'O próximo passo é cadastrar sua primeira conta. O checklist do Painel mostra o que falta, e o tour pode ser refeito em Configurações.',
  },
]

/** Seletor CSS dos elementos marcados como alvo de um passo. */
export function seletorDoAlvo(alvo: string) {
  return `[data-tour="${alvo}"]`
}

/** Estado do tour: índice do passo atual, ou null quando fechado. */
export type EstadoTour = number | null

export type AcaoTour = { tipo: 'iniciar' } | { tipo: 'avancar' } | { tipo: 'voltar' } | { tipo: 'encerrar' }

/** Navegação entre os passos. Avançar no último passo encerra o tour. */
export function tourReducer(estado: EstadoTour, acao: AcaoTour, total = PASSOS_TOUR.length): EstadoTour {
  switch (acao.tipo) {
    case 'iniciar':
      return total > 0 ? 0 : null
    case 'avancar':
      return estado === null || estado + 1 >= total ? null : estado + 1
    case 'voltar':
      return estado === null ? null : Math.max(0, estado - 1)
    case 'encerrar':
      return null
  }
}
