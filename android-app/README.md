# Shower Timer - Android Tablet Version

A React Native Android app for managing shower timers with history tracking and customizable settings.

## Features

- **Timer Management**: Start, pause, resume, and stop shower timers
- **Name Input**: Enter names for individual shower sessions
- **Customizable Duration**: Set shower duration from 5 seconds to 55 minutes
- **Audio Alerts**: Choose from bell, buzzer, or chime sounds
- **History Tracking**: View detailed shower history with timestamps
- **Settings Management**: Configure timer duration and alert sounds
- **Tablet Optimized**: Designed specifically for Android tablets with larger touch targets

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **Java Development Kit (JDK)** (version 11 or higher)
- **Android Studio** with Android SDK
- **Android SDK Platform Tools**
- **React Native CLI**

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd shower-timer/android-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install React Native CLI globally** (if not already installed):
   ```bash
   npm install -g @react-native-community/cli
   ```

## Android Setup

1. **Set up Android environment variables**:
   Add the following to your shell profile (`.bashrc`, `.zshrc`, etc.):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

2. **Create Android Virtual Device (AVD)** or connect a physical device:
   - Open Android Studio
   - Go to AVD Manager
   - Create a new virtual device (recommended: Tablet with API 30+)
   - Or connect a physical Android tablet via USB with USB debugging enabled

## Running the App

1. **Start Metro bundler**:
   ```bash
   npm start
   ```

2. **Run on Android** (in a new terminal):
   ```bash
   npm run android
   ```

   Or if you have a specific device connected:
   ```bash
   npx react-native run-android --deviceId=<device-id>
   ```

## Building for Production

### Generate APK

1. **Generate a signed APK**:
   ```bash
   npm run build:android
   ```

2. **Generate an App Bundle** (recommended for Play Store):
   ```bash
   npm run build:android-bundle
   ```

### Signing Configuration

For production builds, you'll need to configure signing:

1. **Generate a keystore**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in `android/app/build.gradle`**:
   ```gradle
   signingConfigs {
       release {
           storeFile file('my-release-key.keystore')
           storePassword 'your-store-password'
           keyAlias 'my-key-alias'
           keyPassword 'your-key-password'
       }
   }
   ```

3. **Update buildTypes**:
   ```gradle
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled true
           proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
       }
   }
   ```

## Project Structure

```
android-app/
├── App.js                 # Main application component
├── index.js              # Entry point
├── package.json          # Dependencies and scripts
├── android/              # Android-specific files
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/trmshowertimer/
│   │   │   │   ├── MainActivity.java
│   │   │   │   └── MainApplication.java
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
├── metro.config.js       # Metro bundler configuration
└── babel.config.js       # Babel configuration
```

## Audio Files

The app expects the following audio files in the Android assets folder:
- `bell.mp3`
- `buzzer.mp3`
- `chime.mp3`

To add these files:
1. Create the directory: `android/app/src/main/assets/`
2. Place the audio files in this directory
3. Rebuild the app

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build issues**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

3. **Permission issues**:
   - Ensure USB debugging is enabled on your device
   - Check that your device is properly connected
   - Try different USB cables or ports

4. **Audio not playing**:
   - Check that audio files are in the correct location
   - Ensure device volume is not muted
   - Verify audio permissions in AndroidManifest.xml

### Debugging

- Use React Native Debugger for better debugging experience
- Enable Chrome DevTools by shaking the device or pressing Cmd+M (Mac) / Ctrl+M (Windows)
- Check Metro bundler console for JavaScript errors
- Use Android Studio's Logcat for native Android logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different tablet sizes
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review React Native documentation
- Open an issue in the repository 