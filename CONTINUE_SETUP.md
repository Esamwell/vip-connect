# 🔄 Continuar Configuração após PostgreSQL Criado

O PostgreSQL foi criado manualmente. Agora você precisa:

## ✅ Passos para Completar

### 1. Criar Banco de Dados e Extensões

```bash
# Criar banco vip_connect
docker exec -it vip-connect-db psql -U postgres -c "CREATE DATABASE vip_connect;"

# Criar extensões necessárias
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"
```

### 2. Executar Schema SQL

```bash
# Baixar schema do GitHub
curl -o /tmp/schema.sql https://raw.githubusercontent.com/esamwell/vip-connect/main/database/schema.sql

# Executar schema
docker exec -i vip-connect-db psql -U postgres -d vip_connect < /tmp/schema.sql
```

### 3. Verificar Configuração

```bash
# Verificar tabelas criadas
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"

# Verificar extensões
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dx"
```

## 📋 Próximos Passos

Agora você pode:

1. **Configurar Backend no Coolify**:
   - Acesse: http://84.46.241.73:8000
   - Crie sua conta de administrador
   - Configure o backend seguindo as instruções em `/tmp/vip-connect-coolify-config.txt`

2. **Variáveis de Ambiente do Backend**:
   ```
   DATABASE_HOST=vip-connect-db
   DATABASE_PORT=5432
   DATABASE_NAME=vip_connect
   DATABASE_USER=postgres
   DATABASE_PASSWORD=1923731sS$
   JWT_SECRET=[o_secret_gerado_pelo_script]
   CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
   NODE_ENV=production
   PORT=3000
   ```

3. **Configurar Frontend no Coolify**:
   - Adicione aplicação Frontend
   - Configure variáveis:
     ```
     VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api
     VITE_NODE_ENV=production
     ```

## 🔍 Verificar Instruções Completas

```bash
# Ver arquivo de configuração gerado pelo script
cat /tmp/vip-connect-coolify-config.txt
```

---

**Versão**: 1.0.0

