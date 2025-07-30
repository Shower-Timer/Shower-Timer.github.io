# Shower Timer - Complete Project

A comprehensive shower timer application with web, Android, and Bluetooth integration capabilities.

## Project Structure

This repository contains three main components:

### 🖥️ Web Application (`web-app/`)
- React-based web application
- Responsive design for desktop and mobile browsers
- Local storage for timer history and settings
- Web Bluetooth API integration for external displays

### 📱 Android Application (`android-app/`)
- React Native Android app
- Optimized for tablets
- Native Android features and performance
- Bluetooth integration for external displays

### 🔗 Bluetooth Integration (`bluetooth-arduino/`)
- Arduino code for 7-segment LED display
- Bluetooth communication protocol
- Integration with 7-Segment Digital Clock V2 project
- Wiring diagrams and setup instructions

## Quick Start

### Web Application
```bash
cd web-app
npm install
npm start
```

### Android Application
```bash
cd android-app
./setup.sh
npm start
npm run android
```

### Bluetooth Arduino Setup
```bash
cd bluetooth-arduino
# Follow instructions in README.md
```

## Features

### Core Timer Functionality
- **Customizable Duration**: 5 seconds to 55 minutes
- **Name Input**: Track individual shower sessions
- **Audio Alerts**: Bell, buzzer, or chime sounds
- **Timer Controls**: Start, pause, resume, stop, reset
- **History Tracking**: Detailed shower history with timestamps

### Platform-Specific Features

#### Web App
- Responsive Bootstrap design
- Web Bluetooth API support
- Local storage persistence
- Cross-browser compatibility

#### Android App
- Native Android performance
- Tablet-optimized UI
- Native audio playback
- Offline functionality

#### Bluetooth Integration
- Real-time clock display
- Countdown timer display
- Wireless control
- Visual feedback and animations

## Technology Stack

### Web Application
- **Frontend**: React 18, Bootstrap 5
- **Build Tool**: Create React App
- **Styling**: CSS3, Bootstrap
- **Storage**: LocalStorage
- **Bluetooth**: Web Bluetooth API

### Android Application
- **Framework**: React Native 0.72
- **Language**: JavaScript/TypeScript
- **UI**: React Native components
- **Storage**: AsyncStorage
- **Audio**: React Native Sound
- **Bluetooth**: Native Android Bluetooth

### Arduino Integration
- **Microcontroller**: Arduino Uno/Nano or ESP8266
- **Display**: WS2812B LED strip
- **Communication**: HC-05/HC-06 Bluetooth module
- **Libraries**: FastLED, ArduinoJson, SoftwareSerial

## Installation

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **Android Studio** (for Android development)
- **Arduino IDE** (for Arduino development)
- **Java Development Kit (JDK)** (for Android)

### Web Application Setup
```bash
cd web-app
npm install
npm start
```

### Android Application Setup
```bash
cd android-app
./setup.sh
npm start
npm run android
```

### Bluetooth Arduino Setup
1. Install required Arduino libraries:
   - FastLED
   - ArduinoJson
   - SoftwareSerial (built-in)

2. Upload `ShowerTimerClock.ino` to your Arduino

3. Follow wiring instructions in `bluetooth-arduino/WIRING.md`

## Usage

### Basic Timer Operation
1. Enter a name for the shower session
2. Select desired duration
3. Click "Start" to begin the timer
4. Use pause/resume/stop controls as needed
5. Timer will alert when complete

### Bluetooth Display Integration
1. Connect to Bluetooth module via app
2. Start timer - display shows countdown
3. Monitor progress on LED display
4. Display flashes when timer completes

### History and Settings
- View detailed shower history
- Configure timer duration and sounds
- Clear history data
- Adjust display brightness (Bluetooth)

## Development

### Project Structure
```
shower-timer/
├── web-app/                 # React web application
│   ├── src/                # Source code
│   ├── public/             # Public assets
│   ├── package.json        # Dependencies
│   └── README.md           # Web app documentation
├── android-app/            # React Native Android app
│   ├── App.js             # Main app component
│   ├── android/           # Android project files
│   ├── package.json       # Dependencies
│   └── README.md          # Android app documentation
├── bluetooth-arduino/      # Arduino integration
│   ├── ShowerTimerClock.ino # Arduino code
│   ├── WIRING.md          # Wiring instructions
│   └── README.md          # Arduino documentation
└── README.md              # This file
```

### Building for Production

#### Web Application
```bash
cd web-app
npm run build
```

#### Android Application
```bash
cd android-app
npm run build:android      # Generate APK
npm run build:android-bundle # Generate App Bundle
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all platforms
5. Submit a pull request

## Troubleshooting

### Web Application Issues
- Check browser console for errors
- Verify Web Bluetooth API support
- Clear browser cache if needed

### Android Application Issues
- Check Metro bundler console
- Verify Android SDK setup
- Check device/emulator connection

### Bluetooth Integration Issues
- Verify wiring connections
- Check Bluetooth pairing
- Test with Bluetooth terminal app
- Review Arduino serial monitor

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on the [7-Segment Digital Clock V2](https://github.com/leonvandenbeukel/7-Segment-Digital-Clock-V2) project for Arduino integration
- Uses React and React Native for cross-platform development
- Bootstrap for responsive web design

## Support

For issues and questions:
1. Check the troubleshooting sections in each component's README
2. Review the documentation for each platform
3. Test with provided examples
4. Open an issue in the repository 