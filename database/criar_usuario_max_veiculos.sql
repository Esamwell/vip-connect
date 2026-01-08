-- =====================================================
-- CRIAR USUÁRIO PARA LOJA MAX VEÍCULOS
-- =====================================================

-- Criar usuário lojista para Max Veículos
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'lojista.maxveiculos@exemplo.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: Lojista123!
  'lojista',
  'Lojista Max Veículos',
  '71999999999',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  whatsapp = EXCLUDED.whatsapp,
  ativo = true
RETURNING id, email, nome;

-- Associar o usuário criado à loja Max Veículos
UPDATE lojas
SET user_id = (
  SELECT id FROM users 
  WHERE email = 'lojista.maxveiculos@exemplo.com'
  LIMIT 1
),
updated_at = CURRENT_TIMESTAMP
WHERE LOWER(nome) LIKE '%max veículos%' OR LOWER(nome) LIKE '%max veiculos%'
  AND user_id IS NULL;

-- Verificar se a associação foi feita corretamente
SELECT 
  l.id as loja_id,
  l.nome as loja_nome,
  l.user_id,
  u.id as user_id,
  u.email,
  u.nome as user_nome,
  u.role
FROM lojas l
LEFT JOIN users u ON l.user_id = u.id
WHERE LOWER(l.nome) LIKE '%max veículos%' OR LOWER(l.nome) LIKE '%max veiculos%';

