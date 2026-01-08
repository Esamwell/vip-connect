-- =====================================================
-- CRIAR USUÁRIOS DE TESTE - SISTEMA CLIENTE VIP
-- Execute este script no Beekeeper ou psql
-- =====================================================

-- IMPORTANTE: As senhas precisam ser hasheadas com bcrypt
-- Use o script Node.js: node database/gerar_hashes.js
-- Ou use uma ferramenta online para gerar hashes bcrypt

-- =====================================================
-- 1. ADMIN VIP (Admin MT) - Controla tudo
-- =====================================================
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'admin@vipasi.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Senha: AdminVIP123!
  'admin_mt',
  'Admin VIP',
  '71999999999',
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 2. ADMIN AUTOSHOPPING - Visualiza relatórios completos
-- =====================================================
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'admin@autoshopping.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Senha: AdminShop123!
  'admin_shopping',
  'Admin AutoShopping',
  '71888888888',
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 3. LOJISTAS - Acessam apenas seus clientes
-- =====================================================

-- Lojista 1
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'lojista1@exemplo.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Senha: Lojista123!
  'lojista',
  'Lojista Premium Motors',
  '71777777777',
  true
) ON CONFLICT (email) DO NOTHING;

-- Lojista 2
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'lojista2@exemplo.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Senha: Lojista123!
  'lojista',
  'Lojista Auto Center',
  '71666666666',
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 4. PARCEIROS - Validam benefícios
-- =====================================================

-- Parceiro Lavagem
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'parceiro.lavagem@exemplo.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Senha: Parceiro123!
  'parceiro',
  'Parceiro Lavagem Premium',
  '71555555555',
  true
) ON CONFLICT (email) DO NOTHING;

-- Parceiro Estética
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'parceiro.estetica@exemplo.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Senha: Parceiro123!
  'parceiro',
  'Parceiro Estética Automotiva',
  '71444444444',
  true
) ON CONFLICT (email) DO NOTHING;

-- Parceiro Oficina
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
(
  'parceiro.oficina@exemplo.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', -- Senha: Parceiro123!
  'parceiro',
  'Parceiro Oficina Mecânica',
  '71333333333',
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFICAR USUÁRIOS CRIADOS
-- =====================================================
SELECT 
  id,
  email,
  role,
  nome,
  whatsapp,
  ativo,
  created_at
FROM users
WHERE email IN (
  'admin@vipasi.com',
  'admin@autoshopping.com',
  'lojista1@exemplo.com',
  'lojista2@exemplo.com',
  'parceiro.lavagem@exemplo.com',
  'parceiro.estetica@exemplo.com',
  'parceiro.oficina@exemplo.com'
)
ORDER BY role, email;

