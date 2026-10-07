import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categorizeWithAi, validateAiSuggestions } from "./categorize.js";
import { AiError, type AiCategoryOption, type AiRawSuggestion, type AiTransactionInput, type Categorizer } from "./types.js";
import { groupByDescription, type CategorizeInput } from "./batching.js";

const CATEGORIES: AiCategoryOption[] = [
  { id: "cat-despesa", nome: "Alimentação", tipo: "DESPESA" },
  { id: "cat-receita", nome: "Salário", tipo: "RECEITA" },
];

/** Categorizador simulado: responde a cada lote com `respond` e conta as chamadas. */
function fakeCategorizer(respond: (items: AiTransactionInput[]) => AiRawSuggestion[] | Promise<AiRawSuggestion[]>) {
  const sent: AiTransactionInput[][] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const categorizer: Categorizer = {
    modelo: "fake",
    async categorize(items) {
      sent.push(items);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      try {
        return await respond(items);
      } finally {
        inFlight -= 1;
      }
    },
  };
  return { categorizer, sent, maxInFlight: () => maxInFlight };
}


/** Nomes distintos mesmo depois de normalizados (números no fim são removidos pela normalização). */
const nomeUnico = (i: number) => `Loja ${"abcdefghijklmnopqrstuvwxyz"[i % 26]}${"abcdefghijklmnopqrstuvwxyz"[Math.floor(i / 26) % 26]}`;

const item = (indice: number, descricao: string, tipo: "DESPESA" | "RECEITA" = "DESPESA", valor = 1000): CategorizeInput => ({
  indice,
  descricao,
  valor,
  tipo,
});

describe("dedupe antes do envio", () => {
  it("descrições iguais depois de normalizadas viram um item só no envio, e todas recebem a sugestão", async () => {
    const items = [
      item(0, "UBER *TRIP"),
      item(1, "Uber Trip 03/10"),
      item(2, "uber trip"),
      item(3, "Padaria Bela"),
    ];
    const { categorizer, sent } = fakeCategorizer((batch) =>
      batch.map((entry) => ({
        indice: entry.indice,
        categoryId: entry.descricao.toLowerCase().includes("uber") ? "cat-despesa" : null,
        confianca: "ALTA" as const,
      })),
    );

    const outcome = await categorizeWithAi(categorizer, items, CATEGORIES, { maxTransacoes: 500 });

    assert.equal(sent.length, 1, "um lote só");
    assert.equal(sent[0]!.length, 2, "duas descrições distintas, não quatro lançamentos");
    assert.deepEqual([...outcome.sugestoes.keys()].sort(), [0, 1, 2, 3]);
    assert.equal(outcome.sugestoes.get(1)!.categoryId, "cat-despesa");
    assert.equal(outcome.enviadas, 4);
  });

  it("mesma descrição com tipos diferentes não é agrupada", () => {
    const groups = groupByDescription([item(0, "PIX"), item(1, "PIX", "RECEITA")]);
    assert.equal(groups.length, 2);
  });
});

describe("lotes e concorrência", () => {
  it("divide em lotes e respeita o limite de chamadas em paralelo", async () => {
    const items = Array.from({ length: 120 }, (_, index) => item(index, nomeUnico(index)));
    const { categorizer, sent, maxInFlight } = fakeCategorizer(async (batch) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return batch.map((entry) => ({ indice: entry.indice, categoryId: null, confianca: "BAIXA" as const }));
    });

    await categorizeWithAi(categorizer, items, CATEGORIES, { maxTransacoes: 500, batchSize: 50, concurrency: 2 });

    assert.deepEqual(sent.map((batch) => batch.length), [50, 50, 20]);
    assert.ok(maxInFlight() <= 2, `no máximo 2 em paralelo (foram ${maxInFlight()})`);
  });

  it("limite por importação: o que passar do teto não é enviado e fica contado", async () => {
    const items = Array.from({ length: 10 }, (_, index) => item(index, nomeUnico(index)));
    const { categorizer, sent } = fakeCategorizer((batch) =>
      batch.map((entry) => ({ indice: entry.indice, categoryId: null, confianca: "BAIXA" as const })),
    );

    const outcome = await categorizeWithAi(categorizer, items, CATEGORIES, { maxTransacoes: 4 });

    assert.equal(sent.flat().length, 4);
    assert.equal(outcome.naoEnviadas, 6);
  });
});

