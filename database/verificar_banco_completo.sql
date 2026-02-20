-- =====================================================
-- VERIFICAÇÃO COMPLETA DO BANCO DE DADOS VIP-CONNECT
-- =====================================================

-- Configuração de visualização
SET search_path TO public;
\pset tuples_only on
\pset format wrapped

-- =====================================================
-- 1. VERIFICAR CONEXÃO E BANCO
-- =====================================================
SELECT '=== VERIFICAÇÃO DO BANCO DE DADOS ===' as info;
SELECT current_database() as banco_atual;
SELECT current_user() as usuario_atual;
SELECT version() as versao_postgresql;

-- =====================================================
-- 2. VERIFICAR SE O ENUM user_role TEM 'vendedor'
-- =====================================================
SELECT '=== VERIFICANDO ENUM user_role ===' as info;
SELECT enumlabel as role_disponivel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;

-- =====================================================
-- 3. VERIFICAR TODAS AS TABELAS DO BANCO
-- =====================================================
SELECT '=== TODAS AS TABELAS DO BANCO ===' as info;
SELECT 
    table_name as nome_tabela,
    table_type as tipo
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- 4. VERIFICAR TABELAS ESPECÍFICAS DE VENDEDORES
-- =====================================================
SELECT '=== VERIFICANDO TABELAS DE VENDEDORES ===' as info;
SELECT 
    table_name as nome_tabela,
    CASE 
        WHEN table_name IN ('vendedores', 'vouchers_vendedor', 'resgates_voucher_vendedor', 'premiacoes_ranking', 'premiacoes_recebidas') 
        THEN '✅ EXISTE'
        ELSE '❌ NÃO ENCONTRADA'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%vendedor%' 
ORDER BY table_name;

-- =====================================================
-- 5. VERIFICAR COLUNAS vendedor_id EM TABELAS EXISTENTES
-- =====================================================
SELECT '=== VERIFICANDO COLUNAS vendedor_id ===' as info;
SELECT 
    table_name as tabela,
    column_name as coluna,
    data_type as tipo_dado,
    CASE 
        WHEN column_name = 'vendedor_id' THEN '✅ EXISTE'
        ELSE '❌ NÃO ENCONTRADA'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'vendedor_id'
ORDER BY table_name;

-- =====================================================
-- 6. VERIFICAR VIEWS DE RANKING
-- =====================================================
SELECT '=== VERIFICANDO VIEWS DE RANKING ===' as info;
SELECT 
    table_name as nome_view,
    CASE 
        WHEN table_name IN ('ranking_vendedores_vendas', 'ranking_vendedores_avaliacoes') 
        THEN '✅ EXISTE'
        ELSE '❌ NÃO ENCONTRADA'
    END as status
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%ranking%'
ORDER BY table_name;

-- =====================================================
-- 7. VERIFICAR USUÁRIOS COM ROLE 'vendedor'
-- =====================================================
SELECT '=== VERIFICANDO USUÁRIOS VENDEDORES ===' as info;
SELECT 
    id,
    email,
    nome,
    role,
    ativo,
    CASE 
        WHEN role = 'vendedor' THEN '✅ VENDEDOR'
        ELSE 'OUTRA ROLE'
    END as tipo_usuario
FROM users 
WHERE role = 'vendedor' 
ORDER BY nome;

-- =====================================================
-- 8. VERIFICAR DADOS NAS TABELAS DE VENDEDORES (SE EXISTIREM)
-- =====================================================
SELECT '=== VERIFICANDO DADOS DAS TABELAS ===' as info;

-- Verificar vendedores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendedores') THEN
        RAISE NOTICE '=== TABELA VENDEDORES ===';
        PERFORM * FROM (
            SELECT 
                COUNT(*) as total_vendedores,
                COUNT(*) FILTER (WHERE ativo = true) as vendedores_ativos
            FROM vendedores
        ) s;
        
        PERFORM * FROM (
            SELECT 
                id,
                nome,
                codigo_vendedor,
                ativo,
                created_at
            FROM vendedores 
            ORDER BY created_at DESC 
            LIMIT 5
        ) s;
    ELSE
        RAISE NOTICE '❌ Tabela vendedores não existe';
    END IF;
END $$;

-- Verificar vouchers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vouchers_vendedor') THEN
        RAISE NOTICE '=== TABELA VOUCHERS_VENDEDOR ===';
        PERFORM * FROM (
            SELECT 
                COUNT(*) as total_vouchers,
                COUNT(*) FILTER (WHERE ativo = true) as vouchers_ativos
            FROM vouchers_vendedor
        ) s;
    ELSE
        RAISE NOTICE '❌ Tabela vouchers_vendedor não existe';
    END IF;
END $$;

-- =====================================================
-- 9. VERIFICAR ÍNDICES DAS TABELAS DE VENDEDORES
-- =====================================================
SELECT '=== VERIFICANDO ÍNDICES ===' as info;
SELECT 
    schemaname as esquema,
    tablename as tabela,
    indexname as indice,
    indexdef as definicao
FROM pg_indexes 
WHERE tablename IN ('vendedores', 'vouchers_vendedor', 'resgates_voucher_vendedor', 'premiacoes_ranking', 'premiacoes_recebidas')
ORDER BY tablename, indexname;

-- =====================================================
-- 10. VERIFICAR FUNÇÕES E TRIGGERS
-- =====================================================
SELECT '=== VERIFICANDO FUNÇÕES ===' as info;
SELECT 
    proname as nome_funcao,
    pronargs as num_argumentos,
    prosrc as codigo_fonte
FROM pg_proc 
WHERE proname LIKE '%vendedor%' 
ORDER BY proname;

SELECT '=== VERIFICANDO TRIGGERS ===' as info;
SELECT 
    event_object_table as tabela,
    trigger_name as gatilho,
    action_condition as condicao,
    action_statement as acao
FROM information_schema.triggers 
WHERE event_object_table LIKE '%vendedor%'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 11. RESUMO FINAL
-- =====================================================
SELECT '=== RESUMO FINAL ===' as info;
SELECT 
    'Tabelas de vendedores' as item,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%vendedor%') as quantidade
UNION ALL
SELECT 
    'Views de ranking' as item,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE '%ranking%') as quantidade
UNION ALL
SELECT 
    'Colunas vendedor_id' as item,
    (SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'vendedor_id') as quantidade
UNION ALL
SELECT 
    'Usuários vendedores' as item,
    (SELECT COUNT(*) FROM users WHERE role = 'vendedor') as quantidade;

SELECT '=== VERIFICAÇÃO CONCLUÍDA ===' as info;
SELECT current_timestamp as data_hora_verificacao;
