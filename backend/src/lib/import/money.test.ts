import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCentavos } from "./money.js";

describe("valores em texto → centavos", () => {
  const casos: [string, number][] = [
    ["1.234,56", 123456],
    ["1,234.56", 123456],
    ["1234.56", 123456],
    ["1234,5", 123450],
    ["10.000,00", 1000000],
    ["1.234", 123400], // um único separador com 3 dígitos depois é milhar
    ["1.234.567", 123456700],
    ["0,99", 99],
    ["R$ 10,5", 1050],
    ["-50", -5000],
    ["+7,00", 700],
    ["(12,00)", -1200], // contábil: parênteses são negativo
    ["12,00-", -1200], // sinal no fim, comum em extratos
    [" R$ -1.800,00 ", -180000],
    ["5,000", 500000], // ambíguo: um separador com 3 dígitos depois é lido como milhar
  ];
  for (const [texto, esperado] of casos) {
    it(`"${texto}" → ${esperado}`, () => assert.equal(parseCentavos(texto), esperado));
  }

  it("nunca passa por ponto flutuante (0,1 + 0,2 exatos)", () => {
    assert.equal(parseCentavos("0,10") + parseCentavos("0,20"), 30);
    assert.equal(parseCentavos("1.000.000,01"), 100000001);
  });

  it("recusa textos que não são valores, com o motivo", () => {
    assert.throws(() => parseCentavos(""), /valor vazio/);
    assert.throws(() => parseCentavos("R$ "), /valor vazio/);
    assert.throws(() => parseCentavos("abc"), /valor inválido/);
    assert.throws(() => parseCentavos("12a,00"), /valor inválido/);
    assert.throws(() => parseCentavos("1.23.4"), /valor inválido/);
    assert.throws(() => parseCentavos("1.000.00"), /valor inválido/);
    assert.throws(() => parseCentavos("-"), /valor inválido/);
  });

  it("\"0,005\" não vira milhar (R$ 5,00): é recusado", () => {
    assert.throws(() => parseCentavos("0,005"), /valor inválido/);
    assert.throws(() => parseCentavos("0.500"), /valor inválido/);
  });

  it("recusa mais de duas casas decimais significativas", () => {
    assert.throws(() => parseCentavos("1.234,567"), /mais de duas casas/);
  });

  it("recusa valores grandes demais para inteiro seguro", () => {
    assert.throws(() => parseCentavos("99999999999999999999,00"), /valor muito alto/);
  });

  describe("modo OFX (sem separador de milhar)", () => {
    it("um único separador é sempre o decimal", () => {
      assert.equal(parseCentavos("-123.45", { thousands: false }), -12345);
      assert.equal(parseCentavos("1.5", { thousands: false }), 150);
      assert.equal(parseCentavos("-18,90", { thousands: false }), -1890);
    });

    it("\"1.234\" não vira milhar: são três casas decimais e dá erro", () => {
      assert.throws(() => parseCentavos("1.234", { thousands: false }), /mais de duas casas/);
    });

    it("separador repetido é inválido", () => {
      assert.throws(() => parseCentavos("1.234.567", { thousands: false }), /valor inválido/);
    });
  });
});
