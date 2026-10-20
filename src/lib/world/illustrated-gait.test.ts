import {describe,it,expect} from 'vitest';
import {illustratedGait} from './illustrated-gait';
describe('Illustrated traveller support and stopping',()=>{
  it('holds each planted foot at the same ground position while the body travels',()=>{
    const gait=illustratedGait();let previous:ReturnType<typeof gait.update>|null=null,oldDistance=0;
    for(let i=0;i<600;i++){
      const d=i*9,pose=gait.update(d,540,1/60,true);
      if(previous)pose.feet.forEach((f,k)=>{if(f.planted&&previous!.feet[k].planted)expect(d+f.forward).toBeCloseTo(oldDistance+previous!.feet[k].forward,8);});
      previous=pose;oldDistance=d;
    }
  });
  it('lifts and lands successive feet, then settles them beneath the stopped body',()=>{
    const gait=illustratedGait();let d=0,max=0,swings=[0,0];
    for(let i=0;i<240;i++){d=i*9;const p=gait.update(d,540,1/60,true);p.feet.forEach((f,k)=>{if(!f.planted)swings[k]++;max=Math.max(max,f.lift);expect(Math.abs(f.forward)).toBeLessThan(185);});}
    expect(max).toBeGreaterThan(60);expect(swings.every(n=>n>30)).toBe(true);
    let p=gait.update(d,0,1/60,false);for(let i=0;i<90;i++)p=gait.update(d,0,1/60,false);
    expect(p.active).toBe(false);p.feet.forEach(f=>{expect(f.planted).toBe(true);expect(f.lift).toBe(0);expect(f.forward).toBeCloseTo(0,8);});
  });
});
