# 🎯 Passo a Passo Final - O Que Fazer Agora

Você já configurou o Backend no Coolify! Agora siga estes passos:

## ✅ O Que Já Foi Feito

- ✅ Coolify instalado
- ✅ PostgreSQL rodando
- ✅ Backend configurado no Coolify

## 📋 O Que Falta Fazer (Em Ordem)

### PASSO 1: Verificar se o Banco de Dados Está Pronto

Execute na VPS:

```bash
# Verificar se banco existe
docker exec -it vip-connect-db psql -U postgres -l | grep vip_connect

# Se não existir, criar:
docker exec -it vip-connect-db psql -U postgres -c "CREATE DATABASE vip_connect;"
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";"

# Baixar e executar schema
curl -o /tmp/schema.sql https://raw.githubusercontent.com/esamwell/vip-connect/main/database/schema.sql
docker exec -i vip-connect-db psql -U postgres -d vip_connect < /tmp/schema.sql
```

### PASSO 2: Verificar Variáveis de Ambiente do Backend

No Coolify, vá até sua aplicação Backend e verifique se tem estas variáveis:

```
DATABASE_HOST=vip-connect-db
DATABASE_PORT=5432
DATABASE_NAME=vip_connect
DATABASE_USER=postgres
DATABASE_PASSWORD=1923731sS$
JWT_SECRET=[qualquer_string_aleatória_32+_caracteres]
CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
NODE_ENV=production
PORT=3000
```

**Se não tiver o JWT_SECRET**, gere um:
```bash
openssl rand -base64 48 | tr -d "=+/" | cut -c1-48
```

### PASSO 3: Fazer Deploy do Backend

No Coolify:
1. Vá até sua aplicação Backend
2. Clique em **"Deploy"** ou **"Redeploy"**
3. Aguarde o build e deploy completar
4. Verifique os logs para ver se conectou ao banco

### PASSO 4: Verificar se Backend Está Funcionando

```bash
# Verificar health check (se o domínio estiver configurado)
curl http://84.46.241.73:3000/health

# Ou verificar logs no Coolify
# Vá em sua aplicação → Logs
```

### PASSO 5: Configurar Frontend

1. No Coolify, clique em **"New Resource"** → **"Public Repository"**
2. Configure:
   - **Repository**: `https://github.com/esamwell/vip-connect`
   - **Branch**: `main`
   - **Base Directory**: `.` (ponto, raiz do projeto)
   - **Port**: `8080` ou deixe vazio
   - **Is it a static site?**: Marque se tiver essa opção
3. **Variáveis de Ambiente**:
   ```
   VITE_API_URL=https://api.asibeneficios.autoshoppingitapoan.com.br/api
   VITE_NODE_ENV=production
   ```
4. **Domínio**: `asibeneficios.autoshoppingitapoan.com.br`
5. Clique em **"Deploy"**

### PASSO 6: Configurar DNS no Cloudflare

1. Acesse: https://dash.cloudflare.com
2. Selecione o domínio: `autoshoppingitapoan.com.br`
3. Vá em **DNS** → **Records**
4. Adicione dois registros:

   **Frontend:**
   - Tipo: `A`
   - Nome: `asibeneficios`
   - Conteúdo: `84.46.241.73`
   - Proxy: Desativado (nuvem cinza)

   **Backend:**
   - Tipo: `A`
   - Nome: `api.asibeneficios`
   - Conteúdo: `84.46.241.73`
   - Proxy: Desativado (nuvem cinza)

5. Aguarde 1-5 minutos para propagação

### PASSO 7: Configurar SSL no Coolify

Após DNS propagado:

1. No Coolify, vá até sua aplicação **Backend**
2. Vá em **Settings** → **Domains**
3. Adicione: `api.asibeneficios.autoshoppingitapoan.com.br`
4. Habilite **Let's Encrypt SSL**
5. Repita para o **Frontend**: `asibeneficios.autoshoppingitapoan.com.br`

### PASSO 8: Atualizar CORS do Backend

Após SSL configurado, atualize a variável:

```
CORS_ORIGIN=https://asibeneficios.autoshoppingitapoan.com.br
```

E faça redeploy do Backend.

## 🔍 Verificação Final

### Backend:
```bash
curl https://api.asibeneficios.autoshoppingitapoan.com.br/health
```

### Frontend:
Acesse no navegador: `https://asibeneficios.autoshoppingitapoan.com.br`

## 🆘 Problemas Comuns

### Backend não conecta ao banco:
- Verifique se `DATABASE_HOST=vip-connect-db` está correto
- Verifique se o PostgreSQL está rodando: `docker ps | grep vip-connect-db`
- Verifique logs do Backend no Coolify

### Frontend não carrega:
- Verifique se o build foi concluído
- Verifique se `VITE_API_URL` está correto
- Limpe cache do navegador

### SSL não funciona:
- Verifique se DNS está propagado: `nslookup api.asibeneficios.autoshoppingitapoan.com.br`
- Certifique-se de que proxy Cloudflare está desativado durante validação

## 📞 Checklist Rápido

- [ ] Banco `vip_connect` criado e schema executado
- [ ] Variáveis de ambiente do Backend configuradas
- [ ] Backend deployado e funcionando
- [ ] Frontend configurado e deployado
- [ ] DNS configurado no Cloudflare
- [ ] SSL configurado no Coolify
- [ ] Tudo funcionando!

---

**Você está quase lá!** Siga os passos acima na ordem. Se tiver dúvida em algum passo, me avise!

