/*
  ============================================================
  VITALVEST - Chaleco inteligente corrector de postura
  Firmware completo - ESP32-WROOM-32D
  ============================================================
  Conexiones (segun PCB):
    MPU6050   I2C  SDA=GPIO21  SCL=GPIO22   (0x68)
    MAX30102  I2C  SDA=GPIO21  SCL=GPIO22   (0x57)
    DS18B20   OneWire DATA=GPIO19
    Buzzer    GPIO23 (via 2N2222F)
    Motor     GPIO18 (via MMBT2222A)
    Bateria   GPIO34 (divisor 100k/100k, bateria Li-ion 1S)
    Boton     BOOT = GPIO0 -> mantener 1 s para RECALIBRAR postura

  Estados de postura (desviacion respecto a la calibracion):
    VERDE    < 20 grados : sin alerta
    AMARILLO 20-30       : motor 3 s cada 10 s + beep corto
    ROJO     > 30        : motor + buzzer continuos

  BLE (nombre "VitalVest"), datos en texto:
    Postura : "estado,pitch,roll"   Temp : "36.5"
    BPM     : "75"                  Bateria : "80"
    Comando (escritura): "C" -> recalibrar postura desde la app

  Librerias (Gestor de librerias): MPU6050 (Electronic Cats), OneWire,
  DallasTemperature, SparkFun MAX3010x.  BLE viene con el core ESP32.
  Placa: "ESP32 Dev Module".
*/

#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <MPU6050.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ---------------- PINES ----------------
#define PIN_TEMP    19
#define PIN_BUZZER  23
#define PIN_MOTOR   18
#define PIN_BAT     34
#define PIN_BOTON    0   // BOOT
#define SDA_PIN     21
#define SCL_PIN     22

// ---------------- AJUSTES ----------------
const float UMBRAL_AMARILLO = 20.0;   // grados
const float UMBRAL_ROJO     = 30.0;   // grados
const unsigned long CONFIRMAR_MS = 500;   // el estado debe mantenerse para cambiar (evita falsas alertas)
const unsigned long CICLO_AMARILLO = 10000; // ms
const unsigned long MOTOR_AMARILLO = 3000;  // ms encendido
const unsigned long BEEP_AMARILLO  = 300;   // ms de beep al inicio
const bool USAR_FILTRO = true;        // filtro complementario acelerometro + giroscopio
const float ALFA = 0.96;              // peso del giroscopio en el filtro
const long UMBRAL_DEDO = 50000;       // IR minimo para detectar dedo/piel

const unsigned long INT_POSTURA = 20;    // ms (50 Hz)
const unsigned long INT_TEMP    = 2000;  // ms
const unsigned long INT_BAT     = 5000;  // ms
const unsigned long INT_BLE     = 500;   // ms
const unsigned long INT_SERIAL  = 1000;  // ms

// ---------------- OBJETOS ----------------
MPU6050 mpu;
OneWire oneWire(PIN_TEMP);
DallasTemperature sensorTemp(&oneWire);
MAX30105 sensorCardiaco;

// ---------------- ESTADO ----------------
enum Estado { VERDE = 0, AMARILLO = 1, ROJO = 2 };
Estado estadoActual = VERDE, estadoCandidato = VERDE;
unsigned long tCandidato = 0, tInicioAmarillo = 0;

float pitchRef = 0, rollRef = 0;
float pitch = 0, roll = 0;       // angulos filtrados absolutos
float desviacion = 0;
unsigned long tUltimaPostura = 0;

float temperatura = 0;
bool tempOK = false, tempPedida = false;
unsigned long tTempPedida = 0;

bool mpuOK = false, maxOK = false;
const byte TAM = 4;
byte tasas[TAM]; byte posTasa = 0;
long ultimoLatido = 0;
int bpmProm = 0;

int bateria = 0;
float vBat = 0;

