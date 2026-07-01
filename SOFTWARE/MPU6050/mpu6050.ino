#include <Wire.h>
#include <MPU6050.h>
#include <math.h>

MPU6050 mpu;

float roll = 0;
float pitch = 0;

unsigned long tiempoAnterior;

void setup() {
  Serial.begin(115200);
  Wire.begin();

  mpu.initialize();

  if (!mpu.testConnection()) {
    Serial.println("Error MPU6050");
    while (1);
  }

  tiempoAnterior = micros();
}

void loop() {
  int16_t ax, ay, az;
  int16_t gx, gy, gz;

  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  unsigned long tiempoActual = micros();
  float dt = (tiempoActual - tiempoAnterior) / 1000000.0;
  tiempoAnterior = tiempoActual;

  float accelRoll  = atan2(ay, az) * 180.0 / PI;
  float accelPitch = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0 / PI;

  float gyroRollRate  = gx / 131.0;
  float gyroPitchRate = gy / 131.0;

  roll  += gyroRollRate * dt;
  pitch += gyroPitchRate * dt;

  roll  = 0.98 * roll  + 0.02 * accelRoll;
  pitch = 0.98 * pitch + 0.02 * accelPitch;

  Serial.print("Roll: ");
  Serial.print(roll, 2);

  Serial.print("°  Pitch: ");
  Serial.print(pitch, 2);

  Serial.println("°");

  delay(10);
}