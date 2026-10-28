import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MAP_COASTS,MAP_ISLANDS,type MapIslandId} from './map-islands';

// These are miniature, solid map landmarks. The approved close landing scenes
// remain separate. No part of either map island is a picture-facing plane.
const angle=Math.atan2(6,65),cos=Math.cos(angle),sin=Math.sin(angle);
type V=[number,number,number];
function seeded(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

function workshop(id:MapIslandId){
  const random=seeded(id==='nowbrary'?805:1202),solid:T.BufferGeometry[]=[],leaves:T.BufferGeometry[]=[];
  const root=new T.Group();root.name=id+' spatial map';root.userData.port=id;
  root.position.set(MAP_ISLANDS[id].port[0],0,MAP_ISLANDS[id].port[1]);root.rotation.y=angle;
  const tones=new T.DataTexture(new Uint8Array(id==='nowbrary'?[96,125,153,179,203,225,243,255]:[78,126,178,220,255]),id==='nowbrary'?8:5,1,T.RedFormat);
  tones.minFilter=tones.magFilter=T.NearestFilter;tones.needsUpdate=true;
  const material=new T.MeshToonMaterial({vertexColors:true,gradientMap:tones,color:0xc8c8c8});
  const leafMaterial=material.clone();leafMaterial.side=T.DoubleSide;
  const bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
  const coast=MAP_COASTS[id].map(([x,z])=>{
    const dx=x-root.position.x,dz=z-root.position.z;
    const p:[number,number]=[dx*cos-dz*sin,dx*sin+dz*cos];
    bounds.minX=Math.min(bounds.minX,p[0]);bounds.maxX=Math.max(bounds.maxX,p[0]);
    bounds.minZ=Math.min(bounds.minZ,p[1]);bounds.maxZ=Math.max(bounds.maxZ,p[1]);return p;
  });
  function add(geometry:T.BufferGeometry,color:number,at:V=[0,0,0],scale:V=[1,1,1],rotation:V=[0,0,0],foliage=false){
    const transform=new T.Matrix4().compose(new T.Vector3(...at),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));
    geometry.applyMatrix4(transform);geometry.deleteAttribute('uv');
    const base=new T.Color(color),p=geometry.attributes.position,colors=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){
      // Broad, static pigment variation. No screen-sized noise or animated grain.
      const variation=.94+.06*Math.sin(p.getX(i)*2.4+p.getY(i)*3.1)*Math.sin(p.getZ(i)*1.9-p.getY(i));
      colors.set([base.r*variation,base.g*variation,base.b*variation],i*3);
    }
    geometry.setAttribute('color',new T.BufferAttribute(colors,3));
    (foliage?leaves:solid).push(geometry.index?geometry.toNonIndexed():geometry);
    if(geometry.index)geometry.dispose();
  }
  function box(at:V,size:V,color:number,r=.06,rotation:V=[0,0,0]){
    const geometry=Math.min(...size)<.22?new T.BoxGeometry(...size):new RoundedBoxGeometry(...size,1,Math.min(r,...size.map(n=>n*.22)));
    add(geometry,color,at,[1,1,1],rotation);
  }
  function tube(points:V[],radius:number,color:number,endRadius?:number){
    if(points.length===2&&endRadius!==undefined){
      const a=new T.Vector3(...points[0]),b=new T.Vector3(...points[1]),d=b.clone().sub(a);
      const g=new T.CylinderGeometry(endRadius,radius,d.length(),8,1);
      g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));
      add(g,color,a.add(b).multiplyScalar(.5).toArray() as V);return;
    }
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(5,points.length*2),radius,6,false),color);
  }
  function rock(at:V,size:V,color:number,turn=0){
    const g=new T.SphereGeometry(1,16,10),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const f=1+.095*Math.sin(x*7.1+z*3.3)*Math.cos(y*8.4-z*2.8)+.045*Math.sin(z*13+x*4);
      p.setXYZ(i,x*f,y*f,z*f);
    }
    g.computeVertexNormals();add(g,color,at,size,[0,turn,0]);
    // Creases wrap the rounded rock; they are physical lines, not a decal.
    const dark=id==='future-dads'?0x78502b:0x9a8b6d;
    for(let k=0;k<2;k++){
      const points:V[]=[];const a=turn+(k?1.1:-.5);
      for(let j=0;j<=8;j++){
        const t=.3+j*.28;
        points.push([at[0]+Math.cos(a)*Math.sin(t)*size[0]*1.015,at[1]+Math.cos(t)*size[1]*1.015,at[2]+Math.sin(a)*Math.sin(t)*size[2]*1.015]);
      }
      tube(points,id==='future-dads'?.025:.014,dark);
    }
  }
  function leaf(at:V,size:number,color:number,rotation:V){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute([0,0,-1,-.48,.04,-.2,0,.18,.2, 0,.18,.2,-.48,.04,-.2,0,0,1, 0,0,-1,0,.18,.2,.48,.04,-.2, .48,.04,-.2,0,.18,.2,0,0,1],3));
    g.computeVertexNormals();add(g,color,at,[size,size,size],rotation,true);
  }
  function foliage(at:V,size:V,count:number,flower=false){
    const green=id==='future-dads'?[0x33583b,0x5f8135,0x8ba535,0xb8bd3e]:[0x315340,0x577043,0x7e873a,0xa2a650];
    // Small overlapping volumes support the leaves, so the canopy reads as
    // shelter at chart scale rather than a spray of disconnected triangles.
    for(let i=0;i<3;i++){
      const a=i*2.4;
      add(new T.SphereGeometry(1,10,7),green[i],[at[0]+Math.cos(a)*size[0]*.25,at[1]-.12,at[2]+Math.sin(a)*size[2]*.25],[size[0]*.68,size[1]*.72,size[2]*.68]);
    }
    for(let i=0;i<count;i++){
      const a=random()*Math.PI*2,u=random()*2-1,r=Math.sqrt(1-u*u),spread=.6+random()*.4;
      const p:V=[at[0]+Math.cos(a)*r*size[0]*spread,at[1]+u*size[1]*spread,at[2]+Math.sin(a)*r*size[2]*spread];
      const color=flower&&i%3===0?[0xd33a16,0xf15a1c,0xf88b20][i%3]:green[1+Math.floor(random()*(green.length-1))];
      leaf(p,(flower?.24:.34)+random()*(id==='future-dads'?.34:.22),color,[random()*.85,random()*6.28,random()*.7-.35]);
    }
  }
  function tree(at:V,height:number,width:number,flower=false){
    const [x,y,z]=at,bark=id==='future-dads'?0x855329:0x6d5942;
    tube([[x,y,z],[x+.25,y+height*.24,z+.2],[x-.55,y+height*.52,z],[x-.1,y+height*.78,z-.2]],.44,bark);
    for(let i=0;i<8;i++){
      const a=i*2.399,r=width*(.48+(i%3)*.17),xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r*.7,yy=y+height*(.7+(i%3)*.09);
      tube([[x+.1,y+height*.27,z],[x+Math.cos(a)*r*.45,y+height*.57,z+Math.sin(a)*r*.4],[xx,yy,zz]],.16+(i%2)*.07,bark);
      foliage([xx,yy+.5,zz],[width*.48,height*.18,width*.4],190,flower);
    }
    for(let i=0;i<5;i++){const a=i*1.257;tube([[x+Math.cos(a)*1.3,y,z+Math.sin(a)*1.2],[x+Math.cos(a)*.4,y+.4,z+Math.sin(a)*.4],[x,y+1.4,z]],.11,bark);}
    // A few long highlights describe the trunk's twist.
    tube([[x+.27,y+.3,z+.28],[x+.36,y+height*.25,z+.5],[x-.24,y+height*.5,z+.28]],.055,id==='future-dads'?0xb37b3b:0x9b815a);
  }
  function pot(at:V,s=1){
    const [x,y,z]=at;
    add(new T.LatheGeometry([new T.Vector2(.25,0),new T.Vector2(.39,.1),new T.Vector2(.52,.7),new T.Vector2(.55,.82),new T.Vector2(.48,.89)],14),0xb66c39,at,[s,s,s]);
    add(new T.CylinderGeometry(.45,.45,.035,14),0x393e27,[x,y+s*.81,z],[s,s,s]);
    for(let i=0;i<11;i++){
      const a=i*2.4;leaf([x+Math.cos(a)*s*.25,y+s*(.9+(i%3)*.18),z+Math.sin(a)*s*.25],s*.7,[0x426f49,0x7b9454,0x98a767][i%3],[.7,a,.3]);
    }
  }
  function base(){
    const shape=new T.Shape();coast.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:1.2,bevelEnabled:true,bevelSize:.5,bevelThickness:.4,bevelSegments:2,curveSegments:3});
    g.rotateX(-Math.PI/2);add(g,id==='future-dads'?0xd5a955:0x9d9870,[0,-.5,0]);
    for(let i=0;i<coast.length;i++){
      const a=coast[i],b=coast[(i+1)%coast.length];
      const count=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2.3));
      for(let j=0;j<count;j++){
        const t=j/count,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
        // Keep the mouth of the stairs/jetty clear.
        if(Math.abs(x)<2.8&&z>bounds.maxZ-3)continue;
        const s=.85+random()*.85;
        const centreZ=(bounds.minZ+bounds.maxZ)/2;
        rock([x*.95,.6+s*.35,centreZ+(z-centreZ)*.95],[s*1.15,s*1.25,s],id==='future-dads'?[0xd99a3c,0xe4ad51,0xbc7f33][j%3]:[0xc2b494,0xd0bea0,0xaa9d7f][j%3],random()*6);
        if(j%2===0)foliage([x*.85,1.65,centreZ+(z-centreZ)*.85],[1.55,.85,1.25],64);
      }
    }
    // Separate broken foam arcs hug the actual coast at water height.
    for(let i=0;i<coast.length;i++){
      const a=coast[i],b=coast[(i+1)%coast.length],centreZ=(bounds.minZ+bounds.maxZ)/2;
      if(Math.abs(a[0])<3&&a[1]>bounds.maxZ-3)continue;
      const points:V[]=[];
      for(let j=0;j<7;j++){const t=j/9,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;points.push([x*1.045,.15,centreZ+(z-centreZ)*1.045]);}
      tube(points,.065,0xe6efda);
    }
  }
  function finish(){
    for(const [geometries,mat,name] of [[solid,material,'stone timber and branches'],[leaves,leafMaterial,'individual leaves and flowers']] as const){
      const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
      if(!geometry)continue;
      const mesh=new T.Mesh(geometry,mat);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
      if(geometries===solid){
        const ink=new T.MeshBasicMaterial({color:id==='future-dads'?0x473721:0x65573d,side:T.BackSide});
        ink.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\ntransformed += normal * ${id==='future-dads'?'.035':'.018'};`);};
        ink.customProgramCacheKey=()=>id+'-map-ink';
        const outline=new T.Mesh(geometry,ink);outline.name='drawn contour';outline.raycast=()=>{};root.add(outline);
      }
    }
    root.userData.landmarkBounds=bounds;root.userData.gradient=tones;
    return root;
  }
  return{root,random,box,tube,rock,leaf,foliage,tree,pot,base,finish,add};
}

function nowbrary(){
  const w=workshop('nowbrary');w.base();
  const {box,tube,pot}=w;
  // A broken limestone hill supports the bookshop instead of a flat platform.
  for(const [x,z,s] of [[-8,-10,3],[8,-10,2.6],[-10,-17,3.4],[9,-17,3],[-5,-23,3.4],[5,-23,3.5]] as V[])w.rock([x,1.6,z],[s,2.8,s*.85],0xbbab87,x);
  for(const side of [-1,1])for(let i=0;i<8;i++){
    const x=side*(5.5+(i%3)*1.6),z=-5.2-i*2.3;
    w.rock([x,.9+(i%2)*.6,z],[1.5,1.35,1.6],[0xa99c7c,0xc9b48e,0xd8c7a8][i%3],i);
    w.foliage([x+side*.7,2.2,z-.5],[1.4,.7,1.1],65);
  }
  box([0,2.35,-15],[15,3.7,11],0xc9ba98,.2);
  // Individually laid blocks break the retaining wall into readable courses.
  for(let row=0;row<4;row++)for(let col=0;col<12;col++){
    const x=-7.2+col*1.27+(row%2)*.32;
    if(Math.abs(x)<2.8)continue;
    box([x,.95+row*.8,-9.48],[1.17,.72,.38],[0xd9c9a7,0xc3b18d,0xe2d2b2][(row+col)%3],.08);
  }
  box([0,4.25,-12.8],[14.8,.3,6.5],0xe1d0a8,.12);
  for(let i=0;i<11;i++){
    const top=.7+(i+1)*.32,z=-3.5-i*.62;
    box([0,top/2,z],[4.5,top,.66],i%2?0xdac9a4:0xe7d6b2,.07);
    for(let j=0;j<3;j++)box([-1.5+j*1.5,top+.025,z],[1.45,.06,.61],(i+j)%3?0xddcca9:0xc6b18d,.025);
  }
  box([0,.5,-2.2],[6.5,.8,2.6],0xdccca9,.12);
  for(const x of [-2.9,2.9])for(const z of [-1.2,-3.2]){
    tube([[x,-.3,z],[x,1.65,z]],.13,0x68533a,.11);
    addRope(w,x,1.1,z,.17);
  }
  // Open front, actual deep shelves, blue seat, and a doorway on the right.
  const floor=4.4;
  box([0,floor+2.3,-19.7],[15,4.6,.55],0xe5d8b9,.15);
  box([-7.25,floor+2.3,-16.9],[.55,4.6,6],0xe9dcbd,.15);
  box([7.25,floor+2.3,-16.9],[.55,4.6,6],0xe9dcbd,.15);
  box([0,floor+4.45,-16.8],[15.5,.55,6.7],0xe9ddbf,.16);
  for(const side of [-1,1])box([side*7.4,floor+5,-16.8],[.35,.8,6.7],0xd7c6a6,.12);
  for(let row=0;row<5;row++)for(let j=0;j<7;j++){
    box([7.55,floor+.45+row*.78,-19.5+j*.84],[.08,.67,.74],(row+j)%3?0xd5c5a3:0xbcad8a,.03);
  }
  box([0,floor+4.05,-13.65],[14.8,.35,.45],0x715236,.06);
  for(const x of [-6.8,3.8,6.6])tube([[x,floor,-13.5],[x,floor+4.2,-13.5]],.14,0x6b4e32,.12);
  const bindings=[0x436775,0x76593e,0xb68341,0x8d3d2d,0x819071,0xc4a46c];
  for(const x of [-5.3,-2.2,1,4.2]){
    box([x,floor+2,-19.25],[2.8,3.8,.35],0x66492f,.03);
    for(let row=0;row<5;row++){
      const y=floor+.35+row*.71;box([x,y,-18.86],[2.85,.12,.65],0xaa7b43,.02);
      for(let j=0;j<11;j++){
        const tall=.37+w.random()*.24;
        box([x-1.23+j*.24,y+tall/2+.06,-18.7],[.16+w.random()*.06,tall,.35],bindings[(j+row)%bindings.length],.012,[0,0,(w.random()-.5)*.1]);
      }
    }
    for(const dx of [-1.42,1.42])box([x+dx,floor+2,-18.8],[.12,4,.65],0x93683b,.025);
  }
  box([.5,floor+.5,-16.5],[4.7,.65,1.65],0x8a6743,.12);
  box([.5,floor+1.3,-17.1],[4.7,1.3,.5],0x32667b,.17);
  for(let i=0;i<3;i++)box([-1+i*1.5,floor+.94,-16.35],[1.4,.3,1.35],i%2?0x5b8790:0x416f85,.14);
  for(const x of [-1.3,2.3])box([x,floor+1.4,-16.7],[.7,.7,.3],0xb99b55,.15,[0,.1,.2]);
  box([-.8,floor+.65,-14.5],[2.3,.18,1.25],0x96683b,.06);
  for(const x of [-1.7,.1])for(const z of [-14.95,-14.05])box([x,floor+.3,z],[.12,.6,.12],0x644a34,.03);
  box([-.9,floor+.025,-14.5],[4.7,.03,3.5],0x9e4333,.01);
  for(let i=0;i<5;i++)box([-.9,floor+.045,-15.9+i*.7],[4.3,.015,.09],0xd6b778,.005);
  // Roof garden rises at the back, with an open timber pergola.
  box([2.2,9.1,-21],[9.7,.5,5.7],0xdac9a9,.1);
  for(const x of [-2.5,7])box([x,9.8,-21],[.45,1.4,5.9],0xe5d5b6,.1);
  box([2.2,9.8,-23.8],[9.7,1.4,.4],0xe5d5b6,.1);
  for(const x of [-1,5.7])for(const z of [-20,-23])tube([[x,9.4,z],[x,12,z]],.1,0x7d5b39,.09);
  for(let i=0;i<11;i++)box([-1.3+i*.72,12,-21.5],[.1,.16,3.8],0x997447,.02);
  for(let i=0;i<7;i++){
    const x=-1+i*1.1;w.foliage([x,12.2,-21.5],[1,.35,1.5],40);
    for(let j=0;j<14;j++)w.leaf([x+(w.random()-.5)*1.5,12.4+w.random()*.3,-21.5+(w.random()-.5)*2.5],.22,j%2?0xc33875:0xe56799,[w.random(),j,0]);
  }
  for(const p of [[-2,9.4,-20],[6.5,9.4,-20],[0,9.4,-23],[5,9.4,-23],[-5.5,floor,-12],[-3.8,floor,-12],[4.6,floor,-12],[6.7,floor,-12]] as V[])pot(p,.8);
  w.tree([-4.2,4.4,-15.8],8.2,7.2,true);
  // Climbing bougainvillea follows the right jamb and roof, not a ball of colour.
  for(let i=0;i<14;i++){
    const p:V=[6.8+Math.sin(i*.5)*.25,4.5+i*.36,-13.7];w.foliage(p,[.5,.5,.45],24);
    for(let j=0;j<7;j++)w.leaf([p[0]+w.random()*.55,p[1]+w.random()*.3,p[2]+w.random()*.4],.23,j%2?0xb74077:0xe56a96,[w.random(),j,0]);
  }
  for(const [x,z] of [[-11,-9],[10,-9],[12,-17],[-12,-20]]){
    for(let i=0;i<4;i++){const a=i*1.57;tube([[x+Math.cos(a)*1.4,0,z+Math.sin(a)*1.4],[x+Math.cos(a)*.7,1.7,z+Math.sin(a)*.7],[x,3,z]],.08,0x6c5940);}
    w.foliage([x,3,z],[2,.8,1.7],130);
  }
  return w.finish();
}

function addRope(w:ReturnType<typeof workshop>,x:number,y:number,z:number,r:number){
  for(let i=0;i<3;i++){const g=new T.TorusGeometry(r,.025,5,14);g.rotateX(Math.PI/2);w.add(g,0xcab077,[x,y+i*.065,z]);}
}

function futureDads(){
  const w=workshop('future-dads');w.base();
  const {box,tube}=w;
  // The tall, leaning orange fin and the spreading tree are the two silhouettes.
  const profile=new T.Shape();
  [[-2,0],[2.2,0],[2.5,3.5],[.4,6.5],[-5.3,10.7],[-4.1,7.2],[-3,3.3]].forEach(([x,y],i)=>i?profile.lineTo(x,y):profile.moveTo(x,y));profile.closePath();
  const fin=new T.ExtrudeGeometry(profile,{depth:2.1,bevelEnabled:true,bevelSize:.45,bevelThickness:.45,bevelSegments:3,curveSegments:4});
  w.add(fin,0xd98731,[-6,1,-14],[1,1,1],[0,-.1,0]);
  for(let i=0;i<5;i++){
    const x=-7.6+i*.65;tube([[x,1.2,-11.45],[x+.2,3.2,-11.5],[x-.7,5,-11.65],[x-2.1,7,-11.8]],.03,0x885328);
  }
  for(const [x,z,s] of [[-5,-18,2.5],[-1,-21,2.7],[6,-21,2.7],[8,-16,2.2],[8,-10,2.6],[-7,-7,2.5],[4,-7,1.8]] as V[])w.rock([x,1.1,z],[s,s*.8,s*.8],0xda963c,x);
  // Sand winds between the fin and radio tree. Small stones leave the centre open.
  for(let i=0;i<25;i++){
    const z=-4-i*.62,x=1.3+Math.sin(i*.22)*1.5;
    for(const side of [-1,1])if(i%3!==0)w.rock([x+side*(2+w.random()),.85,z],[.15,.11,.16],0xb77d34);
  }
  w.tree([4,1,-15],8.6,5.3);
  // Bench, cushions and an actual little radio, visible on the approach.
  box([2.4,1.7,-13.2],[4.2,.2,1.3],0xc19345,.09);
  for(const x of [.6,4.2])for(const z of [-12.7,-13.7])box([x,1.25,z],[.17,.9,.17],0x81552b,.03);
  box([1.1,2.1,-13.55],[1.1,.9,.3],0x76944f,.1,[0,0,.1]);
  box([2.15,2.1,-13.55],[.9,.8,.3],0x537257,.1,[0,0,-.12]);
  box([3.3,2.15,-13.15],[1.25,.72,.45],0x744624,.08);
  box([3.04,2.15,-12.9],[.5,.52,.025],0xcab470,.025);
  for(let i=0;i<7;i++)tube([[2.83+i*.06,1.95,-12.87],[2.83+i*.06,2.36,-12.87]],.009,0x5f4e2f);
  box([3.59,2.28,-12.9],[.35,.13,.035],0xebcc7b,.01);
  for(const x of [3.44,3.69]){const g=new T.CylinderGeometry(.07,.07,.06,12);g.rotateX(Math.PI/2);w.add(g,0xd6b268,[x,2.02,-12.86]);}
  tube([[3.7,2.5,-13.1],[4.3,3.65,-13.15]],.021,0x5e563d);
  // Timber jetty, tied posts and grain lines match the close landing.
  for(let i=0;i<9;i++){
    const z=-1.6-i*.38;box([0,.72,z],[3.8,.2,.35],i%3?0xc69a51:0xd8ae64,.045);
    for(let j=0;j<2;j++)tube([[-1.65,.83,z-.08+j*.13],[-.1,.84,z-.06+j*.13],[1.6,.83,z-.08+j*.13]],.011,0x9d7135);
  }
  for(const x of [-1.65,1.65])for(const z of [-1.45,-4.7]){tube([[x,-.3,z],[x,1.5,z]],.16,0xae7e39,.13);addRope(w,x,.8,z,.18);}
  for(const [x,z] of [[-4,-8],[6,-9],[-3,-19],[7,-19],[-8,-15],[1,-21]])w.foliage([x,1.7,z],[1.6,.8,1.2],110);
  return w.finish();
}

export function createMapLandmarks(){
  const islands=[nowbrary(),futureDads()];
  return {
    islands,
    hit(ray:T.Raycaster):MapIslandId|null{
      const hit=ray.intersectObjects(islands,true)[0];if(!hit)return null;
      let node:T.Object3D|null=hit.object;while(node&&!node.userData.port)node=node.parent;
      return node?.userData.port||null;
    },
    dispose(){
      const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
      for(const island of islands){island.removeFromParent();island.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});(island.userData.gradient as T.Texture).dispose();}
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    }
  };
}
