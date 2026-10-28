import * as T from '../vendor/three.module.js';

// The original generated atlas is unmodified. Each material uses the interior
// of its square; a gutter inside the square prevents neighbouring colours leaking.
const cells={wood:[0,0],indigo:[1,0],linen:[2,0],olive:[0,1],sash:[1,1],skin:[2,1],hair:[0,2],basket:[1,2],rope:[2,2]};
const types=new Map([
 [0x345c6c,'indigo'],[0xe7dbbc,'linen'],[0xe5d7b3,'linen'],[0xeee1c3,'linen'],[0xd8c8a7,'linen'],
 [0x6f7553,'olive'],[0x9f4c36,'sash'],[0x9b6845,'skin'],[0x815235,'skin'],
 [0x302a25,'hair'],[0x44372b,'hair'],[0xb99150,'basket'],[0xc7a16a,'basket'],[0x94703c,'basket'],[0xa07841,'basket'],[0xc5ac77,'rope']
]);
const unpainted=new Set([0x59412d,0x775735,0x8b693f,0x645644,0x302920,0xcabd9c,0x536044]);
export function createPaintPalette(atlas=null,face=null){
 const textures=new Map(),materials=new Map();
 const tones=new T.DataTexture(new Uint8Array([88,112,140,166,194,220,243,255]),8,1,T.RedFormat);
 tones.minFilter=tones.magFilter=T.NearestFilter;tones.needsUpdate=true;
 function texture(kind){
  if(!atlas?.image)return null;
  if(!textures.has(kind)){
   const t=atlas.clone(),[x,y]=cells[kind],inset=.010;
   t.offset.set(x/3+inset,1-(y+1)/3+inset);t.repeat.set(1/3-inset*2,1/3-inset*2);
   t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;textures.set(kind,t);
  }
  return textures.get(kind);
 }
 function material(color){
  if(materials.has(color))return materials.get(color);
  const kind=types.get(color)||'wood',plain=unpainted.has(color);
  let m;
  if(plain)m=new T.MeshToonMaterial({color,gradientMap:tones});
  else{
   const luminance=(((color>>16)&255)*.3+((color>>8)&255)*.59+(color&255)*.11)/255;
   const intensity=kind==='wood'?Math.max(.70,Math.min(1.18,.5+luminance)):1;
   const tint=new T.Color().setRGB(intensity,intensity,intensity);
   if(kind==='skin')tint.setRGB(.87,.83,.79);
   if(kind==='hair')tint.setRGB(.65,.65,.65);
   if(kind==='sash')tint.setRGB(.78,.72,.66);
   m=new T.MeshToonMaterial({color:atlas?.image?tint:color,map:texture(kind),gradientMap:tones});
   m.userData.paintedTint=tint;
  }
  m.userData.paintKind=plain?'ink':kind;materials.set(color,m);return m;
 }
 function faceMaterial(){
  if(!materials.has('face')){
   if(face){face.wrapS=T.RepeatWrapping;face.offset.x=.25;face.colorSpace=T.SRGBColorSpace;face.needsUpdate=true;}
   const m=new T.MeshToonMaterial({color:face?.image?0xb2c1c8:0x9b6845,map:face?.image?face:null,gradientMap:tones});m.userData.paintKind='face';materials.set('face',m);
  }
  return materials.get('face');
 }
 return {material,faceMaterial,refresh(){
  for(const m of materials.values()){
   const kind=m.userData.paintKind;
   if(kind==='ink')continue;
   if(kind==='face'){if(face?.image){m.map=face;m.color.set(0xb2c1c8);m.needsUpdate=true;}}
   else if(atlas?.image){m.map=texture(kind);m.color.copy(m.userData.paintedTint);m.needsUpdate=true;}
  }
 },dispose(){for(const t of textures.values())t.dispose();tones.dispose();atlas?.dispose();face?.dispose();}};
}
export function loadPaintPalette(onReady){
 const loader=new T.TextureLoader();
 const ready=()=>{palette.refresh();onReady();};
 const image=loader.load('../assets/boat-painted-materials-v1.png',ready);
 const face=loader.load('../assets/traveller-painted-face-v1.png',ready);
 image.colorSpace=T.SRGBColorSpace;
 const palette=createPaintPalette(image,face);return palette;
}
export function addInkContours(root){
 const ink=new T.MeshBasicMaterial({color:0x47382c,side:T.BackSide,depthWrite:true});
 ink.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += normal * 0.012;');};
 ink.customProgramCacheKey=()=> 'boat-ink-v1';
 for(const child of [...root.children]){
  if(child.material.userData.paintKind==='ink')continue;
  const line=new T.Mesh(child.geometry,ink);line.name='Ink contour';line.userData.part=child.userData.part;line.renderOrder=-1;root.add(line);
 }
 // A restrained water-contact shadow gives the painted hull a place on the
 // estuary. Its plane follows the same continuous turn as the boat.
 const contact=new T.Mesh(new T.PlaneGeometry(2.05,4.9),new T.ShaderMaterial({
  transparent:true,depthWrite:false,
  vertexShader:'varying vec2 surfaceUV; void main(){surfaceUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec2 surfaceUV; void main(){vec2 p=(surfaceUV-.5)*2.;float a=pow(max(0.,1.-dot(p,p)),1.8)*.24;gl_FragColor=vec4(.035,.16,.18,a);}'
 }));
 contact.rotation.x=-Math.PI/2;contact.position.y=-.14;contact.name='Water contact';root.add(contact);
}
