# =====================================================
# VERIFICAÇÃO COMPLETA DO BANCO VIP-CONNECT
# Script PowerShell para conectar ao PostgreSQL
# =====================================================

Write-Host "🔍 Iniciando verificação completa do banco VIP-Connect..." -ForegroundColor Green
Write-Host ""

# Configurações do banco
$host = "84.46.241.73"
$port = "5432"
$database = "vip_connect"
$user = "postgres"
$password = "1923731sS$"

# Caminho do psql (ajuste se necessário)
$psqlPath = "psql"

# Função para executar comandos SQL
function Execute-SQL($sql, $description) {
    Write-Host "=== $description ===" -ForegroundColor Cyan
    try {
        $env:PGPASSWORD = $password
        $result = & $psqlPath -h $host -p $port -U $user -d $database -c $sql -t --no-align 2>$null
        if ($LASTEXITCODE -eq 0) {
            $result | ForEach-Object { if ($_ -and $_.Trim()) { Write-Host "  $_" -ForegroundColor White } }
        } else {
            Write-Host "  ❌ Erro ao executar comando" -ForegroundColor Red
        }
        $env:PGPASSWORD = $null
    } catch {
        Write-Host "  ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 1. Verificar conexão
Write-Host "=== 1. TESTANDO CONEXÃO ===" -ForegroundColor Cyan
try {
    $env:PGPASSWORD = $password
    $testResult = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT current_database();" -t --no-align 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Conexão bem-sucedida!" -ForegroundColor Green
        Write-Host "  Banco: $testResult" -ForegroundColor White
    } else {
        Write-Host "  ❌ Falha na conexão" -ForegroundColor Red
        exit 1
    }
    $env:PGPASSWORD = $null
} catch {
    Write-Host "  ❌ Erro na conexão: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Verificar roles
Execute-SQL "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') ORDER BY enumlabel;" "2. ROLES DISPONÍVEIS"

# 3. Verificar se role 'vendedor' existe
Write-Host "=== 3. VERIFICANDO ROLE 'vendedor' ===" -ForegroundColor Cyan
try {
    $env:PGPASSWORD = $password
    $vendedorRole = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT COUNT(*) FROM pg_enum WHERE enumlabel = 'vendedor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');" -t --no-align 2>$null
    if ($LASTEXITCODE -eq 0 -and $vendedorRole -eq "1") {
        Write-Host "  ✅ Role 'vendedor' existe!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Role 'vendedor' NÃO existe" -ForegroundColor Red
    }
    $env:PGPASSWORD = $null
} catch {
    Write-Host "  ❌ Erro ao verificar role" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar tabelas de vendedores
Write-Host "=== 4. VERIFICANDO TABELAS DE VENDEDORES ===" -ForegroundColor Cyan
$vendedorTables = @('vendedores', 'vouchers_vendedor', 'resgates_voucher_vendedor', 'premiacoes_ranking', 'premiacoes_recebidas')

foreach ($table in $vendedorTables) {
    try {
        $env:PGPASSWORD = $password
        $exists = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table' AND table_schema = 'public';" -t --no-align 2>$null
        if ($LASTEXITCODE -eq 0 -and $exists -eq "1") {
            Write-Host "  ✅ $table" -ForegroundColor Green
            
            # Contar registros
            $count = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT COUNT(*) FROM $table;" -t --no-align 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "     Registros: $count" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ❌ $table (NÃO ENCONTRADA)" -ForegroundColor Red
        }
        $env:PGPASSWORD = $null
    } catch {
        Write-Host "  ❌ Erro ao verificar $table" -ForegroundColor Red
    }
}
Write-Host ""

# 5. Verificar colunas vendedor_id
Write-Host "=== 5. VERIFICANDO COLUNAS vendedor_id ===" -ForegroundColor Cyan
try {
    $env:PGPASSWORD = $password
    $columns = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT table_name, column_name FROM information_schema.columns WHERE column_name = 'vendedor_id' AND table_schema = 'public' ORDER BY table_name;" -t --no-align 2>$null
    if ($LASTEXITCODE -eq 0) {
        if ($columns) {
            $columns | ForEach-Object { 
                $parts = $_ -split '\|'
                Write-Host "  ✅ $($parts[0]).$($parts[1])" -ForegroundColor Green
            }
        } else {
            Write-Host "  ❌ Nenhuma coluna vendedor_id encontrada" -ForegroundColor Red
        }
    }
    $env:PGPASSWORD = $null
} catch {
    Write-Host "  ❌ Erro ao verificar colunas" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar views de ranking
Write-Host "=== 6. VERIFICANDO VIEWS DE RANKING ===" -ForegroundColor Cyan
try {
    $env:PGPASSWORD = $password
    $views = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE '%ranking%' ORDER BY table_name;" -t --no-align 2>$null
    if ($LASTEXITCODE -eq 0) {
        if ($views) {
            $views | ForEach-Object { Write-Host "  ✅ $_" -ForegroundColor Green }
        } else {
            Write-Host "  ❌ Nenhuma view de ranking encontrada" -ForegroundColor Red
        }
    }
    $env:PGPASSWORD = $null
} catch {
    Write-Host "  ❌ Erro ao verificar views" -ForegroundColor Red
}
Write-Host ""

# 7. Verificar usuários vendedores
Write-Host "=== 7. VERIFICANDO USUÁRIOS VENDEDORES ===" -ForegroundColor Cyan
try {
    $env:PGPASSWORD = $password
    $vendedores = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT email, nome, ativo FROM users WHERE role = 'vendedor' ORDER BY nome;" -t --no-align 2>$null
    if ($LASTEXITCODE -eq 0) {
        if ($vendedores) {
            Write-Host "  Usuários vendedores encontrados:" -ForegroundColor Gray
            $vendedores | ForEach-Object { 
                $parts = $_ -split '\|'
                $status = if ($parts[2] -eq "t") { "Ativo" } else { "Inativo" }
                Write-Host "  ✅ $($parts[1]) ($($parts[0])) - $status" -ForegroundColor Green
            }
        } else {
            Write-Host "  ❌ Nenhum usuário vendedor encontrado" -ForegroundColor Red
        }
    }
    $env:PGPASSWORD = $null
} catch {
    Write-Host "  ❌ Erro ao verificar usuários" -ForegroundColor Red
}
Write-Host ""

# 8. Resumo final
Write-Host "=== 8. RESUMO FINAL ===" -ForegroundColor Yellow
Write-Host ""

# Contar totais
$env:PGPASSWORD = $password
$totalTables = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE '%vendedor%' AND table_schema = 'public';" -t --no-align 2>$null
$totalViews = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE '%ranking%' AND table_schema = 'public';" -t --no-align 2>$null
$totalColumns = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'vendedor_id' AND table_schema = 'public';" -t --no-align 2>$null
$totalUsers = & $psqlPath -h $host -p $port -U $user -d $database -c "SELECT COUNT(*) FROM users WHERE role = 'vendedor';" -t --no-align 2>$null
$env:PGPASSWORD = $null

Write-Host "📊 Estatísticas:" -ForegroundColor White
Write-Host "  • Tabelas de vendedores: $totalTables/5" -ForegroundColor $(if ($totalTables -eq "5") { "Green" } else { "Yellow" })
Write-Host "  • Views de ranking: $totalViews/2" -ForegroundColor $(if ($totalViews -eq "2") { "Green" } else { "Yellow" })
Write-Host "  • Colunas vendedor_id: $totalColumns" -ForegroundColor $(if ($totalColumns -gt "0") { "Green" } else { "Yellow" })
Write-Host "  • Usuários vendedores: $totalUsers" -ForegroundColor $(if ($totalUsers -gt "0") { "Green" } else { "Yellow" })
Write-Host ""

# Recomendações
Write-Host "💡 RECOMENDAÇÕES:" -ForegroundColor Cyan
if ($vendedorRole -ne "1") {
    Write-Host "  ⚠️  Execute o script para adicionar a role 'vendedor'" -ForegroundColor Yellow
}
if ($totalTables -ne "5") {
    Write-Host "  ⚠️  Execute o script executar_vendedores.sql para criar as tabelas" -ForegroundColor Yellow
}
if ($totalUsers -eq "0") {
    Write-Host "  ⚠️  Crie usuários vendedores para testar o sistema" -ForegroundColor Yellow
}

if ($vendedorRole -eq "1" -and $totalTables -eq "5" -and $totalUsers -gt "0") {
    Write-Host "  ✅ Sistema de vendedores parece estar completo!" -ForegroundColor Green
    Write-Host "  🚀 Você pode fazer login com um usuário vendedor e acessar /vendedor/dashboard" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Verificação concluída!" -ForegroundColor Green
