import assert from 'node:assert/strict';
import {createRun,stepRun,TICK} from '../game/simulation.js';
import {courierBot} from '../game/autopilot.js';

export function playLevel(index){
  const run=createRun(index);
  for(let i=0;i<120*120&&run.status==='play';i++)stepRun(run,courierBot(run),TICK);
  return {level:index+1,status:run.status,time:+run.time.toFixed(2),par:run.level.par,throws:run.throws,catches:run.catches,stars:run.stars||0,reason:run.reason,x:Math.round(run.player.x)};
}
const results=Array.from({length:7},(_,i)=>playLevel(i));
console.table(results);
for(const r of results){assert.equal(r.status,'clear',`Level ${r.level}: ${r.reason}`);assert.ok(r.catches>=3);assert.ok(r.time<r.par*1.4);}
console.log('PASS: seven real-simulation deliveries; throw → run → catch → dawn.');
