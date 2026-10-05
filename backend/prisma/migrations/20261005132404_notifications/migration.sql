-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORCAMENTO_ATENCAO', 'ORCAMENTO_ESTOURADO', 'ORCAMENTO_PROJECAO', 'DESPESA_ATIPICA', 'RECORRENTE_NOVA', 'RECORRENTE_VALOR');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "link" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "chave" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_lida_createdAt_idx" ON "Notification"("userId", "lida", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_chave_key" ON "Notification"("userId", "chave");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
