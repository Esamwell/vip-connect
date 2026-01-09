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

# Criar rede Docker compartilhada (se não existir)
create_docker_network() {
    print_info "Verificando rede Docker compartilhada..."
    
    # Tentar encontrar rede do Coolify
    COOLIFY_NETWORK=$(docker network ls --format '{{.Name}}' | grep -i coolify | head -n 1)
    
    if [ -n "$COOLIFY_NETWORK" ]; then
        print_success "Rede Coolify encontrada: $COOLIFY_NETWORK"
        NETWORK_NAME="$COOLIFY_NETWORK"
    else
        # Criar rede compartilhada
        NETWORK_NAME="vip-connect-network"
        if ! docker network inspect "$NETWORK_NAME" > /dev/null 2>&1; then
            print_info "Criando rede Docker compartilhada: $NETWORK_NAME"
            docker network create "$NETWORK_NAME" > /dev/null 2>&1 || print_info "Rede já existe"
            print_success "Rede Docker criada: $NETWORK_NAME"
        else
            print_info "Rede Docker já existe: $NETWORK_NAME"
        fi
    fi
    
    echo "$NETWORK_NAME"
}

# Criar PostgreSQL automaticamente via Docker
create_postgresql_automatically() {
    print_header "Criando PostgreSQL Automaticamente"

    # Verificar se o container já existe
    if docker ps -a --format '{{.Names}}' | grep -q "^vip-connect-db$"; then
        print_warning "Container PostgreSQL 'vip-connect-db' já existe"
        read -p "Deseja recriar? Isso apagará os dados existentes! (y/n): " recreate
        if [[ $recreate =~ ^[Yy]$ ]]; then
            print_info "Removendo container existente..."
            docker stop vip-connect-db 2>/dev/null || true
            docker rm vip-connect-db 2>/dev/null || true
        else
            print_info "Usando container PostgreSQL existente"
            # Conectar à rede se ainda não estiver conectado
            NETWORK_NAME=$(create_docker_network)
            docker network connect "$NETWORK_NAME" vip-connect-db 2>/dev/null || true
            return 0
        fi
    fi

    # Criar rede Docker compartilhada
    NETWORK_NAME=$(create_docker_network)

    # Criar volume para persistência
    print_info "Criando volume para dados do PostgreSQL..."
    docker volume create vip-connect-db-data 2>/dev/null || print_info "Volume já existe"

    # Criar e iniciar container PostgreSQL
    print_info "Criando container PostgreSQL..."
    docker run -d \
        --name vip-connect-db \
        --restart unless-stopped \
        --network "$NETWORK_NAME" \
        -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        -e POSTGRES_DB=postgres \
        -e PGDATA=/var/lib/postgresql/data/pgdata \
        -v vip-connect-db-data:/var/lib/postgresql/data \
        -p 5432:5432 \
        postgres:15-alpine

    if [ $? -ne 0 ]; then
        print_error "Falha ao criar container PostgreSQL"
        return 1
    fi

    print_success "Container PostgreSQL criado"

    # Aguardar PostgreSQL estar pronto
    print_info "Aguardando PostgreSQL iniciar..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec vip-connect-db pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL está pronto!"
            break
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "PostgreSQL não iniciou a tempo"
        return 1
    fi

    # Configurar banco de dados
    print_info "Configurando banco de dados..."
    
    # Criar banco vip_connect
    docker exec vip-connect-db psql -U postgres -c "CREATE DATABASE vip_connect;" 2>/dev/null || print_info "Banco vip_connect já existe"

    # Criar extensões
    docker exec vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null
    docker exec vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";" 2>/dev/null

    print_success "Extensões criadas"

    # Baixar e executar schema
    print_info "Baixando schema SQL..."
    SCHEMA_URL="https://raw.githubusercontent.com/$GITHUB_REPO/$GITHUB_BRANCH/main/database/schema.sql"
    
    # Tentar baixar o schema
    if curl -fsSL "$SCHEMA_URL" -o /tmp/schema.sql 2>/dev/null; then
        print_success "Schema baixado com sucesso"
        
        # Copiar schema para o container
        docker cp /tmp/schema.sql vip-connect-db:/tmp/schema.sql
        
        # Executar schema
        print_info "Executando schema SQL (isso pode levar alguns minutos)..."
        if docker exec vip-connect-db psql -U postgres -d vip_connect -f /tmp/schema.sql > /tmp/schema-output.log 2>&1; then
            print_success "Schema executado com sucesso!"
            rm -f /tmp/schema.sql
        else
            print_warning "Houve alguns avisos ao executar o schema. Verifique /tmp/schema-output.log"
            print_info "O banco foi criado, mas você pode precisar executar o schema manualmente"
        fi
    else
        print_warning "Não foi possível baixar o schema automaticamente"
        print_info "Você precisará executar o schema manualmente depois"
        print_info "URL do schema: $SCHEMA_URL"
    fi

    print_success "PostgreSQL configurado e pronto para uso!"
    print_info "Container: vip-connect-db"
    print_info "Rede Docker: $NETWORK_NAME"
    print_info "Porta: 5432"
    print_info "Usuário: postgres"
    print_info "Senha: [configurada anteriormente]"
    print_info "Banco: vip_connect"
    print_info ""
    print_info "Para conectar do Coolify, use:"
    print_info "  DATABASE_HOST=vip-connect-db"
    print_info "  (ou o IP do container se estiver em rede diferente)"
    
    # Salvar nome da rede para uso posterior
    echo "$NETWORK_NAME" > /tmp/vip-connect-network-name.txt
    
    return 0
}

