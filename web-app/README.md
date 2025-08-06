# Shower Timer - Web Application

A React-based web application for managing shower timers with history tracking and Bluetooth integration capabilities.

## Features

- **Timer Management**: Start, pause, resume, and stop shower timers
- **Name Input**: Enter names for individual shower sessions with marquee effect for long names
- **Customizable Duration**: Set shower duration from 5 seconds to 55 minutes
- **Audio Alerts**: Choose from bell, buzzer, or chime sounds for both alarm and warning
- **History Tracking**: View detailed shower history with timestamps
- **Settings Management**: Comprehensive settings with tabbed interface
- **Clock Face Customization**: Customize background, digit colors, fonts, and color schemes
- **Warning System**: Configurable warning duration with custom sounds
- **Bluetooth Integration**: Connect to external Arduino displays
- **Additional Controls**: Reset timer, sound alarm, and talk functionality
- **Responsive Design**: Works on desktop and mobile browsers

## Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Add audio files** (optional):
   - Place your audio files in the `public/sounds` directory
   - Name them as follows:
     - `bell.mp3`
     - `buzzer.mp3`
     - `chime.mp3`

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## Usage

### Basic Timer Operation

1. **Enter a name** in the input field (long names will scroll when timer starts)
2. **Configure settings** (optional):
   - Click the settings icon (⚙️) in the bottom right
   - Use the tabbed interface to organize settings
   - Set shower name, timer duration, sounds, appearance, and Bluetooth
3. **Start the timer** by clicking "Start"
4. **Control the timer**:
   - Pause/Resume: Temporarily stop or continue
   - End: Stop early and record the time
   - Reset: Completely stop the timer
   - Sound Alarm: Press and hold to test alarm sound
5. **View history** by clicking the history icon (📚)

### Customization Features

#### General Settings
- **Shower Name**: Set a name for the shower timer to identify it in history
- **Shower Duration**: Configure timer length from 5 seconds to 55 minutes
- **Warning Duration**: Set warning percentage (25%, 50%, 75%, none)

#### Clock Face Customization
- **Background Styles**: White, black, gradients, and ambient effects
- **Digit Colors**: Green (default), white, black, red, blue, yellow, cyan, magenta, orange, pink
- **Color Schemes**: Individual colors, neon, fire, ocean, sunset, rainbow with moving gradients
- **Digital Fonts**: Orbitron (default), modern digital clock appearance

#### Warning System
- **Warning Duration**: Set warning percentage (25%, 50%, 75%, none)
- **Warning Sound**: Choose separate sound for warning duration
- **Visual Indicators**: Clock face changes appearance during warning period

### Bluetooth Integration

1. **Connect to Arduino display**:
   - Click the Bluetooth icon when available
   - Select your HC-05/HC-06 module
   - Establish connection

2. **Use with external display**:
   - Timer countdown appears on LED display
   - Display shows current time when idle
   - Visual feedback when timer completes

## Project Structure

```
web-app/
├── public/                 # Public assets
│   ├── index.html         # Main HTML file
│   ├── sounds/            # Audio files
│   └── favicon.ico        # App icon
├── src/                   # Source code
│   ├── App.js            # Main application component
│   ├── App.css           # Application styles
│   ├── index.js          # Entry point
│   ├── index.css         # Global styles
│   └── BluetoothManager.js # Bluetooth integration
├── package.json          # Dependencies and scripts
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
└── README.md            # This file
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App
- `npm run lint` - Run ESLint with auto-fix
- `npm run lint:check` - Check for linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Run lint and format
- `npm run optimize` - Clean and build for production

## Configuration

### Timer Settings

- **Duration Options**: 5 seconds, 10-55 minutes (5-minute increments)
- **Alarm Sound Options**: Bell (default), Buzzer, Chime
- **Warning Sound Options**: Bell (default), Buzzer, Chime
- **Default Duration**: 20 minutes
- **Default Warning**: 25% of duration
- **Default Background**: Black
- **Default Digit Color**: Green
- **Default Font**: Orbitron

### Local Storage

The app uses browser local storage to persist:
- Timer history
- User settings (duration, alarm sound, warning sound, warning percentage)
- Clock face customization (background, digit color, color scheme, font)
- Last shower end time

### Bluetooth Configuration

- **Service UUID**: `0000ffe0-0000-1000-8000-00805f9b34fb`
- **Characteristic UUID**: `0000ffe1-0000-1000-8000-00805f9b34fb`
- **Baud Rate**: 9600
- **Supported Devices**: HC-05, HC-06, BT04

## Development

### Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Create React App
- **Styling**: Bootstrap 5, CSS3
- **Icons**: Font Awesome
- **Storage**: LocalStorage
- **Bluetooth**: Web Bluetooth API

### Key Components

- **App.js**: Main application logic and state management
- **BluetoothManager.js**: Bluetooth communication handling
- **Timer Display**: Digital clock-style countdown
- **Controls**: Start, pause, resume, stop, reset buttons
- **Modals**: Settings and history dialogs

### State Management

The app uses React hooks for state management:
- `useState` for local component state
- `useEffect` for side effects and lifecycle
- `useRef` for timer references and audio files
- `useCallback` for memoized functions

## Building for Production

### Development Build
```bash
npm run build
```

### Deployment Options

#### Static Hosting
1. Build the application: `npm run build`
2. Upload the `build` folder to your web server
3. Ensure audio files are in the correct location

#### Raspberry Pi Deployment
1. Build the application: `npm run build`
2. Copy to Raspberry Pi web server:
   ```bash
   sudo cp -r build/* /var/www/html/
   sudo mkdir -p /var/www/html/sounds
   sudo cp sounds/*.mp3 /var/www/html/sounds/
   ```

## Troubleshooting

### Common Issues

1. **Audio not playing**:
   - Check that audio files are in `public/sounds/`
   - Verify browser supports Web Audio API
   - Check browser volume settings

2. **Bluetooth not connecting**:
   - Ensure device is paired
   - Check browser supports Web Bluetooth API
   - Verify device is in range

3. **Timer not working**:
   - Check browser console for errors
   - Verify all dependencies are installed
   - Clear browser cache if needed

4. **History not saving**:
   - Check browser local storage is enabled
   - Verify no private browsing mode
   - Check for storage quota exceeded

### Browser Compatibility

- **Chrome**: Full support (including Bluetooth)
- **Firefox**: Full support (Bluetooth requires HTTPS)
- **Safari**: Full support (Bluetooth requires HTTPS)
- **Edge**: Full support (including Bluetooth)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `npm run clean`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 