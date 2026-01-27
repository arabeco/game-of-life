@echo off
echo ========================================
echo   GAME OF LIFE - Iniciando servidor...
echo ========================================
echo.
cd /d "%~dp0"
echo Iniciando Vite...
echo Acesse: http://localhost:5173
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
npm run dev
pause
