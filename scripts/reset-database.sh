#!/bin/bash

# Script para limpar e recriar o banco de dados PostgreSQL do zero
# Uso: bash scripts/reset-database.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de output
print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configurações
CONTAINER_NAME="vip-connect-db"
VOLUME_NAME="vip-connect-db-data"
NETWORK_NAME="coolify"
POSTGRES_PASSWORD="1923731sS$"
POSTGRES_DB="vip_connect"
POSTGRES_USER="postgres"
POSTGRES_IMAGE="postgres:16-alpine"
SCHEMA_URL="https://raw.githubusercontent.com/esamwell/vip-connect/main/database/schema.sql"

print_header "🔄 Reset Completo do Banco de Dados PostgreSQL"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script precisa ser executado como root ou com sudo"
    exit 1
fi

# Confirmar ação destrutiva
print_warning "ATENÇÃO: Este script vai APAGAR todos os dados do banco de dados!"
print_warning "Container: $CONTAINER_NAME"
print_warning "Volume: $VOLUME_NAME"
echo ""
read -p "Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirm

if [ "$confirm" != "SIM" ]; then
    print_error "Operação cancelada"
    exit 1
fi

# Passo 1: Parar e remover container
print_header "Passo 1: Removendo Container Existente"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_info "Parando container $CONTAINER_NAME..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    
    print_info "Removendo container $CONTAINER_NAME..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    print_success "Container removido"
else
    print_info "Container $CONTAINER_NAME não existe"
fi

# Passo 2: Remover volume (opcional)
print_header "Passo 2: Removendo Volume de Dados"

read -p "Deseja remover o volume de dados também? Isso apagará TODOS os dados! (y/n) [n]: " remove_volume
remove_volume=${remove_volume:-n}

if [[ $remove_volume =~ ^[Yy]$ ]]; then
    if docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
        print_info "Removendo volume $VOLUME_NAME..."
        docker volume rm "$VOLUME_NAME" 2>/dev/null || true
        print_success "Volume removido"
    else
        print_info "Volume $VOLUME_NAME não existe"
    fi
else
    print_info "Mantendo volume existente (dados serão preservados)"
fi

# Passo 3: Verificar/criar rede Docker
print_header "Passo 3: Verificando Rede Docker"

# Tentar encontrar rede Coolify
COOLIFY_NETWORK=$(docker network ls --format '{{.Name}}' | grep -i coolify | head -n 1)

if [ -n "$COOLIFY_NETWORK" ]; then
    if docker network inspect "$COOLIFY_NETWORK" > /dev/null 2>&1; then
        print_success "Rede Coolify encontrada: $COOLIFY_NETWORK"
        NETWORK_NAME="$COOLIFY_NETWORK"
    else
        print_warning "Rede Coolify detectada mas não acessível"
        NETWORK_NAME="vip-connect-network"
    fi
else
    NETWORK_NAME="vip-connect-network"
fi

# Criar rede se não existir
if ! docker network inspect "$NETWORK_NAME" > /dev/null 2>&1; then
    print_info "Criando rede Docker: $NETWORK_NAME"
    docker network create "$NETWORK_NAME" > /dev/null 2>&1 || true
    print_success "Rede Docker criada: $NETWORK_NAME"
else
    print_info "Rede Docker já existe: $NETWORK_NAME"
fi

# Passo 4: Criar container PostgreSQL
print_header "Passo 4: Criando Container PostgreSQL"

print_info "Criando container $CONTAINER_NAME..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -p 5432:5432 \
  -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
  --network "$NETWORK_NAME" \
  "$POSTGRES_IMAGE"

if [ $? -eq 0 ]; then
    print_success "Container criado com sucesso"
else
    print_error "Falha ao criar container"
    exit 1
fi

# Passo 5: Aguardar PostgreSQL estar pronto
print_header "Passo 5: Aguardando PostgreSQL Iniciar"

print_info "Aguardando PostgreSQL estar pronto..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        print_success "PostgreSQL está pronto!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "PostgreSQL não iniciou a tempo"
    print_info "Verifique os logs: docker logs $CONTAINER_NAME"
    exit 1
fi

echo ""

# Passo 6: Criar banco de dados e extensões
print_header "Passo 6: Configurando Banco de Dados"

print_info "Criando banco de dados $POSTGRES_DB..."
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;" 2>/dev/null || print_info "Banco $POSTGRES_DB já existe"

print_info "Criando extensões..."
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";" 2>/dev/null

print_success "Extensões criadas"

# Passo 7: Baixar e executar schema
print_header "Passo 7: Executando Schema SQL"

print_info "Baixando schema SQL do GitHub..."
if curl -fsSL "$SCHEMA_URL" -o /tmp/schema.sql 2>/dev/null; then
    print_success "Schema baixado com sucesso"
    
    # Copiar schema para o container
    docker cp /tmp/schema.sql "$CONTAINER_NAME:/tmp/schema.sql"
    
    # Executar schema
    print_info "Executando schema SQL (isso pode levar alguns minutos)..."
    if docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/schema.sql > /tmp/schema-output.log 2>&1; then
        print_success "Schema executado com sucesso!"
        rm -f /tmp/schema.sql
    else
        print_warning "Houve alguns avisos ao executar o schema"
        print_info "Verifique /tmp/schema-output.log para detalhes"
        print_info "O banco foi criado, mas você pode precisar executar o schema manualmente"
    fi
