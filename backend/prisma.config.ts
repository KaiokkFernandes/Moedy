import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // As migrações precisam de conexão direta com o banco. Com um pooler na frente (Neon na
    // Vercel), a URL direta vem em DATABASE_URL_UNPOOLED e o app usa a DATABASE_URL.
    url: process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"],
  },
});
