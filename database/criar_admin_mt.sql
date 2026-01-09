-- =====================================================
-- Criar Usuário Admin MT
-- =====================================================
-- Email: admin@vipasi.com
-- Senha: AdminVIP123!
-- Role: admin_mt
-- =====================================================

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

-- Verificar usuário criado
SELECT id, email, role, nome, ativo, created_at 
FROM users 
WHERE email = 'admin@vipasi.com';
