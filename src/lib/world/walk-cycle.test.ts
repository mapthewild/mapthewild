import {describe,it,expect} from 'vitest';
import {footfall,kneeBetween,STRIDE} from './walk-cycle';

describe('Walking contact',()=>{
  it('holds each supporting foot still in world space while the body advances',()=>{
    for(const side of [0,1] as const)for(let d=0;d<STRIDE*3;d+=.017){
      const a=footfall(d,side),b=footfall(d+.001,side);
      if(a.planted&&b.planted){expect(d+a.forward).toBeCloseTo(d+.001+b.forward,7);expect(a.lift).toBe(0);}
    }
  });
  it('keeps a foot supporting the body and lifts the returning foot',()=>{
    let maxLift=0;
    for(let d=0;d<STRIDE;d+=.005){const a=footfall(d,0),b=footfall(d,1);expect(a.planted||b.planted).toBe(true);maxLift=Math.max(maxLift,a.lift);}
    expect(maxLift).toBeGreaterThan(.15);
  });
  it('preserves thigh and shin lengths throughout the stride',()=>{
    for(let d=0;d<STRIDE;d+=.005){const f=footfall(d,0),hip:[number,number]=[.865-Math.cos(d/STRIDE*Math.PI*4)*.014,0],ankle:[number,number]=[.065+f.lift,f.forward],k=kneeBetween(hip,ankle);
      expect(Math.hypot(k[0]-hip[0],k[1]-hip[1])).toBeCloseTo(.445,5);expect(Math.hypot(k[0]-ankle[0],k[1]-ankle[1])).toBeCloseTo(.445,5);
    }
  });
});
