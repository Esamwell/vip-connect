@echo off
setlocal enabledelayedexpansion

echo =====================================================
echo VERIFICACAO COMPLETA DO BANCO VIP-CONNECT
echo =====================================================
echo.

REM Configuracoes do banco
set PGPASSWORD=1923731sS$
set HOST=84.46.241.73
set PORT=5432
set DATABASE=vip_connect
set USER=postgres

echo 1. Testando conexao...
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT 'Conexao bem-sucedida: ' || current_database();" 2>nul
if errorlevel 1 (
    echo   ERRO: Falha na conexao com o banco de dados
    pause
    exit /b 1
)
echo.

echo 2. Verificando role 'vendedor'...
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT CASE WHEN COUNT(*) > 0 THEN 'Role vendedor: EXISTE' ELSE 'Role vendedor: NAO EXISTE' END FROM pg_enum WHERE enumlabel = 'vendedor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');" -t 2>nul
echo.

echo 3. Verificando tabelas de vendedores...
echo   vendedores:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'NOT FOUND' END FROM information_schema.tables WHERE table_name = 'vendedores' AND table_schema = 'public';" -t 2>nul
if not errorlevel 1 (
    psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) FROM vendedores;" -t -c "Registros:" 2>nul
)

echo   vouchers_vendedor:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'NOT FOUND' END FROM information_schema.tables WHERE table_name = 'vouchers_vendedor' AND table_schema = 'public';" -t 2>nul
if not errorlevel 1 (
    psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) FROM vouchers_vendedor;" -t -c "Registros:" 2>nul
)

echo   resgates_voucher_vendedor:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'NOT FOUND' END FROM information_schema.tables WHERE table_name = 'resgates_voucher_vendedor' AND table_schema = 'public';" -t 2>nul
if not errorlevel 1 (
    psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) FROM resgates_voucher_vendedor;" -t -c "Registros:" 2>nul
)

echo   premiacoes_ranking:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'NOT FOUND' END FROM information_schema.tables WHERE table_name = 'premiacoes_ranking' AND table_schema = 'public';" -t 2>nul
if not errorlevel 1 (
    psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) FROM premiacoes_ranking;" -t -c "Registros:" 2>nul
)

echo   premiacoes_recebidas:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'NOT FOUND' END FROM information_schema.tables WHERE table_name = 'premiacoes_recebidas' AND table_schema = 'public';" -t 2>nul
if not errorlevel 1 (
    psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) FROM premiacoes_recebidas;" -t -c "Registros:" 2>nul
)
echo.

echo 4. Verificando colunas vendedor_id...
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT table_name || '.' || column_name FROM information_schema.columns WHERE column_name = 'vendedor_id' AND table_schema = 'public' ORDER BY table_name;" -t 2>nul
echo.

echo 5. Verificando views de ranking...
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE '%%ranking%%' ORDER BY table_name;" -t 2>nul
echo.

echo 6. Verificando usuarios vendedores...
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT email || ' - ' || nome || ' - ' || CASE WHEN ativo THEN 'ATIVO' ELSE 'INATIVO' END FROM users WHERE role = 'vendedor' ORDER BY nome;" -t 2>nul
echo.

echo 7. Resumo final...
echo   Tabelas de vendedores:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) || '/5' FROM information_schema.tables WHERE table_name LIKE '%%vendedor%%' AND table_schema = 'public';" -t 2>nul

echo   Views de ranking:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) || '/2' FROM information_schema.views WHERE table_name LIKE '%%ranking%%' AND table_schema = 'public';" -t 2>nul

echo   Colunas vendedor_id:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'vendedor_id' AND table_schema = 'public';" -t 2>nul

echo   Usuarios vendedores:
psql -h %HOST% -p %PORT% -U %USER% -d %DATABASE% -c "SELECT COUNT(*) FROM users WHERE role = 'vendedor';" -t 2>nul
echo.

echo =====================================================
echo VERIFICACAO CONCLUIDA
echo =====================================================
echo.

REM Limpar variável de ambiente
set PGPASSWORD=

pause
