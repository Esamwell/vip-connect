-- =====================================================
-- QUERIES ÚTEIS - SISTEMA CLIENTE VIP
-- =====================================================

-- =====================================================
-- 1. CONSULTAS BÁSICAS
-- =====================================================

-- Buscar cliente VIP por QR Code (digital ou físico)
SELECT 
    cv.*,
    l.nome as loja_nome,
    l.telefone as loja_telefone
FROM clientes_vip cv
JOIN lojas l ON cv.loja_id = l.id
WHERE cv.qr_code_digital = 'VIP-XXXXXXXXXXXX' 
   OR cv.qr_code_fisico = 'FISICO-XXXXXXXXXXXX';

-- Buscar todos os benefícios disponíveis para um cliente VIP
-- (oficiais do shopping + benefícios da loja)
SELECT 
    'oficial' as tipo,
    bo.id,
    bo.nome,
    bo.descricao,
    p.nome as parceiro_nome
FROM beneficios_oficiais bo
JOIN parceiros p ON bo.parceiro_id = p.id
WHERE bo.ativo = true

UNION ALL

SELECT 
    'loja' as tipo,
    bl.id,
    bl.nome,
    bl.descricao,
    NULL as parceiro_nome
FROM beneficios_loja bl
JOIN clientes_vip cv ON bl.loja_id = cv.loja_id
WHERE bl.ativo = true
AND cv.id = 'UUID_DO_CLIENTE'
ORDER BY tipo, nome;

-- Buscar histórico de validações de um cliente
SELECT 
    vb.*,
    p.nome as parceiro_nome,
    bo.nome as beneficio_oficial_nome,
    bl.nome as beneficio_loja_nome
FROM validacoes_beneficios vb
LEFT JOIN parceiros p ON vb.parceiro_id = p.id
LEFT JOIN beneficios_oficiais bo ON vb.beneficio_oficial_id = bo.id
LEFT JOIN beneficios_loja bl ON vb.beneficio_loja_id = bl.id
WHERE vb.cliente_vip_id = 'UUID_DO_CLIENTE'
ORDER BY vb.data_validacao DESC;

-- =====================================================
-- 2. CONSULTAS PARA PARCEIROS
-- =====================================================

-- Validar cliente VIP por QR Code (para tela do parceiro)
SELECT 
    cv.id,
    cv.nome,
    cv.status,
    cv.data_validade,
    l.nome as loja_nome,
    -- Benefícios válidos neste parceiro
    ARRAY_AGG(DISTINCT bo.nome) FILTER (WHERE bo.id IS NOT NULL) as beneficios_oficiais,
    ARRAY_AGG(DISTINCT bl.nome) FILTER (WHERE bl.id IS NOT NULL) as beneficios_loja
FROM clientes_vip cv
JOIN lojas l ON cv.loja_id = l.id
LEFT JOIN beneficios_oficiais bo ON bo.parceiro_id = 'UUID_DO_PARCEIRO' AND bo.ativo = true
LEFT JOIN beneficios_loja bl ON bl.loja_id = cv.loja_id AND bl.ativo = true
WHERE cv.qr_code_digital = 'QR_CODE_AQUI'
   OR cv.qr_code_fisico = 'QR_CODE_AQUI'
GROUP BY cv.id, cv.nome, cv.status, cv.data_validade, l.nome;

-- Registrar validação de benefício (exemplo)
-- INSERT INTO validacoes_beneficios (
--     cliente_vip_id,
--     parceiro_id,
--     beneficio_oficial_id,
--     tipo,
--     codigo_qr
-- ) VALUES (
--     'UUID_CLIENTE',
--     'UUID_PARCEIRO',
--     'UUID_BENEFICIO',
--     'oficial',
--     'QR_CODE_USADO'
-- );

-- =====================================================
-- 3. CONSULTAS PARA LOJISTAS
-- =====================================================

