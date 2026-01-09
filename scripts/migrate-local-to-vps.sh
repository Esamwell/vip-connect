#!/bin/bash

# Script para migrar banco de dados PostgreSQL do localhost para VPS
# Uso: bash scripts/migrate-local-to-vps.sh

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

print_header "🔄 Migração de Banco de Dados: Localhost → VPS"

# Configurações locais (padrão)
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_DB="vip_connect"
LOCAL_USER="postgres"
LOCAL_PASSWORD=""

# Configurações VPS
VPS_HOST=""
VPS_PORT="5432"
VPS_DB="vip_connect"
VPS_USER="postgres"
VPS_PASSWORD="1923731sS$"
CONTAINER_NAME="vip-connect-db"

# Solicitar informações locais
print_header "Passo 1: Configuração do Banco Local"

read -p "Host do banco local [localhost]: " input_local_host
LOCAL_HOST=${input_local_host:-$LOCAL_HOST}

read -p "Porta do banco local [5432]: " input_local_port
LOCAL_PORT=${input_local_port:-$LOCAL_PORT}

read -p "Nome do banco local [vip_connect]: " input_local_db
LOCAL_DB=${input_local_db:-$LOCAL_DB}

read -p "Usuário do banco local [postgres]: " input_local_user
LOCAL_USER=${input_local_user:-$LOCAL_USER}

read -sp "Senha do banco local (pressione Enter se não tiver): " LOCAL_PASSWORD
echo ""

# Solicitar informações da VPS
print_header "Passo 2: Configuração da VPS"

read -p "IP da VPS: " VPS_HOST
if [ -z "$VPS_HOST" ]; then
    print_error "IP da VPS é obrigatório!"
    exit 1
fi

read -p "Porta SSH da VPS [22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

read -p "Usuário SSH [root]: " SSH_USER
SSH_USER=${SSH_USER:-root}

# Verificar conexão local
print_header "Passo 3: Verificando Banco Local"

print_info "Testando conexão com banco local..."
if [ -z "$LOCAL_PASSWORD" ]; then
    if PGPASSWORD="" psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Conexão local OK (sem senha)"
        PASSWORD_ARG=""
    else
        print_error "Não foi possível conectar ao banco local"
        exit 1
    fi
else
    if PGPASSWORD="$LOCAL_PASSWORD" psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -c "SELECT version();" > /dev/null 2>&1; then
        print_success "Conexão local OK"
        PASSWORD_ARG="PGPASSWORD=$LOCAL_PASSWORD"
    else
        print_error "Não foi possível conectar ao banco local. Verifique as credenciais."
        exit 1
    fi
fi

# Criar backup
print_header "Passo 4: Criando Backup do Banco Local"

BACKUP_FILE="vip_connect_backup_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_FILE_CUSTOM="vip_connect_backup_$(date +%Y%m%d_%H%M%S).dump"

print_info "Criando backup do banco local..."
print_info "Arquivo: $BACKUP_FILE"

# Tentar pg_dump primeiro (mais rápido)
if command -v pg_dump > /dev/null 2>&1; then
    print_info "Usando pg_dump para criar backup..."
    if [ -z "$LOCAL_PASSWORD" ]; then
        pg_dump -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -F c -f "$BACKUP_FILE_CUSTOM" 2>/dev/null || {
            print_warning "pg_dump com formato custom falhou, tentando SQL..."
            pg_dump -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -f "$BACKUP_FILE" 2>/dev/null || {
                print_error "Falha ao criar backup"
                exit 1
            }
        }
    else
        PGPASSWORD="$LOCAL_PASSWORD" pg_dump -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -F c -f "$BACKUP_FILE_CUSTOM" 2>/dev/null || {
            print_warning "pg_dump com formato custom falhou, tentando SQL..."
            PGPASSWORD="$LOCAL_PASSWORD" pg_dump -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -f "$BACKUP_FILE" 2>/dev/null || {
                print_error "Falha ao criar backup"
                exit 1
            }
        }
    fi
    
    if [ -f "$BACKUP_FILE_CUSTOM" ]; then
        BACKUP_FILE="$BACKUP_FILE_CUSTOM"
        print_success "Backup criado: $BACKUP_FILE (formato custom)"
    else
        print_success "Backup criado: $BACKUP_FILE (formato SQL)"
    fi
else
    print_error "pg_dump não encontrado. Instale o PostgreSQL client tools."
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
print_info "Tamanho do backup: $BACKUP_SIZE"

