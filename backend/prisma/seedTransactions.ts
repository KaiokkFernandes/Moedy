import type { TransactionType } from "../src/generated/prisma/client.js";

export interface SeedTransaction {
  /** Identificador estável: rodar o seed de novo não duplica as transações. */
  externalId: string;
  conta: "corrente" | "cartao";
  /** Nome da categoria padrão, ou null para deixar sem categoria. */
  categoria: string | null;
  descricao: string;
  valor: number;
  data: Date;
  tipo: TransactionType;
}

/** Gerador pseudoaleatório com semente, para o seed produzir sempre os mesmos dados. */
function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Conta = SeedTransaction["conta"];

interface Fixo {
  dia: number;
  descricao: string;
  categoria: string;
  valor: number;
  /** Variação máxima em centavos, para contas que mudam todo mês (luz, água). */
  variacao?: number;
  conta: Conta;
  tipo?: TransactionType;
}

const FIXOS: Fixo[] = [
  { dia: 1, descricao: "Rendimento poupança", categoria: "Rendimentos", valor: 4200, variacao: 1500, conta: "corrente", tipo: "RECEITA" },
  { dia: 3, descricao: "Smart Fit - mensalidade", categoria: "Saúde", valor: 11990, conta: "cartao" },
  { dia: 5, descricao: "Salário - Tech Soluções Ltda", categoria: "Salário", valor: 650000, conta: "corrente", tipo: "RECEITA" },
  { dia: 8, descricao: "Netflix", categoria: "Assinaturas", valor: 4490, conta: "cartao" },
  { dia: 10, descricao: "Aluguel", categoria: "Moradia", valor: 180000, conta: "corrente" },
  { dia: 10, descricao: "Condomínio", categoria: "Moradia", valor: 45000, conta: "corrente" },
  { dia: 12, descricao: "Vivo Fibra - internet", categoria: "Contas", valor: 11990, conta: "corrente" },
  { dia: 14, descricao: "Spotify", categoria: "Assinaturas", valor: 2190, conta: "cartao" },
  { dia: 15, descricao: "Enel - conta de luz", categoria: "Contas", valor: 17500, variacao: 4000, conta: "corrente" },
  { dia: 16, descricao: "Alura - assinatura", categoria: "Educação", valor: 8500, conta: "cartao" },
  { dia: 18, descricao: "Sabesp - conta de água", categoria: "Contas", valor: 8200, variacao: 1500, conta: "corrente" },
  { dia: 20, descricao: "Claro - celular", categoria: "Contas", valor: 5990, conta: "corrente" },
  { dia: 22, descricao: "Amazon Prime", categoria: "Assinaturas", valor: 1990, conta: "cartao" },
];

interface Variavel {
  /** Chance de acontecer em um dia qualquer (0 a 1). */
  chance: number;
  /** Se informado, só acontece nesses dias da semana (0 = domingo). */
  diasDaSemana?: number[];
  descricoes: string[];
  categoria: string | null;
  min: number;
  max: number;
  conta: Conta;
  tipo?: TransactionType;
}

