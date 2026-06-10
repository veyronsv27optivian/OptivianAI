Write-Host "=== Fixing OptivianAI dev environment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill port 5173
Write-Host ">> Killing process on port 5173..." -ForegroundColor Yellow
$portProcess = netstat -ano | Select-String ":5173"
if ($portProcess) {
    $processId = ($portProcess -split '\s+')[-1]
    if ($processId -and $processId -match '^\d+$') {
        taskkill /PID $processId /F 2>$null
        Write-Host "   Killed PID $processId" -ForegroundColor Green
    }
} else {
    Write-Host "   Port 5173 is free" -ForegroundColor Green
}

# Step 2: Check if electron binary exists
Write-Host ""
Write-Host ">> Checking Electron binary..." -ForegroundColor Yellow
$electronPath = "node_modules\electron\dist\electron.exe"
if (Test-Path $electronPath) {
    Write-Host "   Electron binary found" -ForegroundColor Green
} else {
    Write-Host "   Electron binary missing - reinstalling..." -ForegroundColor Yellow
    npm install electron@32.1.2
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Electron installed" -ForegroundColor Green
    } else {
        Write-Host "   Electron install failed. Try: npm install" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Done! Run 'npm run dev' to start ===" -ForegroundColor Cyan
