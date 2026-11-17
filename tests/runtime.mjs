import assert from 'node:assert/strict';
import {installInput} from '../game/input.js';

// A DOM/canvas API contract smoke test, not a browser or visual playtest.
const documentEvents=new Map(),windowEvents=new Map(),drawn=[];
const gradient={addColorStop(){}};
const context=new Proxy({}, {get:(target,key)=>key in target?target[key]:key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:key==='fillText'?(text)=>drawn.push(text):()=>{},set:(target,key,value)=>{target[key]=value;return true;}});
const elements=new Map();
function element(id){
  if(!elements.has(id))elements.set(id,{id,hidden:false,style:{},dataset:{},textContent:'',innerHTML:'',children:[],
    append(child){this.children.push(child);},replaceChildren(){this.children=[];},getContext:()=>context,
    getBoundingClientRect:()=>({left:0,top:0,width:1200,height:675}),closest(){return this;},hasPointerCapture:()=>false});
  return elements.get(id);
}
let hit=null,raf;
globalThis.innerWidth=1200;globalThis.innerHeight=675;
globalThis.window={addEventListener:(type,fn)=>windowEvents.set(type,fn)};
globalThis.document={getElementById:element,querySelectorAll:()=>[],createElement:()=>element('created-'+elements.size),
  addEventListener:(type,fn)=>documentEvents.set(type,fn),elementFromPoint:()=>hit,hidden:false};
globalThis.localStorage={getItem:()=>null,setItem(){}};
globalThis.location={search:''};
globalThis.requestAnimationFrame=fn=>{raf=fn;};
const calls={pause:0},canvas=element('input-canvas');canvas.width=1200;canvas.height=675;
const controls=installInput(canvas,{canAim:()=>true,unlock(){},pause(){calls.pause++;},togglePause(){},restart(){},mute(){},confirm(){}});
function pointer(type,id,action,x=100,y=100){
  hit=action?{dataset:{action},closest(){return this;}}:null;
  const e={pointerId:id,clientX:x,clientY:y,target:canvas,preventDefault(){}};
  documentEvents.get(type)(e);
}
pointer('pointerdown',1,'left');pointer('pointerdown',2,'right');assert.equal(controls.read().move,1);
pointer('pointerup',2);assert.equal(controls.read().move,-1);
pointer('pointermove',1,'right');assert.equal(controls.read().move,1);
pointer('pointerdown',3,'jump');assert.equal(controls.read().jump,true);assert.equal(controls.read().jump,false);
pointer('pointerup',3);assert.equal(controls.read().move,1);
pointer('pointercancel',1);assert.equal(controls.read().move,0);
pointer('pointerdown',4,'throw');pointer('pointermove',4,'throw',300,0);pointer('pointerup',4);assert.ok(controls.read().throw.x>0);
pointer('pointerdown',5,'left');windowEvents.get('blur')();assert.equal(controls.read().move,0);assert.equal(calls.pause,1);
console.log('PASS: real input handlers — overlap, release, slide, jump edge, aim/release, cancel, blur.');

await import('../game/app.js');
raf(0);raf(16);assert.equal(window.ECLIPSE.state.mode,'title');assert.ok(drawn.length>0);
for(const screen of ['play','win','lose','title']){
  window.ECLIPSE.capture(screen);raf(32);
  assert.equal(window.ECLIPSE.state.mode,screen);assert.equal(window.ECLIPSE.state.frozen,true);
  if(screen==='play')assert.ok(drawn.includes('RELEASE TO THROW'));
}
window.ECLIPSE.start(0);assert.equal(window.ECLIPSE.state.run.glow,10);
window.ECLIPSE.pause();const t=window.ECLIPSE.state.run.time;raf(48);assert.equal(window.ECLIPSE.state.run.time,t);
element('resume').onclick();assert.equal(window.ECLIPSE.state.mode,'play');
window.ECLIPSE.demo(0);assert.equal(window.ECLIPSE.step(8000),'clear');
for(const [w,h] of [[390,844],[844,390],[1280,720]]){innerWidth=w;innerHeight=h;windowEvents.get('resize')();window.ECLIPSE.capture('play');raf(64);assert.ok(element('city').width>0);}
console.log('PASS: app/menu/render API smoke — title, play/arc, win, lose, pause/resume, reset, demo, three viewport sizes. No pixels inspected.');
