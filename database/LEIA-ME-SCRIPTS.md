# 📜 Scripts PowerShell para PostgreSQL

Este diretório contém scripts PowerShell para facilitar a configuração do PostgreSQL.

## ⚠️ IMPORTANTE: Execute como Administrador!

Todos os scripts que modificam arquivos do PostgreSQL precisam ser executados **como Administrador**.

## 📋 Scripts Disponíveis

### 1. `resetar-senha-postgres.ps1`

**O que faz:**
- Para o serviço PostgreSQL
- Faz backup do `pg_hba.conf`
- Altera temporariamente a autenticação para `trust` (sem senha)
- Inicia o serviço

**Como usar:**
1. Clique com botão direito no arquivo
2. Selecione **"Executar com PowerShell"** (como Administrador)
3. Siga as instruções na tela

**Depois de executar:**
- Conecte ao PostgreSQL sem senha
- Altere a senha do postgres
- Crie o usuário clientvipasi
- Execute o script `reverter-seguranca-postgres.ps1`

---

### 2. `reverter-seguranca-postgres.ps1`

**O que faz:**
- Restaura a autenticação por senha no `pg_hba.conf`
- Volta a segurança do PostgreSQL ao normal

**Quando usar:**
- **APÓS** resetar a senha do postgres
- **APÓS** criar o usuário clientvipasi

**Como usar:**
1. Clique com botão direito no arquivo
2. Selecione **"Executar com PowerShell"** (como Administrador)
3. Confirme a operação

---

### 3. `criar-usuario-clientvipasi.ps1`

**O que faz:**
- Cria o usuário `clientvipasi` no PostgreSQL
- Define a senha: `1923731sS$`
- Dá permissões necessárias

**Quando usar:**
- **APÓS** resetar a senha do postgres
- Quando você já tem acesso ao postgres

**Como usar:**
1. Clique com botão direito no arquivo
2. Selecione **"Executar com PowerShell"**
3. Digite a senha do postgres quando solicitado

---

## 🚀 Fluxo Completo Recomendado

### Passo 1: Resetar Senha
```powershell
# Execute como Administrador
.\resetar-senha-postgres.ps1
```

### Passo 2: Conectar e Alterar Senha
Abra um novo PowerShell (não precisa ser admin) e execute:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5433 -d postgres
```

Dentro do psql:
```sql
ALTER USER postgres WITH PASSWORD 'sua_nova_senha_aqui';
\q
```

### Passo 3: Criar Usuário clientvipasi
```powershell
.\criar-usuario-clientvipasi.ps1
```

Ou manualmente no psql:
```sql
CREATE USER clientvipasi WITH PASSWORD '1923731sS$';
ALTER USER clientvipasi CREATEDB;
```

### Passo 4: Reverter Segurança
```powershell
# Execute como Administrador
.\reverter-seguranca-postgres.ps1
```

---

## 🔒 Segurança

⚠️ **ATENÇÃO**: 
- O script `resetar-senha-postgres.ps1` deixa o PostgreSQL sem autenticação temporariamente
- **SEMPRE** execute `reverter-seguranca-postgres.ps1` depois
- Não deixe o PostgreSQL em modo `trust` em produção

---

## 🆘 Problemas Comuns

### Erro: "Acesso negado"
- **Solução**: Execute o PowerShell como Administrador

### Erro: "Arquivo não encontrado"
- **Solução**: Verifique se o PostgreSQL está em `C:\Program Files\PostgreSQL\17\`
- Se estiver em outro local, edite o script e altere o caminho

### Erro: "Serviço não pode ser parado"
- **Solução**: Feche todas as conexões ao PostgreSQL primeiro
- Execute o PowerShell como Administrador

### Script não executa
- **Solução**: Execute no PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## ✅ Verificação Final

Depois de executar todos os scripts, teste no Beekeeper:

**Conexão "PostgreSQL Admin":**
- Host: `localhost`
- Port: `5433`
- User: `postgres`
- Password: (a senha que você definiu)

**Conexão "VIP Connect":**
- Host: `localhost`
- Port: `5433`
- User: `clientvipasi`
- Password: `1923731sS$`

---

**Pronto!** Agora você pode criar o banco de dados `vip_connect` e executar o schema! 🎉

