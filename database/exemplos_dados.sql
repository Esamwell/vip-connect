-- =====================================================
-- EXEMPLOS DE DADOS - SISTEMA CLIENTE VIP
-- Use este arquivo para inserir dados de exemplo/teste
-- =====================================================

-- =====================================================
-- 1. INSERIR LOJAS
-- =====================================================

-- Exemplo: Inserir uma loja
INSERT INTO lojas (nome, cnpj, telefone, email, endereco, ativo) VALUES
('Loja Exemplo 1', '12.345.678/0001-90', '(71) 99999-9999', 'loja1@exemplo.com', 'Endereço da Loja 1', true),
('Loja Exemplo 2', '98.765.432/0001-10', '(71) 88888-8888', 'loja2@exemplo.com', 'Endereço da Loja 2', true);

-- =====================================================
-- 2. INSERIR PARCEIROS
-- =====================================================

-- Exemplo: Inserir parceiros (lavagem, estética, oficina)
INSERT INTO parceiros (nome, cnpj, telefone, email, tipo, ativo) VALUES
('Lavagem Premium', '11.111.111/0001-11', '(71) 77777-7777', 'lavagem@exemplo.com', 'lavagem', true),
('Estética Automotiva', '22.222.222/0001-22', '(71) 66666-6666', 'estetica@exemplo.com', 'estetica', true),
('Oficina Mecânica', '33.333.333/0001-33', '(71) 55555-5555', 'oficina@exemplo.com', 'oficina', true);

-- =====================================================
-- 3. INSERIR BENEFÍCIOS OFICIAIS
-- =====================================================

-- Exemplo: Inserir benefícios oficiais do shopping
INSERT INTO beneficios_oficiais (nome, descricao, parceiro_id, ativo) VALUES
('Lavagem Completa Grátis', 'Lavagem completa do veículo uma vez por mês', 
 (SELECT id FROM parceiros WHERE tipo = 'lavagem' LIMIT 1), true),
('Estética Premium', 'Serviço de estética automotiva com desconto de 20%', 
 (SELECT id FROM parceiros WHERE tipo = 'estetica' LIMIT 1), true),
('Revisão Preventiva', 'Revisão preventiva com desconto de 15%', 
 (SELECT id FROM parceiros WHERE tipo = 'oficina' LIMIT 1), true);

-- =====================================================
-- 4. INSERIR BENEFÍCIOS DE LOJA
-- =====================================================

-- Exemplo: Loja 1 adiciona benefícios
INSERT INTO beneficios_loja (loja_id, nome, descricao, tipo, ativo) VALUES
((SELECT id FROM lojas LIMIT 1), 'Lavagem Grátis Mensal', 'Lavagem grátis todo mês para clientes VIP', 'lavagem_gratis', true),
((SELECT id FROM lojas LIMIT 1), 'Revisão Completa', 'Revisão completa do veículo com desconto especial', 'revisao', true),
((SELECT id FROM lojas LIMIT 1), 'Brinde Exclusivo', 'Brinde exclusivo para clientes VIP', 'brinde', true);

-- =====================================================
-- 5. REGISTRAR VENDA (ativação automática do VIP)
-- =====================================================

-- Exemplo: Registrar uma venda (isso ativará automaticamente o VIP via trigger)
INSERT INTO vendas (
    loja_id,
    nome,
    whatsapp,
    email,
    data_venda,
    valor,
    veiculo_marca,
    veiculo_modelo,
    veiculo_ano,
    veiculo_placa
) VALUES (
    (SELECT id FROM lojas LIMIT 1),
    'João Silva',
    '71999999999',
    'joao.silva@email.com',
    CURRENT_DATE,
    50000.00,
    'Toyota',
    'Corolla',
    2023,
    'ABC1234'
);

-- Verificar se o cliente VIP foi criado automaticamente
-- SELECT * FROM clientes_vip WHERE nome = 'João Silva';

-- =====================================================
-- 6. INSERIR USUÁRIOS (LOJISTAS E PARCEIROS)
-- =====================================================

-- Exemplo: Criar usuário lojista
-- NOTA: A senha deve ser hash bcrypt. Use uma biblioteca para gerar o hash real.
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
('lojista1@exemplo.com', '$2b$10$exemplo_hash_aqui_altere_antes_de_usar', 'lojista', 'Lojista 1', '71999999999', true);

