# ============================================================
# FrotaControl - Script de Deploy Automático
# VM: 192.168.0.108 (cca-dev) | Porta: 8080
# ============================================================

param(
    [string]$Server = "root@192.168.0.108",
    [string]$RemotePath = "/var/www/frotacontrol",
    [string]$Port = "8080"
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FrotaControl - Deploy Automatico" -ForegroundColor Cyan
Write-Host "  Servidor: $Server" -ForegroundColor Gray
Write-Host "  Porta: $Port" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build do projeto
Write-Host "[1/4] Fazendo build do projeto..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Build falhou!" -ForegroundColor Red
    exit 1
}
Write-Host "Build concluido com sucesso!" -ForegroundColor Green

# 2. Criar diretório remoto
Write-Host "[2/4] Preparando servidor..." -ForegroundColor Yellow
C:\Windows\System32\OpenSSH\ssh.exe -p $Port $Server "mkdir -p $RemotePath"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Nao foi possivel conectar ao servidor!" -ForegroundColor Red
    Write-Host "Verifique se a chave SSH esta configurada." -ForegroundColor Red
    exit 1
}

# 3. Enviar arquivos
Write-Host "[3/4] Enviando arquivos para o servidor..." -ForegroundColor Yellow
C:\Windows\System32\OpenSSH\scp.exe -P $Port -r ./dist/* "${Server}:${RemotePath}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao enviar arquivos!" -ForegroundColor Red
    exit 1
}
Write-Host "Arquivos enviados com sucesso!" -ForegroundColor Green

# 4. Reiniciar Nginx
Write-Host "[4/4] Reiniciando Nginx..." -ForegroundColor Yellow
C:\Windows\System32\OpenSSH\ssh.exe -p $Port $Server "sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || echo 'Nginx reload skipped'"
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "  Acesse: http://192.168.0.108:$Port" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
