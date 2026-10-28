import * as T from 'three';
import {isInside,type FootPoint,type FootNode,type WalkPlace} from './ashore';
import {createIllustratedLanding} from './illustrated-landing';
import {landingPosition} from './landing-route';
import {isReader,SHELF_X} from './shelf-data';
import {SHELF_SCALE,SHELF_FLOOR,shelfCentre,paintedFrustum} from './painted-layout';

type VisitState={place:WalkPlace;at:FootNode;destination:FootNode|null;path:FootPoint[]|null;progress:number;worldZ:number;walking:boolean;time:number;dt:number;motion:boolean;zoom:number};

/** Painted sets with live book meshes, a walking character and composed camera travel. */
export function createPaintedVisit(onReady:()=>void){
  const landing=createIllustratedLanding(onReady),quay=landing.scene,room=new T.Scene(),composite=new T.Scene();
  const quayCamera=landing.camera,roomCamera=new T.OrthographicCamera(-800,800,450,-450,.1,4000);roomCamera.position.z=2000;
  const screenCamera=new T.OrthographicCamera(-1,1,1,-1,0,2);screenCamera.position.z=1;
  const quayTarget=new T.WebGLRenderTarget(1,1),roomTarget=new T.WebGLRenderTarget(1,1),worldTarget=new T.WebGLRenderTarget(1,1);
  const loader=new T.TextureLoader();let loaded=0,dead=false,root:T.Group|null=null,originalParent:T.Object3D|null=null,active=false,blend=0;
  let width=1600,height=900,lastPlace='',arrival=0,departing=false,settled=false;
  let quayZoom=1,roomZoom=1,quayX=0,roomX=0,quayY=0,roomY=0,panX=0,panY=0;
  const texture=(name:string)=>{const map=loader.load('/mapthewild/world/nowbrary/art/'+name,()=>{if(!dead){loaded++;onReady();}});map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;};
  const roomMap=texture('painted-room-v1.png');
  const interior=new T.Mesh(new T.PlaneGeometry(1600,900),new T.MeshBasicMaterial({map:roomMap,toneMapped:false}));interior.position.z=-100;room.add(interior);
  const contents=new T.Group();contents.scale.setScalar(SHELF_SCALE);contents.position.set(-SHELF_X.melville*SHELF_SCALE,SHELF_FLOOR-1.12*SHELF_SCALE,-3.34*SHELF_SCALE+90);room.add(contents);
  room.add(new T.HemisphereLight(0xf3f1e9,0xb6ab94,2.1));
  const light=new T.DirectionalLight(0xfffbef,2.4);light.position.set(-700,900,1700);room.add(light);
  light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-800,right:800,top:650,bottom:-650,near:1,far:3000});light.shadow.bias=-.0002;light.shadow.normalBias=.4;
  const fill=new T.DirectionalLight(0xd5ddd1,.7);fill.position.set(800,400,1200);room.add(fill);
  const shadows=new T.Group();room.add(shadows);
  const floorShadow=new T.Mesh(new T.PlaneGeometry(2000,1000),new T.ShadowMaterial({opacity:.14,depthWrite:false}));floorShadow.rotation.x=-Math.PI/2+.14;floorShadow.position.set(0,SHELF_FLOOR,90);floorShadow.receiveShadow=true;shadows.add(floorShadow);
  for(const id of ['moe','melville','montaigne'] as const){
    const shadow=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:0x303b32,transparent:true,opacity:.18,depthWrite:false}));
    shadow.scale.set(150,10,1);shadow.position.set(shelfCentre(id),SHELF_FLOOR-3,0);shadows.add(shadow);
  }
  // A small framed place on its own table. It is not a fourth reader's books.
  const portalObject=new T.Group();portalObject.position.set(610,-20,110);room.add(portalObject);
  const wood=new T.MeshStandardMaterial({color:0x765139,roughness:.92});
  const brass=new T.MeshStandardMaterial({color:0xb6a078,roughness:.65,metalness:.3});
  function piece(w:number,h:number,d:number,x:number,y:number,z:number,material=wood){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;portalObject.add(mesh);return mesh;}
  piece(232,15,66,0,-98,-8);piece(16,90,19,-89,-146,-8);piece(16,90,19,89,-146,-8);piece(190,9,16,0,-169,-9);
  piece(224,13,17,0,82,0);piece(224,13,17,0,-82,0);piece(13,152,17,-106,0,0);piece(13,152,17,106,0,0);
  piece(204,3,19,0,76,2,brass);piece(204,3,19,0,-76,2,brass);piece(3,150,19,-101,0,2,brass);piece(3,150,19,101,0,2,brass);
  const portalSurface=new T.Mesh(new T.PlaneGeometry(200,150),new T.MeshBasicMaterial({color:0x739b91,toneMapped:false}));portalSurface.position.z=11;portalObject.add(portalSurface);
  const sign=document.createElement('canvas');sign.width=512;sign.height=128;const ink=sign.getContext('2d')!;ink.fillStyle='#e8ddbf';ink.fillRect(0,0,512,128);ink.fillStyle='#3c4e43';ink.font='48px Georgia';ink.textAlign='center';ink.textBaseline='middle';ink.fillText('Yours?',256,66);
  const signMap=new T.CanvasTexture(sign);signMap.colorSpace=T.SRGBColorSpace;
  const plaque=new T.Mesh(new T.PlaneGeometry(100,25),new T.MeshBasicMaterial({map:signMap,toneMapped:false}));plaque.position.set(0,-119,28);portalObject.add(plaque);
  const mixMaterial=new T.ShaderMaterial({uniforms:{quay:{value:quayTarget.texture},room:{value:roomTarget.texture},world:{value:worldTarget.texture},blend:{value:0},arrival:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D quay;uniform sampler2D room;uniform sampler2D world;uniform float blend;uniform float arrival;varying vec2 vUv;void main(){vec4 visit=mix(texture2D(quay,vUv),texture2D(room,vUv),blend);gl_FragColor=mix(texture2D(world,vUv),visit,arrival);\n#include <colorspace_fragment>\n}',depthTest:false,depthWrite:false,toneMapped:false});
  composite.add(new T.Mesh(new T.PlaneGeometry(2,2),mixMaterial));
  function setFrustum(camera:T.OrthographicCamera,zoom:number,x:number,y:number){Object.assign(camera,paintedFrustum(width/height,zoom,[x,y]));camera.updateProjectionMatrix();camera.updateMatrixWorld();}
  function use(value:boolean){
    if(active===value)return;active=value;
    if(root){if(value){originalParent=root.parent;contents.add(root);root.children.forEach(station=>station.rotation.set(.14,-.08,0));}else {root.children.forEach(station=>station.rotation.set(0,0,0));originalParent?.add(root);}}
  }
  function render(renderer:T.WebGLRenderer,state:VisitState,drawWorld:()=>void){
    if(!active){renderer.setRenderTarget(worldTarget);renderer.clear();drawWorld();renderer.setRenderTarget(null);arrival=0;departing=false;}
    use(true);const inside=isInside(state.place),entering=state.walking&&isInside(state.destination)&&!inside,leaving=state.walking&&!isInside(state.destination)&&inside;
    const landingAt=landingPosition(state);
    const targetBlend=entering?(landingAt>18?1:0):leaving?(landingAt<18?0:1):inside?1:0;
    const ease=state.motion?1-Math.exp(-state.dt*4):1;
    blend=T.MathUtils.lerp(blend,targetBlend,ease);if(Math.abs(blend-targetBlend)<.002)blend=targetBlend;
    const current=state.destination||state.place;
    if(current!==lastPlace){panX=panY=0;lastPlace=current;}
    const mobile=width<650;
    const wantsDoor=entering||leaving;
    const qZoom=(wantsDoor?1.25:1)*state.zoom;
    const qX=0;
    quayZoom=T.MathUtils.lerp(quayZoom,qZoom,ease);quayX=T.MathUtils.lerp(quayX,qX,ease);quayY=T.MathUtils.lerp(quayY,wantsDoor?0:0,ease);
    const reader=isReader(current)?current:null;
    const yours=current==='yours',rX=yours?610:reader?shelfCentre(reader):0;
    const rZoom=(yours?(mobile?Math.min(1.8,900*(width/height)/320):2.05):reader?(mobile?Math.min(1.7,900*(width/height)/360):1.65):1)*state.zoom;
    roomZoom=T.MathUtils.lerp(roomZoom,rZoom,ease);roomX=T.MathUtils.lerp(roomX,rX,ease);roomY=T.MathUtils.lerp(roomY,0,ease);
    settled=Math.abs(roomZoom-rZoom)<.002&&Math.abs(roomX-rX)<.5&&blend===targetBlend;
    landing.update({...state,returning:state.destination==='boat'||leaving},width,height,quayZoom,panX,panY);setFrustum(roomCamera,roomZoom,roomX,roomY);
    renderer.setRenderTarget(quayTarget);renderer.clear();renderer.render(quay,quayCamera);
    renderer.setRenderTarget(roomTarget);renderer.clear();renderer.render(room,roomCamera);
    mixMaterial.uniforms.blend.value=blend;
    arrival=state.motion?Math.min(1,arrival+state.dt*1.8):1;mixMaterial.uniforms.arrival.value=arrival;
    renderer.setRenderTarget(null);renderer.clear();renderer.render(composite,screenCamera);
  }
  function project(place:FootNode){
    const coordinates:Partial<Record<FootNode,[number,number]>>={shop:[807,361],garden:[1020,395],boat:[760,850]};
    const p=landing.projectPixel(...(coordinates[place]||[839,541]));return{x:p.x*width,y:p.y*height,visible:p.visible};
  }
  return{
    get ready(){return loaded===1&&landing.ready&&!!root;},get camera(){return roomCamera;},get settled(){return settled;},
    attach(shelves:T.Group){root=shelves;},use,render,project,
    setPortalTexture(texture:T.Texture){portalSurface.material.map=texture;portalSurface.material.color.set(0xffffff);portalSurface.material.needsUpdate=true;},
    portalRect(){const a=new T.Vector3(510,55,121).project(roomCamera),b=new T.Vector3(710,-95,121).project(roomCamera);return{x:(a.x+1)*width/2,y:(1-a.y)*height/2,w:(b.x-a.x)*width/2,h:(a.y-b.y)*height/2};},
    portalHit(x:number,y:number){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/width*2-1,1-y/height*2),roomCamera);return !!ray.intersectObject(portalObject,true).length;},
    resetView(){panX=panY=0;},
    depart(renderer:T.WebGLRenderer,dt:number,motion:boolean,drawWorld:()=>void){
      if(active){use(false);departing=true;}
      if(!departing)return false;
      arrival=motion?Math.max(0,arrival-dt*1.8):0;mixMaterial.uniforms.arrival.value=arrival;
      if(arrival<=0){departing=false;return false;}
      renderer.setRenderTarget(worldTarget);renderer.clear();drawWorld();renderer.setRenderTarget(null);renderer.clear();renderer.render(composite,screenCamera);return true;
    },
    pan(dx:number,dy:number){panX-=dx*(quayCamera.right-quayCamera.left)*100/width;panY-=dy*(quayCamera.top-quayCamera.bottom)*100/height;},
    resize(w:number,h:number,pixelRatio:number){width=w;height=h;for(const target of [quayTarget,roomTarget,worldTarget])target.setSize(Math.round(w*pixelRatio),Math.round(h*pixelRatio));},
    bookRay(x:number,y:number){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/width*2-1,1-y/height*2),roomCamera);return ray;},
    destination(x:number,y:number):WalkPlace|'boat'|null{
      const choices=['shop','garden','boat'] as const;
      return choices.find(place=>{const p=project(place);return Math.hypot(p.x-x,p.y-y)<Math.max(55,width*.10);})||null;
    },
    dispose(){dead=true;use(false);landing.dispose();light.shadow.dispose();for(const scene of [room,composite])scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});signMap.dispose();roomMap.dispose();quayTarget.dispose();roomTarget.dispose();worldTarget.dispose();},
  };
}
