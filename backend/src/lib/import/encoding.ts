/**
 * Converte o arquivo enviado em texto. Bancos brasileiros costumam exportar em
 * windows-1252 (latin1), então: se os bytes forem UTF-8 válido, é UTF-8; senão,
 * windows-1252. Um texto latin1 com acentos praticamente nunca forma UTF-8 válido.
 */
export function decodeFile(buffer: Buffer): { text: string; encoding: "utf-8" | "utf-16le" | "windows-1252" } {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return { text: new TextDecoder("utf-16le").decode(buffer), encoding: "utf-16le" };
  }

  try {
    // O TextDecoder já descarta o BOM do UTF-8, se houver
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(buffer), encoding: "windows-1252" };
  }
}
