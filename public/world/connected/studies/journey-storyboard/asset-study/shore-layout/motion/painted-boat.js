// Local boat-to-steps study. Existing painted boat geometry; paddle rests aboard.
// Source: world-g/shore-depth/painted-boat.js. Original kept unchanged.
// The original illustrated boat remains available for direct comparison.
import * as T from '../../../../world-g/vendor/three.module.js';
import {mergeGeometries} from '../../../../world-g/vendor/BufferGeometryUtils.js';
import {createPaintPalette,addInkContours} from '../../../../world-g/shore-depth/painted-boat-palette.js';

const vector=p=>new T.Vector3(...p);
export const paintedCamera={frustum:5.3*1.35,elevation:.6,overscan:1.35,waterContact:.65};
export const screenHeadingToYaw=angle=>Math.atan2(.6*Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180));

export function buildPaintedBoat(palette=createPaintPalette()){
 const root=new T.Group();let part='hull';
 const material=color=>palette.material(color);
 function ensureUV(geometry){
  if(geometry.attributes.uv)return;
  geometry.computeBoundingBox();const b=geometry.boundingBox,size=b.getSize(new T.Vector3()),p=geometry.attributes.position,uv=[];
  for(let i=0;i<p.count;i++){
   const u=size.z>size.x?(p.getZ(i)-b.min.z)/(size.z||1):(p.getX(i)-b.min.x)/(size.x||1);
   uv.push(u,(p.getY(i)-b.min.y)/(size.y||1));
  }
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 }
 function mesh(geometry,color,position=[0,0,0]){ensureUV(geometry);const m=new T.Mesh(geometry,material(color));m.position.fromArray(position);m.castShadow=true;m.receiveShadow=true;m.userData.part=part;root.add(m);return m;}
 function box(position,size,color){return mesh(new T.BoxGeometry(...size),color,position);}
 function ellipsoid(position,size,color){const m=mesh(new T.SphereGeometry(1,16,12),color,position);m.scale.fromArray(size);return m;}
 function rod(a,b,r,color,r2=r){const direction=vector(b).sub(vector(a)),m=mesh(new T.CylinderGeometry(r2,r,direction.length(),10),color);m.position.copy(vector(a).add(vector(b)).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());return m;}
 function line(points,r,color){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(vector)),Math.max(12,points.length*4),r,6,false),color);}
 const ink=0x59412d,honey=0xb6874c,lightWood=0xd6ae71,indigo=0x345c6c;
 const sections=[[-2.10,.02],[-1.97,.30],[-1.7,.66],[-1.15,.83],[-.4,.87],[.4,.81],[1.1,.63],[1.65,.34],[2,.09],[2.12,.018]];
 const profile=new T.CatmullRomCurve3(sections.map(([z,w])=>new T.Vector3(w,0,z)));
 const stations=Array.from({length:49},(_,i)=>{const p=profile.getPoint(i/48);return {z:p.z,w:Math.max(.018,p.x),top:.85+.17*Math.pow(Math.abs(p.z)/2.12,3)+.10*Math.max(0,p.z)/2.12};});
 function point(station,side,level,inset=0){return [side*(station.w*(.32+.68*Math.sin(level*Math.PI/2))-inset),-.10+level*(station.top+.10),station.z];}
 // Separate overlapping strakes, with a narrow dark seam between boards.
 const levels=[0,.19,.38,.57,.76,.91,1],wood=[0x946d42,0xa57b47,0xbb9158,indigo,indigo,lightWood];
 for(const side of [-1,1]){
  for(let j=0;j<levels.length-1;j++){
   const positions=[];
   for(let i=0;i<stations.length-1;i++){
    const a=point(stations[i],side,levels[j]),b=point(stations[i+1],side,levels[j]),c=point(stations[i+1],side,levels[j+1]-.007),d=point(stations[i],side,levels[j+1]-.007);
    for(const v of (side===1?[a,d,b,b,d,c]:[a,b,d,b,c,d]))positions.push(...v);
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const m=mesh(g,wood[j]);m.material.side=T.DoubleSide;
  }
  const rim=stations.filter((_,i)=>i%3===0).map(s=>point(s,side,1));
  line(rim,.038,ink);line(rim.map(([x,y,z])=>[x,y+.022,z]),.029,lightWood);
  for(const level of [.39,.58,.77])line(stations.filter((_,i)=>i%3===0).map(s=>point(s,side,level)),.008,0x775735);
  // Lighter inner lining, visible above the floor.
  const inner=[];
  for(let i=0;i<stations.length-1;i++){
   const a=point(stations[i],side,.32,.035),b=point(stations[i+1],side,.32,.035),c=point(stations[i+1],side,.96,.035),d=point(stations[i],side,.96,.035);
   for(const v of [a,b,d,b,c,d])inner.push(...v);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(inner,3));g.computeVertexNormals();mesh(g,0xb88e52).material.side=T.DoubleSide;
 }
 // Floorboards follow the hull rather than extending through its sides.
 for(let i=0;i<7;i++){
  const x=(i-3)*.165,zMax=1.45-Math.abs(x)*.8,zMin=-1.68;
  box([x,.23,(zMin+zMax)/2],[.155,.055,zMax-zMin],[0xba925c,0xc5a16c,0xd1ad75][i%3]);
  for(let k=0;k<2;k++)line([[x-.035+k*.065,.26,zMin+.13],[x-.03+k*.06,.26,-.2],[x-.042+k*.06,.26,zMax-.1]],.0028,0x8b693f);
 }
 for(let i=5;i<44;i+=6){const s=stations[i];line([point(s,-1,.94,.05),point(s,-1,.48,.06),[0,.27,s.z],point(s,1,.48,.06),point(s,1,.94,.05)],.028,0x83623e);}
 for(const [z,w] of [[-1.1,1.39],[.55,1.38]]){
  box([0,.60,z],[w,.10,.30],lightWood);box([0,.653,z-.115],[w,.012,.018],0x9d743f);
  for(const x of [-w*.43,w*.43])ellipsoid([x,.656,z],[.013,.005,.013],0x645644);
 }
 // Stern and raised bow stem keep their identities through a complete turn.
 box([0,.60,-2.08],[.22,1.06,.16],0xb88b50);box([0,1.13,-2.08],[.24,.045,.18],lightWood);
 rod([0,.13,2.10],[0,1.13,2.12],.095,indigo);rod([0,1.13,2.12],[0,1.19,2.12],.10,lightWood);
 // Furled cream cloth and spar, tied to the port side of the boat.
 line([[-.65,1.03,-1.55],[-.83,1.01,-.7],[-.78,1.04,.35],[-.47,1.11,1.45]],.042,0x825d34);
 const furled=[],clothUV=[];
 const clothAt=(u,v)=>{
  const z=-1.45+u*2.85,s=stations.reduce((best,p)=>Math.abs(p.z-z)<Math.abs(best.z-z)?p:best,stations[0]);
  const scallop=Math.abs(Math.sin(u*Math.PI*4));
  return [-s.w+.07+.17*Math.sin(v*Math.PI*.8),s.top+.10-v*(.14+.13*scallop),z];
 };
 for(let i=0;i<64;i++)for(let j=0;j<8;j++){
  const u=i/64,v=j/8,un=(i+1)/64,vn=(j+1)/8;
  for(const [a,b] of [[u,v],[un,v],[u,vn],[u,vn],[un,v],[un,vn]]){furled.push(...clothAt(a,b));clothUV.push(a,b);}
 }
 const clothGeometry=new T.BufferGeometry();clothGeometry.setAttribute('position',new T.Float32BufferAttribute(furled,3));clothGeometry.setAttribute('uv',new T.Float32BufferAttribute(clothUV,2));clothGeometry.computeVertexNormals();mesh(clothGeometry,0xeee1c3).material.side=T.DoubleSide;
 for(let i=0;i<4;i++)line(Array.from({length:9},(_,j)=>clothAt((i+j/8)/4,1)),.008,0xcabd9c);
 for(const z of [-1.15,-.35,.5,1.15]){
  const s=stations.reduce((best,v)=>Math.abs(v.z-z)<Math.abs(best.z-z)?v:best,stations[0]);
  line([[-s.w-.035,s.top+.04,z],[-s.w+.05,s.top+.15,z],[-s.w+.17,s.top+.02,z]],.014,0x89693e);
 }
 // Seated traveller, cream shirt, red sash and olive trousers.
 part='traveller';
 const skin=0x9b6845,shadeSkin=0x815235,shirt=0xe7dbbc,trousers=0x6f7553,hair=0x302a25;
 ellipsoid([0,.83,-1.10],[.24,.18,.25],trousers);
 for(const side of [-1,1]){
  rod([side*.12,.83,-1.03],[side*.27,.72,-.50],.13,trousers,.14);
  rod([side*.27,.72,-.50],[side*.30,.31,-.62],.075,trousers,.095);
  ellipsoid([side*.30,.28,-.49],[.087,.055,.16],skin);ellipsoid([side*.27,.72,-.50],[.106,.105,.115],trousers);
  for(const d of [0,.06])line([[side*.17,.82-d,-.80],[side*.27,.79-d,-.64],[side*.28,.75-d,-.50]],.006,0x536044);
 }
 // Folded cloth follows a seated torso, with a hem and shoulders instead of
 // the smooth ellipsoid of the rejected motion-only model.
 const rings=[[-1.08,.88,.25,.18],[-1.07,.94,.27,.20],[-1.06,1.06,.25,.19],[-.99,1.24,.245,.18],[-.93,1.36,.255,.165],[-.89,1.43,.15,.115],[-.86,1.46,.09,.085]];
 const garment=[],garmentUV=[];
 const at=(r,i)=>{const [z,y,rx,rz]=r,a=i/32*Math.PI*2,f=1+.045*Math.sin(a*6+y*19)+.018*Math.cos(a*11-y*15);return [Math.cos(a)*rx*f,y+.006*Math.sin(a*7),z+Math.sin(a)*rz*f];};
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<32;i++){
  const verts=[at(rings[j],i),at(rings[j+1],i),at(rings[j],i+1),at(rings[j],i+1),at(rings[j+1],i),at(rings[j+1],i+1)];
  for(const v of verts)garment.push(...v);
  garmentUV.push(i/32,j/6,i/32,(j+1)/6,(i+1)/32,j/6,(i+1)/32,j/6,i/32,(j+1)/6,(i+1)/32,(j+1)/6);
 }
 const shirtGeometry=new T.BufferGeometry();shirtGeometry.setAttribute('position',new T.Float32BufferAttribute(garment,3));shirtGeometry.setAttribute('uv',new T.Float32BufferAttribute(garmentUV,2));shirtGeometry.computeVertexNormals();mesh(shirtGeometry,shirt);
 for(const side of [-1,1]){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([side*.075,1.46,-.77,side*.145,1.38,-.80,side*.025,1.34,-.79],3));g.computeVertexNormals();mesh(g,0xeee1c3).material.side=T.DoubleSide;
 }
 for(const y of [1.28,1.16,1.04])ellipsoid([.01,y,-.873],[.011,.012,.006],0xcabd9c);
 ellipsoid([0,.89,-1.04],[.26,.065,.19],0x9f4c36);
 rod([0,1.39,-.90],[0,1.50,-.84],.081,skin);
 const head=ellipsoid([0,1.65,-.82],[.152,.192,.145],skin);head.material=palette.faceMaterial();
 ellipsoid([0,1.76,-.85],[.162,.13,.155],hair);
 for(let i=0;i<31;i++){
  const a=i*2.39996,r=.147*Math.sqrt((i+.5)/31),y=1.77+.087*Math.sqrt(1-(r/.16)**2);
  ellipsoid([Math.cos(a)*r,y,-.855+Math.sin(a)*r],[.037,.035,.037],i%4?hair:0x44372b);
 }
 // Features sit on the face and rotate with it, rather than being a billboard.
 ellipsoid([0,1.61,-.685],[.036,.055,.048],skin);
 for(const side of [-1,1]){
  ellipsoid([side*.151,1.63,-.825],[.022,.04,.03],shadeSkin);
 }
 const shoulders=[[-.21,1.35,-.93],[.21,1.35,-.93]],elbows=[[-.28,1.10,-.72],[.23,1.08,-.59]],hands=[[-.40,.93,-.94],[-.22,1.16,-.64]];
 for(let i=0;i<2;i++){
  part='traveller-arm-'+i;
  rod(shoulders[i],elbows[i],.083,shirt,.105);rod(elbows[i],hands[i],.052,skin,.066);ellipsoid(hands[i],[.066,.047,.058],skin);
 }
 part='traveller';
 for(const x of [-.16,-.06,.08,.19])line([[x,1.30,-.90],[x-.015,1.12,-.88],[x+.02,.98,-.88]],.006,0xcabd9c);
 // One paddle held by the traveller. No independent rocking animation.
 part='equipment';
 const paddleA=[-.57,.7,-1.45],paddleB=[.41,.68,1.17];rod(paddleA,[.49,.68,1.39],.027,honey,.031);
 const blade=ellipsoid([.49,.68,1.39],[.14,.026,.34],lightWood);blade.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),vector(paddleB).sub(vector(paddleA)).normalize());blade.rotateZ(Math.PI*.25);
 // Woven bag beside the traveller, with a soft loop handle.
 ellipsoid([.42,.80,-.68],[.18,.20,.15],0xb99150);
 for(let i=0;i<7;i++){
  const y=.64+i*.047,r=.17*Math.sqrt(Math.max(.05,1-((y-.81)/.22)**2));
  const points=Array.from({length:25},(_,j)=>[.42+Math.cos(j/24*Math.PI*2)*r,y,-.68+Math.sin(j/24*Math.PI*2)*r*.83]);line(points,.009,i%2?0xc7a16a:0x94703c);
 }
 line([[.31,.94,-.68],[.30,1.09,-.69],[.50,1.10,-.69],[.53,.94,-.68]],.018,0xa07841);
 // Coil of rope in the bow.
 for(let i=0;i<4;i++){const ring=mesh(new T.TorusGeometry(.10+i*.022,.012,6,32),0xc5ac77,[.05,.28+i*.01,1.03]);ring.rotation.x=Math.PI/2;}

 // Give the hull the reference's longer, fuller shape while retaining the
 // traveller's human scale. Match the reference's paddle/cloth side in space.
 for(const child of root.children){
  if(!child.userData.part.startsWith('traveller')){child.position.x*=1.10;child.position.z*=1.10;child.scale.x*=1.10;child.scale.z*=1.10;}
  else child.position.z-=.11;
 }
 root.updateMatrixWorld(true);const batches=new Map();
 for(const child of [...root.children]){
  const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrixWorld);
  const key=child.userData.part+child.material.uuid;const batch=batches.get(key)||{material:child.material,part:child.userData.part,geometries:[]};batch.geometries.push(g);batches.set(key,batch);child.geometry.dispose();root.remove(child);
 }
 for(const {material:mat,part,geometries} of batches.values()){const g=mergeGeometries(geometries,false);geometries.forEach(x=>x.dispose());const m=new T.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;m.userData.part=part;root.add(m);}
 root.name='Painted continuously turning boat';addInkContours(root);root.scale.x=-1;
 const glass=new T.Group();glass.name='Boat spyglass';glass.userData.part='traveller-spyglass';glass.position.set(-.06,1.63,-.76);glass.visible=false;
 const brass=new T.MeshStandardMaterial({color:0x9b8355,roughness:.85,metalness:.15});
 for(const [radius,length,z] of [[.058,.38,0],[.077,.07,.22],[.064,.04,-.2]]){
  const tube=new T.Mesh(new T.CylinderGeometry(radius,radius,length,12),brass);tube.rotation.x=Math.PI/2;tube.position.z=z;glass.add(tube);
 }
 const lens=new T.Mesh(new T.CircleGeometry(.066,16),new T.MeshBasicMaterial({color:0x466c65}));lens.position.z=.258;glass.add(lens);root.add(glass);
 return root;
}


