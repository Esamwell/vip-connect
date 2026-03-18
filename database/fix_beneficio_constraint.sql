-- =====================================================
-- CORREÇÃO DA CONSTRAINT DA TABELA CLIENTES_BENEFICIOS
-- Permite que o tipo 'asi' seja salvo sem disparar Erro 500
-- =====================================================

DO $$
BEGIN
    -- 1. Remove a constraint anterior que só conhecia 'oficial' e 'loja'
    ALTER TABLE clientes_beneficios DROP CONSTRAINT IF EXISTS check_beneficio_tipo_preenchido;

    -- 2. Recria a constraint incluindo a validação do tipo 'asi' e o novo campo 'beneficio_asi_id'
    ALTER TABLE clientes_beneficios ADD CONSTRAINT check_beneficio_tipo_preenchido CHECK (
        (beneficio_oficial_id IS NOT NULL AND beneficio_loja_id IS NULL AND beneficio_asi_id IS NULL AND tipo = 'oficial') OR
        (beneficio_oficial_id IS NULL AND beneficio_loja_id IS NOT NULL AND beneficio_asi_id IS NULL AND tipo = 'loja') OR
        (beneficio_oficial_id IS NULL AND beneficio_loja_id IS NULL AND beneficio_asi_id IS NOT NULL AND tipo = 'asi')
    );
END $$;
