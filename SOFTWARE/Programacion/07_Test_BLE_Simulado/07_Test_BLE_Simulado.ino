/* TEST 7 - BLE con datos SIMULADOS (para probar la app sin sensores)
   Mismos UUID y formato que el firmware completo:
     Postura : "estado,pitch,roll"  (estado 0=verde 1=amarillo 2=rojo)
     Temp    : "36.5"
     BPM     : "75"
     Bateria : "80"
   Conectar desde la app (o nRF Connect) al dispositivo "VitalVest". */
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID      "12345678-1234-1234-1234-1234567890ab"
#define CHAR_UUID_POSTURA "12345678-1234-1234-1234-1234567890ac"
#define CHAR_UUID_TEMP    "12345678-1234-1234-1234-1234567890ad"
#define CHAR_UUID_BPM     "12345678-1234-1234-1234-1234567890ae"
#define CHAR_UUID_BAT     "12345678-1234-1234-1234-1234567890af"

BLECharacteristic *cPostura, *cTemp, *cBpm, *cBat;
bool conectado = false;

class Cb : public BLEServerCallbacks {
  void onConnect(BLEServer*)    { conectado = true;  Serial.println("App conectada"); }
  void onDisconnect(BLEServer*) { conectado = false; Serial.println("App desconectada"); BLEDevice::startAdvertising(); }
};

BLECharacteristic* crear(BLEService* s, const char* uuid) {
  BLECharacteristic* c = s->createCharacteristic(uuid, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  c->addDescriptor(new BLE2902());
  return c;
}

void setup() {
  Serial.begin(115200);
  BLEDevice::init("VitalVest");
  BLEServer* srv = BLEDevice::createServer();
  srv->setCallbacks(new Cb());
  BLEService* s = srv->createService(SERVICE_UUID);
  cPostura = crear(s, CHAR_UUID_POSTURA);
  cTemp    = crear(s, CHAR_UUID_TEMP);
  cBpm     = crear(s, CHAR_UUID_BPM);
  cBat     = crear(s, CHAR_UUID_BAT);
  s->start();
  BLEDevice::startAdvertising();
  Serial.println("BLE listo. Buscar 'VitalVest' desde la app.");
}

void loop() {
  static unsigned long t = 0;
  if (millis() - t < 1000) return;
  t = millis();
  if (!conectado) return;

  float fase = millis() / 1000.0;
  float pitch = 25.0 * sin(fase / 4.0);          // oscila -25..25 grados
  float roll  = 10.0 * sin(fase / 6.0);
  float desv  = max(fabs(pitch), fabs(roll));
  int estado  = desv < 20 ? 0 : (desv < 30 ? 1 : 2);
  float temp  = 36.4 + 0.3 * sin(fase / 10.0);
  int bpm     = 75 + (int)(8 * sin(fase / 3.0));
  int bat     = 80;

  cPostura->setValue((String(estado) + "," + String(pitch, 1) + "," + String(roll, 1)).c_str()); cPostura->notify();
  cTemp->setValue(String(temp, 1).c_str()); cTemp->notify();
  cBpm->setValue(String(bpm).c_str());      cBpm->notify();
  cBat->setValue(String(bat).c_str());      cBat->notify();
  Serial.println("Enviado: estado=" + String(estado) + " pitch=" + String(pitch, 1) + " roll=" + String(roll, 1));
}
