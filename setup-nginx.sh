#!/bin/bash

# ============================================================================
# Script de Configuração do Nginx - Mapa Turismo Corumbá
# ============================================================================
# Este script deve ser executado com sudo
# ============================================================================

echo "============================================================"
echo "🌐 Configuração do Nginx - Mapa Turismo"
echo "============================================================"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script precisa ser executado como root (use sudo)"
    echo "   Exemplo: sudo ./setup-nginx.sh"
    exit 1
fi

CAMINHO_RAIZ="/dados/www/mapa_turismo"
NGINX_CONFIG_SOURCE="$CAMINHO_RAIZ/nginx-mapatur.conf"
NGINX_CONFIG_DEST="/etc/nginx/sites-available/mapatur"
NGINX_ENABLED="/etc/nginx/sites-enabled/mapatur"

echo "📋 Passo 1: Verificando arquivos..."
if [ ! -f "$NGINX_CONFIG_SOURCE" ]; then
    echo "❌ Arquivo de configuração não encontrado: $NGINX_CONFIG_SOURCE"
    exit 1
fi
echo "   ✓ Arquivo de configuração encontrado"
echo ""

echo "📋 Passo 2: Copiando configuração para o Nginx..."
cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_DEST"
echo "   ✓ Configuração copiada para: $NGINX_CONFIG_DEST"
echo ""

echo "📋 Passo 3: Ativando site..."
if [ -L "$NGINX_ENABLED" ]; then
    echo "   ⚠️  Link simbólico já existe, removendo..."
    rm "$NGINX_ENABLED"
fi

ln -s "$NGINX_CONFIG_DEST" "$NGINX_ENABLED"
echo "   ✓ Site ativado"
echo ""

echo "📋 Passo 4: Testando configuração do Nginx..."
if nginx -t; then
    echo "   ✓ Configuração válida"
else
    echo "   ❌ Erro na configuração do Nginx"
    echo "   Revertendo alterações..."
    rm "$NGINX_ENABLED" 2>/dev/null
    rm "$NGINX_CONFIG_DEST" 2>/dev/null
    exit 1
fi
echo ""

echo "📋 Passo 5: Recarregando Nginx..."
if systemctl reload nginx; then
    echo "   ✓ Nginx recarregado com sucesso"
else
    echo "   ❌ Erro ao recarregar Nginx"
    exit 1
fi
echo ""

echo "============================================================"
echo "✅ Nginx configurado com sucesso!"
echo "============================================================"
echo ""
echo "🔐 Próximos passos:"
echo ""
echo "1. Obter certificado SSL:"
echo "   sudo certbot --nginx -d mapatur.corumba.ms.gov.br"
echo ""
echo "2. Executar deploy da aplicação:"
echo "   cd /dados/www/mapa_turismo"
echo "   ./deploy.sh"
echo ""
echo "3. Verificar status:"
echo "   pm2 status"
echo "   curl http://localhost:8010/health"
echo ""
echo "============================================================"
