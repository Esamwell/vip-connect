# 🔧 Troubleshooting - Erro de Conexão Beekeeper

## ❌ Erro: "There was a problem" / "Error"

Se você está vendo essa mensagem ao tentar conectar, siga estes passos:

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar se o PostgreSQL está rodando

**Windows:**
```powershell
# Verificar se o serviço está rodando
Get-Service -Name postgresql*

# Ou verificar processos
Get-Process -Name postgres -ErrorAction SilentlyContinue
```

**Ou pelo Gerenciador de Serviços:**
- Pressione `Win + R`
- Digite `services.msc`
- Procure por "PostgreSQL" e verifique se está "Em execução"

### 2. Verificar se a porta 5432 está acessível

**Windows PowerShell:**
```powershell
# Testar conexão na porta
Test-NetConnection -ComputerName localhost -Port 5432
```

Se retornar `TcpTestSucceeded : False`, o PostgreSQL não está escutando na porta 5432.

### 3. Verificar credenciais

Certifique-se de que:
- ✅ Usuário: `clientvipasi` existe no PostgreSQL
- ✅ Senha: `1923731sS$` está correta
- ✅ O usuário tem permissão para conectar

### 4. Tentar conectar com usuário padrão

Tente primeiro com o usuário `postgres` (superusuário):

**No Beekeeper:**
- **User**: `postgres`
- **Password**: (sua senha do postgres)
- **Default Database**: `postgres`

Se funcionar com `postgres`, o problema pode ser com o usuário `clientvipasi`.

### 5. Verificar se o banco de dados existe

Se você deixou "Default Database" vazio, tente:

**Opção A**: Deixar vazio (deve funcionar)
**Opção B**: Colocar `postgres` (banco padrão)
**Opção C**: Se já criou, colocar `vip_connect`

## 🛠️ Soluções Comuns

### Solução 1: Criar/Verificar Usuário no PostgreSQL

Se você tem acesso ao terminal do PostgreSQL ou pgAdmin:

```sql
-- Conectar como postgres primeiro
-- Criar usuário se não existir
CREATE USER clientvipasi WITH PASSWORD '1923731sS$';

-- Dar permissões
ALTER USER clientvipasi CREATEDB;

-- Ou se preferir, dar todas as permissões (cuidado em produção!)
ALTER USER clientvipasi WITH SUPERUSER;
```

### Solução 2: Verificar arquivo pg_hba.conf

O PostgreSQL pode estar bloqueando conexões. Verifique o arquivo `pg_hba.conf`:

**Localização comum no Windows:**
```
C:\Program Files\PostgreSQL\[versão]\data\pg_hba.conf
```

**Adicione ou verifique esta linha:**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

**Depois, reinicie o serviço PostgreSQL.**

### Solução 3: Verificar arquivo postgresql.conf

Verifique se o PostgreSQL está escutando conexões locais:

**Localização:**
```
C:\Program Files\PostgreSQL\[versão]\data\postgresql.conf
```

**Procure por:**
```
listen_addresses = 'localhost'  # ou '*'
```

**Depois, reinicie o serviço PostgreSQL.**

### Solução 4: Testar conexão via linha de comando

Abra o PowerShell e teste:

```powershell
# Instalar cliente PostgreSQL se não tiver
# Ou usar o que vem com a instalação

# Caminho comum do psql
& "C:\Program Files\PostgreSQL\[versão]\bin\psql.exe" -U clientvipasi -h localhost -p 5432 -d postgres
```

Se funcionar no terminal, o problema pode ser específico do Beekeeper.

### Solução 5: Verificar Firewall

O Windows Firewall pode estar bloqueando:

1. Abra "Firewall do Windows Defender"
2. Verifique se PostgreSQL está nas exceções
3. Ou temporariamente desabilite o firewall para testar

## 📝 Configuração Recomendada no Beekeeper

Baseado na sua tela, use estas configurações:

```
Connection Type: Postgres
Authentication Method: Username / Password
Connection Mode: Host and Port
Host: localhost
Port: 5432
Enable SSL: OFF (desabilitado)
User: clientvipasi
Password: 1923731sS$
Default Database: (deixe vazio ou coloque "postgres")
SSH Tunnel: OFF
Read Only Mode: (desmarcado)
```

## ✅ Teste Rápido

1. **Primeiro teste com postgres:**
   - User: `postgres`
   - Password: (sua senha do postgres)
   - Default Database: `postgres`
   - Clique em "Test"

2. **Se funcionar, teste com clientvipasi:**
   - User: `clientvipasi`
   - Password: `1923731sS$`
   - Default Database: (vazio)
   - Clique em "Test"

## 🆘 Se Nada Funcionar

1. **Verifique os logs do PostgreSQL:**
   - Localização comum: `C:\Program Files\PostgreSQL\[versão]\data\log\`
   - Procure por erros recentes

2. **Reinicie o serviço PostgreSQL:**
   ```powershell
   Restart-Service postgresql*
   ```

3. **Verifique a versão do PostgreSQL:**
   - Certifique-se de que está usando uma versão compatível (12+)

4. **Tente outra ferramenta:**
   - Teste com pgAdmin para isolar se é problema do Beekeeper ou do PostgreSQL

## 📞 Informações para Diagnóstico

Se precisar de mais ajuda, colete estas informações:

- Versão do PostgreSQL: `SELECT version();`
- Usuários existentes: `\du` (no psql)
- Bancos existentes: `\l` (no psql)
- Status do serviço: resultado do `Get-Service`
- Mensagem de erro completa do Beekeeper

---

**Dica:** Se conseguir conectar com `postgres` mas não com `clientvipasi`, o problema é de permissões do usuário. Use a Solução 1 acima.

