import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { decodeFile } from "./encoding.js";

describe("leitura do arquivo enviado", () => {
  it("UTF-8, descartando o BOM", () => {
    const resultado = decodeFile(Buffer.from("﻿Data;Histórico", "utf8"));
    assert.deepEqual(resultado, { text: "Data;Histórico", encoding: "utf-8" });
  });

  it("windows-1252 (padrão de muitos bancos) quando não é UTF-8 válido", () => {
    assert.deepEqual(decodeFile(Buffer.from([0x50, 0xe3, 0x6f])), { text: "Pão", encoding: "windows-1252" });
  });

  it("o CSV de exemplo em latin1 sai com os acentos certos", () => {
    const { text, encoding } = decodeFile(readFileSync(new URL("../../../samples/extrato-exemplo.csv", import.meta.url)));
    assert.equal(encoding, "windows-1252");
    assert.ok(text.startsWith("Data;Histórico;Valor"));
    assert.ok(text.includes("SUPERMERCADO PÃO DE AÇÚCAR"));
  });

  it("UTF-16 com BOM (exportação do Excel)", () => {
    const buffer = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("Valor;Ação", "utf16le")]);
    assert.deepEqual(decodeFile(buffer), { text: "Valor;Ação", encoding: "utf-16le" });
  });
});