-- Listar todos os clientes VIP de uma loja
SELECT 
    cv.*,
    COUNT(DISTINCT a.id) as total_avaliacoes,
    COALESCE(AVG(a.nota), 0) as nota_media_avaliacoes
FROM clientes_vip cv
LEFT JOIN avaliacoes a ON cv.id = a.cliente_vip_id
WHERE cv.loja_id = 'UUID_DA_LOJA'
GROUP BY cv.id
ORDER BY cv.data_ativacao DESC;

-- Chamados da loja
SELECT 
    c.*,
    cv.nome as cliente_nome,
    cv.whatsapp as cliente_whatsapp,
    u.nome as responsavel_nome
FROM chamados c
JOIN clientes_vip cv ON c.cliente_vip_id = cv.id
LEFT JOIN users u ON c.responsavel_id = u.id
WHERE c.loja_id = 'UUID_DA_LOJA'
ORDER BY c.created_at DESC;

-- Adicionar benefício para a loja
-- INSERT INTO beneficios_loja (
--     loja_id,
--     nome,
--     descricao,
--     tipo
-- ) VALUES (
--     'UUID_DA_LOJA',
--     'Lavagem Grátis',
--     'Lavagem completa grátis para clientes VIP',
--     'lavagem_gratis'
-- );

-- =====================================================
-- 4. CONSULTAS PARA RANKING
-- =====================================================

-- Ranking completo de lojas (público)
SELECT * FROM ranking_lojas
ORDER BY posicao_ranking;

-- Avaliações detalhadas de uma loja (apenas a loja vê suas próprias)
SELECT 
    a.*,
    cv.nome as cliente_nome,
    CASE 
        WHEN a.anonima = true THEN 'Anônimo'
        ELSE cv.nome
    END as nome_exibido
FROM avaliacoes a
JOIN clientes_vip cv ON a.cliente_vip_id = cv.id
WHERE a.loja_id = 'UUID_DA_LOJA'
ORDER BY a.created_at DESC;

-- =====================================================
-- 5. CONSULTAS PARA RELATÓRIOS
-- =====================================================

-- Total de Clientes VIP por mês e por loja
SELECT * FROM relatorio_clientes_vip_mes
WHERE mes >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
ORDER BY mes DESC, total_clientes DESC;

-- Uso de benefícios por parceiro
SELECT * FROM relatorio_uso_beneficios
WHERE mes >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
ORDER BY mes DESC, total_validacoes DESC;

-- Ranking das lojas
SELECT * FROM ranking_lojas
ORDER BY posicao_ranking;

-- Chamados de pós-venda por loja
SELECT * FROM relatorio_chamados_loja
WHERE mes >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
ORDER BY mes DESC, total_chamados DESC;

-- Clientes próximos do vencimento
SELECT * FROM relatorio_clientes_vencimento_proximo
ORDER BY dias_restantes ASC;

-- Clientes renovados / recompra
SELECT * FROM relatorio_clientes_renovados
WHERE data_renovacao >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY data_renovacao DESC;

-- =====================================================
-- 6. CONSULTAS PARA ADMIN
-- =====================================================

