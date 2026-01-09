# 🔧 Corrigir Acesso ao PostgreSQL Externo

## ❌ Problema

Erro: "password authentication failed for user 'postgres'"

Isso geralmente significa que o PostgreSQL não está configurado para aceitar conexões externas.

## 🔍 Verificar Status Atual

Execute na VPS:

```bash
# Verificar se container está rodando
docker ps | grep vip-connect-db

# Verificar se porta está exposta
docker port vip-connect-db

# Verificar configuração do PostgreSQL
docker exec vip-connect-db cat /var/lib/postgresql/data/pg_hba.conf | grep -v "^#"
```

## 🔧 Solução: Configurar PostgreSQL para Aceitar Conexões Externas

### Opção 1: Recriar Container com Configuração Correta (Recomendado)

Execute na VPS:

```bash
# Parar e remover container atual
docker stop vip-connect-db
docker rm vip-connect-db

# Recriar com configuração para aceitar conexões externas
docker run -d \
  --name vip-connect-db \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=1923731sS$ \
  -e POSTGRES_DB=vip_connect \
  -p 5432:5432 \
  -v vip-connect-db-data:/var/lib/postgresql/data \
  --network coolify \
  postgres:16-alpine \
  -c listen_addresses='*' \
  -c max_connections=200
```

### Opção 2: Configurar pg_hba.conf do Container Existente

Execute na VPS:

```bash
# Entrar no container
docker exec -it vip-connect-db sh

# Dentro do container, editar pg_hba.conf
echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf

# Reiniciar container
exit
docker restart vip-connect-db
```

### Opção 3: Usar Túnel SSH (Mais Seguro)

Em vez de expor a porta publicamente, use túnel SSH:

**No seu computador local:**

```bash
ssh -L 5432:localhost:5432 root@84.46.241.73
```

**No Beekeeper, use:**
```
Host: localhost
Port: 5432
Database: vip_connect
User: postgres
Password: 1923731sS$
```

## 🔒 Verificar Firewall

Se ainda não funcionar, verifique o firewall na VPS:

```bash
# Verificar se porta 5432 está aberta
sudo ufw status
sudo ufw allow 5432/tcp

# Ou se usar firewalld
sudo firewall-cmd --list-ports
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

## ✅ Testar Conexão

Após configurar, teste:

```bash
# Da VPS
docker exec -it vip-connect-db psql -U postgres -d vip_connect -c "SELECT version();"

# Do seu computador (se porta estiver exposta)
psql -h 84.46.241.73 -p 5432 -U postgres -d vip_connect
```

## 📋 Configuração Final no Beekeeper

Após corrigir:

```
Host: 84.46.241.73
Port: 5432
Database: vip_connect
User: postgres
Password: 1923731sS$
SSL Mode: prefer (ou disable)
```

---

**Execute a Opção 1 na VPS para recriar o container com a configuração correta!**

