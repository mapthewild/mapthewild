import * as T from 'three';
import {isInside,type FootPoint,type FootNode,type WalkPlace} from './ashore';
import {createPaintedRig} from './painted-rig';
import {isReader,SHELF_X} from './shelf-data';
import {PAINTED_POINTS,SHELF_SCALE,SHELF_FLOOR,shelfCentre,paintedJourney,paintedFrustum} from './painted-layout';

type VisitState={place:WalkPlace;at:FootNode;destination:FootNode|null;path:FootPoint[]|null;progress:number;worldZ:number;walking:boolean;time:number;dt:number;motion:boolean;zoom:number};

/** Painted sets with live book meshes, a walking character and composed camera travel. */
export function createPaintedVisit(onReady:()=>void){
  const quay=new T.Scene(),room=new T.Scene(),composite=new T.Scene();
  const quayCamera=new T.OrthographicCamera(-800,800,450,-450,.1,4000);
  const roomCamera=quayCamera.clone();quayCamera.position.z=roomCamera.position.z=2000;
  const screenCamera=new T.OrthographicCamera(-1,1,1,-1,0,2);screenCamera.position.z=1;
  const quayTarget=new T.WebGLRenderTarget(1,1),roomTarget=new T.WebGLRenderTarget(1,1),worldTarget=new T.WebGLRenderTarget(1,1);
  const loader=new T.TextureLoader();let loaded=0,dead=false,root:T.Group|null=null,originalParent:T.Object3D|null=null,active=false,blend=0;
  let width=1600,height=900,lastPlace='',arrival=0,departing=false,settled=false;
  let quayZoom=1,roomZoom=1,quayX=0,roomX=0,quayY=0,roomY=0,panX=0,panY=0;
  const texture=(name:string)=>{const map=loader.load('/mapthewild/world/nowbrary/art/'+name,()=>{if(!dead){loaded++;onReady();}});map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;};
  const quayMap=texture('painted-quay-v1.png'),roomMap=texture('painted-room-v1.png');
  const waterTime={value:0};
  const plateMaterial=new T.MeshBasicMaterial({map:quayMap,toneMapped:false});
  plateMaterial.onBeforeCompile=shader=>{
    shader.uniforms.uTime=waterTime;
    shader.fragmentShader='uniform float uTime;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
      vec2 uv=vMapUv;
      // Movement belongs to the left-hand open water, away from masonry and boat.
      float water=(1.-smoothstep(.04,.23,uv.x))*smoothstep(.04,.18,uv.y)*(1.-smoothstep(.73,.85,uv.y));
      uv.x+=sin(uv.y*105.+uTime*.8)*.00055*water;
      uv.y+=sin(uv.x*160.+uTime*.6)*.00035*water;
      diffuseColor*=texture2D(map,uv);
    #endif`);
  };
  const plate=new T.Mesh(new T.PlaneGeometry(1600,900),plateMaterial);plate.position.z=-100;quay.add(plate);
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
  const traveller=createPaintedRig(()=>{if(!dead)onReady();});quay.add(traveller.root);
  quay.add(new T.HemisphereLight(0xf1eee4,0x6b735e,2.1));
  const sun=new T.DirectionalLight(0xfff2d4,2.3);sun.position.set(-500,700,900);quay.add(sun);
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
    const targetBlend=entering?(state.worldZ<7.8?1:0):leaving?(state.worldZ>7.6?0:1):inside?1:0;
    const ease=state.motion?1-Math.exp(-state.dt*4):1;
    blend=T.MathUtils.lerp(blend,targetBlend,ease);if(Math.abs(blend-targetBlend)<.002)blend=targetBlend;
    const actorPoint=state.path?paintedJourney(state.path,state.progress):PAINTED_POINTS[state.at];
    const actorScale=T.MathUtils.clamp(1+(-actorPoint[1]-100)*.0007,.8,1.2);
    traveller.update(actorPoint,80*actorScale,state.walking,state.dt,state.motion,blend<.92);
    const current=state.destination||state.place;
    if(current!==lastPlace){panX=panY=0;lastPlace=current;}
    const mobile=width<650;
    const wantsDoor=entering||leaving;
    const qZoom=(wantsDoor?1.5:state.place==='garden'?1.25:1)*state.zoom;
    const qX=wantsDoor?(mobile?actorPoint[0]*.65+270*.35:270):state.place==='garden'?470:mobile?actorPoint[0]:0;
    quayZoom=T.MathUtils.lerp(quayZoom,qZoom,ease);quayX=T.MathUtils.lerp(quayX,qX,ease);quayY=T.MathUtils.lerp(quayY,wantsDoor?0:0,ease);
    const reader=isReader(current)?current:null;
    const rZoom=(reader?(mobile?Math.min(1.7,900*(width/height)/360):1.65):1)*state.zoom;
    roomZoom=T.MathUtils.lerp(roomZoom,rZoom,ease);roomX=T.MathUtils.lerp(roomX,reader?shelfCentre(reader):0,ease);roomY=T.MathUtils.lerp(roomY,reader?0:0,ease);
    settled=Math.abs(roomZoom-rZoom)<.002&&Math.abs(roomX-(reader?shelfCentre(reader):0))<.5&&blend===targetBlend;
    setFrustum(quayCamera,quayZoom,quayX+panX,quayY+panY);setFrustum(roomCamera,roomZoom,roomX,roomY);
    waterTime.value=state.time;
    renderer.setRenderTarget(quayTarget);renderer.clear();renderer.render(quay,quayCamera);
    renderer.setRenderTarget(roomTarget);renderer.clear();renderer.render(room,roomCamera);
    mixMaterial.uniforms.blend.value=blend;
    arrival=state.motion?Math.min(1,arrival+state.dt*1.8):1;mixMaterial.uniforms.arrival.value=arrival;
    renderer.setRenderTarget(null);renderer.clear();renderer.render(composite,screenCamera);
  }
  function project(place:FootNode){const p=new T.Vector3(...PAINTED_POINTS[place],0).project(quayCamera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2,visible:Math.abs(p.x)<.95&&Math.abs(p.y)<.85};}
  return{
    get ready(){return loaded===2&&traveller.ready&&!!root;},get camera(){return roomCamera;},get settled(){return settled;},
    attach(shelves:T.Group){root=shelves;},use,render,project,
    resetView(){panX=panY=0;},
    depart(renderer:T.WebGLRenderer,dt:number,motion:boolean,drawWorld:()=>void){
      if(active){use(false);departing=true;}
      if(!departing)return false;
      arrival=motion?Math.max(0,arrival-dt*1.8):0;mixMaterial.uniforms.arrival.value=arrival;
      if(arrival<=0){departing=false;return false;}
      renderer.setRenderTarget(worldTarget);renderer.clear();drawWorld();renderer.setRenderTarget(null);renderer.clear();renderer.render(composite,screenCamera);return true;
    },
    pan(dx:number,dy:number){panX-=dx*(quayCamera.right-quayCamera.left)/width;panY+=dy*(quayCamera.top-quayCamera.bottom)/height;},
    resize(w:number,h:number,pixelRatio:number){width=w;height=h;for(const target of [quayTarget,roomTarget,worldTarget])target.setSize(Math.round(w*pixelRatio),Math.round(h*pixelRatio));},
    bookRay(x:number,y:number){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/width*2-1,1-y/height*2),roomCamera);return ray;},
    destination(x:number,y:number):WalkPlace|'boat'|null{
      const ndc=new T.Vector3(x/width*2-1,1-y/height*2,0).unproject(quayCamera);
      if(Math.abs(ndc.x-270)<170&&Math.abs(ndc.y-10)<170)return'shop';
      if(ndc.x>480&&ndc.y<20&&ndc.y> -270)return'garden';
      if(ndc.x< -230&&ndc.y< -220)return'boat';
      return null;
    },
    dispose(){dead=true;use(false);traveller.dispose();light.shadow.dispose();for(const scene of [quay,room,composite])scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});quayMap.dispose();roomMap.dispose();quayTarget.dispose();roomTarget.dispose();worldTarget.dispose();},
  };
}
