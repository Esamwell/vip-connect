#!/bin/bash

###############################################################################
# Script de Instalação Automatizada VIP Connect no Coolify
# 
# Este script automatiza a instalação completa do sistema VIP Connect
# em uma VPS utilizando o Coolify.
#
# Uso: bash install-coolify-vip-connect.sh
###############################################################################

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis de configuração (serão solicitadas ao usuário)
GITHUB_REPO=""
GITHUB_BRANCH="main"
FRONTEND_DOMAIN=""
BACKEND_DOMAIN=""
POSTGRES_PASSWORD=""
JWT_SECRET=""
COOLIFY_URL=""
COOLIFY_TOKEN=""

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

# Verificar se está rodando como root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Por favor, execute como root ou com sudo"
        exit 1
    fi
}

# Verificar sistema operacional
check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        print_error "Não foi possível detectar o sistema operacional"
        exit 1
    fi

    if [[ "$OS" != "ubuntu" ]] && [[ "$OS" != "debian" ]]; then
        print_error "Este script suporta apenas Ubuntu/Debian"
        exit 1
    fi

    print_success "Sistema operacional detectado: $OS $VER"
}

# Coletar informações do usuário
collect_info() {
    print_header "Coleta de Informações"

    read -p "Digite a URL do repositório GitHub (ex: usuario/vip-connect): " GITHUB_REPO
    read -p "Digite a branch do repositório [main]: " GITHUB_BRANCH
    GITHUB_BRANCH=${GITHUB_BRANCH:-main}

    read -p "Digite o domínio do frontend (ex: vip-connect.seudominio.com): " FRONTEND_DOMAIN
    read -p "Digite o domínio do backend (ex: api.vip-connect.seudominio.com): " BACKEND_DOMAIN

    # Gerar senha aleatória para PostgreSQL se não fornecida
    read -sp "Digite a senha do PostgreSQL (ou pressione Enter para gerar automaticamente): " POSTGRES_PASSWORD
    echo ""
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        print_info "Senha PostgreSQL gerada: $POSTGRES_PASSWORD"
    fi

    # Gerar JWT Secret se não fornecido
    read -sp "Digite o JWT Secret (ou pressione Enter para gerar automaticamente): " JWT_SECRET
    echo ""
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)
        print_info "JWT Secret gerado automaticamente"
    fi

    read -p "Digite a URL do Coolify (ex: http://seu-ip:8000 ou https://coolify.seudominio.com): " COOLIFY_URL
    
    print_warning "Para automatização completa via API, você precisará de um token do Coolify"
    print_info "Você pode obter o token em: $COOLIFY_URL/settings/api-tokens"
    read -p "Digite o token da API do Coolify (ou pressione Enter para pular automação via API): " COOLIFY_TOKEN

    echo ""
    print_info "Resumo da configuração:"
    echo "  Repositório: $GITHUB_REPO"
    echo "  Branch: $GITHUB_BRANCH"
    echo "  Frontend: $FRONTEND_DOMAIN"
    echo "  Backend: $BACKEND_DOMAIN"
    echo "  PostgreSQL Password: [oculto]"
    echo "  JWT Secret: [oculto]"
    echo ""
    read -p "Continuar com a instalação? (y/n): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_error "Instalação cancelada"
        exit 1
    fi
}

# Instalar dependências do sistema
install_system_dependencies() {
    print_header "Instalando Dependências do Sistema"

    apt-get update -qq
    apt-get install -y -qq curl wget git jq openssl

    print_success "Dependências instaladas"
}

# Instalar Docker se não estiver instalado
install_docker() {
    print_header "Verificando Docker"

    if command -v docker &> /dev/null; then
        print_success "Docker já está instalado"
        docker --version
    else
        print_info "Instalando Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        print_success "Docker instalado"
    fi
}

# Instalar Coolify
install_coolify() {
    print_header "Instalando Coolify"

    if [ -f /data/coolify/docker-compose.yml ]; then
        print_warning "Coolify parece já estar instalado"
        read -p "Deseja reinstalar? (y/n): " reinstall
        if [[ ! $reinstall =~ ^[Yy]$ ]]; then
            print_info "Pulando instalação do Coolify"
            return
        fi
    fi

    print_info "Instalando Coolify..."
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

    print_success "Coolify instalado"
    print_info "Acesse o Coolify em: $COOLIFY_URL"
    print_warning "Configure a conta de administrador no primeiro acesso"
}

