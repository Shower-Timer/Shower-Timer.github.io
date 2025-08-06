import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

class BluetoothManager {
  constructor() {
    this.isConnected = false;
    this.device = null;
    this.isSupported = Platform.OS === 'android';

    // For Android, we'll use a native module approach
    this.bluetoothModule = NativeModules.BluetoothSerial;
    this.eventEmitter = new NativeEventEmitter(this.bluetoothModule);

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.eventEmitter) {
      this.eventEmitter.addListener(
        'bluetoothConnected',
        this.onConnected.bind(this)
      );
      this.eventEmitter.addListener(
        'bluetoothDisconnected',
        this.onDisconnected.bind(this)
      );
      this.eventEmitter.addListener(
        'bluetoothDataReceived',
        this.onDataReceived.bind(this)
      );
      this.eventEmitter.addListener('bluetoothError', this.onError.bind(this));
    }
  }

  async connect() {
    if (!this.isSupported) {
      throw new Error('Bluetooth not supported on this platform');
    }

    try {
      const result = await this.bluetoothModule.connect();
      this.isConnected = result.connected;
      this.device = result.device;
      console.log('Bluetooth connected to:', this.device);
      return result;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      try {
        await this.bluetoothModule.disconnect();
        this.isConnected = false;
        this.device = null;
        console.log('Bluetooth disconnected');
      } catch (error) {
        console.error('Bluetooth disconnect failed:', error);
        throw error;
      }
    }
  }

  async sendCommand(command, data = {}) {
    if (!this.isConnected) {
      throw new Error('Bluetooth not connected');
    }

    const message = {
      command: command,
      ...data,
      timestamp: Date.now(),
    };

    const jsonString = JSON.stringify(message) + '\n';

    try {
      await this.bluetoothModule.write(jsonString);
      console.log('Sent command:', message);
    } catch (error) {
      console.error('Failed to send command:', error);
      throw error;
    }
  }

  // Timer-specific commands
  async startTimer(minutes, seconds) {
    await this.sendCommand('startTimer', { minutes, seconds });
  }

  async stopTimer() {
    await this.sendCommand('stopTimer');
  }

  async pauseTimer() {
    await this.sendCommand('pauseTimer');
  }

  async resumeTimer() {
    await this.sendCommand('resumeTimer');
  }

  async setCurrentTime() {
    const now = new Date();
    await this.sendCommand('setTime', {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    });
  }

  async setBrightness(brightness) {
    await this.sendCommand('setBrightness', { brightness });
  }

  // Event handlers
  onConnected(data) {
    this.isConnected = true;
    this.device = data.device;
    console.log('Bluetooth connected:', data);
  }

  onDisconnected() {
    this.isConnected = false;
    this.device = null;
    console.log('Bluetooth disconnected');
  }

  onDataReceived(data) {
    console.log('Received data from Arduino:', data);
  }

  onError(error) {
    console.error('Bluetooth error:', error);
  }

  getConnectionStatus() {
    return {
      isSupported: this.isSupported,
      isConnected: this.isConnected,
      deviceName: this.device ? this.device.name : null,
    };
  }

  cleanup() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('bluetoothConnected');
      this.eventEmitter.removeAllListeners('bluetoothDisconnected');
      this.eventEmitter.removeAllListeners('bluetoothDataReceived');
      this.eventEmitter.removeAllListeners('bluetoothError');
    }
  }
}

export default BluetoothManager;
