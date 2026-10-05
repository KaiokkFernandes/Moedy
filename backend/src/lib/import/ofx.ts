import { parseCentavos } from "./money.js";
import {
  buildTransaction,
  createHashIdGenerator,
  ImportFileError,
  isValidDate,
  type ParseResult,
} from "./types.js";

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };

/**
 * Lê o valor de um campo dentro de um bloco. Funciona nos dois formatos de OFX:
 * SGML (`<MEMO>Padaria` sem fechamento) e XML (`<MEMO>Padaria</MEMO>`).
 */
function field(block: string, tag: string): string {
  const match = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(block);
  return (match?.[1] ?? "").replace(/&(amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]!).trim();
}

/**
 * Lê os lançamentos (STMTTRN) de um OFX. Extratos de conta corrente (BANKMSGSRSV1) e
 * faturas de cartão (CREDITCARDMSGSRSV1) usam o mesmo bloco, então ambos são cobertos.
 */
export function parseOfx(text: string): ParseResult {
  if (!/<OFX>/i.test(text)) {
    throw new ImportFileError("O arquivo não é um OFX válido");
  }

  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  if (blocks.length === 0) {
    throw new ImportFileError("Nenhum lançamento encontrado no arquivo OFX");
  }

  const result: ParseResult = { itens: [], erros: [] };
  const hashId = createHashIdGenerator("ofx");
  const fitIds = new Map<string, number>();

  blocks.forEach((block, index) => {
    const linha = index + 1;
    try {
      // DTPOSTED: AAAAMMDD, opcionalmente seguido de hora e fuso (20261005120000[-3:BRT])
      const dtPosted = field(block, "DTPOSTED");
      const data = `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`;
      if (!/^\d{8}/.test(dtPosted) || !isValidDate(data)) {
        throw new Error(dtPosted ? `data inválida: "${dtPosted}"` : "lançamento sem data (DTPOSTED)");
      }

      const trnAmt = field(block, "TRNAMT");
      if (!trnAmt) throw new Error("lançamento sem valor (TRNAMT)");
      const centavos = parseCentavos(trnAmt, { thousands: false });

      const descricao = field(block, "MEMO") || field(block, "NAME");

      // Alguns bancos repetem o FITID no mesmo arquivo; a partir do segundo, ganha um sufixo estável
      let externalId = field(block, "FITID");
      if (externalId) {
        const occurrence = (fitIds.get(externalId) ?? 0) + 1;
        fitIds.set(externalId, occurrence);
        if (occurrence > 1) externalId = `${externalId}#${occurrence}`;
      } else {
        externalId = hashId(data, centavos, descricao);
      }

      result.itens.push(buildTransaction(linha, data, descricao, centavos, externalId));
    } catch (error) {
      result.erros.push({ linha, motivo: (error as Error).message });
    }
  });

  return result;
}
