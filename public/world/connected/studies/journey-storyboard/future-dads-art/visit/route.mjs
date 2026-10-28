export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const STOPS={sea:0,moored:28,ashore:42,radio:85,listen:100};
export const LANDING={x:637,y:632};
// One fixed illustrated shoreline: the route stays in water, then on the jetty
// and sandy path. Positions are in the original 1536 × 1024 painting.
const path=[[42,LANDING.x,LANDING.y],[48,668,631],[54,704,612],[60,761,608],[68,801,564],[76,850,551],[85,886,538]];
export function walkPoint(t){
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];if(t<=b[0]){const u=clamp((t-a[0])/(b[0]-a[0]));return{x:mix(a[1],b[1],u),y:mix(a[2],b[2],u)};}}
 return{x:path.at(-1)[1],y:path.at(-1)[2]};
}
export function boatPoint(t){
 const u=smooth(t/28),v=1-u;
 return{x:v*v*v*400+3*v*v*u*510+3*v*u*u*628+u*u*u*628,y:v*v*v*860+3*v*v*u*855+3*v*u*u*845+u*u*u*796,heading:mix(-10,-90,smooth(u))};
}
export function soundDistance(t){return clamp((t-18)/(85-18));}
export function stage(t){return t<27.99?'sea':t<41.99?'landing':t<84.99?'path':t<99.99?'radio':'listening';}
