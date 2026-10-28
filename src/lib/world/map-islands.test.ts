import {describe,it,expect} from 'vitest';
import {MAP_ISLANDS,mapSeaPoint,MAP_COASTS} from './map-islands';
import {PORTS,isWater,parseMemory} from './navigation';
describe('Painted map landings',()=>{
 it('keeps every boat stop outside solid land and aligned with the drawing',()=>{
  for(const id of ['nowbrary','future-dads'] as const){
   expect(mapSeaPoint(id,MAP_ISLANDS[id].mooring)).toEqual(PORTS[id].point);
   expect(isWater(PORTS[id].point,1.5)).toBe(true);
   expect(MAP_COASTS[id].every(point=>!isWater(point))).toBe(true);
  }
 });
 it('preserves a saved bookshop visit when the map mooring changes',()=>{
  const saved={ship:[9,14],look:[15,6],zoom:1,port:'nowbrary',entered:true,ashore:'shop'};
  const restored=parseMemory(JSON.stringify(saved));
  expect(restored?.ship).toEqual(PORTS.nowbrary.point);
  expect(restored?.ashore).toBe('shop');
  const club=parseMemory(JSON.stringify({...saved,ship:[17,46],port:'future-dads',ashore:null}));
  expect(club?.ship).toEqual(PORTS['future-dads'].point);
 });
});
