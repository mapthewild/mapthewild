const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const dialAngle=value=>-135+(clamp(value,1,16)-1)*18;
export const turnDelta=(before,after)=>((after-before+540)%360)-180;

export function connectDial(knob,range){
 let drag=null;
 const angle=(x,y)=>Math.atan2(y,x)*180/Math.PI;
 function draw(){
  knob.style.setProperty('--dial-turn',dialAngle(Number(range.value))+'deg');
  knob.setAttribute('aria-valuenow',range.value);
  knob.setAttribute('aria-valuetext',range.getAttribute('aria-valuetext'));
 }
 function set(value){
  const next=Math.round(clamp(value,1,16)*20)/20;
  if(next===Number(range.value))return;
  range.value=String(next);range.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function finish(event){
  if(!drag||(event?.pointerId!==undefined&&event.pointerId!==drag.id))return;
  const {id,moved}=drag;drag=null;delete knob.dataset.dragging;
  if(knob.hasPointerCapture(id))knob.releasePointerCapture(id);
  if(moved)range.dispatchEvent(new Event('change',{bubbles:true}));
 }
 knob.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||drag)return;
  event.preventDefault();knob.focus({preventScroll:true});
  const box=knob.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;
  const x=event.clientX-cx,y=event.clientY-cy;
  drag={id:event.pointerId,cx,cy,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,
   lastAngle:angle(x,y),turn:dialAngle(Number(range.value)),deadZone:box.width*.12,
   mode:Math.hypot(x,y)<box.width*.2?'linear':'rotary',axis:null,moved:false};
  knob.setPointerCapture(event.pointerId);knob.dataset.dragging='true';
 });
 knob.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  event.preventDefault();
  if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<3)return;
  drag.moved=true;
  let delta;
  if(drag.mode==='linear'){
   if(!drag.axis)drag.axis=Math.abs(event.clientX-drag.startX)>Math.abs(event.clientY-drag.startY)?'x':'y';
   delta=drag.axis==='x'?(event.clientX-drag.lastX)*1.2:(drag.lastY-event.clientY)*1.2;
  }else{
   const x=event.clientX-drag.cx,y=event.clientY-drag.cy;
   // Passing through the centre must not cause a half-turn jump.
   if(Math.hypot(x,y)<drag.deadZone){drag.lastAngle=null;return;}
   const next=angle(x,y);delta=drag.lastAngle===null?0:turnDelta(drag.lastAngle,next);drag.lastAngle=next;
  }
  drag.lastX=event.clientX;drag.lastY=event.clientY;
  // Stop at the ends, but respond immediately when the hand turns back.
  drag.turn=clamp(drag.turn+delta,-135,135);set(1+(drag.turn+135)/18);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])knob.addEventListener(event,finish);
 window.addEventListener('blur',()=>finish());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
 knob.addEventListener('keydown',event=>{
  const current=Math.round(Number(range.value));
  const values={ArrowRight:current+1,ArrowUp:current+1,ArrowLeft:current-1,ArrowDown:current-1,
   PageUp:current+3,PageDown:current-3,Home:1,End:16};
  if(!(event.key in values))return;
  event.preventDefault();set(values[event.key]);range.dispatchEvent(new Event('change',{bubbles:true}));
 });
 range.addEventListener('input',draw);range.addEventListener('tuned',draw);draw();
}
