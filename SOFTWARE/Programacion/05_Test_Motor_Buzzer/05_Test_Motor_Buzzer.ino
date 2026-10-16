/* TEST 5 - Motor vibrador (GPIO18, via MMBT2222A) y Buzzer (GPIO23, via 2N2222F)
   Recorre los 3 estados para verificar los transistores. */
#define PIN_MOTOR  18
#define PIN_BUZZER 23

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MOTOR, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_MOTOR, LOW);
  digitalWrite(PIN_BUZZER, LOW);
}

void loop() {
  Serial.println("VERDE: todo apagado (3 s)");
  digitalWrite(PIN_MOTOR, LOW); digitalWrite(PIN_BUZZER, LOW);
  delay(3000);

  Serial.println("AMARILLO: motor 3 s + beep corto");
  digitalWrite(PIN_MOTOR, HIGH); digitalWrite(PIN_BUZZER, HIGH);
  delay(300);
  digitalWrite(PIN_BUZZER, LOW);
  delay(2700);
  digitalWrite(PIN_MOTOR, LOW);
  delay(2000);

  Serial.println("ROJO: motor + buzzer continuos (3 s)");
  digitalWrite(PIN_MOTOR, HIGH); digitalWrite(PIN_BUZZER, HIGH);
  delay(3000);
  digitalWrite(PIN_MOTOR, LOW); digitalWrite(PIN_BUZZER, LOW);
  delay(2000);
}
