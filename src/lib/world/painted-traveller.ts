import * as T from 'three';
import {paintedSprite,type PaintedFrame} from './painted-sprite';

/** Preserve the chosen illustrated character while revising its drawn poses. */
export function createPaintedTraveller(onReady:()=>void){
  const root=new T.Group();let previous:T.Vector2|null=null,direction=1,distance=0;
  const anchors:[[number,number],...Array<[number,number]>]=[[240.5,433],[668.5,430],[1100.5,427],[1540,434],[241,870],[679,866],[1110,865],[1547,870]];
  const frames:PaintedFrame[]=anchors.map((anchor,i)=>({rect:[Math.round(i%4*443.5),Math.round(Math.floor(i/4)*443.5),443,443],anchor}));
  const sprite=paintedSprite('traveller-walk-v2.png',[1774,887],frames,145/420,onReady);root.add(sprite.root);
  const shadow=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshBasicMaterial({color:0x283c35,transparent:true,opacity:.18,depthWrite:false}));shadow.scale.set(22,6,1);shadow.position.z=-1;root.add(shadow);
  return{root,get ready(){return sprite.ready;},dispose:sprite.dispose,update(point:[number,number],scale:number,walking:boolean,_dt:number,motion:boolean,visible:boolean){
    const p=new T.Vector2(...point),delta=previous?p.clone().sub(previous):new T.Vector2();previous=p;
    if(walking&&Math.abs(delta.x)>.1)direction=delta.x<0?-1:1;
    const travelled=Math.hypot(delta.x,delta.y*.65)/(scale/80);
    if(walking&&motion&&travelled<60)distance+=travelled;
    // Drawn contact, down, passing and up poses for each leg. Pace follows travel.
    const phase=Math.floor(distance/10)%8;sprite.pose(walking&&motion?phase:((phase<4)?1:5));
    const size=scale/80;root.visible=visible;root.position.set(point[0],point[1],100);root.scale.setScalar(size);
    sprite.root.scale.x=direction;
  }};
}
