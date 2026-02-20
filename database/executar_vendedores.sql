-- =====================================================
-- EXECUÇÃO RÁPIDA DAS TABELAS DE VENDEDORES
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

-- 3. Criar tabela de vouchers para vendedores
CREATE TABLE IF NOT EXISTS vouchers_vendedor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('desconto', 'produto', 'servico', 'brinde')),
    valor DECIMAL(10,2) NOT NULL,
    valido_de DATE,
    valido_ate DATE,
    quantidade_disponivel INTEGER DEFAULT 1,
    quantidade_usada INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (valido_ate IS NULL OR valido_ate > valido_de)
);

-- 4. Criar tabela de resgates de vouchers
CREATE TABLE IF NOT EXISTS resgates_voucher_vendedor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES vouchers_vendedor(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    data_resgate DATE DEFAULT CURRENT_DATE,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'resgatado' CHECK (status IN ('resgatado', 'cancelado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar tabela de premiações por ranking
CREATE TABLE IF NOT EXISTS premiacoes_ranking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('vendas', 'avaliacoes')),
    posicao_minima INTEGER NOT NULL,
    posicao_maxima INTEGER NOT NULL,
    premio VARCHAR(255) NOT NULL,
    valor_premio DECIMAL(10,2),
    periodo_referencia VARCHAR(7), -- YYYY-MM
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (posicao_maxima >= posicao_minima)
);

-- 6. Criar tabela de premiações recebidas
CREATE TABLE IF NOT EXISTS premiacoes_recebidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    premiacao_id UUID NOT NULL REFERENCES premiacoes_ranking(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    posicao INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'cancelado')),
    data_concessao DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Adicionar coluna vendedor_id em tabelas existentes (se não existir)
DO $$
BEGIN
    -- Adicionar vendedor_id em avaliacoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avaliacoes' AND column_name = 'vendedor_id') THEN
        ALTER TABLE avaliacoes ADD COLUMN vendedor_id UUID REFERENCES vendedores(id);
    END IF;
    
    -- Adicionar vendedor_id em vendas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendas' AND column_name = 'vendedor_id') THEN
        ALTER TABLE vendas ADD COLUMN vendedor_id UUID REFERENCES vendedores(id);
    END IF;
END $$;

-- 8. Criar índices
CREATE INDEX IF NOT EXISTS idx_vendedores_user_id ON vendedores(user_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_loja_id ON vendedores(loja_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_ativo ON vendedores(ativo);
CREATE INDEX IF NOT EXISTS idx_vouchers_vendedor_id ON vouchers_vendedor(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_resgates_voucher_id ON resgates_voucher_vendedor(voucher_id);
CREATE INDEX IF NOT EXISTS idx_resgates_vendedor_id ON resgates_voucher_vendedor(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_premiacoes_recebidas_vendedor_id ON premiacoes_recebidas(vendedor_id);

-- 9. Criar views para rankings
CREATE OR REPLACE VIEW ranking_vendedores_vendas AS
SELECT 
    v.id,
    v.nome,
    v.codigo_vendedor,
    l.nome_fantasia as loja,
    COALESCE(COUNT(CASE WHEN vendas.id IS NOT NULL THEN 1 END), 0) as total_vendas,
    COALESCE(SUM(CASE WHEN vendas.id IS NOT NULL THEN vendas.valor ELSE 0 END), 0) as valor_vendas,
    v.meta_vendas,
    v.meta_vendas_valor,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN vendas.id IS NOT NULL THEN vendas.valor ELSE 0 END), 0) >= v.meta_vendas_valor THEN 'atingida'
        WHEN COALESCE(SUM(CASE WHEN vendas.id IS NOT NULL THEN vendas.valor ELSE 0 END), 0) > 0 THEN 'em_andamento'
        ELSE 'nao_iniciada'
    END as status_meta,
    v.ativo
FROM vendedores v
JOIN lojas l ON v.loja_id = l.id
LEFT JOIN vendas ON v.id = vendas.vendedor_id
WHERE v.ativo = true
GROUP BY v.id, v.nome, v.codigo_vendedor, l.nome_fantasia, v.meta_vendas, v.meta_vendas_valor, v.ativo
ORDER BY valor_vendas DESC;

CREATE OR REPLACE VIEW ranking_vendedores_avaliacoes AS
SELECT 
    v.id,
    v.nome,
    v.codigo_vendedor,
    l.nome_fantasia as loja,
    COALESCE(COUNT(CASE WHEN avaliacoes.id IS NOT NULL THEN 1 END), 0) as total_avaliacoes,
    COALESCE(AVG(CASE WHEN avaliacoes.id IS NOT NULL THEN avaliacoes.nota ELSE NULL END), 0) as media_avaliacoes,
    COALESCE(COUNT(CASE WHEN avaliacoes.id IS NOT NULL AND avaliacoes.nota >= 4 THEN 1 END), 0) as avaliacoes_positivas,
    COALESCE(COUNT(CASE WHEN avaliacoes.id IS NOT NULL AND avaliacoes.nota <= 2 THEN 1 END), 0) as avaliacoes_negativas,
    v.ativo
FROM vendedores v
JOIN lojas l ON v.loja_id = l.id
LEFT JOIN avaliacoes ON v.id = avaliacoes.vendedor_id
WHERE v.ativo = true
GROUP BY v.id, v.nome, v.codigo_vendedor, l.nome_fantasia, v.ativo
ORDER BY media_avaliacoes DESC, total_avaliacoes DESC;

-- 10. Criar usuário vendedor de teste (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'vendedor@exemplo.com') THEN
        INSERT INTO users (email, nome, senha, role, ativo) 
        VALUES ('vendedor@exemplo.com', 'Vendedor Teste', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'vendedor', true);
    END IF;
END $$;

-- Finalizado
SELECT 'Tabelas de vendedores criadas com sucesso!' as status;
