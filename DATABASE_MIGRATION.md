# 💾 Migração de Banco de Dados - Backup e Restore

Este guia detalha como fazer backup do banco PostgreSQL existente em localhost e restaurá-lo na instalação do Coolify.

## 📋 Índice

- [Fazer Backup do Banco Local](#-fazer-backup-do-banco-local)
- [Transferir Backup para VPS](#-transferir-backup-para-vps)
- [Restaurar Backup no Coolify](#-restaurar-backup-no-coolify)
- [Verificação](#-verificação)
- [Troubleshooting](#-troubleshooting)

---

## 💾 Fazer Backup do Banco Local

### Opção 1: Backup Completo (Recomendado)

Este método cria um backup completo do banco, incluindo estrutura e dados.

```bash
# No seu computador local (onde o PostgreSQL está rodando)
pg_dump -U postgres -d vip_connect -F c -f vip_connect_backup_$(date +%Y%m%d_%H%M%S).dump

# Ou se usar porta customizada
pg_dump -U postgres -h localhost -p 5433 -d vip_connect -F c -f vip_connect_backup_$(date +%Y%m%d_%H%M%S).dump

# Ou formato SQL (texto)
pg_dump -U postgres -d vip_connect -f vip_connect_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Parâmetros explicados:**
- `-U postgres`: Usuário do banco
- `-d vip_connect`: Nome do banco
- `-F c`: Formato custom (binário, mais eficiente)
- `-f`: Arquivo de saída
- `-h localhost`: Host (se necessário)
- `-p 5433`: Porta (se diferente da padrão 5432)

### Opção 2: Backup Apenas Dados (Sem estrutura)

Se você já tem o schema no servidor e só quer migrar os dados:

```bash
pg_dump -U postgres -d vip_connect -F c --data-only -f vip_connect_data_only_$(date +%Y%m%d_%H%M%S).dump
```

### Opção 3: Backup Apenas Schema (Sem dados)

Se você quer apenas a estrutura:

```bash
pg_dump -U postgres -d vip_connect -F c --schema-only -f vip_connect_schema_only_$(date +%Y%m%d_%H%M%S).dump
```

### Opção 4: Backup com Compressão

Para economizar espaço:

```bash
pg_dump -U postgres -d vip_connect -F c -Z 9 -f vip_connect_backup_$(date +%Y%m%d_%H%M%S).dump.gz
```

---

## 📤 Transferir Backup para VPS

### Método 1: Via SCP (Recomendado)

```bash
# Do seu computador local
scp vip_connect_backup_YYYYMMDD_HHMMSS.dump root@seu-ip-vps:/tmp/

# Ou com compressão
scp vip_connect_backup_YYYYMMDD_HHMMSS.dump.gz root@seu-ip-vps:/tmp/
```

### Método 2: Via SFTP

```bash
# Conectar via SFTP
sftp root@seu-ip-vps

# No SFTP:
put vip_connect_backup_YYYYMMDD_HHMMSS.dump /tmp/
exit
```

### Método 3: Via HTTP Temporário

Se o arquivo for muito grande ou você não tiver acesso SSH direto:

```bash
# No seu computador local, criar servidor HTTP temporário
python3 -m http.server 8000

# Ou com Python 2
python -m SimpleHTTPServer 8000

# Na VPS, baixar o arquivo
curl http://seu-ip-local:8000/vip_connect_backup_YYYYMMDD_HHMMSS.dump -o /tmp/vip_connect_backup.dump
```

### Método 4: Via Cloud Storage

1. Upload para Google Drive, Dropbox, etc.
2. Baixar na VPS usando `wget` ou `curl`

---

## 🔄 Restaurar Backup no Coolify

### Passo 1: Verificar PostgreSQL no Coolify

Certifique-se de que o PostgreSQL está rodando:

```bash
# Na VPS
docker ps | grep vip-connect-db

# Ou se criado via Coolify
docker ps | grep postgres
```

### Passo 2: Copiar Backup para o Container

#### Se PostgreSQL foi criado pelo script de instalação:

```bash
# Copiar arquivo para o container
docker cp /tmp/vip_connect_backup_YYYYMMDD_HHMMSS.dump vip-connect-db:/tmp/backup.dump

# Ou se estiver comprimido, descomprimir primeiro
gunzip /tmp/vip_connect_backup_YYYYMMDD_HHMMSS.dump.gz
docker cp /tmp/vip_connect_backup_YYYYMMDD_HHMMSS.dump vip-connect-db:/tmp/backup.dump
```

#### Se PostgreSQL foi criado via Coolify:

```bash
# Descobrir nome do container PostgreSQL
docker ps | grep postgres

# Copiar arquivo (substitua CONTAINER_NAME pelo nome real)
docker cp /tmp/vip_connect_backup_YYYYMMDD_HHMMSS.dump CONTAINER_NAME:/tmp/backup.dump
```

### Passo 3: Restaurar Backup

#### Opção A: Restaurar Backup Completo (Formato Custom)

```bash
# Conectar ao container
docker exec -it vip-connect-db bash

# Dentro do container, restaurar backup
pg_restore -U postgres -d vip_connect -v /tmp/backup.dump

# Ou se o banco não existir ainda, criar primeiro
createdb -U postgres vip_connect
pg_restore -U postgres -d vip_connect -v /tmp/backup.dump

# Sair do container
exit
```

#### Opção B: Restaurar Backup SQL (Formato Texto)

```bash
# Se o backup for em formato SQL
docker exec -i vip-connect-db psql -U postgres -d vip_connect < /tmp/vip_connect_backup.sql

# Ou copiar e executar dentro do container
docker cp /tmp/vip_connect_backup.sql vip-connect-db:/tmp/
docker exec -it vip-connect-db psql -U postgres -d vip_connect -f /tmp/vip_connect_backup.sql
```

#### Opção C: Restaurar Apenas Dados (Se schema já existe)

```bash
docker exec -it vip-connect-db bash
pg_restore -U postgres -d vip_connect --data-only -v /tmp/backup.dump
exit
```

#### Opção D: Restaurar com Substituição (Cuidado!)

⚠️ **ATENÇÃO**: Isso apagará dados existentes!

```bash
docker exec -it vip-connect-db bash
# Dropar e recriar banco
dropdb -U postgres vip_connect
createdb -U postgres vip_connect
pg_restore -U postgres -d vip_connect -v /tmp/backup.dump
exit
```

### Passo 4: Verificar Restauração

```bash
# Conectar ao banco e verificar
docker exec -it vip-connect-db psql -U postgres -d vip_connect

# Dentro do psql:
\dt                    # Listar tabelas
SELECT COUNT(*) FROM users;  # Verificar dados
SELECT COUNT(*) FROM clientes_vip;
\q                     # Sair
```

---

## ✅ Verificação Completa

### 1. Verificar Tabelas

```bash
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"
```

### 2. Verificar Contagem de Registros

```bash
# Verificar algumas tabelas principais
docker exec -it vip-connect-db psql -U postgres -d vip_connect <<EOF
SELECT 
    'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'clientes_vip', COUNT(*) FROM clientes_vip
UNION ALL
SELECT 'lojas', COUNT(*) FROM lojas
UNION ALL
SELECT 'beneficios_oficiais', COUNT(*) FROM beneficios_oficiais
UNION ALL
SELECT 'vendas', COUNT(*) FROM vendas;
EOF
```

### 3. Testar Conexão do Backend

```bash
# Verificar se o backend consegue conectar
# No Coolify, verifique os logs do backend
# Ou teste manualmente:
curl https://api.asibeneficios.autoshoppingitapoan.com.br/health
```

---

## 🔧 Script de Migração Automatizado

Crie um script para automatizar o processo:

```bash
#!/bin/bash
# migrate-database.sh

set -e

BACKUP_FILE=$1
CONTAINER_NAME=${2:-vip-connect-db}
DB_NAME=${3:-vip_connect}
DB_USER=${4:-postgres}

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo_backup> [container_name] [db_name] [db_user]"
    exit 1
fi

echo "🔄 Iniciando migração do banco de dados..."

# Verificar se container existe
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container ${CONTAINER_NAME} não encontrado!"
    exit 1
fi

# Copiar backup para container
echo "📤 Copiando backup para container..."
docker cp "$BACKUP_FILE" "${CONTAINER_NAME}:/tmp/backup.dump"

# Verificar se banco existe
if docker exec "${CONTAINER_NAME}" psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️  Banco $DB_NAME já existe. Deseja substituir? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🗑️  Removendo banco existente..."
        docker exec "${CONTAINER_NAME}" dropdb -U "$DB_USER" "$DB_NAME"
    else
        echo "❌ Operação cancelada"
        exit 1
    fi
fi

# Criar banco se não existir
echo "📦 Criando banco de dados..."
docker exec "${CONTAINER_NAME}" createdb -U "$DB_USER" "$DB_NAME"

# Restaurar backup
echo "🔄 Restaurando backup..."
docker exec "${CONTAINER_NAME}" pg_restore -U "$DB_USER" -d "$DB_NAME" -v /tmp/backup.dump

# Criar extensões necessárias
echo "🔧 Criando extensões..."
docker exec "${CONTAINER_NAME}" psql -U "$DB_USER" -d "$DB_NAME" <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

echo "✅ Migração concluída com sucesso!"
echo ""
echo "Verifique os dados:"
echo "  docker exec -it ${CONTAINER_NAME} psql -U $DB_USER -d $DB_NAME"
```

**Uso:**
```bash
chmod +x migrate-database.sh
./migrate-database.sh /tmp/vip_connect_backup.dump
```

---

## 🛠️ Troubleshooting

### Problema: Erro "database does not exist"

**Solução:**
```bash
# Criar banco primeiro
docker exec -it vip-connect-db createdb -U postgres vip_connect
# Depois restaurar
docker exec -it vip-connect-db pg_restore -U postgres -d vip_connect -v /tmp/backup.dump
```

### Problema: Erro de permissão

**Solução:**
```bash
# Verificar usuário e senha
docker exec -it vip-connect-db psql -U postgres -c "\du"

# Se necessário, restaurar com usuário específico
docker exec -it vip-connect-db pg_restore -U postgres -d vip_connect -v /tmp/backup.dump
```

### Problema: Erro "relation already exists"

**Solução:**
```bash
# Limpar banco antes de restaurar
docker exec -it vip-connect-db psql -U postgres -d vip_connect <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF

# Depois restaurar
docker exec -it vip-connect-db pg_restore -U postgres -d vip_connect -v /tmp/backup.dump
```

### Problema: Backup muito grande

**Solução:**
```bash
# Usar compressão
pg_dump -U postgres -d vip_connect -F c -Z 9 -f backup.dump.gz

# Na VPS, descomprimir antes de restaurar
gunzip backup.dump.gz
```

### Problema: Extensões faltando

**Solução:**
```bash
docker exec -it vip-connect-db psql -U postgres -d vip_connect <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF
```

### Problema: Diferença de versão PostgreSQL

**Solução:**
- Use `pg_dump` da mesma versão ou mais nova que o servidor de destino
- Ou use formato SQL (texto) que é mais compatível entre versões

---

## 📋 Checklist de Migração

Use este checklist para garantir que tudo está correto:

- [ ] Backup criado do banco local
- [ ] Backup transferido para VPS
- [ ] PostgreSQL rodando no Coolify/VPS
- [ ] Backup copiado para container PostgreSQL
- [ ] Banco `vip_connect` criado (se necessário)
- [ ] Extensões criadas (`uuid-ossp`, `pg_trgm`)
- [ ] Backup restaurado com sucesso
- [ ] Tabelas verificadas
- [ ] Contagem de registros verificada
- [ ] Backend consegue conectar ao banco
- [ ] Aplicação funcionando corretamente

---

## 🔄 Processo Completo Resumido

```bash
# 1. LOCAL: Fazer backup
pg_dump -U postgres -d vip_connect -F c -f vip_connect_backup.dump

# 2. LOCAL: Transferir para VPS
scp vip_connect_backup.dump root@seu-ip-vps:/tmp/

# 3. VPS: Copiar para container
docker cp /tmp/vip_connect_backup.dump vip-connect-db:/tmp/

# 4. VPS: Criar banco (se não existir)
docker exec -it vip-connect-db createdb -U postgres vip_connect

# 5. VPS: Criar extensões
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"

# 6. VPS: Restaurar backup
docker exec -it vip-connect-db pg_restore -U postgres -d vip_connect -v /tmp/vip_connect_backup.dump

# 7. VPS: Verificar
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"
```

---

## 📚 Recursos Adicionais

- [Documentação pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Documentação pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Documentação PostgreSQL Backup](https://www.postgresql.org/docs/current/backup.html)

---

**Versão**: 1.0.0  
**Última atualização**: 2025

