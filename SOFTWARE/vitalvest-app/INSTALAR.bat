@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
if exist app (
  echo Ya existe la carpeta "app". Borrala si quieres reinstalar desde cero.
  pause
  exit /b 1
)
echo [1/5] Creando proyecto Expo...
call npx --yes create-expo-app@latest app --template blank
if errorlevel 1 goto fail
cd app
echo [2/5] Instalando paquetes...
call npx expo install react-native-web react-dom @expo/metro-runtime @react-native-async-storage/async-storage react-native-svg react-native-screens react-native-safe-area-context @expo/vector-icons expo-font
if errorlevel 1 goto fail
call npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
if errorlevel 1 goto fail
call npm install firebase
if errorlevel 1 goto fail
echo [3/5] Copiando archivos de VitalVest...
xcopy /E /Y /I "..\fuentes\*" "." >nul
echo [4/5] Preparando la version web instalable...
call npx expo customize public/index.html
echo [5/5] Ajustando configuracion...
node "..\herramientas\parchear.js"
echo.
echo LISTO. Ahora ejecuta EJECUTAR.bat
pause
exit /b 0
:fail
echo.
echo Algo fallo. Copia el mensaje de arriba y pegaselo a Claude.
pause
exit /b 1