# Aguardar Coolify estar pronto
wait_for_coolify() {
    print_header "Aguardando Coolify estar pronto"

    print_info "Aguardando Coolify iniciar (isso pode levar alguns minutos)..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "$COOLIFY_URL/api/v1/health" > /dev/null 2>&1; then
            print_success "Coolify está pronto!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 10
    done
    
    print_warning "Coolify não respondeu. Continuando com instruções manuais..."
    return 1
}

# Criar PostgreSQL via API do Coolify
create_postgresql_via_api() {
    if [ -z "$COOLIFY_TOKEN" ]; then
        return 1
    fi

    print_header "Criando PostgreSQL via API"

    # Esta função tentaria criar via API, mas a API do Coolify pode variar
    # Por enquanto, vamos fornecer instruções manuais
    print_info "Criando PostgreSQL..."
    
    # Nota: A API do Coolify pode não ter endpoints públicos documentados
    # para criar recursos. Vamos fornecer instruções manuais.
    
    return 1
}

# Criar script de configuração do banco
create_database_setup_script() {
    print_header "Criando Script de Configuração do Banco"

    cat > /tmp/setup-vip-connect-db.sh << 'DBSCRIPT'
#!/bin/bash
set -e

DB_NAME="vip_connect"
DB_USER="postgres"
SCHEMA_URL="https://raw.githubusercontent.com/GITHUB_REPO_PLACEHOLDER/GITHUB_BRANCH_PLACEHOLDER/main/database/schema.sql"

echo "🚀 Configurando banco de dados VIP Connect..."

# Criar banco de dados
echo "📦 Criando banco de dados $DB_NAME..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" || echo "Banco já existe, continuando..."

# Conectar ao banco e criar extensões
echo "🔧 Criando extensões necessárias..."
psql -U $DB_USER -d $DB_NAME <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

# Baixar e executar schema
echo "📄 Baixando schema SQL..."
curl -o /tmp/schema.sql "$SCHEMA_URL" || {
    echo "⚠️  Não foi possível baixar o schema automaticamente"
    echo "📝 Por favor, execute manualmente:"
    echo "   psql -U postgres -d vip_connect -f /caminho/para/schema.sql"
    exit 1
}

echo "📄 Executando schema SQL..."
psql -U $DB_USER -d $DB_NAME -f /tmp/schema.sql

echo "✅ Configuração do banco de dados concluída!"
DBSCRIPT

    # Substituir placeholders
    sed -i "s/GITHUB_REPO_PLACEHOLDER/$GITHUB_REPO/g" /tmp/setup-vip-connect-db.sh
    sed -i "s/GITHUB_BRANCH_PLACEHOLDER/$GITHUB_BRANCH/g" /tmp/setup-vip-connect-db.sh
    
    chmod +x /tmp/setup-vip-connect-db.sh
    
    print_success "Script de configuração do banco criado em /tmp/setup-vip-connect-db.sh"
}

