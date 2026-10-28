import {isInside,type FootNode,type WalkPlace} from './ashore';
export type LandingState={at:FootNode;place:WalkPlace;destination:FootNode|null;progress:number;walking:boolean;returning?:boolean};
const mix=(a:number,b:number,t:number)=>a+(b-a)*Math.max(0,Math.min(1,t));
export function landingPosition(s:LandingState){
 if(s.walking&&s.at==='garden'&&s.destination==='boat')return s.progress<.35?12:mix(12,3.3,(s.progress-.35)/.65);
 if(s.walking&&s.at==='boat')return mix(3.3,12,s.progress);
 if(s.walking&&s.destination==='boat')return mix(12,3.3,s.progress);
 if(s.walking&&isInside(s.destination)&&!isInside(s.place))return mix(12,19,s.progress);
 if(s.walking&&!isInside(s.destination)&&isInside(s.place))return mix(19,12,s.progress);
 return isInside(s.place)?19:12;
}
const terrace=[[839,541],[864,427],[980,401],[1020,395]];
function trace(points:number[][],progress:number){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
 let distance=Math.max(0,Math.min(1,progress))*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const t=distance/lengths[i];return{x:mix(points[i][0],points[i+1][0],t),y:mix(points[i][1],points[i+1][1],t)};}distance-=lengths[i];}
 return{x:points[0][0],y:points[0][1]};
}
export function landingTerracePoint(s:LandingState):{x:number;y:number}|null{
 if(!s.walking&&s.place==='garden')return{x:1020,y:395};
 if(s.destination==='garden')return trace(isInside(s.place)?[[807,361],[833,402],[980,401],[1020,395]]:terrace,s.progress);
 if(s.at==='garden'){
  if(s.destination==='boat')return s.progress<.35?trace([...terrace].reverse(),s.progress/.35):null;
  return trace(isInside(s.destination)?[[1020,395],[980,401],[833,402],[807,361]]:[...terrace].reverse(),s.progress);
 }
 return null;
}
const path=[
 [7.3,929,695],[8,887,675],[8.7,834,653],[9.2,800,635],
 [9.7,806,613],[10.2,815,588],[10.7,826,565],[11.2,839,541],[12,839,541],
 [14,852,483],[16,864,427],[17,833,402],[18,823,377],[19,807,361]
];
export function landingPathPoint(t:number){
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];if(t<=b[0]){const u=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0])));return{x:mix(a[1],b[1],u),y:mix(a[2],b[2],u)};}}
 return{x:path.at(-1)![1],y:path.at(-1)![2]};
}
