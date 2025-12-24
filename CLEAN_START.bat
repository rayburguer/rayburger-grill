@echo off
echo ===================================================
echo   LIMPIEZA DE EMERGENCIA - RAY BURGER GRILL
echo ===================================================
echo.
echo 1. Deteniendo procesos de node antiguos (si existen)...
taskkill /F /IM node.exe /T 2>nul
echo.

echo 2. Eliminando cache de Vite (node_modules/.vite)...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo    Cache eliminada.
) else (
    echo    No se encontro cache antigua.
)
echo.

echo 3. Iniciando servidor en modo limpio...
echo.
echo    Espera a que diga "Local: http://localhost:5173"
echo.
npm run dev -- --force
pause
