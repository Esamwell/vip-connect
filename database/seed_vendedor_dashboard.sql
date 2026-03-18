-- =====================================================
-- POPULAR DADOS FALSOS PARA DASHBOARD DO VENDEDOR
-- Script de Seed (Injeta Metas, Prêmios, Avaliações e Vendas)
-- =====================================================

DO $$
DECLARE
    v_loja_id UUID;
    v_vendedor_id UUID;
    v_cliente_id UUID;
BEGIN
    RAISE NOTICE 'Iniciando Seed de Dados de Vendedor...';

    -- 1. Garante pelo menos uma loja para usar
    SELECT id INTO v_loja_id FROM lojas LIMIT 1;
    IF v_loja_id IS NULL THEN
        RAISE NOTICE 'Nenhuma loja encontrada, criando loja padrão...';
        INSERT INTO lojas (nome, cnpj, ativo) VALUES ('Loja Teste VIP', '00000000000000', true) RETURNING id INTO v_loja_id;
    END IF;

    -- 2. Atualizar ou Criar Vendedor Padrão com Metas Fixas
    SELECT id INTO v_vendedor_id FROM vendedores LIMIT 1;
    
    IF v_vendedor_id IS NULL THEN
        RAISE NOTICE 'Nenhum vendedor encontrado. Crie um Vendedor pelo Dashboard Admin primeiro e rode as vendas novamente.';
    ELSE
        -- Fixar as metas do Vendedor ID Encontrado para gerar progresso na tela "Metas"
        RAISE NOTICE 'Vendedor encontrado: Atualizando Metas do Vendedor...';
        UPDATE vendedores SET meta_vendas = 10, meta_vendas_valor = 50000.00 WHERE id = v_vendedor_id;
    END IF;

    -- 3. Criar Pelo Menos um Cliente VIP para usar como Mock (se não tiver)
    SELECT id INTO v_cliente_id FROM clientes_vip LIMIT 1;
    IF v_cliente_id IS NULL THEN
        INSERT INTO clientes_vip (
            loja_id, nome, whatsapp, data_venda, data_validade, status, qr_code_digital
        ) VALUES (
            v_loja_id, 'Cliente Fictício', '5511999999999', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'ativo', 'FAKE-QR-CODE'
        ) RETURNING id INTO v_cliente_id;
    END IF;

    -- 4. Inserir Premiação Padrão (Premiações Disponíveis)
    IF NOT EXISTS (SELECT 1 FROM premiacoes_ranking WHERE nome = 'Rei das Vendas - Mensal') THEN
        RAISE NOTICE 'Criando Premiação de Vendas (Ranking 1º Lugar)...';
        INSERT INTO premiacoes_ranking (nome, descricao, tipo, posicao_minima, posicao_maxima, premio, valor_premio)
        VALUES ('Rei das Vendas - Mensal', 'Premiação para o vendedor número 1 em vendas no mês', 'vendas', 1, 1, 'Vale Compras', 500.00);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM premiacoes_ranking WHERE nome = 'Estrela de Prata - Avaliações') THEN
        RAISE NOTICE 'Criando Premiação de Avaliações (Ranking Top 3)...';
        INSERT INTO premiacoes_ranking (nome, descricao, tipo, posicao_minima, posicao_maxima, premio, valor_premio)
        VALUES ('Estrela de Prata', 'Premiação para quem fica entre os 3 melhores avaliados do mês', 'avaliacoes', 1, 3, 'Kit VIP', 100.00);
    END IF;

    -- 5. Se tivermos vendedor e cliente, criar Vendas Falsas neste mês para acionar "Metas" e "Ranking"
    IF v_vendedor_id IS NOT NULL AND v_cliente_id IS NOT NULL THEN
        RAISE NOTICE 'Injetando 3 Vendas Fake para Hoje...';
        INSERT INTO vendas (loja_id, vendedor_id, cliente_vip_id, nome, whatsapp, data_venda, valor)
        VALUES 
            (v_loja_id, v_vendedor_id, v_cliente_id, 'José da Silva (Fake)', '5511988887777', CURRENT_DATE, 15000.00),
            (v_loja_id, v_vendedor_id, v_cliente_id, 'Maria de Fátima (Fake)', '5511977776666', CURRENT_DATE, 5500.00),
            (v_loja_id, v_vendedor_id, v_cliente_id, 'Carlos Roberto (Fake)', '5511966665555', CURRENT_DATE, 20300.00);

        RAISE NOTICE 'Injetando 2 Avaliações Fake (Media positiva)...';
        BEGIN
            INSERT INTO avaliacoes (loja_id, cliente_vip_id, vendedor_id, nota, comentario)
            VALUES 
                (v_loja_id, v_cliente_id, v_vendedor_id, 10, 'Excelente atendimento, super rápido.'),
                (v_loja_id, v_cliente_id, v_vendedor_id, 8, 'Muito bom, mas a fila do caixa demorou.');
                
            -- Limpando Conflitos que ocorrem por causa do UNIQUE(vendedor_id, loja_id, cliente_vip_id) em Avaliacoes
            -- Ignorando falhas de Duplicação caso rode 2x
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'As avaliações já estavam populadas, pulando inserção de Fake Avaliações...';
        END;
    END IF;

    RAISE NOTICE '=========== SEED CONCLUÍDO ===========';
END $$;