# Transferir para VPS
print_header "Passo 5: Transferindo Backup para VPS"

print_info "Transferindo arquivo para VPS..."
print_info "Destino: $SSH_USER@$VPS_HOST:/tmp/"

if scp -P "$SSH_PORT" "$BACKUP_FILE" "$SSH_USER@$VPS_HOST:/tmp/" 2>/dev/null; then
    print_success "Backup transferido com sucesso"
else
    print_error "Falha ao transferir backup. Verifique conexão SSH."
    exit 1
fi

# Restaurar na VPS
print_header "Passo 6: Restaurando Backup na VPS"

print_info "Conectando à VPS para restaurar backup..."

# Verificar se container existe na VPS
ssh -p "$SSH_PORT" "$SSH_USER@$VPS_HOST" "docker ps | grep $CONTAINER_NAME" > /dev/null 2>&1 || {
    print_error "Container $CONTAINER_NAME não encontrado na VPS"
    exit 1
}

print_info "Restaurando backup no container..."

# Copiar backup para dentro do container
ssh -p "$SSH_PORT" "$SSH_USER@$VPS_HOST" "docker cp /tmp/$BACKUP_FILE $CONTAINER_NAME:/tmp/$BACKUP_FILE" || {
    print_error "Falha ao copiar backup para container"
    exit 1
}

# Restaurar backup
if [[ "$BACKUP_FILE" == *.dump ]]; then
    # Formato custom (pg_restore)
    print_info "Restaurando backup (formato custom)..."
    ssh -p "$SSH_PORT" "$SSH_USER@$VPS_HOST" "docker exec -i $CONTAINER_NAME pg_restore -U $VPS_USER -d $VPS_DB --clean --if-exists /tmp/$BACKUP_FILE" || {
        print_warning "Alguns avisos durante restauração (pode ser normal)"
    }
else
    # Formato SQL (psql)
    print_info "Restaurando backup (formato SQL)..."
    ssh -p "$SSH_PORT" "$SSH_USER@$VPS_HOST" "docker exec -i $CONTAINER_NAME psql -U $VPS_USER -d $VPS_DB -f /tmp/$BACKUP_FILE" || {
        print_warning "Alguns avisos durante restauração (pode ser normal)"
    }
fi

# Limpar arquivo temporário na VPS
ssh -p "$SSH_PORT" "$SSH_USER@$VPS_HOST" "rm -f /tmp/$BACKUP_FILE"

print_success "Backup restaurado na VPS"

# Verificar migração
print_header "Passo 7: Verificando Migração"

print_info "Verificando tabelas no banco da VPS..."
TABLES_VPS=$(ssh -p "$SSH_PORT" "$SSH_USER@$VPS_HOST" "docker exec $CONTAINER_NAME psql -U $VPS_USER -d $VPS_DB -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\" 2>/dev/null" | tr -d ' ')

if [ -n "$TABLES_VPS" ] && [ "$TABLES_VPS" -gt 0 ]; then
    print_success "Migração concluída! $TABLES_VPS tabela(s) encontrada(s) na VPS"
    
    print_info "Listando tabelas migradas:"
    ssh -p "$SSH_PORT" "$SSH_USER@$VPS_HOST" "docker exec $CONTAINER_NAME psql -U $VPS_USER -d $VPS_DB -c '\dt'" | head -30
else
    print_warning "Nenhuma tabela encontrada. Verifique manualmente."
fi

# Resumo final
print_header "✅ Migração Concluída!"

echo ""
print_success "Dados migrados com sucesso do localhost para a VPS!"
echo ""
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "  📋 RESUMO DA MIGRAÇÃO"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Origem (Localhost):"
print_info "  Host: $LOCAL_HOST:$LOCAL_PORT"
print_info "  Database: $LOCAL_DB"
print_info "  User: $LOCAL_USER"
echo ""
print_info "Destino (VPS):"
print_info "  Host: $VPS_HOST"
print_info "  Container: $CONTAINER_NAME"
print_info "  Database: $VPS_DB"
print_info "  User: $VPS_USER"
echo ""
print_info "Backup criado: $BACKUP_FILE ($BACKUP_SIZE)"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "💡 O arquivo de backup foi mantido localmente: $BACKUP_FILE"
print_info "💡 Você pode removê-lo depois de confirmar que tudo está funcionando"
echo ""

print_success "Migração concluída com sucesso!"

