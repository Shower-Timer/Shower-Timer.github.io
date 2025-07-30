class BluetoothManager {
  constructor () {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;
    this.isSupported = 'bluetooth' in navigator;

    // Service and characteristic UUIDs for serial communication
    this.SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
    this.CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
  }

  async connect () {
    if (!this.isSupported) {
      throw new Error('Bluetooth not supported in this browser');
    }

    try {
      // Request Bluetooth device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          {
            services: [this.SERVICE_UUID],
          },
          {
            namePrefix: 'HC-05', // Common Bluetooth module name
          },
          {
            namePrefix: 'BT04', // Alternative name
          },
        ],
        optionalServices: [this.SERVICE_UUID],
      });

      // eslint-disable-next-line no-console
      console.log('Device selected:', this.device.name);

      // Connect to GATT server
      this.server = await this.device.gatt.connect();
      // eslint-disable-next-line no-console
      console.log('Connected to GATT server');

      // Get the service
      this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
      // eslint-disable-next-line no-console
      console.log('Service found');

      // Get the characteristic
      this.characteristic = await this.service.getCharacteristic(this.CHARACTERISTIC_UUID);
      // eslint-disable-next-line no-console
      console.log('Characteristic found');

      this.isConnected = true;
      // eslint-disable-next-line no-console
      console.log('Bluetooth connection established');

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Bluetooth connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect () {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    // eslint-disable-next-line no-console
    console.log('Bluetooth disconnected');
  }

  onDisconnected () {
    // eslint-disable-next-line no-console
    console.log('Bluetooth device disconnected');
    this.isConnected = false;
    // You can add reconnection logic here if needed
  }

  async sendCommand (command, data = {}) {
    if (!this.isConnected || !this.characteristic) {
      throw new Error('Bluetooth not connected');
    }

    const message = {
      command,
      ...data,
      timestamp: Date.now(),
    };

    const jsonString = `${JSON.stringify(message)}\n`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    try {
      await this.characteristic.writeValue(dataBuffer);
      // eslint-disable-next-line no-console
      console.log('Sent command:', message);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send command:', error);
      throw error;
    }
  }

  // Timer-specific commands
  async startTimer (minutes, seconds) {
    await this.sendCommand('startTimer', { minutes, seconds });
  }

  async stopTimer () {
    await this.sendCommand('stopTimer');
  }

  async pauseTimer () {
    await this.sendCommand('pauseTimer');
  }

  async resumeTimer () {
    await this.sendCommand('resumeTimer');
  }

  async setCurrentTime () {
    const now = new Date();
    await this.sendCommand('setTime', {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    });
  }

  async setBrightness (brightness) {
    await this.sendCommand('setBrightness', { brightness });
  }

  // Get connection status
  getConnectionStatus () {
    return {
      isSupported: this.isSupported,
      isConnected: this.isConnected,
      deviceName: this.device ? this.device.name : null,
    };
  }
}

export default BluetoothManager; 