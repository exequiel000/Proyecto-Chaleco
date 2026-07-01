#include <Wire.h>
#include "MAX30105.h"

MAX30105 particleSensor;

void setup() {
  Serial.begin(115200);

  // I2C ESP32 estándar
  Wire.begin(21, 22);

  Serial.println("Iniciando MAX30102...");

  // Intentar iniciar sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("MAX30102 NO detectado (0x57 no responde)");
    while (1);
  }

  Serial.println("MAX30102 detectado correctamente!");

  // Configuración básica del sensor
  particleSensor.setup(); 
  particleSensor.setPulseAmplitudeRed(0x1F);
  particleSensor.setPulseAmplitudeIR(0x1F);
}

void loop() {
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  Serial.print("IR: ");
  Serial.print(irValue);

  Serial.print("  RED: ");
  Serial.println(redValue);

  delay(100);
}