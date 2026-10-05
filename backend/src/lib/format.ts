const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Centavos como moeda, para textos gerados pelo servidor: 123456 → "R$ 1.234,56". */
export function formatBRL(centavos: number): string {
  // O Intl usa espaço não separável entre "R$" e o número; em texto corrido, um espaço comum basta
  return brl.format(centavos / 100).replace(/ /g, " ");
}

/** 12.5 → "12,5%". */
export function formatPercent(value: number): string {
  return `${percent.format(value)}%`;
}

/** (10) → "outubro". */
export function monthName(mes: number): string {
  return MONTHS[mes - 1] ?? "";
}
