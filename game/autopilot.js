import {RULES} from './simulation.js';
const plans=new WeakMap();
export function courierBot(s){
  const p=s.player,d=s.disc,l=s.level;
  let move=d.held?1:Math.abs(d.x-p.x)<14?0:Math.sign(d.x-p.x);
  const roof=l.roofs.find(r=>!r.broken&&p.x>=r.x&&p.x<=r.x+r.w);
  const dog=l.hounds.some(h=>h.x>p.x-25&&h.x-p.x<65&&Math.abs(p.y-430)<2);
  const edge=roof&&roof.x+roof.w-p.x<24&&p.x<l.gate-40;
  const fragile=roof?.kind==='glass'&&roof.wear>1.25&&roof.x+roof.w-p.x<150;
  const jump=p.ground!==null&&(edge||dog||fragile);
  if(jump&&roof){
    const next=l.roofs[roof.id+1];
    const landing=(next?.x||l.gate)+(edge?75:12);
    plans.set(s,landing);
  }
  if(p.ground!==null&&!jump)plans.delete(s);
  if(p.ground===null&&plans.has(s)){
    const tx=plans.get(s);move=Math.abs(tx-p.x)<5?0:Math.sign(tx-p.x);
  }
  let shot;
  if(d.held&&p.ground!==null&&(s.glow<7.5||s.time<.1)&&p.x<l.gate-160){
    const target=l.roofs.find(r=>!r.broken&&r.x+135>p.x+160);
    const tx=Math.min(l.gate-25,target?target.x+135:p.x+200);
    const vy=-310,t=(-vy+Math.sqrt(vy*vy+2*RULES.discGravity*14))/RULES.discGravity;
    const wind=l.wind*Math.sin((s.time+t*.45)*1.7);
    shot={x:(tx-d.x-wind*t*t/2)/t,y:vy};
  }
  return {move,jump,throw:shot};
}
