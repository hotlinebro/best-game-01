const DONE_KEY='eclipse-courier-tutorial-done';

export function tutorialStep(s){
  let step=0,text='';
  if(s.levelIndex!==0||s.status!=='play')return {step,text};
  if(s.catches>0){step=5;text='NOW RUN TO THE DAWN GATE →';}
  else if(s.discHeld&&s.aiming){step=2;text='RELEASE TO THROW';}
  else if(s.discHeld&&s.throws===0){step=1;text=s.touch?'HOLD THROW AND DRAG TO AIM':'DRAG TO AIM — pull toward the next rooftop';}
  else if(!s.discHeld){
    step=s.playerX-s.throwX>30?4:3;
    text=step===3?(s.touch?'RUN AFTER IT — HOLD ◀ / ▶':'RUN AFTER IT — ← → OR A / D'):'CATCH IT BEFORE THE GLOW DIES';
  }
  return {step,text};
}

export function createTutorial(storage,records,{box,text,skip}){
  let done=false,enabled=false,step=0,throwX=0;
  try{done=storage.getItem(DONE_KEY)==='1';}catch{}
  function hide(){step=0;box.hidden=true;}
  function complete(){
    if(!enabled)return;
    done=true;enabled=false;
    try{storage.setItem(DONE_KEY,'1');}catch{}
    hide();
  }
  skip.onclick=complete;
  return {
    reset(run,demo=false){enabled=!done&&!records[0]&&run.level.index===0&&!demo;throwX=run.player.x;hide();},
    track(run){if(enabled&&run.disc.held&&run.throws===0)throwX=run.player.x;},
    update(run,aim,{demo=false,touch=false,aiming=!!aim}={}){
      if(!enabled||demo){hide();return false;}
      if(run.status==='clear'){complete();return false;}
      const result=tutorialStep({levelIndex:run.level.index,discHeld:run.disc.held,aiming,
        throws:run.throws,catches:run.catches,playerX:run.player.x,throwX,status:run.status,touch:touch||!!aim?.touch});
      step=result.step;text.textContent=result.text;box.hidden=step===0;
      return step!==0;
    },
    hide,complete,
    debug:()=>({active:step!==0,step}),
  };
}
