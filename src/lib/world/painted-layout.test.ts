import {describe,it,expect} from 'vitest';
import {footRoute,type FootNode} from './ashore';
import {PAINTED_POINTS,paintedJourney,paintedFrustum,shelfCentre} from './painted-layout';

describe('Painted visit registration',()=>{
  it('lands on the same illustrated steps and doorway going out and returning',()=>{
    for(const from of ['boat','quay','shop','garden','moe','melville','montaigne'] as FootNode[]){
      for(const to of ['boat','quay','shop','garden','moe','melville','montaigne'] as FootNode[]){
        const path=footRoute(from,to),back=footRoute(to,from);
        expect(paintedJourney(path,0)).toEqual(PAINTED_POINTS[from]);
        const end=paintedJourney(path,1);expect(end[0]).toBeCloseTo(PAINTED_POINTS[to][0]);expect(end[1]).toBeCloseTo(PAINTED_POINTS[to][1]);
        for(const t of [.12,.47,.83]){const a=paintedJourney(path,t),b=paintedJourney(back,1-t);expect(a[0]).toBeCloseTo(b[0]);expect(a[1]).toBeCloseTo(b[1]);}
      }
    }
  });
  it('keeps camera pans within the painting on phone, desktop and ultrawide views',()=>{
    for(const aspect of [390/844,1280/800,1920/1080,3440/1440])for(const centre of [[-1500,-900],[0,0],[1500,900]] as [number,number][])for(const zoom of [.72,1,1.35,1.65]){
      const f=paintedFrustum(aspect,zoom,centre);
      expect(f.left).toBeGreaterThanOrEqual(-800.00001);expect(f.right).toBeLessThanOrEqual(800.00001);
      expect(f.bottom).toBeGreaterThanOrEqual(-450.00001);expect(f.top).toBeLessThanOrEqual(450.00001);
    }
  });
  it('fits the whole selected case and fishbowl in the default phone view',()=>{
    const aspect=390/844,zoom=Math.min(1.7,900*aspect/360);
    for(const id of ['moe','melville','montaigne'] as const){
      const centre=shelfCentre(id),f=paintedFrustum(aspect,zoom,[centre,0]);
      expect(f.left).toBeLessThan(centre-146);expect(f.right).toBeGreaterThan(centre+146);
      expect(f.bottom).toBeLessThan(-210);expect(f.top).toBeGreaterThan(235);
    }
  });
});
