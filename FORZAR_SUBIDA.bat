@echo off
color 0D
echo ==============================================
echo   PARA VER EL ERROR REAL (FIX v2.2)
echo ==============================================
echo.
echo 1. Guardando modo diagnostico...
git add .
git commit -m "Fix: Remove preferences prop and expose error message"

echo.
echo 2. Subiendo a rayburger-grill...
git push origin main

echo.
echo ==============================================
echo LISTO.
echo.
echo Cuando entres esta vez, si falla, el cuadro rojo
echo te dira EXACTAMENTE que esta mal.
echo ==============================================
pause
