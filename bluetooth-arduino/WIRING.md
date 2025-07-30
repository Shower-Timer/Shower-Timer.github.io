# Bluetooth Integration Wiring Guide

This guide shows how to connect a Bluetooth module to your Arduino and integrate it with the 7-Segment Digital Clock V2 project.

## Components Needed

1. **Arduino Uno/Nano** (or ESP8266 from the original project)
2. **HC-05 or HC-06 Bluetooth Module**
3. **WS2812B LED Strip** (60 LEDs for 4 digits)
4. **Power Supply** (5V, 2A minimum)
5. **Breadboard and Jumper Wires**

## Wiring Diagram

### Bluetooth Module Connection

```
HC-05/HC-06 Bluetooth Module:
┌─────────────────┐
│   HC-05/HC-06   │
│                 │
│ VCC ────────────┼─── 5V (Arduino)
│ GND ────────────┼─── GND (Arduino)
│ TX  ────────────┼─── Pin 2 (Arduino RX)
│ RX  ────────────┼─── Pin 3 (Arduino TX)
│ EN  ────────────┼─── 3.3V (for HC-05)
│ STATE ──────────┼─── (optional, for status)
└─────────────────┘
```

### LED Strip Connection

```
WS2812B LED Strip:
┌─────────────────┐
│   WS2812B       │
│   LED Strip     │
│                 │
│ VCC ────────────┼─── 5V (Power Supply)
│ GND ────────────┼─── GND (Power Supply)
│ DIN ────────────┼─── Pin 6 (Arduino)
└─────────────────┘
```

## Detailed Connections

### Arduino Pin Mapping

| Arduino Pin | Connection | Purpose |
|-------------|------------|---------|
| Pin 2 | Bluetooth TX | Receive data from Bluetooth |
| Pin 3 | Bluetooth RX | Send data to Bluetooth |
| Pin 6 | LED Strip DIN | Control LED strip |
| 5V | Bluetooth VCC | Power Bluetooth module |
| GND | Bluetooth GND | Common ground |
| 5V | LED Strip VCC | Power LED strip |
| GND | LED Strip GND | Common ground |

### Power Considerations

- **Bluetooth Module**: 3.3V logic level, but VCC can be 5V
- **LED Strip**: 5V power supply required
- **Current**: LED strip can draw up to 2A at full brightness
- **Voltage Divider**: If using 5V Arduino with 3.3V Bluetooth module, use voltage divider for RX line

## Setup Instructions

### 1. Hardware Setup

1. **Connect Bluetooth Module**:
   - VCC → 5V
   - GND → GND
   - TX → Pin 2 (Arduino RX)
   - RX → Pin 3 (Arduino TX)

2. **Connect LED Strip**:
   - VCC → 5V power supply
   - GND → GND
   - DIN → Pin 6

3. **Power Supply**:
   - Use a 5V, 2A power supply for the LED strip
   - Arduino can be powered via USB or external power

### 2. Software Setup

1. **Install Required Libraries**:
   ```cpp
   // In Arduino IDE, go to Tools → Manage Libraries
   // Install these libraries:
   - FastLED
   - ArduinoJson
   - SoftwareSerial (built-in)
   ```

2. **Upload the Code**:
   - Open `ShowerTimerClock.ino` in Arduino IDE
   - Select your board and port
   - Upload the code

### 3. Bluetooth Configuration

1. **Pair with Device**:
   - Default password is usually "1234" or "0000"
   - Device name is typically "HC-05" or "BT04"

2. **Test Connection**:
   - Use a Bluetooth terminal app to test
   - Send: `{"command":"setTime","hours":12,"minutes":30,"seconds":0}`

## LED Layout Configuration

The `segmentMapping` array in the Arduino code needs to be customized based on your specific LED layout. Here's how to determine the correct mapping:

### 7-Segment Display Layout

```
    a
   ---
f |   | b
   -g-
e |   | c
   ---
    d
```

### LED Numbering

For a 4-digit display (HH:MM), you need 60 LEDs:
- 15 LEDs per digit (7 segments × ~2 LEDs per segment)
- Each segment typically uses 2-3 LEDs

### Mapping Example

```cpp
const int segmentMapping[4][7][5] = {
  // Digit 1 (Hours tens place) - LEDs 0-14
  {{0,1,2,3,4}, {5,6,7,8,9}, {10,11,12,13,14}, ...},
  // Digit 2 (Hours ones place) - LEDs 15-29
  {{15,16,17,18,19}, {20,21,22,23,24}, ...},
  // Digit 3 (Minutes tens place) - LEDs 30-44
  {{30,31,32,33,34}, {35,36,37,38,39}, ...},
  // Digit 4 (Minutes ones place) - LEDs 45-59
  {{45,46,47,48,49}, {50,51,52,53,54}, ...}
};
```

## Troubleshooting

### Common Issues

1. **Bluetooth Not Connecting**:
   - Check if device is paired
   - Verify baud rate (9600)
   - Check wiring connections

2. **LEDs Not Lighting**:
   - Verify power supply voltage (5V)
   - Check data line connection
   - Ensure correct LED count in code

3. **Wrong Display**:
   - Adjust `segmentMapping` array
   - Test individual segments
   - Verify digit patterns

### Testing Commands

Use these JSON commands to test:

```json
// Set current time
{"command":"setTime","hours":12,"minutes":30,"seconds":0}

// Start a 5-minute timer
{"command":"startTimer","minutes":5,"seconds":0}

// Stop timer
{"command":"stopTimer"}

// Set brightness (0-255)
{"command":"setBrightness","brightness":100}
```

## Integration with Shower Timer App

The Arduino will automatically:
1. Display current time when no timer is running
2. Switch to countdown display when timer starts
3. Flash display when timer completes
4. Return to clock display when timer stops

## Safety Notes

- Use appropriate power supply for LED strip
- Ensure proper grounding
- Don't exceed Arduino pin current limits
- Use voltage divider if needed for 3.3V modules 