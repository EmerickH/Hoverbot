const EventEmitter = require('events').EventEmitter;
const SerialPort = require('serialport');
const logger = require('winston');

module.exports = class Motors extends EventEmitter {
  constructor(config) {
    super();
    this.name = 'Motors';
    this.MAX_SPEED = 240; // Maximum allowed hoverboard motor speed (RPMs)

    // Use optional config parameters if provided, otherwise use defaults
    const port = config.port || '/dev/ttyS0';
    const baudRate = config.baudRate || 9600;

    // Init serial port for motor control
    this.motorPort = new SerialPort(port, { baudRate });
    this.motorPort.on('error', (err) => {
      logger.error(`[${this.name}] ${err.message}`);
    });

    // Listen and parse incoming messages
    const Readline = SerialPort.parsers.Readline;
    const parser = this.motorPort.pipe(new Readline({ delimiter: '\n' }));

    // Initialize the status object
    // Note: battery status has an extra field for voltage value
    this.status = {
      parsing: { sB: 0, c: 0, m: 'not set' },
      speed: { sB: 1, c: 0, m: 'not set' },
      heartbeat: { sB: 2, c: 0, m: 'not set' },
      power: { sB: 3, c: 0, m: 'not set' },
      battery: { sB: 4, c: 0, v: 0, m: 'not set' },
      charging: { sB: 5, c: 0, m: 'not set' },
      position: { sB: 6, c: 0, l: 0, r: 0, m: 'not set' },
    };
    
    this.statusmessages = {
      0: { success: 'Good parsing', failure: 'Bad parsing' },
      1: { success: 'Speed in bounds', failure: 'Speed out of bounds' },
      2: { success: 'Heartbeat ok', failure: 'Heartbeat missing' },
      3: { success: 'Power ok', failure: 'Max power reached' },
      4: { success: 'Battery ok', failure: 'Low battery' },
      5: { success: 'Not charging', failure: 'Is charging' },
      6: { success: 'Position ok', failure: 'Position error' },
    };

    // When data is received from the motor controller, call to update status will update
    // the internal status object and emit a status event with the parsed status information
    parser.on('data', (data) => {
      try {
        const status = JSON.parse(data);
        logger.debug('[Hoverbot] ' + data);
        if (status.length === 2) this.updateStatus(status[0], status[1], false, 0, 0);
        if (status.length === 4) this.updateStatus(status[0], status[1], true, status[2], status[3]);
      } catch (err) {
        logger.error(`[${this.name}] ${err.message}`);
        this.emit('error', { message: 'Error parsing status message' });
      }
    });
  }

  updateStatus(statusByte, voltage, pos, posl, posr) {
    // Iterate over status entries to update each one with the new status byte
    Object.values(this.status).forEach((item) => {
      item.c = (statusByte >> item.sB) & 1; // eslint-disable-line no-bitwise
      if (item.c == 0){
        item.m = this.statusmessages[item.sB].success;
      }else{
        item.m = this.statusmessages[item.sB].failure;
      }
    });
    // Provided the battery status item still exists, update its voltage value
    if (this.status.battery) this.status.battery.v = voltage;
    if (pos){
        // Set positions
        this.status.position.l = posl;
        this.status.position.r = posr;
    }
    // Emit the updated status
    this.emit('status', this.status);
  }

  stop() {
    this.move(0, 0);
  }

  move(left, right) {
    let l = Math.round(left);
    if (left < -this.MAX_SPEED) l = -this.MAX_SPEED;
    if (left > this.MAX_SPEED) l = this.MAX_SPEED;
    let r = Math.round(right);
    if (right < -this.MAX_SPEED) r = -this.MAX_SPEED;
    if (right > this.MAX_SPEED) r = this.MAX_SPEED;
    const msg = `\nL${l.toString()},R${r.toString()}\n`;
    if (this.motorPort.isOpen) {
      this.motorPort.write(msg);
      logger.debug(`[${this.name}] Drive motors ${msg}`);
    } else {
      logger.debug(`[${this.name}] Motors port is closed.`);
    }
  }

  mock() {
    setInterval(() => {
      this.updateStatus(Math.floor(Math.random() * 6), Math.floor(Math.random() * 13) + 30);
    }, 2000);
  }
};