// ---------------- BLE ----------------
#define SERVICE_UUID      "12345678-1234-1234-1234-1234567890ab"
#define CHAR_UUID_POSTURA "12345678-1234-1234-1234-1234567890ac"
#define CHAR_UUID_TEMP    "12345678-1234-1234-1234-1234567890ad"
#define CHAR_UUID_BPM     "12345678-1234-1234-1234-1234567890ae"
#define CHAR_UUID_BAT     "12345678-1234-1234-1234-1234567890af"
#define CHAR_UUID_CMD     "12345678-1234-1234-1234-1234567890b0"

BLECharacteristic *cPostura, *cTemp, *cBpm, *cBat, *cCmd;
bool conectado = false;
volatile bool pedirCalibracion = false;

class CbServidor : public BLEServerCallbacks {
  void onConnect(BLEServer*)    { conectado = true;  Serial.println("App conectada"); }
  void onDisconnect(BLEServer*) { conectado = false; Serial.println("App desconectada"); BLEDevice::startAdvertising(); }
};

class CbComando : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) {
    auto v = c->getValue();
    if (v.length() > 0 && (v[0] == 'C' || v[0] == 'c')) pedirCalibracion = true;
  }
};

BLECharacteristic* crearChar(BLEService* s, const char* uuid) {
  BLECharacteristic* c = s->createCharacteristic(uuid, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  c->addDescriptor(new BLE2902());
  return c;
}

void iniciarBLE() {
  BLEDevice::init("VitalVest");
  BLEServer* srv = BLEDevice::createServer();
  srv->setCallbacks(new CbServidor());
  BLEService* s = srv->createService(SERVICE_UUID);
  cPostura = crearChar(s, CHAR_UUID_POSTURA);
  cTemp    = crearChar(s, CHAR_UUID_TEMP);
  cBpm     = crearChar(s, CHAR_UUID_BPM);
  cBat     = crearChar(s, CHAR_UUID_BAT);
  cCmd = s->createCharacteristic(CHAR_UUID_CMD, BLECharacteristic::PROPERTY_WRITE);
  cCmd->setCallbacks(new CbComando());
  s->start();
  BLEDevice::startAdvertising();
  Serial.println("BLE iniciado: 'VitalVest'");
}

void enviarBLE() {
  if (!conectado) return;
  cPostura->setValue((String((int)estadoActual) + "," + String(pitch - pitchRef, 1) + "," + String(roll - rollRef, 1)).c_str());
  cPostura->notify();
  cTemp->setValue(String(temperatura, 1).c_str());   cTemp->notify();
  cBpm->setValue(String(bpmProm).c_str());           cBpm->notify();
  cBat->setValue(String(bateria).c_str());           cBat->notify();
}

// ================= POSTURA =================
bool leerAcelerometro(float &pAcc, float &rAcc, float &gx, float &gy) {
  int16_t ax, ay, az, rx, ry, rz;
  mpu.getMotion6(&ax, &ay, &az, &rx, &ry, &rz);
  pAcc = atan2((float)ay, sqrt((float)ax * ax + (float)az * az)) * 180.0 / PI;
  rAcc = atan2(-(float)ax, (float)az) * 180.0 / PI;
  gx = rx / 131.0;   // grados/s (rango +-250)
  gy = ry / 131.0;
  return true;
}

// Promedia ~1 s en reposo y guarda la referencia (0 grados)
void calibrarPostura() {
  if (!mpuOK) return;
  Serial.println("Calibrando postura... quedate quieto");
  float sp = 0, sr = 0, p, r, gx, gy;
  for (int i = 0; i < 50; i++) {
    leerAcelerometro(p, r, gx, gy);
    sp += p; sr += r;
    delay(20);
  }
  pitchRef = pitch = sp / 50;
  rollRef  = roll  = sr / 50;
  tUltimaPostura = millis();
  estadoActual = estadoCandidato = VERDE;
  Serial.print("Referencia -> pitch: "); Serial.print(pitchRef, 1);
  Serial.print(" roll: "); Serial.println(rollRef, 1);
  // beep de confirmacion
  digitalWrite(PIN_BUZZER, HIGH); delay(120); digitalWrite(PIN_BUZZER, LOW);
}

void actualizarPostura(unsigned long ahora) {
  if (!mpuOK) return;
  float pAcc, rAcc, gx, gy;
  leerAcelerometro(pAcc, rAcc, gx, gy);
  float dt = (ahora - tUltimaPostura) / 1000.0;
  tUltimaPostura = ahora;

  if (USAR_FILTRO) {
    // Si los angulos van al reves por la orientacion del sensor, invertir el signo de gx/gy
    pitch = ALFA * (pitch + gx * dt) + (1.0 - ALFA) * pAcc;
    roll  = ALFA * (roll  + gy * dt) + (1.0 - ALFA) * rAcc;
  } else {
    pitch = pAcc; roll = rAcc;
  }

  desviacion = max(fabs(pitch - pitchRef), fabs(roll - rollRef));

  Estado nuevo = desviacion < UMBRAL_AMARILLO ? VERDE : (desviacion < UMBRAL_ROJO ? AMARILLO : ROJO);
  if (nuevo != estadoCandidato) { estadoCandidato = nuevo; tCandidato = ahora; }
  if (estadoCandidato != estadoActual && ahora - tCandidato >= CONFIRMAR_MS) {
    estadoActual = estadoCandidato;
    if (estadoActual == AMARILLO) tInicioAmarillo = ahora;
  }
}

// ================= ACTUADORES =================
void actualizarActuadores(unsigned long ahora) {
  switch (estadoActual) {
    case VERDE:
      digitalWrite(PIN_MOTOR, LOW);
      digitalWrite(PIN_BUZZER, LOW);
      break;
    case AMARILLO: {
      unsigned long fase = (ahora - tInicioAmarillo) % CICLO_AMARILLO;
      digitalWrite(PIN_MOTOR,  fase < MOTOR_AMARILLO ? HIGH : LOW);
      digitalWrite(PIN_BUZZER, fase < BEEP_AMARILLO  ? HIGH : LOW);
      break;
    }
    case ROJO:
      digitalWrite(PIN_MOTOR, HIGH);
      digitalWrite(PIN_BUZZER, HIGH);
      break;
  }
}

// ================= TEMPERATURA (no bloqueante) =================
void actualizarTemperatura(unsigned long ahora) {
  static unsigned long tUltima = 0;
  if (!tempPedida && ahora - tUltima >= INT_TEMP) {
    sensorTemp.requestTemperatures();     // setWaitForConversion(false): no frena el programa
    tempPedida = true; tTempPedida = ahora; tUltima = ahora;
  } else if (tempPedida && ahora - tTempPedida >= 800) {
    float t = sensorTemp.getTempCByIndex(0);
    tempPedida = false;
    if (t != DEVICE_DISCONNECTED_C) { temperatura = t; tempOK = true; }
    else tempOK = false;
  }
}

// ================= PULSO =================
void actualizarPulso(unsigned long ahora) {
  if (!maxOK) return;
  long ir = sensorCardiaco.getIR();
  if (ir < UMBRAL_DEDO) { bpmProm = 0; return; }

  if (checkForBeat(ir)) {
    long delta = ahora - ultimoLatido;
    ultimoLatido = ahora;
    float bpm = 60000.0 / delta;
    if (bpm > 30 && bpm < 220) {
      tasas[posTasa++] = (byte)bpm; posTasa %= TAM;
      int suma = 0;
      for (byte i = 0; i < TAM; i++) suma += tasas[i];
      bpmProm = suma / TAM;
    }
  }
  if (ahora - ultimoLatido > 5000) bpmProm = 0;   // sin latidos hace 5 s
}

// ================= BATERIA =================
int porcentajeBateria(float v) {
  const float V[] = {3.00, 3.30, 3.60, 3.70, 3.80, 3.90, 4.00, 4.20};
  const int   P[] = {0,    5,    20,   40,   60,   75,   90,   100};
  if (v <= V[0]) return 0;
  if (v >= V[7]) return 100;
  for (int i = 0; i < 7; i++)
    if (v <= V[i + 1]) return P[i] + (P[i + 1] - P[i]) * (v - V[i]) / (V[i + 1] - V[i]);
  return 0;
}

void actualizarBateria() {
  uint32_t suma = 0;
  for (int i = 0; i < 16; i++) suma += analogReadMilliVolts(PIN_BAT);
  vBat = (suma / 16.0) * 2.0 / 1000.0;     // divisor 100k/100k -> x2
  bateria = porcentajeBateria(vBat);
}

// ================= BOTON BOOT (recalibrar) =================
void revisarBoton(unsigned long ahora) {
  static unsigned long tPresion = 0;
  static bool presionado = false;
  bool abajo = (digitalRead(PIN_BOTON) == LOW);
  if (abajo && !presionado) { presionado = true; tPresion = ahora; }
  if (!abajo) presionado = false;
  if (presionado && ahora - tPresion >= 1000) { presionado = false; pedirCalibracion = true; }
}

// ================= SETUP / LOOP =================
void setup() {
  Serial.begin(115200);
  Serial.println("\nIniciando VitalVest...");

  pinMode(PIN_MOTOR, OUTPUT);  digitalWrite(PIN_MOTOR, LOW);
  pinMode(PIN_BUZZER, OUTPUT); digitalWrite(PIN_BUZZER, LOW);
  pinMode(PIN_BOTON, INPUT_PULLUP);
  analogSetPinAttenuation(PIN_BAT, ADC_11db);

  Wire.begin(SDA_PIN, SCL_PIN);

  mpu.initialize();
  mpuOK = mpu.testConnection();
  Serial.println(mpuOK ? "MPU6050 OK" : "ERROR: MPU6050 no detectado");

  sensorTemp.begin();
  sensorTemp.setWaitForConversion(false);
  Serial.print("DS18B20 encontrados: "); Serial.println(sensorTemp.getDeviceCount());

  maxOK = sensorCardiaco.begin(Wire, I2C_SPEED_FAST);
  if (maxOK) {
    sensorCardiaco.setup();
    sensorCardiaco.setPulseAmplitudeRed(0x0A);
    sensorCardiaco.setPulseAmplitudeGreen(0);
    Serial.println("MAX30102 OK");
  } else {
    Serial.println("AVISO: MAX30102 no detectado (BPM = 0), el resto sigue funcionando");
  }

  delay(1500);                // tiempo para ponerse en postura correcta
  calibrarPostura();
  actualizarBateria();
  iniciarBLE();
  Serial.println("VitalVest listo.");
}

void loop() {
  unsigned long ahora = millis();
  static unsigned long tPost = 0, tBat = 0, tBle = 0, tSer = 0;

  revisarBoton(ahora);
  if (pedirCalibracion) { pedirCalibracion = false; calibrarPostura(); }

  if (ahora - tPost >= INT_POSTURA) {
    tPost = ahora;
    actualizarPostura(ahora);
    actualizarActuadores(ahora);
  }

  actualizarTemperatura(ahora);
  actualizarPulso(ahora);

  if (ahora - tBat >= INT_BAT) { tBat = ahora; actualizarBateria(); }
  if (ahora - tBle >= INT_BLE) { tBle = ahora; enviarBLE(); }

  if (ahora - tSer >= INT_SERIAL) {
    tSer = ahora;
    Serial.print(estadoActual == VERDE ? "VERDE" : estadoActual == AMARILLO ? "AMARILLO" : "ROJO");
    Serial.print(" | Pitch: ");  Serial.print(pitch - pitchRef, 1);
    Serial.print(" | Roll: ");   Serial.print(roll - rollRef, 1);
    Serial.print(" | Desv: ");   Serial.print(desviacion, 1);
    Serial.print(" | Temp: ");   Serial.print(temperatura, 1); Serial.print(tempOK ? " C" : " C (sin sensor)");
    Serial.print(" | BPM: ");    Serial.print(bpmProm);
    Serial.print(" | Bat: ");    Serial.print(vBat, 2); Serial.print(" V ("); Serial.print(bateria); Serial.println("%)");
  }
}
