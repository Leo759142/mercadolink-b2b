# Detiene procesos Java que usan el puerto 8080 (MercadoLink) para poder hacer mvn clean/package.
$connections = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if (-not $connections) {
    Write-Host "Puerto 8080 libre. No hay nada que detener."
    exit 0
}

$pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $pids) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Deteniendo PID $procId ($($proc.ProcessName))..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2
$still = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($still) {
    Write-Warning "El puerto 8080 sigue en uso. Cierra manualmente el proceso o reinicia el IDE."
    exit 1
}

Write-Host "Puerto 8080 liberado. Ya puedes ejecutar: mvn clean package -DskipTests"
