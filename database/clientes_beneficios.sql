-- =====================================================
-- TABELA DE RELACIONAMENTO: CLIENTES BENEFÍCIOS
-- Permite alocar benefícios específicos a clientes específicos
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

-- Constraint: Evitar duplicatas (mesmo benefício alocado duas vezes ao mesmo cliente)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_cliente_beneficio_oficial'
    ) THEN
        CREATE UNIQUE INDEX unique_cliente_beneficio_oficial 
        ON clientes_beneficios (cliente_vip_id, beneficio_oficial_id) 
        WHERE beneficio_oficial_id IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_cliente_beneficio_loja'
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
CREATE TRIGGER update_clientes_beneficios_updated_at 
    BEFORE UPDATE ON clientes_beneficios
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentário na tabela
COMMENT ON TABLE clientes_beneficios IS 'Tabela de relacionamento para alocar benefícios específicos a clientes VIP específicos. Permite que admins selecionem quais benefícios cada cliente pode acessar.';

COMMENT ON COLUMN clientes_beneficios.ativo IS 'Permite desativar temporariamente um benefício alocado sem precisar remover o registro';
COMMENT ON COLUMN clientes_beneficios.alocado_por IS 'Usuário (admin) que alocou o benefício ao cliente';
COMMENT ON COLUMN clientes_beneficios.tipo IS 'Tipo do benefício: oficial ou loja';
