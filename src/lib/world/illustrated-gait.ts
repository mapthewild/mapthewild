type Step={from:number;to:number;elapsed:number;duration:number};
/** Feet stay in ground coordinates during support, including starting and stopping. */
export function illustratedGait(){
  const feet=[{ground:0,lift:0,step:null as Step|null},{ground:0,lift:0,step:null as Step|null}];
  let next=0,started=false,wasWalking=false;
  return{reset(distance:number){feet.forEach(f=>{f.ground=distance;f.lift=0;f.step=null;});next=0;started=true;wasWalking=false;},update(distance:number,speed:number,dt:number,walking:boolean){
    if(!started){feet.forEach(f=>f.ground=distance);started=true;}
    if(wasWalking&&!walking)for(const foot of feet)if(foot.step)foot.step={from:foot.ground,to:distance,elapsed:0,duration:.18};
    wasWalking=walking;
    for(const foot of feet)if(foot.step){
      const step=foot.step;if(!walking)step.to=distance;
      step.elapsed+=dt;const t=Math.min(1,step.elapsed/step.duration),ease=t*t*(3-2*t);
      foot.ground=step.from+(step.to-step.from)*ease;foot.lift=Math.sin(t*Math.PI)*62;
      if(t===1){foot.ground=step.to;foot.lift=0;foot.step=null;}
    }
    if(!feet.some(f=>f.step)){
      let leg=next;
      if(walking){if(feet[1-next].ground<feet[next].ground)leg=1-next;}
      else if(Math.abs(feet[leg].ground-distance)<2)leg=1-leg;
      const foot=feet[leg],behind=distance-foot.ground;
      if(walking?behind>75||feet.every(f=>f.ground===feet[0].ground)&&behind>2:Math.abs(behind)>2){
        const duration=walking?Math.max(.14,Math.min(.20,125/Math.max(speed,1))):.22;
        foot.step={from:foot.ground,to:walking?distance+Math.min(speed*duration,130)+112:distance,elapsed:0,duration};next=1-leg;
      }
    }
    return{feet:feet.map(f=>({forward:f.ground-distance,lift:f.lift,planted:!f.step})),active:walking||feet.some(f=>f.step||Math.abs(f.ground-distance)>2)};
  }};
}
