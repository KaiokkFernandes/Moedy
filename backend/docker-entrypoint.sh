#!/bin/sh
# Partida do container: confere as variáveis, aplica as migrações pendentes e sobe o servidor.
set -e

# Falha aqui, com a lista do que falta, antes de tocar no banco.
node -e "import('./dist/config/env.js')"

echo "Aplicando migrações do banco..."
prisma migrate deploy

# exec: o Node vira o processo principal e recebe o SIGTERM para encerrar limpo.
exec node dist/server.js