# Criar PostgreSQL via Coolify (se token fornecido)
create_postgresql_via_coolify() {
    if [ -z "$COOLIFY_TOKEN" ]; then
        return 1
    fi

    print_header "Criando PostgreSQL via Coolify API"

    # Nota: A API do Coolify pode variar
    # Por enquanto, vamos criar via Docker diretamente
    # e depois o usuário pode importar no Coolify se necessário
    
    print_info "Criando PostgreSQL via Docker (será compatível com Coolify)..."
    create_postgresql_automatically
    
    return 0
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

    # Ler nome da rede se existir
    NETWORK_NAME_CONFIG=$(cat /tmp/vip-connect-network-name.txt 2>/dev/null || echo "vip-connect-network ou rede Coolify")

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
  PASSO 1: POSTGRESQL
════════════════════════════════════════════════════════════

✅ PostgreSQL já foi criado automaticamente!

Container Docker: vip-connect-db
Rede Docker: $NETWORK_NAME_CONFIG
Porta: 5432
Usuário: postgres
Senha: $POSTGRES_PASSWORD
Banco: vip_connect

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPÇÃO 1: Usar PostgreSQL criado automaticamente (Recomendado)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O PostgreSQL já está rodando e configurado em uma rede Docker compartilhada.
No Coolify, ao criar o backend, você tem duas opções:

A) Se o Coolify usar a mesma rede Docker:
   DATABASE_HOST=vip-connect-db
   DATABASE_PORT=5432
   DATABASE_NAME=vip_connect
   DATABASE_USER=postgres
   DATABASE_PASSWORD=$POSTGRES_PASSWORD

B) Se precisar usar IP (verificar IP do container):
   docker inspect vip-connect-db | grep IPAddress
   # Use o IP retornado no DATABASE_HOST

