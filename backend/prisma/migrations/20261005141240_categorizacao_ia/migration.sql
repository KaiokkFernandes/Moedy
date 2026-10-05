-- CreateEnum
CREATE TYPE "CategoriaOrigem" AS ENUM ('MANUAL', 'REGRA', 'MEMORIA', 'IA');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "origemCategoria" "CategoriaOrigem" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "iaConsentidaEm" TIMESTAMP(3),
ADD COLUMN     "usarIaImportacao" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CategoryMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "tipo" "TransactionType" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMemory_userId_chave_tipo_key" ON "CategoryMemory"("userId", "chave", "tipo");

-- AddForeignKey
ALTER TABLE "CategoryMemory" ADD CONSTRAINT "CategoryMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryMemory" ADD CONSTRAINT "CategoryMemory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
