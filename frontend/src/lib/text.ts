/** Minúsculas, sem acentos e com espaços simples — a mesma normalização que a API usa nas regras. */
export function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Palavras genéricas de extrato, que não ajudam a identificar o estabelecimento. */
const NOISE_WORDS = new Set([
  'compra', 'pagamento', 'pgto', 'pag', 'pix', 'enviado', 'recebido', 'transferencia', 'ted', 'doc',
  'debito', 'credito', 'cartao', 'de', 'da', 'do', 'no', 'na', 'em', 'para', 'ltda', 'sa', 'br', 'com', 'www',
])

function significantWords(text: string) {
  const words = text.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  const isNoise = (word: string) => word.length < 2 || /^\d+$/.test(word) || NOISE_WORDS.has(word)

  // Pula o ruído do começo e pega as palavras seguintes até o próximo ruído
  const start = words.findIndex((word) => !isNoise(word))
  if (start < 0) return []
  const end = words.findIndex((word, index) => index > start && isNoise(word))
  return words.slice(start, end < 0 ? undefined : end)
}

/**
 * Sugere a palavra-chave de uma regra a partir da descrição de uma transação:
 * "iFood - Burger King" → "ifood"; "UBER *TRIP" → "uber"; "PIX enviado - João Silva" → "joao silva".
 * É só um ponto de partida: o usuário pode editar antes de salvar.
 */
export function suggestKeyword(descricao: string) {
  const text = normalizeText(descricao)
  // O trecho antes de " - ", "*" ou "/" costuma ser o nome do estabelecimento
  const firstSegment = text.split(/\s[-–|/]\s|\*/)[0] ?? ''

  let words = significantWords(firstSegment)
  if (words.length === 0) words = significantWords(text)

  const suggestion = words.slice(0, 2).join(' ')
  // A regra só funciona se a palavra-chave aparecer inteira na descrição
  if (suggestion && text.includes(suggestion)) return suggestion
  return words[0] ?? text
}
