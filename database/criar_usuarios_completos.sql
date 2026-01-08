-- =====================================================
-- CRIAR USUÁRIOS DE TESTE COMPLETOS
-- Execute este script no Beekeeper
-- =====================================================
-- 
-- IMPORTANTE: Execute primeiro: node database/gerar_hashes.js
-- para gerar os hashes bcrypt corretos, depois atualize este arquivo
-- ou use os hashes gerados abaixo (já atualizados)
-- =====================================================

-- =====================================================
-- 1. ADMIN VIP (Admin MT) - Controla tudo
-- =====================================================
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'admin@vipasi.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: AdminVIP123!
  'admin_mt',
  'Admin VIP',
  '71999999999',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = true;

-- =====================================================
-- 2. ADMIN AUTOSHOPPING - Visualiza relatórios completos
-- =====================================================
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'admin@autoshopping.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: AdminShop123!
  'admin_shopping',
  'Admin AutoShopping',
  '71888888888',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = true;

-- =====================================================
-- 3. LOJISTAS - Acessam apenas seus clientes
-- =====================================================

-- Lojista 1 - Premium Motors
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'lojista1@exemplo.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: Lojista123!
  'lojista',
  'Lojista Premium Motors',
  '71777777777',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = true;

-- Lojista 2 - Auto Center
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'lojista2@exemplo.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: Lojista123!
  'lojista',
  'Lojista Auto Center',
  '71666666666',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = true;

-- =====================================================
-- 4. PARCEIROS - Validam benefícios
-- =====================================================

-- Parceiro Lavagem
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'parceiro.lavagem@exemplo.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: Parceiro123!
  'parceiro',
  'Parceiro Lavagem Premium',
  '71555555555',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = true;

-- Parceiro Estética
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'parceiro.estetica@exemplo.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: Parceiro123!
  'parceiro',
  'Parceiro Estética Automotiva',
  '71444444444',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = true;

-- Parceiro Oficina
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'parceiro.oficina@exemplo.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Senha: Parceiro123!
  'parceiro',
  'Parceiro Oficina Mecânica',
  '71333333333',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = true;

-- =====================================================
-- CRIAR LOJAS E ASSOCIAR AOS LOJISTAS
-- =====================================================

-- Loja 1 - Premium Motors (associada ao lojista1)
INSERT INTO lojas (nome, cnpj, telefone, email, endereco, ativo, user_id)
SELECT 
  'Premium Motors',
  '12.345.678/0001-90',
  '(71) 3333-3333',
  'premium@exemplo.com',
  'Av. Principal, 123 - Auto Shopping Itapoan',
  true,
  u.id
FROM users u
WHERE u.email = 'lojista1@exemplo.com'
ON CONFLICT DO NOTHING;

-- Loja 2 - Auto Center (associada ao lojista2)
INSERT INTO lojas (nome, cnpj, telefone, email, endereco, ativo, user_id)
SELECT 
  'Auto Center',
  '98.765.432/0001-10',
  '(71) 4444-4444',
  'autocenter@exemplo.com',
  'Av. Secundária, 456 - Auto Shopping Itapoan',
  true,
  u.id
FROM users u
WHERE u.email = 'lojista2@exemplo.com'
ON CONFLICT DO NOTHING;

-- =====================================================
-- CRIAR PARCEIROS E ASSOCIAR AOS USUÁRIOS
-- =====================================================

-- Parceiro Lavagem
INSERT INTO parceiros (nome, cnpj, telefone, email, tipo, ativo, user_id)
SELECT 
  'Lavagem Premium',
  '11.111.111/0001-11',
  '(71) 5555-5555',
  'lavagem@exemplo.com',
  'lavagem',
  true,
  u.id
FROM users u
WHERE u.email = 'parceiro.lavagem@exemplo.com'
ON CONFLICT DO NOTHING;

-- Parceiro Estética
INSERT INTO parceiros (nome, cnpj, telefone, email, tipo, ativo, user_id)
SELECT 
  'Estética Automotiva',
  '22.222.222/0001-22',
  '(71) 6666-6666',
  'estetica@exemplo.com',
  'estetica',
  true,
  u.id
FROM users u
WHERE u.email = 'parceiro.estetica@exemplo.com'
ON CONFLICT DO NOTHING;

-- Parceiro Oficina
INSERT INTO parceiros (nome, cnpj, telefone, email, tipo, ativo, user_id)
SELECT 
  'Oficina Mecânica',
  '33.333.333/0001-33',
  '(71) 7777-7777',
  'oficina@exemplo.com',
  'oficina',
  true,
  u.id
FROM users u
WHERE u.email = 'parceiro.oficina@exemplo.com'
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAR USUÁRIOS CRIADOS
-- =====================================================
SELECT 
  u.id,
  u.email,
  u.role,
  u.nome,
  u.whatsapp,
  u.ativo,
  l.nome as loja_nome,
  p.nome as parceiro_nome,
  p.tipo as parceiro_tipo
FROM users u
LEFT JOIN lojas l ON u.id = l.user_id
LEFT JOIN parceiros p ON u.id = p.user_id
WHERE u.email IN (
  'admin@vipasi.com',
  'admin@autoshopping.com',
  'lojista1@exemplo.com',
  'lojista2@exemplo.com',
  'parceiro.lavagem@exemplo.com',
  'parceiro.estetica@exemplo.com',
  'parceiro.oficina@exemplo.com'
)
ORDER BY 
  CASE u.role
    WHEN 'admin_mt' THEN 1
    WHEN 'admin_shopping' THEN 2
    WHEN 'lojista' THEN 3
    WHEN 'parceiro' THEN 4
    ELSE 5
  END,
  u.email;

