export function isBlogEmbed(href:string,framed:boolean){return framed&&new URL(href).searchParams.get('embedded')==='blog';}

export function parentVisibility(event:Pick<MessageEvent,'origin'|'source'|'data'>,parent:Window,origin:string):boolean|null {
  return event.source===parent&&event.origin===origin&&event.data?.type==='mtw:page-visibility'&&typeof event.data.visible==='boolean'?event.data.visible:null;
}

export function pageDelta(delta:number,mode:number,height:number){
  return Number.isFinite(delta)?delta*(mode===1?16:mode===2?height:1):0;
}

export function simulationState(pageVisible:boolean,bookSuspended:boolean){
  return !pageVisible?'paused-page':bookSuspended?'paused-book':'running';
}

export function forwardsPageKey(event:Pick<KeyboardEvent,'key'|'ctrlKey'|'altKey'|'metaKey'>,interactive:boolean,local:boolean){
  return !local&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&['PageUp','PageDown','Home','End',' '].includes(event.key)&&!(event.key===' '&&interactive);
}

/** A panel owns its scrolling even when it is already at its first/last line. */
export function keepsScrollLocal(target:EventTarget|null,root:HTMLElement,forKeyboard=false){
  if(root.ownerDocument.querySelector('dialog[open]'))return true;
  let element=target instanceof Element?target:target instanceof Node?target.parentElement:null;
  while(element&&element!==root){
    if(element.matches('dialog,.shore-reader,.reading-room,.world-book,input,textarea,select,[contenteditable="true"]'))return true;
    if(element.matches('.world-landing,.shelf-titles')&&(!forKeyboard||element.scrollHeight>element.clientHeight+1))return true;
    const overflow=getComputedStyle(element).overflowY;
    if((overflow==='auto'||overflow==='scroll')&&element.scrollHeight>element.clientHeight)return true;
    element=element.parentElement;
  }
  return false;
}

type TouchPoint={x:number;y:number;startX:number;startY:number;local:boolean};
export function blogTouchGesture(){
  const points=new Map<number,TouchPoint>();let consumed=false,multiTouch=false;
  return {
    down(id:number,x:number,y:number,local:boolean){
      if(!points.size){consumed=false;multiTouch=false;}
      points.set(id,{x,y,startX:x,startY:y,local});
      if(points.size>1){consumed=true;multiTouch=true;}
    },
    move(id:number,x:number,y:number){
      const p=points.get(id);if(!p)return {consume:false,deltaY:0};
      const deltaY=p.y-y;p.x=x;p.y=y;
      if(points.size!==1||[...points.values()].some(point=>point.local))return {consume:false,deltaY:0};
      // A pinch remains a pinch until every finger lifts. Its last finger must
      // never turn into an unexpected page departure.
      if(multiTouch)return {consume:true,deltaY:0};
      if(Math.hypot(x-p.startX,y-p.startY)>5)consumed=true;
      return {consume:consumed,deltaY:consumed?deltaY:0};
    },
    up(id:number){
      const p=points.get(id),consume=!!p&&!p.local&&consumed;
      points.delete(id);
      // The remaining finger starts a fresh delta after a pinch, rather than
      // jumping by the distance travelled while the other finger was down.
      for(const point of points.values()){point.startX=point.x;point.startY=point.y;}
      return consume;
    },
  };
}

