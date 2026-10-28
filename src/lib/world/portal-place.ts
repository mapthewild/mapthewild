import * as T from 'three';
import {isPortalDestination,portalViewAllowed,portalViewPose,portalWalk,portalWalkPoint,PORTAL_PREVIEW,PORTAL_VIEWS,type HouseView,type PortalDestination,type PortalPhase,type PortalWalk,type PortalView,type PortalViewState} from './portal-garden';
import {createHousePalette,disposeHousePalette} from './reading-house-materials';
import {createReadingHouseArchitecture} from './reading-house-architecture';
import {createReadingHouseProps} from './reading-house-props';
import {createFutureDadsPlace} from './future-dads-place';

type Callbacks={onReady?:()=>void;onError?:(message:string)=>void;onDirty?:()=>void};
/** The same locally authored reading house fills the miniature and the visit. */
function createReadingHousePlace(renderer:T.WebGLRenderer,callbacks:Callbacks={}){
  const scene=new T.Scene();scene.name='Reading house';scene.background=new T.Color(0x93bfcd);
  const camera=new T.PerspectiveCamera(PORTAL_PREVIEW.fov,4/3,.05,100),previewCamera=camera.clone();
  previewCamera.position.fromArray(PORTAL_PREVIEW.eye);previewCamera.lookAt(new T.Vector3(...PORTAL_PREVIEW.look));previewCamera.updateMatrixWorld();
  const target=new T.WebGLRenderTarget(PORTAL_PREVIEW.width,PORTAL_PREVIEW.height,{depthBuffer:true,stencilBuffer:false});
  target.texture.name='Yours? reading house preview';target.texture.colorSpace=T.LinearSRGBColorSpace;
  const palette=createHousePalette(),architecture=createReadingHouseArchitecture(palette),props=createReadingHouseProps(palette);
  scene.add(architecture,props.root);
  const {objects,lampLight,bulbMaterial}=props;
  scene.add(new T.HemisphereLight(0xe9f1ed,0x79634b,1.2));
  const sun=new T.DirectionalLight(0xffe5b6,3.3);sun.position.set(-3,11,3);sun.target.position.set(0,0,-1);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.camera.near=.5;sun.shadow.camera.far=36;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.autoUpdate=false;
  let ready=true,error:string|null=null,disposed=false,time=0,lampOn=true,shadowDirty=true;
  let view:HouseView='garden',yaw=0,pitch=0,zoom=1;
  let walk:(PortalWalk&{elapsed:number})|null=null;
  const eye=new T.Vector3(...PORTAL_VIEWS.garden.eye),look=new T.Vector3(...PORTAL_VIEWS.garden.look),wantedEye=eye.clone(),wantedLook=look.clone();
  const viewport=new T.Vector4();
  const dirty=()=>{if(!disposed)callbacks.onDirty?.();};
  // Let the caller retain this object before callbacks inspect its readiness.
  queueMicrotask(()=>{if(!disposed&&ready){callbacks.onReady?.();dirty();}});
  function fail(cause:unknown){if(disposed||error)return;error='The reading house could not be drawn. You can return to the bookshop.';ready=false;callbacks.onError?.(error);console.warn('Yours? reading house renderer:',cause);dirty();}
  function animate(dt:number,motion:boolean){
    if(motion)time+=Math.min(.05,Math.max(0,dt));
    lampLight.intensity=lampOn?(motion?2.2+Math.sin(time*2.7)*.035:2.2):0;
    bulbMaterial.color.setHex(lampOn?0xffd591:0xa48d69);
  }
  function targetPose(){const pose=portalViewPose({view,yaw,pitch,zoom});wantedEye.copy(pose.eye);wantedLook.copy(pose.look);}
  function fullCamera(dt:number,motion:boolean,progress:number){
    targetPose();
    const step=Math.min(.05,Math.max(0,dt)),ease=motion?1-Math.exp(-step*4):1;
    if(!motion){walk=null;eye.copy(wantedEye);look.copy(wantedLook);}
    else if(walk){
      // Pause the walk with the page, book, or reversing portal transition.
      const advance=progress>=.999?step:0;
      if(advance>0){
        walk.elapsed=Math.min(walk.duration,walk.elapsed+advance);
        const distance=walk.length*T.MathUtils.smoothstep(walk.elapsed/walk.duration,0,1);
        eye.copy(portalWalkPoint(walk,distance));
        const ahead=portalWalkPoint(walk,Math.min(walk.length,distance+1.1));
        const direction=ahead.sub(eye);
        if(direction.lengthSq()<.001)direction.copy(wantedLook).sub(eye);
        const angle=new T.Spherical().setFromVector3(direction.normalize());angle.theta+=yaw;angle.phi=T.MathUtils.clamp(angle.phi-pitch,.2,Math.PI-.2);angle.radius=3.2;
        const walkingLook=eye.clone().add(new T.Vector3().setFromSpherical(angle));walkingLook.y-=.35;
        walkingLook.lerp(wantedLook,1-T.MathUtils.smoothstep(walk.length-distance,0,1.4));
        look.lerp(walkingLook,1-Math.exp(-advance*6));
        if(walk.elapsed===walk.duration)walk=null;
      }
    }else{eye.lerp(wantedEye,ease);look.lerp(wantedLook,ease);}
    const t=T.MathUtils.smoothstep(T.MathUtils.clamp(progress,0,1),0,1);
    camera.position.fromArray(PORTAL_PREVIEW.eye).lerp(eye,t);
    const targetLook=new T.Vector3(...PORTAL_PREVIEW.look).lerp(look,t);camera.lookAt(targetLook);
    renderer.getCurrentViewport(viewport);camera.aspect=Math.max(1,viewport.z)/Math.max(1,viewport.w);
    // A phone sees a wider angle from the same place, not a camera outside the wall.
    const visitFov=T.MathUtils.clamp((camera.aspect<.8?72:60)/Math.sqrt(zoom),44,84);
    camera.fov=T.MathUtils.lerp(PORTAL_PREVIEW.fov,visitFov,t);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function draw(activeCamera:T.PerspectiveCamera){
    const shadows=renderer.shadowMap,oldEnabled=shadows.enabled,oldAuto=shadows.autoUpdate,oldNeeds=shadows.needsUpdate,oldType=shadows.type;
    try{
      shadows.enabled=true;shadows.type=T.PCFShadowMap;shadows.autoUpdate=false;shadows.needsUpdate=shadowDirty;sun.shadow.needsUpdate=shadowDirty;
      renderer.render(scene,activeCamera);shadowDirty=false;
    }finally{shadows.enabled=oldEnabled;shadows.autoUpdate=oldAuto;shadows.needsUpdate=oldNeeds;shadows.type=oldType;}
  }
  return {
    texture:target.texture,objects,
    get ready(){return ready;},get error(){return error;},get splatCount(){return 0;},
    get travelling(){return walk!==null;},
    renderPreview(dt:number,motion:boolean){
      if(disposed)return;animate(dt,motion);
      const previous=renderer.getRenderTarget(),oldViewport=renderer.getViewport(new T.Vector4()),oldScissor=renderer.getScissor(new T.Vector4()),oldTest=renderer.getScissorTest(),oldAuto=renderer.autoClear;
      // Render-target viewports already use physical pixels, including on Retina.
      try{renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.autoClear=true;draw(previewCamera);}catch(cause){fail(cause);}finally{renderer.setRenderTarget(previous);renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldTest);renderer.autoClear=oldAuto;}
    },
    renderFull(dt:number,motion:boolean,entryProgress=1){
      if(disposed)return;animate(dt,motion);fullCamera(dt,motion,entryProgress);
      try{draw(camera);}catch(cause){fail(cause);}
    },
    resize(width:number,height:number){camera.aspect=Math.max(1,width)/Math.max(1,height);camera.updateProjectionMatrix();dirty();},
    pan(dx:number,dy:number){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;yaw=T.MathUtils.clamp(yaw-dx*.003,-.95,.95);pitch=T.MathUtils.clamp(pitch-dy*.002,-.3,.25);dirty();},
    zoomBy(factor:number){if(Number.isFinite(factor)&&factor>0){zoom=T.MathUtils.clamp(zoom*factor,.65,1.8);dirty();}},
    setView(next:PortalView){
      if(next==='island'||!Object.hasOwn(PORTAL_VIEWS,next))return;
      if(next!==view)walk={...portalWalk(eye,next),elapsed:0};
      view=next;yaw=pitch=0;zoom=1;dirty();
    },
    getViewState():PortalViewState{return {view,yaw,pitch,zoom};},
    restoreView(state:PortalViewState){
      if(state.view==='island'||!Object.hasOwn(PORTAL_VIEWS,state.view)||![state.yaw,state.pitch,state.zoom].every(Number.isFinite))return;
      view=state.view;yaw=T.MathUtils.clamp(state.yaw,-.95,.95);pitch=T.MathUtils.clamp(state.pitch,-.3,.25);zoom=T.MathUtils.clamp(state.zoom,.65,1.8);
      walk=null;targetPose();eye.copy(wantedEye);look.copy(wantedLook);dirty();
    },
    toggleLamp(){lampOn=!lampOn;dirty();return lampOn;},
    dispose(){
      if(disposed)return;disposed=true;target.dispose();
      const paletteMaterials=new Set<T.Material>();
      for(const value of Object.values(palette))for(const item of Array.isArray(value)?value:[value])if(item instanceof T.Material)paletteMaterials.add(item);
      const geometries=new Set<T.BufferGeometry>(),extraMaterials=new Set<T.Material>(),extraTextures=new Set<T.Texture>(),paletteTextures=new Set<T.Texture>();
      for(const material of paletteMaterials)for(const value of Object.values(material))if(value instanceof T.Texture)paletteTextures.add(value);
      scene.traverse(object=>{
        if(object instanceof T.InstancedMesh)object.dispose();
        if(object instanceof T.Mesh||object instanceof T.Line||object instanceof T.Points){
          geometries.add(object.geometry);
          for(const material of Array.isArray(object.material)?object.material:[object.material])if(!paletteMaterials.has(material))extraMaterials.add(material);
        }
        if(object instanceof T.DirectionalLight||object instanceof T.PointLight||object instanceof T.SpotLight)object.shadow.dispose();
      });
      for(const material of extraMaterials)for(const value of Object.values(material))if(value instanceof T.Texture&&!paletteTextures.has(value))extraTextures.add(value);
      geometries.forEach(geometry=>geometry.dispose());extraMaterials.forEach(material=>material.dispose());extraTextures.forEach(texture=>texture.dispose());disposeHousePalette(palette);scene.clear();
    },
  };
}

