import { normalizeText } from "./text.js";

// "01/12", "3 de 10", "parc 2/6", "parcela 02 de 12"
const INSTALLMENT = /\b(?:parc(?:ela)?\.?\s*)?\d{1,2}\s*(?:\/|\bde\b)\s*\d{1,2}\b/gi;
// Último "pedaço" da descrição, quando contém dígitos: códigos de autorização, datas, números de loja
const TRAILING_CODE = /[\s*#:.-]+[^\s*]*\d[^\s*]*$/;

function stripCodes(text: string): string {
  let result = text.replace(INSTALLMENT, " ").replace(/\s+/g, " ").trim();
  // Remove códigos do fim, mas nunca a descrição inteira ("99app" continua "99app")
  while (/\s/.test(result) || /[*#]/.test(result)) {
    const stripped = result.replace(TRAILING_CODE, "").trim();
    if (stripped === result || !stripped) break;
    result = stripped;
  }
  return result;
}

/**
 * Chave para agrupar descrições do mesmo estabelecimento: minúsculas, sem acentos, sem número
 * de parcela e sem códigos no fim. "NETFLIX.COM 12/10 8842" e "Netflix.com" viram "netflix com".
 */
export function merchantKey(descricao: string): string {
  return normalizeText(stripCodes(descricao).replace(/[^\p{L}\p{N}]+/gu, " ")) || normalizeText(descricao);
}

/** Nome para exibir: a descrição original, só sem a parcela e os códigos do fim. */
export function merchantName(descricao: string): string {
  return stripCodes(descricao).replace(/[\s*#:.-]+$/, "") || descricao.trim();
}
