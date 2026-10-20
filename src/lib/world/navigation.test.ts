import {describe,it,expect} from 'vitest';
import {PORTS,waterRoute,isWater,clearSegment,parseMemory,safeReadHref} from './navigation';
import {FOOT_POINTS,WALK_PLACES,footRoute,type WalkPlace} from './ashore';
describe('Navigable first shores',()=>{
  it('keeps every landing reachable without crossing a visible coast',()=>{
    const points:[[number,number],...Array<[number,number]>]=[[0,20],...Object.values(PORTS).map(p=>p.point)];
    for(const a of points)for(const b of points){
      expect(isWater(a)).toBe(true);const route=waterRoute(a,b);expect(route).not.toBeNull();
      route!.slice(1).forEach((p,i)=>expect(clearSegment(route![i],p)).toBe(true));
    }
  });
  it('rejects land destinations and corrupted saved positions',()=>{
    expect(waterRoute([0,20],[20,5])).toBeNull();
    expect(parseMemory('{broken')).toBeNull();
    expect(parseMemory(JSON.stringify({ship:[20,5],look:[0,0],zoom:1,port:null}))).toBeNull();
  });
  it('keeps read-mode returns on the site',()=>{
    expect(safeReadHref('https://example.com')).toBe('/mapthewild/');
    expect(safeReadHref('//example.com')).toBe('/mapthewild/');
    expect(safeReadHref('/mapthewild/explore')).toBe('/mapthewild/');
    expect(safeReadHref('/mapthewild/posts/starting-your-nowbrary')).toContain('starting-your-nowbrary');
  });
  it('can walk to every place and return along the quay without cutting through the shop',()=>{
    for(const place of Object.keys(WALK_PLACES) as WalkPlace[]){
      const outward=footRoute('boat',place),home=footRoute(place,'boat');
      expect(outward[0]).toEqual(FOOT_POINTS.boat);
      expect(outward.at(-1)).toEqual(FOOT_POINTS[place]);
      expect(home).toEqual([...outward].reverse());
      expect(outward).toContainEqual(FOOT_POINTS.steps);
      expect(outward).toContainEqual(FOOT_POINTS.quay);
    }
    expect(footRoute('garden','shop')).toContainEqual(FOOT_POINTS.corner);
  });
  it('routes every shelf through the doorway and keeps shelf-to-shelf walking indoors',()=>{
    for(const shelf of ['moe','melville','montaigne'] as const){
      const approach=footRoute('quay',shelf);
      expect(approach).toContainEqual(FOOT_POINTS.threshold);
      expect(approach).toContainEqual(FOOT_POINTS.shop);
      for(const other of ['moe','melville','montaigne'] as const){
        const indoors=footRoute(shelf,other);
        expect(indoors.every(point=>point[2]<FOOT_POINTS.threshold[2])).toBe(true);
      }
    }
  });
  it('only restores a walking visit when the boat is at the Nowbrary dock',()=>{
    const memory={ship:[9,14],look:[15,6],zoom:3.3,port:'nowbrary',entered:true,ashore:'shop'};
    expect(parseMemory(JSON.stringify(memory))?.ashore).toBe('shop');
    for(const shelf of ['moe','melville','montaigne'])expect(parseMemory(JSON.stringify({...memory,ashore:shelf}))?.ashore).toBe(shelf);
    expect(parseMemory(JSON.stringify({...memory,ship:[0,20]}))?.ashore).toBeNull();
    expect(parseMemory(JSON.stringify({...memory,ashore:'outside-the-world'}))?.ashore).toBeNull();
  });
});
