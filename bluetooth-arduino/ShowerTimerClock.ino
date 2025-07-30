#include <SoftwareSerial.h>
#include <FastLED.h>
#include <ArduinoJson.h>

// Bluetooth module configuration
#define BT_RX 2  // Connect to Bluetooth TX
#define BT_TX 3  // Connect to Bluetooth RX
SoftwareSerial bluetooth(BT_RX, BT_TX);

// LED configuration (based on the 7-Segment Clock V2 project)
#define NUM_LEDS 60
#define LED_PIN 6
CRGB leds[NUM_LEDS];

// 7-segment display configuration
#define SEGMENTS_PER_DIGIT 7
#define DIGITS 4  // HH:MM format
#define LEDS_PER_SEGMENT 5  // Based on the 7-Segment Clock V2 design

// Segment patterns for digits 0-9
const int digitPatterns[10][7] = {
  {1,1,1,1,1,1,0}, // 0
  {0,1,1,0,0,0,0}, // 1
  {1,1,0,1,1,0,1}, // 2
  {1,1,1,1,0,0,1}, // 3
  {0,1,1,0,0,1,1}, // 4
  {1,0,1,1,0,1,1}, // 5
  {1,0,1,1,1,1,1}, // 6
  {1,1,1,0,0,0,0}, // 7
  {1,1,1,1,1,1,1}, // 8
  {1,1,1,1,0,1,1}  // 9
};

// LED mapping for each segment of each digit
// This needs to be customized based on your specific LED layout
const int segmentMapping[4][7][5] = {
  // Digit 1 (Hours tens place)
  {{0,1,2,3,4}, {5,6,7,8,9}, {10,11,12,13,14}, {15,16,17,18,19}, {20,21,22,23,24}, {25,26,27,28,29}, {30,31,32,33,34}},
  // Digit 2 (Hours ones place)
  {{35,36,37,38,39}, {40,41,42,43,44}, {45,46,47,48,49}, {50,51,52,53,54}, {55,56,57,58,59}, {60,61,62,63,64}, {65,66,67,68,69}},
  // Digit 3 (Minutes tens place)
  {{70,71,72,73,74}, {75,76,77,78,79}, {80,81,82,83,84}, {85,86,87,88,89}, {90,91,92,93,94}, {95,96,97,98,99}, {100,101,102,103,104}},
  // Digit 4 (Minutes ones place)
  {{105,106,107,108,109}, {110,111,112,113,114}, {115,116,117,118,119}, {120,121,122,123,124}, {125,126,127,128,129}, {130,131,132,133,134}, {135,136,137,138,139}}
};

// Current time display
int currentHours = 0;
int currentMinutes = 0;
int currentSeconds = 0;
bool colonBlink = true;
unsigned long lastBlink = 0;

// Timer mode variables
bool timerMode = false;
int timerMinutes = 0;
int timerSeconds = 0;
bool timerRunning = false;
unsigned long timerStartTime = 0;

// Communication variables
String receivedData = "";
bool dataComplete = false;

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  bluetooth.begin(9600);
  
  // Initialize LED strip
  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
  
  // Clear all LEDs
  FastLED.clear();
  FastLED.show();
  
  Serial.println("Shower Timer Clock initialized");
  Serial.println("Waiting for Bluetooth connection...");
  
  // Display startup animation
  startupAnimation();
}

void loop() {
  // Handle Bluetooth communication
  handleBluetooth();
  
  // Update display
  if (timerMode && timerRunning) {
    updateTimerDisplay();
  } else {
    updateClockDisplay();
  }
  
  // Handle colon blinking
  handleColonBlink();
  
  // Update LED display
  FastLED.show();
  
  delay(100);
}

void handleBluetooth() {
  while (bluetooth.available()) {
    char c = bluetooth.read();
    
    if (c == '\n') {
      dataComplete = true;
      processReceivedData();
      receivedData = "";
    } else {
      receivedData += c;
    }
  }
}

