import * as T from 'three';
import type {ReaderId} from './shelf-data';
import {paintedSprite} from './painted-sprite';

/** Painted companions share the traveller and coastal scenery’s drawn style. */
export function makeShelfLife(onTexture:()=>void){
  const updates:((time:number)=>void)[]=[];
  const material=(color:number)=>new T.MeshStandardMaterial({color,roughness:.83});
  function tube(parent:T.Object3D,points:T.Vector3[],r:number,m:T.Material){const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,r,6,false),m);parent.add(mesh);return mesh;}
  function add(id:ReaderId,station:T.Group,top:number){
    if(id==='montaigne'){
      const cat=paintedSprite('cat-groom-v2.png',[1254,1254],[
        {rect:[149,26,478,595],anchor:[430,613]},
        {rect:[673,68,526,553],anchor:[1001,613]},
        {rect:[145,627,482,602],anchor:[440,1221]},
        {rect:[719,627,485,602],anchor:[1006.5,1221]},
      ],.00108,onTexture);cat.root.position.set(.38,top+.012,.18);station.add(cat.root);
      updates.push(time=>{
        const t=time%11,envelope=t>6&&t<9?Math.sin((t-6)/3*Math.PI)**2:0;
        cat.deform((x,y)=>{
          const head=(1-T.MathUtils.smoothstep(y,210,325))*(1-T.MathUtils.smoothstep(x,450,540));
          const angle=(.008*Math.sin(time*.7)+envelope*.085*(.5+.5*Math.sin(time*4.2)))*head,dx=x-350,dy=y-250;
          let px=350+dx*Math.cos(angle)-dy*Math.sin(angle),py=250+dx*Math.sin(angle)+dy*Math.cos(angle);
          const paw=T.MathUtils.smoothstep(x,150,185)*(1-T.MathUtils.smoothstep(x,290,350))*T.MathUtils.smoothstep(y,240,280)*(1-T.MathUtils.smoothstep(y,360,420));
          const a=-envelope*.08*paw,rx=px-300,ry=py-385;
          px=300+rx*Math.cos(a)-ry*Math.sin(a);py=385+rx*Math.sin(a)+ry*Math.cos(a);return[px,py];
        });
      });
      const shade=new T.Mesh(new T.CircleGeometry(.22,32),new T.MeshBasicMaterial({color:0x3b2a21,transparent:true,opacity:.15,depthWrite:false}));shade.rotation.x=-Math.PI/2;shade.scale.y=.45;shade.position.set(.42,top+.008,.12);station.add(shade);
    }
    if(id==='melville'){
      const bowl=new T.Group();bowl.position.set(.02,top+.025,-.03);bowl.scale.setScalar(.78);station.add(bowl);
      const bronze=material(0x887555);
      const coaster=new T.Mesh(new T.CylinderGeometry(.30,.31,.028,48),bronze);coaster.position.y=.014;bowl.add(coaster);
      const profile=[new T.Vector2(.25,.04),new T.Vector2(.37,.09),new T.Vector2(.51,.26),new T.Vector2(.57,.50),new T.Vector2(.55,.71),new T.Vector2(.45,.93),new T.Vector2(.34,1.05),new T.Vector2(.34,1.10)];
      const glass=new T.MeshPhysicalMaterial({color:0xe3e7dc,transparent:true,opacity:.075,roughness:.12,metalness:0,clearcoat:.8,depthWrite:false,side:T.FrontSide});
      const shell=new T.Mesh(new T.LatheGeometry(profile,64),glass);shell.renderOrder=5;bowl.add(shell);
      const rimMaterial=new T.MeshStandardMaterial({color:0xc2cabd,transparent:true,opacity:.38,roughness:.25,depthWrite:false});
      for(const [radius,y] of [[.34,1.10],[.28,.04]]){const ring=new T.Mesh(new T.TorusGeometry(radius,.008,8,64),rimMaterial);ring.rotation.x=Math.PI/2;ring.position.y=y;ring.renderOrder=6;bowl.add(ring);}
      const water=new T.Mesh(new T.LatheGeometry([new T.Vector2(0,.07),new T.Vector2(.29,.07),new T.Vector2(.40,.14),new T.Vector2(.51,.28),new T.Vector2(.56,.51),new T.Vector2(.56,.57),new T.Vector2(0,.57)],64),new T.MeshStandardMaterial({color:0x7caaa1,transparent:true,opacity:.12,roughness:.35,depthWrite:false}));water.renderOrder=2;bowl.add(water);
      const surface=new T.Mesh(new T.CircleGeometry(.556,64),new T.MeshStandardMaterial({color:0xa3beb0,transparent:true,opacity:.16,roughness:.45,side:T.DoubleSide,depthWrite:false}));surface.rotation.x=-Math.PI/2;surface.position.y=.57;surface.renderOrder=4;bowl.add(surface);
      const whale=paintedSprite('whale-swim-v2.png',[1774,887],[
        {rect:[40,52,865,391],anchor:[285,330]},
        {rect:[905,107,868,314],anchor:[1143,330]},
        {rect:[40,548,865,280],anchor:[285,683]},
        {rect:[905,548,868,274],anchor:[1140,683]},
      ],.00095,onTexture);whale.root.position.set(-.15,.28,.14);bowl.add(whale.root);
      whale.pose(1);
      const ship=paintedSprite('miniature-ship-v2.png',[1254,1254],[{rect:[85,43,1135,1173],anchor:[650,1110]}],.00038,onTexture);ship.root.position.set(-.08,.575,.035);bowl.add(ship.root);
      const glint=new T.MeshBasicMaterial({color:0xf4f0dc,transparent:true,opacity:.24,depthWrite:false});
      tube(bowl,[new T.Vector3(-.36,.89,.32),new T.Vector3(-.46,.76,.32),new T.Vector3(-.49,.66,.29)],.005,glint).renderOrder=6;
      tube(bowl,[new T.Vector3(.49,.29,.22),new T.Vector3(.52,.40,.23)],.003,glint).renderOrder=6;
      const bubbles:T.Mesh[]=[];
      for(let i=0;i<3;i++){const bubble=new T.Mesh(new T.SphereGeometry(.008+i*.002,8,6),rimMaterial);bubble.position.set(.22+i*.035,.18+i*.07,.12);bubble.renderOrder=6;bowl.add(bubble);bubbles.push(bubble);}
      updates.push(time=>{
        whale.deform((x,y)=>{
          const weight=T.MathUtils.smoothstep(x,1320,1700),a=Math.sin(time*1.15)*.10*weight,dx=x-1350,dy=y-295;
          return[1350+dx*Math.cos(a)-dy*Math.sin(a),295+dx*Math.sin(a)+dy*Math.cos(a)];
        });
        ship.root.position.y=.575+Math.sin(time*.8)*.005;ship.root.rotation.z=Math.sin(time*.68)*.01;
        bubbles.forEach((bubble,i)=>bubble.position.y=.16+((time*.017+i*.085)%.35));
      });
    }
  }
  return{add,update:(time:number)=>updates.forEach(update=>update(time))};
}
