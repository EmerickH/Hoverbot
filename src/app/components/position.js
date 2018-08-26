Vue.component('position-tile', {
  props: {
    title: String,
    status: Object,
    send: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      init: false,
      oldl: 0,
      oldr: 0,
      rl: 0,
      rr: 0,
    };
  },
  mounted() {
    this.loop();
  },
  methods: {
    loop() {
      if ('position' in this.status) {
        if (this.status.position.l != this.oldl) {
          this.setRotation('l');
        }
        if (this.status.position.r != this.oldr) {
          this.setRotation('r');
        }
      }
      requestAnimationFrame(this.loop);
    },
    setRotation(name){
      //var old = this['old' + name];
      var newv = this.status.position[name]
      
       this['r' + name] = newv;
      
      /*if (old == 0 && newv == 5){
        this['r' + name] -= 4;
      }else if (old == 5 && newv == 0){
        this['r' + name] += 4;
      }else if (old < newv){
        this['r' + name] += 4 * (newv - old);
      }else{
        this['r' + name] -= 4 * (old - newv);
      }*/
      
      this.$refs['r' + name].style = 'transform: rotate(' + (this['r' + name] * 4) + 'deg)';
      this['old' + name] = newv;
    },
    startsave(){
      this.send('startsave', {});
    },
    stopsave(){
      this.send('stopsave', {});
    },
    playsave(){
      this.send('playsave', {});
    }
  },
  template: `<div>
    <div class="level">
      <div class="level-left"><div class="level-item"><p class="title">{{ title }}</p></div></div>
    </div>
    <div style="padding-bottom:10px">
        <div class="level">
            <div class="level-left">
                <div class="level-item roue" ref="rl">{{ this.oldl }}</div>
            </div>
            <div class="level-right">
                <div class="level-item roue" ref="rr">{{ this.oldr }}</div>
            </div>
        </div>
        <button @mouseup="startsave()">Start save</button>
        <button @mouseup="stopsave()">Stop save</button>
        <button @mouseup="playsave()">Play save</button>
    </div>`,
});
