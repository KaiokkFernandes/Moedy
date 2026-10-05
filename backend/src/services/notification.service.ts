import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/errorHandler.js";
import type { ListNotificationsQuery } from "../schemas/notification.schema.js";

const select = { id: true, tipo: true, titulo: true, mensagem: true, link: true, lida: true, createdAt: true } as const;

export async function list(userId: string, { naoLidas, page, pageSize }: ListNotificationsQuery) {
  const where = { userId, excluida: false, lida: naoLidas ? false : undefined };

  const [itens, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      select,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, excluida: false, lida: false } }),
  ]);

  return { itens, total, page, pageSize, naoLidas: unread };
}

export async function unreadCount(userId: string) {
  return { total: await prisma.notification.count({ where: { userId, excluida: false, lida: false } }) };
}

async function findOwned(userId: string, id: string) {
  const notification = await prisma.notification.findFirst({ where: { id, userId, excluida: false } });
  if (!notification) {
    throw new AppError("Alerta não encontrado", 404);
  }
  return notification;
}

export async function markRead(userId: string, id: string) {
  await findOwned(userId, id);
  return prisma.notification.update({ where: { id }, data: { lida: true }, select });
}

export async function markAllRead(userId: string) {
  const { count } = await prisma.notification.updateMany({
    where: { userId, excluida: false, lida: false },
    data: { lida: true },
  });
  return { atualizadas: count };
}

export async function remove(userId: string, id: string) {
  await findOwned(userId, id);
  // Oculta em vez de apagar: se o registro sumisse, o mesmo alerta seria criado de novo
  await prisma.notification.update({ where: { id }, data: { excluida: true, lida: true } });
}
