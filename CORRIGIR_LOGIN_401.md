# 🔐 Corrigir Erro 401 no Login

## ❌ Problema

Erro 401 "Credenciais inválidas" ao tentar fazer login.

## 🔍 Possíveis Causas

1. **Usuário não existe no banco de dados**
2. **Usuário está inativo** (`ativo = false`)
3. **Senha incorreta**
4. **Senha não está hasheada** (senha em texto plano no banco)

## ✅ Verificações

### 1. Verificar se Usuário Existe

Execute no banco de dados:

```sql
SELECT id, email, nome, role, ativo 
FROM users 
WHERE email = 'admin@autoshopping.com';
```

**Se não retornar nada:**
- O usuário não existe
- Precisa criar o usuário

**Se retornar mas `ativo = false`:**
- O usuário está inativo
- Ative: `UPDATE users SET ativo = true WHERE email = 'admin@autoshopping.com';`

### 2. Verificar Hash da Senha

Execute no banco:

```sql
SELECT email, password_hash, 
       LENGTH(password_hash) as hash_length,
       SUBSTRING(password_hash, 1, 10) as hash_preview
FROM users 
WHERE email = 'admin@autoshopping.com';
```

**Senha deve estar hasheada:**
- Hash bcrypt começa com `$2a$` ou `$2b$`
- Tem aproximadamente 60 caracteres
- Se estiver em texto plano, precisa gerar hash

### 3. Criar/Atualizar Usuário Admin

Se o usuário não existe ou a senha não está hasheada:

```sql
-- Gerar hash da senha (substitua 'sua_senha_aqui' pela senha desejada)
-- Use o script: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('sua_senha_aqui', 10).then(h => console.log(h));"

-- Criar ou atualizar usuário admin
INSERT INTO users (email, password_hash, nome, role, ativo)
VALUES (
  'admin@autoshopping.com',
  '$2a$10$[HASH_GERADO_AQUI]', -- Substitua pelo hash gerado
  'Admin',
  'admin_mt',
  true
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    ativo = true;
```

## 🚀 Solução Rápida

### Opção 1: Usar Script SQL Existente

Execute o script que criamos anteriormente:

```bash
docker exec -i vip-connect-db psql -U postgres -d vip_connect < database/criar_admin_mt.sql
```

Ou via Beekeeper Studio, execute o conteúdo de `database/criar_admin_mt.sql`.

### Opção 2: Gerar Hash e Criar Manualmente

1. **Gerar hash da senha:**
   ```bash
   cd server
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('sua_senha_aqui', 10).then(h => console.log(h));"
   ```

2. **Criar usuário no banco:**
   ```sql
   INSERT INTO users (email, password_hash, nome, role, ativo)
   VALUES (
     'admin@autoshopping.com',
     '[HASH_GERADO]',
     'Admin',
     'admin_mt',
     true
   )
   ON CONFLICT (email) DO UPDATE
   SET password_hash = EXCLUDED.password_hash,
       ativo = true;
   ```

## 📝 Verificar Após Correção

1. **Faça commit e push** (se ainda não fez):
   ```bash
   git add server/src/routes/auth.ts
   git commit -m "fix: adicionar logs detalhados no login"
   git push
   ```

2. **Redeploy do Backend** no Coolify

3. **Teste login novamente**

4. **Verifique os logs** do backend no Coolify:
   - Deve mostrar: "Tentativa de login"
   - Deve mostrar: "Usuários encontrados: X"
   - Deve mostrar: "Login bem-sucedido" ou "Senha inválida"

## 🔍 Logs Detalhados Adicionados

Os logs agora mostrarão:
- Email usado no login
- Quantos usuários foram encontrados
- Se a senha foi validada
- Se o login foi bem-sucedido

Isso ajudará a identificar exatamente onde está o problema.

---

**Execute o script SQL para criar/atualizar o usuário e teste novamente!**

