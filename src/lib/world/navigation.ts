import {isWalkPlace,type WalkPlace} from './ashore';
export type Point = [number, number];

// These coastlines also build the visible land. Navigation and geometry share a source.
export const COASTS: Point[][] = [
  [[6,-3],[12,-13],[31,-20],[42,-8],[43,15],[31,22],[17,17],[7,9],[5,4]],
  [[-40,-24],[-27,-28],[-12,-22],[-6,-13],[-8,-4],[-16,0],[-30,-3],[-40,-9]],
  [[-25,10],[-21,8],[-16,11],[-15,16],[-19,20],[-25,18],[-28,14]],
];
export const PORTS = {
  nowbrary: { point: [9,14] as Point, look: [14,5] as Point, title: 'Nowbrary', subtitle: 'Books kept close. Ideas carried further.' },
  together: { point: [-14,2.5] as Point, look: [-16,-8] as Point, title: 'Being together', subtitle: 'Good company. A little structure. Room to play.' },
  horizon: { point: [0,-19] as Point, look: [16,-18] as Point, title: 'The next shore', subtitle: 'There is room for what comes next.' },
} as const;
export type Port = keyof typeof PORTS;
export function isPort(value: unknown): value is Port { return typeof value === 'string' && Object.hasOwn(PORTS, value); }

export function inside(point: Point, polygon: Point[]) {
  const [x,z] = point; let result = false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if ((a[1]>z)!==(b[1]>z) && x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]) result=!result;
  }
  return result;
}
function segmentDistance(p: Point,a: Point,b: Point) {
  const dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
  const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/length)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);
}
export function isWater(p: Point, clearance=.7) {
  if (!p.every(Number.isFinite) || p[0]<-35 || p[0]>35 || p[1]<-30 || p[1]>29) return false;
  return !COASTS.some(poly=>inside(p,poly)||poly.some((a,i)=>segmentDistance(p,a,poly[(i+1)%poly.length])<clearance));
}
export function clearSegment(a: Point,b: Point) {
  const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.4);
  for(let i=0;i<=steps;i++) { const t=steps?i/steps:0; if(!isWater([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])) return false; }
  return true;
}

/** A small water-only A* grid, followed by visibility-based simplification. */
export function waterRoute(start: Point,end: Point): Point[] | null {
  if(!isWater(start)||!isWater(end)) return null;
  if(clearSegment(start,end)) return [start,end];
  const step=1.5, key=(p:Point)=>`${p[0]},${p[1]}`;
  const snap=(p:Point):Point=>[Math.round(p[0]/step)*step,Math.round(p[1]/step)*step];
  const nearest=(p:Point):Point|null=>{
    const n=snap(p); const candidates:Point[]=[];
    for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)candidates.push([n[0]+x*step,n[1]+z*step]);
    return candidates.filter(q=>isWater(q)&&clearSegment(p,q)).sort((a,b)=>Math.hypot(a[0]-p[0],a[1]-p[1])-Math.hypot(b[0]-p[0],b[1]-p[1]))[0]||null;
  };
  const a=nearest(start),b=nearest(end); if(!a||!b)return null;
  const open=new Map<string,Point>([[key(a),a]]),cost=new Map([[key(a),0]]),came=new Map<string,Point>();
  const closed=new Set<string>();let found=false;
  for(let n=0;open.size&&n<3000;n++) {
    let current:Point=a, score=Infinity;
    for(const [k,p] of open){const f=cost.get(k)!+Math.hypot(p[0]-b[0],p[1]-b[1]);if(f<score){score=f;current=p;}}
    const k=key(current);open.delete(k);closed.add(k);if(k===key(b)){found=true;break;}
    for(const dx of [-step,0,step])for(const dz of [-step,0,step]) {
      if(!dx&&!dz)continue;const next:Point=[current[0]+dx,current[1]+dz],nk=key(next);
      if(closed.has(nk)||!clearSegment(current,next))continue;
      const g=cost.get(k)!+Math.hypot(dx,dz);
      if(g<(cost.get(nk)??Infinity)){cost.set(nk,g);came.set(nk,current);open.set(nk,next);}
    }
  }
  if(!found)return null;
  const path:Point[]=[end,b]; let cursor=b;
  while(key(cursor)!==key(a)){cursor=came.get(key(cursor))!;if(!cursor)return null;path.push(cursor);}
  path.push(start);path.reverse();
  const simple:Point[]=[start]; let i=0;
  while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clearSegment(path[i],path[j]))j--;simple.push(path[j]);i=j;}
  return simple;
}

export const STORAGE_KEY='mtw-world-v1';
export type WorldMemory={ship:Point;look:Point;zoom:number;port:Port|null;entered:boolean;ashore?:WalkPlace|null};
export function parseMemory(value: string|null): WorldMemory|null {
  try {const v=JSON.parse(value||'null');
    if(!v||!Array.isArray(v.ship)||v.ship.length!==2||!isWater(v.ship)||!Array.isArray(v.look)||v.look.length!==2||!v.look.every((n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<60)||!Number.isFinite(v.zoom)||v.zoom<.65||v.zoom>4.2||!(v.port===null||isPort(v.port)))return null;
    const atDock=Math.hypot(v.ship[0]-PORTS.nowbrary.point[0],v.ship[1]-PORTS.nowbrary.point[1])<.2;
    return {...v,entered:!!v.entered,ashore:atDock&&isWalkPlace(v.ashore)?v.ashore:null};
  } catch{return null;}
}
export function safeReadHref(value:unknown) {
  return typeof value==='string'&&value.startsWith('/mapthewild/')&&!value.startsWith('//')&&!value.startsWith('/mapthewild/explore')&&!/[\\\r\n]/.test(value)?value:'/mapthewild/';
}
