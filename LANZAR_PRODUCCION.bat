@echo off
setlocal enabledelayedexpansion
title LANZAR RAY BURGER A PRODUCCION 🚀
echo ===================================================
echo   🔥 RAY BURGER GRILL - DESPLIEGUE DEFINITIVO 🔥
echo ===================================================
echo.
echo Este script subira todos tus cambios a GitHub y Vercel.
echo Fecha: %date% %time%
echo.

:: 1. Ir a la carpeta del proyecto
cd /d "%~dp0"

:: 2. Verificar Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro 'git'. Por favor instalo.
    pause
    exit /b
)

:: 3. Asegurar Remoto Correcto
echo 🔍 Verificando conexion con GitHub...
git remote set-url origin https://github.com/raimundo278/rayburger-grill.git

:: 4. Agregar Cambios
echo 📦 Preparando archivos (Menu, Codigo, Imagenes)...
git add .

:: 5. Crear Commit
echo 📝 Sellando version 10/10...
git commit -m "Lanzamiento Final: Ray Burger Grill Estable (Mobile Optimized)"

:: 6. Subir a la Nube
echo 📤 Subiendo a GitHub...
echo (Si aparece una ventana, por favor inicia sesion)
echo.
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo subir a GitHub. 
    echo Posibles causas:
    echo  1. No tienes internet.
    echo  2. Necesitas iniciar sesion en GitHub.
    echo  3. Alguien mas subio cambios (haz un 'git pull' si sabes como).
    echo.
    echo Intenta abrir 'GitHub Desktop' y darle a 'Push' manualmente.
) else (
    echo.
    echo ✅ ¡EXITO TOTAL!
    echo Tus cambios ya estan en GitHub.
    echo Vercel empezara a actualizar tu web en 1 minuto.
    echo Entra a: https://rayburgergrill.com.ve para ver los resultados.
)

echo.
echo ===================================================
echo  Presiona cualquier tecla para finalizar
echo ===================================================
pause
