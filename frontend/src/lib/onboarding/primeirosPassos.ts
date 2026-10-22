export interface ItemPrimeirosPassos {
  id: 'conta' | 'transacoes' | 'orcamento' | 'tour'
  titulo: string
  descricao: string
  feito: boolean
  /** Página que resolve o item; sem rota, o item abre o tour guiado. */
  rota?: string
  acao: string
}

export interface ProgressoPrimeirosPassos {
  contas: number
  transacoes: number
  /** Orçamentos do mês atual. */
  orcamentos: number
  tourFeito: boolean
}

/** Checklist do Painel, marcado a partir do que o usuário já tem de verdade (não de cliques). */
export function primeirosPassos({ contas, transacoes, orcamentos, tourFeito }: ProgressoPrimeirosPassos) {
  const itens: ItemPrimeirosPassos[] = [
    {
      id: 'conta',
      titulo: 'Cadastre uma conta',
      descricao: 'Conta corrente, poupança, cartão ou dinheiro, com o saldo de hoje.',
      feito: contas > 0,
      rota: '/contas',
      acao: 'Ir para Contas',
    },
    {
      id: 'transacoes',
      titulo: 'Importe o extrato ou lance uma transação',
      descricao: 'O arquivo OFX ou CSV do banco traz tudo de uma vez.',
      feito: transacoes > 0,
      rota: '/importar',
      acao: 'Importar extrato',
    },
    {
      id: 'orcamento',
      titulo: 'Crie um orçamento para o mês',
      descricao: 'Um limite por categoria, com alerta ao chegar perto.',
      feito: orcamentos > 0,
      rota: '/orcamentos',
      acao: 'Criar orçamento',
    },
    {
      id: 'tour',
      titulo: 'Faça o tour guiado',
      descricao: 'Um minuto para conhecer cada parte do app.',
      feito: tourFeito,
      acao: 'Começar o tour',
    },
  ]
  const feitos = itens.filter((item) => item.feito).length
  return { itens, feitos, total: itens.length, completo: feitos === itens.length }
}
