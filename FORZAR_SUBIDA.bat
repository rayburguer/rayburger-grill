@echo off
color 0B
echo ==============================================
echo   REPARANDO Y SUBIENDO (FIX v2.1)
echo ==============================================
echo.
echo 1. Guardando cambios de emergencia...
git add .
git commit -m "Fix: AuthContext compilation errors and Ghost Admin types"

echo.
echo 2. Conectando con GitHub (rayburguer)...
echo.
git push origin main

echo.
echo ==============================================
echo PROCESO FINALIZADO.
echo.
echo Si ves "main -> main" o "Everything up-to-date",
echo espera 2 minutos y prueba entrar.
echo ==============================================
pause
