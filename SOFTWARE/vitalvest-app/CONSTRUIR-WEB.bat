@echo off
cd /d "%~dp0app"
call npx expo export --platform web
echo.
echo Listo: la carpeta app\dist es la version web final.
echo Subela a https://app.netlify.com/drop para tener un enlace https.
pause
