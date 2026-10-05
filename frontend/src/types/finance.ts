export type AccountType = 'CORRENTE' | 'POUPANCA' | 'CARTAO' | 'DINHEIRO'
export type TransactionType = 'DESPESA' | 'RECEITA'

/** Todos os valores monetários trafegam em centavos (inteiros). */
export interface Account {
  id: string
  nome: string
  tipo: AccountType
  saldoInicial: number
  saldoAtual: number
  totalTransacoes: number
  origem: 'MANUAL' | 'IMPORT' | 'PLUGGY'
  createdAt: string
}

export interface AccountInput {
  nome: string
  tipo: AccountType
  saldoInicial: number
}

export interface Category {
  id: string
  nome: string
  cor: string
  icone: string
  tipo: TransactionType
}

export type CategoryInput = Omit<Category, 'id'>

export interface Transaction {
  id: string
  accountId: string
  categoryId: string | null
  descricao: string
  valor: number
  /** AAAA-MM-DD */
  data: string
  tipo: TransactionType
  /** Transferência entre contas ou pagamento de fatura: não entra em relatórios nem nos totais. */
  ignorarNosRelatorios: boolean
  category: Pick<Category, 'id' | 'nome' | 'cor' | 'icone'> | null
  account: Pick<Account, 'id' | 'nome'>
}

export interface TransactionInput {
  accountId: string
  categoryId: string | null
  descricao: string
  valor: number
  data: string
  tipo: TransactionType
  ignorarNosRelatorios: boolean
}

export interface TransactionFilters {
  dataInicio?: string
  dataFim?: string
  accountId?: string
  categoryId?: string
  semCategoria?: boolean
  tipo?: TransactionType
  busca?: string
  page: number
  pageSize: number
}

export interface TransactionList {
  itens: Transaction[]
  total: number
  page: number
  pageSize: number
  totalReceitas: number
  totalDespesas: number
}