// Keep one model in the sea and a shared-geometry copy over the illustration.
export function setBoatOccupied(root,occupied){
 root.traverse(object=>{if(object.userData.part?.startsWith('traveller')&&(object.userData.part!=='traveller-spyglass'||!occupied))object.visible=occupied;});
}
const armPoses=[
 {pivot:[-.21,1.35,-1.04],hand:[-.40,.93,-1.05],raised:[-.15,1.56,-.64]},
 {pivot:[.21,1.35,-1.04],hand:[-.22,1.16,-.75],raised:[.04,1.6,-.54]},
].map(({pivot,hand,raised})=>{const p=vector(pivot);return{pivot:p,turn:new T.Quaternion().setFromUnitVectors(vector(hand).sub(p).normalize(),vector(raised).sub(p).normalize())};});
export function poseBoatSpyglass(root,lift){
 for(const child of root.children){
  if(child.userData.part==='traveller-spyglass'){child.visible=lift>.6;continue;}
  if(!child.userData.part?.startsWith('traveller-arm-'))continue;
  const pose=armPoses[Number(child.userData.part.at(-1))];
  child.quaternion.identity().slerp(pose.turn,lift);
  child.position.copy(pose.pivot).sub(pose.pivot.clone().applyQuaternion(child.quaternion));
 }
}
