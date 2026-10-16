/* TEST 2 - MPU6050: inclinacion en grados (pitch y roll)
   - Al encender queda quieto ~2 s: esa es la postura de referencia (0 grados).
   - Luego inclina el modulo: muestra pitch, roll, desviacion y estado.
   Abrir Monitor Serie a 115200.  Libreria: MPU6050 (Electronic Cats). */
#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;
float pitchRef = 0, rollRef = 0;

void leerAngulos(float &pitch, float &roll) {
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);
  pitch = atan2((float)ay, sqrt((float)ax * ax + (float)az * az)) * 180.0 / PI;
  roll  = atan2(-(float)ax, (float)az) * 180.0 / PI;
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("ERROR: MPU6050 no detectado (revisar I2C)");
    while (true) delay(1000);
  }
  Serial.println("MPU6050 OK. Calibrando: quedate quieto en postura correcta...");
  delay(2000);
  float sp = 0, sr = 0, p, r;
  for (int i = 0; i < 50; i++) { leerAngulos(p, r); sp += p; sr += r; delay(20); }
  pitchRef = sp / 50; rollRef = sr / 50;
  Serial.print("Referencia -> pitch: "); Serial.print(pitchRef, 1);
  Serial.print("  roll: "); Serial.println(rollRef, 1);
}

void loop() {
  float p, r;
  leerAngulos(p, r);
  float dp = p - pitchRef, dr = r - rollRef;
  float desv = max(fabs(dp), fabs(dr));

  const char* estado = desv < 20 ? "VERDE" : (desv < 30 ? "AMARILLO" : "ROJO");

  Serial.print("Pitch: "); Serial.print(dp, 1);
  Serial.print(" | Roll: "); Serial.print(dr, 1);
  Serial.print(" | Desviacion: "); Serial.print(desv, 1);
  Serial.print(" grados | Estado: "); Serial.println(estado);
  delay(200);
}
