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

-- Migrar veículos existentes da tabela clientes_vip para o histórico
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
ON CONFLICT DO NOTHING;

