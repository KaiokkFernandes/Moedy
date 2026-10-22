import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { merchantKey, merchantName } from "./merchant.js";
import { normalizeText } from "./text.js";

describe("normalização de texto", () => {
  it("tira acentos, maiúsculas e espaços extras", () => {
    assert.equal(normalizeText("  Pão de   AÇÚCAR "), "pao de acucar");
    assert.equal(normalizeText("Café\tE\nCia"), "cafe e cia");
  });
});

describe("estabelecimentos", () => {
  it("descrições do mesmo lugar viram a mesma chave", () => {
    assert.equal(merchantKey("NETFLIX.COM 12/10 8842"), merchantKey("Netflix.com"));
    assert.equal(merchantKey("Netflix.com"), "netflix com");
  });

  it("ignora a parcela em vários formatos", () => {
    const chave = merchantKey("Loja Exemplo");
    for (const descricao of ["LOJA EXEMPLO 01/12", "Loja Exemplo 3 de 10", "Loja Exemplo parc 2/6", "Loja Exemplo parcela 02 de 12"]) {
      assert.equal(merchantKey(descricao), chave, descricao);
    }
  });

  it("remove códigos do fim, mas nunca o nome inteiro", () => {
    // Só sai do fim o que tem dígito: "TRIP" é texto e fica
    assert.equal(merchantKey("UBER *TRIP 4KX92"), "uber trip");
    assert.equal(merchantKey("99app"), "99app");
    assert.equal(merchantKey("12345"), "12345");
  });

  it("nome para exibir mantém a grafia original, sem parcela e códigos", () => {
    assert.equal(merchantName("Mercado Livre 02/05"), "Mercado Livre");
    assert.equal(merchantName("NETFLIX.COM 12/10 8842"), "NETFLIX.COM");
    assert.equal(merchantName("  Padaria  "), "Padaria");
  });
});