/** A separate authored destination, with its own camera and no house stair route. */
function createFutureDadsRenderer(renderer:T.WebGLRenderer,callbacks:Callbacks={}){
  let disposed=false,error:string|null=null,shadowDirty=true;
  const dirty=()=>{if(!disposed)callbacks.onDirty?.();};
  const place=createFutureDadsPlace(()=>{if(place.artworkError)callbacks.onError?.(place.artworkError);dirty();}),{scene,preview,views}=place;
  // Portrait island framing can place the eye beyond 120m at full zoom. Keep
  // the pavilion, rear shoreline and fog inside the depth range as well as XY.
  const camera=new T.PerspectiveCamera(preview.fov,4/3,.05,240),previewCamera=camera.clone();
  previewCamera.position.fromArray(preview.eye);previewCamera.lookAt(new T.Vector3(...preview.look));previewCamera.updateMatrixWorld();
  const target=new T.WebGLRenderTarget(PORTAL_PREVIEW.width,PORTAL_PREVIEW.height,{depthBuffer:true,stencilBuffer:false});
  target.texture.name='Yours? Future Dads Club preview';target.texture.colorSpace=T.LinearSRGBColorSpace;
  let view:Exclude<PortalView,'upstairs'>='garden',yaw=0,pitch=0,zoom=1;
  let walk:(PortalWalk&{elapsed:number})|null=null;
  const eye=new T.Vector3(...views.garden.eye),look=new T.Vector3(...views.garden.look),viewport=new T.Vector4(),ray=new T.Raycaster();
  const pose=()=>portalViewPose({view,yaw,pitch,zoom},views[view],view==='island'?3:.45);
  function approach(next:Exclude<PortalView,'upstairs'>){
    const [outer,inner]=place.approach.map(point=>new T.Vector3(...point)),entrance=new T.Vector3(...views.garden.eye),goal=new T.Vector3(...views[next].eye);
    // Classifying the current point along the open approach also makes a turn
    // back midway retrace the corridor, rather than cutting through the roof.
    const outside=eye.z>outer.z+.01,byLandfall=eye.z>inner.z+.01,byEntrance=eye.z>entrance.z+.01;
    const intermediate=next==='island'?(outside?[]:byLandfall?[outer]:byEntrance?[inner,outer]:[entrance,inner,outer]):outside?[outer,inner,entrance]:byLandfall?[inner,entrance]:byEntrance?[entrance]:[];
    const candidates=[eye,...intermediate,goal],points=candidates.filter((point,i)=>i===0||point.distanceTo(candidates[i-1])>.02).map(point=>point.clone());
    const lengths=points.slice(1).map((point,i)=>point.distanceTo(points[i])),length=lengths.reduce((sum,n)=>sum+n,0);
    return {points,lengths,length,duration:T.MathUtils.clamp(length/6,1,6.5),elapsed:0};
  }
  function draw(activeCamera:T.PerspectiveCamera){
    const shadows=renderer.shadowMap,old={enabled:shadows.enabled,autoUpdate:shadows.autoUpdate,needsUpdate:shadows.needsUpdate,type:shadows.type};
    try{
      shadows.enabled=true;shadows.type=T.PCFShadowMap;shadows.autoUpdate=false;shadows.needsUpdate=shadowDirty;
      scene.traverse(object=>{if(object instanceof T.DirectionalLight||object instanceof T.SpotLight||object instanceof T.PointLight)object.shadow.needsUpdate=shadowDirty;});
      renderer.render(scene,activeCamera);shadowDirty=false;
    }finally{Object.assign(shadows,old);}
  }
  function fail(cause:unknown){if(disposed||error)return;error='Future Dads Club could not be drawn. You can return to the bookshop.';callbacks.onError?.(error);console.warn('Yours? Future Dads Club renderer:',cause);dirty();}
  queueMicrotask(()=>{if(!disposed){callbacks.onReady?.();dirty();}});
  return {
    texture:target.texture,objects:place.objects,
    get ready(){return !error;},get error(){return error||place.artworkError||null;},get splatCount(){return 0;},get travelling(){return walk!==null;},
    renderPreview(_dt:number,_motion:boolean){
      if(disposed)return;
      const previous=renderer.getRenderTarget(),oldViewport=renderer.getViewport(new T.Vector4()),oldScissor=renderer.getScissor(new T.Vector4()),oldTest=renderer.getScissorTest(),oldAuto=renderer.autoClear;
      try{renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.autoClear=true;draw(previewCamera);}catch(cause){fail(cause);}finally{renderer.setRenderTarget(previous);renderer.setViewport(oldViewport);renderer.setScissor(oldScissor);renderer.setScissorTest(oldTest);renderer.autoClear=oldAuto;}
    },
    renderFull(dt:number,motion:boolean,entryProgress=1){
      if(disposed)return;
      const wanted=pose(),step=Math.max(0,Math.min(dt,.05)),ease=motion?1-Math.exp(-step*4):1;
      // A closing aperture freezes the destination view until it is entered again.
      if(!motion){walk=null;eye.copy(wanted.eye);look.copy(wanted.look);}
      else if(entryProgress>=.999){
        if(walk){walk.elapsed=Math.min(walk.duration,walk.elapsed+step);eye.copy(portalWalkPoint(walk,walk.length*T.MathUtils.smoothstep(walk.elapsed/walk.duration,0,1)));if(walk.elapsed===walk.duration)walk=null;}
        else eye.lerp(wanted.eye,ease);
        look.lerp(wanted.look,ease);
      }
      const t=T.MathUtils.smoothstep(T.MathUtils.clamp(entryProgress,0,1),0,1);
      camera.position.fromArray(preview.eye).lerp(eye,t);const targetLook=new T.Vector3(...preview.look).lerp(look,t);
      renderer.getCurrentViewport(viewport);camera.aspect=Math.max(1,viewport.z)/Math.max(1,viewport.w);
      const visitFov=T.MathUtils.clamp((camera.aspect<.8?72:preview.fov)/Math.sqrt(zoom),44,84);
      camera.fov=T.MathUtils.lerp(preview.fov,visitFov,t);
      // Only the distant island view gains portrait distance. Interior cameras
      // remain at human scale; a return follows the same continuous approach.
      const fit=Math.max(1,(4/3)/camera.aspect*Math.tan(T.MathUtils.degToRad(preview.fov/2))/Math.tan(T.MathUtils.degToRad(visitFov/2)));
      const fitWeight=camera.aspect<.8?t*T.MathUtils.smoothstep(eye.y,4,12):0;
      camera.position.sub(targetLook).multiplyScalar(T.MathUtils.lerp(1,fit,fitWeight)).add(targetLook);camera.lookAt(targetLook);
      camera.updateProjectionMatrix();camera.updateMatrixWorld();
      try{draw(camera);}catch(cause){fail(cause);}
    },
    resize(width:number,height:number){camera.aspect=Math.max(1,width)/Math.max(1,height);camera.updateProjectionMatrix();dirty();},
    pan(dx:number,dy:number){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;yaw=T.MathUtils.clamp(yaw-dx*.003,-.95,.95);pitch=T.MathUtils.clamp(pitch-dy*.002,-.3,.25);dirty();},
    zoomBy(factor:number){if(Number.isFinite(factor)&&factor>0){zoom=T.MathUtils.clamp(zoom*factor,.65,1.8);dirty();}},
    setView(next:PortalView){if(!portalViewAllowed('future-dads',next)||next==='upstairs')return;if(next!==view&&(next==='island'||view==='island'||walk))walk=approach(next);view=next;yaw=pitch=0;zoom=1;dirty();},
    getViewState():PortalViewState{return {view,yaw,pitch,zoom};},
    restoreView(state:PortalViewState){
      if(!portalViewAllowed('future-dads',state.view)||state.view==='upstairs'||![state.yaw,state.pitch,state.zoom].every(Number.isFinite))return;
      view=state.view;yaw=T.MathUtils.clamp(state.yaw,-.95,.95);pitch=T.MathUtils.clamp(state.pitch,-.3,.25);zoom=T.MathUtils.clamp(state.zoom,.65,1.8);
      walk=null;const wanted=pose();eye.copy(wanted.eye);look.copy(wanted.look);dirty();
    },
    listenHit(x:number,y:number){scene.updateMatrixWorld(true);ray.setFromCamera(new T.Vector2(x,y),camera);return ray.intersectObject(place.objects.listen,true).length>0;},
    toggleLamp(){return false;},
    dispose(){if(disposed)return;disposed=true;target.dispose();place.dispose();},
  };
}

