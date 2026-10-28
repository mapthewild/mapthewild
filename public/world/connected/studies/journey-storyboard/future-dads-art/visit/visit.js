import * as T from '../../../world-g/vendor/three.module.js';
import {buildPaintedBoat,setBoatOccupied} from '../../asset-study/shore-layout/motion/painted-boat.js';
import {createPaintPalette} from '../../../world-g/shore-depth/painted-boat-palette.js';
import {clamp,mix,smooth,boatPoint,walkPoint,soundDistance,stage,STOPS,LANDING} from './route.mjs';
import {createRadio} from './sound.js';
import {episodes} from './episodes.mjs';
import {characterId,sheets,frames,POSE,walkingPose} from './character/frames.mjs';
import {setBoatDepth} from './character/boat-depth.mjs';

const W=1536,H=1024,PPM=64,$=id=>document.getElementById(id),viewport=$('viewport'),painting=$('painting');
const radio=createRadio(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let journey=null;try{journey=await (await import('/mapthewild/journey/client.mjs')).connectJourney();}catch{}
const ownSite=journey?.site==='future-dads'&&parent===window;
let leavingOwn=false;
const seaEmbed=new URLSearchParams(location.search).get('embedded')==='sea'&&parent!==window;
let hostVisible=!seaEmbed,leavingSea=false,entryYaw=null,hostMotion=true;
const lessMotion=()=>reduced.matches||(seaEmbed&&!hostMotion);
if(seaEmbed){document.body.classList.add('sea-visit');const back=document.querySelector('header>a');back.textContent='← Back to the sea';back.href='/mapthewild/explore/';}
const tellSea=data=>{if(seaEmbed)parent.postMessage(data,location.origin);};
let position=ownSite?(journey.restored?.custom?.position??(journey.entry==='radio'?STOPS.listen:journey.entry==='sea'?STOPS.sea:STOPS.ashore)):location.hash==='#radio'?STOPS.listen:0,target=position,running=false,direction=1,last=performance.now(),frameId=0,frameDelta=0,boatYaw;
const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
renderer.setSize(W,H);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.domElement.setAttribute('aria-label','The illustrated boat and traveller moving along the route');$('actors').append(renderer.domElement);
const scene=new T.Scene(),camera=new T.OrthographicCamera(-W/PPM/2,W/PPM/2,H/PPM/2,-H/PPM/2,.1,300);
camera.position.set(0,60,80);camera.lookAt(0,0,0);camera.updateMatrixWorld();
scene.add(new T.HemisphereLight(0xffefcc,0x367681,1.5));const sun=new T.DirectionalLight(0xffecc6,2.3);sun.position.set(-5,9,6);scene.add(sun);
const loader=new T.TextureLoader();
const [atlas,face,island,characterSheets]=await Promise.all([
 loader.loadAsync('../../../world-g/assets/boat-painted-materials-v1.webp'),loader.loadAsync('../../../world-g/assets/traveller-painted-face-v1.webp'),
 loader.loadAsync('../two-styles/art/comic-island-v1.webp'),
 Promise.all(Object.entries(sheets).map(async([name,sheet])=>[name,await loader.loadAsync(sheet.url)])).then(Object.fromEntries)
]);
for(const texture of [atlas,face,island,...Object.values(characterSheets)])texture.colorSpace=T.SRGBColorSpace;
const boat=buildPaintedBoat(createPaintPalette(atlas,face));setBoatOccupied(boat,false);scene.add(boat);
const poses=frames.map(([sheetName,[x0,y0,x1,y1],[ax,ay],height,mirror=false])=>{
 const [sw,sh]=sheets[sheetName].size,texture=characterSheets[sheetName].clone();texture.offset.set(x0/sw,1-y1/sh);texture.repeat.set((x1-x0)/sw,(y1-y0)/sh);texture.needsUpdate=true;
 const width=height*(x1-x0)/(y1-y0),geometry=new T.PlaneGeometry(width,height);
 geometry.translate((.5-(ax-x0)/(x1-x0))*width,((ay-y0)/(y1-y0)-.5)*height,0);
 const sprite=new T.Mesh(geometry,new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.15,depthWrite:true,toneMapped:false,side:T.DoubleSide}));sprite.userData.mirror=mirror;sprite.quaternion.copy(camera.quaternion);sprite.visible=false;scene.add(sprite);return sprite;
});
function seaFrame(){
 const bounds=painting.getBoundingClientRect(),scale=bounds.width/W;
 const centre=boat.getWorldPosition(new T.Vector3()).project(camera);
 const box=new T.Box3().setFromObject(boat),points=[];
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));
 const xs=points.map(p=>p.x*W/2),ys=points.map(p=>p.y*H/2);
 return {x:bounds.x+(centre.x+1)*W/2*scale,y:bounds.y+(1-centre.y)*H/2*scale,size:Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*scale,yaw:boatYaw};
}
const screenPoint=(x,y,height=0)=>new T.Vector3((x-W/2)/PPM,height,(y-H/2+.8*PPM*height)/(.6*PPM));
// Post depth belongs at its base on the planks, not at the bottom of its stilt in the water.
// This lets the traveller pass in front of a back post, then behind it on reaching the sand.
const posts=[
 {x:590,y:634,points:[[575,600],[586,593],[597,597],[600,631],[606,634],[605,640],[599,643],[599,666],[588,675],[575,672],[575,644],[571,640],[572,634],[574,630]]},
 {x:703,y:646,points:[[692,610],[701,604],[711,607],[715,643],[719,646],[718,651],[714,654],[715,680],[706,685],[692,682],[691,655],[686,651],[687,645],[690,642]]},
 {x:640,y:612,points:[[630,585],[640,580],[650,583],[653,611],[655,613],[655,616],[649,619],[631,620],[626,616],[626,613],[629,609]]},
 {x:750,y:622,points:[[740,593],[749,586],[758,588],[762,619],[766,623],[766,628],[761,632],[761,663],[751,666],[741,663],[740,633],[736,630],[737,624],[739,619]]}
];
for(const {x,y,points} of posts){
 const shape=new T.Shape(points.map(p=>new T.Vector2((p[0]-x)/PPM,(y-p[1])/PPM))),g=new T.ShapeGeometry(shape),p=g.attributes.position,uv=[];
 for(let i=0;i<p.count;i++)uv.push((x+p.getX(i)*PPM)/W,1-(y-p.getY(i)*PPM)/H);
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const post=new T.Mesh(g,new T.MeshBasicMaterial({map:island,toneMapped:false}));post.quaternion.copy(camera.quaternion);post.position.copy(screenPoint(x,y));scene.add(post);
}
const shadow=new T.Mesh(new T.PlaneGeometry(.75,.24),new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;void main(){float a=pow(max(0.,1.-length((v-.5)*2.)),2.);gl_FragColor=vec4(.18,.12,.04,a*.3);}'}));shadow.quaternion.copy(camera.quaternion);scene.add(shadow);
function fit(){
 const sail=smooth(position/28),walk=smooth((position-42)/43),narrow=viewport.clientWidth<650;
 const zoom=mix(narrow?1.02:1,1.8,sail)+walk*.35;
 const base=Math.max(viewport.clientWidth/W,viewport.clientHeight/H),scale=base*zoom;
 const centreX=mix(narrow?590:W/2,650,sail)+walk*195,centreY=mix(narrow?610:H/2,700,sail)-walk*170;
 const halfW=viewport.clientWidth/scale/2,halfH=viewport.clientHeight/scale/2;
 const x=clamp(centreX,halfW,W-halfW),y=clamp(centreY,halfH,H-halfH);
 painting.style.transform=`translate(-50%,-50%) scale(${scale}) translate(${W/2-x}px,${H/2-y}px)`;
 $('listening-view').style.opacity=String(smooth((position-90)/10));
 const close=position>=99.9;
 $('radio-object').hidden=position<84.9||close;
 $('radio-object').style.left=(viewport.clientWidth/2+(901-x)*scale)+'px';
 $('radio-object').style.top=(viewport.clientHeight/2+(484-y)*scale)+'px';
 $('radio-knob').hidden=$('radio-needle').hidden=!close;
 if(close){
  const w=viewport.clientWidth,h=viewport.clientHeight,mobile=matchMedia('(max-width:780px)').matches;
  const fit=Math.max(w/1536,h/1024),grow=mobile?1.12:1.48,offsetX=(w-1536*fit)*(mobile?.78:.75),offsetY=(h-1024*fit)*.5;
  const point=(px,py)=>({x:w+(offsetX+px*fit-w)*grow,y:h/2+(offsetY+py*fit-h/2)*grow});
  const knob=point(1262,552),needle=point(1178+(radio.station-1)/15*117,484);
  $('radio-knob').style.left=knob.x+'px';$('radio-knob').style.top=knob.y+'px';
  $('radio-knob').style.setProperty('--dial-face',(36*fit*grow)+'px');
  $('radio-needle').style.left=needle.x+'px';$('radio-needle').style.top=needle.y+'px';
  $('radio-needle').style.height=(22*fit*grow)+'px';
 }
}
function description(){
 if(position<27.99)return running?(direction>0?'Sailing towards the jetty.':'Leaving the island.'):'The boat is offshore.';
 if(position<32)return'Alongside the jetty.';
 if(position<36)return direction>0?'Standing up in the boat.':'Sitting back in the boat.';
 if(position<42)return direction>0?'Stepping onto the jetty.':'Stepping back aboard.';
 if(position<84.99)return running?(direction>0?'Following the path to the radio.':'Walking back to the waiting boat.'):(position<48?'The boat is waiting at the jetty.':'Paused on the path.');
 return'You’re beside the radio.';
}
function render(){
 fit();const bp=boatPoint(position),heading=bp.heading-(direction<0?180*smooth((28-position)/18):0);
 boat.position.copy(screenPoint(bp.x,bp.y));
 const wantedYaw=Math.atan2(.6*Math.cos(heading*Math.PI/180),Math.sin(heading*Math.PI/180));
 if(entryYaw!==null&&position<5)boatYaw=entryYaw+Math.atan2(Math.sin(wantedYaw-entryYaw),Math.cos(wantedYaw-entryYaw))*smooth(position/5);
 else if(boatYaw===undefined||!running||lessMotion())boatYaw=wantedYaw;
 else{const turn=Math.atan2(Math.sin(wantedYaw-boatYaw),Math.cos(wantedYaw-boatYaw));boatYaw+=clamp(turn,-frameDelta*1.5,frameDelta*1.5);}
 boat.rotation.y=boatYaw;boat.updateMatrixWorld(true);
 const local=(x,y,z)=>boat.localToWorld(new T.Vector3(x,y,z));let pose=POSE.seated,anchor,scale=1,flip=false;
 if(position<31)anchor=local(0,.27,-.8);
 else if(position<35){pose=position<33?POSE.rising:POSE.standing;anchor=local(0,.27,-.8);}
 else if(position<38){const u=(position-35)/3;pose=Math.abs(target-position)>.001?walkingPose(position,direction):POSE.standing;anchor=local(0,mix(.27,.65,u),mix(-.8,1.85,u));}
 else if(position<42){const u=smooth((position-38)/4);pose=u<.25?POSE.lift:u<.78?POSE.reach:POSE.land;anchor=local(0,.65,1.85).lerp(screenPoint(LANDING.x,LANDING.y),u);anchor.y+=Math.sin(u*Math.PI)*.05;}
 else{const p=walkPoint(position);pose=Math.abs(target-position)>.001&&position<84.8?walkingPose(position,direction):POSE.idle;anchor=screenPoint(p.x,p.y);flip=pose===POSE.idle&&direction<0;}
 if(position<42&&direction<0)flip=true;
 poses.forEach((p,i)=>p.visible=i===pose);poses[pose].position.copy(anchor);poses[pose].scale.set(flip!==poses[pose].userData.mirror?-scale:scale,scale,scale);
 // Ease back into the painted pier's depth while stepping off the real boat.
 setBoatDepth(poses[pose],camera,1-smooth((position-38)/4));
 shadow.visible=position>=42;shadow.position.copy(anchor).addScaledVector(camera.position.clone().normalize(),-.015);shadow.scale.set(scale,scale,1);
 renderer.render(scene,camera);radio.setDistance(hostVisible?soundDistance(position):0);
 document.body.classList.toggle('beside-radio',position>=85);
 const s=stage(position);painting.dataset.position=position.toFixed(2);painting.dataset.pose=String(pose);painting.dataset.character=characterId;painting.dataset.view=pose<4?'back':'rear-three-quarter';painting.dataset.travellers=String(poses.filter(p=>p.visible).length);painting.dataset.boat=JSON.stringify(bp);
 viewport.dataset.stage=s;$('position').value=String(position);$('position').setAttribute('aria-valuetext',description());
 document.body.classList.add('visit-ready');const desc=description();if($('status').textContent!==desc)$('status').textContent=desc;
 $('place').textContent=position<28?'At sea':position<48?'The jetty':position<85?'The path':'The radio';
 $('continue').textContent=position<28?'Come ashore':position<85?'Walk to the radio':position<100?'Listen here':'Listening here';
 $('continue').disabled=running&&direction>0||position>=100;
 $('return').textContent=position>28?'Back to the boat':ownSite?'Set sail':'Back to sea';$('return').disabled=position<=0&&!ownSite;
 $('pause-motion').textContent=running?'Pause movement':'Continue moving';$('pause-motion').disabled=!running&&Math.abs(target-position)<.01;
}
function tick(now){
 const dt=Math.min(.06,(now-last)/1000);last=now;frameDelta=dt;
 if(running){const speed=position<28?5.6:position<42?4:position<85?6:18,gap=target-position;position+=Math.sign(gap)*Math.min(Math.abs(gap),dt*speed);if(Math.abs(target-position)<.001){position=target;running=false;}render();if(!running&&seaEmbed&&leavingSea){if(position>0)travel(position>28?28:0);else{leavingSea=false;hostVisible=false;radio.setDistance(0);tellSea({type:'fd:left',frame:seaFrame()});}}}
 if(!running&&ownSite&&leavingOwn){if(position>0)travel(position>28?28:0);else{leavingOwn=false;journey.go('mapthewild','sea');}}
 if(running)frameId=requestAnimationFrame(tick);else frameId=0;
}
function travel(to){
 target=to;direction=to>=position?1:-1;running=Math.abs(to-position)>.01;
 if(lessMotion()){position=to;running=false;}
 last=performance.now();render();if(running&&!frameId)frameId=requestAnimationFrame(tick);
}
$('continue').addEventListener('click',()=>{if(position>=85)radio.enable();travel(position<28?STOPS.ashore:position<85?STOPS.radio:STOPS.listen);});
$('radio-object').addEventListener('click',()=>{radio.enable();travel(STOPS.listen);});
$('tuning').addEventListener('input',fit);
$('tuning').addEventListener('tuned',fit);
$('return').addEventListener('click',()=>{if(ownSite&&position<=28){leavingOwn=true;if(lessMotion()||position===0){journey.go('mapthewild','sea');return;}}if(seaEmbed&&position<=28)leavingSea=true;travel(position>28?STOPS.moored:STOPS.sea);if(seaEmbed&&lessMotion()&&position===0){hostVisible=false;tellSea({type:'fd:left',frame:seaFrame()});}});
$('pause-motion').addEventListener('click',()=>{if(running){running=false;render();}else travel(target);});
$('position').addEventListener('input',()=>{const next=Number($('position').value);direction=next>=position?1:-1;position=target=next;running=false;render();});
document.querySelectorAll('[data-stop]').forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{const next=Number(button.dataset.stop);direction=next>=position?1:-1;position=target=next;running=false;render();});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;render();}});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();running=false;$('status').textContent='The movement paused because the graphics stopped. Reload to continue.';});
window.addEventListener('hashchange',()=>{if(location.hash==='#radio'){running=false;position=target=STOPS.listen;render();}});
$('position').disabled=false;new ResizeObserver(fit).observe(viewport);render();
if(seaEmbed){
 const exit=()=>{leavingSea=true;if(position===0){hostVisible=false;radio.setDistance(0);tellSea({type:'fd:left',frame:seaFrame()});}else if(lessMotion()){position=target=0;hostVisible=false;radio.setDistance(0);tellSea({type:'fd:left',frame:seaFrame()});}else travel(position>28?28:0);};
 document.querySelector('header>a').addEventListener('click',event=>{event.preventDefault();exit();});
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent)return;
  if(event.data?.type==='fd:enter'){
   hostMotion=event.data.motion!==false;running=false;leavingSea=false;hostVisible=true;position=target=0;direction=1;entryYaw=Number.isFinite(event.data.frame?.yaw)?event.data.frame.yaw:null;render();
   tellSea({type:'fd:entered',frame:seaFrame()});
  }
  if(event.data?.type==='fd:motion')hostMotion=event.data.motion!==false;
  if(event.data?.type==='fd:approach')travel(STOPS.ashore);
  if(event.data?.type==='fd:visibility'){hostVisible=event.data.visible===true;if(!hostVisible){running=false;radio.setDistance(0);}else render();}
 });
 // Scroll up returns through the enclosing blog invitation. Radio controls keep
 // their own gestures; the visit itself has no separate vertical page to trap it.
 viewport.addEventListener('wheel',event=>{if(event.ctrlKey||event.target.closest('button,[role="slider"]'))return;if(event.deltaY<0){event.preventDefault();tellSea({type:'mtw:page-scroll',deltaY:event.deltaY});}},{passive:false});
 const touches=new Map();let touchWasMultiple=false;
 viewport.style.touchAction='none';
 viewport.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch'||event.target.closest('button,[role="slider"]'))return;if(!touches.size)touchWasMultiple=false;touches.set(event.pointerId,event.clientY);if(touches.size>1)touchWasMultiple=true;});
 viewport.addEventListener('pointermove',event=>{if(!touches.has(event.pointerId))return;const previous=touches.get(event.pointerId);touches.set(event.pointerId,event.clientY);if(touches.size===1&&!touchWasMultiple&&hostVisible){event.preventDefault();tellSea({type:'mtw:page-scroll',deltaY:previous-event.clientY});}});
 for(const name of ['pointerup','pointercancel'])viewport.addEventListener(name,event=>touches.delete(event.pointerId));
 tellSea({type:'fd:ready'});
}

