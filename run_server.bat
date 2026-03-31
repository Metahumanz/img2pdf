@echo off
cd /d "%~dp0"

IF NOT EXIST "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing requirements...
pip install -r requirements.txt
echo Starting Image to PDF Web UI...
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8000"
uvicorn app:app --host 0.0.0.0 --port 8000
