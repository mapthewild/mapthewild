import * as T from 'three';
import {createModels} from './models';
import {PORTS,waterRoute,isWater,STORAGE_KEY,type Port,type Point,type WorldMemory} from './navigation';
import {FOOT_POINTS,WALK_PLACES,footRoute,isInside,type WalkPlace,type FootNode} from './ashore';
import {makeShelves,isReader,SHELF_X,type ReaderId,type ShelfReader,type BookChoice} from './shelves';
import {createPaintedVisit} from './painted-visit';

export type FootState={place:WalkPlace;walking:boolean;destination:WalkPlace|'boat'|null}|null;
type Options={memory:WorldMemory|null;onReady:()=>void;onPainted:()=>void;onArrival:(port:Port|null)=>void;onSailing:(port:Port|null)=>void;onError:()=>void;onFoot:(state:FootState)=>void;onBook:(book:BookChoice)=>void;onShelves:(readers:ShelfReader[])=>void;labels:Partial<Record<Port,HTMLElement>>;footLabels:Partial<Record<WalkPlace|'boat',HTMLElement>>};
const point=(p:Point,y=0)=>new T.Vector3(p[0],y,p[1]);
const clamp=T.MathUtils.clamp;
export function createWorld(container:HTMLElement,options:Options){
  let dirty=true;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.07;renderer.setClearColor(0x569e9b);
  renderer.domElement.setAttribute('aria-label','Three-dimensional harbour. Drag to look around, or select a destination below.');
  renderer.domElement.setAttribute('role','img');container.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x539a96);
  scene.fog=new T.Fog(0x81af9f,100,180);
  const camera=new T.PerspectiveCamera(34,1,.08,220);
  const eye=new T.Vector3(6,57,68);let wantedEye:T.Vector3|null=null,wantedFov=34;
  const look=new T.Vector3(...[0,0,3]),wantedLook=look.clone();let zoom=1,wantedZoom=1;
  const mobile=()=>container.clientWidth<650;
  if(options.memory){look.set(options.memory.look[0],0,options.memory.look[1]);wantedLook.copy(look);zoom=wantedZoom=options.memory.zoom;}
  else if(mobile()){look.set(12,0,6);wantedLook.copy(look);}
  scene.add(new T.HemisphereLight(0xe8efed,0x74786b,1.5));
  const sun=new T.DirectionalLight(0xfff7e7,2.7);sun.position.set(-25,48,25);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-50,right:50,top:45,bottom:-45,near:.5,far:130});
  sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(sun);
  const models=createModels(()=>{dirty=true;});scene.add(models.world());
  const painted=createPaintedVisit(()=>{dirty=true;if(painted.ready){options.onPainted();if(ready)presentWorld(0,true);}});
  // Reflected coastal daylight keeps the shaded room neutral, with unlit lamps.
  for(const x of [12.9,17]){const light=new T.PointLight(0xd6e3de,.75,6,1.7);light.position.set(x,3.8,4.2);scene.add(light);}
  const shelfLight=new T.PointLight(0xe7eeeb,3.7,8,1.5);shelfLight.position.set(15.1,3.5,5.6);scene.add(shelfLight);
  let shelfModels:ReturnType<typeof makeShelves>|null=null,activeBook:T.Group|null=null,pendingBook:{reader:ReaderId;id:string;vol:number}|null=null;
  const shelfAbort=new AbortController();
  fetch('/mapthewild/world/shelves.json',{signal:shelfAbort.signal}).then(r=>{if(!r.ok)throw new Error('Shelves unavailable');return r.json();}).then((data:ShelfReader[])=>{if(disposed)return;shelfModels=makeShelves(data,()=>{dirty=true;if(document.hidden&&ready&&painted.ready)presentWorld(0,true);});scene.add(shelfModels.root);painted.attach(shelfModels.root);options.onShelves(data);dirty=true;if(painted.ready){options.onPainted();if(ready)presentWorld(0,true);}}).catch(error=>{if(error.name!=='AbortError')console.warn('The shelves could not load.',error);});
  const ship=models.boat();const shipPosition:Point=options.memory?.ship||[0,20];ship.position.set(shipPosition[0],0,shipPosition[1]);ship.rotation.y=-.5;scene.add(ship);
  const visitor=models.visitor();ship.add(visitor.root);visitor.root.position.set(-.25,.7,-1);visitor.halo.visible=false;
  // A small spyglass gesture belongs to the boat; the saved walking rig is untouched.
  let inspectingShore=false,spyglassLift=0;
  const spyglass=new T.Group();spyglass.position.set(.1,1.19,.42);spyglass.visible=false;visitor.root.add(spyglass);
  const spyglassBrass=new T.MeshStandardMaterial({color:0x9b8355,roughness:.85,metalness:.15});
  for(const [radius,length,z] of [[.058,.38,0],[.077,.07,.22],[.064,.04,-.2]]){
    const tube=new T.Mesh(new T.CylinderGeometry(radius,radius,length,12),spyglassBrass);tube.rotation.x=Math.PI/2;tube.position.z=z;spyglass.add(tube);
  }
  const lens=new T.Mesh(new T.CircleGeometry(.066,16),new T.MeshBasicMaterial({color:0x466c65}));lens.position.z=.258;spyglass.add(lens);
  const travellerMaterials=new Map<T.Material,T.Material>();
  visitor.root.traverse(object=>{if(object instanceof T.Mesh&&!Array.isArray(object.material)){const original=object.material as T.Material;let local=travellerMaterials.get(original);if(!local){const created=original.clone();created.transparent=true;travellerMaterials.set(original,created);local=created;}object.material=local;}});
  let ashore:WalkPlace|null=options.memory?.ashore||null,footAt:FootNode=ashore||'boat',suspended=false;
  type FootJourney={path:T.Vector3[];lengths:number[];total:number;elapsed:number;duration:number;to:WalkPlace|'boat';openShop:boolean};
  let footTravel:FootJourney|null=null;
  if(ashore){scene.add(visitor.root);visitor.root.position.fromArray(FOOT_POINTS[ashore]);visitor.halo.visible=true;}
  let selected:Port|null=options.memory?.port||null,entered=options.memory?.entered||false;
  let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  let travel:{path:Point[];lengths:number[];total:number;elapsed:number;duration:number;port:Port|null}|null=null;
  const uniforms={time:{value:0},storm:models.storm};
  const waterMaterial=new T.ShaderMaterial({uniforms,vertexShader:`
    varying vec3 vP; uniform float time;
    void main(){ vec3 p=position; p.z+=sin(p.x*.5+time*.7)*.045+sin(p.y*.65+time*.5)*.035;
    vec4 world=modelMatrix*vec4(p,1.);vP=world.xyz; gl_Position=projectionMatrix*viewMatrix*world; }
  `,fragmentShader:`
    varying vec3 vP;uniform float time;uniform vec2 storm;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    void main(){vec2 p=vP.xz;float n=noise(p*.35+vec2(time*.016,0.));
      float shore=min(length((p-vec2(22.,3.))/vec2(19.,20.)),min(length((p-vec2(-24.,-14.))/vec2(20.,14.)),length((p-vec2(-21.,14.))/vec2(8.,7.))));
      float shallows=1.-smoothstep(.95,1.5,shore+n*.08);
      vec3 colour=mix(vec3(.018,.155,.19),vec3(.105,.44,.36),shallows);
      colour+=floor(n*4.)*.012;
      float waves=sin(p.x*1.8+p.y*.65+time*.65+sin(p.y*.8-time*.5));
      float glint=smoothstep(.984,1.,waves)*smoothstep(.61,.76,noise(p*.6-time*.02));
      colour=mix(colour,vec3(.44,.70,.58),glint*.18);
      float rain=1.-smoothstep(5.,14.,distance(p,storm));colour=mix(colour,vec3(.035,.085,.12)+colour*.17,rain*.65);
      float ring=sin(length(fract(p*.7)-.5)*38.-time*5.);colour+=vec3(.025)*smoothstep(.96,1.,ring)*rain;
      gl_FragColor=vec4(colour,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `});
  const water=new T.Mesh(new T.PlaneGeometry(200,170,140,110),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=.02;scene.add(water);
  // A visible route is left by the vessel itself, rather than a permanent graph overlay.
  const wakeCount=85,wakePositions=new Float32Array(wakeCount*3),wakeHistory:T.Vector3[]=[];
  const wakeGeometry=new T.BufferGeometry();wakeGeometry.setAttribute('position',new T.BufferAttribute(wakePositions,3));
  const wake=new T.Points(wakeGeometry,new T.PointsMaterial({color:0xd5ead9,size:.19,transparent:true,opacity:.6,depthWrite:false}));wake.frustumCulled=false;scene.add(wake);
  const makeJourney=(path:Point[],port:Port|null)=>{const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));const total=lengths.reduce((a,b)=>a+b,0);return {path,lengths,total,elapsed:0,duration:clamp(total/6,2.1,6.5),port};};
  function along(j:{path:Point[];lengths:number[];total:number},t:number){let d=clamp(t,0,1)*j.total;for(let i=0;i<j.lengths.length;i++){if(d<=j.lengths[i]||i===j.lengths.length-1){const f=j.lengths[i]?d/j.lengths[i]:0;return {p:new T.Vector3(T.MathUtils.lerp(j.path[i][0],j.path[i+1][0],f),0,T.MathUtils.lerp(j.path[i][1],j.path[i+1][1],f)),angle:Math.atan2(j.path[i+1][0]-j.path[i][0],j.path[i+1][1]-j.path[i][1])};}d-=j.lengths[i];}return {p:point(j.path[0]),angle:0};}
  const ferry=models.boat(true);scene.add(ferry);
  const ferryPath=waterRoute([...PORTS.nowbrary.point],[...PORTS.together.point])!;
  const ferryJourney=makeJourney(ferryPath,null);
  const rainCount=350,rainPositions=new Float32Array(rainCount*6),rainSeeds=Array.from({length:rainCount},(_,i)=>({x:Math.sin(i*129.7)*8,z:Math.cos(i*87.4)*7,y:(i*.171)%1}));
  const rainGeometry=new T.BufferGeometry();rainGeometry.setAttribute('position',new T.BufferAttribute(rainPositions,3));
  const rain=new T.LineSegments(rainGeometry,new T.LineBasicMaterial({color:0xc8ded4,transparent:true,opacity:.33,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
  const clouds=new T.Group();scene.add(clouds);
  for(let i=0;i<6;i++){const m=new T.Mesh(new T.IcosahedronGeometry(2.3+(i%3)*.5,1),new T.MeshBasicMaterial({color:i%2?0x57757d:0x71888a,transparent:true,opacity:.27,depthWrite:false}));m.scale.set(1.5,.32,.9);m.position.set(Math.sin(i*2.4)*5,13+(i%3)*.6,Math.cos(i*2.4)*3-2);clouds.add(m);}
  const birds:T.Group[]=[];
  for(let i=0;i<5;i++){const b=new T.Group();for(const side of [-1,1]){const g=new T.BufferGeometry().setFromPoints([new T.Vector3(0,0,0),new T.Vector3(side*.3,.07,.07),new T.Vector3(side*.6,-.1,0)]);b.add(new T.Line(g,new T.LineBasicMaterial({color:0xe2ddc3})));}birds.push(b);scene.add(b);}
  const marker=new T.Mesh(new T.RingGeometry(.7,.76,40),new T.MeshBasicMaterial({color:0xe8dfb3,transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
  function resize(){dirty=true;const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);painted.resize(w,h,renderer.getPixelRatio());camera.aspect=w/h;camera.updateProjectionMatrix();if(ashore&&!footTravel)focusFoot(ashore);}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const plane=new T.Plane(new T.Vector3(0,1,0),0),ray=new T.Raycaster();
  function ground(clientX:number,clientY:number){const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);return ray.ray.intersectPlane(plane,new T.Vector3());}
  function save(){const memory:WorldMemory={ship:[ship.position.x,ship.position.z],look:[wantedLook.x,wantedLook.z],zoom:wantedZoom,port:travel?null:selected,entered,ashore};try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(memory));}catch{}}
  function focusFoot(place:WalkPlace){
    wantedZoom=1;dirty=true;
    if(isReader(place)){
      const x=SHELF_X[place],low=place==='montaigne',bowl=place==='melville';wantedLook.set(x,bowl?2.6:low?2.0:2.25,3.48);wantedEye=new T.Vector3(x+.12,bowl?3.15:low?2.6:2.85,bowl?6.85:6.5);wantedFov=mobile()?75:bowl?62:50;
    }else if(place==='shop'){
      wantedLook.set(15.05,2.1,3.6);wantedEye=new T.Vector3(mobile()?15.2:15.5,3,6.9);wantedFov=mobile()?88:78;
    }else if(place==='garden'){
      wantedLook.set(18.4,2,8.3);wantedEye=new T.Vector3(23,7.5,23);wantedFov=mobile()?59:43;
    }else{
      wantedLook.set(14.4,2.2,6.5);wantedEye=new T.Vector3(20,9.2,23);wantedFov=mobile()?60:43;
    }
  }
  function bookRect(mesh:T.Group,book:{thick:number;tall:number;depth:number}){
    mesh.updateWorldMatrix(true,false);const size=new T.Box3().setFromObject(mesh),points:T.Vector3[]=[];
    const viewingCamera=ashore&&painted.ready?painted.camera:camera;
    for(const x of [size.min.x,size.max.x])for(const y of [size.min.y,size.max.y])points.push(new T.Vector3(x,y,size.max.z).project(viewingCamera));
    const xs=points.map(p=>(p.x+1)*container.clientWidth/2),ys=points.map(p=>(1-p.y)*container.clientHeight/2);
    return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  }
  function openBook(reader:ReaderId,id:string,vol=0){
    if(!shelfModels||footTravel)return;
    if(footAt!==reader){pendingBook={reader,id,vol};walkTo(reader);return;}
    if(painted.ready&&!painted.settled){pendingBook={reader,id,vol};return;}
    const item=shelfModels.books.find(b=>b.reader.id===reader&&b.book.id===id&&(b.book.volIndex||0)===vol);if(!item)return;
    activeBook=item.mesh;suspended=true;
    options.onBook({reader,page:item.reader.page,book:item.book,rect:bookRect(item.mesh,item.book)});
  }
  function setBookTaken(taken:boolean){if(activeBook){activeBook.visible=!taken;dirty=true;if(ashore&&painted.ready)renderPainted(0);else renderer.render(scene,camera);}}
  function closeBook(){setBookTaken(false);activeBook=null;suspended=false;dirty=true;}
  function putAboard(){
    ashore=null;footAt='boat';footTravel=null;wantedEye=null;wantedFov=34;pendingBook=null;ship.add(visitor.root);visitor.root.position.set(-.25,.7,-1);visitor.root.rotation.set(0,0,0);visitor.halo.visible=false;models.readingRoomRoof.visible=true;
    visitor.legs.forEach(leg=>leg.rotation.x=0);visitor.arms.forEach(arm=>arm.rotation.x=0);options.onFoot(null);dirty=true;
  }
  function finishWalk(){
    if(!footTravel)return;const journey=footTravel;footTravel=null;visitor.root.position.copy(journey.path.at(-1)!);visitor.legs.forEach(leg=>leg.rotation.x=0);visitor.arms.forEach(arm=>arm.rotation.x=0);marker.visible=false;
    footAt=journey.to;
    if(journey.to==='boat'){
      putAboard();selected='nowbrary';wantedLook.set(12,0,8);wantedZoom=mobile()?1.15:1.4;options.onArrival('nowbrary');
    }else{
      ashore=journey.to;focusFoot(ashore);options.onFoot({place:ashore,walking:false,destination:null});
    }
    save();dirty=true;if(!motion){presentWorld(0,true);openPending();}
  }
  function walkTo(to:WalkPlace|'boat',openShop=false){
    if(!ashore||footTravel)return;
    const route=footRoute(footAt,to),path=route.map(p=>new T.Vector3(...p));
    if(path.length===1){focusFoot(to as WalkPlace);return;}
    const lengths=path.slice(1).map((p,i)=>p.distanceTo(path[i])),total=lengths.reduce((a,b)=>a+b,0);
    footTravel={path,lengths,total,elapsed:0,duration:clamp(total/2.3,1.3,7),to,openShop};
    options.onFoot({place:ashore,walking:true,destination:to});focusFoot(to==='boat'?'quay':to);
    // Enter from the right-hand doorway before opening out to the room view.
    if(isInside(to)&&!isInside(ashore)){wantedLook.set(16.5,2.2,6.2);wantedEye=new T.Vector3(18,6.4,16);wantedFov=mobile()?60:44;}
    marker.position.copy(path.at(-1)!);marker.position.y+=.03;marker.visible=true;dirty=true;
    if(!motion)finishWalk();
  }
  function stepAshore(){
    if(travel||ashore||Math.hypot(ship.position.x-9,ship.position.z-14)>.3)return;
    ashore='quay';footAt='boat';scene.attach(visitor.root);visitor.root.position.fromArray(FOOT_POINTS.boat);visitor.halo.visible=true;
    selected='nowbrary';options.onArrival(null);walkTo('quay');
  }
  function sailTo(destination:Point,port:Port|null){dirty=true;const route=waterRoute([ship.position.x,ship.position.z],destination);if(!route)return false;if(ashore)putAboard();entered=true;selected=null;options.onSailing(port);travel=makeJourney(route,port);marker.position.set(destination[0],.13,destination[1]);marker.visible=true;
    wantedEye=null;wantedFov=34;if(port){wantedLook.set(PORTS[port].look[0]-(mobile()?0:4),0,PORTS[port].look[1]+(mobile()?3:3));wantedZoom=mobile()?1.15:1.4;}
    if(!motion){ship.position.copy(point(destination));selected=port;travel=null;marker.visible=false;options.onArrival(port);save();}return true;
  }
  const pointers=new Map<number,{x:number;y:number}>();let down:{x:number;y:number;moved:boolean}|null=null,lastPinch=0;
  function pointerDown(e:PointerEvent){renderer.domElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});down={x:e.clientX,y:e.clientY,moved:false};lastPinch=0;}
  function pointerMove(e:PointerEvent){dirty=true;if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId)!;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);if(lastPinch)wantedZoom=clamp(wantedZoom*distance/lastPinch,.72,ashore?1.35:2.2);lastPinch=distance;if(down)down.moved=true;return;}
    if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.moved=true;
    if(down?.moved){if(isInside(ashore))return;if(ashore&&painted.ready){painted.pan(e.clientX-prev.x,e.clientY-prev.y);return;}const scale=2*eye.distanceTo(look)*Math.tan(T.MathUtils.degToRad(camera.fov/2))/container.clientHeight/(wantedEye?zoom:1);wantedLook.x=clamp(wantedLook.x-(e.clientX-prev.x)*scale,-25,29);wantedLook.z=clamp(wantedLook.z-(e.clientY-prev.y)*scale*1.3,-25,24);if(wantedEye){wantedEye.x-=(e.clientX-prev.x)*scale;wantedEye.z-=(e.clientY-prev.y)*scale*1.3;}}
  }
  function pointerUp(e:PointerEvent){
    const clicked=e.type==='pointerup'&&down&&!down.moved&&pointers.size===1;pointers.delete(e.pointerId);if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);
    if(clicked&&entered){
      if(ashore&&painted.ready){
        const bounds=renderer.domElement.getBoundingClientRect(),x=e.clientX-bounds.left,y=e.clientY-bounds.top;
        if(isInside(ashore)&&!footTravel&&shelfModels){const hit=painted.bookRay(x,y).intersectObjects(shelfModels.books.map(b=>b.mesh),true)[0];if(hit){const item=shelfModels.books.find(b=>b.mesh===hit.object||b.mesh.children.includes(hit.object));if(item)openBook(item.reader.id,item.book.id,item.book.volIndex||0);}}
        else if(!footTravel){const destination=painted.destination(x,y);if(destination)walkTo(destination);}
        down=null;return;
      }
      plane.constant=ashore?-1.15:0;const p=ground(e.clientX,e.clientY);
      if(ashore&&isInside(ashore)&&!footTravel&&shelfModels){
        const hit=ray.intersectObjects(shelfModels.books.map(b=>b.mesh),true)[0];
        if(hit){const item=shelfModels.books.find(b=>b.mesh===hit.object||b.mesh.children.includes(hit.object));if(item){openBook(item.reader.id,item.book.id,item.book.volIndex||0);down=null;return;}}
      }
      if(p&&ashore&&!footTravel){const allowed=(Object.keys(WALK_PLACES) as WalkPlace[]).filter(place=>isInside(ashore)?isInside(place):!isReader(place));const nearest=allowed.sort((a,b)=>Math.hypot(FOOT_POINTS[a][0]-p.x,FOOT_POINTS[a][2]-p.z)-Math.hypot(FOOT_POINTS[b][0]-p.x,FOOT_POINTS[b][2]-p.z))[0];if(Math.hypot(FOOT_POINTS[nearest][0]-p.x,FOOT_POINTS[nearest][2]-p.z)<2.5)walkTo(nearest);}
      else if(p&&!ashore&&isWater([p.x,p.z]))sailTo([p.x,p.z],null);
    }down=null;save();
  }
  function wheel(e:WheelEvent){dirty=true;e.preventDefault();wantedZoom=clamp(wantedZoom*Math.exp(-e.deltaY*.001),.72,ashore?1.35:2.2);}
  const canvas=renderer.domElement;canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('wheel',wheel,{passive:false});
  function contextLost(e:Event){e.preventDefault();disposed=true;cancelAnimationFrame(frame);options.onError();}canvas.addEventListener('webglcontextlost',contextLost);window.addEventListener('pagehide',save);
  let last=performance.now(),time=0,frame=0,disposed=false,saveAt=0,ready=false;
  function renderPainted(dt:number,immediate=false){
    if(!ashore)return;
    painted.render(renderer,{place:ashore,at:footAt,destination:footTravel?.to||null,path:footTravel?.path.map(p=>p.toArray() as [number,number,number])||null,progress:footTravel?footTravel.elapsed/footTravel.duration:0,worldZ:visitor.root.position.z,walking:!!footTravel,time,dt,motion:motion&&!immediate,zoom:wantedZoom},()=>renderer.render(scene,camera));
  }
  function presentWorld(dt:number,immediate=false){
    const paintedActive=!!ashore&&painted.ready;
    if(paintedActive)renderPainted(dt,immediate);else if(!painted.depart(renderer,dt,motion&&!immediate,()=>renderer.render(scene,camera)))renderer.render(scene,camera);
    canvas.setAttribute('aria-label',paintedActive?(isInside(ashore)?'Illustrated Nowbrary bookshop with the original interactive shelves. Select a spine or use the book titles.':'Illustrated Nowbrary quay. Walk to the bookshop, shaded terrace or boat.'):'Three-dimensional harbour. Drag to look around, or select a destination below.');
    for(const [id,element] of Object.entries(options.footLabels||{})){if(!element)continue;
      if(paintedActive){const p=painted.project(id as FootNode);element.style.transform=`translate(-50%,-100%) translate(${p.x}px,${p.y-12}px)`;element.style.visibility=p.visible?'visible':'hidden';}
      else{const p=new T.Vector3(...FOOT_POINTS[id as FootNode]);p.y+=id==='shop'?2.2:1.3;p.project(camera);element.style.transform=`translate(-50%,-100%) translate(${(p.x+1)*container.clientWidth/2}px,${(-p.y+1)*container.clientHeight/2}px)`;element.style.visibility=!ashore||Math.abs(p.x)>.9||Math.abs(p.y)>.8?'hidden':'visible';}}
  }
  function openPending(){if(pendingBook&&!footTravel&&(!painted.ready||painted.settled)){const book=pendingBook;pendingBook=null;openBook(book.reader,book.id,book.vol);}}
  function animate(now:number){if(disposed)return;frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(suspended&&ready)return;if(document.hidden&&ready&&!dirty)return;
    if(!motion&&!travel&&!footTravel&&!dirty&&ready)return;
    if(motion)time+=dt;uniforms.time.value=time;shelfModels?.update(time);
    models.storm.value.set(-19+Math.sin(time*.025)*4,-12+Math.sin(time*.035)*3);clouds.position.set(models.storm.value.x,0,models.storm.value.y);
    for(let i=0;i<rainCount;i++){const seed=rainSeeds[i],y=((seed.y-time*.55)%1+1)%1*10;rainPositions.set([models.storm.value.x+seed.x,y,models.storm.value.y+seed.z,models.storm.value.x+seed.x-.15,y+.65,models.storm.value.y+seed.z+.08],i*6);}rainGeometry.attributes.position.needsUpdate=true;
    if(travel){travel.elapsed+=dt;let t=clamp(travel.elapsed/travel.duration,0,1);const eased=t*t*(3-2*t),state=along(travel,eased);ship.position.copy(state.p);const delta=Math.atan2(Math.sin(state.angle-ship.rotation.y),Math.cos(state.angle-ship.rotation.y));ship.rotation.y+=delta*Math.min(1,dt*5);
      if(t>=1){selected=travel.port;travel=null;marker.visible=false;options.onArrival(selected);save();}}
    if(footTravel){
      footTravel.elapsed+=dt;const t=clamp(footTravel.elapsed/footTravel.duration,0,1);let d=t*footTravel.total;
      if(isInside(footTravel.to)&&!isInside(ashore)&&visitor.root.position.z<8.6)focusFoot(footTravel.to);
      for(let i=0;i<footTravel.lengths.length;i++){
        const length=footTravel.lengths[i];if(d<=length||i===footTravel.lengths.length-1){
          const a=footTravel.path[i],b=footTravel.path[i+1];visitor.root.position.copy(a).lerp(b,length?clamp(d/length,0,1):0);
          const angle=Math.atan2(b.x-a.x,b.z-a.z),delta=Math.atan2(Math.sin(angle-visitor.root.rotation.y),Math.cos(angle-visitor.root.rotation.y));visitor.root.rotation.y+=delta*Math.min(1,dt*12);break;
        }d-=length;
      }
      const step=Math.sin(footTravel.elapsed*11)*.5;visitor.legs.forEach((leg,i)=>leg.rotation.x=step*(i?1:-1));visitor.arms.forEach((arm,i)=>arm.rotation.x=step*(i?-1:1)*.6);
      if(t>=1)finishWalk();
    }
    ship.position.y=motion?Math.sin(time*1.4)*.065:0;ship.rotation.z=motion?Math.sin(time*1.1)*.025:0;
    if(!ashore){spyglassLift=motion?T.MathUtils.lerp(spyglassLift,inspectingShore?1:0,1-Math.exp(-dt*9)):inspectingShore?1:0;spyglass.visible=spyglassLift>.35;spyglass.position.y=1.02+spyglassLift*.17;visitor.arms.forEach((arm,i)=>arm.rotation.x=-spyglassLift*(i?1.45:1.1));}else spyglass.visible=false;
    if(motion){const cycle=(time*.013)%2;const f=along(ferryJourney,cycle<1?cycle:2-cycle);ferry.position.copy(f.p);ferry.rotation.y=f.angle+(cycle>1?Math.PI:0);ferry.position.y=Math.sin(time*1.7)*.06;}
    if(motion&&travel&&time-saveAt>.045){wakeHistory.unshift(ship.localToWorld(new T.Vector3(0,.02,-1.8)));if(wakeHistory.length>wakeCount)wakeHistory.pop();saveAt=time;}
    for(let i=0;i<wakeCount;i++){const p=wakeHistory[i]||ship.position;wakePositions.set([p.x+Math.sin(i*2.4)*i*.006,.12,p.z],i*3);}wakeGeometry.attributes.position.needsUpdate=true;(wake.material as T.PointsMaterial).opacity=travel ? .5 : .14;
    birds.forEach((b,i)=>{const a=time*.075+i*1.2;b.position.set(Math.cos(a)*10,7+Math.sin(a*.7),Math.sin(a)*10+4);b.rotation.y=-a;b.children.forEach((w,j)=>w.rotation.z=Math.sin(time*3+i)*.14*(j?1:-1));});
    const eyeTarget=wantedEye||wantedLook.clone().add(new T.Vector3(6,57,65).divideScalar(wantedZoom));
    if(!motion){look.copy(wantedLook);zoom=wantedZoom;eye.copy(eyeTarget);camera.fov=wantedFov;}
    const ease=1-Math.exp(-dt*(ashore?2.0:2.5));look.lerp(wantedLook,ease);eye.lerp(eyeTarget,ease);zoom=T.MathUtils.lerp(zoom,wantedZoom,ease);camera.fov=T.MathUtils.lerp(camera.fov,wantedFov,ease);
    camera.zoom=wantedEye?zoom:1;camera.position.copy(eye);camera.lookAt(look);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    // The camera takes the traveller's place inside, without a head blocking the books.
    const distance=eye.distanceTo(visitor.root.position),travellerOpacity=ashore?T.MathUtils.smoothstep(distance,2.9,4.4):1;
    visitor.root.visible=travellerOpacity>.01;
    travellerMaterials.forEach(material=>{material.opacity=travellerOpacity;material.depthWrite=travellerOpacity>.98;});
    for(const [id,element] of Object.entries(options.labels)){if(!element)continue;const p=point(PORTS[id as Port].point,1.9).project(camera);element.style.transform=`translate(-50%,-100%) translate(${(p.x+1)*container.clientWidth/2}px,${(-p.y+1)*container.clientHeight/2}px)`;element.style.visibility=Math.abs(p.x)>1.1||Math.abs(p.y)>1.1?'hidden':'visible';}
    presentWorld(dt);
    if(ashore&&painted.ready||eye.distanceTo(eyeTarget)<.04&&look.distanceTo(wantedLook)<.04)openPending();
    dirty=false;if(!ready){ready=true;options.onReady();}
  }
  if(ashore){focusFoot(ashore);look.copy(wantedLook);eye.copy(wantedEye!);zoom=wantedZoom;camera.fov=wantedFov;}else eye.copy(look).add(new T.Vector3(6,57,65).divideScalar(zoom));
  animate(performance.now());
  return {
    go(port:Port){return sailTo([...PORTS[port].point],port);},
    stepAshore,walkTo,openBook,setBookTaken,closeBook,
    spyglass(value:boolean){
      inspectingShore=value;dirty=true;
      if(ashore)return null;
      const p=visitor.root.getWorldPosition(new T.Vector3());p.y+=1.2;p.project(camera);
      return{x:clamp((p.x+1)*container.clientWidth/2,80,container.clientWidth-80),y:clamp((1-p.y)*container.clientHeight/2,80,container.clientHeight-80)};
    },
    suspend(value:boolean){suspended=value;dirty=true;},
    enter(){entered=true;save();},
    overview(){dirty=true;if(ashore){painted.resetView();focusFoot(ashore);return;}wantedEye=null;wantedFov=34;wantedLook.set(mobile()?8:1,0,mobile()?3:0);wantedZoom=1;selected=null;travel=null;marker.visible=false;options.onArrival(null);save();},
    zoomBy(factor:number){dirty=true;wantedZoom=clamp(wantedZoom*factor,.72,ashore?1.35:2.2);},
    setMotion(value:boolean){dirty=true;motion=value;if(!value&&footTravel)finishWalk();if(!value&&travel){ship.position.copy(point(travel.path.at(-1)!));selected=travel.port;travel=null;marker.visible=false;options.onArrival(selected);save();}if(!value)presentWorld(0,true);},
    save,
    dispose(){disposed=true;shelfAbort.abort();save();cancelAnimationFrame(frame);observer.disconnect();painted.dispose();window.removeEventListener('pagehide',save);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('webglcontextlost',contextLost);const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line||o instanceof T.Points){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);if('map' in m&&m.map instanceof T.Texture)textures.add(m.map);});}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());models.gradient.dispose();renderer.dispose();canvas.remove();}
  };
}
