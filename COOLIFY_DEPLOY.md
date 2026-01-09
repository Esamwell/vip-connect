# 🚀 Guia de Instalação VIP Connect no Coolify

Este guia detalha como instalar e configurar o sistema VIP Connect em uma VPS utilizando o Coolify, com integração ao GitHub para deploy automático.

## ⚡ Instalação Automatizada

**Quer automatizar tudo?** Use nosso script de instalação:

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/vip-connect/main/scripts/install-coolify-vip-connect.sh | bash
```

Ou veja [`scripts/README_INSTALL.md`](scripts/README_INSTALL.md) para mais detalhes.

---

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Instalação do Coolify](#-instalação-do-coolify)
- [Configuração do PostgreSQL](#-configuração-do-postgresql)
- [Configuração do Backend](#-configuração-do-backend)
- [Configuração do Frontend](#-configuração-do-frontend)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Deploy Automático via GitHub](#-deploy-automático-via-github)
- [Verificação e Testes](#-verificação-e-testes)
- [Troubleshooting](#-troubleshooting)

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Uma VPS com Ubuntu 22.04 LTS ou superior
- ✅ Acesso root ou sudo à VPS
- ✅ Domínio configurado apontando para o IP da VPS (opcional, mas recomendado)
- ✅ Repositório GitHub do projeto VIP Connect
- ✅ Portas abertas no firewall:
  - `80` (HTTP)
  - `443` (HTTPS)
  - `8000` (Coolify - opcional, pode ser alterado)

---

## 🎯 Instalação do Coolify

### 1. Conectar-se à VPS

```bash
ssh root@seu-ip-vps
```

### 2. Instalar o Coolify

Execute o comando de instalação oficial do Coolify:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Ou se preferir instalar manualmente:

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker (se não estiver instalado)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 3. Acessar o Coolify

Após a instalação, acesse o Coolify através do navegador:

```
http://seu-ip-vps:8000
```

Ou se configurou um domínio:

```
https://coolify.seudominio.com
```

### 4. Configuração Inicial

1. **Criar conta de administrador** no primeiro acesso
2. **Configurar domínio** (se tiver) nas configurações do Coolify
3. **Configurar SSL** usando Let's Encrypt (recomendado)

---

## 🗄️ Configuração do PostgreSQL

### Opção 1: PostgreSQL via Coolify (Recomendado)

1. **Criar novo recurso** no Coolify:
   - Clique em **"New Resource"** → **"Database"** → **"PostgreSQL"**

2. **Configurar PostgreSQL**:
   - **Nome**: `vip-connect-db`
   - **Versão**: `15` ou superior
   - **Senha**: Defina uma senha forte (anote para usar depois)
   - **Volume**: Criar volume persistente para dados

3. **Aguardar criação** do banco de dados

4. **Obter informações de conexão**:
   - Host interno: `vip-connect-db` (nome do serviço)
   - Porta: `5432`
   - Usuário: `postgres` (padrão)
   - Senha: A senha que você definiu
   - Database: `postgres` (padrão)

### Opção 2: PostgreSQL Externo

Se preferir usar um PostgreSQL externo (ex: AWS RDS, DigitalOcean Managed Database):

1. Configure as credenciais de acesso
2. Anote as informações de conexão para usar nas variáveis de ambiente

### 3. Criar o Banco de Dados

Após o PostgreSQL estar rodando, você precisa criar o banco `vip_connect` e executar o schema.

#### Via Coolify (Terminal do Container)

1. No Coolify, vá até o recurso PostgreSQL criado
2. Clique em **"Terminal"** ou **"Execute Command"**
3. Execute:

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE vip_connect;

# Criar extensões necessárias
\c vip_connect
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

# Sair do psql
\q
```

#### Via Script SQL (Recomendado)

1. No Coolify, vá até o recurso PostgreSQL
2. Clique em **"Execute Command"**
3. Execute o schema SQL:

```bash
# Copiar o schema.sql para o container
# Primeiro, você precisa fazer upload do arquivo ou usar git

# Opção 1: Via git clone (se o repositório for público)
git clone https://github.com/seu-usuario/vip-connect.git /tmp/vip-connect
psql -U postgres -d vip_connect -f /tmp/vip-connect/database/schema.sql

# Opção 2: Via curl (se o arquivo estiver acessível)
curl -o /tmp/schema.sql https://raw.githubusercontent.com/seu-usuario/vip-connect/main/database/schema.sql
psql -U postgres -d vip_connect -f /tmp/schema.sql
```

---

## 🔧 Configuração do Backend

### 1. Criar Nova Aplicação

1. No Coolify, clique em **"New Resource"** → **"Application"**
2. Selecione **"GitHub"** como fonte

