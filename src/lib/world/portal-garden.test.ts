import {describe,it,expect} from 'vitest';
import {Vector3} from 'three';
import {portalViewPose,portalWalk,portalWalkPoint,HOUSE_ROUTE,PORTAL_PREVIEW,PORTAL_VIEWS,type HouseView} from './portal-garden';

describe('reading house viewpoints',()=>{
  it('starts each view at its authored position and keeps the portal preview nearby',()=>{
    for(const [view,preset] of Object.entries(PORTAL_VIEWS)){
      const pose=portalViewPose({view:view as HouseView,yaw:0,pitch:0,zoom:1});
      expect(pose.eye.distanceTo(new Vector3(...preset.eye))).toBeLessThan(.00001);
      expect(pose.look.distanceTo(new Vector3(...preset.look))).toBeLessThan(.00001);
    }
    expect(new Vector3(...PORTAL_PREVIEW.eye).distanceTo(new Vector3(...PORTAL_VIEWS.garden.eye))).toBeLessThan(3);
  });
  it('keeps orbit and zoom close to a human-height viewpoint instead of crossing the room',()=>{
    for(const view of Object.keys(PORTAL_VIEWS) as HouseView[])for(const yaw of [-.95,0,.95])for(const pitch of [-.3,0,.25])for(const zoom of [.65,1,1.8]){
      const pose=portalViewPose({view,yaw,pitch,zoom});
      expect(pose.eye.distanceTo(new Vector3(...PORTAL_VIEWS[view].eye))).toBeLessThan(1.15);
      if(view==='upstairs'){
        expect(pose.eye.y).toBeGreaterThan(4.7);expect(pose.eye.y).toBeLessThan(5.05);
        expect(pose.eye.x).toBeGreaterThan(2.2);expect(pose.eye.x).toBeLessThan(2.8);expect(pose.eye.z).toBeGreaterThan(-3.35);expect(pose.eye.z).toBeLessThan(-2.74);
      }else{
        expect(pose.eye.y).toBeGreaterThan(1.1);expect(pose.eye.y).toBeLessThan(2.9);
        expect(Math.abs(pose.eye.x)).toBeLessThan(3);expect(pose.eye.z).toBeGreaterThan(-1.1);expect(pose.eye.z).toBeLessThan(8);
      }
    }
  });
  it('climbs and descends on the actual east stair, with ground travel through the clear centre',()=>{
    const ascent=portalWalk(new Vector3(...PORTAL_VIEWS.bench.eye),'upstairs');
    expect(ascent.points.map(point=>point.toArray())).toEqual([PORTAL_VIEWS.bench.eye,HOUSE_ROUTE.centre,HOUSE_ROUTE.aisle,HOUSE_ROUTE.bottom,HOUSE_ROUTE.landing,HOUSE_ROUTE.opening,HOUSE_ROUTE.balconyTurn,PORTAL_VIEWS.upstairs.eye]);
    const descent=portalWalk(new Vector3(...PORTAL_VIEWS.upstairs.eye),'shelf');
    expect(descent.points.map(point=>point.toArray())).toEqual([PORTAL_VIEWS.upstairs.eye,HOUSE_ROUTE.balconyTurn,HOUSE_ROUTE.opening,HOUSE_ROUTE.landing,HOUSE_ROUTE.bottom,HOUSE_ROUTE.aisle,HOUSE_ROUTE.centre,PORTAL_VIEWS.shelf.eye]);
    for(const walk of [ascent,descent])for(let i=0;i<=120;i++){
      const point=portalWalkPoint(walk,walk.length*i/120);
      if(point.y>2.3&&point.y<4.7){
        expect(point.x).toBeCloseTo(4,8);
        expect(point.y).toBeCloseTo(1.7+(1.1-point.z)*3.15/4.9,8);
      }
      if(point.y<2)expect(Math.hypot(point.x-2.8,point.z-1.96)).toBeGreaterThan(.55);
    }
    const betweenRooms=portalWalk(new Vector3(...PORTAL_VIEWS.bench.eye),'shelf');
    expect(betweenRooms.points[1].toArray()).toEqual(HOUSE_ROUTE.centre);
  });
  it('turns back down the stair when a destination changes partway up',()=>{
    const halfway=new Vector3(...HOUSE_ROUTE.bottom).lerp(new Vector3(...HOUSE_ROUTE.landing),.5);
    const walk=portalWalk(halfway,'bench');
    expect(walk.points[1].toArray()).toEqual(HOUSE_ROUTE.bottom);
    expect(walk.points.some(point=>point.equals(new Vector3(...HOUSE_ROUTE.landing)))).toBe(false);
    for(let i=0;i<=80;i++)expect(portalWalkPoint(walk,walk.length*i/80).y).toBeLessThanOrEqual(halfway.y);
    const floorTurn=portalWalk(new Vector3(...HOUSE_ROUTE.bottom),'bench');
    expect(floorTurn.points[1].toArray()).toEqual(HOUSE_ROUTE.aisle);
  });
  it('uses the doorway and balcony floor, with an initial sightline above the front railing',()=>{
    const eye=new Vector3(...PORTAL_VIEWS.upstairs.eye),look=new Vector3(...PORTAL_VIEWS.upstairs.look);
    const railIntersection=eye.clone().lerp(look,(-2.59-eye.z)/(look.z-eye.z));
    expect(railIntersection.y).toBeGreaterThan(4.15);
    const walks=[portalWalk(new Vector3(...HOUSE_ROUTE.landing),'upstairs'),portalWalk(eye,'bench'),portalWalk(new Vector3(3.35,4.85,-3.65),'upstairs')];
    for(const walk of walks)for(let i=0;i<=160;i++){
      const point=portalWalkPoint(walk,walk.length*i/160);
      if(point.y<4.84)continue;
      const upperFloor=point.x>=1.85&&point.x<=5.45&&point.z>=-6.82&&point.z<=-3.62;
      const balcony=point.x>=1.755&&point.x<=3.205&&point.z>=-3.815&&point.z<=-2.565;
      expect(upperFloor||balcony).toBe(true);
    }
  });
});
