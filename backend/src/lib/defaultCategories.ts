import type { TransactionType } from "../generated/prisma/client.js";

interface DefaultCategory {
  nome: string;
  cor: string;
  /** Nome do ícone no lucide (kebab-case), usado pelo frontend. */
  icone: string;
  tipo: TransactionType;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { nome: "Alimentação", cor: "#f97316", icone: "utensils", tipo: "DESPESA" },
  { nome: "Mercado", cor: "#84cc16", icone: "shopping-cart", tipo: "DESPESA" },
  { nome: "Transporte", cor: "#3b82f6", icone: "car", tipo: "DESPESA" },
  { nome: "Moradia", cor: "#8b5cf6", icone: "house", tipo: "DESPESA" },
  { nome: "Contas", cor: "#eab308", icone: "receipt", tipo: "DESPESA" },
  { nome: "Saúde", cor: "#ef4444", icone: "heart-pulse", tipo: "DESPESA" },
  { nome: "Lazer", cor: "#ec4899", icone: "gamepad-2", tipo: "DESPESA" },
  { nome: "Assinaturas", cor: "#06b6d4", icone: "repeat", tipo: "DESPESA" },
  { nome: "Educação", cor: "#6366f1", icone: "graduation-cap", tipo: "DESPESA" },
  { nome: "Compras", cor: "#d946ef", icone: "shopping-bag", tipo: "DESPESA" },
  { nome: "Outros", cor: "#64748b", icone: "ellipsis", tipo: "DESPESA" },
  { nome: "Salário", cor: "#10b981", icone: "banknote", tipo: "RECEITA" },
  { nome: "Freelance", cor: "#14b8a6", icone: "laptop", tipo: "RECEITA" },
  { nome: "Rendimentos", cor: "#22c55e", icone: "trending-up", tipo: "RECEITA" },
  { nome: "Outros", cor: "#64748b", icone: "ellipsis", tipo: "RECEITA" },
];
