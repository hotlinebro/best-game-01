export const LEVELS = [
  {name:'THE FIRST SPARK',district:'Old observatory',par:36,length:7000,gap:64,wind:0,dogs:[],glass:[],moving:[],tip:'Throw ahead. Run after it. Catch to restore glow.'},
  {name:'WIND OVER WIRE',district:'Aerial quarter',par:38,length:7400,gap:74,wind:38,dogs:[],glass:[],moving:[],tip:'Gusts bend the sun’s arc. Trust the dotted path.'},
  {name:'LET SLEEPING DOGS LIE',district:'Hound terraces',par:40,length:7800,gap:78,wind:20,dogs:[3,7,11],glass:[],moving:[],tip:'Hounds chase in light. Jump over them or pass in shadow.'},
  {name:'FRAGILE CONSTELLATIONS',district:'Glasshouse mile',par:42,length:8200,gap:82,wind:25,dogs:[5,10],glass:[3,6,9,12],moving:[],tip:'Glass cracks underfoot. Keep moving; avoid hard landings.'},
  {name:'THE CITY BREATHES',district:'Sliding eaves',par:43,length:8600,gap:80,wind:30,dogs:[5,11],glass:[7],moving:[3,6,9,12],tip:'Eaves drift. Time your jump; riders move with the roof.'},
  {name:'A SUN BETWEEN STORMS',district:'Tempest ridge',par:43,length:9000,gap:92,wind:55,dogs:[3,7,11],glass:[4,8,12],moving:[5,9,13],tip:'Long throws buy speed. Short throws buy safety.'},
  {name:'DELIVER THE DAWN',district:'The final horizon',par:42,length:9200,gap:98,wind:65,dogs:[3,6,10,14],glass:[4,8,12],moving:[5,9,13],tip:'Seven rooftops. One last sun. Bring it home.'},
];
export function buildLevel(index=0) {
  const data=LEVELS[index];
  if(!data)throw new RangeError('Unknown rooftop');
  const roofs=[];let x=0,i=0;
  while(x<data.length) {
    const w=i===0||data.dogs.includes(i)?460:290+(i%3)*32;
    roofs.push({id:i,baseX:x,x,y:430,w,kind:data.glass.includes(i)?'glass':data.moving.includes(i)?'moving':'stone',wear:0,broken:false});
    x+=w+data.gap;i++;
  }
  const last=roofs.at(-1);
  return {...data,index,roofs,gate:last.x+last.w-90,end:last.x+last.w,
    hounds:data.dogs.filter(id=>roofs[id]).map(id=>({roof:id,x:roofs[id].x+350,y:430,dir:1,alert:false}))};
}
export function routeMetrics(level) {
  const gaps=level.roofs.slice(1).map((r,i)=>r.baseX-level.roofs[i].baseX-level.roofs[i].w+(r.kind==='moving'||level.roofs[i].kind==='moving'?44:0));
  return {maxGap:Math.max(...gaps),gateSupported:level.roofs.some(r=>level.gate>r.baseX&&level.gate<r.baseX+r.w),minimumTime:(level.gate-80)/330};
}
