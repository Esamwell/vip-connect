-- =====================================================
-- SCRIPT PARA VERIFICAR E CORRIGIR TABELA CHAMADOS
-- Execute este script no banco de dados PostgreSQL
-- =====================================================

-- Verificar se a coluna veiculo_id existe na tabela chamados
DO $$ 
BEGIN
    -- Adicionar coluna veiculo_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chamados' 
        AND column_name = 'veiculo_id'
    ) THEN
        ALTER TABLE chamados 
        ADD COLUMN veiculo_id UUID REFERENCES veiculos_cliente_vip(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_chamados_veiculo_id ON chamados(veiculo_id);
        
        COMMENT ON COLUMN chamados.veiculo_id IS 'Veículo relacionado ao chamado de pós-venda';
        
        RAISE NOTICE '✅ Coluna veiculo_id adicionada à tabela chamados';
    ELSE
        RAISE NOTICE 'ℹ️  Coluna veiculo_id já existe na tabela chamados';
    END IF;
END $$;

-- Verificar estrutura da tabela chamados
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chamados'
ORDER BY ordinal_position;

-- Verificar se a tabela veiculos_cliente_vip existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'veiculos_cliente_vip')
        THEN '✅ Tabela veiculos_cliente_vip existe'
        ELSE '❌ Tabela veiculos_cliente_vip NÃO existe'
    END as status_veiculos;

-- Verificar se há chamados sem veiculo_id (deve ser NULL para chamados que não são de pós-venda)
SELECT 
    COUNT(*) as total_chamados,
    COUNT(veiculo_id) as chamados_com_veiculo,
    COUNT(*) - COUNT(veiculo_id) as chamados_sem_veiculo
FROM chamados;

