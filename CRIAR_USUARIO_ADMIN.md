# 👤 Criar Usuário Admin MT

SQL para criar usuário administrador com acesso total ao sistema.

## 📋 Informações do Usuário

- **Email:** `admin@vipasi.com`
- **Senha:** `AdminVIP123!`
- **Role:** `admin_mt` (acesso total)
- **Nome:** Admin MT - VIP ASI

## 🔧 SQL para Executar

### Opção 1: Executar Arquivo SQL

No Beekeeper Studio ou psql, execute:

```sql
-- Copie e cole o conteúdo do arquivo database/criar_admin_mt.sql
```

### Opção 2: SQL Direto

```sql
-- Inserir ou atualizar usuário Admin MT
INSERT INTO users (email, password_hash, role, nome, ativo, created_at, updated_at)
VALUES (
    'admin@vipasi.com',
    '$2a$10$xt0BxujAH.BWkHJmWOcjZ.K/9INDqqzrAPZBfTzbLfehnM3oV0SnW',
    'admin_mt',
    'Admin MT - VIP ASI',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    nome = EXCLUDED.nome,
    ativo = true,
    updated_at = CURRENT_TIMESTAMP;
```

### Opção 3: Executar na VPS

```bash
# Conectar na VPS
ssh root@84.46.241.73

# Executar SQL no container
docker exec -i vip-connect-db psql -U postgres -d vip_connect << EOF
INSERT INTO users (email, password_hash, role, nome, ativo, created_at, updated_at)
VALUES (
    'admin@vipasi.com',
    '$2a$10$xt0BxujAH.BWkHJmWOcjZ.K/9INDqqzrAPZBfTzbLfehnM3oV0SnW',
    'admin_mt',
    'Admin MT - VIP ASI',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    nome = EXCLUDED.nome,
    ativo = true,
    updated_at = CURRENT_TIMESTAMP;
EOF
```

## ✅ Verificar Usuário Criado

```sql
SELECT id, email, role, nome, ativo, created_at 
FROM users 
WHERE email = 'admin@vipasi.com';
```

## 🔐 Testar Login

Após criar o usuário, teste o login na aplicação:

- **URL:** `https://asibeneficios.autoshoppingitapoan.com.br/login`
- **Email:** `admin@vipasi.com`
- **Senha:** `AdminVIP123!`

## 📝 Notas

- O SQL usa `ON CONFLICT` para atualizar se o email já existir
- A senha está hasheada com bcrypt (salt rounds: 10)
- O usuário será criado como `ativo = true`
- Role `admin_mt` tem acesso total ao sistema

---

**Execute o SQL acima no Beekeeper ou na VPS para criar o usuário!**

