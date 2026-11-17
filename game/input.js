import {throwVelocity} from './simulation.js';
export class PointerActions{
  constructor(){this.pointers=new Map();this.serial=0;}
  set(id,action){this.pointers.set(id,{action,order:++this.serial});}
  release(id){this.pointers.delete(id);}
  direction(){
    const a=[...this.pointers.values()];
    return a.some(p=>p.action==='right')?1:a.some(p=>p.action==='left')?-1:0;
  }
  clear(){this.pointers.clear();}
}
export function installInput(canvas,callbacks){
  const pointers=new PointerActions(),keys=new Set();
  let jump=false,shot=null,aim=null,aimId=null;
  const position=e=>{const b=canvas.getBoundingClientRect();return {x:(e.clientX-b.left)*canvas.width/b.width,y:(e.clientY-b.top)*canvas.height/b.height};};
  const actionAt=e=>document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-action]')?.dataset.action;
  function startAim(e,touch){
    if(!callbacks.canAim())return;
    aimId=e.pointerId;const pos=position(e);
    aim={start:pos,point:pos,touch,velocity:throwVelocity(220,-140)};
  }
  function updateAim(e){
    if(!aim||e.pointerId!==aimId)return;
    aim.point=position(e);
    const dx=aim.point.x-aim.start.x,dy=aim.point.y-aim.start.y;
    if(Math.hypot(dx,dy)>8)aim.velocity=throwVelocity(dx,dy);
  }
  document.addEventListener('pointerdown',e=>{
    callbacks.unlock();
    const action=actionAt(e);
    if(action){
      e.preventDefault();pointers.set(e.pointerId,action);
      if(e.target.hasPointerCapture?.(e.pointerId))e.target.releasePointerCapture(e.pointerId);
      if(action==='jump')jump=true;
      if(action==='throw')startAim(e,true);
    }else if(e.target===canvas){e.preventDefault();startAim(e,false);}
  },{passive:false});
  document.addEventListener('pointermove',e=>{
    if(pointers.pointers.has(e.pointerId)&&e.pointerId!==aimId){
      const previous=pointers.pointers.get(e.pointerId).action,action=actionAt(e)||'';
      if(action!==previous){pointers.set(e.pointerId,action);if(action==='jump')jump=true;}
    }
    updateAim(e);
  });
  function release(e,cancel=false){
    if(e.pointerId===aimId){if(!cancel&&aim)shot=aim.velocity;aim=null;aimId=null;}
    pointers.release(e.pointerId);
    if(e.target.hasPointerCapture?.(e.pointerId))e.target.releasePointerCapture(e.pointerId);
  }
  document.addEventListener('pointerup',e=>release(e));
  document.addEventListener('pointercancel',e=>release(e,true));
  function clear(){keys.clear();pointers.clear();jump=false;shot=null;aim=null;aimId=null;}
  window.addEventListener('blur',()=>{clear();callbacks.pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();callbacks.pause();}});
  window.addEventListener('keydown',e=>{
    if(['Space','ArrowLeft','ArrowRight','ArrowUp'].includes(e.code))e.preventDefault();
    callbacks.unlock();
    if(!keys.has(e.code)){
      if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')jump=true;
      if(e.code==='KeyP'||e.code==='Escape'){clear();callbacks.togglePause();}
      if(e.code==='KeyR')callbacks.restart();
      if(e.code==='KeyM')callbacks.mute();
      if(e.code==='Enter')callbacks.confirm();
    }
    keys.add(e.code);
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  return {clear,get aim(){return aim;},read(){
    const right=keys.has('KeyD')||keys.has('ArrowRight'),left=keys.has('KeyA')||keys.has('ArrowLeft');
    const result={move:right?1:left?-1:pointers.direction(),jump,throw:shot};jump=false;shot=null;return result;
  }};
}
