import {describe,it,expect} from 'vitest';
import {portalFrame,advancePortal} from './portal-journey';
import {footRoute,isInside,isWalkPlace} from './ashore';
import {isReader} from './shelf-data';
import {parseMemory} from './navigation';

describe('Crossing into a personal-place example',()=>{
  it('keeps Yours a reachable invitation, without inventing another reader',()=>{
    expect(isInside('yours')).toBe(true);expect(isWalkPlace('yours')).toBe(true);expect(isReader('yours')).toBe(false);
    for(const from of ['quay','shop','moe','melville','montaigne'] as const){
      const out=footRoute(from,'yours'),back=footRoute('yours',from);
      expect(out.length).toBeGreaterThan(1);expect(out.toReversed()).toEqual(back);
    }
  });
  it('crosses through the actual miniature and returns to that aperture at any viewport size',()=>{
    const origin={x:510,y:320,w:240,h:180};
    for(const [w,h] of [[390,844],[1280,800]]){
      expect(portalFrame(origin,w,h,0)).toEqual({rect:origin,camera:0});
      expect(portalFrame(origin,w,h,1)).toEqual({rect:{x:0,y:0,w,h},camera:1});
      let t=0;for(let i=0;i<36;i++)t=advancePortal(t,true,.05,true);
      expect(t).toBeCloseTo(1);expect(advancePortal(t,false,0,true)).toBe(t);
      for(let i=0;i<36;i++)t=advancePortal(t,false,.05,true);
      expect(t).toBeCloseTo(0);expect(advancePortal(.4,true,0,false)).toBe(1);expect(advancePortal(.4,false,0,false)).toBe(0);
    }
  });
  it('restores a garden view only with a valid saved place at the Nowbrary dock',()=>{
    const memory={ship:[9,14],look:[19.5,3.8],zoom:1,port:'nowbrary',entered:true,ashore:'yours',portal:{view:'bench',yaw:.2,pitch:-.1,zoom:1.3}};
    expect(parseMemory(JSON.stringify(memory))?.portal).toEqual(memory.portal);
    for(const change of [{ship:[0,20]},{ashore:'moe'},{portal:{...memory.portal,view:'unknown'}},{portal:{...memory.portal,zoom:10}},{portal:{...memory.portal,pitch:'0'}}])expect(parseMemory(JSON.stringify({...memory,...change}))?.portal).toBeNull();
    expect(parseMemory(JSON.stringify({...memory,portal:undefined}))?.ashore).toBe('yours');
  });
});
