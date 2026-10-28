import {describe,it,expect} from 'vitest';
import {visitMessage,visitTransform} from './future-dads-bridge';
import {FUTURE_DADS_COAST,isWater,PORTS,waterRoute,clearSegment} from './navigation';
describe('Future Dads crossing',()=>{
 it('only accepts messages from the actual local visit frame',()=>{
  const frame={} as Window,other={} as Window,origin='http://127.0.0.1:4330';
  const event={source:frame,origin,data:{type:'fd:left'}};
  expect(visitMessage(event,frame,origin)?.type).toBe('fd:left');
  expect(visitMessage({...event,source:other},frame,origin)).toBeNull();
  expect(visitMessage({...event,origin:'https://example.com'},frame,origin)).toBeNull();
  expect(visitMessage(event,null,origin)).toBeNull();
  expect(visitMessage({...event,data:{type:'fd:entered',frame:{x:NaN,y:0,size:20}}},frame,origin)).toBeNull();
  expect(visitMessage({...event,data:{type:'mtw:page-scroll',deltaY:Infinity}},frame,origin)).toBeNull();
 });
 it('starts the detailed view at the sea boat location, including on a phone',()=>{
  for(const start of [{x:950,y:700,size:45},{x:180,y:450,size:20}]){
   const end={x:400,y:860,size:220},transform=visitTransform(start,end);
   expect(transform.x+end.x*transform.scale).toBeCloseTo(start.x);
   expect(transform.y+end.y*transform.scale).toBeCloseTo(start.y);
   expect(end.size*transform.scale).toBeCloseTo(start.size);
  }
 });
 it('sails to every existing shore without crossing the new island',()=>{
  expect(FUTURE_DADS_COAST.every(p=>!isWater(p))).toBe(true);
  for(const port of Object.values(PORTS)){
   const route=waterRoute(PORTS['future-dads'].point,port.point);
   expect(route).not.toBeNull();route!.slice(1).forEach((p,i)=>expect(clearSegment(route![i],p)).toBe(true));
  }
 });
});
