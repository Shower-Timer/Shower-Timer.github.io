# TRM Shower Timer - React Version

A countdown timer application designed for Raspberry Pi 5 with Inland 3.5" TFT LCD Touch Screen Monitor, now built with React.

## Features

- Clean, modern interface using Bootstrap 5
- Configurable shower duration (5 seconds to 55 minutes)
- Multiple alert sound options
- Name input for tracking different users
- Pause/Resume functionality
- Digital clock-style display
- Touch-friendly interface
- Shower history tracking with local storage
- Early stop functionality

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add audio files:
   - Place your audio files in the `public/sounds` directory
   - Name them as follows:
     - `bell.mp3`
     - `buzzer.mp3`
     - `chime.mp3`

3. Start the development server:
   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### For Raspberry Pi Deployment

1. Build the production version:
   ```bash
   npm run build
   ```

2. Copy the `build` folder to your Raspberry Pi's web server directory:
   ```bash
   sudo cp -r build/* /var/www/html/
   ```

3. Ensure your audio files are in the correct location:
   ```bash
   sudo mkdir -p /var/www/html/sounds
   sudo cp sounds/*.mp3 /var/www/html/sounds/
   ```

## Usage

1. Enter a name in the input field
2. Click the gear icon to configure:
   - Select shower duration
   - Choose alert sound
3. Click "Start" to begin the timer
4. Use "Pause" to temporarily stop the timer
5. Use "End" to stop early and record the time
6. Use "Reset" to completely stop the timer
7. Click the history icon to view shower history

## Audio Files

You'll need to provide your own audio files for the alerts. Place them in the `public/sounds` directory with the following names:
- `bell.mp3`
- `buzzer.mp3`
- `chime.mp3`

## Requirements

- Raspberry Pi 5 (for deployment)
- Inland 3.5" TFT LCD Touch Screen Monitor (for deployment)
- Modern web browser
- Node.js (for development)

## Development

The app is built with:
- React 18
- Bootstrap 5
- Font Awesome icons
- Local Storage for data persistence

## Troubleshooting

If you encounter any issues:
1. Check that all dependencies are installed: `npm install`
2. Verify audio files are in the correct location
3. Check browser console for any JavaScript errors
4. Ensure your browser supports the Web Audio API 