-- Associar lojista à loja
UPDATE lojas 
SET user_id = (SELECT id FROM users WHERE email = 'lojista1@exemplo.com')
WHERE id = (SELECT id FROM lojas LIMIT 1);

-- Exemplo: Criar usuário parceiro
INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
('parceiro1@exemplo.com', '$2b$10$exemplo_hash_aqui_altere_antes_de_usar', 'parceiro', 'Parceiro 1', '71888888888', true);

-- Associar parceiro ao parceiro
UPDATE parceiros 
SET user_id = (SELECT id FROM users WHERE email = 'parceiro1@exemplo.com')
WHERE id = (SELECT id FROM parceiros WHERE tipo = 'lavagem' LIMIT 1);

-- =====================================================
-- 7. VALIDAR BENEFÍCIO (EXEMPLO)
-- =====================================================

-- Exemplo: Validar um benefício oficial
-- Primeiro, busque o QR code do cliente VIP criado acima
-- INSERT INTO validacoes_beneficios (
--     cliente_vip_id,
--     parceiro_id,
--     beneficio_oficial_id,
--     tipo,
--     codigo_qr
-- ) VALUES (
--     (SELECT id FROM clientes_vip WHERE nome = 'João Silva' LIMIT 1),
--     (SELECT id FROM parceiros WHERE tipo = 'lavagem' LIMIT 1),
--     (SELECT id FROM beneficios_oficiais WHERE nome LIKE '%Lavagem%' LIMIT 1),
--     'oficial',
--     (SELECT qr_code_digital FROM clientes_vip WHERE nome = 'João Silva' LIMIT 1)
-- );

-- =====================================================
-- 8. CRIAR CHAMADO (EXEMPLO)
-- =====================================================

-- Exemplo: Cliente abre um chamado
-- INSERT INTO chamados (
--     cliente_vip_id,
--     loja_id,
--     tipo,
--     titulo,
--     descricao,
--     prioridade
-- ) VALUES (
--     (SELECT id FROM clientes_vip WHERE nome = 'João Silva' LIMIT 1),
--     (SELECT loja_id FROM clientes_vip WHERE nome = 'João Silva' LIMIT 1),
--     'duvidas_gerais',
--     'Dúvida sobre benefícios',
--     'Gostaria de saber mais sobre os benefícios disponíveis',
--     2
-- );

-- =====================================================
-- 9. CRIAR AVALIAÇÃO (EXEMPLO)
-- =====================================================

-- Exemplo: Cliente avalia a loja
-- INSERT INTO avaliacoes (
--     cliente_vip_id,
--     loja_id,
--     nota,
--     comentario,
--     anonima
-- ) VALUES (
--     (SELECT id FROM clientes_vip WHERE nome = 'João Silva' LIMIT 1),
--     (SELECT loja_id FROM clientes_vip WHERE nome = 'João Silva' LIMIT 1),
--     9,
--     'Excelente atendimento e serviço de qualidade!',
--     false
-- );

-- =====================================================
-- 10. CONSULTAS ÚTEIS PARA VERIFICAR OS DADOS
-- =====================================================

-- Ver todos os clientes VIP
-- SELECT * FROM clientes_vip;

-- Ver ranking de lojas
-- SELECT * FROM ranking_lojas;

-- Ver benefícios disponíveis para um cliente
-- SELECT 
--     'oficial' as tipo,
--     bo.nome,
--     bo.descricao
-- FROM beneficios_oficiais bo
-- WHERE bo.ativo = true
-- UNION ALL
-- SELECT 
--     'loja' as tipo,
--     bl.nome,
--     bl.descricao
-- FROM beneficios_loja bl
-- JOIN clientes_vip cv ON bl.loja_id = cv.loja_id
-- WHERE bl.ativo = true
-- AND cv.id = (SELECT id FROM clientes_vip LIMIT 1);

-- Ver chamados abertos
-- SELECT * FROM chamados WHERE status = 'aberto';

-- Ver eventos de webhook pendentes
-- SELECT * FROM eventos_webhook WHERE enviado = false;

-- =====================================================
-- FIM DOS EXEMPLOS
-- =====================================================

