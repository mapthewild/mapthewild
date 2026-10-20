import * as T from 'three';
import {footfall,kneeBetween,STRIDE} from './walk-cycle';

/** Articulated scene geometry: no character images or whole-body rocking. */
export function createTraveller(){
  const root=new T.Group(),ground=new T.Group(),figure=new T.Group();root.add(ground);ground.add(figure);ground.rotation.x=.32;
  const mat=(color:number)=>new T.MeshStandardMaterial({color,roughness:1});
  const skin=mat(0x754b35),linen=mat(0xd2c8a8),trousers=mat(0x404b45),leather=mat(0x493d30),hair=mat(0x282723),bagMaterial=mat(0x556f61);
  const ball=(p:T.Object3D,m:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const o=new T.Mesh(new T.SphereGeometry(1,20,14),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o;};
  const segment=(p:T.Object3D,r1:number,r2:number,m:T.Material)=>{const o=new T.Mesh(new T.CylinderGeometry(r1,r2,1,16),m);p.add(o);return o;};
  const yAxis=new T.Vector3(0,1,0);
  function bone(mesh:T.Mesh,a:T.Vector3,b:T.Vector3){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(yAxis,b.clone().sub(a).normalize());}
  const body=new T.Group();figure.add(body);
  const torso=new T.Mesh(new T.LatheGeometry([new T.Vector2(.17,0),new T.Vector2(.185,.05),new T.Vector2(.155,.23),new T.Vector2(.20,.39),new T.Vector2(.14,.46),new T.Vector2(.065,.49)],24),linen);torso.scale.z=.68;body.add(torso);
  ball(body,skin,0,.50,0,.06,.08,.058);
  const head=new T.Group();head.position.set(0,.64,.015);body.add(head);
  ball(head,skin,0,0,0,.112,.15,.115);ball(head,hair,0,.066,-.018,.116,.105,.112);
  ball(head,skin,0,-.006,.112,.033,.04,.045);
  for(const side of [-1,1]){ball(head,skin,side*.108,-.015,0,.024,.04,.028);ball(head,leather,side*.044,.018,.105,.008,.008,.006);}
  // An open collar and satchel, rather than a painted costume stuck to a plane.
  for(const side of [-1,1]){const collar=ball(body,linen,side*.047,.47,.063,.045,.065,.017);collar.rotation.z=side*.4;}
  const bag=ball(body,bagMaterial,-.20,.09,-.015,.095,.12,.057);
  const strap=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.20,.10,.06),new T.Vector3(.12,.43,.13),new T.Vector3(.14,.47,0),new T.Vector3(-.2,.12,-.08)]),24,.012,5,false),leather);body.add(strap);
  const legs=[-1,1].map(side=>({side,upper:segment(figure,.09,.072,trousers),lower:segment(figure,.072,.048,trousers),knee:ball(figure,trousers,0,0,0,.073,.077,.072),shoe:ball(figure,leather,0,0,0,.065,.058,.13)}));
  const arms=[-1,1].map(side=>({side,sleeve:segment(body,.083,.07,linen),forearm:segment(body,.047,.036,skin),elbow:ball(body,skin,0,0,0,.047,.05,.046),hand:ball(body,skin,0,0,0,.038,.058,.035)}));
  const shadow=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:0x29362f,transparent:true,opacity:.17,depthWrite:false}));shadow.scale.set(.28,.075,1);shadow.position.set(0,0,-.2);root.add(shadow);
  let distance=0,heading=.9,previous:T.Vector2|null=null,activity=0;
  function update(point:[number,number],scale:number,walking:boolean,dt:number,motion:boolean,visible:boolean){
    const p=new T.Vector2(...point),delta=previous?p.clone().sub(previous):new T.Vector2();previous=p;
    const travelled=Math.hypot(delta.x,delta.y/Math.sin(.32))/scale;
    if(walking&&motion&&travelled<1){distance+=travelled;if(delta.length()>.01){const desired=Math.atan2(delta.x,-delta.y/Math.sin(.32));heading+=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading))*(1-Math.exp(-dt*14));}}
    activity=motion?T.MathUtils.lerp(activity,walking?1:0,1-Math.exp(-dt*12)):0;
    root.visible=visible;root.position.set(point[0],point[1],100);root.scale.setScalar(scale);figure.rotation.y=heading;
    const phase=distance/STRIDE*Math.PI*2,hipY=.865-Math.cos(phase*2)*.014*activity;
    body.position.set(Math.sin(phase)*.018*activity,hipY,0);body.rotation.z=Math.sin(phase)*.025*activity;head.rotation.y=-Math.sin(phase)*.025*activity;bag.rotation.z=Math.sin(phase+.6)*.045*activity;
    legs.forEach((leg,i)=>{
      const f=footfall(distance,i as 0|1),x=leg.side*.105;
      const ankle=new T.Vector3(x,.065+f.lift*activity,f.forward*activity),hip=new T.Vector3(x,hipY,0);
      const k=kneeBetween([hip.y,hip.z],[ankle.y,ankle.z]),knee=new T.Vector3(x,k[0],k[1]);
      bone(leg.upper,hip,knee);bone(leg.lower,knee,ankle);leg.knee.position.copy(knee);leg.shoe.position.copy(ankle);leg.shoe.position.z+=.043;leg.shoe.rotation.x=f.pitch*activity;
    });
    arms.forEach(arm=>{
      const swing=Math.cos(phase+(arm.side===1?Math.PI:0))*.13*activity;
      const shoulder=new T.Vector3(arm.side*.17,.40,0),elbow=new T.Vector3(arm.side*.235,.18,swing),hand=new T.Vector3(arm.side*.23,-.035,swing+.055);
      bone(arm.sleeve,shoulder,elbow);bone(arm.forearm,elbow,hand);arm.elbow.position.copy(elbow);arm.hand.position.copy(hand);
    });
  }
  return{root,update};
}
