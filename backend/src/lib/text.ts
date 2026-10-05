/** Minúsculas, sem acentos e com espaços simples: "  Pão de AÇÚCAR " → "pao de acucar". */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
