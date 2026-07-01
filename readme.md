VitalVest

Chaleco inteligente para monitoreo de postura y salud

VitalVest es un proyecto de chaleco inteligente pensado para ayudar al usuario a mejorar su postura corporal y, al mismo tiempo, monitorear algunos signos vitales en tiempo real.

La idea principal del proyecto es prevenir problemas de postura, malas posiciones prolongadas y posibles molestias físicas, utilizando sensores, vibración y alertas sonoras para avisar cuando el usuario adopta una postura incorrecta.

Además del monitoreo de postura, el sistema también permite medir frecuencia cardíaca, oxígeno en sangre, temperatura corporal y temperatura ambiente.

---

Objetivo del proyecto

El objetivo de VitalVest es desarrollar un sistema wearable capaz de:

- Detectar malas posturas
- Alertar al usuario en tiempo real
- Monitorear datos de salud importantes
- Mostrar toda la información en una aplicación móvil

Con esto se busca mejorar hábitos posturales y aportar información útil sobre el estado físico del usuario.

---

Componentes principales

Microcontrolador

- ESP32-WROOM-32D

Sensores

- MPU6050 (Acelerómetro + Giroscopio)
- MAX30102 (Frecuencia cardíaca + SpO₂)

Actuadores

- Motor vibrador tipo moneda
- Buzzer

Alimentación

- Batería Li-ion 3.7V
- Módulo TP4056
- Interruptor de encendido

Componentes extra

- Transistores MMBT2222A
- Resistencias
- Capacitores
- PCB / Protoboard

---

Funcionamiento del sistema

El ESP32 es el componente principal del proyecto. Su función es leer los sensores, procesar los datos y controlar las alertas.

El sistema funciona de la siguiente manera:

1. El usuario enciende el chaleco.
2. El sistema calibra la postura inicial.
3. El sensor MPU6050 comienza a medir inclinación.
4. Se compara la postura actual con la postura de referencia.
5. Si hay una desviación importante, se activa una alerta.
6. Los datos también se envían a la app mediante Bluetooth.

---

Detección de postura

Para detectar la postura se utiliza el MPU6050, que mide inclinación y movimiento.

Se trabajan principalmente dos ángulos:

- Pitch → inclinación hacia adelante o atrás
- Roll → inclinación hacia los lados

Estos valores permiten detectar si el usuario mantiene una postura correcta o no.

---

Estados de postura

Estado verde (Postura correcta)

Desviación entre 0° y 20°.

- No hay alertas
- Postura estable

---

Estado amarillo (Advertencia)

Desviación entre 20° y 30°.

- Vibración durante 3 segundos
- Se repite cada 10 segundos
- Sonido corto del buzzer

---

Estado rojo (Mala postura)

Desviación mayor a 30°.

- Vibración continua
- Sonido continuo
- La alerta se detiene al corregir la postura

---

Monitoreo de salud

El sensor MAX30102 permite medir:

- Frecuencia cardíaca (BPM)
- Oxígeno en sangre (SpO₂)

También se consideran sensores de temperatura para medir:

- Temperatura corporal
- Temperatura ambiente

Esto permite tener un monitoreo más completo del estado del usuario.

---

Alimentación del sistema

El chaleco funciona con una batería Li-ion de 3.7V.

La carga se realiza mediante un módulo TP4056.

El sistema también monitorea el porcentaje de batería para informar cuándo es necesario recargar.

---

Aplicación móvil

Toda la información se envía mediante Bluetooth a la aplicación VitalVest.

Desde la app se podrá visualizar:

- Estado de postura
- Ángulo de inclinación
- BPM
- SpO₂
- Temperatura corporal
- Temperatura ambiente
- Nivel de batería

La aplicación cuenta con secciones como:

- Home
- Analysis
- Timer
- History
- Settings

---

Estado actual del proyecto

Actualmente el proyecto se encuentra en etapa de desarrollo y prototipado.

Hasta ahora se trabajó en:

- Diseño general del sistema
- Planificación del hardware
- Programación inicial del ESP32
- Diseño de interfaz de la aplicación
- Pruebas con sensores

---

Futuras mejoras

A futuro se busca incorporar:

- Mejor precisión en sensores
- Análisis avanzado de postura
- Estadísticas más detalladas
- Recomendaciones personalizadas
- Optimización de consumo energético