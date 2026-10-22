import { z } from "zod";

/** true marca agora; false volta ao estado inicial (ex.: "refazer o tour" nas configurações). */
export const onboardingSchema = z
  .object({
    tourConcluido: z.boolean({ error: "Use true ou false" }).optional(),
    primeirosPassosOcultos: z.boolean({ error: "Use true ou false" }).optional(),
  })
  .refine((dados) => dados.tourConcluido !== undefined || dados.primeirosPassosOcultos !== undefined, {
    error: "Informe tourConcluido ou primeirosPassosOcultos",
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
