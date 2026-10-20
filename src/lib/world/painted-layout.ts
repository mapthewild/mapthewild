import {FOOT_POINTS,type FootPoint,type FootNode} from './ashore';
import {SHELF_X,type ReaderId} from './shelf-data';

// Coordinates in a 1600 × 900 painted set, measured from its centre, Y upward.
export const PAINTED_POINTS:Record<FootNode,[number,number]>={
  boat:[-370,-330],jetty:[-90,-300],steps:[-155,-125],quay:[60,-150],
  corner:[270,-125],threshold:[270,-70],shop:[270,5],hall:[0,-170],
  garden:[600,-180],moe:[-330,-210],melville:[0,-210],montaigne:[322.5,-210],
};
export const SHELF_SCALE=150;
export const SHELF_FLOOR=-210;
export const shelfCentre=(id:ReaderId)=>(SHELF_X[id]-SHELF_X.melville)*SHELF_SCALE;
export function paintedPoint(point:FootPoint):[number,number]{
  const key=(Object.keys(FOOT_POINTS) as FootNode[]).find(key=>FOOT_POINTS[key].every((n,i)=>Math.abs(n-point[i])<.001));
  return key?PAINTED_POINTS[key]:PAINTED_POINTS.quay;
}
export function paintedJourney(path:FootPoint[],progress:number):[number,number]{
  if(!path.length)return PAINTED_POINTS.quay;
  const lengths=path.slice(1).map((p,i)=>Math.hypot(...p.map((v,k)=>v-path[i][k])));
  let distance=Math.max(0,Math.min(1,progress))*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i]||i===lengths.length-1){const t=lengths[i]?Math.min(1,distance/lengths[i]):0,a=paintedPoint(path[i]),b=paintedPoint(path[i+1]);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
    distance-=lengths[i];
  }
  return paintedPoint(path[0]);
}
export function paintedFrustum(aspect:number,zoom:number,centre:[number,number]){
  const height=Math.min(900,1600/aspect)/Math.max(1,zoom),width=height*aspect;
  const x=Math.max(-800+width/2,Math.min(800-width/2,centre[0]));
  const y=Math.max(-450+height/2,Math.min(450-height/2,centre[1]));
  return{left:x-width/2,right:x+width/2,top:y+height/2,bottom:y-height/2};
}