describe("falhas", () => {
  it("um lote com erro não derruba os outros: o status fica PARCIAL", async () => {
    const items = Array.from({ length: 60 }, (_, index) => item(index, nomeUnico(index)));
    let call = 0;
    const { categorizer } = fakeCategorizer((batch) => {
      call += 1;
      if (call === 1) throw new AiError("TEMPO_ESGOTADO", "demorou");
      return batch.map((entry) => ({ indice: entry.indice, categoryId: "cat-despesa", confianca: "ALTA" as const }));
    });

    const outcome = await categorizeWithAi(categorizer, items, CATEGORIES, { maxTransacoes: 500, batchSize: 50 });

    assert.equal(outcome.status, "PARCIAL");
    assert.equal(outcome.motivo, "a IA demorou demais para responder");
    assert.equal(outcome.enviadas, 10, "só o lote de 10 deu certo");
    assert.equal(outcome.sugestoes.size, 10);
  });

  it("todos os lotes com erro: status FALHOU, sem sugestões", async () => {
    const { categorizer } = fakeCategorizer(() => {
      throw new AiError("API", "falhou", 500);
    });
    const outcome = await categorizeWithAi(categorizer, [item(0, "Loja")], CATEGORIES, { maxTransacoes: 500 });
    assert.equal(outcome.status, "FALHOU");
    assert.equal(outcome.sugestoes.size, 0);
  });

  it("o aviso de falha para o log traz só o código e o status, nunca a descrição nem a chave", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-segredo-de-teste";
    try {
      const avisos: unknown[] = [];
      const { categorizer } = fakeCategorizer(() => {
        throw new AiError("API", "falhou", 401);
      });
      await categorizeWithAi(categorizer, [item(0, "PIX ENVIADO - MARIA SILVA")], CATEGORIES, {
        maxTransacoes: 500,
        aoFalhar: (erro) => avisos.push(erro),
      });
      assert.deepEqual(avisos, [{ codigo: "API", status: 401 }]);
      assert.doesNotMatch(JSON.stringify(avisos), /MARIA SILVA|PIX|sk-ant/);
    } finally {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });
});

describe("validação das sugestões", () => {
  const items = [item(0, "Mercado"), item(1, "Salário", "RECEITA")];
  const tipoByIndice = new Map(items.map((entry) => [entry.indice, entry.tipo]));

  it("aceita uma sugestão válida de confiança alta ou média", () => {
    const raw = new Map<number, AiRawSuggestion>([[0, { indice: 0, categoryId: "cat-despesa", confianca: "MEDIA" }]]);
    const { sugestoes, report } = validateAiSuggestions(raw, tipoByIndice, CATEGORIES);
    assert.deepEqual(sugestoes.get(0), { categoryId: "cat-despesa", confianca: "MEDIA" });
    assert.equal(report.descartadasInexistentes + report.descartadasTipoIncompativel + report.baixaConfianca, 0);
  });

  it("categoryId que não é do usuário é descartado", () => {
    const raw = new Map<number, AiRawSuggestion>([[0, { indice: 0, categoryId: "id-inventado", confianca: "ALTA" }]]);
    const { sugestoes, report } = validateAiSuggestions(raw, tipoByIndice, CATEGORIES);
    assert.equal(sugestoes.size, 0);
    assert.equal(report.descartadasInexistentes, 1);
  });

  it("categoria de tipo diferente do lançamento é descartada (despesa não vira receita)", () => {
    const raw = new Map<number, AiRawSuggestion>([[0, { indice: 0, categoryId: "cat-receita", confianca: "ALTA" }]]);
    const { sugestoes, report } = validateAiSuggestions(raw, tipoByIndice, CATEGORIES);
    assert.equal(sugestoes.size, 0);
    assert.equal(report.descartadasTipoIncompativel, 1);
  });

  it("confiança BAIXA fica sem categoria, mesmo com categoryId válido", () => {
    const raw = new Map<number, AiRawSuggestion>([[0, { indice: 0, categoryId: "cat-despesa", confianca: "BAIXA" }]]);
    const { sugestoes, report } = validateAiSuggestions(raw, tipoByIndice, CATEGORIES);
    assert.equal(sugestoes.size, 0);
    assert.equal(report.baixaConfianca, 1);
  });

  it("índice que não existe no envio é ignorado na resposta", async () => {
    const { categorizer } = fakeCategorizer(() => [{ indice: 99, categoryId: "cat-despesa", confianca: "ALTA" }]);
    const outcome = await categorizeWithAi(categorizer, [item(0, "Loja")], CATEGORIES, { maxTransacoes: 500 });
    assert.equal(outcome.sugestoes.size, 0);
    assert.equal(outcome.status, "OK");
  });
});
