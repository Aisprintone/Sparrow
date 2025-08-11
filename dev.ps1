# FinanceAI Local Demo Startup Script - Windows PowerShell
# Usage: powershell -ExecutionPolicy Bypass -File .\dev.ps1

Write-Host "🚀 FinanceAI Local Demo Startup" -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to find available port
function Find-AvailablePort {
    $ports = @(3000, 3001, 3002, 3003)
    foreach ($port in $ports) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        if (-not $connection) {
            return $port
        }
    }
    return 3000  # fallback
}

# Function to test HTTP endpoint
function Test-HttpEndpoint($url, $expectedContent = $null, $timeout = 5) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec $timeout -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            if ($expectedContent -and $response.Content -notlike "*$expectedContent*") {
                return $false
            }
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Cleanup function
function Stop-Services {
    Write-Host "`n🧹 Cleaning up background processes..." -ForegroundColor Yellow
    if ($global:BackendProcess) {
        Stop-Process -Id $global:BackendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Backend stopped" -ForegroundColor Green
    }
    if ($global:FrontendProcess) {
        Stop-Process -Id $global:FrontendProcess.Id -Force -ErrorAction SilentlyContinue  
        Write-Host "  ✅ Frontend stopped" -ForegroundColor Green
    }
}

# Register cleanup on script exit
Register-EngineEvent PowerShell.Exiting -Action { Stop-Services }

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Blue

if (-not (Test-Command "python")) {
    Write-Host "❌ Python 3 is required but not installed" -ForegroundColor Red
    Write-Host "   Install from: https://python.org/downloads/" -ForegroundColor White
    exit 1
}

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is required but not installed" -ForegroundColor Red
    Write-Host "   Install from: https://nodejs.org/" -ForegroundColor White
    exit 1
}

$pythonVersion = python --version
$nodeVersion = node --version
Write-Host "  ✅ $pythonVersion" -ForegroundColor Green
Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green

# Setup backend
Write-Host "`n🔧 Setting up backend..." -ForegroundColor Blue
Set-Location "backend\python_engine"

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "  📦 Creating Python virtual environment..." -ForegroundColor White
    python -m venv .venv
}

# Activate virtual environment
& ".venv\Scripts\Activate.ps1"
Write-Host "  ✅ Virtual environment activated" -ForegroundColor Green

# Install dependencies
Write-Host "  📦 Installing backend dependencies..." -ForegroundColor White
pip install -r requirements.txt *> $null
Write-Host "  ✅ Backend dependencies installed" -ForegroundColor Green

# Start backend
Write-Host "`n🚀 Starting backend on http://localhost:8000..." -ForegroundColor Green
$global:BackendProcess = Start-Process -FilePath "uvicorn" -ArgumentList "app:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Hidden -PassThru -RedirectStandardOutput "..\backend.log" -RedirectStandardError "..\backend_error.log"

# Wait for backend to be ready
Write-Host "  ⏳ Waiting for backend to start..." -ForegroundColor White
$backendReady = $false
for ($i = 1; $i -le 30; $i++) {
    if (Test-HttpEndpoint "http://localhost:8000/health") {
        Write-Host "  ✅ Backend ready!" -ForegroundColor Green
        $backendReady = $true
        break
    }
    Start-Sleep 1
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start after 30 seconds" -ForegroundColor Red
    Write-Host "   Check backend.log for errors" -ForegroundColor White
    Stop-Services
    exit 1
}

# Setup frontend  
Set-Location "..\..\frontend"
Write-Host "`n🔧 Setting up frontend..." -ForegroundColor Blue

# Install dependencies
Write-Host "  📦 Installing frontend dependencies..." -ForegroundColor White
npm install *> $null
Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green

# Find available port
$frontendPort = Find-AvailablePort
Write-Host "  🎯 Using port $frontendPort for frontend" -ForegroundColor White

# Start frontend
Write-Host "`n🎯 Starting frontend on http://localhost:$frontendPort..." -ForegroundColor Green
$env:PORT = $frontendPort
$global:FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WindowStyle Hidden -PassThru -RedirectStandardOutput "frontend.log" -RedirectStandardError "frontend_error.log"

# Wait for frontend to be ready
Write-Host "  ⏳ Waiting for frontend to start..." -ForegroundColor White
$frontendReady = $false
for ($i = 1; $i -le 60; $i++) {
    if (Test-HttpEndpoint "http://localhost:$frontendPort" "FinanceAI") {
        Write-Host "  ✅ Frontend ready!" -ForegroundColor Green
        $frontendReady = $true
        break
    }
    Start-Sleep 1
}

if (-not $frontendReady) {
    Write-Host "❌ Frontend failed to start after 60 seconds" -ForegroundColor Red
    Write-Host "   Check frontend.log for errors" -ForegroundColor White
    Stop-Services
    exit 1
}

# Run smoke test
Write-Host "`n🧪 Running smoke test..." -ForegroundColor Blue
Set-Location ".."

$smokeTestPassed = $true
$tests = @(
    @{ Name = "Backend Health"; Url = "http://localhost:8000/health" },
    @{ Name = "Frontend App"; Url = "http://localhost:$frontendPort"; Content = "FinanceAI" }
)

Write-Host "Running smoke tests..." -ForegroundColor White
$passed = 0

foreach ($test in $tests) {
    if (Test-HttpEndpoint $test.Url $test.Content) {
        Write-Host "  ✅ $($test.Name): $($test.Url)" -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "  ❌ $($test.Name): Failed" -ForegroundColor Red
        $smokeTestPassed = $false
    }
}

Write-Host "`nResults: $passed/$($tests.Count) tests passed" -ForegroundColor White

if ($smokeTestPassed) {
    Write-Host "`n✅ All systems ready!" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Blue
    Write-Host "🚀 Backend:  " -NoNewline -ForegroundColor White
    Write-Host "http://localhost:8000" -ForegroundColor Blue
    Write-Host "🎯 Frontend: " -NoNewline -ForegroundColor White  
    Write-Host "http://localhost:$frontendPort" -ForegroundColor Blue
    Write-Host "==============================================" -ForegroundColor Blue
    Write-Host "📱 " -NoNewline -ForegroundColor White
    Write-Host "Open your browser: http://localhost:$frontendPort" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor White
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep 1
        }
    }
    finally {
        Stop-Services
    }
}
else {
    Write-Host "`n❌ Smoke test failed - check the logs" -ForegroundColor Red
    Write-Host "   Backend log: backend\backend.log" -ForegroundColor White
    Write-Host "   Frontend log: frontend\frontend.log" -ForegroundColor White
    Stop-Services
    exit 1
}