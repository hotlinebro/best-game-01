import {createRun,stepRun,TICK,starsFor,throwVelocity} from './simulation.js';
import {LEVELS} from './levels.js';
import {CityRenderer} from './renderer.js';
import {installInput} from './input.js';
import {SolarAudio} from './audio.js';
import {loadRecords,saveRecord} from './save.js';
import {courierBot} from './autopilot.js';
import {createTutorial} from './tutorial.js';

const $=id=>document.getElementById(id);
const renderer=new CityRenderer($('city')),audio=new SolarAudio();
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
const records=loadRecords(storage);
const tutorial=createTutorial(storage,records,{box:$('tutorial'),text:$('tutorial-text'),skip:$('tutorial-skip')});
let run=createRun(),mode='title',totalTime=0,totalStars=0,completed=[],demo=false,frozen=false,stop=0,last=0,accumulator=0;
const input=installInput($('city'),{
  canAim:()=>mode==='play'&&run.disc.held,
  unlock:()=>audio.unlock(),pause:()=>{if(mode==='play')setMode('pause');},
  togglePause:()=>{if(mode==='play')setMode('pause');else if(mode==='pause')setMode('play');},
  restart:()=>start(run.level.index),mute:toggleMute,
  confirm:()=>{if(mode==='title')start(0,true);else if(mode==='pause')setMode('play');else if(mode==='clear')next();else if(mode==='lose')start(run.level.index);},
});
function setMode(value){
  mode=value;input.clear();accumulator=0;
  if(value!=='play')tutorial.hide();
  $('overlay').hidden=value==='play';
  for(const id of ['title','pause','result','select'])$(id+'-screen').hidden=true;
  const panel={title:'title',pause:'pause',clear:'result',win:'result',lose:'result',select:'select'}[value];
  if(panel)$(panel+'-screen').hidden=false;
  const active=['play','pause','clear','lose','win'].includes(value);
  $('hud').hidden=!active;$('touch').hidden=value!=='play';$('hint').hidden=value!=='play';$('callout').hidden=value!=='play';$('signature').hidden=active;
  if(['clear','lose','win'].includes(value))showResults(value);
}
function start(index=0,newCampaign=false){
  if(newCampaign){totalTime=0;totalStars=0;completed=[];}
  run=createRun(index);tutorial.reset(run,demo);renderer.camera=0;renderer.particles=[];stop=0;frozen=false;setMode('play');updateHUD();renderer.draw(run,mode,input.aim,0);
}
function next(){
  if(mode==='win'){start(0,true);return;}
  if(run.level.index<6)start(run.level.index+1);
}
function toggleMute(){const muted=audio.toggle();$('mute').textContent=muted?'SOUND OFF':'SOUND ON';}
function updateHUD(){
  $('level-number').textContent=`ROOFTOP ${String(run.level.index+1).padStart(2,'0')} / 07`;
  $('level-name').textContent=run.level.name;
  $('pace').textContent=`${run.time.toFixed(1)}s / PAR ${run.level.par}s · ${'★'.repeat(starsFor(run.time,run.level.par))}`;
  $('glow').textContent=run.glow.toFixed(1);$('glow-fill').style.width=`${run.glow*10}%`;
  $('glow').style.color=run.glow<3?'#ff8e8e':'#ffe5b6';
  $('hint').textContent=run.time<6?run.level.tip:run.disc.held?'DRAG TOWARD YOUR TARGET · RELEASE TO THROW · SPACE TO JUMP':'CHASE THE SUN · CATCH TO REFILL +5s';
  $('callout').textContent=demo?'DEMO / AUTOPILOT':run.disc.held?'THROW → DASH → CATCH':run.lit?'FIND YOUR NEXT SHADOW':'YOU ARE THE FAST THING IN THE DARK';
  $('hint').hidden=tutorial.update(run,input.aim,{demo,touch:globalThis.matchMedia?.('(pointer:coarse)').matches,aiming:!frozen&&!!input.aim});
}
function showResults(value){
  const lost=value==='lose',win=value==='win';
  $('result-eyebrow').textContent=lost?'THE NIGHT CLAIMED THIS ONE':win?'SEVEN DELIVERIES / ONE NEW MORNING':`ROOFTOP ${run.level.index+1} / DELIVERED`;
  $('result-heading').innerHTML=lost?'THE SUN<br><em>SLIPPED AWAY.</em>':win?'YOU DELIVERED<br><em>THE DAWN.</em>':'A LITTLE<br><em>MORE DAWN.</em>';
  $('result-stars').textContent=lost?'◌':win?`${totalStars} / 21 ★`:'★'.repeat(run.stars)+'☆'.repeat(3-run.stars);
  $('result-copy').textContent=lost?run.reason:win?'The city wakes. Somewhere, a shadow finally rests.':'The sun is safe. Beyond this gate, another sleeping district waits.';
  $('score-strip').textContent=lost?`${run.time.toFixed(1)}s · ${run.catches} CATCHES`:win?`${totalTime.toFixed(1)}s TOTAL · ${completed.length} ROOFTOPS`:`${run.time.toFixed(1)}s · PAR ${run.level.par}s · ${run.catches} CATCHES`;
  $('next').hidden=lost;$('next').textContent=win?'CARRY THE SUN AGAIN ↗':'NEXT ROOFTOP ↗';
  $('retry').textContent=lost?'RETRY / R':'RETRY THIS ROOFTOP';
}
function finish(){
  if(run.status==='lose'){setMode('lose');return;}
  if(run.level.index===0)tutorial.complete();
  if(!completed.includes(run.level.index)){completed.push(run.level.index);totalTime+=run.time;totalStars+=run.stars;}
  saveRecord(storage,records,run.level.index,run);
  setMode(run.level.index===6&&completed.length===7?'win':'clear');
}
function tick(){
  if(mode!=='play'||frozen)return;
  const intents=demo?courierBot(run):input.read();
  tutorial.track(run);
  stepRun(run,intents);
  for(const e of run.events){audio.play(e.type);renderer.burst(e);if(e.type==='land'&&!renderer.reduced)stop=.028;if(e.type==='catch'&&!renderer.reduced)stop=.04;}
  if(run.status!=='play')finish();
}
function frame(ms){
  const dt=Math.min(.06,(ms-last)/1000||0);last=ms;
  if(mode==='play'&&!frozen){
    if(stop>0)stop=Math.max(0,stop-dt);
    else{accumulator+=dt;let steps=0;while(accumulator>=TICK&&steps++<8){tick();accumulator-=TICK;if(stop>0||mode!=='play')break;}accumulator=Math.max(0,accumulator);}
  }
  if(!frozen&&['title','select'].includes(mode))run.time+=dt;
  const captureAim=frozen&&mode==='play'&&run.disc.held?{velocity:throwVelocity(210,-145)}:input.aim;
  renderer.draw(run,mode,captureAim,dt);if(mode==='play')updateHUD();
  if(demo&&mode==='clear'&&!frozen)next();
  requestAnimationFrame(frame);
}
$('start').onclick=()=>{audio.unlock();demo=false;start(0,true);};
$('pause').onclick=()=>setMode('pause');$('resume').onclick=()=>setMode('play');
$('mute').onclick=toggleMute;$('motion').onclick=()=>{renderer.reduced=!renderer.reduced;$('motion').textContent=renderer.reduced?'MOTION OFF':'MOTION ON';};
$('next').onclick=next;$('retry').onclick=()=>{demo=false;start(run.level.index);};
document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>{demo=false;run=createRun();setMode('title');});
$('select-open').onclick=()=>{
  $('level-list').replaceChildren();
  LEVELS.forEach((l,i)=>{const b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')} / ${l.name}`;const score=document.createElement('span');score.textContent=records[i]?'★'.repeat(records[i].stars):`${l.par}s`;b.append(score);b.onclick=()=>{demo=false;totalTime=0;totalStars=0;completed=[];start(i);};$('level-list').append(b);});setMode('select');
};
window.addEventListener('resize',()=>renderer.resize());renderer.resize();

function captureState(screen='title',level=0){
  demo=false;run=createRun(Math.max(0,Math.min(6,level)));frozen=true;
  tutorial.reset(run);input.clear();
  if(screen==='play'){
    run.player.x=270;run.player.y=430;run.time=3.2;run.glow=8.4;run.disc.x=288;run.disc.y=398;
    setMode('play');renderer.camera=0;updateHUD();
    renderer.draw(run,mode,{velocity:throwVelocity(210,-145)},0);
  }else if(screen==='win'){
    completed=[0,1,2,3,4,5,6];totalStars=19;totalTime=242.6;run.stars=3;setMode('win');renderer.draw(run,mode,null,0);
  }else if(screen==='lose'){
    run.reason='The last sun went out. Catch it sooner.';run.time=21.4;setMode('lose');renderer.draw(run,mode,null,0);
  }else{setMode('title');renderer.draw(run,mode,null,0);}
  frozen=true;
}
window.ECLIPSE={
  get state(){return {mode,run,totalTime,totalStars,demo,frozen};},
  start:(level=0)=>{demo=false;start(level,true);},
  capture:captureState,
  tutorial:()=>tutorial.debug(),
  demo:(level=0)=>{demo=true;start(level,true);},
  freeze:(value=true)=>{frozen=value;},
  step:(count=1)=>{for(let i=0;i<count;i++){stepRun(run,courierBot(run));if(run.status!=='play')break;}updateHUD();renderer.draw(run,mode,input.aim,0);return run.status;},
  aim:(dx=210,dy=-145)=>{renderer.draw(run,'play',{velocity:throwVelocity(dx,dy)},0);},
  pause:()=>setMode('pause'),
};
const query=new URLSearchParams(location.search);
if(query.has('screen'))captureState(query.get('screen'),Number(query.get('level'))||0);
else if(query.has('demo')){demo=true;start(Number(query.get('level'))||0,true);}
else setMode('title');
requestAnimationFrame(frame);
