#include <OneWire.h>

#define ONE_WIRE_PIN 4  // prueba 4 primero

OneWire oneWire(ONE_WIRE_PIN);

void setup() {
  Serial.begin(115200);
  Serial.println("Buscando DS18B20...");
}

void loop() {
  byte addr[8];

  if (!oneWire.search(addr)) {
    Serial.println("NO sensores detectados");
    oneWire.reset_search();
    delay(2000);
    return;
  }

  Serial.print("Encontrado: ");

  for (int i = 0; i < 8; i++) {
    Serial.print(addr[i], HEX);
    Serial.print(" ");
  }

  Serial.println();

  delay(2000);
}