# Gerar arquivo de configuração para Coolify
generate_coolify_config() {
    print_header "Gerando Arquivo de Configuração"

    cat > /tmp/vip-connect-coolify-config.txt << CONFIG
════════════════════════════════════════════════════════════
  CONFIGURAÇÃO VIP CONNECT - COOLIFY
════════════════════════════════════════════════════════════

📋 INFORMAÇÕES COLETADAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repositório GitHub: $GITHUB_REPO
Branch: $GITHUB_BRANCH
Frontend Domain: $FRONTEND_DOMAIN
Backend Domain: $BACKEND_DOMAIN
PostgreSQL Password: $POSTGRES_PASSWORD
JWT Secret: $JWT_SECRET

════════════════════════════════════════════════════════════
  PASSO 1: CONFIGURAR POSTGRESQL
════════════════════════════════════════════════════════════

1. No Coolify, vá em "New Resource" → "Database" → "PostgreSQL"
2. Configure:
   - Nome: vip-connect-db
   - Versão: 15
   - Senha: $POSTGRES_PASSWORD
   - Volume: Criar volume persistente

3. Após criar, execute no terminal do PostgreSQL:
   bash /tmp/setup-vip-connect-db.sh

   OU manualmente:
   psql -U postgres
   CREATE DATABASE vip_connect;
   \\c vip_connect
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   \\q
   
   # Baixar e executar schema
   curl -o /tmp/schema.sql https://raw.githubusercontent.com/$GITHUB_REPO/$GITHUB_BRANCH/main/database/schema.sql
   psql -U postgres -d vip_connect -f /tmp/schema.sql

════════════════════════════════════════════════════════════
  PASSO 2: CONFIGURAR BACKEND
════════════════════════════════════════════════════════════

1. No Coolify, vá em "New Resource" → "Application" → "GitHub"
2. Conecte ao GitHub e selecione o repositório: $GITHUB_REPO
3. Configure:
   - Branch: $GITHUB_BRANCH
   - Root Directory: server
   - Build Command: npm install && npm run build
   - Start Command: npm start
   - Port: 3000
   - Build Pack: Nixpacks ou Dockerfile

4. Variáveis de Ambiente (Environment Variables):
   DATABASE_HOST=vip-connect-db
   DATABASE_PORT=5432
   DATABASE_NAME=vip_connect
   DATABASE_USER=postgres
   DATABASE_PASSWORD=$POSTGRES_PASSWORD
   JWT_SECRET=$JWT_SECRET
   CORS_ORIGIN=https://$FRONTEND_DOMAIN
   NODE_ENV=production
   PORT=3000

5. Domínio:
   - Configure domínio: $BACKEND_DOMAIN
   - Habilite SSL/Let's Encrypt
   - Habilite Auto Deploy

════════════════════════════════════════════════════════════
  PASSO 3: CONFIGURAR FRONTEND
════════════════════════════════════════════════════════════

1. No Coolify, vá em "New Resource" → "Application" → "GitHub"
2. Conecte ao GitHub e selecione o repositório: $GITHUB_REPO
3. Configure:
   - Branch: $GITHUB_BRANCH
   - Root Directory: . (raiz)
   - Build Command: npm install && npm run build
   - Output Directory: dist
   - Port: 8080 (ou deixe vazio para static)
   - Build Pack: Nixpacks ou Static Site

4. Variáveis de Ambiente (Environment Variables):
   VITE_API_URL=https://$BACKEND_DOMAIN/api
   VITE_NODE_ENV=production

5. Domínio:
   - Configure domínio: $FRONTEND_DOMAIN
   - Habilite SSL/Let's Encrypt
   - Habilite Auto Deploy

════════════════════════════════════════════════════════════
  VERIFICAÇÃO
════════════════════════════════════════════════════════════

Após configurar tudo, verifique:

1. Backend Health Check:
   curl https://$BACKEND_DOMAIN/health

2. Frontend:
   Acesse https://$FRONTEND_DOMAIN no navegador

3. Verifique logs no Coolify para confirmar que tudo está funcionando

════════════════════════════════════════════════════════════
  TROUBLESHOOTING
════════════════════════════════════════════════════════════

- Backend não conecta ao banco: Verifique DATABASE_HOST (deve ser o nome do serviço PostgreSQL)
- CORS Error: Verifique CORS_ORIGIN no backend (deve ser a URL do frontend)
- Variáveis não funcionam: Frontend precisa de prefixo VITE_ e rebuild após alterar

════════════════════════════════════════════════════════════
CONFIG

    print_success "Arquivo de configuração criado em /tmp/vip-connect-coolify-config.txt"
    print_info "Você pode visualizar com: cat /tmp/vip-connect-coolify-config.txt"
}

# Função principal
main() {
    print_header "🚀 Instalação Automatizada VIP Connect no Coolify"
    
    check_root
    check_os
    collect_info
    
    install_system_dependencies
    install_docker
    install_coolify
    
    create_database_setup_script
    generate_coolify_config
    
    print_header "✅ Instalação Concluída!"
    
    echo ""
    print_success "Coolify foi instalado com sucesso!"
    echo ""
    print_info "Próximos passos:"
    echo ""
    echo "1. Acesse o Coolify: $COOLIFY_URL"
    echo "2. Configure sua conta de administrador"
    echo "3. Siga as instruções em: /tmp/vip-connect-coolify-config.txt"
    echo ""
    echo "Para visualizar as instruções:"
    echo "  cat /tmp/vip-connect-coolify-config.txt"
    echo ""
    print_warning "IMPORTANTE: Guarde as senhas geradas em local seguro!"
    echo ""
    echo "PostgreSQL Password: $POSTGRES_PASSWORD"
    echo "JWT Secret: $JWT_SECRET"
    echo ""
}

# Executar função principal
main "$@"

