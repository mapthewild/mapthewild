import {validConfig,decodeTicket,destination,pushTrail,readBookmark,safePath,returnLabel} from './core.mjs';
let singleton;
export function connectJourney(){return singleton??=(async()=>{
 let config;try{config=await fetch(new URL('config.json',import.meta.url),{cache:'no-store'}).then(r=>r.ok?r.json():null);}catch{return null;}
 if(!validConfig(config))return null;
 const site=Object.keys(config.sites).find(id=>config.sites[id].origin===location.origin);
 if(!site)return null; // The older, single-site preview remains usable independently.
 const address=new URL(location.href),candidate=decodeTicket(address.searchParams.get('journey'));
 const ticket=candidate?.to===site?candidate:null;
 let trail=ticket?.trail||[],capture=()=>({}),kind=site==='future-dads'?'episode':site==='nowbrary'?'shelf':'writing';
 const storage={getItem:key=>{try{return sessionStorage.getItem(key);}catch{return null;}},setItem:(key,value)=>{try{sessionStorage.setItem(key,value);return true;}catch{return false;}}};
 const resumeId=address.searchParams.get('resume');
 const viewURL=new URL(address);viewURL.searchParams.delete('resume');viewURL.hash='';
 const viewKey='journey:view:'+viewURL.pathname+viewURL.search;
 let view=null;try{view=JSON.parse(storage.getItem(viewKey)||'null');if(!view||Date.now()-view.at>86400000)view=null;}catch{}
 const restored=readBookmark(storage,resumeId)||view;
 if(restored&&Array.isArray(restored.trail))trail=restored.trail;
 if(resumeId){const clean=new URL(location.href);clean.searchParams.delete('resume');history.replaceState(history.state,'',clean.pathname+clean.search+clean.hash);}
 function cleanHref(){const u=new URL(location.href);u.searchParams.delete('resume');return u.pathname+u.search+u.hash;}
 function snapshot(){
  const detail={};document.dispatchEvent(new CustomEvent('journey:save',{detail}));
  const snapshot={href:cleanHref(),at:Date.now(),trail,scroll:window.scrollY,custom:capture(),detail};
  snapshot.audio=[...document.querySelectorAll('audio')].map(a=>({src:a.currentSrc||a.src,time:a.currentTime,volume:a.volume,playing:!a.paused,muted:a.muted}));
  return snapshot;
 }
 function checkpoint(returnTo){
  const id=crypto.randomUUID().replaceAll('-','');
  const saved=snapshot();
  if(returnTo&&safePath(returnTo.href)&&Number.isFinite(returnTo.scroll)){saved.href=safePath(returnTo.href);saved.scroll=Math.max(0,returnTo.scroll);}
  storage.setItem('journey:bookmark:'+id,JSON.stringify(saved));
  // Prune this module's own expired bookmarks only; never inspect another application's storage.
  try{const keys=Object.keys(sessionStorage).filter(k=>k.startsWith('journey:bookmark:'));for(const key of keys.slice(0,Math.max(0,keys.length-40)))sessionStorage.removeItem(key);}catch{}
  return {site,id,kind};
 }
 function inheritReadingPage(){
  if(parent===window)return;
  try{if(parent.location.origin!==location.origin)return;const detail={source:window,trail:null};parent.document.dispatchEvent(new CustomEvent('journey:checkpoint',{detail}));if(Array.isArray(detail.trail))trail=detail.trail;}catch{}
 }
 function leave(url){
  document.querySelectorAll('audio,video').forEach(a=>a.pause());
  document.body.classList.add('journey-leaving');(window.top===window?window:window.top).location.assign(url);
 }
 async function cross(url){
  const target=new URL(url);
  if(target.origin!==location.origin){
   try{const response=await fetch(new URL('/journey/ready.json',target.origin),{mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(5000)});const ready=await response.json();if(!response.ok||ready.version!==1||config.sites[ready.site]?.origin!==target.origin)throw Error('Not ready');}
   catch{
    document.querySelector('.journey-crossing-error')?.remove();
    const panel=document.createElement('section');panel.className='journey-crossing-error';panel.setAttribute('role','alert');
    const message=document.createElement('p');message.textContent='That place could not open. You can stay here or try again.';
    const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=()=>{panel.remove();void cross(url);};
    const stay=document.createElement('button');stay.textContent='Stay here';stay.onclick=()=>{panel.remove();document.dispatchEvent(new Event('journey:cancel'));};
    panel.append(message,retry,stay);document.body.append(panel);stay.focus();return false;
   }
  }
  leave(url);return true;
 }
 const api={site,config,ticket,restored,storage,
  get entry(){return ticket?.entry||address.searchParams.get('entry')||'jetty';},
  register(type,getter){kind=type;capture=getter||(()=>({}));},
  url(to,entry){return destination(config,to,entry,{trail,from:site});},
  checkpointTrail(returnTo){return pushTrail(trail,checkpoint(returnTo));},
  go(to,entry='jetty'){inheritReadingPage();return cross(destination(config,to,entry,{trail:pushTrail(trail,checkpoint()),from:site}));},
  resume(crumb){const index=trail.findLastIndex(c=>c.id===crumb.id&&c.site===crumb.site);return cross(destination(config,crumb.site,'jetty',{resume:crumb.id,from:site,trail:index>=0?trail.slice(0,index):[]}));},
  page(to,path){inheritReadingPage();if(!config.sites[to]||!safePath(path))return;const u=new URL(path,config.sites[to].origin);u.searchParams.set('journey',JSON.stringify({v:1,to,entry:'content',from:site,trail:pushTrail(trail,checkpoint())}));return cross(u.href);},
  get activity(){const activities=[...trail].reverse().filter(c=>['episode','shelf','writing'].includes(c.kind));return ticket?.entry==='radio'?activities[0]:activities.find(c=>c.site===site)||activities[0];},
  get previous(){return trail.at(-1);},
  returnButton(host){const crumb=api.activity;if(!crumb)return null;const a=document.createElement('a');a.className='journey-return';a.href=destination(config,crumb.site,'jetty',{resume:crumb.id,from:site,trail:trail.slice(0,trail.indexOf(crumb))});a.textContent=returnLabel(crumb.kind);host.append(a);return a;},
  contentLink(href){const u=new URL(href,location.origin);if(u.origin!==location.origin||!safePath(u.pathname+u.search+u.hash))return;const crumb=checkpoint();u.searchParams.set('journey',JSON.stringify({v:1,to:site,entry:'content',from:site,trail:pushTrail(trail,crumb)}));leave(u.href);}
 };
 if(restored){
  // Expose only the local bookmark to the local page adapter; nothing is sent to another site.
  document.addEventListener('journey:restore-ready',()=>restoreNative(restored),{once:true});
 }
 addEventListener('pageshow',()=>document.body.classList.remove('journey-leaving'));
 addEventListener('pagehide',()=>storage.setItem(viewKey,JSON.stringify(snapshot())));
 return api;
})();}
export function restoreNative(bookmark){
 for(const [i,a] of [...document.querySelectorAll('audio')].entries()){
  const saved=bookmark.audio?.[i];if(!saved||(a.currentSrc||a.src)!==saved.src)continue;
  a.volume=Math.max(0,Math.min(1,saved.volume??.25));a.muted=!!saved.muted;
  const seek=()=>{if(Number.isFinite(saved.time))a.currentTime=Math.max(0,Math.min(saved.time,Number.isFinite(a.duration)?a.duration: saved.time));};
  if(a.readyState)seek();else{a.addEventListener('loadedmetadata',seek,{once:true});a.load();}
  // A return never surprises the listener with sound. Native Play resumes the saved position.
 }
 requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo({top:Number.isFinite(bookmark.scroll)?bookmark.scroll:0,behavior:'instant'})));
}
