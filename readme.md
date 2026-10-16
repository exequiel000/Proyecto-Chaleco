# VitalVest — Firmware (ESP32), pruebas y conexión con la app

Chaleco inteligente corrector de postura con monitoreo de **inclinación (grados)**, **pulsaciones (BPM)** y **temperatura (°C)**, conectado por Bluetooth (BLE) a la app VitalVest.

---

## 1. Cómo usar los códigos (Arduino IDE)

1. Descomprimir. Cada carpeta es un sketch: abrir el `.ino` que está adentro.
2. `Herramientas > Placa`: **ESP32 Dev Module**. Elegir el puerto COM.
3. Abrir el Monitor Serie a **115200** baudios.
4. Instalar las librerías (`Herramientas > Administrar bibliotecas`):
   - MPU6050 (Electronic Cats)
   - OneWire
   - DallasTemperature
   - SparkFun MAX3010x Pulse and Proximity Sensor Library

   La librería BLE ya viene con el soporte de placas ESP32.

### Orden recomendado de pruebas

| Carpeta | Qué prueba |
|---|---|
| `01_Test_I2C_Scanner` | Detecta el MPU6050 (0x68) y el MAX30102 (0x57) |
| `02_Test_MPU6050_Inclinacion` | Pitch, roll y desviación en grados + estado |
| `03_Test_DS18B20_Temperatura` | Temperatura en °C (`-127` = sensor sin conexión) |
| `04_Test_MAX30102_Pulso` | BPM, con el dedo apoyado sin apretar |
| `05_Test_Motor_Buzzer` | Verifica los transistores |
| `06_Test_Bateria` | Tensión y % de la batería 1S (comparar con multímetro) |
| `07_Test_BLE_Simulado` | Prueba la **app** sin necesitar sensores |
| `00_VitalVest_COMPLETO` | Firmware completo + BLE |

### Pines (según PCB)

| Función | Pin |
|---|---|
| I²C (MPU6050 y MAX30102) | SDA = GPIO21, SCL = GPIO22 |
| DS18B20 (OneWire) | GPIO19 |
| Buzzer (vía 2N2222F) | GPIO23 |
| Motor vibrador (vía MMBT2222A) | GPIO18 |
| Nivel de batería | GPIO34 |
| Recalibrar | BOOT = GPIO0 |

**Batería:** Li-ion 1S (3,0–4,2 V), divisor 100 kΩ / 100 kΩ y zener de 3,3 V como respaldo. El nodo llega como máximo a 2,1 V, por lo que el porcentaje es lineal en todo el rango.

---

## 2. Lógica de postura

La desviación es la mayor diferencia (pitch o roll) respecto de la postura calibrada.

| Estado | Desviación | Alerta |
|---|---|---|
| 🟢 Verde | < 20° | Ninguna |
| 🟡 Amarillo | 20°–30° | Motor 3 s cada 10 s + beep corto |
| 🔴 Rojo | > 30° | Motor y buzzer continuos |

- El estado debe mantenerse **500 ms** para cambiar (evita falsas alertas).
- **Recalibrar:** mantener BOOT 1 segundo, o enviar `"C"` desde la app.

---

## 3. Conexión chaleco ↔ app (BLE)

- Nombre del dispositivo: **`VitalVest`**
- Servicio: `12345678-1234-1234-1234-1234567890ab`
- Los datos viajan como **texto** y se envían cada 500 ms (notify).

| UUID termina en | Dato | Acceso | Formato | Uso en la app |
|---|---|---|---|---|
| `...1234567890ac` | Postura | notify | `"e,pitch,roll"` — e: 0 verde, 1 amarillo, 2 rojo. Ej: `"1,24.3,-3.1"` | Home / Posture (semáforo) |
| `...1234567890ad` | Temperatura | notify | `"36.5"` (°C) | Home / History |
| `...1234567890ae` | Pulsaciones | notify | `"75"` (0 = sin dedo) | Home / History |
| `...1234567890af` | Batería | notify | `"80"` (%) | Home / Settings |
| `...1234567890b0` | Comando | write | `"C"` | Botón "Recalibrar" |

**Cómo lo usa la app** (propuesta de diseño):

- **Home:** estado de postura con colores, BPM, temperatura y batería en tiempo real.
- **Posture (Analysis):** ángulos pitch y roll y desviación actual.
- **History:** lecturas guardadas para consultar por día (alertas, chequeos, mejoras).
- **Settings:** estado de conexión Bluetooth y nivel de batería.
- **Recalibrar:** la app escribe `"C"` en la característica de comando.

> Para probar la app sin chaleco, cargar el sketch `07_Test_BLE_Simulado`.
>
> En la versión web, Bluetooth funciona en **Chrome o Edge** (`localhost` cuenta como conexión segura). En Android usar Chrome.

---

## 4. La app VitalVest

**Diseño:** tema oscuro azul/cian, basado en 5 capturas (Login, Home, Posture Monitor, Health History, Settings).

**Secciones:** Home, Posture/Analysis, History, Settings (Timer previsto como función adicional).

### Acceso y cuenta (Firebase, proyecto "VitalVest")

- Inicio de sesión con **correo** y con **Google** (funcionando en local).
- "Olvidé mi contraseña": recuperación por correo.
- App web de Firebase ya registrada.

### Idiomas

Español por defecto + inglés, portugués, chino y tailandés, con opción **Automático** que usa el idioma del sistema del celular.

### Settings (decisiones tomadas)

- Botón **Edit**: cambia el nombre de usuario.
- Fila **Profile**: muestra el correo, permite cambiar la contraseña y ver/copiar el teléfono (solo lectura).
- Tema claro/oscuro, tamaño de letra, alto contraste.
- Notificaciones, avisos por voz, dispositivo, rendimiento, privacidad y permisos.
- *Pendiente:* terminar de hacer funcionales todos estos valores.

### Pestaña AI

Firebase AI Logic configurado, con App Check (reCAPTCHA Enterprise). La IA ya responde sin errores en localhost.

### Cómo correr la app en la PC (Windows)

- Versión offline: ejecutar `EJECUTAR.bat` (o `node server.js`) y abrir `http://localhost:8000`.
- Cuidado con la **carpeta doble** al descomprimir (OneDrive): entrar a la subcarpeta antes de ejecutar.
- Plan de pruebas: primero en PC (web), después en Android (web).
- Objetivo: que funcione en Android sin tener la terminal abierta.

---

## 5. Estado del proyecto

- ✅ **Hardware:** ESP32 + MPU6050 + DS18B20 + motor + buzzer + batería 1S, según el diseño de PCB (3 versiones en KiCad).
- ⚠️ **MAX30102:** con fallas de detección, reemplazo pendiente (el firmware sigue funcionando con BPM = 0 si no se detecta).
- ⏳ **App:** Settings funcionales, pantalla Timer y lectura BLE real conectada a todas las pantallas.
- ⏳ **Investigación:** encuesta (5+ preguntas, 25 a 50 años), valor agregado de la app, apps similares (5 a 8), problemática en diarios y redes.
