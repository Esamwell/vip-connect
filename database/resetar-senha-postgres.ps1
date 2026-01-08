# =====================================================
# Script para Resetar Senha do PostgreSQL
# Execute como Administrador!
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resetar Senha do PostgreSQL" -ForegroundColor Cyan
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
    Write-Host ""
    Write-Host "Por favor, verifique o caminho do PostgreSQL." -ForegroundColor Yellow
    pause
    exit
}

Write-Host "[1/6] Parando o serviço PostgreSQL..." -ForegroundColor Yellow
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
Write-Host "[2/6] Fazendo backup do pg_hba.conf..." -ForegroundColor Yellow
try {
    $backupPath = "$pgHbaPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $pgHbaPath $backupPath -Force
    Write-Host "✓ Backup criado em: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao criar backup: $_" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "[3/6] Alterando método de autenticação para 'trust' (temporário)..." -ForegroundColor Yellow
try {
    $content = Get-Content $pgHbaPath -Raw
    $content = $content -replace 'scram-sha-256', 'trust'
    $content = $content -replace 'md5', 'trust'
    $content = $content -replace 'password', 'trust'
    Set-Content $pgHbaPath -Value $content -NoNewline
    Write-Host "✓ Arquivo pg_hba.conf alterado" -ForegroundColor Green
    Write-Host "  ⚠️  ATENÇÃO: Autenticação está em modo 'trust' (sem senha)" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Erro ao alterar arquivo: $_" -ForegroundColor Red
    Write-Host "  Tente abrir o arquivo manualmente como Administrador" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "[4/6] Iniciando o serviço PostgreSQL..." -ForegroundColor Yellow
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
Write-Host "  Próximos Passos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora você pode conectar sem senha!" -ForegroundColor Green
Write-Host ""
Write-Host "1. Abra um novo PowerShell (não precisa ser admin)" -ForegroundColor Yellow
Write-Host "2. Execute o comando abaixo para conectar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres -h localhost -p 5433 -d postgres" -ForegroundColor White
Write-Host ""
Write-Host "3. Dentro do psql, execute:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ALTER USER postgres WITH PASSWORD 'sua_nova_senha_aqui';" -ForegroundColor White
Write-Host "   CREATE USER clientvipasi WITH PASSWORD '1923731sS$';" -ForegroundColor White
Write-Host "   ALTER USER clientvipasi CREATEDB;" -ForegroundColor White
Write-Host "   \q" -ForegroundColor White
Write-Host ""
Write-Host "4. Depois de alterar a senha, execute o script 'reverter-seguranca-postgres.ps1'" -ForegroundColor Yellow
Write-Host "   para restaurar a segurança do PostgreSQL" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

pause

