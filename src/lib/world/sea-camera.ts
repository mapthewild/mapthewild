import {PerspectiveCamera,Vector3} from 'three';
import {PORTS,NAVIGABLE_COASTS,type Point,type Port} from './navigation';

export type SeaFrame={look:Point;zoom:number};
export type SeaViewport={width:number;height:number};
export const SEA_EYE=[6,57,65] as const;
export const SEA_MIN_ZOOM=.18;
// At the widest chart view, an interior-scale near plane collapses the water
// and map surfaces into the same depth-buffer value. Close rooms use .08.
export const SEA_NEAR=2;
export const SEA_FAR=1000;
const chartPoints:Point[]=[...Object.values(PORTS).map(p=>p.point),...NAVIGABLE_COASTS.flat()];

/** Required sea half-extents at the visible ground corners, without new vertices. */
export function seaWaterExtent(camera:PerspectiveCamera):Point {
  let xExtent=100,zExtent=85;
  for(const x of [-1,1])for(const y of [-1,1]){
    const ray=new Vector3(x,y,1).unproject(camera).sub(camera.position);
    // During departure from a close room view, a corner can point above the
    // horizon. Cover its far-plane extent rather than intersecting behind us.
    const t=ray.y<0?Math.min(1,Math.max(0,(.02-camera.position.y)/ray.y)):1;
    xExtent=Math.max(xExtent,Math.abs(camera.position.x+ray.x*t)+8);
    zExtent=Math.max(zExtent,Math.abs(camera.position.z+ray.z*t)+8);
  }
  return [xExtent,zExtent];
}

/** Fit the journey beneath the header and above the destination controls. */
export function fitSeaFrame(points:Point[],viewport:SeaViewport,maxZoom=1.4):SeaFrame {
  const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height);
  const xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
  const look:Point=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2];
  const camera=new PerspectiveCamera(34,width/height,SEA_NEAR,SEA_FAR),target=new Vector3(look[0],0,look[1]);
  // Port labels need room as well as their anchor points. On narrow screens the
  // fixed destination controls remain full-sized; the chart can fit around them.
  const xLimit=1-2*(width<=600?28:130)/width;
  const yLimit=1-2*Math.min(155,height*.25)/height;
  const fits=(zoom:number)=>{
    camera.position.copy(target).add(new Vector3(...SEA_EYE).divideScalar(zoom));
    camera.lookAt(target);camera.updateMatrixWorld();
    return points.every(p=>{
      const projected=new Vector3(p[0],1.9,p[1]).project(camera);
      return Math.abs(projected.x)<=xLimit&&Math.abs(projected.y)<=yLimit;
    });
  };
  let low=SEA_MIN_ZOOM,high=maxZoom;
  for(let i=0;i<30;i++){const mid=(low+high)/2;if(fits(mid))low=mid;else high=mid;}
  return {look,zoom:low};
}

export function bayFrame(ship:Point,viewport:SeaViewport):SeaFrame {
  return fitSeaFrame([ship,...chartPoints],viewport,1);
}

export function arrivalFrame(ship:Point,port:Port|null,viewport:SeaViewport):SeaFrame {
  if(!port)return bayFrame(ship,viewport);
  // Both open shores remain discoverable while aboard. Close, detailed framing
  // belongs to the explicit Step ashore journey, not to clicking a map label.
  return fitSeaFrame([ship,PORTS[port].look,...chartPoints],viewport);
}

export function voyageFrames(path:Point[],port:Port|null,viewport:SeaViewport){
  return {
    wide:fitSeaFrame([...path,...chartPoints],viewport,1),
    arrival:arrivalFrame(path.at(-1)!,port,viewport),
  };
}

/** Keep the crossing legible; settle toward the harbour only on final approach. */
export function approachFrame(wide:SeaFrame,arrival:SeaFrame,progress:number):SeaFrame {
  const t=Math.max(0,Math.min(1,(progress-.72)/.28)),ease=t*t*(3-2*t);
  return {look:[wide.look[0]+(arrival.look[0]-wide.look[0])*ease,wide.look[1]+(arrival.look[1]-wide.look[1])*ease],zoom:wide.zoom+(arrival.zoom-wide.zoom)*ease};
}
