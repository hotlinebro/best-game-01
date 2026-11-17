export class SolarAudio{
  constructor(){this.context=null;this.muted=false;}
  unlock(){
    try{
      if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.gain.value=.13;this.master.connect(this.context.destination);}
      if(this.context.state==='suspended')this.context.resume();
    }catch{}
  }
  toggle(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.13,this.context.currentTime,.02);return this.muted;}
  tone(f,to,duration,type='sine',delay=0){
    if(!this.context||this.muted)return;
    const ctx=this.context,t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+duration);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.6,t+.009);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  play(type){
    if(type==='throw')this.tone(900,110,.22,'triangle');
    if(type==='catch'){this.tone(660,990,.24);this.tone(990,1320,.28,'sine',.07);}
    if(type==='jump')this.tone(130,280,.12,'triangle');
    if(type==='land')this.tone(95,45,.08,'triangle');
    if(type==='glass'){this.tone(1800,400,.2,'sawtooth');this.tone(2400,600,.15,'sine',.04);}
    if(type==='bark'){this.tone(160,70,.13,'square');this.tone(180,80,.12,'square',.17);}
    if(type==='lose'){this.tone(360,60,.6,'triangle');this.tone(250,40,.7);}
    if(type==='win')[440,554,660,880].forEach((f,i)=>this.tone(f,f*1.01,.4,'sine',i*.12));
  }
}
