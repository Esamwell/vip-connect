# =====================================================
# Script para Reverter Segurança do PostgreSQL
# Execute como Administrador APÓS resetar a senha!
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Reverter Segurança do PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    pause
    exit
}

# Caminho do pg_hba.conf
$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"

# Verificar se o arquivo existe
if (-not (Test-Path $pgHbaPath)) {
    Write-Host "ERRO: Arquivo pg_hba.conf não encontrado em:" -ForegroundColor Red
    Write-Host $pgHbaPath -ForegroundColor Yellow
    pause
    exit
}

Write-Host "⚠️  ATENÇÃO: Este script vai restaurar a autenticação por senha." -ForegroundColor Yellow
Write-Host "Certifique-se de que você já alterou a senha do postgres!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Deseja continuar? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "[1/3] Parando o serviço PostgreSQL..." -ForegroundColor Yellow
try {
    Stop-Service postgresql-x64-17 -Force -ErrorAction Stop
    Start-Sleep -Seconds 2
    Write-Host "✓ Serviço parado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao parar o serviço: $_" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "[2/3] Restaurando método de autenticação para 'scram-sha-256'..." -ForegroundColor Yellow
try {
    $content = Get-Content $pgHbaPath -Raw
    
    # Substituir 'trust' por 'scram-sha-256' apenas nas linhas de host/local
    # Mantém comentários e outras linhas intactas
    $lines = Get-Content $pgHbaPath
    $newLines = @()
    
    foreach ($line in $lines) {
        if ($line -match '^\s*(host|local)\s+.*\s+trust\s*$') {
            $newLine = $line -replace '\strust\s*$', ' scram-sha-256'
            $newLines += $newLine
            Write-Host "  Alterado: $line" -ForegroundColor Gray
            Write-Host "  Para:     $newLine" -ForegroundColor Gray
        } else {
            $newLines += $line
        }
    }
    
    Set-Content $pgHbaPath -Value ($newLines -join "`r`n")
    Write-Host "✓ Arquivo pg_hba.conf restaurado" -ForegroundColor Green
    Write-Host "  ✓ Autenticação por senha restaurada" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao alterar arquivo: $_" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "[3/3] Iniciando o serviço PostgreSQL..." -ForegroundColor Yellow
try {
    Start-Service postgresql-x64-17
    Start-Sleep -Seconds 3
    Write-Host "✓ Serviço iniciado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao iniciar serviço: $_" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Segurança Restaurada!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ PostgreSQL está seguro novamente" -ForegroundColor Green
Write-Host "✓ Autenticação por senha está ativa" -ForegroundColor Green
Write-Host ""
Write-Host "Agora você pode conectar no Beekeeper com:" -ForegroundColor Yellow
Write-Host "  - User: postgres" -ForegroundColor White
Write-Host "  - Password: (a senha que você definiu)" -ForegroundColor White
Write-Host ""
Write-Host "E também com:" -ForegroundColor Yellow
Write-Host "  - User: clientvipasi" -ForegroundColor White
Write-Host "  - Password: 1923731sS$" -ForegroundColor White
Write-Host ""

pause

