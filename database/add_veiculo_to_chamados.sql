-- Adicionar campo veiculo_id na tabela chamados para relacionar chamados com veículos
ALTER TABLE chamados 
ADD COLUMN IF NOT EXISTS veiculo_id UUID REFERENCES veiculos_cliente_vip(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_chamados_veiculo_id ON chamados(veiculo_id);

-- Comentário na coluna
COMMENT ON COLUMN chamados.veiculo_id IS 'Veículo relacionado ao chamado de pós-venda';

