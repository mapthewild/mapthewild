import * as T from 'three';
import {illustratedGait} from './illustrated-gait';
type P=[number,number];
type Bone={a:P;b:P;c:P;d:P};
const length=(a:P,b:P)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
function transform(p:P,b:Bone):P{
  const angle=Math.atan2(b.d[1]-b.c[1],b.d[0]-b.c[0])-Math.atan2(b.b[1]-b.a[1],b.b[0]-b.a[0]),x=p[0]-b.a[0],y=p[1]-b.a[1];
  return[b.c[0]+x*Math.cos(angle)-y*Math.sin(angle),b.c[1]+x*Math.sin(angle)+y*Math.cos(angle)];
}
function knee(hip:P,ankle:P,l1:number,l2:number):P{
  const dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],d=Math.max(.001,Math.hypot(dx,dy)),a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
  return[hip[0]+dx*a/d+dy*h/d,hip[1]+dy*a/d-dx*h/d];
}

/** The approved drawing is a continuous textured mesh, weighted to 2D joints. */
export function createPaintedRig(onReady:()=>void){
  const root=new T.Group();let ready=false,previous:T.Vector2|null=null,distance=0,heading=1,speed=0,bodyDrop=0;
  const unit=145/1145,gait=illustratedGait();
  const map=new T.TextureLoader().load('/mapthewild/world/nowbrary/art/traveller-idle-v2.png',()=>{ready=true;onReady();});map.colorSpace=T.SRGBColorSpace;
  const geometry=new T.PlaneGeometry(1,1,40,80),uv=geometry.attributes.uv,vertices=geometry.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(420+uv.getX(i)*440)/1254,1-(35+(1-uv.getY(i))*1175)/1254);
  const rest:Array<P>=Array.from({length:uv.count},(_,i)=>[uv.getX(i)*1254,(1-uv.getY(i))*1254]);
  const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({map,transparent:true,alphaTest:.1,depthWrite:true,toneMapped:false,side:T.DoubleSide}));root.add(mesh);
  const shadow=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshBasicMaterial({color:0x283c35,transparent:true,opacity:.17,depthWrite:false}));shadow.scale.set(20,5,1);shadow.position.z=-2;root.add(shadow);
  const restLegs=[{hip:[570,620] as P,knee:[558,866] as P,ankle:[570,1130] as P},{hip:[695,620] as P,knee:[700,865] as P,ankle:[711,1145] as P}];
  function update(point:[number,number],scale:number,walking:boolean,dt:number,motion:boolean,visible:boolean){
    const p=new T.Vector2(...point),delta=previous?p.clone().sub(previous):new T.Vector2();previous=p;
    if(walking&&Math.abs(delta.x)>.1)heading=delta.x<0?-1:1;
    const travel=Math.hypot(delta.x,delta.y*.65)/(scale/80)/unit;
    if(walking&&motion&&travel<450)distance+=travel;
    const instant=dt>0&&walking?travel/dt:0;speed=T.MathUtils.lerp(speed,instant,1-Math.exp(-dt*15));
    if(!motion)gait.reset(distance);
    const pose=gait.update(distance,speed,dt,walking&&motion);
    const drop=pose.active?36:0;bodyDrop=motion?T.MathUtils.lerp(bodyDrop,drop,1-Math.exp(-dt*15)):0;
    const sway=pose.active?(pose.feet[0].forward-pose.feet[1].forward)*.012:0;
    const body:Bone={a:[635,560],b:[635,260],c:[635,560+bodyDrop],d:[635+sway,260+bodyDrop]};
    const legs=restLegs.map((leg,i)=>{
      const hip=transform(leg.hip,body),ankle:P=[leg.ankle[0]+pose.feet[i].forward,leg.ankle[1]-pose.feet[i].lift];
      // Reach guard only covers abrupt direction/speed changes, never whole-body scaling.
      const max=length(leg.hip,leg.knee)+length(leg.knee,leg.ankle)-1,d=length(hip,ankle);
      if(d>max){ankle[0]=hip[0]+(ankle[0]-hip[0])*max/d;ankle[1]=hip[1]+(ankle[1]-hip[1])*max/d;}
      const joint=knee(hip,ankle,length(leg.hip,leg.knee),length(leg.knee,leg.ankle));
      const upper:Bone={a:leg.hip,b:leg.knee,c:hip,d:joint},lower:Bone={a:leg.knee,b:leg.ankle,c:joint,d:ankle},shoe:Bone={a:leg.ankle,b:[leg.ankle[0]+80,leg.ankle[1]],c:ankle,d:[ankle[0]+80,ankle[1]]};
      return{upper,lower,shoe};
    });
    const arm=(shoulder:P,elbow:P,wrist:P,phase:number)=>{
      const a=transform(shoulder,body),swing=pose.active?phase*.0006:0;
      const base=Math.atan2(elbow[1]-shoulder[1],elbow[0]-shoulder[0]),l=length(shoulder,elbow);
      const b:P=[a[0]+Math.cos(base+swing)*l,a[1]+Math.sin(base+swing)*l];
      const lowerAngle=Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])+swing*.7,ll=length(elbow,wrist),c:P=[b[0]+Math.cos(lowerAngle)*ll,b[1]+Math.sin(lowerAngle)*ll];
      return{upper:{a:shoulder,b:elbow,c:a,d:b} as Bone,lower:{a:elbow,b:wrist,c:b,d:c} as Bone};
    };
    const arms=[arm([495,335],[474,480],[480,665],-pose.feet[0].forward),arm([716,335],[752,480],[790,665],-pose.feet[1].forward)];
    const mix=(a:P,b:P,t:number):P=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    rest.forEach((v,i)=>{
      const [x,y]=v;let q=transform(v,body),depth=2;
      if(y>300&&y<735&&(x>746||x>705&&y<480||x<514&&y<490||x<510&&y>650)){
        const arm=arms[x<635?0:1],t=T.MathUtils.smoothstep(y,450,510);q=mix(transform(v,arm.upper),transform(v,arm.lower),t);depth=x<635?4:1;
      }else if(y>600){
        const leg=legs[x<636?0:1];let limb=mix(transform(v,leg.upper),transform(v,leg.lower),T.MathUtils.smoothstep(y,820,915));
        limb=mix(limb,transform(v,leg.shoe),T.MathUtils.smoothstep(y,1050,1130));q=mix(q,limb,T.MathUtils.smoothstep(y,600,680));depth=x<636?2:0;
      }
      vertices.setXYZ(i,(q[0]-640)*unit,(1193-q[1])*unit,depth*.1);
    });vertices.needsUpdate=true;geometry.computeBoundingSphere();
    root.visible=visible;root.position.set(point[0],point[1],100);root.scale.setScalar(scale/80);mesh.scale.x=heading;
  }
  update([0,0],80,false,0,false,true);
  return{root,update,get ready(){return ready;},dispose(){map.dispose();}};
}