### 2. Conectar ao GitHub

1. **Autorizar Coolify no GitHub**:
   - Clique em **"Connect GitHub"**
   - Autorize o acesso ao repositório
   - Selecione o repositório `vip-connect`

2. **Configurar Branch**:
   - Branch: `main` ou `master`
   - Build Pack: **"Dockerfile"** ou **"Nixpacks"** (recomendado Nixpacks)

### 3. Configurar Build do Backend

Como o backend está na pasta `server/`, você precisa configurar:

1. **Root Directory**: `server`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Port**: `3000`

### 4. Criar Dockerfile para o Backend (Opcional)

Se preferir usar Dockerfile, crie `server/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte compilado (ou compilar aqui)
COPY . .

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
```

### 5. Configurar Variáveis de Ambiente do Backend

No Coolify, vá em **"Environment Variables"** e adicione:

```env
# Banco de Dados
DATABASE_HOST=vip-connect-db
DATABASE_PORT=5432
DATABASE_NAME=vip_connect
DATABASE_USER=postgres
DATABASE_PASSWORD=sua_senha_postgres_aqui

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_altere_em_producao_minimo_32_caracteres

# CORS (será configurado após criar o frontend)
CORS_ORIGIN=https://vip-connect.seudominio.com

# Ambiente
NODE_ENV=production
PORT=3000

# MT Leads (opcional)
MT_LEADS_WEBHOOK_URL=https://seu-webhook-url.com
MT_LEADS_API_TOKEN=seu_token_aqui
```

**⚠️ IMPORTANTE**: 
- Substitua `sua_senha_postgres_aqui` pela senha real do PostgreSQL
- Gere um `JWT_SECRET` seguro (mínimo 32 caracteres)
- O `CORS_ORIGIN` será atualizado após configurar o frontend

### 6. Configurar Domínio e SSL

1. **Domínio**: Configure o domínio do backend (ex: `api.vip-connect.seudominio.com`)
2. **SSL**: Habilite SSL automático com Let's Encrypt
3. **Porta**: Configure para usar porta 80/443

---

## 🎨 Configuração do Frontend

### 1. Criar Nova Aplicação

1. No Coolify, clique em **"New Resource"** → **"Application"**
2. Selecione **"GitHub"** como fonte
3. Selecione o mesmo repositório `vip-connect`

### 2. Configurar Build do Frontend

1. **Root Directory**: `.` (raiz do projeto)
2. **Build Pack**: **"Nixpacks"** (recomendado) ou **"Static Site"**
3. **Build Command**: `npm install && npm run build`
4. **Output Directory**: `dist`
5. **Port**: `8080` (ou deixe vazio para static site)

### 3. Criar Dockerfile para o Frontend (Opcional)

Se preferir usar Dockerfile, crie `Dockerfile` na raiz:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Servir com nginx
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Configurar Variáveis de Ambiente do Frontend

No Coolify, vá em **"Environment Variables"** e adicione:

```env
# API Backend (URL do backend configurado anteriormente)
VITE_API_URL=https://api.vip-connect.seudominio.com/api

# Ambiente
VITE_NODE_ENV=production
```

**⚠️ IMPORTANTE**: 
- Substitua `https://api.vip-connect.seudominio.com/api` pela URL real do seu backend
- No Vite, todas as variáveis devem começar com `VITE_`

### 5. Configurar Domínio e SSL

1. **Domínio**: Configure o domínio do frontend (ex: `vip-connect.seudominio.com`)
2. **SSL**: Habilite SSL automático com Let's Encrypt
3. **Porta**: Configure para usar porta 80/443

### 6. Atualizar CORS do Backend

Após configurar o frontend, atualize a variável `CORS_ORIGIN` do backend:

```env
CORS_ORIGIN=https://vip-connect.seudominio.com
```

---

## 🔄 Deploy Automático via GitHub

### 1. Configurar Webhook no GitHub

O Coolify cria automaticamente um webhook quando você conecta o repositório. Verifique:

1. No GitHub, vá em **Settings** → **Webhooks**
2. Deve haver um webhook do Coolify configurado
3. Se não houver, o Coolify criará automaticamente no próximo push

### 2. Configurar Auto-Deploy

No Coolify, para cada aplicação (backend e frontend):

1. Vá em **"Settings"** da aplicação
2. Habilite **"Auto Deploy"**
3. Selecione a branch (geralmente `main` ou `master`)
4. Configure **"Deploy on Push"** para fazer deploy automático a cada push

### 3. Testar Deploy Automático

1. Faça uma pequena alteração no código
2. Commit e push para o GitHub:
   ```bash
   git add .
   git commit -m "test: deploy automático"
   git push origin main
   ```
