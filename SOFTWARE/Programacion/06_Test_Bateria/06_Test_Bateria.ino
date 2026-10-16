/* TEST 6 - Nivel de bateria 1S (divisor 100k/100k en GPIO34)
   Tension en el pin = Vbat / 2  (maximo ~2.1 V con 4.2 V, el zener no conduce).
   Comparar el valor mostrado con un multimetro sobre +BATT. */
#define PIN_BAT 34

float leerVbat() {
  uint32_t suma = 0;
  for (int i = 0; i < 16; i++) { suma += analogReadMilliVolts(PIN_BAT); delay(2); }
  float mVpin = suma / 16.0;
  return (mVpin * 2.0) / 1000.0;   // x2 por el divisor 100k/100k
}

int porcentaje(float v) {
  // Tabla aproximada Li-ion 1S (tension -> %)
  const float V[] = {3.00, 3.30, 3.60, 3.70, 3.80, 3.90, 4.00, 4.20};
  const int   P[] = {0,    5,    20,   40,   60,   75,   90,   100};
  if (v <= V[0]) return 0;
  if (v >= V[7]) return 100;
  for (int i = 0; i < 7; i++) {
    if (v <= V[i + 1]) return P[i] + (P[i + 1] - P[i]) * (v - V[i]) / (V[i + 1] - V[i]);
  }
  return 0;
}

void setup() {
  Serial.begin(115200);
  analogSetPinAttenuation(PIN_BAT, ADC_11db);
}

void loop() {
  float v = leerVbat();
  Serial.print("Vbat: "); Serial.print(v, 2);
  Serial.print(" V | Bateria: "); Serial.print(porcentaje(v)); Serial.println(" %");
  delay(1000);
}
