import {describe,it,expect} from 'vitest';
import {PerspectiveCamera,Vector3} from 'three';
import {PORTS,waterRoute,parseMemory,type Point,type Port} from './navigation';
import {SEA_EYE,SEA_MIN_ZOOM,SEA_NEAR,SEA_FAR,seaWaterExtent,arrivalFrame,bayFrame,voyageFrames,approachFrame,type SeaFrame,type SeaViewport} from './sea-camera';
import {MAP_COASTS} from './map-islands';

function projection(frame:SeaFrame,viewport:SeaViewport,p:Point){
  const camera=new PerspectiveCamera(34,viewport.width/viewport.height,.08,SEA_FAR);
  const target=new Vector3(frame.look[0],0,frame.look[1]);
  camera.position.copy(target).add(new Vector3(...SEA_EYE).divideScalar(frame.zoom));
  camera.lookAt(target);camera.updateMatrixWorld();
  return new Vector3(p[0],1.9,p[1]).project(camera);
}
function expectVisible(frame:SeaFrame,viewport:SeaViewport,points:Point[]){
  for(const p of points){
    const projected=projection(frame,viewport,p);
    // Allow space around the anchors for labels and the persistent controls.
    expect(Math.abs(projected.x)).toBeLessThanOrEqual(1-2*(viewport.width<=600?28:130)/viewport.width+.001);
    expect(Math.abs(projected.y)).toBeLessThanOrEqual(1-2*Math.min(155,viewport.height*.25)/viewport.height+.001);
    expect(projected.z).toBeGreaterThan(-1);expect(projected.z).toBeLessThan(1);
  }
}
const viewports=[{width:390,height:844},{width:320,height:568},{width:1280,height:720},{width:1836,height:1343}];

describe('Sea camera keeps the voyage connected',()=>{
  it('keeps the distant map surfaces distinguishable from the highest waves in a 24-bit depth buffer',()=>{
    for(const viewport of viewports){
      const frame=bayFrame([0,20],viewport);
      const camera=new PerspectiveCamera(34,viewport.width/viewport.height,SEA_NEAR,SEA_FAR);
      const target=new Vector3(frame.look[0],0,frame.look[1]);
      camera.position.copy(target).add(new Vector3(...SEA_EYE).divideScalar(SEA_MIN_ZOOM));
      camera.lookAt(target);camera.updateMatrixWorld();
      for(const [x,z] of Object.values(MAP_COASTS).flat()){
        const island=new Vector3(x,.16,z).project(camera);
        const highestWater=new Vector3(x,.02+.045+.035,z).project(camera);
        const depthSteps=(highestWater.z-island.z)*.5*(2**24-1);
        expect(depthSteps).toBeGreaterThan(2);
      }
    }
  });
  it('shows every port and the boat after free-water clicks at the map edges',()=>{
    const edges:Point[]=[[0,29],[-34,5],[34,28],[0,-29]];
    for(const viewport of viewports)for(const ship of edges){
      const frame=bayFrame(ship,viewport);
      expectVisible(frame,viewport,[ship,...Object.values(PORTS).map(p=>p.point)]);
      expect(parseMemory(JSON.stringify({ship,look:frame.look,zoom:frame.zoom,port:null,entered:true}))).not.toBeNull();
    }
  });
  it('fits the whole water route before approaching each harbour, in both directions',()=>{
    for(const viewport of viewports)for(const from of Object.keys(PORTS) as Port[])for(const to of Object.keys(PORTS) as Port[]){
      const path=waterRoute(PORTS[from].point,PORTS[to].point)!;
      expect(path).not.toBeNull();
      const frames=voyageFrames(path,to,viewport);
      expectVisible(frames.wide,viewport,[...path,...Object.values(PORTS).map(p=>p.point)]);
      expect(approachFrame(frames.wide,frames.arrival,.7)).toEqual(frames.wide);
      expect(approachFrame(frames.wide,frames.arrival,1)).toEqual(frames.arrival);
    }
  });
  it('keeps the two open shores visible at a named landing, until explicitly stepping ashore',()=>{
    for(const viewport of viewports)for(const port of Object.keys(PORTS) as Port[]){
      const frame=arrivalFrame(PORTS[port].point,port,viewport);
      expectVisible(frame,viewport,[PORTS[port].point,PORTS[port].look,PORTS.nowbrary.point,PORTS.together.point]);
    }
  });
  it('widens on reboarding and interpolates the last approach without a camera jump',()=>{
    for(const viewport of viewports){
      expectVisible(bayFrame(PORTS.nowbrary.point,viewport),viewport,Object.values(PORTS).map(p=>p.point));
      const frames=voyageFrames(waterRoute(PORTS.together.point,PORTS.nowbrary.point)!,'nowbrary',viewport);
      const before=approachFrame(frames.wide,frames.arrival,.71999),after=approachFrame(frames.wide,frames.arrival,.72001);
      expect(after.zoom).toBeCloseTo(before.zoom,7);expect(after.look[0]).toBeCloseTo(before.look[0],6);
    }
  });
  it('covers the visible sea at phone edges and the furthest manual zoom-out',()=>{
    const ships:Point[]=[[0,29],[-34,5],[34,28],[0,-29]];
    for(const viewport of viewports)for(const ship of ships){
      const fitted=bayFrame(ship,viewport);
      for(const frame of [fitted,{...fitted,zoom:SEA_MIN_ZOOM}]){
        const camera=new PerspectiveCamera(34,viewport.width/viewport.height,.08,SEA_FAR);
        const target=new Vector3(frame.look[0],0,frame.look[1]);
        camera.position.copy(target).add(new Vector3(...SEA_EYE).divideScalar(frame.zoom));
        camera.lookAt(target);camera.updateMatrixWorld();
        const [xExtent,zExtent]=seaWaterExtent(camera);
        expect(xExtent).toBeGreaterThanOrEqual(100);expect(zExtent).toBeGreaterThanOrEqual(85);
        for(const x of [-1,0,1])for(const y of [-1,0,1]){
          const ray=new Vector3(x,y,0).unproject(camera).sub(camera.position);
          const atWater=camera.position.clone().addScaledVector(ray,(.02-camera.position.y)/ray.y);
          expect(atWater.clone().project(camera).z).toBeLessThan(1);
          expect(Math.abs(atWater.x)).toBeLessThan(xExtent);expect(Math.abs(atWater.z)).toBeLessThan(zExtent);
        }
      }
    }
  });
});
