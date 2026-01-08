-- =====================================================
-- SCRIPT PARA ADICIONAR CAMPOS DE RESGATE NA TABELA CLIENTES_BENEFICIOS
-- Execute este script no banco de dados PostgreSQL
-- =====================================================

-- Adicionar colunas de resgate se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna resgatado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_beneficios' 
        AND column_name = 'resgatado'
    ) THEN
        ALTER TABLE clientes_beneficios 
        ADD COLUMN resgatado BOOLEAN DEFAULT false;
    END IF;

    -- Adicionar coluna data_resgate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_beneficios' 
        AND column_name = 'data_resgate'
    ) THEN
        ALTER TABLE clientes_beneficios 
        ADD COLUMN data_resgate TIMESTAMP NULL;
    END IF;

    -- Adicionar coluna resgatado_por (quem marcou como resgatado)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_beneficios' 
        AND column_name = 'resgatado_por'
    ) THEN
        ALTER TABLE clientes_beneficios 
        ADD COLUMN resgatado_por UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar índice para melhor performance em consultas de benefícios resgatados
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_resgatado 
ON clientes_beneficios(resgatado);

CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_data_resgate 
ON clientes_beneficios(data_resgate);

-- Comentários nas colunas
COMMENT ON COLUMN clientes_beneficios.resgatado IS 'Indica se o benefício foi resgatado/inutilizado pelo cliente. Quando true, o benefício não pode mais ser usado.';
COMMENT ON COLUMN clientes_beneficios.data_resgate IS 'Data e hora em que o benefício foi resgatado/inutilizado';
COMMENT ON COLUMN clientes_beneficios.resgatado_por IS 'Usuário (admin/lojista) que marcou o benefício como resgatado';

-- =====================================================

