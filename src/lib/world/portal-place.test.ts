import {afterEach,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {createPortalPlace} from './portal-place';
import {PORTAL_VIEWS} from './portal-garden';

vi.mock('./reading-house-materials',async()=>{
  const three=await import('three');
  return {
    createHousePalette:()=>({plaster:new three.MeshStandardMaterial({color:0xddd0b0}),timber:new three.MeshStandardMaterial({color:0x745335}),bookMaterials:[]}),
    disposeHousePalette:(palette:Record<string,unknown>)=>{for(const value of Object.values(palette))if(value instanceof three.Material)value.dispose();},
  };
});
vi.mock('./reading-house-architecture',async()=>{
  const three=await import('three');
  return {createReadingHouseArchitecture:(palette:{plaster:T.Material})=>{
    const root=new three.Group();root.name='Reading house architecture';root.add(new three.InstancedMesh(new three.BoxGeometry(12,.2,14),palette.plaster,1));return root;
  }};
});
vi.mock('./reading-house-props',async()=>{
  const three=await import('three');
  return {createReadingHouseProps:(palette:{timber:T.Material})=>{
    const root=new three.Group(),bench=new three.Group(),shelf=new three.Group(),lamp=new three.Group();
    bench.name='Reading bench';shelf.name='House bookshelf';lamp.name='Reading lamp';
    const geometry=new three.BoxGeometry(1,1,1);bench.add(new three.Mesh(geometry,palette.timber));shelf.add(new three.Mesh(geometry,palette.timber));
    const bulbMaterial=new three.MeshBasicMaterial({color:0xffd591});lamp.add(new three.Mesh(new three.SphereGeometry(.05),bulbMaterial));
    const lampLight=new three.PointLight(0xffd591,2.2);lamp.add(lampLight);root.add(bench,shelf,lamp);
    return {root,objects:{bench,shelf,lamp},lampLight,bulbMaterial};
  }};
});
vi.mock('./future-dads-place',async()=>{
  const three=await import('three');
  return {createFutureDadsPlace:()=>{
    const scene=new three.Scene();scene.name='Future Dads Club';
    const listen=new three.Group(),geometry=new three.BoxGeometry(1,1,1),material=new three.MeshStandardMaterial();listen.name='Listening console';
    listen.add(new three.Mesh(geometry,material));listen.position.set(0,1.45,-1.1);scene.add(listen);
    return {scene,objects:{listen},
      preview:{eye:[0,1.9,6.55],look:[0,1.5,-1.25],fov:57},
      views:{garden:{eye:[0,1.75,5.7],look:[0,1.45,-1.1]},bench:{eye:[-2.8,1.3,1.8],look:[.25,1.15,-.8]},shelf:{eye:[3.4,1.6,.2],look:[1.45,1.25,-2.65]},island:{eye:[23,15,29],look:[0,.8,0]}},
      approach:[[3.8,4,12.5],[0,1.75,8.2]],
      dispose:()=>{geometry.dispose();material.dispose();scene.clear();},
    };
  }};
});

function rendererHarness(pixelRatio=1){
  let target:T.WebGLRenderTarget|null=new T.WebGLRenderTarget(32,32),scissorTest=true;
  const viewport=new T.Vector4(11,22,800,600),scissor=new T.Vector4(13,24,700,500),currentViewport=viewport.clone().multiplyScalar(pixelRatio).round();
  const shadowMap={enabled:false,autoUpdate:true,needsUpdate:false,type:T.BasicShadowMap};
  const renders:{scene:T.Scene;camera:T.PerspectiveCamera;pixels:number[];shadows:typeof shadowMap}[]=[];
  const draw=vi.fn((scene:T.Scene,camera:T.PerspectiveCamera)=>renders.push({scene,camera:camera.clone(),pixels:currentViewport.toArray(),shadows:{...shadowMap}}));
  const renderer={
    autoClear:false,shadowMap,
    getRenderTarget:()=>target,setRenderTarget:(next:T.WebGLRenderTarget|null)=>{target=next;currentViewport.copy(next?next.viewport:viewport.clone().multiplyScalar(pixelRatio).floor());},
    getViewport:(out:T.Vector4)=>out.copy(viewport),getScissor:(out:T.Vector4)=>out.copy(scissor),
    getCurrentViewport:(out:T.Vector4)=>out.copy(currentViewport),
    setViewport:(first:T.Vector4|number,y?:number,width?:number,height?:number)=>{typeof first==='number'?viewport.set(first,y!,width!,height!):viewport.copy(first);currentViewport.copy(viewport).multiplyScalar(pixelRatio).round();},
    setScissor:(next:T.Vector4)=>{scissor.copy(next);},
    getScissorTest:()=>scissorTest,setScissorTest:(next:boolean)=>{scissorTest=next;},render:draw,
  } as unknown as T.WebGLRenderer;
  return {renderer,draw,renders,viewport,scissor,originalTarget:target};
}

afterEach(()=>{vi.restoreAllMocks();});

describe('reading house rendering boundary',()=>{
  it('walks Upstairs through the stair, freezes on pause, and returns down the same stair',()=>{
    const h=rendererHarness(),place=createPortalPlace(h.renderer);place.renderFull(0,false,1);place.setView('upstairs');
    for(let i=0;i<60;i++)place.renderFull(.05,true,1);
    const stopped=h.renders.at(-1)!.camera;
    expect(place.travelling).toBe(true);
    for(let i=0;i<4;i++)place.renderFull(0,true,1);
    expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(stopped.position.toArray());expect(h.renders.at(-1)!.camera.quaternion.toArray()).toEqual(stopped.quaternion.toArray());
    place.renderFull(.05,true,.6);const reversing=h.renders.at(-1)!;place.renderFull(0,true,1);
    expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(stopped.position.toArray());
    place.zoomBy(1.8);place.renderFull(0,true,1);
    expect(place.travelling).toBe(true);expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(stopped.position.toArray());expect(h.renders.at(-1)!.camera.fov).toBeLessThan(stopped.fov);
    for(let i=0;i<120;i++)place.renderFull(.05,true,1);
    expect(place.travelling).toBe(false);
    const ascent=h.renders.filter(render=>render!==reversing&&render.camera.position.y>2.5&&render.camera.position.y<4.4);
    expect(ascent.length).toBeGreaterThan(8);
    for(const {camera} of ascent)expect(camera.position.x).toBeCloseTo(4,8);
    const returnStart=h.renders.length;place.setView('bench');for(let i=0;i<180;i++)place.renderFull(.05,true,1);
    const descent=h.renders.slice(returnStart).filter(render=>render.camera.position.y>2.5&&render.camera.position.y<4.4);
    expect(descent.length).toBeGreaterThan(8);for(const {camera} of descent)expect(camera.position.x).toBeCloseTo(4,8);
    expect(place.travelling).toBe(false);expect(h.renders.at(-1)!.camera.position.distanceTo(new T.Vector3(...PORTAL_VIEWS.bench.eye))).toBeLessThan(.001);
    place.dispose();h.originalTarget.dispose();
  });
  it('uses a safe immediate viewpoint for reduced motion and cancels an old route on memory restore',()=>{
    const h=rendererHarness(),place=createPortalPlace(h.renderer);place.setView('upstairs');place.renderFull(0,false,1);
    expect(place.travelling).toBe(false);expect(h.renders.at(-1)!.camera.position.distanceTo(new T.Vector3(...PORTAL_VIEWS.upstairs.eye))).toBeLessThan(.0001);
    place.setView('garden');place.renderFull(.05,true,1);expect(place.travelling).toBe(true);
    place.restoreView({view:'bench',yaw:0,pitch:0,zoom:1});place.renderFull(0,true,1);
    expect(place.travelling).toBe(false);expect(h.renders.at(-1)!.camera.position.distanceTo(new T.Vector3(...PORTAL_VIEWS.bench.eye))).toBeLessThan(.0001);
    place.dispose();h.originalTarget.dispose();
  });
  it('keeps the phone visitor in the room instead of fitting the house from outside',()=>{
    const h=rendererHarness(1.65),place=createPortalPlace(h.renderer);
    place.renderFull(0,false,1);const desktop=h.renders.at(-1)!.camera;
    for(const [width,height] of [[390,844],[320,568]]){
      h.renderer.setViewport(0,0,width,height);place.setView('garden');place.renderFull(0,false,1);
      const phone=h.renders.at(-1)!.camera;
      expect(phone.position.toArray()).toEqual(desktop.position.toArray());expect(phone.fov).toBeGreaterThan(desktop.fov);
      place.zoomBy(1.8);place.renderFull(0,false,1);
      expect(h.renders.at(-1)!.camera.fov).toBeLessThan(phone.fov);
      expect(h.renders.at(-1)!.camera.position.distanceTo(phone.position)).toBeLessThan(.5);
      place.setView('bench');place.renderFull(0,false,1);
      expect(h.renders.at(-1)!.camera.position.distanceTo(new T.Vector3(...PORTAL_VIEWS.bench.eye))).toBeLessThan(.0001);
    }
    place.dispose();h.originalTarget.dispose();
  });
  it('uses target pixels for the miniature on Retina and restores the parent render state',()=>{
    const h=rendererHarness(1.65),place=createPortalPlace(h.renderer);
    place.renderPreview(0,false);
    expect(h.renders.at(-1)!.pixels).toEqual([0,0,512,384]);
    expect(h.renders.at(-1)!.shadows.enabled).toBe(true);expect(h.renders.at(-1)!.shadows.needsUpdate).toBe(true);
    place.renderFull(0,false,0);
    expect(h.renders.at(-1)!.pixels).toEqual([18,36,1320,990]);
    expect(h.renders.at(-1)!.shadows.needsUpdate).toBe(false);
    expect(h.viewport.toArray()).toEqual([11,22,800,600]);expect(h.scissor.toArray()).toEqual([13,24,700,500]);
    expect(h.renderer.getRenderTarget()).toBe(h.originalTarget);
    expect(h.renderer.getScissorTest()).toBe(true);expect(h.renderer.autoClear).toBe(false);
    expect(h.renderer.shadowMap).toEqual({enabled:false,autoUpdate:true,needsUpdate:false,type:T.BasicShadowMap});
    place.dispose();h.originalTarget.dispose();
  });
  it('starts the full visit at exactly the camera and scene shown in the miniature',()=>{
    const h=rendererHarness(),place=createPortalPlace(h.renderer);
    place.renderPreview(0,false);place.renderFull(0,false,0);
    const [preview,entry]=h.renders.map(render=>render.camera);
    expect(entry.position.toArray()).toEqual(preview.position.toArray());expect(entry.quaternion.toArray()).toEqual(preview.quaternion.toArray());expect(entry.projectionMatrix.toArray()).toEqual(preview.projectionMatrix.toArray());
    expect(h.renders[1].scene).toBe(h.renders[0].scene);
    place.renderFull(0,false,1);
    expect(h.renders[2].camera.position.z).toBeLessThan(entry.position.z);
    expect(h.renders[2].scene.getObjectByName('Reading bench')).toBe(place.objects.bench);
    place.dispose();h.originalTarget.dispose();
  });
  it('restores the parent renderer and shadows even when drawing the miniature fails',()=>{
    vi.spyOn(console,'warn').mockImplementation(()=>{});
    const h=rendererHarness(),onError=vi.fn(),place=createPortalPlace(h.renderer,{onError});
    h.draw.mockImplementationOnce(()=>{throw new Error('GPU draw failed');});place.renderPreview(0,false);
    expect(place.error).toMatch(/return to the bookshop/);expect(place.ready).toBe(false);expect(onError).toHaveBeenCalledOnce();
    expect(h.renderer.getRenderTarget()).toBe(h.originalTarget);expect(h.viewport.toArray()).toEqual([11,22,800,600]);expect(h.scissor.toArray()).toEqual([13,24,700,500]);
    expect(h.renderer.getScissorTest()).toBe(true);expect(h.renderer.autoClear).toBe(false);
    expect(h.renderer.shadowMap).toEqual({enabled:false,autoUpdate:true,needsUpdate:false,type:T.BasicShadowMap});
    place.dispose();h.originalTarget.dispose();
  });
  it('restores a saved viewpoint immediately before a motion frame advances',()=>{
    const first=rendererHarness(),original=createPortalPlace(first.renderer);
    original.setView('shelf');original.pan(72,-25);original.zoomBy(1.35);original.renderFull(0,false,1);
    const saved=original.getViewState(),pose=first.renders.at(-1)!.camera;
    const second=rendererHarness(),restored=createPortalPlace(second.renderer);
    restored.restoreView(saved);restored.renderFull(0,true,1);
    expect(restored.getViewState()).toEqual(saved);
    expect(second.renders.at(-1)!.camera.position.toArray()).toEqual(pose.position.toArray());expect(second.renders.at(-1)!.camera.quaternion.toArray()).toEqual(pose.quaternion.toArray());
    saved.zoom=1;expect(original.getViewState().zoom).toBe(1.35);
    original.dispose();restored.dispose();first.originalTarget.dispose();second.originalTarget.dispose();
  });
  it('disposes shared house resources once without touching the parent target',()=>{
    const h=rendererHarness(),onReady=vi.fn(),place=createPortalPlace(h.renderer,{onReady});place.renderFull(0,false,1);
    const benchMesh=place.objects.bench.children[0] as T.Mesh;
    const instance=h.renders.at(-1)!.scene.getObjectByName('Reading house architecture')!.children[0] as T.InstancedMesh;
    const disposeInstance=vi.spyOn(instance,'dispose');
    const disposeGeometry=vi.spyOn(benchMesh.geometry,'dispose'),disposeMaterial=vi.spyOn(benchMesh.material as T.Material,'dispose'),disposeParent=vi.spyOn(h.originalTarget,'dispose');
    place.dispose();place.dispose();
    expect(disposeGeometry).toHaveBeenCalledOnce();expect(disposeMaterial).toHaveBeenCalledOnce();expect(disposeInstance).toHaveBeenCalledOnce();expect(disposeParent).not.toHaveBeenCalled();expect(onReady).not.toHaveBeenCalled();
    h.originalTarget.dispose();
  });
});

describe('the selected place beyond Yours?',()=>{
  it('shows and enters the same selected scene, with the exact miniature camera at the aperture',()=>{
    const h=rendererHarness(1.65),place=createPortalPlace(h.renderer);
    place.renderPreview(0,false);const house=h.renders.at(-1)!.scene,houseTexture=place.texture;
    expect(place.setDestination('future-dads')).toBe(true);expect(place.texture).not.toBe(houseTexture);
    place.renderPreview(0,false);const miniature=h.renders.at(-1)!;
    place.renderFull(0,false,0);const entry=h.renders.at(-1)!;
    expect(miniature.pixels).toEqual([0,0,512,384]);expect(entry.scene).toBe(miniature.scene);expect(entry.scene).not.toBe(house);
    expect(entry.camera.position.toArray()).toEqual(miniature.camera.position.toArray());expect(entry.camera.quaternion.toArray()).toEqual(miniature.camera.quaternion.toArray());expect(entry.camera.projectionMatrix.toArray()).toEqual(miniature.camera.projectionMatrix.toArray());
    place.renderFull(0,false,1);expect(h.renders.at(-1)!.scene).toBe(miniature.scene);
    expect(h.renderer.getRenderTarget()).toBe(h.originalTarget);expect(h.renderer.shadowMap.enabled).toBe(false);
    place.dispose();h.originalTarget.dispose();
  });
  it('rejects selection during either transition or an active visit and preserves each place view on return',()=>{
    const h=rendererHarness(),place=createPortalPlace(h.renderer);
    place.setView('upstairs');place.pan(40,15);place.zoomBy(1.2);place.renderFull(0,false,1);
    const houseView=place.getViewState(),housePose=h.renders.at(-1)!.camera.position.toArray(),houseTexture=place.texture;
    place.setView('island');expect(place.getViewState()).toEqual(houseView);
    for(const phase of ['entering','garden','leaving'] as const){expect(place.setDestination('future-dads',phase)).toBe(false);expect(place.destination).toBe('reading-house');expect(place.texture).toBe(houseTexture);}
    place.setDestination('future-dads');place.setView('upstairs');expect(place.getViewState().view).toBe('garden');expect(place.travelling).toBe(false);
    place.setView('shelf');place.pan(-32,20);place.zoomBy(.8);place.renderFull(0,false,1);const clubView=place.getViewState();
    place.setDestination('reading-house');expect(place.getViewState()).toEqual(houseView);place.renderFull(0,true,1);expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(housePose);
    place.setDestination('future-dads');expect(place.getViewState()).toEqual(clubView);
    place.dispose();h.originalTarget.dispose();
  });
  it('pauses the club view and restores it immediately without a house stair route',()=>{
    const h=rendererHarness(),place=createPortalPlace(h.renderer,{},'future-dads');place.renderFull(0,false,1);
    const start=h.renders.at(-1)!.camera.position.toArray();place.setView('bench');place.renderFull(0,true,1);
    expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(start);expect(place.travelling).toBe(false);
    place.renderFull(.05,true,.4);place.renderFull(0,true,1);expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(start);
    place.renderFull(0,false,1);expect(h.renders.at(-1)!.camera.position.distanceTo(new T.Vector3(-2.8,1.3,1.8))).toBeLessThan(.0001);
    place.restoreView({view:'shelf',yaw:.2,pitch:-.1,zoom:1.3});place.renderFull(0,true,1);const restored=h.renders.at(-1)!.camera.position.toArray();
    place.restoreView({view:'upstairs',yaw:0,pitch:0,zoom:1});place.renderFull(0,true,1);expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(restored);
    place.dispose();h.originalTarget.dispose();
  });
  it('targets the actual listening object and disposes both cached destinations once',()=>{
    const h=rendererHarness(),place=createPortalPlace(h.renderer);const houseMesh=place.objects.bench.children[0] as T.Mesh,houseDispose=vi.spyOn(houseMesh.geometry,'dispose');
    expect(place.listenHit(0,0)).toBe(false);place.setDestination('future-dads');place.renderFull(0,false,1);
    expect(place.listenHit(0,0)).toBe(true);expect(place.listenHit(.99,.99)).toBe(false);
    const clubMesh=place.objects.listen.children[0] as T.Mesh,clubDispose=vi.spyOn(clubMesh.geometry,'dispose');
    place.dispose();place.dispose();expect(houseDispose).toHaveBeenCalledOnce();expect(clubDispose).toHaveBeenCalledOnce();h.originalTarget.dispose();
  });
  it('follows the open entrance to the island and can reverse midway without crossing the pavilion',()=>{
    const h=rendererHarness(),place=createPortalPlace(h.renderer,{},'future-dads');place.setView('shelf');place.renderFull(0,false,1);place.setView('island');
    for(let i=0;i<70;i++)place.renderFull(.05,true,1);
    expect(place.travelling).toBe(true);
    const outward=h.renders.map(render=>render.camera.position),stopped=outward.at(-1)!.toArray();
    for(const point of outward){if(point.y>2)expect(point.z).toBeGreaterThan(8.2);if(point.y>4)expect(point.z).toBeGreaterThan(12.5);}
    place.renderFull(0,true,1);expect(h.renders.at(-1)!.camera.position.toArray()).toEqual(stopped);
    place.setView('bench');const turn=h.renders.length;
    for(let i=0;i<180;i++)place.renderFull(.05,true,1);
    for(const {camera} of h.renders.slice(turn)){if(camera.position.y>2)expect(camera.position.z).toBeGreaterThan(8.2);if(camera.position.y>4)expect(camera.position.z).toBeGreaterThan(12.5);}
    expect(place.travelling).toBe(false);expect(h.renders.at(-1)!.camera.position.distanceTo(new T.Vector3(-2.8,1.3,1.8))).toBeLessThan(.0001);
    place.setView('island');place.renderFull(0,false,1);expect(place.travelling).toBe(false);expect(h.renders.at(-1)!.camera.position.toArray()).toEqual([23,15,29]);
    place.dispose();h.originalTarget.dispose();
  });
  it('keeps the full island legible on a phone while leaving the interior camera at human scale',()=>{
    const h=rendererHarness(1.65),place=createPortalPlace(h.renderer,{},'future-dads');
    for(const [width,height] of [[390,844],[320,568]]){
      h.renderer.setViewport(0,0,width,height);place.setView('island');place.renderFull(0,false,1);const camera=h.renders.at(-1)!.camera;
      const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
      for(const [x,z] of [[-13,-12],[13,-12],[-13,12],[13,12]]){
        const point=new T.Vector3(x,0,z),projected=point.clone().project(camera);expect(Math.abs(projected.x)).toBeLessThan(.9);expect(Math.abs(projected.y)).toBeLessThan(.9);
        expect(frustum.containsPoint(point)).toBe(true);
      }
      expect(frustum.containsPoint(new T.Vector3(0,4,0))).toBe(true);
      for(const zoom of [.65,1.8]){
        place.restoreView({view:'island',yaw:0,pitch:0,zoom});place.renderFull(0,false,1);
        const zoomed=h.renders.at(-1)!.camera;
        for(const point of [new T.Vector3(0,4,0),new T.Vector3(-14,5,-14),new T.Vector3(14,5,-14)]){
          const depth=-point.clone().applyMatrix4(zoomed.matrixWorldInverse).z;
          expect(depth).toBeGreaterThan(zoomed.near);expect(depth).toBeLessThan(zoomed.far);
        }
      }
      place.setView('garden');place.renderFull(0,false,1);expect(h.renders.at(-1)!.camera.position.toArray()).toEqual([0,1.75,5.7]);
    }
    place.dispose();h.originalTarget.dispose();
  });
});
