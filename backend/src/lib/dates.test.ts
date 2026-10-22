import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  addDays,
  addMonths,
  daysBetween,
  endOfMonth,
  monthKey,
  monthsBetween,
  previousPeriod,
  startOfMonth,
  toISODate,
  todayInSaoPaulo,
} from "./dates.js";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const iso = (date: Date) => toISODate(date);

describe("datas (dias puros em UTC)", () => {
  it("formata dia e mês", () => {
    assert.equal(toISODate(d("2026-10-05")), "2026-10-05");
    assert.equal(monthKey(d("2026-10-31")), "2026-10");
  });

  it("início e fim do mês, inclusive fevereiro de ano bissexto", () => {
    assert.equal(iso(startOfMonth(d("2026-10-17"))), "2026-10-01");
    assert.equal(iso(endOfMonth(d("2026-10-17"))), "2026-10-31");
    assert.equal(iso(endOfMonth(d("2028-02-10"))), "2028-02-29");
    assert.equal(iso(endOfMonth(d("2026-02-10"))), "2026-02-28");
  });

  it("soma dias e meses atravessando o ano", () => {
    assert.equal(iso(addDays(d("2026-12-31"), 1)), "2027-01-01");
    assert.equal(iso(addDays(d("2026-03-01"), -1)), "2026-02-28");
    // addMonths sempre devolve o primeiro dia do mês resultante
    assert.equal(iso(addMonths(d("2026-01-31"), 1)), "2026-02-01");
    assert.equal(iso(addMonths(d("2026-01-15"), -2)), "2025-11-01");
  });

  it("conta dias entre datas", () => {
    assert.equal(daysBetween(d("2026-10-01"), d("2026-10-31")), 30);
    assert.equal(daysBetween(d("2026-10-31"), d("2026-10-01")), -30);
  });

  it("lista os meses de um período, inclusive o do fim", () => {
    assert.deepEqual(monthsBetween(d("2026-11-20"), d("2027-02-03")).map(iso), ["2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01"]);
    assert.deepEqual(monthsBetween(d("2026-10-05"), d("2026-10-06")).map(iso), ["2026-10-01"]);
  });

  describe("período anterior", () => {
    const anterior = (inicio: string, fim: string) => {
      const p = previousPeriod(d(inicio), d(fim));
      return [iso(p.inicio), iso(p.fim)];
    };

    it("mês cheio compara com o mês cheio anterior (de tamanho diferente)", () => {
      assert.deepEqual(anterior("2026-03-01", "2026-03-31"), ["2026-02-01", "2026-02-28"]);
    });

    it("vários meses cheios comparam com o mesmo número de meses antes", () => {
      assert.deepEqual(anterior("2026-07-01", "2026-09-30"), ["2026-04-01", "2026-06-30"]);
      assert.deepEqual(anterior("2026-01-01", "2026-12-31"), ["2025-01-01", "2025-12-31"]);
    });

    it("intervalo qualquer compara com o mesmo número de dias logo antes", () => {
      assert.deepEqual(anterior("2026-10-10", "2026-10-16"), ["2026-10-03", "2026-10-09"]);
      // começa no dia 1 mas não termina no fim do mês: não é mês cheio
      assert.deepEqual(anterior("2026-10-01", "2026-10-15"), ["2026-09-16", "2026-09-30"]);
    });
  });

  it("\"hoje\" segue o fuso de São Paulo, não o do servidor", () => {
    // 02:30 UTC do dia 21 ainda é 23:30 do dia 20 em São Paulo (UTC-3)
    mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-21T02:30:00Z") });
    try {
      assert.equal(iso(todayInSaoPaulo()), "2026-10-20");
      mock.timers.setTime(Date.parse("2026-10-21T03:30:00Z"));
      assert.equal(iso(todayInSaoPaulo()), "2026-10-21");
    } finally {
      mock.timers.reset();
    }
  });
});
