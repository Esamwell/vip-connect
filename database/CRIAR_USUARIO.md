# 🔐 Criar Usuário clientvipasi no PostgreSQL

## ❌ Problema Atual

Erro: **"autenticação do tipo senha falhou para o usuário 'clientvipasi'"**

Isso significa que o usuário `clientvipasi` não existe no PostgreSQL ou a senha está incorreta.

## ✅ Solução: Criar o Usuário

### Opção 1: Conectar como postgres no Beekeeper (Recomendado)

1. **No Beekeeper, crie uma NOVA conexão:**
   - **Name**: "PostgreSQL Admin"
   - **Host**: `localhost`
   - **Port**: `5433`
   - **User**: `postgres`
   - **Password**: (sua senha do postgres - a que você configurou na instalação)
   - **Default Database**: `postgres`
   - Clique em **"Connect"**

2. **Depois de conectar, abra uma nova query e execute:**

```sql
-- Criar o usuário clientvipasi
CREATE USER clientvipasi WITH PASSWORD '1923731sS$';

-- Dar permissões necessárias
ALTER USER clientvipasi CREATEDB;

-- Ou se preferir dar todas as permissões (apenas para desenvolvimento)
-- ALTER USER clientvipasi WITH SUPERUSER;
```

3. **Verificar se foi criado:**

```sql
-- Listar todos os usuários
\du
```

Você deve ver `clientvipasi` na lista.

4. **Agora teste a conexão "VIP Connect" novamente no Beekeeper**

### Opção 2: Se não souber a senha do postgres

Se você não souber ou não tiver acesso ao usuário `postgres`, você pode:

#### A) Resetar a senha do postgres (Windows)

1. **Pare o serviço PostgreSQL:**
```powershell
Stop-Service postgresql-x64-17
```

2. **Edite o arquivo pg_hba.conf:**
   - Localização: `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
   - Encontre a linha que começa com `host` ou `local`
   - Mude `md5` ou `scram-sha-256` para `trust` temporariamente:
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   host    all             all             127.0.0.1/32            trust
   ```

3. **Inicie o serviço:**
```powershell
Start-Service postgresql-x64-17
```

4. **Conecte sem senha e altere:**
```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5433 -d postgres
```

Depois execute:
```sql
ALTER USER postgres WITH PASSWORD 'sua_nova_senha';
```

5. **Reverta o pg_hba.conf** (volte para `md5` ou `scram-sha-256`)

6. **Reinicie o serviço**

#### B) Usar pgAdmin (se tiver instalado)

1. Abra o pgAdmin
2. Conecte ao servidor PostgreSQL
3. Vá em: **Login/Group Roles** → Botão direito → **Create** → **Login/Group Role**
4. Preencha:
   - **Name**: `clientvipasi`
   - **Definition** → **Password**: `1923731sS$`
   - **Privileges** → Marque **"Can login?"** e **"Create databases"**
5. Salve

## 🧪 Teste Final

Depois de criar o usuário, teste a conexão "VIP Connect" no Beekeeper:

```
Host: localhost
Port: 5433
User: clientvipasi
Password: 1923731sS$
Default Database: (vazio ou postgres)
```

## 📝 Comandos SQL Úteis

### Ver todos os usuários:
```sql
\du
```

### Ver detalhes de um usuário específico:
```sql
SELECT * FROM pg_user WHERE usename = 'clientvipasi';
```

### Alterar senha de um usuário:
```sql
ALTER USER clientvipasi WITH PASSWORD 'nova_senha_aqui';
```

### Dar permissões específicas:
```sql
-- Permitir criar bancos
ALTER USER clientvipasi CREATEDB;

-- Dar todas as permissões (cuidado em produção!)
ALTER USER clientvipasi WITH SUPERUSER;
```

### Remover um usuário (se necessário):
```sql
DROP USER clientvipasi;
```

---

**Dica:** Se você não souber a senha do `postgres`, tente a senha padrão que você configurou durante a instalação do PostgreSQL, ou use a Opção 2 para resetar.

