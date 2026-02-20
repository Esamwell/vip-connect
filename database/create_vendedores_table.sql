-- =====================================================
-- CRIAÇÃO DA TABELA DE VENDEDORES
-- =====================================================

-- 1. Adicionar role 'vendedor' ao enum user_role
ALTER TYPE user_role ADD VALUE 'vendedor';

-- 2. Criar tabela de vendedores
CREATE TABLE vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    codigo_vendedor VARCHAR(50) UNIQUE NOT NULL, -- Código único para identificar o vendedor
    comissao_padrao DECIMAL(5,2) DEFAULT 0.00, -- Comissão padrão em percentual
    meta_vendas INTEGER DEFAULT 0, -- Meta de vendas mensal
    meta_vendas_valor DECIMAL(10,2) DEFAULT 0.00, -- Meta de vendas em valor
    ativo BOOLEAN DEFAULT true,
    data_contratacao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id), -- Um usuário só pode ser um vendedor
    UNIQUE(loja_id, codigo_vendedor) -- Código único por loja
);

-- Índices para vendedores
CREATE INDEX idx_vendedores_user_id ON vendedores(user_id);
CREATE INDEX idx_vendedores_loja_id ON vendedores(loja_id);
CREATE INDEX idx_vendedores_codigo_vendedor ON vendedores(codigo_vendedor);
CREATE INDEX idx_vendedores_ativo ON vendedores(ativo);
CREATE INDEX idx_vendedores_data_contratacao ON vendedores(data_contratacao);

-- 3. Criar tabela de vouchers para vendedores
CREATE TABLE vouchers_vendedor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(100) NOT NULL, -- 'beneficio', 'premio', 'comissao_extra'
    valor DECIMAL(10,2), -- Valor em reais ou percentual
    codigo VARCHAR(100) UNIQUE NOT NULL,
    valido_de DATE,
    valido_ate DATE,
    quantidade_disponivel INTEGER DEFAULT 1,
    quantidade_utilizada INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    criado_por UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin que criou
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para vouchers de vendedores
CREATE INDEX idx_vouchers_vendedor_id ON vouchers_vendedor(vendedor_id);
CREATE INDEX idx_vouchers_codigo ON vouchers_vendedor(codigo);
CREATE INDEX idx_vouchers_valido_ate ON vouchers_vendedor(valido_ate);
CREATE INDEX idx_vouchers_ativo ON vouchers_vendedor(ativo);

-- 4. Criar tabela de resgate de vouchers pelos vendedores
CREATE TABLE resgates_vouchers_vendedor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    voucher_id UUID NOT NULL REFERENCES vouchers_vendedor(id) ON DELETE CASCADE,
    data_resgate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'resgatado', -- 'resgatado', 'cancelado', 'expirado'
    observacoes TEXT,
    validado_por UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin que validou
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para resgates
CREATE INDEX idx_resgates_vendedor_id ON resgates_vouchers_vendedor(vendedor_id);
CREATE INDEX idx_resgates_voucher_id ON resgates_vouchers_vendedor(voucher_id);
CREATE INDEX idx_resgates_data_resgate ON resgates_vouchers_vendedor(data_resgate);
CREATE INDEX idx_resgates_status ON resgates_vouchers_vendedor(status);

-- 5. Adicionar campo vendedor_id na tabela de vendas
ALTER TABLE vendas 
ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;

-- Índice para vendedor_id em vendas
CREATE INDEX idx_vendas_vendedor_id ON vendas(vendedor_id);

-- 6. Adicionar campo vendedor_id na tabela de avaliações
ALTER TABLE avaliacoes 
ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;

-- Índice para vendedor_id em avaliações
CREATE INDEX idx_avaliacoes_vendedor_id ON avaliacoes(vendedor_id);

-- 7. Criar tabela de premiações por ranking
CREATE TABLE premiacoes_ranking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(100) NOT NULL, -- 'mensal', 'trimestral', 'anual'
    posicao_minima INTEGER NOT NULL, -- Posição mínima no ranking para ganhar
    posicao_maxima INTEGER NOT NULL, -- Posição máxima no ranking para ganhar
    premio VARCHAR(255) NOT NULL, -- Descrição do prêmio
    valor_premio DECIMAL(10,2), -- Valor em reais do prêmio
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para premiações
CREATE INDEX idx_premiacoes_ranking_tipo ON premiacoes_ranking(tipo);
CREATE INDEX idx_premiacoes_ranking_ativo ON premiacoes_ranking(ativo);

-- 8. Criar tabela de premiações recebidas pelos vendedores
CREATE TABLE premiacoes_recebidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    premiacoes_ranking_id UUID NOT NULL REFERENCES premiacoes_ranking(id) ON DELETE CASCADE,
    periodo_referencia DATE NOT NULL, -- Mês/ano de referência do ranking
    posicao_ranking INTEGER NOT NULL, -- Posição que o vendedor ficou no ranking
    data_premiacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'recebido', 'cancelado'
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para premiações recebidas
CREATE INDEX idx_premiacoes_recebidas_vendedor_id ON premiacoes_recebidas(vendedor_id);
CREATE INDEX idx_premiacoes_recebidas_periodo ON premiacoes_recebidas(periodo_referencia);
CREATE INDEX idx_premiacoes_recebidas_status ON premiacoes_recebidas(status);

