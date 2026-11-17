import {arcPoint,clamp} from './simulation.js';

const INK='#090d24',GOLD='#ffca7a',LILAC='#8e80af';
export class CityRenderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.camera=0;this.particles=[];this.shake=0;this.reduced=false;}
  resize(){
    const ratio=innerWidth/innerHeight;
    this.canvas.width=Math.round(Math.max(680,ratio*675));this.canvas.height=Math.round(this.canvas.width/ratio);
  }
  burst(event){
    if(event.type==='catch'||event.type==='glass'||event.type==='land'){
      const count=event.type==='catch'?22:event.type==='glass'?18:6;
      for(let i=0;i<count;i++){
        const a=i*2.39996;
        this.particles.push({x:event.x,y:event.y,vx:Math.cos(a)*(45+i*5),vy:Math.sin(a)*(40+i*4)-35,life:1,color:event.type==='glass'?'#9ce2e0':GOLD});
      }
      if(event.type==='catch')this.shake=.65;
    }
  }
  circle(x,y,r,color){const c=this.ctx;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  line(x,y,xx,yy,color,width=1){const c=this.ctx;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
  text(value,x,y,size=12,color=GOLD,align='left'){const c=this.ctx;c.font=`700 ${size}px Arial`;c.textAlign=align;c.fillStyle=color;c.fillText(value,x,y);}
  sky(w,h,t,camera,dawn){
    const c=this.ctx,g=c.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#080d25');g.addColorStop(.55,dawn?'#60405c':'#252344');g.addColorStop(1,'#372743');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    const halo=c.createRadialGradient(w*.74,h*.3,10,w*.74,h*.3,w*.55);
    halo.addColorStop(0,'#64577725');halo.addColorStop(1,'#45385c00');c.fillStyle=halo;c.fillRect(0,0,w,h);
    for(let i=0;i<95;i++){
      const x=((i*173.39-camera*.04)%(w+40)+w+40)%(w+40),y=30+((i*i*19.17)%(h*.55));
      c.globalAlpha=.24+.44*(.5+.5*Math.sin(t*.6+i));this.circle(x,y,i%7===0?1.5:.8,'#d9d1ec');
      if(i%19===0){this.line(x-4,y,x+4,y,'#b3a2c755');this.line(x,y-4,x,y+4,'#b3a2c755');}
    }
    c.globalAlpha=1;
    const mx=w*.82-camera*.018,my=h*.19;
    this.circle(mx,my,27,'#a59cc74a');this.circle(mx+9,my-5,25,'#141831');
    this.line(0,h*.57,w,h*.57,'#74608618');
  }
  skyline(w,h,camera,layer){
    const c=this.ctx,scale=layer===0?.13:.3,unit=layer===0?90:120;
    const offset=(camera*scale)%unit,base=h*.66;
    for(let i=-2;i<w/unit+3;i++){
      const n=i+Math.floor(camera*scale/unit),x=i*unit-offset,height=70+((n*137+1700)%130+130)%130;
      const y=base-height-(layer===0?50:0);
      c.fillStyle=layer===0?'#22233e':'#14182f';c.fillRect(x,y,unit-9,h-y);
      c.fillStyle=layer===0?'#3e3655':'#36304c';c.fillRect(x-3,y,unit-3,3);
      if(n%3===0){c.fillRect(x+14,y-18,11,18);this.line(x+19,y-18,x+19,y-50,'#4b3e5a');this.line(x+8,y-38,x+32,y-38,'#4b3e5a');}
      if(n%4===0){c.fillStyle='#343047';c.beginPath();c.moveTo(x+20,y);c.lineTo(x+43,y-33);c.lineTo(x+65,y);c.fill();}
      for(let a=14;a<unit-15;a+=20)for(let b=20;b<height;b+=28){c.fillStyle=(n+a+b)%7===0?'#e3ae5655':'#69546b25';c.fillRect(x+a,y+b,5,10);}
    }
  }
  roof(r,time){
    const c=this.ctx,x=r.x,y=r.y;
    if(r.broken){this.line(x,y+15,x+r.w,y+15,'#8de2df22',2);return;}
    const glass=r.kind==='glass',moving=r.kind==='moving';
    c.fillStyle=glass?'#284956':'#17182f';c.fillRect(x,y,r.w,700);
    c.fillStyle=glass?'#7dc7c0':moving?'#a596d1':'#726583';c.fillRect(x-5,y,r.w+10,5);
    c.fillStyle='#29233c';c.fillRect(x-3,y+7,r.w+6,11);c.fillStyle='#42364e';c.fillRect(x,y+21,r.w,2);
    for(let row=0;row<5;row++)for(let col=0;col<r.w/58;col++){
      const bx=x+col*58+(row%2)*29;
      if(bx+30<x+r.w)this.line(bx,y+40+row*22,bx+38,y+40+row*22,'#4b375032');
    }
    for(let i=24;i<r.w-15;i+=53){c.fillStyle='#2f2a40';c.fillRect(x+i,y+68,18,39);c.fillStyle='#b48c5240';c.fillRect(x+i+3,y+72,5,26);}
    if(glass){
      for(let xx=8;xx<r.w;xx+=38){this.line(x+xx,y+7,x+xx+18,y+43,'#b8fff250');this.line(x+xx,y+3,x+xx,y+46,'#86c7cf40');}
      this.text('GLASS / KEEP MOVING',x+r.w/2,y+63,9,'#a1d9da','center');
      if(r.wear>.3){this.line(x+r.w*.5,y,x+r.w*.6,y+25,'#fff1bd',2);this.line(x+r.w*.6,y+25,x+r.w*.45,y+39,'#fff1bd');}
    }else if(moving){
      this.text('←   SLIDING EAVE   →',x+r.w/2,y+51,10,'#baace2','center');
      for(let i=0;i<3;i++)this.line(x+40+i*95,y+110,x+25+i*95,y+155,'#89719540',3);
    }else{
      const px=x+r.w*.7;
      if(r.id%3===0){
        c.fillStyle='#27243c';c.fillRect(px,y-58,38,58);c.fillStyle='#50415b';c.fillRect(px-5,y-62,48,7);
        this.line(px+17,y-64,px+17,y-126,'#70617d',2);this.line(px-5,y-105,px+41,y-105,'#70617d',2);this.line(px+2,y-119,px+32,y-119,'#70617d');
      }else if(r.id%3===1){
        c.fillStyle='#292940';c.fillRect(px-5,y-63,55,42);c.beginPath();c.ellipse(px+22,y-63,28,9,0,0,Math.PI*2);c.fill();
        this.line(px+4,y-22,px,y,'#6a5770',3);this.line(px+38,y-22,px+43,y,'#6a5770',3);
        this.line(px+4,y-46,px+39,y-46,'#70617d');
      }else{
        c.fillStyle='#332a40';c.fillRect(px,y-35,32,35);c.fillStyle='#6a5266';c.fillRect(px-4,y-39,40,6);
        for(let i=0;i<3;i++)this.circle(px+15+Math.sin(time+i)*5,y-50-i*15,4+i*2,'#84708e15');
      }
    }
    this.text(String(r.id+1).padStart(2,'0'),x+16,y+44,11,'#a88b9d66');
  }
  courier(p,t,hero=false){
    const c=this.ctx,run=Math.abs(p.vx)>10,phase=t*18;
    c.save();c.translate(p.x,p.y);c.scale(hero?2.6:1,hero?2.6:1);
    const stride=run?Math.sin(phase)*11:2;
    c.strokeStyle='#070b20';c.lineWidth=8;c.lineCap='round';
    this.line(-2,-17,-stride,0,'#080c20',8);this.line(3,-17,stride,0,'#080c20',8);
    c.fillStyle='#080c20';c.beginPath();c.moveTo(-12,-16);c.quadraticCurveTo(-15,-43,0,-48);c.quadraticCurveTo(14,-43,13,-16);c.closePath();c.fill();
    this.circle(0,-46,13,'#080c20');this.line(3,-46,9,-46,'#ffce88',2);
    c.fillStyle='#ad7397';c.beginPath();c.moveTo(-6,-37);c.lineTo(-27-p.face*8,-33+Math.sin(t*7)*3);c.lineTo(-36-p.face*10,-40);c.lineTo(-10,-42);c.closePath();c.fill();
    this.line(-9,-22,-18,-13,'#080c20',6);this.line(8,-25,19,-29,'#080c20',6);
    this.line(-9,-27,-8,-38,'#837496',1.5);
    c.restore();
  }
  sun(x,y,t,glow=10,radius=17){
    const c=this.ctx,r=radius*(.55+.45*glow/10)*(1+.035*Math.sin(t*5)),halo=c.createRadialGradient(x,y,1,x,y,r*10);
    halo.addColorStop(0,'#ffd48860');halo.addColorStop(.28,'#fda95220');halo.addColorStop(1,'#ffae4f00');
    c.fillStyle=halo;c.fillRect(x-r*10,y-r*10,r*20,r*20);
    this.circle(x,y,r,GOLD);this.circle(x-3,y-4,r*.74,'#ffe4a2');
    c.strokeStyle='#ffe4ac';c.lineWidth=1.5;c.beginPath();c.arc(x,y,r+7,-Math.PI/2,-Math.PI/2+Math.PI*2*glow/10);c.stroke();
    for(let i=0;i<8;i++){const a=t*.25+i*Math.PI/4;this.line(x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12),x+Math.cos(a)*(r+17),y+Math.sin(a)*(r+17),'#ffd28b70');}
  }
  gate(x){
    const c=this.ctx,g=c.createLinearGradient(x-50,0,x+50,0);g.addColorStop(0,'#ffd39400');g.addColorStop(.5,'#ffd39440');g.addColorStop(1,'#ffd39400');
    c.fillStyle=g;c.fillRect(x-60,225,120,205);
    c.strokeStyle=GOLD;c.lineWidth=4;c.beginPath();c.moveTo(x-29,430);c.lineTo(x-29,356);c.arc(x,356,29,Math.PI,0);c.lineTo(x+29,430);c.stroke();
    this.line(x-20,425,x+20,425,'#ffe6a2',3);this.text('DAWN',x,311,12,GOLD,'center');
    for(let i=0;i<5;i++)this.line(x-12+i*6,371,x-12+i*6,418,'#ffdf9e30');
  }
  aim(s,velocity){
    const c=this.ctx,origin=s.disc,wind=s.level.wind*Math.sin(s.time*1.7);
    let end=origin;
    for(let i=1;i<64;i++){
      const q=arcPoint(origin,velocity,i*.035,wind);end=q;
      this.circle(q.x,q.y,i%3===0?3:2,'#ffe3a2');
      if(q.y>412&&i>5){
        const safe=s.level.roofs.some(r=>!r.broken&&q.x>=r.x&&q.x<=r.x+r.w);
        c.strokeStyle=safe?'#bbf5d0':'#ff8094';c.lineWidth=3;c.beginPath();c.ellipse(q.x,430,24,7,0,0,Math.PI*2);c.stroke();
        this.text(safe?'LANDING':'GAP',q.x,457,10,c.strokeStyle,'center');break;
      }
    }
    this.text('RELEASE TO THROW',origin.x,origin.y-40,10,GOLD,'center');
    return end;
  }
  draw(s,mode,aim,dt=0){
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height,t=s.time,menu=['title','select'].includes(mode),base=h*.65-430;
    const target=menu?0:clamp(s.player.x-w*.3,0,Math.max(0,s.level.end-w));
    this.camera+= (target-this.camera)*(1-Math.exp(-8*dt));
    if(dt===0)this.camera=target;
    this.sky(w,h,t,this.camera,mode==='win');this.skyline(w,h,this.camera,0);this.skyline(w,h,this.camera,1);
    c.save();
    this.shake=Math.max(0,this.shake-dt*2.3);
    const shake=this.reduced?0:this.shake*this.shake*8;
    c.translate(-this.camera+Math.sin(t*71)*shake,base+Math.cos(t*59)*shake*.6);
    for(const r of s.level.roofs)if(r.x+r.w>this.camera-100&&r.x<this.camera+w+100)this.roof(r,t);
    this.gate(s.level.gate);
    for(const dog of s.level.hounds){
      c.save();c.translate(dog.x,430);c.scale(dog.dir,1);c.fillStyle='#272038';c.fillRect(-19,-22,35,17);this.circle(18,-24,10,'#30213b');
      for(const x of [-13,10])this.line(x,-9,x+Math.sin(t*11)*4,0,'#30213b',5);
      this.line(-17,-19,-26,-30,'#6f5169',4);this.line(14,-30,11,-40,'#30213b',6);this.circle(22,-27,2,dog.alert?'#ff8d75':'#bba5c2');c.restore();
      if(dog.alert)this.text('!',dog.x,375,22,'#ff9e8f','center');
    }
    if(!menu){
      const d=s.disc,g=c.createRadialGradient(d.x,d.y,45,d.x,d.y,330);
      g.addColorStop(0,'#04081700');g.addColorStop(.45,'#04081715');g.addColorStop(1,'#040817bb');
      c.fillStyle=g;c.fillRect(this.camera-50,-base,w+100,h);
      if(aim&&d.held)this.aim(s,aim.velocity);
      for(let i=0;i<4;i++)if(Math.abs(s.player.vx)>200){c.globalAlpha=.09*(4-i);this.courier({...s.player,x:s.player.x-s.player.face*(i+1)*10},t-i*.02);}c.globalAlpha=1;
      this.courier(s.player,t);this.sun(d.x,d.y,t,s.glow);
      if(!d.held){this.text('CATCH',d.x,d.y-40,10,GOLD,'center');}
      if(d.x>this.camera+w-35){this.text('SUN →',this.camera+w-30,300,13,GOLD,'right');}
      if(d.x<this.camera+35){this.text('← SUN',this.camera+30,300,13,GOLD);}
    }else{
      const heroX=w*.8;this.sun(heroX-10,245,t,10,48);
      this.courier({x:heroX,y:430,vx:0,face:1},t,true);
      for(let i=0;i<3;i++){c.strokeStyle='#ddaa6c20';c.lineWidth=1;c.beginPath();c.arc(heroX-10,245,80+i*42,.25,Math.PI*1.85);c.stroke();}
    }
    for(const p of this.particles){p.life-=dt*1.8;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;c.globalAlpha=Math.max(0,p.life);this.circle(p.x,p.y,2,p.color);}c.globalAlpha=1;
    this.particles=this.particles.filter(p=>p.life>0);c.restore();
    if(!menu){
      const progress=clamp(s.player.x/s.level.gate,0,1);this.line(30,h-133,w-30,h-133,'#84719444',2);this.line(30,h-133,30+(w-60)*progress,h-133,GOLD,2);this.circle(30+(w-60)*progress,h-133,4,GOLD);
      this.text(s.lit?'IN LIGHT / SAFE EDGES':'IN SHADOW / FAST',30,h-148,9,s.lit?'#ffe1ab':'#bbafda');this.text(`${Math.round(progress*100)}% TO DAWN`,w-30,h-148,9,'#bcb0d0','right');
    }
  }
}
