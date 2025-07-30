#!/bin/bash

echo "🚿 Setting up Shower Timer Android App"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java Development Kit (JDK) first."
    exit 1
fi

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME environment variable is not set."
    echo "   Please set it to your Android SDK path."
    echo "   Example: export ANDROID_HOME=\$HOME/Library/Android/sdk"
fi

echo "✅ Prerequisites check completed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install React Native CLI globally if not already installed
if ! command -v react-native &> /dev/null; then
    echo "📦 Installing React Native CLI globally..."
    npm install -g @react-native-community/cli
fi

# Create assets directory
echo "📁 Creating assets directory..."
mkdir -p android/app/src/main/assets

# Check if audio files exist in the parent directory
if [ -d "../public/sounds" ]; then
    echo "🔊 Copying audio files..."
    cp ../public/sounds/*.mp3 android/app/src/main/assets/ 2>/dev/null || echo "⚠️  Audio files not found in ../public/sounds/"
else
    echo "⚠️  Audio files directory not found. Please add bell.mp3, buzzer.mp3, and chime.mp3 to android/app/src/main/assets/"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Start Metro bundler: npm start"
echo "2. Run on Android: npm run android"
echo "3. Or build for production: npm run build:android"
echo ""
echo "For more information, see README.md" 