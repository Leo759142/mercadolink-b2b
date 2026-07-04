$ErrorActionPreference = "SilentlyContinue"

$server_process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

if ($server_process) {
    Write-Host "Cerrando servidor existente en puerto 5000..." -ForegroundColor Yellow
    Stop-Process -Id $server_process -Force
}

Write-Host "Iniciando servidor Culqi en http://localhost:5000..." -ForegroundColor Green
python "$PSScriptRoot\server.py"