/** Explicit, same-origin bridge for the blog's scrollable Explore section. */
export function connectBlogEmbed(root:HTMLElement,onVisibility:(visible:boolean)=>void,onZoom:(factor:number)=>void){
  const origin=location.origin,parent=window.parent,gesture=blogTouchGesture();let suppressClickUntil=0;
  const htmlScroll=document.documentElement.style.overscrollBehavior,bodyScroll=document.body.style.overscrollBehavior;
  document.documentElement.style.overscrollBehavior='none';document.body.style.overscrollBehavior='none';
  const inputStyle=document.createElement('style');inputStyle.dataset.mtwBlogInput='true';
  inputStyle.textContent=`.harbour-world[data-embedded-blog="true"] :is(.world-landing,.shelf-titles,.shore-reader,.reading-room,.world-book,.shore-reading-scroll){overscroll-behavior:contain}.harbour-world[data-embedded-blog="true"] :is(.world-pin,.foot-pin,.world-destinations,.world-tools,.world-header,.world-intro,.ashore-actions,.inside-actions,.shore-about){touch-action:none}`;
  document.head.append(inputStyle);
  const sendScroll=(deltaY:number)=>{if(deltaY)parent.postMessage({type:'mtw:page-scroll',deltaY},origin);};
  const ready=()=>parent.postMessage({type:'mtw:page-ready'},origin);
  const onMessage=(event:MessageEvent)=>{const visible=parentVisibility(event,parent,origin);if(visible!==null)onVisibility(visible);};
  const onWheel=(event:WheelEvent)=>{
    if(keepsScrollLocal(event.target,root))return;
    // Modified browser gestures are not vertical page intent. Ctrl is the
    // trackpad pinch convention and deliberately retains world zoom.
    if(!event.ctrlKey&&(event.shiftKey||event.altKey||event.metaKey)){event.stopPropagation();return;}
    event.preventDefault();event.stopPropagation();
    const delta=pageDelta(event.deltaY,event.deltaMode,window.innerHeight);
    if(event.ctrlKey)onZoom(Math.exp(-delta*.001));else sendScroll(delta);
  };
  const onDown=(event:PointerEvent)=>{if(event.pointerType==='touch')gesture.down(event.pointerId,event.clientX,event.clientY,keepsScrollLocal(event.target,root));};
  const onMove=(event:PointerEvent)=>{
    if(event.pointerType!=='touch')return;
    const action=gesture.move(event.pointerId,event.clientX,event.clientY);
    if(action.consume&&!keepsScrollLocal(event.target,root)){event.preventDefault();sendScroll(action.deltaY);}
  };
  const onUp=(event:PointerEvent)=>{
    if(event.pointerType==='touch'&&gesture.up(event.pointerId)){event.preventDefault();suppressClickUntil=performance.now()+500;}
  };
  const onTouchMove=(event:TouchEvent)=>{if(!keepsScrollLocal(event.target,root))event.preventDefault();};
  const onClick=(event:MouseEvent)=>{if(event.detail&&performance.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}};
  const onKey=(event:KeyboardEvent)=>{
    const element=event.target instanceof Element?event.target:null;
    const interactive=!!element?.closest('a,button,summary');
    const composite=!!element?.closest('input,textarea,select,[contenteditable="true"],[role="tab"],[role="slider"],[role="option"],[role="listbox"],[role="tree"],[role="menu"],[role="grid"],[role="spinbutton"]');
    if(event.defaultPrevented||!forwardsPageKey(event,interactive,composite||keepsScrollLocal(event.target,root,true)))return;
    event.preventDefault();event.stopPropagation();parent.postMessage({type:'mtw:page-key',key:event.key,shiftKey:event.shiftKey},origin);
  };
  window.addEventListener('message',onMessage);
  window.addEventListener('keydown',onKey);
  root.addEventListener('wheel',onWheel,{capture:true,passive:false});
  root.addEventListener('pointerdown',onDown,true);root.addEventListener('pointermove',onMove,{capture:true,passive:false});
  root.addEventListener('pointerup',onUp,true);root.addEventListener('pointercancel',onUp,true);
  root.addEventListener('touchmove',onTouchMove,{capture:true,passive:false});root.addEventListener('click',onClick,true);
  ready();
  return {ready,dispose(){
    inputStyle.remove();document.documentElement.style.overscrollBehavior=htmlScroll;document.body.style.overscrollBehavior=bodyScroll;
    window.removeEventListener('message',onMessage);window.removeEventListener('keydown',onKey);root.removeEventListener('wheel',onWheel,true);
    root.removeEventListener('pointerdown',onDown,true);root.removeEventListener('pointermove',onMove,true);
    root.removeEventListener('pointerup',onUp,true);root.removeEventListener('pointercancel',onUp,true);
    root.removeEventListener('touchmove',onTouchMove,true);root.removeEventListener('click',onClick,true);
  }};
}
