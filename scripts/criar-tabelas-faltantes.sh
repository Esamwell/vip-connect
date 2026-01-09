#!/bin/bash

# Script para criar tabelas faltantes no banco de dados PostgreSQL
# Tabelas: veiculos_cliente_vip e clientes_beneficios

set -e

echo "🔧 Criando tabelas faltantes no banco de dados..."

# Verificar se o container existe
if ! docker ps -a | grep -q "vip-connect-db"; then
    echo "❌ Erro: Container vip-connect-db não encontrado!"
    echo "   Verifique se o container está rodando: docker ps -a"
    exit 1
fi

# Verificar se o container está rodando
if ! docker ps | grep -q "vip-connect-db"; then
    echo "⚠️  Container vip-connect-db não está rodando. Tentando iniciar..."
    docker start vip-connect-db
    echo "⏳ Aguardando PostgreSQL iniciar..."
    sleep 5
fi

# Caminho do arquivo SQL
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/database/criar_tabelas_faltantes.sql"

# Verificar se o arquivo existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Erro: Arquivo SQL não encontrado em: $SCRIPT_PATH"
    exit 1
fi

echo "📄 Executando script SQL: $SCRIPT_PATH"
echo ""

# Executar o script SQL
if docker exec -i vip-connect-db psql -U postgres -d vip_connect < "$SCRIPT_PATH"; then
    echo ""
    echo "✅ Script executado com sucesso!"
    echo ""
    echo "🔍 Verificando se as tabelas foram criadas..."
    
    # Verificar se as tabelas foram criadas
    docker exec -i vip-connect-db psql -U postgres -d vip_connect -c "
        SELECT 
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'veiculos_cliente_vip') 
                THEN '✅ veiculos_cliente_vip criada'
                ELSE '❌ veiculos_cliente_vip NÃO criada'
            END as status_veiculos,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes_beneficios') 
                THEN '✅ clientes_beneficios criada'
                ELSE '❌ clientes_beneficios NÃO criada'
            END as status_beneficios;
    "
    
    echo ""
    echo "🎉 Concluído! As tabelas foram criadas."
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Reinicie o Backend no Coolify (Redeploy)"
    echo "   2. Teste criar um novo cliente VIP"
    echo "   3. Verifique os logs do backend para confirmar que os erros desapareceram"
else
    echo ""
    echo "❌ Erro ao executar o script SQL!"
    echo "   Verifique os logs acima para mais detalhes."
    exit 1
fi

