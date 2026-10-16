/* TEST 4 - MAX30102: pulsaciones (BPM)
   Libreria: SparkFun MAX3010x. Apoyar el dedo SIN apretar mucho sobre el sensor.
   Se imprime IR, BPM instantaneo y promedio. Si IR < 50000 = sin dedo.
   Si dice "no detectado", probar con el escaner I2C (direccion 0x57). */
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 sensor;
const byte TAM = 4;
byte tasas[TAM];
byte pos = 0;
long ultimoLatido = 0;
float bpm = 0;
int bpmProm = 0;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("ERROR: MAX30102 no detectado.");
    while (true) delay(1000);
  }
  Serial.println("MAX30102 OK. Apoya el dedo en el sensor.");
  sensor.setup();                    // configuracion por defecto
  sensor.setPulseAmplitudeRed(0x0A); // LED rojo tenue (indicador)
  sensor.setPulseAmplitudeGreen(0);  // verde apagado
}

void loop() {
  long ir = sensor.getIR();

  if (ir < 50000) {
    bpmProm = 0;
    static unsigned long t = 0;
    if (millis() - t > 1000) { t = millis(); Serial.print("IR="); Serial.print(ir); Serial.println("  -> sin dedo"); }
    return;
  }

  if (checkForBeat(ir)) {
    long delta = millis() - ultimoLatido;
    ultimoLatido = millis();
    bpm = 60000.0 / delta;
    if (bpm > 30 && bpm < 220) {
      tasas[pos++] = (byte)bpm;
      pos %= TAM;
      int suma = 0;
      for (byte i = 0; i < TAM; i++) suma += tasas[i];
      bpmProm = suma / TAM;
    }
    Serial.print("IR="); Serial.print(ir);
    Serial.print("  BPM="); Serial.print(bpm, 0);
    Serial.print("  Promedio="); Serial.println(bpmProm);
  }
}
