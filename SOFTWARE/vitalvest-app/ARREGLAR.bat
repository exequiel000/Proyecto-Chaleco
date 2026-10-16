@echo off
cd /d "%~dp0app"
if errorlevel 1 goto noapp
echo [1/3] Instalando paquetes que faltan...
call npx expo install @expo/vector-icons expo-font react-native-svg react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage
if errorlevel 1 goto fail
call npm install firebase @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
if errorlevel 1 goto fail
echo [2/3] Copiando los archivos mas recientes ^(tus firebase.js y appcheck.js se conservan^)...
xcopy /E /Y /I /EXCLUDE:..\herramientas\excluir.txt "..\fuentes\*" "." >nul
if not exist firebase.js copy /Y "..\fuentes\firebase.js" "firebase.js" >nul
if not exist appcheck.js copy /Y "..\fuentes\appcheck.js" "appcheck.js" >nul
echo [3/3] Listo. Ahora ejecuta EJECUTAR-LIMPIO.bat
pause
exit /b 0
:noapp
echo No existe la carpeta app. Ejecuta primero INSTALAR.bat
pause
exit /b 1
:fail
echo Algo fallo. Copia el mensaje de arriba y pegaselo a Claude.
pause
exit /b 1
