@echo off
echo Iniciando servidor...
cd /d "%~dp0"
python -m http.server 3000
pause
