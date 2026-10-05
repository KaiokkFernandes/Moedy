import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import { aiApiKey, aiConfig } from "./ai/index.js";

export interface AiSettingsInput {
  usarIaImportacao: boolean;
  /** Obrigatório para ligar: o usuário precisa ter lido o aviso de envio à Anthropic. */
  confirmaEnvioAnthropic?: boolean;
}

export async function getAiSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { usarIaImportacao: true, iaConsentidaEm: true },
  });
  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  return {
    usarIaImportacao: user.usarIaImportacao,
    iaConsentidaEm: user.iaConsentidaEm?.toISOString() ?? null,
    /** Se o servidor tem ANTHROPIC_API_KEY. A chave em si nunca sai do servidor. */
    iaDisponivel: aiApiKey() !== null,
    modelo: aiConfig().modelo,
  };
}

export async function updateAiSettings(userId: string, { usarIaImportacao, confirmaEnvioAnthropic }: AiSettingsInput) {
  if (usarIaImportacao && confirmaEnvioAnthropic !== true) {
    throw new AppError(
      "Confirme o aviso: as descrições e os valores das transações serão enviados à API da Anthropic para gerar as sugestões",
      400,
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: usarIaImportacao ? { usarIaImportacao, iaConsentidaEm: new Date() } : { usarIaImportacao },
  });

  return getAiSettings(userId);
}