3. O Coolify deve detectar o push e iniciar o deploy automaticamente

### 4. Monitorar Deploy

No Coolify, você pode:
- Ver logs em tempo real durante o build
- Ver histórico de deploys
- Reverter para versões anteriores se necessário

---

## ✅ Verificação e Testes

### 1. Verificar Backend

```bash
# Health check
curl https://api.vip-connect.seudominio.com/health

# Deve retornar:
# {"status":"ok","timestamp":"...","environment":"production"}
```

### 2. Verificar Frontend

1. Acesse `https://vip-connect.seudominio.com` no navegador
2. A aplicação deve carregar normalmente
3. Teste o login com um usuário de teste

### 3. Verificar Conexão com Banco

No backend, verifique os logs no Coolify. Deve aparecer:

```
✅ Conectado ao banco de dados PostgreSQL
```

### 4. Testar API

```bash
# Teste de login
curl -X POST https://api.vip-connect.seudominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autoshopping.com","password":"sua_senha"}'
```

---

## 🔧 Troubleshooting

### Problema: Backend não conecta ao banco

**Solução**:
1. Verifique se o PostgreSQL está rodando no Coolify
2. Verifique as variáveis de ambiente `DATABASE_HOST`, `DATABASE_PORT`, etc.
3. Se o PostgreSQL estiver em outro serviço, use o nome do serviço como host
4. Verifique os logs do backend no Coolify

### Problema: Frontend não carrega

**Solução**:
1. Verifique se o build foi concluído com sucesso
2. Verifique se a variável `VITE_API_URL` está configurada corretamente
3. Verifique os logs do frontend no Coolify
4. Limpe o cache do navegador

### Problema: CORS Error

**Solução**:
1. Verifique se `CORS_ORIGIN` no backend inclui a URL do frontend
2. Certifique-se de que ambas as URLs usam HTTPS (ou ambas HTTP)
3. Verifique se não há barra `/` no final da URL no `CORS_ORIGIN`

### Problema: Deploy automático não funciona

**Solução**:
1. Verifique se o webhook está configurado no GitHub
2. Verifique se o "Auto Deploy" está habilitado no Coolify
3. Verifique os logs do webhook no GitHub (Settings → Webhooks)
4. Tente fazer um deploy manual primeiro

### Problema: Build falha

**Solução**:
1. Verifique os logs de build no Coolify
2. Certifique-se de que todas as dependências estão no `package.json`
3. Verifique se o Node.js versão está correta (20+)
4. Verifique se o "Root Directory" está correto

### Problema: Variáveis de ambiente não funcionam

**Solução**:
1. No frontend, certifique-se de que as variáveis começam com `VITE_`
2. Após alterar variáveis, faça um novo deploy
3. No Vite, variáveis são injetadas no build, então é necessário rebuild

---

## 📝 Checklist Final

Antes de considerar a instalação completa, verifique:

- [ ] Coolify instalado e acessível
- [ ] PostgreSQL criado e rodando
- [ ] Banco `vip_connect` criado
- [ ] Schema SQL executado com sucesso
- [ ] Backend configurado e rodando
- [ ] Frontend configurado e rodando
- [ ] SSL configurado para ambos (HTTPS)
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado corretamente
- [ ] Deploy automático funcionando
- [ ] Health check do backend respondendo
- [ ] Frontend carregando corretamente
- [ ] Login funcionando
- [ ] Conexão com banco de dados funcionando

---

## 🔒 Segurança

### Recomendações Importantes

1. **Altere todas as senhas padrão**:
   - Senha do PostgreSQL
   - Senha dos usuários admin do sistema
   - JWT_SECRET

2. **Use HTTPS sempre**:
   - Configure SSL/Let's Encrypt no Coolify
   - Force HTTPS nas configurações

3. **Configure Firewall**:
   - Bloqueie portas desnecessárias
   - Permita apenas 80, 443 e 22 (SSH)

4. **Backups Regulares**:
   - Configure backups automáticos do PostgreSQL
   - Faça backup do volume do banco de dados

5. **Monitoramento**:
   - Configure alertas no Coolify
   - Monitore logs regularmente

---

## 📚 Recursos Adicionais

- [Documentação do Coolify](https://coolify.io/docs)
- [Documentação do PostgreSQL](https://www.postgresql.org/docs/)
- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do Express](https://expressjs.com/)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Coolify
2. Consulte a seção de Troubleshooting acima
3. Verifique a documentação do projeto em `README.md`
4. Entre em contato com a equipe de desenvolvimento

---

**Versão**: 1.0.0  
**Última atualização**: 2025

