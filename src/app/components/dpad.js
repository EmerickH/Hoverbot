Vue.component('dpad-tile', {
  props: {
    title: String,
    send: {
      type: Function,
      required: true,
    },
    heartbeat: {
      type: Number,
      default: 450,
    },
    teleop: Boolean,
    response: Boolean,
  },
  data() {
    return {
      settings: {
        speedMin: 0,
        speedMax: 120,
        speedStep: 1,
      },
      driveMessage: {
        speed: 20,
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false,
        customL: 0,
        customR: 0,
      },
      gamepad: {
        gp: null,
        searchi: null,
        interval: Number,
        max: 50,
        min: 11,
        active: false,
      },
      shutd: false,
    };
  },
  computed: {
    isActive() {
      if (this.driveMessage.ArrowUp) return true;
      if (this.driveMessage.ArrowLeft) return true;
      if (this.driveMessage.ArrowRight) return true;
      if (this.driveMessage.ArrowDown) return true;
      if ((this.driveMessage.customL>0 || this.driveMessage.customR>0) && this.driveMessage.speed>0) return true;
      return false;
    },
  },
  created() {
    document.addEventListener('keydown', (e) => {
      // Only use arrow keys for dpad if no other element is active
      if (document.activeElement !== document.body) return;
      // Check for arrow keycode (ArrowLeft = 37, ArrowUp = 38, ArrowRight = 39, ArrowDown = 40)
      if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
        this.onDpad(e.key);
      }
    });
    document.addEventListener('keyup', (e) => {
      // Only use arrow keys for dpad if no other element is active
      if (document.activeElement !== document.body) return;
      // Check for arrow keycode (ArrowLeft = 37, ArrowUp = 38, ArrowRight = 39, ArrowDown = 40)
      if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
        this.onRelease(e.key);
      }
    });
  },
  mounted() {
    // Bind all relevent touch event listeners to each dpad button
    this.addTouchListeners(this.$refs.up, 'ArrowUp');
    this.addTouchListeners(this.$refs.left, 'ArrowLeft');
    this.addTouchListeners(this.$refs.right, 'ArrowRight');
    this.addTouchListeners(this.$refs.down, 'ArrowDown');
    this.gamepad.searchi = setInterval(this.pollGamepads, this.gamepad.interval);
  },
  methods: {
    addTouchListeners(element, value) {
      element.addEventListener('touchstart', (e) => { this.onTouchStart(e, value); }, false);
      element.addEventListener('touchend', (e) => { this.onTouchEnd(e, value); }, false);
      element.addEventListener('touchcancel', (e) => { this.onTouchEnd(e, value); }, false);
    },
    onTouchStart(event, value) {
      // Do not interpret single touch as a click
      event.preventDefault();
      this.onDpad(value);
    },
    onTouchEnd(event, value) {
      // Do not interpret single touch as a click
      event.preventDefault();
      this.onRelease(value);
    },
    drive() {
      // Clear the interval in case it was not stopped
      clearInterval(this.driveHearbeat);
      // Send the first message and start the drive heartbeat
      this.send('dpad', this.driveMessage);
      this.driveHearbeat = setInterval(() => {
        this.send('dpad', this.driveMessage);
        console.log(this.driveMessage.customL + ";" + this.driveMessage.customR + ";" + this.driveMessage.speed);
      }, this.heartbeat);
    },
    stopdrive() {
      clearInterval(this.driveHearbeat);
      this.send('stop', {});
    },
    onDpad(key) {
      if (!(key in this.driveMessage)) return;
      // If it was previously inactive, set start flag
      const start = !this.isActive;
      // If the key is not yet fired, update the drive message
      if (!this.driveMessage[key]) this.driveMessage[key] = true;
      // With the updated drive message, start the drive heartbeat
      if (start) this.drive();
    },
    onRelease(key) {
      if (!(key in this.driveMessage)) return;
      // Log the previous active status
      const wasActive = this.isActive;
      // Update the drive message
      this.driveMessage[key] = false;
      // If the dpad went from active to inactive, stop heartbeat loop and send stop message
      if (!this.isActive && wasActive) {
        this.stopdrive();
      }
    },
    pollGamepads() {
      var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
      //var conn = false;
      for (var i = 0; i < gamepads.length; i++) {
        var gp = gamepads[i];
        if (gp) {
          console.log("Gamepad connected at index " + gp.index + ": " + gp.id +
            ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.");
          if (gp.axes.length > 3){
          clearInterval(this.gamepad.searchi);
          this.gamepad.gp = gp;
          //this.drive();
          this.gameLoop();
          clearInterval(this.gamepad.searchi);
          return;
          }
        }
      }
      clearInterval(this.gamepad.searchi);
    },
    gameLoop() {
      var gp = this.gamepad.gp;
      //console.log(gp)
      var maxi = Math.max(Math.abs(gp.axes[0]), Math.abs(gp.axes[1]));
      var mini = this.gamepad.min / this.gamepad.max;
        
      if (this.buttonPressed(gp.buttons[7]) && maxi>mini) {
        this.driveMessage.speed = Math.round(gp.axes[1] * gp.axes[1] * this.gamepad.max);
        
        if (this.driveMessage.speed < this.gamepad.min && Math.abs(gp.axes[0]) > mini){
          this.driveMessage.speed = Math.round(gp.axes[0] * gp.axes[0] * 30);
          this.driveMessage.customL = (gp.axes[0] > mini) ? -1 : 1;
          this.driveMessage.customR = (gp.axes[0] < -mini) ? -1 : 1;
        }else{
          var axev = 1-gp.axes[2]*gp.axes[2];
          this.driveMessage.customL = (gp.axes[2] > mini) ? axev : 1;
          this.driveMessage.customR = (gp.axes[2] < -mini) ? axev : 1;
          
          if(gp.axes[1] > 0){
            this.driveMessage.customL = -this.driveMessage.customL;
            this.driveMessage.customR = -this.driveMessage.customR;
          }
        }
        

        if (!this.gamepad.active){
          this.drive();
          this.gamepad.active = true;
        }
      }else{
        this.driveMessage.speed = 0;
        this.stopdrive();
        this.gamepad.active = false;
      }
        
      if (this.gamepad.Arrow != this.gamepad.oldArrow){
          this.onDpad(this.gamepad.Arrow);
          if (this.gamepad.oldArrow != "no"){
              this.onRelease(this.gamepad.oldArrow);
          }
          this.gamepad.oldArrow = this.gamepad.Arrow;
      }
        
      if (this.buttonPressed(gp.buttons[1])) {
          if (this.shutd == false){
              this.shutd = true;
              console.log("Shutdown...");
              this.send('shutdown', {});
              setTimeout(this.endShutdown, 1000);
          }
      }else if(this.buttonPressed(gp.buttons[0])){
          if (this.shutd == false){
              this.shutd = true;
              console.log("Starting...");
              this.send('start', {});
              setTimeout(this.endShutdown, 1000);
          }
      }
        
      requestAnimationFrame(this.gameLoop);
    },
    endShutdown(){
       this.shutd = false;
       console.log("End shutdown..."); 
    },
    buttonPressed(b) {
      if (typeof(b) == "object") {
        return b.pressed;
      }
      return b == 1.0;
    },
  },
  template: `<div>
    <div class="title">
      <span>{{ title }}</span>
      <span v-if="teleop && response" class="tag is-success">teleop control</span>
      <span v-else-if="!teleop && response" class="tag is-warning">robot busy</span>
      <span v-else class="tag is-info">pending</span>
    </div>
    <div class="columns">
      <div id="dpad-container" class="column">
          <div>
              <button ref="up" class="button circle-button is-primary" style="margin: 10px" v-bind:class="{ 'is-active' : this.driveMessage.ArrowUp }"
                @mousedown="onDpad('ArrowUp')" @mouseup="onRelease('ArrowUp')" @mouseleave="onRelease('ArrowUp')">
                <span class="icon"><i class="fas fa-arrow-up"></i></span>
              </button>
          </div>
          <div>
              <button ref="left" class="button circle-button is-primary" style="margin-right: 25px" v-bind:class="{ 'is-active' : this.driveMessage.ArrowLeft }"
                @mousedown="onDpad('ArrowLeft')" @mouseup="onRelease('ArrowLeft')" @mouseleave="onRelease('ArrowLeft')">
                <span class="icon"><i class="fas fa-arrow-left"></i></span>
              </button>
              <button ref="right" class="button circle-button is-primary" style="margin-left: 25px" v-bind:class="{ 'is-active' : this.driveMessage.ArrowRight }"
                @mousedown="onDpad('ArrowRight')" @mouseup="onRelease('ArrowRight')" @mouseleave="onRelease('ArrowRight')">
                <span class="icon"><i class="fas fa-arrow-right"></i></span>
              </button>
          </div>
          <div>
              <button ref="down" class="button circle-button is-primary" style="margin: 10px" v-bind:class="{ 'is-active' : this.driveMessage.ArrowDown }"
                @mousedown="onDpad('ArrowDown')" @mouseup="onRelease('ArrowDown')" @mouseleave="onRelease('ArrowDown')">
                <span class="icon"><i class="fas fa-arrow-down"></i></span>
              </button>
          </div>

      </div>
      <div class="column">
        <div class="level"><div class="level-item"><h1 class="subtitle is-1">{{ driveMessage.speed }}</h1></div></div>
        <div class="level"><div class="level-item"><input type="range" class="slider" v-model="driveMessage.speed" :min="settings.speedMin" :max="settings.speedMax" :step="settings.speedStep"></div></div>
        <div class="level"><div class="level-item"><h6 class="subtitle is-6">drive speed</h6></div></div>
        <div class="level"><div class="level-item"><input type="range" class="slider" v-model="gamepad.max" :min="settings.speedMin" :max="settings.speedMax" :step="settings.speedStep"></div></div>
        <div class="level"><div class="level-item"><h6 class="subtitle is-6">max gamepad value {{ driveMessage.customL }};{{ driveMessage.customR }}</h6></div></div>
      </div>
    </div>
    </div>`,
});
