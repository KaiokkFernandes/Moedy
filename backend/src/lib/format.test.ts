import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatBRL, formatPercent, monthName } from "./format.js";

describe("formatação de textos do servidor", () => {
  it("centavos em reais, com espaço comum depois do R$", () => {
    assert.equal(formatBRL(123456), "R$ 1.234,56");
    assert.equal(formatBRL(5), "R$ 0,05");
    assert.equal(formatBRL(-2500), "-R$ 25,00");
    assert.ok(!formatBRL(100).includes(" "));
  });

  it("percentual com no máximo uma casa decimal", () => {
    assert.equal(formatPercent(12.5), "12,5%");
    assert.equal(formatPercent(80), "80%");
    assert.equal(formatPercent(33.333), "33,3%");
  });

  it("nome do mês, vazio fora de 1 a 12", () => {
    assert.equal(monthName(1), "janeiro");
    assert.equal(monthName(3), "março");
    assert.equal(monthName(12), "dezembro");
    assert.equal(monthName(13), "");
    assert.equal(monthName(0), "");
  });
});
