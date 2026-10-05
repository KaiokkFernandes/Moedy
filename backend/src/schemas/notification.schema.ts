import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  naoLidas: z
    .enum(["true", "false"], { error: "Use true ou false" })
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number({ error: "Página inválida" }).int("Página inválida").min(1, "Página inválida").default(1),
  pageSize: z.coerce
    .number({ error: "Tamanho de página inválido" })
    .int("Tamanho de página inválido")
    .min(1, "Tamanho de página inválido")
    .max(100, "O tamanho máximo da página é 100")
    .default(20),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