void processReceivedData() {
  if (receivedData.length() == 0) return;
  
  // Try to parse as JSON
  DynamicJsonDocument doc(200);
  DeserializationError error = deserializeJson(doc, receivedData);
  
  if (!error) {
    String command = doc["command"];
    
    if (command == "setTime") {
      currentHours = doc["hours"];
      currentMinutes = doc["minutes"];
      currentSeconds = doc["seconds"];
      timerMode = false;
      Serial.println("Time updated: " + String(currentHours) + ":" + String(currentMinutes));
    }
    else if (command == "startTimer") {
      timerMinutes = doc["minutes"];
      timerSeconds = doc["seconds"];
      timerMode = true;
      timerRunning = true;
      timerStartTime = millis();
      Serial.println("Timer started: " + String(timerMinutes) + ":" + String(timerSeconds));
    }
    else if (command == "stopTimer") {
      timerRunning = false;
      timerMode = false;
      Serial.println("Timer stopped");
    }
    else if (command == "pauseTimer") {
      timerRunning = false;
      Serial.println("Timer paused");
    }
    else if (command == "resumeTimer") {
      timerRunning = true;
      timerStartTime = millis() - (timerStartTime - millis());
      Serial.println("Timer resumed");
    }
    else if (command == "setBrightness") {
      int brightness = doc["brightness"];
      FastLED.setBrightness(brightness);
      Serial.println("Brightness set to: " + String(brightness));
    }
  } else {
    Serial.println("JSON parsing error: " + String(error.c_str()));
  }
}

void updateClockDisplay() {
  // Clear all LEDs
  FastLED.clear();
  
  // Display hours (first two digits)
  displayDigit(0, currentHours / 10);
  displayDigit(1, currentHours % 10);
  
  // Display minutes (last two digits)
  displayDigit(2, currentMinutes / 10);
  displayDigit(3, currentMinutes % 10);
  
  // Display colon
  if (colonBlink) {
    // Add colon LEDs here based on your layout
    // leds[colonLED1] = CRGB::WHITE;
    // leds[colonLED2] = CRGB::WHITE;
  }
}

void updateTimerDisplay() {
  // Calculate remaining time
  unsigned long elapsed = (millis() - timerStartTime) / 1000;
  int remainingSeconds = (timerMinutes * 60 + timerSeconds) - elapsed;
  
  if (remainingSeconds <= 0) {
    // Timer finished
    timerRunning = false;
    remainingSeconds = 0;
    // Flash display to indicate timer completion
    if (millis() % 1000 < 500) {
      FastLED.clear();
    } else {
      displayTime(0, 0);
    }
    return;
  }
  
  int displayMinutes = remainingSeconds / 60;
  int displaySeconds = remainingSeconds % 60;
  
  displayTime(displayMinutes, displaySeconds);
}

void displayTime(int minutes, int seconds) {
  FastLED.clear();
  
  // Display minutes
  displayDigit(0, minutes / 10);
  displayDigit(1, minutes % 10);
  
  // Display seconds
  displayDigit(2, seconds / 10);
  displayDigit(3, seconds % 10);
  
  // Display colon
  if (colonBlink) {
    // Add colon LEDs here
  }
}

void displayDigit(int digitIndex, int value) {
  if (value < 0 || value > 9 || digitIndex < 0 || digitIndex >= 4) return;
  
  // Get the pattern for this digit
  int* pattern = digitPatterns[value];
  
  // Light up the segments for this digit
  for (int segment = 0; segment < 7; segment++) {
    if (pattern[segment]) {
      // Light up all LEDs in this segment
      for (int led = 0; led < 5; led++) {
        int ledIndex = segmentMapping[digitIndex][segment][led];
        if (ledIndex < NUM_LEDS) {
          leds[ledIndex] = CRGB::WHITE;
        }
      }
    }
  }
}

void handleColonBlink() {
  if (millis() - lastBlink > 500) {
    colonBlink = !colonBlink;
    lastBlink = millis();
  }
}

void startupAnimation() {
  // Animate each digit from 0 to 9
  for (int digit = 0; digit < 4; digit++) {
    for (int value = 0; value < 10; value++) {
      FastLED.clear();
      displayDigit(digit, value);
      FastLED.show();
      delay(100);
    }
  }
  
  // Final clear
  FastLED.clear();
  FastLED.show();
}

// Function to send status back to the app
void sendStatus(String status) {
  DynamicJsonDocument doc(100);
  doc["status"] = status;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  bluetooth.println(jsonString);
} 