import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,stepRun,launchDisc,arcPoint,throwVelocity,canCatch,hasFallen,starsFor,RULES,TICK} from '../game/simulation.js';
import {LEVELS,buildLevel,routeMetrics} from '../game/levels.js';
import {PointerActions} from '../game/input.js';
import {loadRecords,saveRecord} from '../game/save.js';

test('ballistic arc starts at hand, rises, falls and bends with wind',()=>{
  const o={x:40,y:398},v={x:450,y:-300};
  assert.deepEqual(arcPoint(o,v,0),o);
  assert.equal(arcPoint(o,v,.5).y,338);
  assert.equal(arcPoint(o,v,1).y,458);
  assert.equal(arcPoint(o,v,1,40).x,510);
  assert.deepEqual(throwVelocity(999,-999),{x:560,y:-440});
});
test('actual disc integration agrees with analytic arc before contact',()=>{
  const s=createRun();launchDisc(s,{x:430,y:-310});const origin={x:s.disc.x,y:s.disc.y};
  for(let i=0;i<30;i++)stepRun(s,{});
  const q=arcPoint(origin,{x:430,y:-310},30*TICK);
  assert.ok(Math.abs(s.disc.x-q.x)<1e-8);assert.ok(Math.abs(s.disc.y-q.y)<1e-8);
});
test('catch requires proximity, a released disc and launch grace',()=>{
  const p={x:80,y:430},d={x:85,y:405,held:false,age:1};
  assert.equal(canCatch(p,d),true);assert.equal(canCatch(p,{...d,x:200}),false);
  assert.equal(canCatch(p,{...d,held:true}),false);assert.equal(canCatch(p,{...d,age:.1}),false);
  const s=createRun();Object.assign(s.disc,d);s.disc.rest=true;s.disc.roof=0;s.glow=3;
  stepRun(s);assert.equal(s.catches,1);assert.ok(s.glow>7.9);assert.equal(s.disc.held,true);
});
test('fall detection, exhausted glow and restart state',()=>{
  assert.equal(hasFallen({y:740}),false);assert.equal(hasFallen({y:741}),true);
  const s=createRun();s.player.y=739;s.player.vy=800;s.player.ground=null;stepRun(s);assert.equal(s.status,'lose');
  const dim=createRun();dim.glow=.001;stepRun(dim);assert.equal(dim.status,'lose');
  assert.equal(createRun().status,'play');assert.equal(createRun().glow,10);
});
test('light guards walking edges while shadow permits a fall',()=>{
  const s=createRun();s.player.x=454;s.disc.x=454;
  for(let i=0;i<15;i++)stepRun(s,{move:1});assert.ok(s.player.x<460);assert.equal(s.player.ground,0);
  s.disc.held=false;s.disc.rest=true;s.disc.roof=1;s.disc.x=700;s.disc.y=412;
  for(let i=0;i<8;i++)stepRun(s,{move:1});assert.equal(s.player.ground,null);
});
test('par boundaries give 1–3 stars',()=>{
  assert.equal(starsFor(32,32),3);assert.equal(starsFor(32.01,32),2);assert.equal(starsFor(44.8,32),2);assert.equal(starsFor(45,32),1);
});
test('hazards have consequences and terminal runs stop advancing',()=>{
  const glass=createRun(3),roof=glass.level.roofs[3];
  Object.assign(glass.player,{x:roof.x+30,y:430,ground:3});
  Object.assign(glass.disc,{x:roof.x+48,y:398});roof.wear=1.6;
  stepRun(glass);assert.equal(roof.broken,true);
  const dog=createRun(2),h=dog.level.hounds[0];
  Object.assign(dog.player,{x:h.x,y:430,ground:h.roof});
  Object.assign(dog.disc,{x:h.x+18,y:398});stepRun(dog);assert.equal(dog.status,'lose');
  const time=dog.time;stepRun(dog,{move:1,jump:true});assert.equal(dog.time,time);
  const moving=createRun(4),eave=moving.level.roofs[3];
  Object.assign(moving.player,{x:eave.x+100,y:430,ground:3});
  const x=moving.player.x;stepRun(moving);assert.ok(Math.abs(moving.player.x-x)>0);assert.equal(moving.player.ground,3);
});
test('all seven levels define valid, reachable routes and progressive hazards',()=>{
  assert.equal(LEVELS.length,7);
  for(let i=0;i<7;i++){
    const l=buildLevel(i),m=routeMetrics(l);
    assert.ok(m.gateSupported);assert.ok(m.maxGap<RULES.lightSpeed*RULES.jump*2/RULES.gravity);
    assert.ok(l.par>m.minimumTime*1.4);assert.ok(l.par<61);
    for(const key of ['dogs','glass','moving']){assert.ok(Array.isArray(l[key]));assert.ok(l[key].every(id=>l.roofs[id]));}
  }
  assert.ok(LEVELS[1].wind>0);assert.ok(LEVELS[2].dogs.length);assert.ok(LEVELS[3].glass.length);assert.ok(LEVELS[4].moving.length);
});
test('overlapping fingers resume left after right release; slide changes direction',()=>{
  const p=new PointerActions();p.set(1,'left');p.set(2,'right');assert.equal(p.direction(),1);
  p.release(2);assert.equal(p.direction(),-1);p.set(1,'right');assert.equal(p.direction(),1);
  p.release(1);assert.equal(p.direction(),0);
  p.set(1,'left');p.set(2,'jump');p.release(2);assert.equal(p.direction(),-1);
});
test('record persistence validates schema and preserves best time',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const r=loadRecords(storage);saveRecord(storage,r,0,{time:30,stars:3});saveRecord(storage,r,0,{time:40,stars:2});
  assert.equal(loadRecords(storage)[0].time,30);
  data.set('eclipse-courier-v1','corrupt');assert.deepEqual(loadRecords(storage),Array(7).fill(null));
});
