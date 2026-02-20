-- =====================================================
-- CRIAÇÃO DA TABELA DE VENDEDORES (VERSÃO CORRIGIDA)
-- =====================================================

-- 1. Adicionar role 'vendedor' ao enum user_role
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vendedor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'vendedor';
    END IF;
END $$;

-- 2. Criar tabela de vendedores
CREATE TABLE IF NOT EXISTS vendedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    codigo_vendedor VARCHAR(50) UNIQUE NOT NULL,
    comissao_padrao DECIMAL(5,2) DEFAULT 0.00,
    meta_vendas INTEGER DEFAULT 0,
    meta_vendas_valor DECIMAL(10,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT true,
    data_contratacao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id),
    UNIQUE(loja_id, codigo_vendedor)
);

-- Índices para vendedores
CREATE INDEX IF NOT EXISTS idx_vendedores_user_id ON vendedores(user_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_loja_id ON vendedores(loja_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_codigo_vendedor ON vendedores(codigo_vendedor);
CREATE INDEX IF NOT EXISTS idx_vendedores_ativo ON vendedores(ativo);

-- 3. Criar tabela de vouchers para vendedores
CREATE TABLE IF NOT EXISTS vouchers_vendedor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2),
    codigo VARCHAR(100) UNIQUE NOT NULL,
    valido_de DATE,
    valido_ate DATE,
    quantidade_disponivel INTEGER DEFAULT 1,
    quantidade_utilizada INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    criado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para vouchers de vendedores
CREATE INDEX IF NOT EXISTS idx_vouchers_vendedor_id ON vouchers_vendedor(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_codigo ON vouchers_vendedor(codigo);
CREATE INDEX IF NOT EXISTS idx_vouchers_valido_ate ON vouchers_vendedor(valido_ate);
CREATE INDEX IF NOT EXISTS idx_vouchers_ativo ON vouchers_vendedor(ativo);

-- 4. Criar tabela de resgate de vouchers pelos vendedores
CREATE TABLE IF NOT EXISTS resgates_vouchers_vendedor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    voucher_id UUID NOT NULL REFERENCES vouchers_vendedor(id) ON DELETE CASCADE,
    data_resgate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'resgatado',
    observacoes TEXT,
    validado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para resgates
CREATE INDEX IF NOT EXISTS idx_resgates_vendedor_id ON resgates_vouchers_vendedor(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_resgates_voucher_id ON resgates_vouchers_vendedor(voucher_id);
CREATE INDEX IF NOT EXISTS idx_resgates_data_resgate ON resgates_vouchers_vendedor(data_resgate);
CREATE INDEX IF NOT EXISTS idx_resgates_status ON resgates_vouchers_vendedor(status);

-- 5. Adicionar campo vendedor_id na tabela de vendas (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'vendedor_id') THEN
        ALTER TABLE vendas ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_vendas_vendedor_id ON vendas(vendedor_id);
    END IF;
END $$;

-- 6. Adicionar campo vendedor_id na tabela de avaliações (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avaliacoes' AND column_name = 'vendedor_id') THEN
        ALTER TABLE avaliacoes ADD COLUMN vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_avaliacoes_vendedor_id ON avaliacoes(vendedor_id);
    END IF;
END $$;

-- 7. Criar tabela de premiações por ranking
CREATE TABLE IF NOT EXISTS premiacoes_ranking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(100) NOT NULL,
    posicao_minima INTEGER NOT NULL,
    posicao_maxima INTEGER NOT NULL,
    premio VARCHAR(255) NOT NULL,
    valor_premio DECIMAL(10,2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para premiações
CREATE INDEX IF NOT EXISTS idx_premiacoes_ranking_tipo ON premiacoes_ranking(tipo);
CREATE INDEX IF NOT EXISTS idx_premiacoes_ranking_ativo ON premiacoes_ranking(ativo);

-- 8. Criar tabela de premiações recebidas pelos vendedores
CREATE TABLE IF NOT EXISTS premiacoes_recebidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    premiacoes_ranking_id UUID NOT NULL REFERENCES premiacoes_ranking(id) ON DELETE CASCADE,
    periodo_referencia DATE NOT NULL,
    posicao_ranking INTEGER NOT NULL,
    data_premiacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para premiações recebidas
CREATE INDEX IF NOT EXISTS idx_premiacoes_recebidas_vendedor_id ON premiacoes_recebidas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_premiacoes_recebidas_periodo ON premiacoes_recebidas(periodo_referencia);
CREATE INDEX IF NOT EXISTS idx_premiacoes_recebidas_status ON premiacoes_recebidas(status);

-- 9. Aplicar trigger de updated_at nas novas tabelas (se não existir)
DO $$
BEGIN
    -- Trigger para vendedores
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendedores_updated_at') THEN
        CREATE TRIGGER update_vendedores_updated_at BEFORE UPDATE ON vendedores
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger para vouchers_vendedor
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vouchers_vendedor_updated_at') THEN
        CREATE TRIGGER update_vouchers_vendedor_updated_at BEFORE UPDATE ON vouchers_vendedor
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger para premiacoes_ranking
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_premiacoes_ranking_updated_at') THEN
        CREATE TRIGGER update_premiacoes_ranking_updated_at BEFORE UPDATE ON premiacoes_ranking
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger para premiacoes_recebidas
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_premiacoes_recebidas_updated_at') THEN
        CREATE TRIGGER update_premiacoes_recebidas_updated_at BEFORE UPDATE ON premiacoes_recebidas
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 10. Criar view para ranking de vendedores (sem FILTER)
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

-- 11. Criar view para ranking de avaliação dos vendedores (sem FILTER)
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

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
