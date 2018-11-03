//const animations = require('./animations.json');
const Hoverbot = require('./hoverbot/hoverbot.js');
const logger = require('winston');

const spawn = require('child_process').spawn;

// Initialize the hoverbot
const hoverbot = new Hoverbot('Ezebot 1', {
  motors: { baudRate: 19200 }
});

//hoverbot.lightring.animate(animations.start);

// Define callback for handling a new client connection
hoverbot.onClientConnected = () => {
  const response = {
    topic: 'connection',
    timestamp: Date.now(),
    data: {
      teleop: false,
      name: hoverbot.name,
      hasAudio: false
    },
  };
  //hoverbot.lightring.animate(animations.connection);
  return response;
};

// Handle stop command
hoverbot.on('stop', () => {
  hoverbot.motors.stop();
});

// Parse dpad command and move the hoverbot motors
hoverbot.on('dpad', (data) => {
  if ('customL' in data && 'customR' in data) {
    //let driveValues = [0, 0];
    //if (data.customL != 0 || data.customR != 0){
      hoverbot.motors.move(data.customL, data.customR);
    /*
      driveValues = [data.customL*data.speed, data.customR*data.speed];
    }else if (data.ArrowUp) {
      driveValues = [-data.speed, -data.speed];
      if (data.ArrowLeft) {
        driveValues[0] = 0;
      } else if (data.ArrowRight) {
        driveValues[1] = 0;
      }
    } else if (data.ArrowDown) {
      driveValues = [data.speed, data.speed];
      if (data.ArrowLeft) {
        driveValues[1] = 0;
      } else if (data.ArrowRight) {
        driveValues[0] = 0;
      }
    } else if (data.ArrowRight) {
      driveValues = [-data.speed, data.speed];
    } else if (data.ArrowLeft) {
      driveValues = [data.speed, -data.speed];
    }
    hoverbot.motors.move(driveValues[0], driveValues[1]);*/
  } else {
    logger.error('Dpad command missing required field(s)');
  }
});

// Parse shutdown and start command
hoverbot.on('shutdown', () => {
    //hoverbot.shutdown();
    var stopscript = spawn('/home/pi/stop-motors');
    logger.info('Shutdown...');
});
hoverbot.on('start', () => {
    var startscript = spawn('/home/pi/start-motors');
    logger.info('Starting...');
});
// Parse shutdown raspi
hoverbot.on('shutdownraspi', () => {
    //hoverbot.shutdown();
    var stopscript = spawn('/home/pi/stop');
    logger.info('Shutdown raspi...');
});

/*hoverbot.on('startsave', () => {
    hoverbot.motors.saving = 1;
    logger.info('Start saving...');
});

hoverbot.on('stopsave', () => {
    hoverbot.motors.saving = 0;
    logger.info('Stop saving...');
});

hoverbot.on('playsave', () => {
    hoverbot.motors.playsave();
});*/

// Handle the tts event from the UI
hoverbot.on('tts', (data) => {
  if (data.tts) hoverbot.audio.tts(data.tts);
});

// Handle the custom lightring state request from the UI
hoverbot.on('lightring_custom', (data) => {
  if (data.animation) hoverbot.lightring.animate(data.animation);
});

// Handle the lightring switch request from the UI
//hoverbot.on('lightring_switch', (data) => {
//  if (data.enabled) hoverbot.lightring.enable();
//  else if (typeof data.enabled === 'boolean' && !data.enabled) hoverbot.lightring.disable();
//});

// Handle any hoverbot errors and play a warning lightring animation
hoverbot.on('error', (err) => {
  logger.error(err);
});

// Listen for spi to emit sonar data, relay data via broadcast for the server to send to the client
hoverbot.spi.on('sonar', (data) => {
  hoverbot.broadcast('sonar', data);
});

// Listen for motors to emit status, relay data via broadcast for the server to send to the client
hoverbot.motors.on('status', (data) => {
  hoverbot.broadcast('motors', data);
});

module.exports = hoverbot;
