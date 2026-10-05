/**
 * Cores dos gráficos. Receitas/despesas foram validadas para daltonismo (protanopia e
 * deuteranopia) e contraste sobre fundo branco; ainda assim, todo gráfico com mais de uma
 * série tem legenda, para a identidade nunca depender só da cor.
 */
export const CHART_COLORS = {
  receitas: '#059669',
  despesas: '#dc2626',
  /** Linha de saldo: tinta neutra, diferenciada das barras pela forma. */
  saldo: '#334155',
  /** Série de contexto (ex.: mês anterior), propositalmente apagada. */
  contexto: '#94a3b8',
  /** Fatia "Outras" da rosca. */
  outras: '#cbd5e1',
  grade: '#e2e8f0',
  eixo: '#64748b',
}

export const AXIS_TICK = { fill: CHART_COLORS.eixo, fontSize: 12 }
