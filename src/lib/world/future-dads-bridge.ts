export type VisitFrame={x:number;y:number;size:number;yaw?:number};
export function visitMessage(event:Pick<MessageEvent,'origin'|'source'|'data'>,frame:Window|null,origin:string){
 if(!frame||event.source!==frame||event.origin!==origin||!event.data||typeof event.data!=='object')return null;
 const data=event.data;
 if(['fd:ready','fd:left','fd:error'].includes(data.type))return data;
 if(data.type==='fd:entered'&&data.frame&&['x','y','size'].every(key=>Number.isFinite(data.frame[key]))&&data.frame.size>0)return data;
 if(data.type==='mtw:page-scroll'&&Number.isFinite(data.deltaY))return {type:data.type,deltaY:Math.max(-2000,Math.min(2000,data.deltaY))};
 return null;
}
export function visitTransform(start:VisitFrame,end:VisitFrame){
 const scale=Math.max(.01,Math.min(1,start.size/end.size));
 return {x:start.x-end.x*scale,y:start.y-end.y*scale,scale};
}
