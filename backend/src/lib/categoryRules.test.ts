import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRuleMatcher } from "./categoryRules.js";

const regra = (palavraChave: string, categoryId: string, tipo: "DESPESA" | "RECEITA" = "DESPESA") => ({ palavraChave, categoryId, category: { tipo } });

describe("regras de categorização", () => {
  it("ignora maiúsculas e acentos dos dois lados", () => {
    const sugerir = createRuleMatcher([regra("Açougue", "carne")]);
    assert.equal(sugerir("ACOUGUE DO ZÉ", "DESPESA"), "carne");
  });

  it("só aplica regras do mesmo tipo da transação", () => {
    const sugerir = createRuleMatcher([regra("pix", "transferencias", "RECEITA")]);
    assert.equal(sugerir("PIX recebido", "RECEITA"), "transferencias");
    assert.equal(sugerir("PIX enviado", "DESPESA"), null);
  });

  it("a palavra-chave mais longa vence", () => {
    const sugerir = createRuleMatcher([regra("uber", "transporte"), regra("uber eats", "alimentacao")]);
    assert.equal(sugerir("UBER EATS PEDIDO", "DESPESA"), "alimentacao");
    assert.equal(sugerir("UBER TRIP", "DESPESA"), "transporte");
  });

  it("palavras curtas (até 3 letras) só casam como palavra inteira", () => {
    const sugerir = createRuleMatcher([regra("99", "transporte"), regra("bar", "lazer")]);
    assert.equal(sugerir("99 POP CORRIDA", "DESPESA"), "transporte");
    assert.equal(sugerir("COMPRA 1999", "DESPESA"), null);
    assert.equal(sugerir("Bar do Zé", "DESPESA"), "lazer");
    assert.equal(sugerir("BARBEARIA", "DESPESA"), null);
  });

  it("palavras longas casam em qualquer parte do texto", () => {
    const sugerir = createRuleMatcher([regra("netflix", "assinaturas")]);
    assert.equal(sugerir("PAG*NETFLIXCOM", "DESPESA"), "assinaturas");
  });

  it("caracteres especiais na palavra-chave não quebram a busca", () => {
    const sugerir = createRuleMatcher([regra("c&a", "roupas"), regra("(teste)", "x")]);
    assert.equal(sugerir("C&A SHOPPING", "DESPESA"), "roupas");
    assert.equal(sugerir("algo (teste) aqui", "DESPESA"), "x");
  });

  it("regra com palavra-chave vazia é ignorada; sem regras, nada é sugerido", () => {
    assert.equal(createRuleMatcher([regra("   ", "x")])("qualquer coisa", "DESPESA"), null);
    assert.equal(createRuleMatcher([])("qualquer coisa", "DESPESA"), null);
  });

  it("empate de tamanho: resultado estável, em ordem alfabética", () => {
    const sugerir = createRuleMatcher([regra("posto", "b"), regra("combu", "a")]);
    assert.equal(sugerir("POSTO COMBUSTIVEL", "DESPESA"), "a");
  });
});
