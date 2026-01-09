-- Atualizar view para incluir dados do veículo
-- É necessário fazer DROP primeiro porque estamos mudando a estrutura das colunas
DROP VIEW IF EXISTS relatorio_clientes_renovados CASCADE;

CREATE VIEW relatorio_clientes_renovados AS
SELECT 
    r.id as renovacao_id,
    r.cliente_vip_id,
    cv.nome as cliente_nome,
    cv.whatsapp,
    r.loja_id,
    l.nome as loja_nome,
    r.data_renovacao,
    r.nova_data_validade as data_validade,
    r.motivo,
    cv.potencial_recompra,
    cv.veiculo_marca,
    cv.veiculo_modelo,
    cv.veiculo_ano,
    cv.veiculo_placa
FROM renovacoes r
JOIN clientes_vip cv ON r.cliente_vip_id = cv.id
JOIN lojas l ON r.loja_id = l.id
ORDER BY r.data_renovacao DESC;

