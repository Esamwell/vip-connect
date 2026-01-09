#!/bin/bash
# Script para configurar o banco de dados no Coolify
# Execute este script no terminal do container PostgreSQL do Coolify

set -e

echo "🚀 Configurando banco de dados VIP Connect..."

# Variáveis (ajuste conforme necessário)
DB_NAME="vip_connect"
DB_USER="postgres"
SCHEMA_FILE="/tmp/schema.sql"

# Criar banco de dados
echo "📦 Criando banco de dados $DB_NAME..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" || echo "Banco já existe, continuando..."

# Conectar ao banco e criar extensões
echo "🔧 Criando extensões necessárias..."
psql -U $DB_USER -d $DB_NAME <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

# Executar schema
if [ -f "$SCHEMA_FILE" ]; then
    echo "📄 Executando schema SQL..."
    psql -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE
    echo "✅ Schema executado com sucesso!"
else
    echo "⚠️  Arquivo schema.sql não encontrado em $SCHEMA_FILE"
    echo "📝 Para executar o schema manualmente:"
    echo "   1. Faça upload do arquivo database/schema.sql para o container"
    echo "   2. Execute: psql -U postgres -d vip_connect -f /caminho/para/schema.sql"
fi

echo "✅ Configuração do banco de dados concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure as variáveis de ambiente no Coolify"
echo "   2. Faça o deploy do backend"
echo "   3. Verifique os logs para confirmar a conexão"

