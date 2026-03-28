#!/bin/bash
# ============================================================
# FrotaControl - Setup do Servidor (rodar na VM como root)
# VM: 192.168.0.108 (cca-dev) | Porta: 8080
# ============================================================

set -e

echo ""
echo "========================================="
echo "  FrotaControl - Setup do Servidor"
echo "========================================="
echo ""

# 1. Atualizar pacotes
echo "[1/4] Atualizando pacotes..."
apt update -y

# 2. Instalar Nginx
echo "[2/4] Instalando Nginx..."
apt install -y nginx

# 3. Criar diretório da aplicação
echo "[3/4] Configurando diretório da aplicação..."
mkdir -p /var/www/frotacontrol
chown -R www-data:www-data /var/www/frotacontrol

# 4. Configurar Nginx na porta 8080
echo "[4/4] Configurando Nginx na porta 8080..."
cat > /etc/nginx/sites-available/frotacontrol << 'NGINX_CONF'
server {
    listen 8080;
    server_name _;

    root /var/www/frotacontrol;
    index index.html;

    # Gzip para performance
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA - redirecionar todas as rotas para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_CONF

# Ativar o site
ln -sf /etc/nginx/sites-available/frotacontrol /etc/nginx/sites-enabled/frotacontrol

# Remover site padrão para evitar conflito
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx

# Abrir porta no firewall (se UFW estiver ativo)
ufw allow 8080/tcp 2>/dev/null || true
ufw allow 3000/tcp 2>/dev/null || true

echo ""
echo "========================================="
echo "  SETUP CONCLUÍDO COM SUCESSO!"
echo "  FrotaControl rodando na porta 8080"
echo "  Acesse: http://192.168.0.108:8080"
echo "========================================="
echo ""
