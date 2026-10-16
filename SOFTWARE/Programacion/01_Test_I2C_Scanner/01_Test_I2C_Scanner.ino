/* TEST 1 - Escaner I2C (SDA=GPIO21, SCL=GPIO22)
   Esperado: MPU6050 en 0x68 y MAX30102 en 0x57.
   Si no aparece ninguno: revisar soldaduras, alimentacion 3V3 y GND. */
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  delay(500);
  Serial.println("Escaneando bus I2C...");
}

void loop() {
  int encontrados = 0;
  for (byte dir = 1; dir < 127; dir++) {
    Wire.beginTransmission(dir);
    if (Wire.endTransmission() == 0) {
      Serial.print("Dispositivo en 0x");
      if (dir < 16) Serial.print("0");
      Serial.print(dir, HEX);
      if (dir == 0x68) Serial.print("  -> MPU6050");
      if (dir == 0x57) Serial.print("  -> MAX30102");
      Serial.println();
      encontrados++;
    }
  }
  if (encontrados == 0) Serial.println("No se encontro ningun dispositivo");
  Serial.println("--------------------");
  delay(3000);
}
