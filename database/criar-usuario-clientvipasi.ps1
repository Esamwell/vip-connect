# =====================================================
# Script para Criar Usuário clientvipasi
# Execute APÓS resetar a senha do postgres
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Criar Usuário clientvipasi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar senha do postgres
Write-Host "Para criar o usuário, precisamos da senha do postgres." -ForegroundColor Yellow
Write-Host ""
$postgresPassword = Read-Host "Digite a senha do postgres" -AsSecureString
$postgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
)

Write-Host ""
Write-Host "Criando usuário clientvipasi..." -ForegroundColor Yellow

# Caminho do psql
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Comandos SQL
$sqlCommands = @"
-- Criar o usuário clientvipasi
CREATE USER clientvipasi WITH PASSWORD '1923731sS$';

-- Dar permissões
ALTER USER clientvipasi CREATEDB;
"@

# Salvar comandos em arquivo temporário
$tempFile = [System.IO.Path]::GetTempFileName()
$sqlCommands | Out-File -FilePath $tempFile -Encoding UTF8

try {
    # Definir variável de ambiente para senha
    $env:PGPASSWORD = $postgresPasswordPlain
    
    # Executar comandos
    $result = & $psqlPath -U postgres -h localhost -p 5433 -d postgres -f $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Usuário clientvipasi criado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Verificando usuários..." -ForegroundColor Yellow
        
        # Listar usuários
        $users = & $psqlPath -U postgres -h localhost -p 5433 -d postgres -c "\du" 2>&1
        Write-Host $users
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Pronto!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Agora você pode conectar no Beekeeper com:" -ForegroundColor Yellow
        Write-Host "  - User: clientvipasi" -ForegroundColor White
        Write-Host "  - Password: 1923731sS$" -ForegroundColor White
        Write-Host "  - Port: 5433" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "✗ Erro ao criar usuário:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        
        if ($result -match "already exists") {
            Write-Host ""
            Write-Host "O usuário já existe. Deseja alterar a senha?" -ForegroundColor Yellow
            $alterar = Read-Host "Alterar senha? (S/N)"
            if ($alterar -eq "S" -or $alterar -eq "s") {
                $alterSql = "ALTER USER clientvipasi WITH PASSWORD '1923731sS$';"
                $alterSql | Out-File -FilePath $tempFile -Encoding UTF8
                & $psqlPath -U postgres -h localhost -p 5433 -d postgres -f $tempFile 2>&1
                Write-Host "✓ Senha do usuário clientvipasi atualizada!" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
} finally {
    # Limpar
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
pause

