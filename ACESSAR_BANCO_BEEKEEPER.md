# 🗄️ Como Acessar o Banco de Dados no Beekeeper Studio

## 📋 Informações de Conexão

### Configuração Básica

**Tipo de Conexão:** PostgreSQL

**Host:** `84.46.241.73` (IP da VPS)

**Porta:** `5432`

**Database:** `vip_connect`

**Usuário:** `postgres`

**Senha:** `1923731sS$`

**SSL Mode:** `prefer` ou `disable` (dependendo da configuração)

## 🔧 Configuração no Beekeeper Studio

### Passo a Passo

1. Abra o Beekeeper Studio
2. Clique em **"New Connection"** ou **"Nova Conexão"**
3. Selecione **PostgreSQL**
4. Preencha os campos:

   ```
   Connection Name: VIP Connect Production
   Host: 84.46.241.73
   Port: 5432
   Database: vip_connect
   User: postgres
   Password: 1923731sS$
   SSL Mode: prefer (ou disable)
   ```

5. Clique em **"Test Connection"** para testar
6. Se funcionar, clique em **"Save"** e **"Connect"**

## ⚠️ IMPORTANTE: Verificar se Porta Está Exposta

O PostgreSQL pode não estar exposto externamente. Verifique na VPS:

```bash
# Verificar se a porta 5432 está exposta
docker ps | grep vip-connect-db

# Verificar portas expostas
docker port vip-connect-db
```

### Se a Porta NÃO Estiver Exposta

Você precisa expor a porta do PostgreSQL:

```bash
# Parar o container atual
docker stop vip-connect-db

# Recriar com porta exposta
docker run -d \
  --name vip-connect-db \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=1923731sS$ \
  -e POSTGRES_DB=vip_connect \
  -p 5432:5432 \
  -v vip-connect-db-data:/var/lib/postgresql/data \
  postgres:16-alpine
```

**⚠️ ATENÇÃO:** Expor a porta 5432 publicamente é um risco de segurança! Considere usar um túnel SSH ou VPN.

## 🔒 Alternativa Segura: Túnel SSH

### Opção 1: SSH Tunnel (Recomendado)

1. Configure um túnel SSH:
   ```bash
   ssh -L 5432:localhost:5432 root@84.46.241.73
   ```

2. No Beekeeper, use:
   ```
   Host: localhost
   Port: 5432
   Database: vip_connect
   User: postgres
   Password: 1923731sS$
   ```

### Opção 2: Usar pgAdmin via Docker

Na VPS, você pode rodar pgAdmin:

```bash
docker run -d \
  --name pgadmin \
  -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  --network coolify \
  dpage/pgadmin4
```

Acesse: `http://84.46.241.73:5050`

## 📝 String de Conexão Completa

### Para Beekeeper Studio:

```
postgresql://postgres:1923731sS$@84.46.241.73:5432/vip_connect
```

### Para psql (linha de comando):

```bash
psql -h 84.46.241.73 -p 5432 -U postgres -d vip_connect
```

## 🔍 Verificar Conexão

### Teste Rápido na VPS:

```bash
# Testar conexão local
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "SELECT version();"
```

### Teste Remoto (se porta estiver exposta):

```bash
# Do seu computador local
psql -h 84.46.241.73 -p 5432 -U postgres -d vip_connect
```

## 🆘 Troubleshooting

### Erro: "Connection refused"
- A porta 5432 não está exposta externamente
- Use túnel SSH ou exponha a porta

### Erro: "Authentication failed"
- Verifique se a senha está correta: `1923731sS$`
- Verifique se o usuário está correto: `postgres`

### Erro: "Database does not exist"
- Verifique se o banco `vip_connect` foi criado
- Execute: `docker exec -it vip-connect-db psql -U postgres -l`

## 📋 Resumo Rápido

**Beekeeper Studio:**
```
Host: 84.46.241.73
Port: 5432
Database: vip_connect
User: postgres
Password: 1923731sS$
```

**String de Conexão:**
```
postgresql://postgres:1923731sS$@84.46.241.73:5432/vip_connect
```

---

**⚠️ LEMBRE-SE:** Se a porta não estiver exposta, você precisará expor ou usar túnel SSH!

