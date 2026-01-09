-- =====================================================
-- SCRIPT PARA ADICIONAR COLUNAS DE RESGATE NA TABELA CLIENTES_BENEFICIOS
-- Execute este script se a tabela já existe mas faltam as colunas de resgate
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
        RAISE NOTICE '✅ Coluna resgatado adicionada';
    ELSE
        RAISE NOTICE 'ℹ️  Coluna resgatado já existe';
    END IF;

    -- Adicionar coluna data_resgate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_beneficios' 
        AND column_name = 'data_resgate'
    ) THEN
        ALTER TABLE clientes_beneficios 
        ADD COLUMN data_resgate TIMESTAMP NULL;
        RAISE NOTICE '✅ Coluna data_resgate adicionada';
    ELSE
        RAISE NOTICE 'ℹ️  Coluna data_resgate já existe';
    END IF;

    -- Adicionar coluna resgatado_por (quem marcou como resgatado)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_beneficios' 
        AND column_name = 'resgatado_por'
    ) THEN
        ALTER TABLE clientes_beneficios 
        ADD COLUMN resgatado_por UUID REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Coluna resgatado_por adicionada';
    ELSE
        RAISE NOTICE 'ℹ️  Coluna resgatado_por já existe';
    END IF;
END $$;

-- Criar índices para melhor performance em consultas de benefícios resgatados
CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_resgatado 
ON clientes_beneficios(resgatado);

CREATE INDEX IF NOT EXISTS idx_clientes_beneficios_data_resgate 
ON clientes_beneficios(data_resgate);

-- Comentários nas colunas
COMMENT ON COLUMN clientes_beneficios.resgatado IS 'Indica se o benefício foi resgatado/inutilizado pelo cliente. Quando true, o benefício não pode mais ser usado.';
COMMENT ON COLUMN clientes_beneficios.data_resgate IS 'Data e hora em que o benefício foi resgatado/inutilizado';
COMMENT ON COLUMN clientes_beneficios.resgatado_por IS 'Usuário (admin/lojista) que marcou o benefício como resgatado';

-- Verificar se as colunas foram criadas
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clientes_beneficios' 
  AND column_name IN ('resgatado', 'data_resgate', 'resgatado_por')
ORDER BY column_name;

