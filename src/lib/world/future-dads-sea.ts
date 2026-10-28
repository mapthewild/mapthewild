import * as T from 'three';
import {createMapLandmarks} from './map-landmarks';
import {buildPaintedBoat,setBoatOccupied} from './illustrated/boat.js';
import {createPaintPalette} from './illustrated/palette.js';

export const STUDIES='/mapthewild/world/connected/studies/';
export const FUTURE_DADS_VISIT=STUDIES+'journey-storyboard/future-dads-art/visit/?embedded=sea';
export function createSeaIllustrations(scene:T.Scene,ship:T.Group,onReady:()=>void){
 let disposed=false,ready=false,painted:T.Group|null=null;
 const loader=new T.TextureLoader();
 const landmarks=createMapLandmarks();
 landmarks.islands.forEach(island=>scene.add(island));onReady();
 const loading=Promise.all([
  loader.loadAsync(STUDIES+'world-g/assets/boat-painted-materials-v1.png'),
  loader.loadAsync(STUDIES+'world-g/assets/traveller-painted-face-v1.png')
 ]).then(textures=>{
  if(disposed){textures.forEach(t=>t.dispose());return;}
  textures.forEach(t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;});
  painted=buildPaintedBoat(createPaintPalette(textures[0],textures[1]));
  ship.children.forEach(child=>{if(child.userData.seaHull!==false)child.visible=false;});
  painted!.scale.multiplyScalar(.78);ship.add(painted!);ready=true;onReady();
 }).catch(error=>console.warn('The illustrated sea assets could not load.',error));
 return {
  get ready(){return ready;},loading,
  hit:landmarks.hit,
  update(_camera:T.Camera,aboard:boolean){if(painted)setBoatOccupied(painted,aboard);},
  frame(camera:T.Camera,width:number,height:number){
   const centre=ship.getWorldPosition(new T.Vector3()).project(camera);
   const bounds=new T.Box3().setFromObject(painted||ship),points=[];
   for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new T.Vector3(x,y,z).project(camera));
   const xs=points.map(p=>p.x*width/2),ys=points.map(p=>p.y*height/2);
   return {x:(centre.x+1)*width/2,y:(1-centre.y)*height/2,size:Math.max(8,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)),yaw:ship.rotation.y};
  },
  dispose(){disposed=true;landmarks.dispose();}
 };
}
