interface ParseOptions {
  /**
   * Aceita separador de milhar ("1.234,56", "1,234.56"). Com `false`, um único
   * separador é sempre o decimal — é o caso do OFX, que nunca usa milhar.
   */
  thousands?: boolean;
}

/**
 * Converte um valor escrito como texto para centavos, só com aritmética de inteiros
 * (nunca passa por Float). Aceita "1.234,56", "1234.56", "-50", "R$ 10,5", "(12,00)" e "12,00-".
 * Lança um Error com o motivo quando o texto não é um valor válido.
 */
export function parseCentavos(input: string, { thousands = true }: ParseOptions = {}): number {
  let text = input.replace(/R\$|\s/g, "");
  if (!text) throw new Error("valor vazio");

  let negative = false;
  if (/^\(.+\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.endsWith("-")) {
    negative = true;
    text = text.slice(0, -1);
  }
  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  } else if (text.startsWith("+")) {
    text = text.slice(1);
  }

  if (!/^[\d.,]+$/.test(text) || !/\d/.test(text)) {
    throw new Error(`valor inválido: "${input.trim()}"`);
  }

  // Descobre qual separador (se houver) é o decimal
  const lastDot = text.lastIndexOf(".");
  const lastComma = text.lastIndexOf(",");
  let decimalIndex = -1;

  if (lastDot >= 0 && lastComma >= 0) {
    // Com os dois, o que vem por último é o decimal: "1.234,56" ou "1,234.56"
    decimalIndex = Math.max(lastDot, lastComma);
  } else if (lastDot >= 0 || lastComma >= 0) {
    const index = Math.max(lastDot, lastComma);
    const occurrences = text.split(text[index]!).length - 1;
    const digitsAfter = text.length - index - 1;
    if (!thousands) {
      if (occurrences > 1) throw new Error(`valor inválido: "${input.trim()}"`);
      decimalIndex = index;
    } else if (occurrences === 1 && digitsAfter !== 3) {
      decimalIndex = index;
    }
    // Senão é milhar: "1.234" ou "1.234.567"
  }

  const integerPart = decimalIndex >= 0 ? text.slice(0, decimalIndex) : text;
  const decimalPart = decimalIndex >= 0 ? text.slice(decimalIndex + 1) : "";

  // A parte inteira só pode ter dígitos, ou grupos de milhar bem formados com um único tipo de separador
  if (!/^\d*$/.test(integerPart) && !/^\d{1,3}(\.\d{3})+$/.test(integerPart) && !/^\d{1,3}(,\d{3})+$/.test(integerPart)) {
    throw new Error(`valor inválido: "${input.trim()}"`);
  }
  if (!/^\d*$/.test(decimalPart)) {
    throw new Error(`valor inválido: "${input.trim()}"`);
  }
  if (/[1-9]/.test(decimalPart.slice(2))) {
    throw new Error(`valor com mais de duas casas decimais: "${input.trim()}"`);
  }

  const centavos =
    Number(integerPart.replace(/[.,]/g, "") || "0") * 100 + Number(decimalPart.slice(0, 2).padEnd(2, "0"));
  if (!Number.isSafeInteger(centavos)) {
    throw new Error(`valor muito alto: "${input.trim()}"`);
  }

  return negative ? -centavos : centavos;
}
