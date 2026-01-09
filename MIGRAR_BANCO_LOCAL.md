# 🔄 Migrar Banco de Dados do Localhost para VPS

Guia completo para migrar seus dados do PostgreSQL local para a VPS.

## 📋 Pré-requisitos

1. ✅ PostgreSQL instalado localmente
2. ✅ Acesso SSH à VPS
3. ✅ `pg_dump` instalado (vem com PostgreSQL)
4. ✅ Container PostgreSQL rodando na VPS

## 🚀 Método 1: Script Automatizado (Recomendado)

### Executar o Script

No seu computador local (não na VPS):

```bash
# Baixar o script
curl -fsSL https://raw.githubusercontent.com/esamwell/vip-connect/main/scripts/migrate-local-to-vps.sh -o migrate-local-to-vps.sh

# Dar permissão
chmod +x migrate-local-to-vps.sh

# Executar
bash migrate-local-to-vps.sh
```

### O que o Script Faz

1. ✅ Solicita informações do banco local
2. ✅ Solicita informações da VPS
3. ✅ Testa conexão com banco local
4. ✅ Cria backup do banco local
5. ✅ Transfere backup para VPS via SCP
6. ✅ Restaura backup no container PostgreSQL
7. ✅ Verifica se migração foi bem-sucedida
8. ✅ Mostra resumo completo

## 🔧 Método 2: Manual (Passo a Passo)

### Passo 1: Criar Backup do Banco Local

No seu computador local:

```bash
# Criar backup (formato custom - mais rápido)
pg_dump -h localhost -p 5432 -U postgres -d vip_connect -F c -f vip_connect_backup.dump

# OU criar backup SQL (mais compatível)
pg_dump -h localhost -p 5432 -U postgres -d vip_connect -f vip_connect_backup.sql
```

**Se pedir senha:**
```bash
PGPASSWORD=sua_senha pg_dump -h localhost -p 5432 -U postgres -d vip_connect -F c -f vip_connect_backup.dump
```

### Passo 2: Transferir Backup para VPS

```bash
# Transferir arquivo para VPS
scp vip_connect_backup.dump root@84.46.241.73:/tmp/

# OU se usar formato SQL
scp vip_connect_backup.sql root@84.46.241.73:/tmp/
```

### Passo 3: Restaurar Backup na VPS

Conecte na VPS via SSH:

```bash
ssh root@84.46.241.73
```

Na VPS, execute:

```bash
# Copiar backup para dentro do container
docker cp /tmp/vip_connect_backup.dump vip-connect-db:/tmp/vip_connect_backup.dump

# Restaurar backup (formato custom)
docker exec -i vip-connect-db pg_restore -U postgres -d vip_connect --clean --if-exists /tmp/vip_connect_backup.dump

# OU se usar formato SQL
docker cp /tmp/vip_connect_backup.sql vip-connect-db:/tmp/vip_connect_backup.sql
docker exec -i vip-connect-db psql -U postgres -d vip_connect -f /tmp/vip_connect_backup.sql
```

### Passo 4: Verificar Migração

```bash
# Verificar tabelas
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"

# Verificar quantidade de registros em uma tabela
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "SELECT COUNT(*) FROM users;"

# Limpar arquivo temporário
rm /tmp/vip_connect_backup.*
```

## 📝 Exemplo Completo

### No Computador Local:

```bash
# 1. Criar backup
PGPASSWORD=sua_senha_local pg_dump -h localhost -p 5432 -U postgres -d vip_connect -F c -f backup.dump

# 2. Transferir para VPS
scp backup.dump root@84.46.241.73:/tmp/
```

### Na VPS:

```bash
# 3. Copiar para container
docker cp /tmp/backup.dump vip-connect-db:/tmp/backup.dump

# 4. Restaurar
docker exec -i vip-connect-db pg_restore -U postgres -d vip_connect --clean --if-exists /tmp/backup.dump

# 5. Verificar
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"

# 6. Limpar
rm /tmp/backup.dump
```

## 🔍 Verificar Dados Migrados

### Verificar Tabelas

```bash
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"
```

### Verificar Registros

```bash
# Contar registros em cada tabela
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables t2 WHERE t2.table_schema = t1.schemaname AND t2.table_name = t1.tablename) as row_count
FROM pg_tables t1
WHERE schemaname = 'public'
ORDER BY tablename;
"
```

### Comparar com Local

No seu computador local:

```bash
# Contar registros localmente
psql -h localhost -p 5432 -U postgres -d vip_connect -c "SELECT COUNT(*) FROM users;"
```

Na VPS:

```bash
# Contar registros na VPS
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "SELECT COUNT(*) FROM users;"
```

Os números devem ser iguais!

## ⚠️ Problemas Comuns

### Erro: "pg_dump: command not found"

**Solução:** Instale PostgreSQL client tools:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# Baixe do site oficial: https://www.postgresql.org/download/windows/
```

### Erro: "password authentication failed"

**Solução:** Use variável de ambiente:

```bash
PGPASSWORD=sua_senha pg_dump -h localhost -p 5432 -U postgres -d vip_connect -F c -f backup.dump
```

### Erro: "connection refused" na VPS

**Solução:** Verifique se container está rodando:

```bash
docker ps | grep vip-connect-db
```

### Erro: "database does not exist"

**Solução:** Crie o banco primeiro:

```bash
docker exec -it vip-connect-db psql -U postgres -c "CREATE DATABASE vip_connect;"
```

## 📋 Checklist de Migração

- [ ] Backup criado do banco local
- [ ] Backup transferido para VPS
- [ ] Backup restaurado no container
- [ ] Tabelas verificadas
- [ ] Registros comparados (local vs VPS)
- [ ] Aplicação testada na VPS
- [ ] Backup local mantido como segurança

## 🎯 Próximos Passos

Após migrar:

1. ✅ Teste a aplicação na VPS
2. ✅ Verifique se todos os dados estão corretos
3. ✅ Mantenha o backup local por segurança
4. ✅ Atualize variáveis de ambiente no Coolify se necessário

---

**Use o script automatizado para facilitar a migração!**

