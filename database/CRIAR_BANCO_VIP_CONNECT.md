# 🗄️ Criar Banco de Dados vip_connect

## ❌ Erro Atual

**"banco de dados 'clientvipasi' não existe"**

Isso acontece porque o campo "Default Database" está vazio, e o PostgreSQL tenta conectar ao banco com o mesmo nome do usuário.

## ✅ Solução Rápida

### Opção 1: Usar banco 'postgres' temporariamente

No Beekeeper, no campo **"Default Database"**, coloque:
```
postgres
```

Isso vai permitir conectar. Depois você cria o banco `vip_connect`.

### Opção 2: Criar o banco vip_connect primeiro

1. **Conecte como postgres** (use a conexão "PostgreSQL Admin"):
   - Host: `localhost`
   - Port: `5433`
   - User: `postgres`
   - Password: `Postgres123!`
   - Default Database: `postgres`

2. **Depois de conectar, execute:**
```sql
CREATE DATABASE vip_connect;
```

3. **Agora use a conexão "VIP Connect"** com:
   - Host: `localhost`
   - Port: `5433`
   - User: `clientvipasi`
   - Password: `1923731sS$`
   - Default Database: `vip_connect` ⬅️ Coloque aqui!

## 🚀 Criar Banco via PowerShell

Se preferir, você pode criar o banco pelo terminal:

```powershell
$env:PGPASSWORD="Postgres123!"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5433 -d postgres -c "CREATE DATABASE vip_connect;"
```

Depois verifique:
```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5433 -d postgres -c "\l"
```

Você deve ver `vip_connect` na lista de bancos.

## 📝 Configuração Final no Beekeeper

Depois de criar o banco, configure a conexão "VIP Connect":

```
Connection Type: Postgres
Host: localhost
Port: 5433
User: clientvipasi
Password: 1923731sS$
Default Database: vip_connect  ⬅️ IMPORTANTE!
```

Agora a conexão deve funcionar! 🎉

