import {buildLevel} from './levels.js';
export const TICK=1/120;
export const RULES={gravity:1350,jump:530,shadowSpeed:330,lightSpeed:185,discGravity:720,catchRadius:46,lightRadius:135,maxGlow:10};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function starsFor(time,par){return time<=par?3:time<=par*1.4?2:1;}
export function arcPoint(origin,velocity,t,wind=0){return {x:origin.x+velocity.x*t+wind*t*t/2,y:origin.y+velocity.y*t+RULES.discGravity*t*t/2};}
export function throwVelocity(dx=220,dy=-100){return {x:clamp(dx*2.1,-560,560),y:clamp(dy*2.2,-440,-160)};}
export function canCatch(player,disc){return !disc.held&&disc.age>.38&&distance({x:player.x,y:player.y-24},disc)<RULES.catchRadius;}
export function hasFallen(player){return player.y>740;}
export function createRun(index=0){return {level:buildLevel(index),player:{x:80,y:430,vx:0,vy:0,ground:0,coyote:12,buffer:0,face:1},disc:{x:98,y:398,vx:0,vy:0,held:true,age:0,rest:false},glow:10,time:0,status:'play',reason:'',events:[],throws:0,catches:0,lit:true,tick:0};}
export function launchDisc(s,velocity){
  if(s.status!=='play'||!s.disc.held)return false;
  Object.assign(s.disc,{held:false,vx:velocity.x,vy:velocity.y,age:0,rest:false});
  s.throws++;s.events.push({type:'throw',x:s.disc.x,y:s.disc.y});return true;
}
function lose(s,reason){s.status='lose';s.reason=reason;s.events.push({type:'lose',x:s.player.x,y:s.player.y});}
export function stepRun(s,input={},dt=TICK){
  s.events.length=0;if(s.status!=='play')return;
  s.time+=dt;s.tick++;
  const p=s.player,d=s.disc,l=s.level,wind=l.wind*Math.sin(s.time*1.7);
  for(const r of l.roofs){const old=r.x;r.x=r.baseX+(r.kind==='moving'?22*Math.sin(s.time*1.4+r.id):0);if(p.ground===r.id)p.x+=r.x-old;}
  s.lit=distance({x:p.x,y:p.y-24},d)<RULES.lightRadius;
  s.glow-=dt*(d.held?1.75:1);
  if(s.glow<=0){s.glow=0;lose(s,'The last sun went out. Catch it sooner.');return;}
  if(input.throw)launchDisc(s,input.throw);
  p.buffer=input.jump?14:Math.max(0,p.buffer-1);
  p.coyote=p.ground!==null?12:Math.max(0,p.coyote-1);
  if(p.buffer&&p.coyote){p.vy=-RULES.jump;p.ground=null;p.coyote=0;p.buffer=0;s.events.push({type:'jump',x:p.x,y:p.y});}
  const dir=input.move||0;if(dir)p.face=dir;
  p.vx=dir*(s.lit?RULES.lightSpeed:RULES.shadowSpeed)+(p.ground===null?wind*.3:wind*.12);
  if(p.ground===null&&dir)p.vx=dir*Math.max(400,Math.abs(p.vx));
  const oldX=p.x,oldY=p.y,oldGround=p.ground;
  p.x=clamp(p.x+p.vx*dt,14,l.end-14);p.vy=Math.min(850,p.vy+RULES.gravity*dt);p.y+=p.vy*dt;p.ground=null;
  for(const r of l.roofs){
    if(r.broken)continue;
    if(p.x>=r.x+5&&p.x<=r.x+r.w-5&&oldY<=r.y+.1&&p.y>=r.y&&p.vy>=0){
      if(r.kind==='glass'){r.wear+=dt;if(p.vy>640||r.wear>1.6){r.broken=true;s.events.push({type:'glass',x:p.x,y:r.y});continue;}}
      if(oldGround===null)s.events.push({type:'land',x:p.x,y:r.y});
      p.y=r.y;p.vy=0;p.ground=r.id;break;
    }
  }
  if(p.ground===null&&oldGround!==null&&s.lit&&p.vy>=0&&!l.roofs[oldGround].broken){p.x=oldX;p.y=oldY;p.vy=0;p.ground=oldGround;}
  if(d.held){d.x=p.x+p.face*18;d.y=p.y-32;}
  else{
    d.age+=dt;
    if(!d.rest){
      const prev=d.y;d.x+=d.vx*dt+wind*dt*dt/2;d.vx+=wind*dt;d.y+=d.vy*dt+RULES.discGravity*dt*dt/2;d.vy+=RULES.discGravity*dt;
      const roof=l.roofs.find(r=>!r.broken&&d.x>=r.x&&d.x<=r.x+r.w&&prev<=r.y-18&&d.y>=r.y-18&&d.vy>0);
      if(roof){d.y=roof.y-18;d.vx=0;d.vy=0;d.rest=true;d.roof=roof.id;}
      if(d.y>720){lose(s,'The sun fell between the roofs. Aim for a rooftop.');return;}
    }else if(l.roofs[d.roof]?.kind==='moving'){d.x+=22*1.4*Math.cos(s.time*1.4+d.roof)*dt;}
    if(canCatch(p,d)){d.held=true;d.rest=false;s.glow=Math.min(10,s.glow+5);s.catches++;s.events.push({type:'catch',x:p.x,y:p.y-25});}
  }
  for(const h of l.hounds){
    const roof=l.roofs[h.roof],alert=s.lit&&Math.abs(p.x-h.x)<190;
    if(alert&&!h.alert)s.events.push({type:'bark',x:h.x,y:410});h.alert=alert;
    if(alert)h.dir=Math.sign(p.x-h.x)||1;
    h.x+=h.dir*(alert?118:44)*dt;
    if(h.x<roof.x+330){h.x=roof.x+330;h.dir=1;}if(h.x>roof.x+roof.w-25){h.x=roof.x+roof.w-25;h.dir=-1;}
    if(Math.abs(p.x-h.x)<24&&p.y>roof.y-27&&p.y<roof.y+25){lose(s,'A rooftop hound caught your scent. Jump over it.');return;}
  }
  if(hasFallen(p)){lose(s,'You vanished into the city. Jump the dark gaps.');return;}
  if(p.x>=l.gate&&d.held&&p.ground!==null){s.status='clear';s.stars=starsFor(s.time,l.par);s.events.push({type:'win',x:p.x,y:p.y});}
}
