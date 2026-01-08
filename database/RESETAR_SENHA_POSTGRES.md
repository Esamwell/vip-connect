# 🔑 Resetar Senha do PostgreSQL no Windows

## 📋 Passo a Passo Completo

### 1. Parar o Serviço PostgreSQL

Abra o PowerShell como **Administrador** e execute:

```powershell
Stop-Service postgresql-x64-17
```

Ou pelo Gerenciador de Serviços:
- Pressione `Win + R`
- Digite `services.msc`
- Procure por "postgresql-x64-17"
- Clique com botão direito → **Parar**

### 2. Localizar o arquivo pg_hba.conf

O arquivo está normalmente em:
```
C:\Program Files\PostgreSQL\17\data\pg_hba.conf
```

### 3. Editar o pg_hba.conf

1. **Faça backup do arquivo** (copie para outro lugar)

2. **Abra o arquivo como Administrador:**
   - Clique com botão direito no arquivo
   - Selecione **"Editar com Notepad++"** ou **"Abrir com"** → **Notepad**
   - Se pedir permissão de administrador, confirme

3. **Encontre as linhas que começam com `host` ou `local`** (geralmente no final do arquivo)

4. **Temporariamente, altere o método de autenticação para `trust`:**

   **ANTES (exemplo):**
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   local   all             all                                     scram-sha-256
   ```

   **DEPOIS (mude para trust):**
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   local   all             all                                     trust
   ```

   ⚠️ **IMPORTANTE**: Isso permite conexão sem senha temporariamente. Vamos reverter depois!

5. **Salve o arquivo**

### 4. Iniciar o Serviço PostgreSQL

No PowerShell (como Administrador):

```powershell
Start-Service postgresql-x64-17
```

Ou pelo Gerenciador de Serviços → **Iniciar**

### 5. Conectar sem Senha e Alterar a Senha

No PowerShell (não precisa ser admin agora):

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5433 -d postgres
```

Agora você deve conseguir conectar sem senha!

### 6. Alterar a Senha do postgres

Dentro do psql, execute:

```sql
ALTER USER postgres WITH PASSWORD 'sua_nova_senha_aqui';
```

**Exemplo:**
```sql
ALTER USER postgres WITH PASSWORD 'Postgres123!';
```

### 7. Criar o Usuário clientvipasi

Ainda no psql, execute:

```sql
-- Criar o usuário clientvipasi
CREATE USER clientvipasi WITH PASSWORD '1923731sS$';

-- Dar permissões
ALTER USER clientvipasi CREATEDB;
```

### 8. Sair do psql

```sql
\q
```

### 9. REVERTER o pg_hba.conf (MUITO IMPORTANTE!)

1. **Abra o arquivo pg_hba.conf novamente como Administrador**

2. **Volte o método de autenticação para `scram-sha-256` ou `md5`:**

   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   local   all             all                                     scram-sha-256
   ```

3. **Salve o arquivo**

### 10. Reiniciar o Serviço PostgreSQL

```powershell
Restart-Service postgresql-x64-17
```

## ✅ Testar a Conexão

Agora teste no Beekeeper:

### Conexão "PostgreSQL Admin":
- Host: `localhost`
- Port: `5433`
- User: `postgres`
- Password: `sua_nova_senha_aqui` (a que você definiu no passo 6)

### Conexão "VIP Connect":
- Host: `localhost`
- Port: `5433`
- User: `clientvipasi`
- Password: `1923731sS$`

## 🔒 Segurança

⚠️ **IMPORTANTE**: 
- O método `trust` permite conexão sem senha
- **SEMPRE reverta para `scram-sha-256` ou `md5` após resetar a senha**
- Não deixe o PostgreSQL rodando com `trust` em produção

## 🆘 Problemas Comuns

### Erro: "Acesso negado" ao editar pg_hba.conf
- **Solução**: Abra o Notepad como Administrador primeiro, depois abra o arquivo

### Erro: "Serviço não pode ser parado"
- **Solução**: Execute o PowerShell como Administrador

### Erro: "Arquivo não encontrado"
- **Solução**: Verifique o caminho. Pode estar em:
  - `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
  - Ou em outro local se você instalou em outro lugar

### Não consegue conectar mesmo com trust
- **Solução**: Verifique se o serviço está rodando e se a porta está correta (5433)

## 📝 Script PowerShell Completo (Automático)

Se preferir, você pode usar este script (execute como Administrador):

```powershell
# Parar serviço
Stop-Service postgresql-x64-17

# Caminho do pg_hba.conf
$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"

# Fazer backup
Copy-Item $pgHbaPath "$pgHbaPath.backup"

# Substituir scram-sha-256 por trust (temporariamente)
(Get-Content $pgHbaPath) -replace 'scram-sha-256', 'trust' -replace 'md5', 'trust' | Set-Content $pgHbaPath

# Iniciar serviço
Start-Service postgresql-x64-17

Write-Host "Serviço iniciado. Agora conecte e altere a senha:"
Write-Host "psql -U postgres -h localhost -p 5433 -d postgres"
Write-Host "ALTER USER postgres WITH PASSWORD 'sua_senha';"
Write-Host ""
Write-Host "Depois execute o script de reverter!"
```

**Script para REVERTER (execute depois de alterar a senha):**

```powershell
# Parar serviço
Stop-Service postgresql-x64-17

# Caminho do pg_hba.conf
$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"

# Reverter para scram-sha-256
(Get-Content $pgHbaPath) -replace 'trust', 'scram-sha-256' | Set-Content $pgHbaPath

# Iniciar serviço
Start-Service postgresql-x64-17

Write-Host "Senha resetada e segurança restaurada!"
```

---

**Pronto!** Agora você tem uma nova senha para o postgres e o usuário clientvipasi criado! 🎉

