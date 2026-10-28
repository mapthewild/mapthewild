import * as T from 'three';
import {buildPaintedBoat,setBoatOccupied} from './illustrated/boat.js';
import {createPaintPalette} from './illustrated/palette.js';
import {landingPosition,landingPathPoint,landingTerracePoint,type LandingState} from './landing-route';

const W=1586,H=992,PPM=100;
const base='/mapthewild/world/connected/studies/';
const art=base+'journey-storyboard/asset-study/shore-layout/motion/art/';
const clamp=T.MathUtils.clamp,mix=T.MathUtils.lerp;
const smooth=(t:number)=>{t=clamp(t,0,1);return t*t*(3-2*t);};
/** The approved landing scene, with its boat and individual rear-view poses. */
export function createIllustratedLanding(onReady:()=>void){
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-W/PPM/2,W/PPM/2,H/PPM/2,-H/PPM/2,.1,100);
 camera.position.set(0,6,8);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 scene.add(new T.HemisphereLight(0xffefcc,0x367681,1.5));
 const sun=new T.DirectionalLight(0xffecc6,2.3);sun.position.set(-5,9,6);scene.add(sun);
 const fill=new T.DirectionalLight(0xadd4e1,.3);fill.position.set(5,3,-4);scene.add(fill);
 const loader=new T.TextureLoader(),textures:T.Texture[]=[],poses:T.Mesh[]=[];
 let boat:T.Group|null=null,ready=false,dead=false,phase=12;
 const screenPoint=(x:number,y:number,height=0)=>new T.Vector3((x-W/2)/PPM,height,(y-H/2+.8*PPM*height)/(.6*PPM));
 const frames=[
  [77,15,308,391,178,387,1.72],[440,15,657,391,548,387,1.72],[815,15,1009,385,915,381,1.72],[1156,13,1384,392,1265,387,1.72],
  [114,798,305,1058,270,1055,1.25],[446,748,616,1065,547,1061,1.48],[819,742,952,1071,888,1067,1.72],[1180,746,1382,1069,1220,1065,1.72]
 ];
 Promise.all([loader.loadAsync(base+'world-g/assets/boat-painted-materials-v1.png'),loader.loadAsync(base+'world-g/assets/traveller-painted-face-v1.png'),loader.loadAsync(art+'traveller-poses-v1.png'),loader.loadAsync(art+'shore-empty-v1.png')]).then(([atlas,face,sheet,shore])=>{
  if(dead){[atlas,face,sheet,shore].forEach(t=>t.dispose());return;}
  textures.push(atlas,face,sheet,shore);textures.forEach(t=>t.colorSpace=T.SRGBColorSpace);
  const plate=new T.Mesh(new T.PlaneGeometry(W/PPM,H/PPM),new T.MeshBasicMaterial({map:shore,toneMapped:false}));
  plate.quaternion.copy(camera.quaternion);plate.position.copy(camera.position).normalize().multiplyScalar(-20);scene.add(plate);
  boat=buildPaintedBoat(createPaintPalette(atlas,face));scene.add(boat);setBoatOccupied(boat,false);
  for(const [x0,y0,x1,y1,ax,ay,height] of frames){
   const texture=sheet.clone();texture.offset.set(x0/1448,1-y1/1086);texture.repeat.set((x1-x0)/1448,(y1-y0)/1086);texture.needsUpdate=true;textures.push(texture);
   const width=height*(x1-x0)/(y1-y0),geometry=new T.PlaneGeometry(width,height);
   geometry.translate((.5-(ax-x0)/(x1-x0))*width,((ay-y0)/(y1-y0)-.5)*height,0);
   const sprite=new T.Mesh(geometry,new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.15,depthWrite:true,toneMapped:false,side:T.DoubleSide}));
   sprite.quaternion.copy(camera.quaternion);sprite.visible=false;scene.add(sprite);poses.push(sprite);
  }
  for(const points of [[[851,641],[889,638],[893,744],[878,755],[850,742]],[[1048,651],[1082,652],[1080,751],[1047,758]],[[571,630],[603,627],[604,725],[574,723]]]){
   const x=points.reduce((s,p)=>s+p[0],0)/points.length,y=Math.max(...points.map(p=>p[1]));
   const shape=new T.Shape(points.map(p=>new T.Vector2((p[0]-x)/PPM,(y-p[1])/PPM))),g=new T.ShapeGeometry(shape),p=g.attributes.position,uv=[];
   for(let i=0;i<p.count;i++)uv.push((x+p.getX(i)*PPM)/W,1-(y-p.getY(i)*PPM)/H);
   g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
   const post=new T.Mesh(g,new T.MeshBasicMaterial({map:shore,toneMapped:false}));post.quaternion.copy(camera.quaternion);post.position.copy(screenPoint(x,y));scene.add(post);
  }
  ready=true;onReady();
 });
 function update(state:LandingState,width:number,height:number,zoom:number,panX:number,panY:number){
  phase=landingPosition(state);if(!ready||!boat)return;
  const sail=smooth(phase/3),boatXY={x:mix(450,760,sail),y:mix(900,850,sail)};
  boat.position.copy(screenPoint(boatXY.x,boatXY.y));const angle=mix(-8,-25,sail)*Math.PI/180;
  boat.rotation.y=Math.atan2(.6*Math.cos(angle),Math.sin(angle));boat.updateMatrixWorld(true);
  let frame=4,anchor:T.Vector3,scale=1;
  const local=(x:number,y:number,z:number)=>boat!.localToWorld(new T.Vector3(x,y,z));
  if(phase<3.6)anchor=local(0,.27,-.8);
  else if(phase<4.4){frame=phase<4?5:6;anchor=local(0,.27,-.8);}
  else if(phase<6.2){const u=(phase-4.4)/1.8;frame=Math.floor(u*12)%4;anchor=local(0,.27,mix(-.8,1.38,u));}
  else if(phase<7.3){const u=smooth((phase-6.2)/1.1);frame=7;anchor=local(0,.27,1.38).lerp(screenPoint(929,695,1.05),u);anchor.y+=Math.sin(u*Math.PI)*.16;}
  else{const p=landingTerracePoint(state)||landingPathPoint(phase);scale=mix(1,.88,clamp((phase-7.3)/11.7,0,1));frame=state.walking?Math.floor(state.progress*24)%4:6;anchor=screenPoint(p.x,p.y,1.05+clamp((phase-9.2)/7.8,0,1)*1.5);}
  poses.forEach((pose,i)=>pose.visible=i===frame);
  const sprite=poses[frame];sprite.position.copy(anchor);sprite.scale.set(scale*(state.returning&&frame<4?-1:1),scale,scale);
  // Preserve the drawn outline while making the seated figure upright in depth.
  const depth=1-smooth((phase-6.2)/1.1),v=sprite.geometry.attributes.position,m=camera.matrixWorld.elements;
  for(let i=0;i<v.count;i++)v.setZ(i,v.getY(i)*(-m[6]/m[10])*depth);v.needsUpdate=true;sprite.geometry.computeBoundingSphere();
  const aspect=width/height,viewH=Math.min(H,W/aspect)/Math.max(1,zoom),viewW=viewH*aspect;
  const nearDoor=clamp((phase-12)/7,0,1),cx=clamp((width<650?W/2+anchor.x*PPM:W/2)+panX,viewW/2,W-viewW/2),cy=clamp(mix(H/2,390,nearDoor)+panY,viewH/2,H-viewH/2);
  camera.left=(cx-viewW/2-W/2)/PPM;camera.right=(cx+viewW/2-W/2)/PPM;camera.top=(H/2-cy+viewH/2)/PPM;camera.bottom=(H/2-cy-viewH/2)/PPM;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 function projectPixel(x:number,y:number){const p=screenPoint(x,y).project(camera);return{x:(p.x+1)/2,y:(1-p.y)/2,visible:Math.abs(p.x)<.95&&Math.abs(p.y)<.85};}
 return{scene,camera,update,projectPixel,get ready(){return ready;},get phase(){return phase;},dispose(){dead=true;scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});textures.forEach(t=>t.dispose());}};
}
