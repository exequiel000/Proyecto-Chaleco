/* TEST 3 - DS18B20: temperatura en grados Celsius (DATA = GPIO19)
   Librerias: OneWire y DallasTemperature.
   Si muestra -127.0 -> sensor desconectado o mal cableado. */
#include <OneWire.h>
#include <DallasTemperature.h>

#define PIN_TEMP 19
OneWire oneWire(PIN_TEMP);
DallasTemperature sensorTemp(&oneWire);

void setup() {
  Serial.begin(115200);
  sensorTemp.begin();
  Serial.print("Sensores DS18B20 encontrados: ");
  Serial.println(sensorTemp.getDeviceCount());
}

void loop() {
  sensorTemp.requestTemperatures();
  float t = sensorTemp.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C) {
    Serial.println("ERROR: DS18B20 no responde (-127). Revisar cableado.");
  } else {
    Serial.print("Temperatura: "); Serial.print(t, 2); Serial.println(" C");
  }
  delay(1000);
}
