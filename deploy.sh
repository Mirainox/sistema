#!/bin/bash
# Deploy do Sistema Mirainox para a VPS de produção.
# Uso: bash deploy.sh   (rodar de dentro da pasta "sistema")
set -e

VPS_HOST="179.199.131.109"
VPS_USER="root"
SSH_KEY="$HOME/.ssh/mirainox_vps"
REMOTE_DIR="/opt/mirainox"
SSH="ssh -i $SSH_KEY -o BatchMode=yes $VPS_USER@$VPS_HOST"
SCRATCH_TAR="$(mktemp -u).tar.gz"

echo "==> Empacotando código local..."
tar --exclude='node_modules' --exclude='.git' --exclude='dist' \
    --exclude='uploads' --exclude='.env' --exclude='.env.local' \
    -czf "$SCRATCH_TAR" -C "$(dirname "$0")" .

echo "==> Enviando para a VPS..."
scp -i "$SSH_KEY" -o BatchMode=yes "$SCRATCH_TAR" "$VPS_USER@$VPS_HOST:/root/deploy.tar.gz"
rm -f "$SCRATCH_TAR"

echo "==> Fazendo backup do banco antes de migrar..."
$SSH "$REMOTE_DIR/backup.sh"

echo "==> Extraindo novo código (preserva .env e uploads)..."
$SSH "tar -xzf /root/deploy.tar.gz -C $REMOTE_DIR && rm -f /root/deploy.tar.gz"

echo "==> Backend: instalando dependências, aplicando migrações e buildando..."
$SSH "cd $REMOTE_DIR/backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build"

echo "==> Frontend: instalando dependências e buildando..."
$SSH "cd $REMOTE_DIR/frontend && npm install && npm run build"

echo "==> Reiniciando backend..."
$SSH "pm2 restart mirainox-backend"

echo "==> Verificando saúde do site..."
sleep 2
CODE=$(curl -s -o /dev/null -w "%{http_code}" https://sistemamirainox.com.br/)
echo "https://sistemamirainox.com.br respondeu: $CODE"

echo ""
echo "✅ Deploy concluído!"
