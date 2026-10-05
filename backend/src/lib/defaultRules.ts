import type { TransactionType } from "../generated/prisma/client.js";

interface DefaultRule {
  palavraChave: string;
  /** Nome da categoria padrão (veja defaultCategories.ts). */
  categoria: string;
  tipo: TransactionType;
}

function rules(categoria: string, tipo: TransactionType, palavrasChave: string[]): DefaultRule[] {
  return palavrasChave.map((palavraChave) => ({ palavraChave, categoria, tipo }));
}

/**
 * Regras de categorização criadas para todo usuário novo, com nomes comuns em extratos
 * brasileiros. A comparação ignora acentos e maiúsculas, e a palavra-chave mais longa vence
 * ("uber eats" ganha de "uber"; "mercado livre" e "amazon prime" ganham de nomes mais curtos).
 */
export const DEFAULT_RULES: DefaultRule[] = [
  ...rules("Alimentação", "DESPESA", [
    "ifood", "rappi", "uber eats", "restaurante", "lanchonete", "padaria", "pizzaria", "burger king", "mcdonalds", "starbucks",
  ]),
  ...rules("Mercado", "DESPESA", [
    "supermercado", "mercadinho", "hortifruti", "carrefour", "pão de açúcar", "assaí", "atacadão",
  ]),
  ...rules("Transporte", "DESPESA", [
    "uber", "99", "99app", "posto", "combustível", "estacionamento", "sem parar", "ipiranga",
  ]),
  ...rules("Moradia", "DESPESA", ["aluguel", "condomínio"]),
  ...rules("Contas", "DESPESA", ["enel", "sabesp", "vivo", "claro", "tim", "conta de luz", "internet"]),
  ...rules("Saúde", "DESPESA", ["farmácia", "drogaria", "drogasil", "droga raia", "smart fit", "academia", "unimed"]),
  ...rules("Lazer", "DESPESA", ["cinema", "cinemark", "ingresso", "steam"]),
  ...rules("Assinaturas", "DESPESA", [
    "netflix", "spotify", "amazon prime", "prime video", "disney", "hbo", "youtube premium",
  ]),
  ...rules("Educação", "DESPESA", ["alura", "udemy", "curso", "livraria"]),
  ...rules("Compras", "DESPESA", [
    "amazon", "mercado livre", "mercadolivre", "shopee", "magazine luiza", "magalu", "renner", "aliexpress", "shein",
  ]),
  ...rules("Salário", "RECEITA", ["salário"]),
  ...rules("Freelance", "RECEITA", ["freelance"]),
  ...rules("Rendimentos", "RECEITA", ["rendimento", "juros", "dividendos"]),
];
