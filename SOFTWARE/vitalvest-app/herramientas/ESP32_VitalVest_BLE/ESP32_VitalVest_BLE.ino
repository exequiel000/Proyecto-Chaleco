// Comunicación BLE entre el ESP32 y la app VitalVest.
//  - ESP32 -> app: texto "angulo,pitch,roll,bpm,temp,bateria"  ej. "16.2,12.9,-3.1,72,36.4,87"
//  - app -> ESP32: comandos de texto  RATE,<ms> (cada cuánto enviar)  |  CAL (recalibrar)  |  TEST (probar alerta)
// Reemplaza las funciones marcadas TODO por tu código real (MPU6050, pulso, DS18B20, batería, motor y buzzer).
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID "0000ffe0-0000-1000-8000-00805f9b34fb"  // = SERVICE en AppContext.js
#define CHAR_UUID    "0000ffe1-0000-1000-8000-00805f9b34fb"  // = CHAR (datos hacia la app)
#define CFG_UUID     "0000ffe2-0000-1000-8000-00805f9b34fb"  // = CFG_CHAR (comandos desde la app)

BLECharacteristic* pChar;
bool conectado = false;
unsigned long ultimoEnvio = 0;
unsigned long intervalo = 500;  // ms; la app lo cambia con el ajuste Performance (Low 2000, Medium 1000, High 500)

// TODO: reemplazar por lecturas y acciones reales
float leerAngulo() { return 15.0; }   // desviación respecto a la calibración, en grados
float leerPitch()  { return 12.0; }
float leerRoll()   { return 0.0; }
int   leerBpm()    { return 72; }
float leerTemp()   { return 36.4; }
int   leerBateria(){ return 87; }     // porcentaje
void  calibrar()     { /* TODO: tomar la postura actual como referencia (0 grados) */ }
void  probarAlerta() { /* TODO: activar motor y buzzer unos 300 ms */ }

class Callbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) { conectado = true; }
  void onDisconnect(BLEServer* server) { conectado = false; server->getAdvertising()->start(); }  // vuelve a anunciarse
};

class CmdCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) {
    String cmd = String(c->getValue().c_str());
    cmd.trim();
    if (cmd.startsWith("RATE,")) intervalo = constrain(cmd.substring(5).toInt(), 200, 5000);
    else if (cmd == "CAL")  calibrar();
    else if (cmd == "TEST") probarAlerta();
  }
};

void setup() {
  Serial.begin(115200);
  BLEDevice::init("VitalVest");       // la app busca dispositivos cuyo nombre empiece con "VitalVest"
  BLEDevice::setMTU(185);             // sin esto el texto se corta a 20 bytes
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new Callbacks());
  BLEService* service = server->createService(SERVICE_UUID);

  pChar = service->createCharacteristic(CHAR_UUID, BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);
  pChar->addDescriptor(new BLE2902());

  BLECharacteristic* pCfg = service->createCharacteristic(CFG_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  pCfg->setCallbacks(new CmdCallbacks());

  service->start();
  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  adv->start();
  Serial.println("VitalVest BLE listo");
}

void loop() {
  if (conectado && millis() - ultimoEnvio >= intervalo) {
    ultimoEnvio = millis();
    char buf[64];
    snprintf(buf, sizeof(buf), "%.1f,%.1f,%.1f,%d,%.1f,%d", leerAngulo(), leerPitch(), leerRoll(), leerBpm(), leerTemp(), leerBateria());
    pChar->setValue((uint8_t*)buf, strlen(buf));
    pChar->notify();
  }
}
