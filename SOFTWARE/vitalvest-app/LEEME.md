# VitalVest - app

Orden de uso (Windows):

1. INSTALAR.bat      -> crea el proyecto, instala paquetes y copia los archivos (solo una vez)
2. EJECUTAR.bat      -> abre la app en el navegador (localhost:8081)
   EJECUTAR-LIMPIO.bat -> igual, pero borra la cache (usalo si ves pantalla en blanco)
3. ARREGLAR.bat     -> si ya tenias la carpeta app: instala lo que falte y copia los archivos nuevos
4. CONSTRUIR-WEB.bat -> genera app\dist para subirla a internet e instalarla en el celular

Carpetas:
- fuentes\      codigo de la app (pantallas, contexto, login) y public\ (manifest e iconos)
- herramientas\ script que ajusta app.json y enlaza el manifest
- app\          se crea al ejecutar INSTALAR.bat

Requisito: Node.js LTS (https://nodejs.org). No la pongas dentro de OneDrive.
Antes de usar login: pega tu configuracion de Firebase en fuentes\firebase.js (y en app\firebase.js si ya instalaste).
