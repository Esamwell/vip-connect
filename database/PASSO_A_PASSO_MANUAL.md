# 🔧 Passo a Passo Manual - Resetar Senha PostgreSQL

## ⚠️ IMPORTANTE: Execute os comandos como Administrador!

## 📋 Passo 1: Parar o Serviço PostgreSQL

Abra o PowerShell **como Administrador** e execute:

```powershell
Stop-Service postgresql-x64-17
```

## 📋 Passo 2: Editar o arquivo pg_hba.conf

1. **Localize o arquivo:**
   ```
   C:\Program Files\PostgreSQL\17\data\pg_hba.conf
   ```

2. **Abra como Administrador:**
   - Clique com botão direito no arquivo
   - Selecione **"Editar com Notepad"** ou **"Abrir com"** → **Notepad**
   - Se pedir permissão de administrador, confirme

3. **Encontre as linhas no final do arquivo** que começam com `host` ou `local`

4. **Altere `scram-sha-256` ou `md5` para `trust`:**

   **ANTES:**
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   local   all             all                                     scram-sha-256
   ```

   **DEPOIS:**
   ```
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   local   all             all                                     trust
   ```

5. **Salve o arquivo**

## 📋 Passo 3: Iniciar o Serviço PostgreSQL

No PowerShell (como Administrador):

```powershell
Start-Service postgresql-x64-17
```

## 📋 Passo 4: Conectar sem Senha

Agora abra um **novo PowerShell** (não precisa ser admin) e execute:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5433 -d postgres
```

Agora você deve conseguir conectar **sem senha**!

## 📋 Passo 5: Alterar a Senha do postgres

Dentro do psql, execute:

```sql
ALTER USER postgres WITH PASSWORD 'sua_nova_senha_aqui';
```

**Exemplo:**
```sql
ALTER USER postgres WITH PASSWORD 'Postgres123!';
```

## 📋 Passo 6: Criar o Usuário clientvipasi

Ainda no psql, execute:

```sql
CREATE USER clientvipasi WITH PASSWORD '1923731sS$';
ALTER USER clientvipasi CREATEDB;
```

## 📋 Passo 7: Verificar se foi criado

```sql
\du
```

Você deve ver `clientvipasi` na lista.

## 📋 Passo 8: Sair do psql

```sql
\q
```

## 📋 Passo 9: REVERTER a Segurança (MUITO IMPORTANTE!)

⚠️ **NUNCA deixe o PostgreSQL em modo `trust`!**

1. **Pare o serviço novamente** (PowerShell como Admin):
   ```powershell
   Stop-Service postgresql-x64-17
   ```

2. **Edite o pg_hba.conf novamente** e **volte para `scram-sha-256`:**

   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   local   all             all                                     scram-sha-256
   ```

3. **Salve o arquivo**

4. **Inicie o serviço:**
   ```powershell
   Start-Service postgresql-x64-17
   ```

## ✅ Testar no Beekeeper

Agora teste as conexões:

### Conexão "PostgreSQL Admin":
- Host: `localhost`
- Port: `5433`
- User: `postgres`
- Password: `sua_nova_senha_aqui` (a que você definiu)

### Conexão "VIP Connect":
- Host: `localhost`
- Port: `5433`
- User: `clientvipasi`
- Password: `1923731sS$`

---

**Pronto!** Agora você pode criar o banco de dados e executar o schema! 🎉

