# Arranca MercadoLink en perfil dev (detiene instancia previa en 8080).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

& (Join-Path $PSScriptRoot "stop-mercadolink.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$jar = Join-Path $root "target\mercadolink-b2b.jar"
if (-not (Test-Path $jar)) {
    Write-Host "JAR no encontrado. Compilando..."
    mvn -DskipTests package
}

$env:SPRING_PROFILES_ACTIVE = "dev"
Write-Host "Iniciando $jar (perfil dev)..."
java -jar $jar