-- Dashboard geral
SELECT 
    (SELECT COUNT(*) FROM clientes_vip WHERE status = 'ativo') as total_vip_ativos,
    (SELECT COUNT(*) FROM clientes_vip WHERE status = 'vencido') as total_vip_vencidos,
    (SELECT COUNT(*) FROM chamados WHERE status = 'aberto') as chamados_abertos,
    (SELECT COUNT(*) FROM validacoes_beneficios WHERE DATE(data_validacao) = CURRENT_DATE) as validacoes_hoje,
    (SELECT COUNT(*) FROM clientes_vip WHERE data_validade BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as vencimentos_proximos;

-- Clientes VIP por loja (resumo)
SELECT 
    l.nome as loja,
    COUNT(cv.id) as total_clientes,
    COUNT(*) FILTER (WHERE cv.status = 'ativo') as ativos,
    COUNT(*) FILTER (WHERE cv.status = 'vencido') as vencidos,
    COUNT(*) FILTER (WHERE cv.potencial_recompra = true) as potencial_recompra
FROM lojas l
LEFT JOIN clientes_vip cv ON l.id = cv.loja_id
GROUP BY l.id, l.nome
ORDER BY total_clientes DESC;

-- =====================================================
-- 7. MANUTENÇÃO E ATUALIZAÇÕES
-- =====================================================

-- Executar verificação de vencimentos (rodar diariamente via cron)
SELECT verificar_vencimentos_proximos();

-- Atualizar status de clientes vencidos (rodar diariamente)
SELECT atualizar_status_vencidos();

-- Renovar VIP de um cliente
-- BEGIN;
-- 
-- -- Criar registro de renovação
-- INSERT INTO renovacoes (
--     cliente_vip_id,
--     loja_id,
--     nova_data_validade,
--     motivo
-- ) VALUES (
--     'UUID_CLIENTE',
--     'UUID_LOJA',
--     CURRENT_DATE + INTERVAL '12 months',
--     'Recompra'
-- );
-- 
-- -- Atualizar cliente VIP
-- UPDATE clientes_vip
-- SET 
--     status = 'renovado',
--     data_validade = CURRENT_DATE + INTERVAL '12 months',
--     data_renovacao = CURRENT_DATE,
--     potencial_recompra = false,
--     notificado_vencimento = false
-- WHERE id = 'UUID_CLIENTE';
-- 
-- -- Criar evento para webhook
-- INSERT INTO eventos_webhook (
--     tipo,
--     entidade_tipo,
--     entidade_id,
--     payload
-- ) VALUES (
--     'vip_renovado',
--     'cliente_vip',
--     'UUID_CLIENTE',
--     jsonb_build_object(
--         'cliente_id', 'UUID_CLIENTE',
--         'nova_data_validade', CURRENT_DATE + INTERVAL '12 months',
--         'motivo', 'Recompra'
--     )
-- );
-- 
-- COMMIT;

-- =====================================================
-- 8. CONSULTAS DE INTEGRAÇÃO (WEBHOOKS)
-- =====================================================

-- Buscar eventos pendentes para envio
SELECT * FROM eventos_webhook
WHERE enviado = false
ORDER BY created_at ASC
LIMIT 100;

-- Marcar evento como enviado
-- UPDATE eventos_webhook
-- SET 
--     enviado = true,
--     data_envio = CURRENT_TIMESTAMP
-- WHERE id = 'UUID_EVENTO';

-- Marcar evento como erro
-- UPDATE eventos_webhook
-- SET 
--     tentativas = tentativas + 1,
--     erro = 'Mensagem de erro aqui'
-- WHERE id = 'UUID_EVENTO';

-- =====================================================
-- 9. CONSULTAS DE SEGURANÇA E PERMISSÕES
-- =====================================================

-- Verificar permissões de um usuário
SELECT 
    u.id,
    u.email,
    u.role,
    u.nome,
    l.id as loja_id,
    l.nome as loja_nome,
    p.id as parceiro_id,
    p.nome as parceiro_nome
FROM users u
LEFT JOIN lojas l ON u.id = l.user_id
LEFT JOIN parceiros p ON u.id = p.user_id
WHERE u.id = 'UUID_USUARIO';

-- Listar lojistas e suas lojas
SELECT 
    u.id as user_id,
    u.nome as lojista_nome,
    u.email,
    l.id as loja_id,
    l.nome as loja_nome
FROM users u
JOIN lojas l ON u.id = l.user_id
WHERE u.role = 'lojista'
AND u.ativo = true;

-- Listar parceiros e seus benefícios
SELECT 
    p.id as parceiro_id,
    p.nome as parceiro_nome,
    p.tipo,
    COUNT(bo.id) as total_beneficios
FROM parceiros p
LEFT JOIN beneficios_oficiais bo ON p.id = bo.parceiro_id
WHERE p.ativo = true
GROUP BY p.id, p.nome, p.tipo;

