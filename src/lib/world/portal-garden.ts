import {MathUtils,Spherical,Vector3} from 'three';

/** Kept under the existing module name so saved portal views remain compatible. */
export const PORTAL_PREVIEW={eye:[.3,2.65,9.5] as const,look:[-.45,2.15,-2.5] as const,fov:62,width:512,height:384};
export const PORTAL_VIEWS={
  garden:{eye:[0,2.2,7.4] as const,look:[-.35,2,-2.7] as const},
  bench:{eye:[-1.65,1.65,3.35] as const,look:[-4.5,1.15,1.4] as const},
  shelf:{eye:[.65,1.9,-.4] as const,look:[-1,2.1,-5.65] as const},
  upstairs:{eye:[2.5,4.85,-3.05] as const,look:[-3,1.2,2] as const},
};
export type HouseView=keyof typeof PORTAL_VIEWS;
export type PortalView=HouseView|'island';
export type PortalViewState={view:PortalView;yaw:number;pitch:number;zoom:number};
export type PortalDestination='reading-house'|'future-dads';
export type PortalPhase='closed'|'entering'|'garden'|'leaving';
export function isPortalDestination(value:unknown):value is PortalDestination{return value==='reading-house'||value==='future-dads';}
export function portalViewAllowed(destination:PortalDestination,view:unknown):view is PortalView{return typeof view==='string'&&(destination==='reading-house'?Object.hasOwn(PORTAL_VIEWS,view):view==='island'||Object.hasOwn(PORTAL_VIEWS,view)&&view!=='upstairs');}
export type PortalPose={eye:readonly [number,number,number];look:readonly [number,number,number]};
export const HOUSE_ROUTE={centre:[.6,1.7,2.8] as const,aisle:[1.4,1.7,1.3] as const,bottom:[4,1.7,1.1] as const,landing:[4,4.85,-3.8] as const,opening:[3.4,4.85,-3.65] as const,balconyTurn:[3.05,4.85,-3.65] as const};
export type PortalWalk={points:Vector3[];lengths:number[];length:number;duration:number};

/** Floor-level waypoints share the actual east stair's centre line. */
export function portalWalk(start:Vector3,destination:HouseView):PortalWalk{
  const centre=new Vector3(...HOUSE_ROUTE.centre),aisle=new Vector3(...HOUSE_ROUTE.aisle),bottom=new Vector3(...HOUSE_ROUTE.bottom),landing=new Vector3(...HOUSE_ROUTE.landing),opening=new Vector3(...HOUSE_ROUTE.opening),balconyTurn=new Vector3(...HOUSE_ROUTE.balconyTurn),goal=new Vector3(...PORTAL_VIEWS[destination].eye);
  const stair=landing.clone().sub(bottom),t=MathUtils.clamp(start.clone().sub(bottom).dot(stair)/stair.lengthSq(),0,1);
  const onStair=t>0&&t<1&&start.distanceTo(bottom.clone().addScaledVector(stair,t))<.3;
  const upstairs=!onStair&&start.y>3.7;
  const onBalcony=upstairs&&start.x>=1.8&&start.x<=3.2&&start.z>=-3.8&&start.z<=-2.65;
  const inEastAisle=!upstairs&&!onStair&&start.x>1.4&&start.z>=1.05&&start.z<=1.4;
  let candidates:Vector3[];
  if(destination==='upstairs')candidates=onBalcony?[start,goal]:upstairs?[start,opening,balconyTurn,goal]:onStair?[start,landing,opening,balconyTurn,goal]:inEastAisle?[start,bottom,landing,opening,balconyTurn,goal]:[start,centre,aisle,bottom,landing,opening,balconyTurn,goal];
  else candidates=onBalcony?[start,balconyTurn,opening,landing,bottom,aisle,centre,goal]:upstairs?[start,opening,landing,bottom,aisle,centre,goal]:onStair?[start,bottom,aisle,centre,goal]:inEastAisle?[start,aisle,centre,goal]:[start,centre,goal];
  const points=candidates.filter((point,i)=>i===0||point.distanceTo(candidates[i-1])>.02).map(point=>point.clone());
  const lengths=points.slice(1).map((point,i)=>point.distanceTo(points[i])),length=lengths.reduce((sum,n)=>sum+n,0);
  return {points,lengths,length,duration:MathUtils.clamp(length/3.5,.65,5.6)};
}

export function portalWalkPoint(walk:PortalWalk,distance:number){
  let remaining=MathUtils.clamp(distance,0,walk.length);
  for(let i=0;i<walk.lengths.length;i++){
    if(remaining<=walk.lengths[i])return walk.points[i].clone().lerp(walk.points[i+1],remaining/walk.lengths[i]);
    remaining-=walk.lengths[i];
  }
  return walk.points.at(-1)!.clone();
}

/** Look around a nearby pivot; never pull a phone camera back through the walls. */
export function portalViewPose(state:PortalViewState,preset:PortalPose=PORTAL_VIEWS[state.view==='island'?'garden':state.view],radius=state.view==='upstairs'?.3:.8){
  const eye=new Vector3(...preset.eye),look=new Vector3(...preset.look);
  const direction=look.clone().sub(eye),distance=direction.length();direction.normalize();
  const pivot=eye.clone().addScaledVector(direction,radius);
  const orbit=new Spherical().setFromVector3(direction.clone().multiplyScalar(-radius));
  orbit.theta+=MathUtils.clamp(state.yaw,-.95,.95);
  orbit.phi=MathUtils.clamp(orbit.phi+MathUtils.clamp(state.pitch,-.3,.25),.35,Math.PI-.35);
  orbit.radius/=MathUtils.clamp(state.zoom,.65,1.8);
  const offset=new Vector3().setFromSpherical(orbit);
  eye.copy(pivot).add(offset);look.copy(eye).addScaledVector(offset.clone().normalize(),-distance);
  return {eye,look};
}
