

const story=document.querySelector('.reveal-story'),stage=document.querySelector('.reveal-stage');
const view=document.querySelector('#sea-view'),frame=document.querySelector('#sea-frame');
const motion=document.querySelector('#reduce-motion'),status=document.querySelector('#entry-status');
const media=matchMedia('(prefers-reduced-motion: reduce)'),params=new URLSearchParams(location.search);
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
let pending=false,animated=false,entered=false,prepared=false,childDoc=null,childObserver=null;
let childUIObserver=null;
let writingReturn=null;
let readerOpen=false,nativeVisible=null,focusOnEntry=false;
const connectedDocuments=new WeakSet();
const returnTo=params.get('returnTo');
const directEntry=params.has('explore');
let deferredEntry=directEntry;
if(directEntry){
 const restoration=history.scrollRestoration;
 history.scrollRestoration='manual';
 const cancel=()=>{deferredEntry=false;};
 addEventListener('wheel',cancel,{once:true,passive:true});
 addEventListener('touchstart',cancel,{once:true,passive:true});
 addEventListener('keydown',event=>{if(['PageUp','PageDown','Home','End',' ','ArrowUp','ArrowDown'].includes(event.key))cancel();});
 addEventListener('pagehide',()=>{history.scrollRestoration=restoration;},{once:true});
}
const requestedShore=['nowbrary','together','horizon','future-dads'].includes(params.get('shore'))?params.get('shore'):null;
const requestedVisit=params.get('visit')==='yours'?'yours':null;
const requestedPlace=['reading-house','future-dads'].includes(params.get('place'))?params.get('place'):null;
if(requestedVisit)frame.src='/mapthewild/explore/?embedded=blog&visit=yours'+(requestedPlace?'&place='+requestedPlace:'');
else if(requestedShore)frame.src='/mapthewild/explore/?embedded=blog&port='+requestedShore;
if(returnTo){
 try{const url=new URL(returnTo,location.origin);if(url.origin===location.origin&&url.pathname.startsWith('/mapthewild/')&&!url.pathname.startsWith('/mapthewild/explore')){const a=document.querySelector('#return-article');a.href=url.href;a.hidden=false;}}catch{}
}
motion.checked=media.matches;