-- 9. Aplicar trigger de updated_at nas novas tabelas
CREATE TRIGGER update_vendedores_updated_at BEFORE UPDATE ON vendedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vouchers_vendedor_updated_at BEFORE UPDATE ON vouchers_vendedor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premiacoes_ranking_updated_at BEFORE UPDATE ON premiacoes_ranking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premiacoes_recebidas_updated_at BEFORE UPDATE ON premiacoes_recebidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Criar view para ranking de vendedores
CREATE OR REPLACE VIEW ranking_vendedores AS
SELECT 
    v.id,
    v.nome,
    v.loja_id,
    l.nome as loja_nome,
    COUNT(vd.id)::integer as total_vendas,
    COALESCE(SUM(vd.valor), 0) as valor_total_vendas,
    COALESCE(AVG(a.nota), 0) as nota_media_avaliacao,
    COUNT(a.id)::integer as total_avaliacoes,
    ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_loja,
    ROW_NUMBER() OVER (ORDER BY COUNT(vd.id) DESC, COALESCE(SUM(vd.valor), 0) DESC) as posicao_ranking_geral
FROM vendedores v
LEFT JOIN lojas l ON v.loja_id = l.id
LEFT JOIN vendas vd ON v.id = vd.vendedor_id
LEFT JOIN avaliacoes a ON v.id = a.vendedor_id
WHERE v.ativo = true
GROUP BY v.id, v.nome, v.loja_id, l.nome
ORDER BY total_vendas DESC, valor_total_vendas DESC;

-- 11. Criar view para ranking de avaliação dos vendedores
CREATE OR REPLACE VIEW ranking_avaliacao_vendedores AS
SELECT 
    v.id,
    v.nome,
    v.loja_id,
    l.nome as loja_nome,
    COUNT(a.id)::integer as total_avaliacoes,
    COALESCE(AVG(a.nota), 0) as nota_media,
    COUNT(CASE WHEN a.nota >= 9 THEN a.id END)::integer as avaliacoes_9_10,
    COUNT(CASE WHEN a.nota >= 7 AND a.nota < 9 THEN a.id END)::integer as avaliacoes_7_8,
    COUNT(CASE WHEN a.nota < 7 THEN a.id END)::integer as avaliacoes_abaixo_7,
    ROW_NUMBER() OVER (PARTITION BY v.loja_id ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_loja,
    ROW_NUMBER() OVER (ORDER BY AVG(a.nota) DESC, COUNT(a.id) DESC) as posicao_ranking_geral
FROM vendedores v
LEFT JOIN lojas l ON v.loja_id = l.id
LEFT JOIN avaliacoes a ON v.id = a.vendedor_id
WHERE v.ativo = true
GROUP BY v.id, v.nome, v.loja_id, l.nome
HAVING COUNT(a.id) > 0
ORDER BY nota_media DESC, total_avaliacoes DESC;

-- 12. Comentários nas tabelas
COMMENT ON TABLE vendedores IS 'Vendedores das lojas do shopping';
COMMENT ON TABLE vouchers_vendedor IS 'Vouchers e benefícios disponíveis para resgate pelos vendedores';
COMMENT ON TABLE resgates_vouchers_vendedor IS 'Registro de resgates de vouchers pelos vendedores';
COMMENT ON TABLE premiacoes_ranking IS 'Configuração de premiações por ranking de vendedores';
COMMENT ON TABLE premiacoes_recebidas IS 'Registro de premiações recebidas pelos vendedores';
COMMENT ON VIEW ranking_vendedores IS 'Ranking de vendedores por número de vendas e valor';
COMMENT ON VIEW ranking_avaliacao_vendedores IS 'Ranking de vendedores por avaliação dos clientes';

-- 13. Dados exemplo (opcional - pode ser removido em produção)
-- Inserir alguns vendedores de exemplo
-- INSERT INTO users (email, password_hash, role, nome, whatsapp, ativo) VALUES
-- ('vendedor1@loja.com', '$2b$10$exemplo_hash', 'vendedor', 'João Vendedor', '71999999999', true),
-- ('vendedor2@loja.com', '$2b$10$exemplo_hash', 'vendedor', 'Maria Vendedora', '71988888888', true);

-- INSERT INTO vendedores (user_id, loja_id, nome, codigo_vendedor, comissao_padrao) VALUES
-- ((SELECT id FROM users WHERE email = 'vendedor1@loja.com'), (SELECT id FROM lojas LIMIT 1), 'João Vendedor', 'VEND001', 5.00),
-- ((SELECT id FROM users WHERE email = 'vendedor2@loja.com'), (SELECT id FROM lojas LIMIT 1), 'Maria Vendedora', 'VEND002', 6.00);
