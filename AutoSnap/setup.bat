@echo off
echo Starting AutoSnap setup...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js (v16+) and try again.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed. Please install npm and try again.
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed. Please install Python 3.8+ and try again.
    exit /b 1
)

REM Display Python version
python --version

REM Check if pip is installed
where pip >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo pip is not installed. Please install pip and try again.
    exit /b 1
)

REM Install Node.js dependencies
echo Installing Node.js dependencies...
call npm install

REM Install Python dependencies
echo Installing Python dependencies...
call pip install -r requirements.txt

REM Install Playwright browsers
echo Installing Playwright browsers...
call npx playwright install

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # Azure OpenAI API Key
        echo AZURE_OPENAI_API_KEY=your_azure_openai_api_key
        echo AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
        echo.
        echo # Optional: ReportSearch API Key
        echo # REPORTSEARCH_API_KEY=your_reportsearch_api_key
        echo.
        echo # Optional: Python script timeout (ms)
        echo # PY_TIMEOUT_MS=120000
    ) > .env
    echo Please edit the .env file and add your API keys
)

echo AutoSnap setup complete!
echo To run AutoSnap, use: npm run run-enhanced
