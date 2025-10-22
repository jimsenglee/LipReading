@echo off
echo Starting Development Servers...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && .venv\Scripts\activate && python run.py"

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://127.0.0.1:5000
echo Frontend: http://localhost:8080
echo.
echo Press any key to exit...
pause >nul
