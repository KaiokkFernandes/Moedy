#!/bin/sh
# Build do backend na Vercel. As migrações rodam só no deploy de produção, antes de o código
# novo entrar no ar; se uma falhar, o deploy falha e a versão anterior continua servindo.
# Deploys de preview não tocam no banco.
set -e

yarn build

if [ "$VERCEL_ENV" = "production" ]; then
  echo "Aplicando migrações do banco..."
  yarn migrate:deploy
else
  echo "Deploy de ${VERCEL_ENV:-desenvolvimento}: migrações não aplicadas"
fi