if(ownSite){
 document.body.classList.add('sea-visit','owned-visit');
 journey.register('place',()=>({position:Math.round(position*10)/10,radio:radio.snapshot()}));
 const {returnLabel}=await import('/mapthewild/journey/core.mjs');
 // Pick up what the visitor was hearing: the room's or radio's latest note on the way back, or the
 // episode page they left playing. Otherwise the radio keeps its own last place.
 let heard=null;try{heard=JSON.parse(sessionStorage.getItem('fd-listening')||'null');}catch{}
 const station=slug=>episodes.findIndex(e=>e.slug===slug),kept=journey.restored?.custom?.radio;
 const page=!journey.restored&&journey.entry==='radio'&&journey.previous?.kind==='episode'?journey.bookmark(journey.previous.id):null;
 const pageAudio=page?.audio?.find(a=>a.playing||a.time>0),pageSlug=page?.href.split('/').filter(Boolean).pop();
 const recent=heard&&station(heard.slug)>=0&&Date.now()-heard.at<7200000?heard:null;
 let tuned=kept||radio.snapshot();
 if(pageAudio&&station(pageSlug)>=0)tuned={index:station(pageSlug),time:pageAudio.time,volume:Math.round((pageAudio.volume??.25)*100),on:pageAudio.playing};
 else if(recent&&(!kept||recent.at>(journey.restored.at||0))&&(kept||journey.entry==='radio'))tuned={...tuned,index:station(recent.slug),time:recent.time,on:recent.on};
 radio.restore(tuned);if(tuned.on)radio.enable();
 const back=document.querySelector('header>a');back.textContent=journey.activity?returnLabel(journey.activity.kind):'Episodes';back.href='/';
 if(journey.activity&&journey.activity.kind!=='episodes'){const all=document.createElement('a');all.className='visit-episodes';all.href='/';all.textContent='Episodes';back.after(all);}
 back.addEventListener('click',e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();if(journey.activity)journey.resume(journey.activity);else journey.go('future-dads','content');});
 $('episode-page').removeAttribute('target');$('episode-page').addEventListener('click',e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();const u=new URL(e.currentTarget.href);journey.contentLink(u.pathname);});
 const room=document.createElement('a');room.className='listening-room-door';room.textContent='Listening room';room.href=journey.url('future-dads','room');room.addEventListener('click',e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();journey.go('future-dads','room');});document.querySelector('.listening').append(room);
 if(journey.entry==='sea'&&!journey.restored)travel(STOPS.ashore);
}
