# Bluetooth Integration for Shower Timer

This project integrates your Shower Timer app with an external Arduino-based 7-segment LED clock display via Bluetooth. The Arduino display shows either the current time or a countdown timer based on commands from your shower timer app.

## Overview

The system consists of three main components:

1. **Shower Timer App** (Web or Android) - Controls the timer and sends commands
2. **Arduino with Bluetooth Module** - Receives commands and controls the display
3. **7-Segment LED Display** - Shows time or countdown visually

## Features

- **Real-time Clock Display**: Shows current time when no timer is active
- **Countdown Timer**: Displays remaining shower time
- **Bluetooth Communication**: Wireless control from your app
- **Visual Feedback**: Flashing display when timer completes
- **Brightness Control**: Adjustable LED brightness
- **Automatic Mode Switching**: Seamlessly switches between clock and timer modes

## Hardware Requirements

### Arduino Setup
- Arduino Uno/Nano or ESP8266
- HC-05 or HC-06 Bluetooth module
- WS2812B LED strip (60 LEDs for 4 digits)
- 5V, 2A power supply
- Breadboard and jumper wires

### LED Display
Based on the [7-Segment Digital Clock V2](https://github.com/leonvandenbeukel/7-Segment-Digital-Clock-V2) project:
- 4-digit 7-segment display
- WS2812B addressable LEDs
- Each digit uses 15 LEDs (7 segments × ~2 LEDs per segment)

## Software Components

### 1. Arduino Code (`ShowerTimerClock.ino`)
- Receives JSON commands via Bluetooth
- Controls LED display patterns
- Handles timer countdown logic
- Manages display modes

### 2. Web App Integration (`src/BluetoothManager.js`)
- Web Bluetooth API integration
- Sends timer commands to Arduino
- Handles connection management
- Provides status feedback

### 3. Android App Integration (`android-app/BluetoothManager.js`)
- React Native Bluetooth integration
- Native Android Bluetooth communication
- Cross-platform compatibility

## Communication Protocol

The system uses JSON messages for communication:

### Commands Sent from App to Arduino

```json
// Set current time
{
  "command": "setTime",
  "hours": 12,
  "minutes": 30,
  "seconds": 0
}

// Start timer
{
  "command": "startTimer",
  "minutes": 10,
  "seconds": 0
}

// Stop timer
{
  "command": "stopTimer"
}

// Pause timer
{
  "command": "pauseTimer"
}

// Resume timer
{
  "command": "resumeTimer"
}

// Set brightness (0-255)
{
  "command": "setBrightness",
  "brightness": 100
}
```

### Status Messages from Arduino to App

```json
{
  "status": "timer_completed"
}
```

## Installation and Setup

### Step 1: Arduino Setup

1. **Install Required Libraries**:
   ```cpp
   // In Arduino IDE:
   // Tools → Manage Libraries
   - FastLED
   - ArduinoJson
   - SoftwareSerial (built-in)
   ```

2. **Upload Arduino Code**:
   - Open `ShowerTimerClock.ino`
   - Select your board and port
   - Upload the code

3. **Hardware Connections**:
   - Follow the wiring guide in `WIRING.md`
   - Connect Bluetooth module to pins 2 and 3
   - Connect LED strip to pin 6

### Step 2: App Integration

#### Web App
1. Import the Bluetooth manager:
   ```javascript
   import BluetoothManager from './BluetoothManager.js';
   ```

2. Initialize and connect:
   ```javascript
   const bluetooth = new BluetoothManager();
   await bluetooth.connect();
   ```

3. Send commands:
   ```javascript
   await bluetooth.startTimer(10, 0); // 10 minutes
   await bluetooth.stopTimer();
   ```

#### Android App
1. Add Bluetooth permissions to `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
   ```

2. Import and use the Bluetooth manager:
   ```javascript
   import BluetoothManager from './BluetoothManager.js';
   ```

## Usage

### Basic Operation

1. **Connect Bluetooth**: Pair your device with the HC-05/HC-06 module
2. **Start App**: Open the shower timer app
3. **Establish Connection**: Connect to the Arduino via Bluetooth
4. **Use Timer**: Start a shower timer - the display will show countdown
5. **Monitor Progress**: Watch the countdown on the LED display
6. **Timer Complete**: Display flashes when timer finishes

### Display Modes

- **Clock Mode**: Shows current time (HH:MM format)
- **Timer Mode**: Shows countdown (MM:SS format)
- **Completion Mode**: Flashing display when timer reaches zero

### LED Patterns

- **White LEDs**: Normal display
- **Flashing**: Timer completion
- **Colon Blinking**: Time separator (every 500ms)

## Customization

### LED Layout
Modify the `segmentMapping` array in the Arduino code to match your specific LED layout:

```cpp
const int segmentMapping[4][7][5] = {
  // Customize LED numbers for each segment of each digit
  // Based on your physical LED arrangement
};
```

### Display Colors
Change LED colors by modifying the color values:

```cpp
leds[ledIndex] = CRGB::WHITE;  // White
leds[ledIndex] = CRGB::RED;    // Red
leds[ledIndex] = CRGB::GREEN;  // Green
leds[ledIndex] = CRGB::BLUE;   // Blue
```

### Brightness
Control brightness via the app or Arduino code:

```cpp
FastLED.setBrightness(50);  // 0-255
```

## Troubleshooting

### Common Issues

1. **Bluetooth Connection Fails**:
   - Check device pairing
   - Verify baud rate (9600)
   - Ensure Bluetooth is enabled

2. **Display Not Working**:
   - Check power supply (5V, 2A)
   - Verify LED strip connections
   - Test individual segments

3. **Wrong Time Display**:
   - Adjust `segmentMapping` array
   - Verify digit patterns
   - Check JSON command format

4. **Timer Not Syncing**:
   - Check Bluetooth connection status
   - Verify command format
   - Test with Bluetooth terminal app

### Testing

Use a Bluetooth terminal app to test commands:

```json
{"command":"setTime","hours":12,"minutes":30,"seconds":0}
{"command":"startTimer","minutes":5,"seconds":0}
{"command":"stopTimer"}
```

## Advanced Features

### Multiple Displays
You can connect multiple Arduino displays by using different Bluetooth modules and modifying the app to handle multiple connections.

### Custom Animations
Add custom LED animations by modifying the Arduino code:

```cpp
void customAnimation() {
  // Add your custom animation code
}
```

### Data Logging
The Arduino can log timer data and send it back to the app for history tracking.

## Safety and Maintenance

- Use appropriate power supply for LED strip
- Ensure proper grounding
- Don't exceed Arduino pin current limits
- Keep Bluetooth module firmware updated
- Clean LED strip connections periodically

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the wiring guide
3. Test with Bluetooth terminal app
4. Check Arduino serial monitor for debug info

## License

This project is licensed under the MIT License - see the LICENSE file for details. 