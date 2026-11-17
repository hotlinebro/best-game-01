export function loadRecords(storage){
  try{
    const data=JSON.parse(storage.getItem('eclipse-courier-v1'));
    if(data?.version!==1||!Array.isArray(data.levels))return Array(7).fill(null);
    return Array.from({length:7},(_,i)=>{const r=data.levels[i];return r&&Number.isFinite(r.time)&&r.time>0&&[1,2,3].includes(r.stars)?r:null;});
  }catch{return Array(7).fill(null);}
}
export function saveRecord(storage,records,index,run){
  if(!records[index]||run.time<records[index].time)records[index]={time:run.time,stars:run.stars};
  try{storage.setItem('eclipse-courier-v1',JSON.stringify({version:1,levels:records}));return true;}catch{return false;}
}
