void setup() {
  Serial.begin(115200);
  delay(3000);

  Serial.println();
  Serial.println("===== INICIO =====");
}

void loop() {
  Serial.println("ESP32 OK");
  delay(1000);
}