const VARIAVEIS: Variavel[] = [
  { chance: 0.9, diasDaSemana: [6], descricoes: ["Pão de Açúcar", "Carrefour", "Assaí Atacadista", "Supermercado Extra"], categoria: "Mercado", min: 18000, max: 42000, conta: "corrente" },
  { chance: 0.12, descricoes: ["Hortifruti Natural da Terra", "Padaria Bella Paulista", "Mercadinho do bairro"], categoria: "Mercado", min: 1800, max: 6500, conta: "cartao" },
  { chance: 0.32, descricoes: ["iFood - Burger King", "iFood - Sushi Yamato", "iFood - Pizzaria Bráz", "iFood - Marmitaria da Vó", "iFood - Açaí do Monstro"], categoria: "Alimentação", min: 2800, max: 7500, conta: "cartao" },
  { chance: 0.18, diasDaSemana: [1, 2, 3, 4, 5], descricoes: ["Restaurante Sabor Caseiro", "Almoço - Quilo Bom", "Starbucks", "Cafeteria Santo Grão"], categoria: "Alimentação", min: 1600, max: 4800, conta: "cartao" },
  { chance: 0.3, descricoes: ["Uber", "Uber", "99 Táxi"], categoria: "Transporte", min: 1200, max: 3800, conta: "cartao" },
  { chance: 0.06, descricoes: ["Posto Shell", "Posto Ipiranga"], categoria: "Transporte", min: 15000, max: 25000, conta: "corrente" },
  { chance: 0.05, descricoes: ["Droga Raia", "Drogasil", "Farmácia São Paulo"], categoria: "Saúde", min: 2500, max: 12000, conta: "cartao" },
  { chance: 0.25, diasDaSemana: [5, 6, 0], descricoes: ["Cinemark", "Bar do Zé", "Ingresso.com", "Boteco Boa Praça", "Steam"], categoria: "Lazer", min: 3500, max: 16000, conta: "cartao" },
  { chance: 0.05, descricoes: ["Amazon", "Mercado Livre", "Renner", "Magazine Luiza", "Shopee"], categoria: "Compras", min: 5000, max: 35000, conta: "cartao" },
  { chance: 0.035, descricoes: ["Freelance - site institucional", "Freelance - consultoria", "Freelance - landing page"], categoria: "Freelance", min: 80000, max: 180000, conta: "corrente", tipo: "RECEITA" },
  // Sem categoria, como chegariam de um extrato importado
  { chance: 0.05, descricoes: ["PIX enviado - João Silva", "PIX enviado - Maria Souza", "Compra no débito", "Saque 24h"], categoria: null, min: 2000, max: 20000, conta: "corrente" },
  { chance: 0.02, descricoes: ["PIX recebido - Carlos Lima", "PIX recebido - Ana Paula"], categoria: null, min: 3000, max: 15000, conta: "corrente", tipo: "RECEITA" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Gera cerca de 3 meses de transações fictícias, terminando em `hoje`. */
export function buildSeedTransactions(hoje = new Date(), dias = 92): SeedTransaction[] {
  const fim = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const transactions: SeedTransaction[] = [];

  for (let time = fim - (dias - 1) * DAY_MS; time <= fim; time += DAY_MS) {
    const data = new Date(time);
    const iso = data.toISOString().slice(0, 10);
    // Semente derivada da data: cada dia gera sempre as mesmas transações
    const random = createRandom(Number(iso.replaceAll("-", "")));
    const between = (min: number, max: number) => Math.round(min + random() * (max - min));

    FIXOS.forEach((fixo, index) => {
      if (fixo.dia !== data.getUTCDate()) return;
      const variacao = fixo.variacao ? between(-fixo.variacao, fixo.variacao) : 0;
      transactions.push({
        externalId: `seed-${iso}-fixo-${index}`,
        conta: fixo.conta,
        categoria: fixo.categoria,
        descricao: fixo.descricao,
        valor: fixo.valor + variacao,
        data,
        tipo: fixo.tipo ?? "DESPESA",
      });
    });

    VARIAVEIS.forEach((variavel, index) => {
      // Sorteia sempre os três números, para que mudar uma regra não altere as demais
      const sorteio = random();
      const descricao = variavel.descricoes[Math.floor(random() * variavel.descricoes.length)]!;
      const valor = between(variavel.min, variavel.max);

      if (variavel.diasDaSemana && !variavel.diasDaSemana.includes(data.getUTCDay())) return;
      if (sorteio >= variavel.chance) return;

      transactions.push({
        externalId: `seed-${iso}-var-${index}`,
        conta: variavel.conta,
        categoria: variavel.categoria,
        descricao,
        valor,
        data,
        tipo: variavel.tipo ?? "DESPESA",
      });
    });
  }

  return transactions;
}
