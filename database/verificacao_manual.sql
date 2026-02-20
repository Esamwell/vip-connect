-- =====================================================
-- VERIFICAÇÃO MANUAL DO BANCO VIP-CONNECT
-- Copie e cole estes comandos no Beekeeper ou seu cliente PostgreSQL
-- =====================================================

-- 1. Verificar conexão e banco atual
SELECT '=== 1. INFORMAÇÕES DO BANCO ===' as info;
SELECT current_database() as banco_atual;
SELECT current_user() as usuario_atual;

-- 2. Verificar se role 'vendedor' existe
SELECT '=== 2. VERIFICANDO ROLE vendedor ===' as info;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Role vendedor EXISTE'
        ELSE '❌ Role vendedor NÃO EXISTE'
    END as status
FROM pg_enum 
WHERE enumlabel = 'vendedor' 
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- 3. Verificar todas as roles disponíveis
SELECT '=== 3. TODAS AS ROLES DISPONÍVEIS ===' as info;
SELECT enumlabel as role_disponivel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;

-- 4. Verificar tabelas de vendedores
SELECT '=== 4. VERIFICANDO TABELAS DE VENDEDORES ===' as info;
SELECT 
    table_name as nome_tabela,
    CASE 
        WHEN table_name IN ('vendedores', 'vouchers_vendedor', 'resgates_voucher_vendedor', 'premiacoes_ranking', 'premiacoes_recebidas') 
        THEN '✅ ESSENCIAL'
        ELSE 'OUTRA'
    END as tipo,
    CASE 
        WHEN table_name IN ('vendedores', 'vouchers_vendedor', 'resgates_voucher_vendedor', 'premiacoes_ranking', 'premiacoes_recebidas') 
        THEN '✅ EXISTE'
        ELSE '❌ NÃO ENCONTRADA'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%vendedor%' 
ORDER BY table_name;

-- 5. Verificar colunas vendedor_id
SELECT '=== 5. VERIFICANDO COLUNAS vendedor_id ===' as info;
SELECT 
    table_name as tabela,
    column_name as coluna,
    data_type as tipo_dado,
    '✅ EXISTE' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'vendedor_id'
ORDER BY table_name;

-- 6. Verificar views de ranking
SELECT '=== 6. VERIFICANDO VIEWS DE RANKING ===' as info;
SELECT 
    table_name as nome_view,
    CASE 
        WHEN table_name IN ('ranking_vendedores_vendas', 'ranking_vendedores_avaliacoes') 
        THEN '✅ ESSENCIAL'
        ELSE 'OUTRA'
    END as tipo,
    CASE 
        WHEN table_name IN ('ranking_vendedores_vendas', 'ranking_vendedores_avaliacoes') 
        THEN '✅ EXISTE'
        ELSE '❌ NÃO ENCONTRADA'
    END as status
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%ranking%'
ORDER BY table_name;

-- 7. Verificar usuários vendedores
SELECT '=== 7. VERIFICANDO USUÁRIOS VENDEDORES ===' as info;
SELECT 
    email,
    nome,
    CASE 
        WHEN ativo THEN 'ATIVO' 
        ELSE 'INATIVO' 
    END as status_usuario,
    created_at
FROM users 
WHERE role = 'vendedor' 
ORDER BY nome;

-- 8. Contar registros em tabelas de vendedores (se existirem)
SELECT '=== 8. CONTANDO REGISTROS ===' as info;

-- Verificar vendedores
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendedores') THEN
        RAISE NOTICE 'vendedores: % registros', (SELECT COUNT(*) FROM vendedores);
    ELSE
        RAISE NOTICE 'vendedores: TABELA NÃO EXISTE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vouchers_vendedor') THEN
        RAISE NOTICE 'vouchers_vendedor: % registros', (SELECT COUNT(*) FROM vouchers_vendedor);
    ELSE
        RAISE NOTICE 'vouchers_vendedor: TABELA NÃO EXISTE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resgates_voucher_vendedor') THEN
        RAISE NOTICE 'resgates_voucher_vendedor: % registros', (SELECT COUNT(*) FROM resgates_voucher_vendedor);
    ELSE
        RAISE NOTICE 'resgates_voucher_vendedor: TABELA NÃO EXISTE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premiacoes_ranking') THEN
        RAISE NOTICE 'premiacoes_ranking: % registros', (SELECT COUNT(*) FROM premiacoes_ranking);
    ELSE
        RAISE NOTICE 'premiacoes_ranking: TABELA NÃO EXISTE';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premiacoes_recebidas') THEN
        RAISE NOTICE 'premiacoes_recebidas: % registros', (SELECT COUNT(*) FROM premiacoes_recebidas);
    ELSE
        RAISE NOTICE 'premiacoes_recebidas: TABELA NÃO EXISTE';
    END IF;
END $$;

-- 9. Resumo final
SELECT '=== 9. RESUMO FINAL ===' as info;
SELECT 
    'Tabelas de vendedores' as item,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%vendedor%') as quantidade,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%vendedor%') = 5 THEN '✅ COMPLETO'
        ELSE '⚠️ INCOMPLETO'
    END as status
UNION ALL
SELECT 
    'Views de ranking' as item,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE '%ranking%') as quantidade,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE '%ranking%') = 2 THEN '✅ COMPLETO'
        ELSE '⚠️ INCOMPLETO'
    END as status
UNION ALL
SELECT 
    'Colunas vendedor_id' as item,
    (SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'vendedor_id') as quantidade,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'vendedor_id') > 0 THEN '✅ EXISTE'
        ELSE '❌ AUSENTE'
    END as status
UNION ALL
SELECT 
    'Usuários vendedores' as item,
    (SELECT COUNT(*) FROM users WHERE role = 'vendedor') as quantidade,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'vendedor') > 0 THEN '✅ EXISTE'
        ELSE '❌ AUSENTE'
    END as status;

-- 10. Recomendações
SELECT '=== 10. RECOMENDAÇÕES ===' as info;
SELECT 
    recommendation
FROM (
    SELECT 
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vendedor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) 
            THEN '⚠️ Execute: ALTER TYPE user_role ADD VALUE ''vendedor'';'
            ELSE NULL
        END as recommendation
    UNION ALL
    SELECT 
        CASE 
            WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%vendedor%') < 5
            THEN '⚠️ Execute o script executar_vendedores.sql'
            ELSE NULL
        END as recommendation
    UNION ALL
    SELECT 
        CASE 
            WHEN (SELECT COUNT(*) FROM users WHERE role = 'vendedor') = 0
            THEN '⚠️ Crie usuários vendedores para testar'
            ELSE NULL
        END as recommendation
    UNION ALL
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vendedor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role'))
            AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%vendedor%') = 5
            AND (SELECT COUNT(*) FROM users WHERE role = 'vendedor') > 0
            THEN '✅ Sistema pronto para usar! Faça login com usuário vendedor.'
            ELSE NULL
        END as recommendation
) rec
WHERE recommendation IS NOT NULL;

SELECT '=== VERIFICAÇÃO CONCLUÍDA ===' as info;
