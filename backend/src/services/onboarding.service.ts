import { prisma } from "../lib/prisma.js";
import type { OnboardingInput } from "../schemas/onboarding.schema.js";

/** Converte o pedido nos campos do usuário: true registra o momento, false limpa, ausente não mexe. */
export function dadosOnboarding({ tourConcluido, primeirosPassosOcultos }: OnboardingInput, agora = new Date()) {
  const marcar = (valor: boolean) => (valor ? agora : null);
  return {
    ...(tourConcluido !== undefined && { onboardingTourEm: marcar(tourConcluido) }),
    ...(primeirosPassosOcultos !== undefined && { primeirosPassosOcultosEm: marcar(primeirosPassosOcultos) }),
  };
}

export async function atualizarOnboarding(userId: string, input: OnboardingInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: dadosOnboarding(input),
    select: { onboardingTourEm: true, primeirosPassosOcultosEm: true },
  });
  return {
    onboardingTourEm: user.onboardingTourEm?.toISOString() ?? null,
    primeirosPassosOcultosEm: user.primeirosPassosOcultosEm?.toISOString() ?? null,
  };
}
