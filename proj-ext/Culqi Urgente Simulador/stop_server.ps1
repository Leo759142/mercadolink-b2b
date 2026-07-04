$ErrorActionPreference = "SilentlyContinue"

$server_process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

if ($server_process) {
    Write-Host "Deteniendo servidor en puerto 5000 (PID: $server_process)..." -ForegroundColor Red
    Stop-Process -Id $server_process -Force
    Write-Host "Servidor detenido." -ForegroundColor Green
} else {
    Write-Host "No hay servidor activo en puerto 5000." -ForegroundColor Yellow
}