/** A frame keeps each destination alive; changing its selection never changes the source room. */
export function createPortalPlace(renderer:T.WebGLRenderer,callbacks:Callbacks={},initial:PortalDestination='reading-house'){
  type Place=ReturnType<typeof createReadingHousePlace>|ReturnType<typeof createFutureDadsRenderer>;
  const places=new Map<PortalDestination,Place>();let destination=initial,disposed=false,width=1,height=1;
  function getPlace(){
    let place=places.get(destination);
    if(!place){
      const id=destination,localCallbacks:Callbacks={onReady:()=>{if(!disposed&&destination===id)callbacks.onReady?.();},onError:message=>{if(!disposed&&destination===id)callbacks.onError?.(message);},onDirty:()=>{if(!disposed&&destination===id)callbacks.onDirty?.();}};
      place=id==='future-dads'?createFutureDadsRenderer(renderer,localCallbacks):createReadingHousePlace(renderer,localCallbacks);
      places.set(id,place);place.resize(width,height);
    }
    return place;
  }
  getPlace();
  return {
    get destination(){return destination;},get texture(){return getPlace().texture;},get objects():Record<string,T.Object3D>{return getPlace().objects;},
    get ready(){return getPlace().ready;},get error(){return getPlace().error;},get splatCount(){return 0;},get travelling(){return getPlace().travelling;},
    setDestination(next:PortalDestination,phase:PortalPhase='closed'){if(disposed||phase!=='closed'||!isPortalDestination(next))return false;destination=next;getPlace();callbacks.onDirty?.();return true;},
    renderPreview(dt:number,motion:boolean){if(!disposed)getPlace().renderPreview(dt,motion);},
    renderFull(dt:number,motion:boolean,progress=1){if(!disposed)getPlace().renderFull(dt,motion,progress);},
    resize(w:number,h:number){width=w;height=h;for(const place of places.values())place.resize(w,h);},
    pan(dx:number,dy:number){if(!disposed)getPlace().pan(dx,dy);},zoomBy(factor:number){if(!disposed)getPlace().zoomBy(factor);},
    setView(view:PortalView){if(!disposed)getPlace().setView(view);},getViewState(){return getPlace().getViewState();},restoreView(state:PortalViewState){if(!disposed)getPlace().restoreView(state);},
    listenHit(x:number,y:number){const place=getPlace();return !disposed&&'listenHit' in place&&place.listenHit(x,y);},
    toggleLamp(){return !disposed&&getPlace().toggleLamp();},
    dispose(){if(disposed)return;disposed=true;for(const place of places.values())place.dispose();places.clear();},
  };
}
