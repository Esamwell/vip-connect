# 🔧 Corrigir PostgreSQL em Loop de Reinicialização

## ❌ Problema

Container está em estado "Restarting (1)" - está falhando ao iniciar.

## 🔍 Diagnóstico

Execute na VPS para ver o erro:

```bash
# Ver logs do container
docker logs vip-connect-db

# Ver últimos logs
docker logs --tail 50 vip-connect-db
```

## 🔧 Solução

### Passo 1: Parar Container

```bash
docker stop vip-connect-db
docker rm vip-connect-db
```

### Passo 2: Verificar Volume

```bash
# Verificar se volume existe
docker volume ls | grep vip-connect-db-data

# Se necessário, remover volume corrompido (CUIDADO: apaga dados!)
# docker volume rm vip-connect-db-data
```

### Passo 3: Recriar Container Corretamente

```bash
# Recriar com configuração correta
docker run -d \
  --name vip-connect-db \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=1923731sS$ \
  -e POSTGRES_DB=vip_connect \
  -p 5432:5432 \
  -v vip-connect-db-data:/var/lib/postgresql/data \
  --network coolify \
  postgres:16-alpine
```

### Passo 4: Verificar se Iniciou Corretamente

```bash
# Aguardar alguns segundos
sleep 10

# Verificar status
docker ps | grep vip-connect-db

# Ver logs
docker logs vip-connect-db
```

### Passo 5: Configurar para Aceitar Conexões Externas

```bash
# Entrar no container
docker exec -it vip-connect-db sh

# Dentro do container, editar postgresql.conf
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf

# Editar pg_hba.conf
echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf

# Sair do container
exit

# Reiniciar
docker restart vip-connect-db
```

## 🆘 Se Ainda Não Funcionar

### Verificar Logs Detalhados

```bash
docker logs vip-connect-db 2>&1 | tail -100
```

### Recriar do Zero (se volume estiver corrompido)

```bash
# CUIDADO: Isso apaga todos os dados!
docker stop vip-connect-db
docker rm vip-connect-db
docker volume rm vip-connect-db-data

# Recriar
docker run -d \
  --name vip-connect-db \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=1923731sS$ \
  -e POSTGRES_DB=vip_connect \
  -p 5432:5432 \
  -v vip-connect-db-data:/var/lib/postgresql/data \
  --network coolify \
  postgres:16-alpine

# Aguardar e recriar banco
sleep 10
docker exec -it vip-connect-db psql -U postgres -c "CREATE DATABASE vip_connect;"
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"
```

---

**Execute primeiro: `docker logs vip-connect-db` para ver o erro específico!**