C) Conectar o backend à mesma rede do PostgreSQL:
   No Coolify, nas configurações do backend, adicione a rede Docker:
   $NETWORK_NAME_CONFIG

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPÇÃO 2: Criar PostgreSQL no Coolify (Alternativa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se preferir criar via interface do Coolify:

1. No Coolify, vá em "New Resource" → "Database" → "PostgreSQL"
2. Configure:
   - Nome: vip-connect-db-coolify
   - Versão: 15
   - Senha: $POSTGRES_PASSWORD
   - Volume: Criar volume persistente

3. Após criar, execute no terminal do PostgreSQL:
   bash /tmp/setup-vip-connect-db.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMANDOS ÚTEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Ver status do PostgreSQL
docker ps | grep vip-connect-db

# Ver logs do PostgreSQL
docker logs vip-connect-db

# Conectar ao PostgreSQL
docker exec -it vip-connect-db psql -U postgres -d vip_connect

# Reiniciar PostgreSQL
docker restart vip-connect-db

# Parar PostgreSQL
docker stop vip-connect-db

# Iniciar PostgreSQL
docker start vip-connect-db

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

   ⚠️ IMPORTANTE: Se o backend estiver em container Docker separado,
   você pode precisar usar o IP do container vip-connect-db ou
   configurar uma rede Docker compartilhada. Para descobrir o IP:
   docker inspect vip-connect-db | grep IPAddress

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
    
    # Aguardar Coolify estar pronto antes de criar PostgreSQL
    wait_for_coolify
    
    # Criar PostgreSQL automaticamente
    print_info "Deseja criar o PostgreSQL automaticamente agora? (recomendado)"
    read -p "Criar PostgreSQL automaticamente? (y/n) [y]: " create_db
    create_db=${create_db:-y}
    
    if [[ $create_db =~ ^[Yy]$ ]]; then
        if [ -n "$COOLIFY_TOKEN" ]; then
            create_postgresql_via_coolify || create_postgresql_automatically
        else
            create_postgresql_automatically
        fi
    else
        print_info "PostgreSQL não será criado automaticamente"
        print_info "Você pode criá-lo depois seguindo as instruções em /tmp/vip-connect-coolify-config.txt"
    fi
    
    create_database_setup_script
    generate_coolify_config
    
    print_header "✅ Instalação Concluída!"
    
    echo ""
    print_success "Coolify foi instalado com sucesso!"
    
    # Verificar se PostgreSQL foi criado
    POSTGRES_CREATED=false
    POSTGRES_IP=""
    POSTGRES_STATUS=""
    if docker ps --format '{{.Names}}' | grep -q "^vip-connect-db$"; then
        POSTGRES_CREATED=true
        POSTGRES_STATUS=$(docker ps --filter name=vip-connect-db --format '{{.Status}}')
        POSTGRES_IP=$(docker inspect vip-connect-db 2>/dev/null | grep -A 20 "Networks" | grep "IPAddress" | head -1 | awk '{print $2}' | tr -d '",' || echo "N/A")
    fi
    
    # Ler nome da rede
    NETWORK_NAME_FINAL=$(cat /tmp/vip-connect-network-name.txt 2>/dev/null || echo "N/A")
    
    # Gerar resumo completo
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  📋 RESUMO COMPLETO DA INSTALAÇÃO${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${GREEN}🌐 URLs E ACESSOS:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Coolify:                    $COOLIFY_URL"
    echo "  Frontend (a configurar):    https://$FRONTEND_DOMAIN"
    echo "  Backend (a configurar):      https://$BACKEND_DOMAIN"
    echo ""
    
    echo -e "${GREEN}📦 REPOSITÓRIO GITHUB:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Repositório:                $GITHUB_REPO"
    echo "  Branch:                     $GITHUB_BRANCH"
    echo ""
    
    if [ "$POSTGRES_CREATED" = true ]; then
        echo -e "${GREEN}🗄️  POSTGRESQL (CRIADO AUTOMATICAMENTE):${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Container:                 vip-connect-db"
        echo "  Status:                     $POSTGRES_STATUS"
        echo "  IP do Container:            $POSTGRES_IP"
        echo "  Rede Docker:                $NETWORK_NAME_FINAL"
        echo "  Porta:                      5432"
        echo "  Host (para Coolify):        vip-connect-db"
        echo "  Host (alternativo - IP):    $POSTGRES_IP"
        echo "  Usuário:                    postgres"
        echo "  Senha:                      ${RED}$POSTGRES_PASSWORD${NC}"
        echo "  Banco de Dados:             vip_connect"
        echo "  Porta Externa:              5432 (localhost:5432)"
        echo ""
    else
        echo -e "${YELLOW}🗄️  POSTGRESQL:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Status:                     Não criado automaticamente"
        echo "  Senha configurada:          ${RED}$POSTGRES_PASSWORD${NC}"
        echo "  (Siga instruções em /tmp/vip-connect-coolify-config.txt)"
        echo ""
    fi
    
    echo -e "${GREEN}🔐 CREDENCIAIS E SECRETS:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  PostgreSQL Password:         ${RED}$POSTGRES_PASSWORD${NC}"
    echo "  JWT Secret:                  ${RED}$JWT_SECRET${NC}"
    echo ""
    
    echo -e "${GREEN}⚙️  VARIÁVEIS DE AMBIENTE PARA O BACKEND:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  DATABASE_HOST=vip-connect-db"
    echo "  DATABASE_PORT=5432"
    echo "  DATABASE_NAME=vip_connect"
    echo "  DATABASE_USER=postgres"
    echo "  DATABASE_PASSWORD=$POSTGRES_PASSWORD"
    echo "  JWT_SECRET=$JWT_SECRET"
    echo "  CORS_ORIGIN=https://$FRONTEND_DOMAIN"
    echo "  NODE_ENV=production"
    echo "  PORT=3000"
    echo ""
    
    echo -e "${GREEN}⚙️  VARIÁVEIS DE AMBIENTE PARA O FRONTEND:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  VITE_API_URL=https://$BACKEND_DOMAIN/api"
    echo "  VITE_NODE_ENV=production"
    echo ""
    
    echo -e "${GREEN}📁 ARQUIVOS GERADOS:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Instruções completas:          /tmp/vip-connect-coolify-config.txt"
    echo "  Script setup banco:            /tmp/setup-vip-connect-db.sh"
    if [ -f /tmp/vip-connect-network-name.txt ]; then
        echo "  Nome da rede Docker:          /tmp/vip-connect-network-name.txt"
    fi
    echo ""
    
    echo -e "${GREEN}🔧 COMANDOS ÚTEIS:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Ver instruções:              cat /tmp/vip-connect-coolify-config.txt"
    if [ "$POSTGRES_CREATED" = true ]; then
        echo "  Status PostgreSQL:            docker ps | grep vip-connect-db"
        echo "  Logs PostgreSQL:               docker logs vip-connect-db"
        echo "  Conectar ao banco:             docker exec -it vip-connect-db psql -U postgres -d vip_connect"
        echo "  Reiniciar PostgreSQL:           docker restart vip-connect-db"
    fi
    echo ""
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    print_warning "⚠️  IMPORTANTE: Guarde estas credenciais em local seguro!"
    echo ""
    print_info "📝 Próximos passos:"
    echo ""
    echo "  1. Acesse o Coolify: $COOLIFY_URL"
    echo "  2. Configure sua conta de administrador"
    echo "  3. Configure o Backend no Coolify usando as variáveis acima"
    echo "  4. Configure o Frontend no Coolify usando as variáveis acima"
    echo "  5. Siga as instruções detalhadas em: /tmp/vip-connect-coolify-config.txt"
    echo ""
    
    # Salvar credenciais em arquivo seguro
    cat > /tmp/vip-connect-credentials.txt << CREDENTIALS
════════════════════════════════════════════════════════════
  🔐 CREDENCIAIS VIP CONNECT - GUARDE EM LOCAL SEGURO!
════════════════════════════════════════════════════════════

Data da instalação: $(date)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  URLs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coolify:                    $COOLIFY_URL
Frontend:                    https://$FRONTEND_DOMAIN
Backend:                     https://$BACKEND_DOMAIN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Repositório GitHub
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repositório:                $GITHUB_REPO
Branch:                     $GITHUB_BRANCH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PostgreSQL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Container:                  vip-connect-db
Host:                       vip-connect-db
IP:                         $POSTGRES_IP
Porta:                      5432
Rede Docker:                $NETWORK_NAME_FINAL
Usuário:                    postgres
Senha:                      $POSTGRES_PASSWORD
Banco de Dados:             vip_connect

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Secrets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JWT Secret:                 $JWT_SECRET

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Variáveis de Ambiente - Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE_HOST=vip-connect-db
DATABASE_PORT=5432
DATABASE_NAME=vip_connect
DATABASE_USER=postgres
DATABASE_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$FRONTEND_DOMAIN
NODE_ENV=production
PORT=3000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Variáveis de Ambiente - Frontend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VITE_API_URL=https://$BACKEND_DOMAIN/api
VITE_NODE_ENV=production

════════════════════════════════════════════════════════════
CREDENTIALS
    
    chmod 600 /tmp/vip-connect-credentials.txt 2>/dev/null || true
    
    print_success "Credenciais salvas em: /tmp/vip-connect-credentials.txt"
    print_warning "Este arquivo contém informações sensíveis. Proteja-o adequadamente!"
    echo ""
}

# Executar função principal
main "$@"

