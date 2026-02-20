-- =====================================================
-- ADICIONAR vendedor_id NA TABELA clientes_vip
-- Vincula o cliente VIP ao vendedor que realizou a venda
-- =====================================================

-- 1. Adicionar coluna vendedor_id na tabela clientes_vip
ALTER TABLE clientes_vip 
ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL;

-- 2. Criar índice para vendedor_id
CREATE INDEX IF NOT EXISTS idx_clientes_vip_vendedor_id ON clientes_vip(vendedor_id);

-- 3. Comentário na coluna
COMMENT ON COLUMN clientes_vip.vendedor_id IS 'Vendedor que cadastrou/vendeu para este cliente VIP';
