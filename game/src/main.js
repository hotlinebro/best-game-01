import {createInput} from './input.js';
import {createRenderer} from './render.js';
import {createWorld} from './world.js';
const canvas=document.querySelector('canvas'), input=createInput(canvas), world=createWorld(), render=createRenderer(canvas); let screen='title',last=0,acc=0;
function start(){world.reset();screen='play'} function frame(t){requestAnimationFrame(frame);acc+=Math.min(.1,(t-last)/1000);last=t;const a=input.take();if(a.start&&(screen==='title'||screen==='over'||screen==='win'))start();if(a.restart)start();if(a.pause&&screen==='play')screen='pause';else if(a.pause&&screen==='pause')screen='play';if(screen==='play')while(acc>1/60){world.step(1/60,input.mouse);acc-=1/60;if(world.state.dead)screen='over';if(world.state.won)screen='win'}render(world.state,screen)}requestAnimationFrame(frame);
