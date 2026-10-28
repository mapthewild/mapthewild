export type PortalRect={x:number;y:number;w:number;h:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
/** The same aperture expands and contracts; crossing it never changes the source room. */
export function portalFrame(origin:PortalRect,width:number,height:number,progress:number){
  const t=ease(progress/.72),mix=(a:number,b:number)=>a+(b-a)*t;
  return{rect:{x:mix(origin.x,0),y:mix(origin.y,0),w:mix(origin.w,width),h:mix(origin.h,height)},camera:ease((progress-.12)/.88)};
}
export function advancePortal(progress:number,entering:boolean,dt:number,motion:boolean){
  return motion?clamp(progress+(entering?1:-1)*Math.max(0,dt)/1.8):entering?1:0;
}
