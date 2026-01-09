-- =====================================================
-- SCRIPT PARA CRIAR TABELAS FALTANTES NO BANCO DE DADOS
-- Execute este script no banco de dados PostgreSQL
-- =====================================================

-- =====================================================
-- 1. TABELA: veiculos_cliente_vip
-- =====================================================

-- Tabela para histórico de veículos de clientes VIP
CREATE TABLE IF NOT EXISTS veiculos_cliente_vip (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_vip_id UUID NOT NULL REFERENCES clientes_vip(id) ON DELETE CASCADE,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    placa VARCHAR(10) NOT NULL,
    data_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    renovacao_id UUID REFERENCES renovacoes(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para veículos de clientes VIP
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_vip_cliente_id ON veiculos_cliente_vip(cliente_vip_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_vip_data_compra ON veiculos_cliente_vip(data_compra);

-- Comentário na tabela
COMMENT ON TABLE veiculos_cliente_vip IS 'Histórico de veículos comprados por clientes VIP, mantendo registro de todos os veículos';

-- Migrar veículos existentes da tabela clientes_vip para o histórico (se houver)
INSERT INTO veiculos_cliente_vip (cliente_vip_id, marca, modelo, ano, placa, data_compra)
SELECT 
    id,
    veiculo_marca,
    veiculo_modelo,
    veiculo_ano,
    veiculo_placa,
    data_venda
FROM clientes_vip
WHERE veiculo_marca IS NOT NULL 
    AND veiculo_modelo IS NOT NULL
    AND veiculo_ano IS NOT NULL
    AND veiculo_placa IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM veiculos_cliente_vip 
        WHERE veiculos_cliente_vip.cliente_vip_id = clientes_vip.id
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. TABELA: clientes_beneficios
-- =====================================================

-- Tabela para relacionar clientes VIP com benefícios (oficiais ou de loja)
CREATE TABLE IF NOT EXISTS clientes_beneficios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_vip_id UUID NOT NULL REFERENCES clientes_vip(id) ON DELETE CASCADE,
    beneficio_oficial_id UUID REFERENCES beneficios_oficiais(id) ON DELETE CASCADE,
    beneficio_loja_id UUID REFERENCES beneficios_loja(id) ON DELETE CASCADE,
    tipo tipo_beneficio NOT NULL, -- oficial ou loja
    ativo BOOLEAN DEFAULT true, -- Permite desativar um benefício alocado sem remover
    alocado_por UUID REFERENCES users(id) ON DELETE SET NULL, -- Usuário que alocou o benefício
    data_alocacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Constraint: Garantir que apenas um tipo de benefício está preenchido
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_beneficio_tipo_preenchido'
    ) THEN
        ALTER TABLE clientes_beneficios 
        ADD CONSTRAINT check_beneficio_tipo_preenchido CHECK (
            (beneficio_oficial_id IS NOT NULL AND beneficio_loja_id IS NULL AND tipo = 'oficial') OR
            (beneficio_oficial_id IS NULL AND beneficio_loja_id IS NOT NULL AND tipo = 'loja')
        );
    END IF;
END $$;

-- Constraints UNIQUE para evitar duplicatas
DO $$ 
BEGIN
    -- Para benefícios oficiais
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'unique_cliente_beneficio_oficial'
    ) THEN
        CREATE UNIQUE INDEX unique_cliente_beneficio_oficial 
        ON clientes_beneficios (cliente_vip_id, beneficio_oficial_id) 
        WHERE beneficio_oficial_id IS NOT NULL;
    END IF;
    
    -- Para benefícios de loja
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'unique_cliente_beneficio_loja'
    ) THEN
        CREATE UNIQUE INDEX unique_cliente_beneficio_loja 
        ON clientes_beneficios (cliente_vip_id, beneficio_loja_id) 
        WHERE beneficio_loja_id IS NOT NULL;
    END IF;
END $$;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_cliente_vip_id ON clientes_beneficios(cliente_vip_id);
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_beneficio_oficial_id ON clientes_beneficios(beneficio_oficial_id);
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_beneficio_loja_id ON clientes_beneficios(beneficio_loja_id);
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_tipo ON clientes_beneficios(tipo);
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_ativo ON clientes_beneficios(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_data_alocacao ON clientes_beneficios(data_alocacao);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_clientes_beneficios_updated_at ON clientes_beneficios;
CREATE TRIGGER update_clientes_beneficios_updated_at 
    BEFORE UPDATE ON clientes_beneficios
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários na tabela
COMMENT ON TABLE clientes_beneficios IS 'Tabela de relacionamento para alocar benefícios específicos a clientes VIP específicos. Permite que admins selecionem quais benefícios cada cliente pode acessar.';

COMMENT ON COLUMN clientes_beneficios.ativo IS 'Permite desativar temporariamente um benefício alocado sem precisar remover o registro';
COMMENT ON COLUMN clientes_beneficios.alocado_por IS 'Usuário (admin) que alocou o benefício ao cliente';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'veiculos_cliente_vip') THEN
        RAISE NOTICE '✅ Tabela veiculos_cliente_vip criada com sucesso!';
    ELSE
        RAISE WARNING '❌ Erro ao criar tabela veiculos_cliente_vip';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes_beneficios') THEN
        RAISE NOTICE '✅ Tabela clientes_beneficios criada com sucesso!';
    ELSE
        RAISE WARNING '❌ Erro ao criar tabela clientes_beneficios';
    END IF;
END $$;

