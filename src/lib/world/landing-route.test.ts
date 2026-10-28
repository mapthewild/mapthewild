import {describe,it,expect} from 'vitest';
import {landingPosition,landingPathPoint,landingTerracePoint} from './landing-route';
describe('Approved Nowbrary landing in Explore',()=>{
 it('retraces the same boarding route and returns to the seat',()=>{
  for(const progress of [0,.17,.5,.84,1]){
   const outward=landingPosition({at:'boat',place:'quay',destination:'quay',progress,walking:true});
   const home=landingPosition({at:'quay',place:'quay',destination:'boat',progress:1-progress,walking:true});
   expect(outward).toBeCloseTo(home);
  }
  expect(landingPosition({at:'quay',place:'quay',destination:'boat',progress:1,walking:true})).toBeCloseTo(3.3);
 });
 it('keeps the terrace return on the same path before boarding',()=>{
  for(const progress of [0,.3,.7,1]){
   const outward=landingTerracePoint({at:'quay',place:'quay',destination:'garden',progress,walking:true})!;
   const back=landingTerracePoint({at:'garden',place:'garden',destination:'quay',progress:1-progress,walking:true})!;
   expect(outward.x).toBeCloseTo(back.x);expect(outward.y).toBeCloseTo(back.y);
  }
  expect(landingTerracePoint({at:'garden',place:'garden',destination:'boat',progress:.35,walking:true})).toBeNull();
  expect(landingPosition({at:'garden',place:'garden',destination:'boat',progress:.35,walking:true})).toBe(12);
 });
 it('continues from the approved first steps to the doorway, and back',()=>{
  for(const progress of [0,.25,.75,1]){
   const into=landingPosition({at:'quay',place:'quay',destination:'shop',progress,walking:true});
   const out=landingPosition({at:'shop',place:'shop',destination:'quay',progress:1-progress,walking:true});
   expect(into).toBeCloseTo(out);
  }
  expect(landingPathPoint(12)).toEqual({x:839,y:541});
  expect(landingPathPoint(19)).toEqual({x:807,y:361});
 });
});
