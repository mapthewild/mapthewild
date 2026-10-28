import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {COASTS, type Point} from './navigation';
import {coastalCraft} from './coastal-craft';

const palette={lime:0xf3e3b9,stone:0xb9aa89,roof:0xe2cfa7,wood:0x634633,dark:0x243e3b,teal:0x266b68,leaf:0x36694d,lightLeaf:0x82914e,pink:0xc95e63,blue:0x81b6cb};
export function createModels(onTexture:()=>void=()=>{}) {
  const craft=coastalCraft();
  const limewash=new T.TextureLoader().load('/mapthewild/world/nowbrary/art/coral-limewash-v1.png',onTexture);
  limewash.colorSpace=T.SRGBColorSpace;limewash.wrapS=limewash.wrapT=T.RepeatWrapping;limewash.repeat.set(2,1);limewash.anisotropy=4;
  const coastalPlaster=new T.MeshStandardMaterial({map:limewash,roughness:1,color:0xf2f1ea});
  const readingRoomRoof=new T.Group();readingRoomRoof.userData.unmerged=true;
  const materials=new Map<number,T.MeshToonMaterial>();
  const gradient=new T.DataTexture(new Uint8Array([105,183,255]),3,1,T.RedFormat);
  gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.needsUpdate=true;
  const storm={value:new T.Vector2(-18,-11)};
  function mat(color:number) {
    if(!materials.has(color)){
      const m=new T.MeshToonMaterial({color,gradientMap:gradient,side:T.DoubleSide});
      m.onBeforeCompile=shader=>{
        shader.uniforms.uStorm=storm;
        shader.vertexShader='varying vec3 vWorldPlace;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWorldPlace=(modelMatrix*vec4(position,1.)).xyz;');
        shader.fragmentShader='uniform vec2 uStorm; varying vec3 vWorldPlace;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>','float grain=sin(dot(floor(vWorldPlace*44.),vec3(12.9898,78.233,39.425)));gl_FragColor.rgb*=.98+grain*.035;float shade=1.-smoothstep(5.,13.,distance(vWorldPlace.xz,uStorm)); gl_FragColor.rgb*=mix(vec3(1.),vec3(.59,.68,.76),shade*.45);\n#include <tonemapping_fragment>');
      };
      materials.set(color,m);
    }return materials.get(color)!;
  }
  function mesh(parent:T.Object3D,g:T.BufferGeometry,color:number,x=0,y=0,z=0) {
    const m=new T.Mesh(g,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,c=palette.lime){return mesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);}
  function ball(p:T.Object3D,x:number,y:number,z:number,r:number,c:number,sx=1,sy=1,sz=1){const m=mesh(p,new T.IcosahedronGeometry(r,1),c,x,y,z);m.scale.set(sx,sy,sz);return m;}
  function rod(p:T.Object3D,a:T.Vector3,b:T.Vector3,r:number,c:number){const d=b.clone().sub(a);const m=mesh(p,new T.CylinderGeometry(r,r*.95,d.length(),6),c);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
  function curve(p:T.Object3D,points:T.Vector3[],r:number,c:number){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points),7,r,5,false),c);}
  function planeShape(points:Point[],depth:number,smooth=false){const s=new T.Shape();
    if(smooth){const last=points.at(-1)!,first=points[0];s.moveTo((last[0]+first[0])/2,-(last[1]+first[1])/2);points.forEach((p,i)=>{const next=points[(i+1)%points.length];s.quadraticCurveTo(p[0],-p[1],(p[0]+next[0])/2,-(p[1]+next[1])/2);});}
    else points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:8});geo.rotateX(-Math.PI/2);return geo;}

  function pot(p:T.Object3D,x:number,y:number,z:number,s=.6){mesh(p,new T.CylinderGeometry(s*.66,s*.44,s,9),0xc08455,x,y+s/2,z);mesh(p,new T.CylinderGeometry(s*.57,s*.57,.03,9),0x394936,x,y+s,z);for(let i=0;i<6;i++){const a=i*1.05;const m=ball(p,x+Math.cos(a)*s*.26,y+s*1.45,z+Math.sin(a)*s*.26,s*.32,palette.leaf,.42,1.7,.65);m.rotation.z=Math.cos(a)*.4;}}
  function fern(p:T.Object3D,x:number,y:number,z:number,s=.6){
    mesh(p,new T.CylinderGeometry(s*.48,s*.31,s*.72,14),0xb7784d,x,y+s*.36,z);
    mesh(p,new T.CylinderGeometry(s*.49,s*.49,.07,14),0xd3a476,x,y+s*.71,z);
    for(let i=0;i<9;i++){
      const a=i*2.4,length=s*(1.4+(i%3)*.24),base=new T.Vector3(x,y+s*.72,z);
      const at=(t:number)=>base.clone().add(new T.Vector3(Math.cos(a)*length*t,Math.sin(t*Math.PI*.85)*s*.9,Math.sin(a)*length*t));
      curve(p,[at(0),at(.5),at(1)],.012,0x6b8050);
      for(let j=1;j<9;j++)for(const side of [-1,1]){const t=j/10,v=at(t),leaf=ball(p,v.x+Math.cos(a+Math.PI/2)*s*.13*side,v.y,v.z+Math.sin(a+Math.PI/2)*s*.13*side,s*.13,i%2?0x58754a:0x8b9e65,1.5,.14,.5);leaf.rotation.y=-a-side*.5;}
    }
  }
  function person(p:T.Object3D,x:number,y:number,z:number,c=0xc5754e){mesh(p,new T.CylinderGeometry(.12,.18,.62,6),c,x,y+.5,z);ball(p,x,y+.99,z,.17,0x79513a);rod(p,new T.Vector3(x-.08,y+.3,z),new T.Vector3(x-.12,y,z+.03),.065,palette.dark);rod(p,new T.Vector3(x+.08,y+.3,z),new T.Vector3(x+.12,y,z-.03),.065,palette.dark);}
  function visitor(){
    const root=new T.Group(),legs:T.Group[]=[],arms:T.Group[]=[];
    for(const side of [-1,1]){
      const leg=new T.Group();leg.position.set(side*.12,.48,0);root.add(leg);
      box(leg,0,-.21,0,.14,.42,.17,palette.dark);box(leg,0,-.44,.045,.17,.1,.25,palette.wood);legs.push(leg);
      const arm=new T.Group();arm.position.set(side*.25,.91,0);root.add(arm);
      box(arm,0,-.16,0,.12,.35,.15,0xe7c576);ball(arm,0,-.35,0,.08,0x885a3d);arms.push(arm);
    }
    mesh(root,new T.CylinderGeometry(.22,.26,.56,8),0xe7c576,0,.75,0);
    ball(root,0,1.2,0,.21,0x885a3d,1,1.1,1);ball(root,0,1.32,-.025,.21,0x392e27,1,.65,1);
    box(root,-.26,.65,-.08,.18,.3,.28,palette.teal);
    rod(root,new T.Vector3(.15,1.02,.17),new T.Vector3(-.23,.61,.17),.025,palette.wood);
    const halo=new T.Mesh(new T.RingGeometry(.35,.39,32),new T.MeshBasicMaterial({color:0xf7db94,side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.02;root.add(halo);
    return {root,legs,arms,halo};
  }
  function tree(p:T.Object3D,x:number,z:number,s=1){const y=1;for(let i=0;i<3;i++){const a=i*2.1;rod(p,new T.Vector3(x,y+1.6*s,z),new T.Vector3(x+Math.cos(a)*s,y+3*s,z+Math.sin(a)*s),.09*s,0x6b6045);}rod(p,new T.Vector3(x,y,z),new T.Vector3(x+.2*s,y+3*s,z),.18*s,0x6b6045);for(let i=0;i<6;i++){const a=i*2.4;ball(p,x+Math.cos(a)*s,y+(3.2+(i%2)*.5)*s,z+Math.sin(a)*s,1.35*s,i%2?0x65824d:0x3d6b4c,1,.7,1);}}
  function palm(p:T.Object3D,x:number,z:number,s=1,fan=false){
    const base=new T.Vector3(x,1,z),top=new T.Vector3(x+.6*s,1+5.4*s,z+.2*s);
    curve(p,[base,base.clone().add(new T.Vector3(.15*s,2*s,0)),top],.16*s,0x8a7550);
    for(let k=0;k<7;k++){const y=1+k*.7*s;const ring=mesh(p,new T.CylinderGeometry(.175*s,.175*s,.07*s,7),0x584d39,x+k*.07*s,y,z);ring.rotation.z=-.1;}
    for(let k=0;k<(fan?8:9);k++){
      const a=k*Math.PI*2/(fan?8:9),length=(fan?2.1:3.0)*s;
      if(fan){const v:number[]=[];for(let j=0;j<8;j++){const a1=a-.52+j*.13,a2=a1+.13;v.push(top.x,top.y,top.z,top.x+Math.cos(a1)*length,top.y+.45*s,top.z+Math.sin(a1)*length,top.x+Math.cos(a2)*length,top.y+.45*s,top.z+Math.sin(a2)*length);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();mesh(p,g,k%2?0x6b874b:0x466d42);}
      else{const vertices:number[]=[];
        const at=(t:number)=>new T.Vector3(top.x+Math.cos(a)*t*length,top.y+Math.sin(t*Math.PI)*.8*s-t*t*.7*s,top.z+Math.sin(a)*t*length);
        for(let j=1;j<10;j++){const t=j/10,mid=at(t),next=at(Math.min(t+.14,1));const w=Math.sin(t*Math.PI)*.46*s;for(const side of [-1,1])vertices.push(mid.x,mid.y,mid.z,mid.x+Math.cos(a+Math.PI/2)*w*side,mid.y-.11*s,mid.z+Math.sin(a+Math.PI/2)*w*side,next.x,next.y,next.z);}
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();mesh(p,g,k%3?0x4f7b48:0x91a259);
        curve(p,[at(0),at(.5),at(1)],.025*s,0x719052);
      }
    }
  }
  function mangrove(p:T.Object3D,x:number,z:number,s=1){for(let i=0;i<5;i++){const a=i*1.256;curve(p,[new T.Vector3(x+Math.cos(a)*1.2*s,-.15,z+Math.sin(a)*s),new T.Vector3(x+Math.cos(a)*.7*s,1.1*s,z+Math.sin(a)*.6*s),new T.Vector3(x,2*s,z)],.08*s,0x625744);}for(let i=0;i<4;i++)ball(p,x+Math.cos(i*2.1)*.55*s,2.4*s+(i%2)*.3,z+Math.sin(i*2.1)*.55*s,1.25*s,i%2?0x4f7754:0x315e4a,1,.55,1);}
  function flowers(p:T.Object3D,x:number,y:number,z:number,length=2){for(let i=0;i<11;i++){const a=i*2.4;ball(p,x+Math.sin(a)*.28,y+i*length/11,z+Math.cos(a)*.16,.35,0x4a6e42);if(i%2===0)ball(p,x+Math.sin(a)*.4,y+i*length/11,z+.15,.23,palette.pink,1,.6,1);}}
  function bench(p:T.Object3D,x:number,y:number,z:number,w=2){box(p,x,y+.3,z,w,.6,.65);box(p,x,y+.65,z-.24,w,.4,.14);}
  function table(p:T.Object3D,x:number,y:number,z:number,w=1.7){box(p,x,y+.65,z,w,.14,1,palette.wood);for(const dx of [-w*.38,w*.38])for(const dz of [-.32,.32])box(p,x+dx,y+.3,z+dz,.1,.6,.1,palette.wood);for(const dx of [-w*.5,w*.5]){box(p,x+dx,y+.36,z+.9,.65,.12,.6,palette.teal);box(p,x+dx,y+.65,z+1.15,.65,.65,.1,palette.teal);}box(p,x-.15,y+.75,z,.5,.03,.38,0xf9efd4);}
  function books(p:T.Object3D,x:number,y:number,z:number,w:number){box(p,x,y+1,z,w,2.1,.35,palette.wood);for(let row=0;row<3;row++){box(p,x,y+.16+row*.62,z+.23,w,.09,.5,0xb18a54);for(let i=0;i<Math.floor(w/.17);i++){const colors=[0xb66e4c,0xb1b986,0x367274,0xe0c586,0x886e83];box(p,x-w/2+.13+i*.17,y+.43+row*.62,z+.3,.12,.38+(i%3)*.055,.28,colors[(i+row)%colors.length]);}}}
  function sign(p:T.Object3D,label:string,x:number,y:number,z:number,w=4){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const c=canvas.getContext('2d')!;c.fillStyle='#e9ddbb';c.fillRect(0,0,768,128);c.fillStyle='#214944';c.font='54px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(label,384,67);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const m=new T.Mesh(new T.PlaneGeometry(w,w/6),new T.MeshBasicMaterial({map:texture}));m.position.set(x,y,z);p.add(m);
  }
  function readingInterior(p:T.Group,w:number,d:number,h:number){
    const room=new T.Group();p.add(room);
    // Close-up surfaces retain UVs; the distant town can still be batched cheaply.
    const surface=(base:string,grain:number)=>{
      const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;
      ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
      for(let i=0;i<7000;i++){const x=(i*73.31)%256,y=(i*41.73)%256;ctx.fillStyle=i%2?`rgba(255,241,211,${grain})`:`rgba(49,39,25,${grain})`;ctx.fillRect(x,y,1+(i%3),1+(i%2));}
      const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(3,2);
      return new T.MeshStandardMaterial({map,roughness:1,color:0xf1f0e9});
    };
    const plaster=coastalPlaster,stone=surface('#bdbbb0',.06);
    function panel(x:number,y:number,z:number,bw:number,bh:number,bd:number,material:T.Material){const o=new T.Mesh(new T.BoxGeometry(bw,bh,bd),material);o.position.set(x,y,z);o.receiveShadow=o.castShadow=true;room.add(o);return o;}
    panel(0,h/2,-d/2+.15,w-.25,h,.035,plaster);
    for(const x of [-w/2+.16,w/2-.16])panel(x,h/2,0,.035,h,d-.3,plaster);
    panel(0,.145,0,w-.3,.025,d-.3,stone);
    // A continuous tiled floor and woven rug carry the courtyard into the room.
    for(let i=0;i<7;i++)for(let j=0;j<4;j++){
      box(room,-2.74+i*.91,.163,-1.43+j*.91,.88,.012,.88,(i+j)%3?0xc3c0af:0xd0cbba);
    }
    box(room,0,.18,.55,4.7,.025,2.05,0x72594e);
    for(const side of [-1,1]){
      box(room,side*2.22,.196,.55,.065,.009,1.93,0xcba777);
      box(room,0,.196,.55+side*.92,4.48,.009,.055,0xcba777);
      for(let i=0;i<16;i++)box(room,-2.15+i*.285,.196,.55+side*1.075,.035,.009,.12,0xd9bf8c);
    }
    for(let i=0;i<8;i++){const diamond=box(room,-1.95+i*.56,.198,.55,.19,.012,.19,0xae885a);diamond.rotation.y=Math.PI/4;}
    // Timber cornice, a pierced upper screen, and planted brackets above the cases.
    box(room,0,2.65,-1.86,w-.4,.1,.22,0x684c35);
    box(room,0,3.27,-1.86,w-.4,.13,.22,0x684c35);
    craft.screen(room,0,2.96,-1.82,w-.45,.5);
    for(const x of [-w/2+.47,w/2-.47]){
      box(room,x,2.72,-1.6,.66,.08,.65,0x6e4d34);
      rod(room,new T.Vector3(x,2.35,-1.84),new T.Vector3(x,2.68,-1.3),.035,0x614b34);
      fern(room,x,2.77,-1.55,.31);
    }
    // A teal shutter and a seat give the room a human scale beyond the bookcases.
    for(const x of [-w/2+.21,w/2-.21]){
      box(room,x,1.58,.1,.06,1.8,1.25,0x275c58);
      for(let j=0;j<9;j++)box(room,x+(x<0?.045:-.045),.83+j*.18,.1,.05,.06,1.17,0x47786a);
    }
    craft.palm(room,-w/2+.57,.18,1.4,.7);craft.palm(room,w/2-.47,.18,.6,.6);
    box(room,2.3,.52,.55,.72,.08,.62,0x765839);
    for(const dx of [-.28,.28])for(const dz of [-.22,.22])box(room,2.3+dx,.34,.55+dz,.06,.36,.06,0x5f4834);
    for(const xx of [-2.1,1.9]){
      box(room,xx,2.8,-1.8,.09,.42,.12,0x5c4531);
      const lamp=new T.Mesh(new T.SphereGeometry(.085,10,8),new T.MeshStandardMaterial({color:0xc7b887,roughness:.8}));lamp.position.set(xx,2.8,-1.61);room.add(lamp);
      mesh(room,new T.ConeGeometry(.19,.12,8),0x5f4a31,xx,2.95,-1.61);
    }
    for(let i=0;i<5;i++)box(room,-w/2+.4+i*1.45,h-.13,0,.16,.22,d,0x634633);
  }
  function house(p:T.Object3D,x:number,z:number,w=4,d=3,h=3,color=palette.lime,library=false){
    const g=new T.Group();g.position.set(x,1,z);p.add(g);box(g,0,.015,.7,w+1.5,.08,d+2.6,0xd8c9a5);
    const wall=(xx:number,yy:number,zz:number,bw:number,bh:number,bd:number)=>{const o:T.Mesh<T.BufferGeometry,T.Material>=box(g,xx,yy,zz,bw,bh,bd,color);if(library)o.material=coastalPlaster;return o;};
    wall(0,h/2,-d/2,w,h,.25);wall(-w/2,h/2,0,.3,h,d);wall(w/2,h/2,0,.3,h,d);
    box(g,0,.03,0,w,.12,d,0xd7c6a0);
    for(const xx of [-w/2,0,w/2])wall(xx,h/2,d/2,.38,h,.3);
    wall(0,h-.32,d/2,w,.65,.35);
    const roof=library?readingRoomRoof:g;if(library)g.add(roof);
    box(roof,0,h+.06,0,w+.35,.2,d+.3,palette.roof);
    for(const xx of [-w/2,w/2])box(roof,xx,h+.4,0,.23,.65,d+.3,color);
    for(const zz of [-d/2,d/2])box(roof,0,h+.4,zz,w,.65,.23,color);
    box(g,-w*.26,1,d/2+.03,w*.32,2,.08,palette.wood);
    for(let i=0;i<5;i++)box(g,-w*.26-w*.12+i*w*.06,1.05,d/2+.1,.035,1.8,.05,0xaf8657);
    box(g,-w*.26,2.05,d/2+.12,w*.36,.13,.13,0xae8752);
    if(library){
      sign(g,'NOWBRARY',0,h-.32,d/2+.2,w*.83);
      // Real bindings are placed here by shelves.ts; the aisle remains walkable.
      readingInterior(g,w,d,h);
      craft.doorway(g);
      craft.palm(g,3.73,.08,2.8,.95);
    }
    else{box(g,w*.26,1.2,d/2+.02,w*.3,1.5,.08,palette.teal);for(let j=0;j<6;j++)box(g,w*.26,.65+j*.19,d/2+.08,w*.3,.045,.05,0x4f8e84);}
    // A timber veranda projects beyond the masonry, with an airy lattice edge.
    box(roof,0,h-.55,d/2+1.05,w+.6,.12,2,0xb79663);
    for(let i=0;i<Math.ceil(w/.4);i++)box(roof,-w/2+i*.4,h-.46,d/2+1,.09,.14,2.1,palette.wood);
    for(const xx of [-w/2,w/2]){box(g,xx,(h-.6)/2,d/2+1.85,.12,h-.6,.12,palette.wood);box(g,xx,1.3,d/2+1.85,.2,.12,.2,0xc5a67a);}
    pot(g,-w/2-.65,0,d/2+.5,.7);flowers(g,w/2+.05,.3,d/2+.25,h+.4);
    bench(g,-w/2+1,0,d/2+.5,1.7);
    return g;
  }
  function dock(p:T.Object3D,x:number,z:number,length=4,w=2.1){
    for(let i=0;i<length/.32;i++)box(p,x,.65,z+i*.32,w,.18,.27,0xa88759);
    for(const dx of [-w/2,w/2])for(const dz of [0,length*.5,length]){mesh(p,new T.CylinderGeometry(.12,.15,2.1,7),palette.wood,x+dx,.15,z+dz);mesh(p,new T.CylinderGeometry(.145,.145,.14,7),0xddc69a,x+dx,.8,z+dz);}
  }
  function lamp(p:T.Object3D,x:number,z:number){box(p,x,1.9,z,.09,1.8,.09,palette.wood);box(p,x,2.9,z,.45,.1,.45,palette.dark);mesh(p,new T.BoxGeometry(.27,.35,.27),0xf3c56b,x,2.7,z);}
  function pavilion(p:T.Object3D,x:number,z:number,w=4){for(const dx of [-w/2,w/2])for(const dz of [-1.5,1.5])box(p,x+dx,2.4,z+dz,.16,2.8,.16,palette.wood);box(p,x,3.9,z,w+.6,.22,3.6,0xc99d65);for(let i=0;i<10;i++)box(p,x-w/2+i*w/9,4.05,z,.09,.1,3.8,palette.wood);table(p,x,1,z,w*.45);}
  function land(parent:T.Object3D,points:Point[]){
    mesh(parent,planeShape(points,1.75,true),palette.stone,0,-.8,0);mesh(parent,planeShape(points,.14,true),0xd8cfad,0,.95,0);
    const centre:Point=[points.reduce((s,p)=>s+p[0],0)/points.length,points.reduce((s,p)=>s+p[1],0)/points.length];
    const inner:Point[]=points.map(([x,z])=>[centre[0]+(x-centre[0])*.86,centre[1]+(z-centre[1])*.84]);
    mesh(parent,planeShape(inner,.035,true),0x9b9f72,0,1.07,0);
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];for(let j=1;j<4;j++){const f=j/4;const x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f;ball(parent,x,-.04,z,.65+(i+j)%3*.25,(i+j)%2?0xb2af96:0xc4baa0,1.2,.5,.8);}}
  }
  let nowbraryLandscape:T.Group|null=null;
  function buildWorld(){
    const root=new T.Group(),quarter=new T.Group();nowbraryLandscape=quarter;
    land(quarter,COASTS[0]);COASTS.slice(1).forEach(poly=>land(root,poly));
    // The reading quarter: a coherent courtyard, a tall book room and a smaller house.
    house(quarter,15,5,6.6,4.1,3.7,palette.lime,true);
    house(quarter,20.5,-1.2,4.5,4,4.5,0xefdcb3);
    house(quarter,20.5,-1.2,3.8,3.3,2.7,0xf2e5c4).position.y=5.6;
    house(quarter,10.7,-2.5,3.3,3.6,3.1,0xe4d6ac);
    house(quarter,25,8,4.4,4,3.5,0xeed9ad);
    house(quarter,29,1.6,3.5,3.6,2.7,0xd9c896);
    // Quay, stairs and a simple paved path into the courtyard.
    box(quarter,15,1.12,9,9,.25,2.5,0xe8d6ad);
    for(let i=0;i<4;i++)box(quarter,9,1.02-i*.14,9.5+i*.45,2.5,.25,.5,0xe8d6ad);
    dock(quarter,9,10.4,3.1);lamp(quarter,8,10.1);lamp(quarter,10,10.1);
    for(let i=0;i<9;i++)box(quarter,15.5,.99,9-i*.7,1.4,.08,.55,0xece1c4);
    box(quarter,15.3,1.09,1.8,6.8,.08,8.8,0xded0af);tree(quarter,16,-1,1.2);palm(quarter,24,4,1.1);palm(quarter,9,-6,.85,true);tree(quarter,29,11,1.1);
    bench(quarter,17,1,3,2.3);table(quarter,14,1,1.1);person(quarter,17,1,7.7,0x256e73);person(quarter,13.5,1,1.4,0xc78055);
    for(let i=0;i<3;i++)fern(quarter,12+i*.9,1,8.6,.43+(i%2)*.06);
    fern(quarter,18.6,1,7.9,.72);flowers(quarter,18.35,1.4,7.1,2.6);
    // A small planted place to linger between the shop and the water.
    box(quarter,20.3,1.1,10.2,2.8,.12,3.4,0xe4d7b8);bench(quarter,20.5,1.2,11.1,2.3);
    tree(quarter,20.5,9.5,.68);pot(quarter,19.2,1.2,11.3,.65);pot(quarter,21.5,1.2,8.5,.7);
    flowers(quarter,21.5,1.5,8.5,1.1);
    for(let i=0;i<7;i++)ball(quarter,29+(i%3)*2,1.4,-8-i*2,2,0x5d7b49,1,.35,1);
    // Blue hillside gardens hint at another neighbourhood without a locked gate.
    for(let i=0;i<4;i++){
      const x=19+i*3.7,z=-12-(i%2)*2;
      house(quarter,x,z,2.8,2.9,2.6+(i%2),i%2?0x5e98b6:0x97c4ce);
      tree(quarter,x+1,z-3,.7);pot(quarter,x-1,1,z+1.7,.65);
    }
    palm(quarter,34,-10,1.1);tree(quarter,31,-15,1.4);
    for(const [x,z,scale] of [[33,7,1.5],[36,12,1.2],[29,16,1.25],[22,13,1],[35,-2,1.4],[37,4,.9],[29,-5,1.1],[16,-9,.85],[33,-14,1.1],[25,-17,.8],[31,10,.7]])tree(quarter,x,z,scale);
    palm(quarter,30,14,1.3,true);palm(quarter,34,1,1);palm(quarter,20,10,.8);
    for(let i=0;i<45;i++){const x=22+Math.sin(i*12.91)*12,z=4+Math.cos(i*8.71)*11;if(x>29||z>11){for(let j=0;j<3;j++){const m=mesh(quarter,new T.ConeGeometry(.12,.6+(j%2)*.25,3),i%3?0x6b8052:0xa6a171,x+j*.15,1.4,z);m.rotation.z=(j-1)*.23;}}}

    compact(quarter);quarter.userData.unmerged=true;root.add(quarter);

    // Three different places to gather around one shared court.
    house(root,-20,-9,4.8,3.5,3.3,0xead7ae);
    house(root,-13,-13,3.8,3.4,2.8,0xd9ded0);
    pavilion(root,-25,-13,4.2);
    table(root,-19,1,-5,1.6);bench(root,-22,1,-5.4,2.8);
    const circle=mesh(root,new T.CylinderGeometry(3.2,3.2,.1,32),0xd5c49e,-17,1.04,-8);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box(root,-17+Math.cos(a)*2,1.4,-8+Math.sin(a)*2,.7,.16,.7,palette.teal);box(root,-17+Math.cos(a)*2,1.72,-8+Math.sin(a)*2+.3,.7,.6,.12,palette.teal);}
    pavilion(root,-10,-9,3.2);box(root,-10,1.81,-9,1.4,.06,1.4,palette.dark);
    for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(root,-10.5+i*.33,1.86,-9.5+j*.33,.3,.03,.3,(i+j)%2?0xe0ca91:0x477d76);
    dock(root,-14,-1.8,3.4);lamp(root,-15,-1.8);lamp(root,-13,-1.8);
    for(let i=0;i<7;i++)box(root,-14,1,-2.5-i*.65,1.5,.09,.55,0xe9dcbb);
    tree(root,-23,-7,1.2);palm(root,-28,-10,1);palm(root,-9,-16,.85,true);tree(root,-17,-17,1.1);
    person(root,-18,1,-5,0xcfb986);person(root,-16,1,-7,0x497574);person(root,-10,1,-8,0xc57d4f);
    for(let i=0;i<12;i++){const x=-33+(i%4)*2.5,z=-20-Math.floor(i/4)*2;tree(root,x,z,.7+(i%3)*.18);}
    // Mangrove roots make a recognisable, separate foreground landscape.
    for(let i=0;i<13;i++){const a=i*2.4,r=2.1+(i%3)*1.4;mangrove(root,-21+Math.cos(a)*r,14+Math.sin(a)*r,.7+(i%3)*.15);}
    return root;
  }
  function boat(ferry=false){
    const root=new T.Group();
    const outline:Point[]=[[-.65,-1.7],[-.9,-1],[-.85,.8],[-.5,1.6],[0,2.25],[.5,1.6],[.85,.8],[.9,-1],[.65,-1.7]];
    mesh(root,planeShape(outline,.55),0x735136,0,.08,0);
    mesh(root,planeShape(outline.map(([x,z])=>[x*.87,z*.94]),.06),0xbe945a,0,.64,0);
    for(let i=0;i<9;i++)box(root,0,.72,-1.5+i*.35,1.5,.035,.045,0x816342);
    for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];rod(root,new T.Vector3(a[0],.78,a[1]),new T.Vector3(b[0],.78,b[1]),.08,0xc5a06a);}
    if(ferry)person(root,-.25,.7,-1,0xf4e3b5);box(root,.4,.86,-1.25,.45,.3,.45,0x396c68);
    if(ferry){for(const x of [-.7,.7])for(const z of [-1.2,1.1])box(root,x,1.4,z,.065,1.3,.065,palette.wood);box(root,0,2.1,0,1.8,.12,2.7,0xd9b77b);root.scale.setScalar(.65);}
    else{
      rod(root,new T.Vector3(0,.75,-.25),new T.Vector3(0,5.5,-.25),.065,palette.wood);
      rod(root,new T.Vector3(.03,5.4,-.5),new T.Vector3(.03,1.25,2.1),.05,palette.wood);
      const vertices:number[]=[],segments=10;
      const point=(u:number,v:number)=>new T.Vector3(Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.7+.08,5.25*(1-v)+1.1*v,-.35+v*2.4-u*3.1*v);
      for(let v=0;v<segments;v++)for(let u=0;u<segments;u++){
        const a=point(u/segments,v/segments),b=point((u+1)/segments,v/segments),c=point((u+1)/segments,(v+1)/segments),d=point(u/segments,(v+1)/segments);
        for(const p of [a,b,d,b,c,d])vertices.push(p.x,p.y,p.z);
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();mesh(root,g,0xf8e8ba);
      const patch=box(root,.3,2.25,.8,.025,.45,.45,0xb87553);patch.rotation.x=-.35;
      for(const end of [new T.Vector3(0,.8,2),new T.Vector3(0,.8,-1.6)])rod(root,new T.Vector3(0,5.3,-.25),end,.012,0x615743);
    }
    return root;
  }
  // Merge static shapes by material to keep this detailed model inexpensive to draw.
  function compact(group:T.Group){
    group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert();
    const buckets=new Map<T.Material,T.BufferGeometry[]>();const originals:T.Mesh[]=[];
    group.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material)||o.material instanceof T.MeshBasicMaterial||(o.material instanceof T.MeshStandardMaterial&&o.material.map))return;for(let ancestor:T.Object3D|null=o;ancestor&&ancestor!==group;ancestor=ancestor.parent)if(ancestor.userData.unmerged)return;const geometry=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));geometry.deleteAttribute('uv');const arr=buckets.get(o.material)||[];arr.push(geometry);buckets.set(o.material,arr);originals.push(o);});
    originals.forEach(m=>{m.removeFromParent();m.geometry.dispose();});
    for(const [material,list] of buckets){const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());if(geometry){const m=new T.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;group.add(m);const edges=new T.LineSegments(new T.EdgesGeometry(geometry,42),new T.LineBasicMaterial({color:0x263f38,transparent:true,opacity:.23}));group.add(edges);}}
    return group;
  }
  return {world:()=>compact(buildWorld()),setIllustratedNowbrary(visible:boolean){if(nowbraryLandscape)nowbraryLandscape.visible=!visible;},boat:(ferry=false)=>compact(boat(ferry)),visitor,readingRoomRoof,storm,gradient};
}