else
    print_warning "Não foi possível baixar o schema automaticamente"
    print_info "URL do schema: $SCHEMA_URL"
    print_info "Você precisará executar o schema manualmente depois"
fi

# Passo 8: Configurar para aceitar conexões externas
print_header "Passo 8: Configurando Conexões Externas"

print_info "Configurando PostgreSQL para aceitar conexões externas..."

# Configurar listen_addresses
docker exec "$CONTAINER_NAME" sh -c "echo \"listen_addresses = '*'\" >> /var/lib/postgresql/data/postgresql.conf" 2>/dev/null || true

# Configurar pg_hba.conf
docker exec "$CONTAINER_NAME" sh -c "echo 'host    all             all             0.0.0.0/0               md5' >> /var/lib/postgresql/data/pg_hba.conf" 2>/dev/null || true

# Reiniciar para aplicar configurações
print_info "Reiniciando container para aplicar configurações..."
docker restart "$CONTAINER_NAME" > /dev/null 2>&1

# Aguardar reiniciar
sleep 10

# Verificar se está rodando
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_success "Container reiniciado e rodando"
else
    print_error "Container não está rodando após reiniciar"
    print_info "Verifique os logs: docker logs $CONTAINER_NAME"
    exit 1
fi

# Passo 9: Verificar tabelas criadas
print_header "Passo 9: Verificando Banco de Dados"

print_info "Verificando tabelas criadas..."
TABLES=$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ -n "$TABLES" ] && [ "$TABLES" -gt 0 ]; then
    print_success "Banco de dados configurado com $TABLES tabela(s)"
    docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" 2>/dev/null | head -20
else
    print_warning "Nenhuma tabela encontrada. O schema pode não ter sido executado."
fi

# Resumo final
print_header "✅ Reset Concluído!"

# Obter IP público da VPS
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
print_success "Banco de dados recriado com sucesso!"
echo ""
echo ""
print_info "════════════════════════════════════════════════════════════════════════════════"
print_info "  📋 INFORMAÇÕES COMPLETAS DE CONEXÃO"
print_info "════════════════════════════════════════════════════════════════════════════════"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  🐳 CONFIGURAÇÃO DO CONTAINER DOCKER"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Container Name: $CONTAINER_NAME"
print_info "Docker Network: $NETWORK_NAME"
print_info "Image: $POSTGRES_IMAGE"
print_info "Status: $(docker ps --format '{{.Status}}' --filter name=$CONTAINER_NAME)"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  🔐 CREDENCIAIS DE ACESSO"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Usuário: $POSTGRES_USER"
print_info "Senha: $POSTGRES_PASSWORD"
print_info "Banco de Dados: $POSTGRES_DB"
print_info "Porta: 5432"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  🌐 CONEXÃO EXTERNA (Beekeeper Studio / DBeaver / pgAdmin)"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Host/IP: $VPS_IP"
print_info "Port: 5432"
print_info "Database: $POSTGRES_DB"
print_info "Username: $POSTGRES_USER"
print_info "Password: $POSTGRES_PASSWORD"
print_info "SSL Mode: prefer (ou disable)"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  🔗 URL DE CONEXÃO COMPLETA"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$VPS_IP:5432/$POSTGRES_DB"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  ⚙️  VARIÁVEIS DE AMBIENTE PARA COOLIFY (Backend)"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "DATABASE_HOST=$CONTAINER_NAME"
print_info "DATABASE_PORT=5432"
print_info "DATABASE_NAME=$POSTGRES_DB"
print_info "DATABASE_USER=$POSTGRES_USER"
print_info "DATABASE_PASSWORD=$POSTGRES_PASSWORD"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  📊 STATUS DO BANCO DE DADOS"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ -n "$TABLES" ] && [ "$TABLES" -gt 0 ]; then
    print_success "Tabelas criadas: $TABLES"
    print_info "Extensões instaladas: uuid-ossp, pg_trgm"
else
    print_warning "Nenhuma tabela encontrada. Execute o schema manualmente se necessário."
fi
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  🧪 COMANDOS DE TESTE"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "# Testar conexão local (na VPS):"
print_info "docker exec -it $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB -c \"SELECT version();\""
echo ""
print_info "# Testar conexão remota (do seu computador):"
print_info "psql -h $VPS_IP -p 5432 -U $POSTGRES_USER -d $POSTGRES_DB"
echo ""
print_info "# Ver logs do container:"
print_info "docker logs $CONTAINER_NAME"
echo ""
print_info "# Ver status do container:"
print_info "docker ps | grep $CONTAINER_NAME"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  📝 CONFIGURAÇÃO NO BEEKEEPER STUDIO"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "1. Abra o Beekeeper Studio"
print_info "2. Clique em 'New Connection' ou 'Import from URL'"
print_info "3. Cole a URL abaixo:"
echo ""
print_info "   postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$VPS_IP:5432/$POSTGRES_DB"
echo ""
print_info "4. Ou configure manualmente:"
print_info "   - Host: $VPS_IP"
print_info "   - Port: 5432"
print_info "   - Database: $POSTGRES_DB"
print_info "   - User: $POSTGRES_USER"
print_info "   - Password: $POSTGRES_PASSWORD"
print_info "   - SSL Mode: prefer"
echo ""
print_info "════════════════════════════════════════════════════════════════════════════════"
echo ""
print_success "✅ Banco de dados pronto para uso!"
print_info "💾 Todas as informações acima foram salvas para referência"
echo ""