function sendMotion(){
 if(!childDoc)return;
 const label=motion.checked||media.matches?'Pause ambient motion':'Resume ambient motion';
 childDoc.querySelector('button[aria-label="'+label+'"]')?.click();
}
function leaveExplore(destination){
 // The native Read action saves the camera and the current place before the
 // wrapper returns to either the blog opening or the saved article.
 const read=childDoc?.querySelector('.world-mode a');
 if(read){writingReturn=destination;read.click();writingReturn=null;}
 else if(destination==='article')location.href=document.querySelector('#return-article').href;
 else backToWriting();
}
function setChildUI(value){childDoc?.documentElement.style.setProperty('--entry-ui',String(value));}
function setWritingInert(value){document.querySelectorAll('.journal-header,.blog-opening,.entry-footer').forEach(el=>el.inert=value);}
function syncVisibility(force=false){
 const visible=entered&&!document.hidden;
 if(force||visible!==nativeVisible){
  nativeVisible=visible;
  frame.contentWindow?.postMessage({type:'mtw:page-visibility',visible},location.origin);
 }
}
function consumeEntryIntent(){
 const url=new URL(location.href);
 if(!url.searchParams.has('explore')&&!url.searchParams.has('shore')&&!url.searchParams.has('visit'))return;
 url.searchParams.delete('explore');url.searchParams.delete('shore');url.searchParams.delete('visit');url.searchParams.delete('place');
 history.replaceState(history.state,'',url);
}
function setWorldActive(active){
 const leaving=entered&&!active,frameHadFocus=document.activeElement===frame;
 entered=active;document.body.classList.toggle('in-explore',active);
 view.inert=!active;if(active)view.removeAttribute('aria-hidden');else view.setAttribute('aria-hidden','true');frame.tabIndex=active?0:-1;
 childDoc?.documentElement.classList.toggle('entry-mask',!active);
 if(active){
  stage.dataset.phase='map';setChildUI(1);
  if(focusOnEntry){frame.focus({preventScroll:true});focusOnEntry=false;}
 }else if(leaving&&frameHadFocus){
  // PageUp out of a focused world must not leave focus inside the inert frame.
  document.querySelector('#back-writing').focus({preventScroll:true});
 }
 syncVisibility();
}
function backToWriting(){
 deferredEntry=false;focusOnEntry=false;setWorldActive(false);consumeEntryIntent();
 window.scrollTo({top:0,behavior:'instant'});update();
 document.querySelector('#blog-title').focus({preventScroll:true});
}
function entryTop(){
 // Browser bars change the available phone viewport. Both the reveal and its
 // shortcut must end at a position the document can actually scroll to.
 const maxScroll=Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const target=animated
  ?story.getBoundingClientRect().top+scrollY+story.offsetHeight-stage.offsetHeight
  :view.getBoundingClientRect().top+scrollY;
 return Math.min(target,maxScroll);
}
function update(){
 pending=false;if(readerOpen){syncVisibility();return;}
 if(!animated){
  // Keep ordinary page scrolling over the sea preview until it fills the
  // viewport. Its canvas must not consume the scroll as a zoom gesture.
  setChildUI(1);stage.dataset.phase='direct';
  setWorldActive(prepared&&scrollY>=entryTop()-1&&view.getBoundingClientRect().bottom>0);
  return;
 }
 const bounds=story.getBoundingClientRect(),screen=stage.getBoundingClientRect();
 const progress=clamp(-bounds.top/Math.max(1,entryTop()-(bounds.top+scrollY)));
 // Hold the complete illustration first. The lens only arrives as the
 // reader continues scrolling; it never dismisses the picture on a timer.
 const arrival=ease((progress-.16)/.18),turn=ease((progress-.32)/.16),opening=ease((progress-.48)/.44);
 const small=innerWidth<=680?36:44,base=mix(small,innerWidth<=680?80:112,turn);
 const cx=mix(mix(screen.width+small*2,screen.width*.30,arrival),screen.width*.5,turn);
 const cy=mix(screen.height*.68,screen.height*.5,turn);
 const radius=mix(base,Math.hypot(screen.width,screen.height)*.64,opening),face=mix(.30,1,turn);
 const phone=innerWidth<=680,zoom=mix(phone?1.3:1.65,1,opening);
 const focusX=screen.width*.5+screen.width*(phone?.07:.22)*zoom,focusY=screen.height*(.5+(phone?.14*zoom:0));
 const ui=ease((progress-.84)/.14);
 const values={
  '--lens-x':cx+'px','--lens-y':cy+'px','--lens-r':radius+'px','--lens-rx':radius*face+'px','--lens-face':face,
  '--sea-scale':zoom,'--sea-x':(cx-focusX)*(1-opening)+'px','--sea-y':(cy-focusY)*(1-opening)+'px',
  '--paper-opacity':1-ease((progress-.38)/.18),'--rim-opacity':1-ease((progress-.78)/.14),
  '--barrel-opacity':1-ease((progress-.36)/.12),'--barrel-scale':mix(1,.08,turn),'--barrel-angle':mix(10,0,turn)+'deg'
 };
 for(const [key,value] of Object.entries(values))stage.style.setProperty(key,value);
 stage.dataset.progress=progress.toFixed(3);stage.dataset.phase=progress>.48?'opening':progress>.16?'glimpse':'illustration';
 setChildUI(ui);setWorldActive(progress>=.995&&prepared);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
function configure(){
 const stayInWorld=entered;
 animated=!motion.checked&&!media.matches&&(innerWidth>680||innerHeight>=620);
 document.body.classList.toggle('motion-ready',animated);

 // Resizing or changing motion preferences must not strand an active visit
 // halfway behind the invitation. Scrolling back still reverses normally.
 if(stayInWorld)window.scrollTo({top:entryTop(),behavior:'instant'});
 update();
}
function showExplore(){
 deferredEntry=false;focusOnEntry=true;
 window.scrollTo({top:entryTop(),behavior:'instant'});
 update();
}

// The embedded world returns page gestures to this document. The native scene
// keeps destination taps, mouse dragging, pinch zoom and its own readers.
addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow||!event.data)return;
 if(event.data.type==='mtw:page-ready'){syncVisibility(true);return;}
 if(readerOpen)return;
 let delta=0;
 if(event.data.type==='mtw:page-scroll'&&Number.isFinite(event.data.deltaY)){
  delta=Math.max(-innerHeight*2,Math.min(innerHeight*2,event.data.deltaY));
 }else if(event.data.type==='mtw:page-key'){
  switch(event.data.key){
   case 'PageUp':delta=-innerHeight*.85;break;
   case 'PageDown':delta=innerHeight*.85;break;
   case 'Home':delta=-scrollY;break;
   case 'End':delta=document.documentElement.scrollHeight;break;
   case ' ':delta=innerHeight*.85*(event.data.shiftKey?-1:1);break;
  }
 }
 if(delta)window.scrollBy({top:delta,behavior:'instant'});
});
document.addEventListener('visibilitychange',()=>syncVisibility());

