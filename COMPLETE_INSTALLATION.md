# 🔧 Completar Instalação Manualmente

O script parou devido ao erro na criação do PostgreSQL. Siga estes passos para completar:

## ✅ O que já foi feito

- ✅ Coolify instalado e rodando
- ✅ PostgreSQL criado manualmente e rodando
- ✅ Container: `vip-connect-db`

## 🔄 O que falta fazer

### 1. Completar Configuração do Banco de Dados

Execute na VPS:

```bash
# Criar banco vip_connect
docker exec -it vip-connect-db psql -U postgres -c "CREATE DATABASE vip_connect;" 2>/dev/null || echo "Banco já existe"

# Criar extensões
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"

# Baixar e executar schema
curl -o /tmp/schema.sql https://raw.githubusercontent.com/esamwell/vip-connect/main/database/schema.sql
docker exec -i vip-connect-db psql -U postgres -d vip_connect < /tmp/schema.sql

# Verificar
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"
```

### 2. Obter Informações do PostgreSQL

```bash
# Obter IP do container
docker inspect vip-connect-db | grep IPAddress

# Ou usar o nome do container diretamente
# Host: vip-connect-db
```

### 3. Criar Arquivo de Configuração Manualmente

Crie o arquivo `/tmp/vip-connect-coolify-config.txt` com estas informações:

```bash
cat > /tmp/vip-connect-coolify-config.txt << 'EOF'
════════════════════════════════════════════════════════════
  CONFIGURAÇÃO VIP CONNECT - COOLIFY
════════════════════════════════════════════════════════════

📋 INFORMAÇÕES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repositório GitHub: esamwell/vip-connect
Branch: main
Frontend Domain: asibeneficios.autoshoppingitapoan.com.br
Backend Domain: api.asibeneficios.autoshoppingitapoan.com.br
PostgreSQL Password: 1923731sS$
JWT Secret: [gerar novo ou usar o do script]

════════════════════════════════════════════════════════════
  POSTGRESQL
════════════════════════════════════════════════════════════

✅ PostgreSQL já está rodando!

Container: vip-connect-db
Host: vip-connect-db (ou IP do container)
Porta: 5432
Usuário: postgres
Senha: 1923731sS$
Banco: vip_connect

════════════════════════════════════════════════════════════
  CONFIGURAR BACKEND NO COOLIFY
════════════════════════════════════════════════════════════

1. No Coolify, vá em "New Resource" → "Public Repository"
2. Configure:
   - Repository: https://github.com/esamwell/vip-connect
   - Branch: main
   - Base Directory: server
   - Port: 3000
   - Build Pack: Nixpacks

3. Variáveis de Ambiente:
   DATABASE_HOST=vip-connect-db
   DATABASE_PORT=5432
   DATABASE_NAME=vip_connect
   DATABASE_USER=postgres
   DATABASE_PASSWORD=1923731sS$
   JWT_SECRET=[gerar_secret_32+_caracteres]
   CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
   NODE_ENV=production
   PORT=3000

4. Domínio:
   - Adicione: api.asibeneficios.autoshoppingitapoan.com.br
   - Habilite SSL/Let's Encrypt

════════════════════════════════════════════════════════════
  CONFIGURAR FRONTEND NO COOLIFY
════════════════════════════════════════════════════════════

1. No Coolify, vá em "New Resource" → "Public Repository"
2. Configure:
   - Repository: https://github.com/esamwell/vip-connect
   - Branch: main
   - Base Directory: . (raiz)
   - Port: 8080 (ou deixe vazio para static)
   - Build Pack: Nixpacks
   - Marque "Is it a static site?" se disponível

3. Variáveis de Ambiente:
   VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api
   VITE_NODE_ENV=production

4. Domínio:
   - Adicione: asibeneficios.autoshoppingitapoan.com.br
   - Habilite SSL/Let's Encrypt

════════════════════════════════════════════════════════════
  GERAR JWT SECRET
════════════════════════════════════════════════════════════

Execute na VPS:
openssl rand -base64 48 | tr -d "=+/" | cut -c1-48

════════════════════════════════════════════════════════════
EOF
```

### 4. Gerar JWT Secret

```bash
# Gerar JWT Secret
openssl rand -base64 48 | tr -d "=+/" | cut -c1-48
```

Use o resultado nas variáveis de ambiente do Backend.

### 5. Verificar Arquivos Gerados pelo Script

```bash
# Verificar se existem arquivos gerados
ls -la /tmp/vip-connect*

# Ver instruções (se existirem)
cat /tmp/vip-connect-coolify-config.txt 2>/dev/null || echo "Arquivo não encontrado"
```

## 📋 Checklist de Verificação

- [ ] PostgreSQL rodando: `docker ps | grep vip-connect-db`
- [ ] Banco `vip_connect` criado
- [ ] Extensões criadas (`uuid-ossp`, `pg_trgm`)
- [ ] Schema SQL executado
- [ ] JWT Secret gerado
- [ ] Backend configurado no Coolify
- [ ] Frontend configurado no Coolify
- [ ] DNS configurado no Cloudflare
- [ ] SSL configurado no Coolify

## 🆘 Se Precisar de Ajuda

1. Verificar logs do PostgreSQL:
   ```bash
   docker logs vip-connect-db
   ```

2. Verificar conexão:
   ```bash
   docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "SELECT version();"
   ```

3. Verificar tabelas:
   ```bash
   docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "\dt"
   ```

---

**Versão**: 1.0.0

