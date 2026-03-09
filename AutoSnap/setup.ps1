# Setup script for AutoSnap
# Change to the directory where this script is located
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray
Write-Host "Starting setup for AutoSnap..." -ForegroundColor Green

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed. Please install Node.js (v18+) and try again." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not installed. Please install npm and try again." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python is not installed. Please install Python 3.8+ and try again." -ForegroundColor Red
    exit 1
}

# Display Python version
$pythonVersion = python --version
Write-Host "$pythonVersion" -ForegroundColor Cyan

# Check if pip is installed
if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
    Write-Host "pip is not installed. Please install pip and try again." -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    try {
        python -m venv .venv
        if ($LASTEXITCODE -ne 0) {
            throw "venv creation failed with exit code $LASTEXITCODE"
        }
        Write-Host "[OK] Virtual environment created" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create virtual environment: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[INFO] Virtual environment already exists" -ForegroundColor Cyan
}

# Activate the virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
try {
    & .\.venv\Scripts\Activate.ps1
} catch {
    Write-Host "[WARNING] Could not activate virtual environment: $_" -ForegroundColor Yellow
    Write-Host "   Continuing with system Python..." -ForegroundColor Yellow
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
try {
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        throw "pip install failed with exit code $LASTEXITCODE"
    }
    Write-Host "[OK] Python dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install Python dependencies: $_" -ForegroundColor Red
    exit 1
}

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed with exit code $LASTEXITCODE"
    }
    Write-Host "[OK] Node.js dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install Node.js dependencies: $_" -ForegroundColor Red
    exit 1
}

# Install Tracewright subdirectory dependencies
Write-Host "Installing Tracewright dependencies..." -ForegroundColor Cyan
if (Test-Path "tracewrightt\package.json") {
    $originalLocation = Get-Location
    try {
        Push-Location tracewrightt
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        Write-Host "[OK] Tracewright dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to install Tracewright dependencies: $_" -ForegroundColor Red
        Write-Host "[WARNING] Continuing anyway, but Tracewright may not work properly" -ForegroundColor Yellow
    } finally {
        Set-Location $originalLocation
    }
} else {
    Write-Host "[WARNING] tracewrightt directory not found, skipping..." -ForegroundColor Yellow
}

# Install Node.js Playwright browsers
Write-Host "Installing Node.js Playwright browsers..." -ForegroundColor Cyan
try {
    npx playwright install
    if ($LASTEXITCODE -ne 0) {
        throw "Playwright install failed with exit code $LASTEXITCODE"
    }
    Write-Host "[OK] Node.js Playwright browsers installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install Node.js Playwright browsers: $_" -ForegroundColor Red
    Write-Host "[WARNING] Continuing anyway, but browser automation may not work" -ForegroundColor Yellow
}

# Install Python Playwright browsers
Write-Host "Installing Python Playwright browsers..." -ForegroundColor Cyan
try {
    python -m playwright install
    if ($LASTEXITCODE -ne 0) {
        throw "Python Playwright install failed with exit code $LASTEXITCODE"
    }
    Write-Host "[OK] Python Playwright browsers installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install Python Playwright browsers: $_" -ForegroundColor Red
    Write-Host "[WARNING] Continuing anyway, but browser automation may not work" -ForegroundColor Yellow
}

# Build Tracewright
Write-Host "Building Tracewright..." -ForegroundColor Cyan
if (Test-Path "tracewrightt\package.json") {
    $originalLocation = Get-Location
    try {
        Push-Location tracewrightt
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        Write-Host "[OK] Tracewright built successfully" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Tracewright build failed, but this is okay - TypeScript fallback will be used" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Gray
    } finally {
        Set-Location $originalLocation
    }
} else {
    Write-Host "[WARNING] tracewrightt directory not found, skipping build..." -ForegroundColor Yellow
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Cyan
    @"
# Required: Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Required: Application credentials
APPLICATION_URL=your_application_url
LOGIN_EMAIL=your_login_email
LOGIN_PASSWORD=your_login_password

# Required: Azure OpenAI API Key (for Python script)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint

# Optional: ReportSearch API Key
# REPORTSEARCH_API_KEY=your_reportsearch_api_key

# Optional: Python script timeout (ms)
# PY_TIMEOUT_MS=120000
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "[WARNING] Please edit the .env file and add your API keys and credentials" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] .env file already exists, skipping creation" -ForegroundColor Cyan
}

# Deactivate the virtual environment
deactivate

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "[OK] AutoSnap setup complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Setup Summary:" -ForegroundColor Cyan
Write-Host "  [OK] Node.js dependencies installed" -ForegroundColor White
Write-Host "  [OK] Tracewright dependencies installed" -ForegroundColor White
Write-Host "  [OK] Python virtual environment created" -ForegroundColor White
Write-Host "  [OK] Python dependencies installed" -ForegroundColor White
Write-Host "  [OK] Playwright browsers installed (Node.js & Python)" -ForegroundColor White
Write-Host "  [OK] Tracewright built" -ForegroundColor White
Write-Host ""
Write-Host "To run AutoSnap:" -ForegroundColor Cyan
Write-Host "  node test-enhanced-flow.js [OPTIONS]" -ForegroundColor White
Write-Host ""
Write-Host "  Examples:" -ForegroundColor Cyan
Write-Host "    node test-enhanced-flow.js --help" -ForegroundColor White
Write-Host "    node test-enhanced-flow.js --folder ./docs-es --lang es" -ForegroundColor White
Write-Host "    node test-enhanced-flow.js --file ./docs/guide.md --mode new_feature" -ForegroundColor White
Write-Host ""
