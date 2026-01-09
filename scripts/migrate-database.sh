#!/bin/bash

###############################################################################
# Script de Migração de Banco de Dados PostgreSQL
# 
# Este script automatiza a migração de um backup PostgreSQL para o container
# do Coolify/VPS.
#
# Uso: bash migrate-database.sh <arquivo_backup> [container_name] [db_name] [db_user]
###############################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
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

# Verificar parâmetros
BACKUP_FILE=$1
CONTAINER_NAME=${2:-vip-connect-db}
DB_NAME=${3:-vip_connect}
DB_USER=${4:-postgres}

if [ -z "$BACKUP_FILE" ]; then
    print_error "Arquivo de backup não fornecido!"
    echo ""
    echo "Uso: $0 <arquivo_backup> [container_name] [db_name] [db_user]"
    echo ""
    echo "Exemplos:"
    echo "  $0 /tmp/vip_connect_backup.dump"
    echo "  $0 /tmp/backup.dump postgres-container vip_connect postgres"
    echo ""
    exit 1
fi

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

print_header "🔄 Migração de Banco de Dados PostgreSQL"

print_info "Configuração:"
echo "  Arquivo de backup: $BACKUP_FILE"
echo "  Container: $CONTAINER_NAME"
echo "  Banco de dados: $DB_NAME"
echo "  Usuário: $DB_USER"
echo ""

# Verificar se container existe
print_info "Verificando container..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_error "Container '${CONTAINER_NAME}' não encontrado!"
    echo ""
    echo "Containers PostgreSQL disponíveis:"
    docker ps --format '{{.Names}}' | grep -i postgres || echo "  Nenhum encontrado"
    echo ""
    exit 1
fi
print_success "Container encontrado: $CONTAINER_NAME"

# Verificar se container está rodando
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_warning "Container não está rodando. Tentando iniciar..."
    docker start "$CONTAINER_NAME" || {
        print_error "Não foi possível iniciar o container"
        exit 1
    }
    sleep 5
fi

# Verificar se banco já existe
print_info "Verificando banco de dados..."
DB_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME" && echo "yes" || echo "no")

if [ "$DB_EXISTS" = "yes" ]; then
    print_warning "Banco '$DB_NAME' já existe!"
    echo ""
    read -p "Deseja substituir o banco existente? Isso apagará todos os dados! (y/n): " response
    if [[ ! $response =~ ^[Yy]$ ]]; then
        print_error "Operação cancelada pelo usuário"
        exit 1
    fi
    
    print_info "Removendo banco existente..."
    docker exec "$CONTAINER_NAME" dropdb -U "$DB_USER" "$DB_NAME" || {
        print_error "Erro ao remover banco existente"
        exit 1
    }
    print_success "Banco removido"
fi

# Criar banco de dados
print_info "Criando banco de dados '$DB_NAME'..."
docker exec "$CONTAINER_NAME" createdb -U "$DB_USER" "$DB_NAME" || {
    print_error "Erro ao criar banco de dados"
    exit 1
}
print_success "Banco criado"

# Criar extensões necessárias
print_info "Criando extensões necessárias..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" <<EOF > /dev/null 2>&1
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF
print_success "Extensões criadas"

# Copiar backup para container
print_info "Copiando backup para container..."
BACKUP_NAME=$(basename "$BACKUP_FILE")
docker cp "$BACKUP_FILE" "${CONTAINER_NAME}:/tmp/${BACKUP_NAME}" || {
    print_error "Erro ao copiar arquivo para container"
    exit 1
}
print_success "Arquivo copiado"

# Detectar formato do backup
BACKUP_FORMAT="unknown"
if [[ "$BACKUP_FILE" == *.dump ]] || [[ "$BACKUP_FILE" == *.dump.gz ]]; then
    BACKUP_FORMAT="custom"
elif [[ "$BACKUP_FILE" == *.sql ]] || [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    BACKUP_FORMAT="sql"
fi

# Descomprimir se necessário
if [[ "$BACKUP_FILE" == *.gz ]]; then
    print_info "Descomprimindo backup..."
    docker exec "$CONTAINER_NAME" gunzip "/tmp/${BACKUP_NAME}" || {
        print_error "Erro ao descomprimir backup"
        exit 1
    }
    BACKUP_NAME="${BACKUP_NAME%.gz}"
    print_success "Backup descomprimido"
fi

# Restaurar backup
print_info "Restaurando backup (isso pode levar alguns minutos)..."
echo ""

if [ "$BACKUP_FORMAT" = "custom" ] || [ "$BACKUP_FORMAT" = "unknown" ]; then
    # Formato custom (binário)
    docker exec "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" -v "/tmp/${BACKUP_NAME}" 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done
elif [ "$BACKUP_FORMAT" = "sql" ]; then
    # Formato SQL (texto)
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "/tmp/${BACKUP_NAME}" 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done
fi

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Backup restaurado com sucesso!"
else
    print_warning "Houve alguns avisos durante a restauração, mas pode ter funcionado"
fi

# Limpar arquivo temporário
print_info "Limpando arquivos temporários..."
docker exec "$CONTAINER_NAME" rm -f "/tmp/${BACKUP_NAME}"
print_success "Limpeza concluída"

# Verificar tabelas
print_info "Verificando tabelas criadas..."
TABLE_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
print_success "Tabelas encontradas: $TABLE_COUNT"

# Verificar algumas tabelas principais
print_info "Verificando tabelas principais..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null | head -20

print_header "✅ Migração Concluída!"

echo ""
print_success "Banco de dados migrado com sucesso!"
echo ""
print_info "Próximos passos:"
echo ""
echo "1. Verificar dados:"
echo "   docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
echo ""
echo "2. Verificar contagem de registros:"
echo "   docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c \"SELECT 'users' as tabela, COUNT(*) FROM users;\""
echo ""
echo "3. Verificar conexão do backend no Coolify"
echo ""
print_warning "Certifique-se de que as variáveis de ambiente do backend estão corretas!"
echo ""

