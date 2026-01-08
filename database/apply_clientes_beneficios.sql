-- =====================================================
-- SCRIPT PARA APLICAR TABELA CLIENTES_BENEFICIOS
-- Execute este script no banco de dados PostgreSQL
-- =====================================================

-- Tabela para relacionar clientes VIP com benefícios (oficiais ou de loja)
-- Esta tabela permite alocar benefícios específicos a clientes específicos
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

-- Constraints UNIQUE para evitar duplicatas (mesmo benefício alocado duas vezes ao mesmo cliente)
-- Usamos índices únicos parciais que funcionam como constraints
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

-- Comentários na tabela e colunas
COMMENT ON TABLE clientes_beneficios IS 'Tabela de relacionamento para alocar benefícios específicos a clientes VIP específicos. Permite que admins selecionem quais benefícios cada cliente pode acessar. Quando um cliente tem benefícios alocados, apenas eles aparecem. Caso contrário, aparecem todos os benefícios oficiais + benefícios da loja do cliente.';

COMMENT ON COLUMN clientes_beneficios.ativo IS 'Permite desativar temporariamente um benefício alocado sem precisar remover o registro';
COMMENT ON COLUMN clientes_beneficios.alocado_por IS 'Usuário (admin) que alocou o benefício ao cliente';
COMMENT ON COLUMN clientes_beneficios.tipo IS 'Tipo do benefício: oficial ou loja';
COMMENT ON COLUMN clientes_beneficios.data_alocacao IS 'Data em que o benefício foi alocado ao cliente';

-- =====================================================
-- ANÁLISE DO FUNCIONAMENTO:
-- =====================================================
-- 
-- 1. BENEFÍCIOS OFICIAIS (beneficios_oficiais):
--    - São criados pelos admins e vinculados a um parceiro
--    - Por padrão, aparecem para TODOS os clientes VIP
--    - Podem ser alocados especificamente a clientes individuais via clientes_beneficios
--
-- 2. BENEFÍCIOS DE LOJA (beneficios_loja):
--    - São criados por lojistas e vinculados a uma loja específica
--    - Por padrão, aparecem para TODOS os clientes VIP daquela loja
--    - Podem ser alocados especificamente a clientes individuais via clientes_beneficios
--
-- 3. LÓGICA DE EXIBIÇÃO:
--    - Se um cliente TEM benefícios alocados na tabela clientes_beneficios:
--      → Mostra APENAS os benefícios alocados especificamente para ele
--    - Se um cliente NÃO TEM benefícios alocados:
--      → Mostra TODOS os benefícios oficiais (para todos)
--      → Mostra TODOS os benefícios da loja do cliente (para clientes daquela loja)
--
-- 4. VALIDAÇÃO DE BENEFÍCIOS (validacoes_beneficios):
--    - Registra quando um parceiro valida/resgata um benefício
--    - Funciona independentemente da tabela clientes_beneficios
--    - O parceiro pode validar qualquer benefício que o cliente tenha acesso
--
-- =====================================================