// Use the existing local production build in one live frame. The entrance
// and returns to writing are controlled by this page.
function connectExplore(){
 try{childDoc=frame.contentDocument;if(!childDoc?.body||!childDoc.head)return;}catch{return;}
 const observedBody=childDoc.body;
 if(!childDoc.defaultView||observedBody.nodeType!==1)return;
 if(!childDoc.querySelector('astro-island'))return;
 if(connectedDocuments.has(childDoc))return;
 connectedDocuments.add(childDoc);childObserver?.disconnect();nativeVisible=null;
 childDoc.documentElement.classList.add('entry-mask');
 const style=childDoc.createElement('style');
 style.textContent=`html.entry-mask :is(.world-header,.world-labels,.world-tools,.world-footer,.world-destinations,.world-landing,.world-sailing,.world-intro,.portal-visit,.portal-invitation,.inside-actions,.inside-caption,.ashore-caption,.shore-about,.ashore-actions,.foot-labels,.shelf-titles){opacity:var(--entry-ui,0)!important;pointer-events:none!important} .harbour-world{min-height:100svh!important}`;
 childDoc.head.append(style);
 function observeChild(callback,options){
  // A frame can replace its document during loading. Keep navigation usable
  // even if that replacement occurs while its observer is being attached.
  try{
   const observer=new childDoc.defaultView.MutationObserver(callback);
   observer.observe(childDoc.documentElement,options);
   return observer;
  }catch{
   const timer=setInterval(callback,250);
   return {disconnect(){clearInterval(timer);}};
  }
 }

 function reflectReader(){

  const open=!!childDoc.querySelector('dialog[open]');
  readerOpen=open;
  document.body.classList.toggle('reading-in-world',open);
  setWritingInert(open);
  stage.classList.toggle('has-reader',open);
  document.querySelector('.explore-return').inert=open;
  document.querySelector('.reveal-tools').inert=open;
  if(!open)schedule();
 }
 childUIObserver?.disconnect();
 childUIObserver=observeChild(reflectReader,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 reflectReader();
 function prepare(){
  const world=childDoc.querySelector('.harbour-world');
  if(!world)return;
  if(world.classList.contains('has-error')){prepared=true;status.textContent='Open Explore directly if the world does not load.';childObserver?.disconnect();update();return;}
  if(!world.classList.contains('is-ready'))return;
  // A returning visitor owns their current scale and place. Do not board them
  // or clear their selection merely to prepare the blog's visual entrance.
  if(!requestedShore&&world.classList.contains('has-intro'))childDoc.querySelector('.world-intro .world-text-button')?.click();
  prepared=true;childObserver?.disconnect();consumeEntryIntent();
  if(motion.checked||media.matches)sendMotion();
  status.textContent='Explore is ready. Scroll through the illustration to enter, or use Skip to Explore.';
  update();syncVisibility(true);
 }
 childObserver=observeChild(prepare,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});
 childDoc.addEventListener('click',event=>{
  const anchor=event.target.closest('a[href]');
  if(!anchor||event.defaultPrevented||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self'))return;
  if(anchor.matches('.world-brand,.world-mode a')){event.preventDefault();if(writingReturn!=='blog'&&anchor.closest('.world-mode')&&!document.querySelector('#return-article').hidden)location.href=document.querySelector('#return-article').href;else backToWriting();return;}
  const target=new URL(anchor.href);
  if(['http:','https:'].includes(target.protocol)){
   event.preventDefault();location.href=target.href;
  }
 });
 prepare();
}
frame.addEventListener('load',connectExplore);
if(frame.contentDocument?.readyState==='complete')connectExplore();
document.querySelectorAll('[data-show-map],.journal-header [data-journal-explore]').forEach(b=>b.addEventListener('click',event=>{event.preventDefault();showExplore();}));
document.querySelector('#back-writing').addEventListener('click',()=>leaveExplore('blog'));
document.querySelector('#return-writing').addEventListener('click',()=>leaveExplore('blog'));
document.querySelector('#return-article').addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();leaveExplore('article');});
motion.addEventListener('change',()=>{configure();sendMotion();});
media.addEventListener('change',()=>{motion.checked=media.matches;configure();sendMotion();});
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',configure);
configure();
document.fonts.ready.then(configure);
// An explicit article return wins over the browser's initial top-of-page
// placement, once layout is stable. A reader who has already scrolled wins
// over this deferred shortcut; native readiness never pulls them back.
const pageLoaded=new Promise(resolve=>{
 if(document.readyState==='complete')resolve();
 else addEventListener('load',resolve,{once:true});
});
Promise.all([document.fonts.ready,pageLoaded]).then(()=>{
 configure();if(deferredEntry)showExplore();
});
