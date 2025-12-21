@echo off
setlocal enabledelayedexpansion
echo ========================================
echo  🚀 RAY BURGER GRILL - DEPLOY SYSTEM
echo ========================================
echo.

cd /d "%~dp0"

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro 'git' en tu sistema. 
    echo Por favor instala Git desde https://git-scm.com/
    echo O usa GitHub Desktop para subir los cambios.
    pause
    exit /b
)

:: Check if .git exists
if not exist ".git" (
    echo [ERROR] No se encontro el repositorio (.git).
    echo Inicializando repositorio...
    git init
    git remote add origin https://github.com/raimundo27/pruebaloca.git
)

echo 📦 Agregando todos los archivos...
git add --all

echo.
echo 📝 Creando commit con la ultima version...
git commit -m "Auto-deploy: Ray Burger Grill complete updates"

echo.
echo 📤 Subiendo a GitHub (Rama: main)...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema al subir a GitHub.
    echo Verifica tu conexion a internet o tus credenciales.
) else (
    echo.
    echo ✅ LISTO! Los archivos estan en GitHub.
    echo Vercel comenzara la reconstruccion automaticamente.
)

echo.
echo ========================================
echo  Presiona cualquier tecla para cerrar
echo ========================================
pause
