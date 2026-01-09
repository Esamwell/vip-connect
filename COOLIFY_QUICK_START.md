# ⚡ Guia Rápido - Deploy VIP Connect no Coolify

Este é um guia rápido para quem já conhece o Coolify e quer fazer o deploy rapidamente.

## 🚀 Passos Rápidos

### 1. PostgreSQL

```bash
# No Coolify: New Resource → Database → PostgreSQL
Nome: vip-connect-db
Versão: 15
Senha: [defina uma senha forte]
```

**Criar banco e executar schema:**

```bash
# No terminal do PostgreSQL no Coolify:
psql -U postgres

CREATE DATABASE vip_connect;
\c vip_connect
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\q

# Executar schema (ajuste o caminho conforme necessário)
psql -U postgres -d vip_connect -f /caminho/para/schema.sql
```

### 2. Backend

**Configuração:**
- **Tipo**: Application → GitHub
- **Repositório**: seu-usuario/vip-connect
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`

**Variáveis de Ambiente:**
```env
DATABASE_HOST=vip-connect-db
DATABASE_PORT=5432
DATABASE_NAME=vip_connect
DATABASE_USER=postgres
DATABASE_PASSWORD=[sua_senha_postgres]
JWT_SECRET=[gerar_secret_32+_caracteres]
CORS_ORIGIN=https://vip-connect.seudominio.com
NODE_ENV=production
PORT=3000
```

**Domínio:** `api.vip-connect.seudominio.com`

### 3. Frontend

**Configuração:**
- **Tipo**: Application → GitHub
- **Repositório**: seu-usuario/vip-connect
- **Root Directory**: `.` (raiz)
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Port**: `8080` (ou deixe vazio para static)

**Variáveis de Ambiente:**
```env
VITE_API_URL=https://api.vip-connect.seudominio.com/api
VITE_NODE_ENV=production
```

**Domínio:** `vip-connect.seudominio.com`

### 4. Deploy Automático

- ✅ Habilitar "Auto Deploy" em ambas aplicações
- ✅ Selecionar branch `main` ou `master`
- ✅ Push para GitHub = Deploy automático

## ✅ Verificação

```bash
# Backend
curl https://api.vip-connect.seudominio.com/health

# Frontend
# Acesse https://vip-connect.seudominio.com no navegador
```

## 🔧 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Backend não conecta ao banco | Verificar `DATABASE_HOST` (deve ser o nome do serviço PostgreSQL) |
| CORS Error | Verificar `CORS_ORIGIN` no backend (deve ser a URL do frontend) |
| Variáveis não funcionam | Frontend: usar prefixo `VITE_` e fazer rebuild |
| Build falha | Verificar logs, Node.js 20+, dependências instaladas |

---

📚 **Documentação completa**: Veja `COOLIFY_DEPLOY.md` para detalhes.

