import {connectJourney} from './client.mjs';
// The book reader is an owned same-origin iframe. Its top-layer dialog needs its own way out.
if(parent!==window){
 const a=document.createElement('a');a.className='journey-native-explore journey-reader-link';a.href='/explore/';a.textContent='Explore';
 a.addEventListener('click',e=>{if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();parent.postMessage({type:'journey:explore'},location.origin);});
 const attach=()=>{const dialog=document.querySelector('dialog[open]');(dialog||document.body).append(a);};
 new MutationObserver(()=>{const dialog=document.querySelector('dialog[open]');if(a.parentElement!==(dialog||document.body))attach();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});attach();
}else{
 const journey=await connectJourney();
 if(journey){
  const domains={'mapthewild.xyz':'mapthewild','nowbrary.com':'nowbrary','futuredadsclub.com':'future-dads'};
  for(const link of document.querySelectorAll('a[href]')){try{const u=new URL(link.href),owner=domains[u.hostname];if(owner)link.href=new URL(u.pathname+u.search+u.hash,journey.config.sites[owner].origin).href;}catch{}}
  journey.register(journey.site==='future-dads'?'episode':journey.site==='nowbrary'?'shelf':'writing');
  const start=()=>journey.go(journey.site,journey.site==='mapthewild'?'sea':'jetty');
  let a=document.querySelector('[data-journey-explore]');
  if(!a&&journey.site!=='mapthewild'){
   a=document.createElement('a');a.className='journey-native-explore';a.textContent='Explore';a.dataset.journeyExplore='';
   const header=document.querySelector('.masthead,.g-top,header');if(header)header.append(a);else{a.classList.add('journey-reader-link');document.body.append(a);}
  }
  if(a)a.href=journey.url(journey.site,'jetty');
  if(journey.previous?.site===journey.site&&journey.previous.kind==='place'){const back=document.createElement('button');back.className='journey-return';back.textContent=journey.site==='future-dads'?'Back to the radio':'Back to the bookshop';back.onclick=()=>journey.resume(journey.previous);document.querySelector('.masthead,.g-top,header')?.append(back);}
  document.addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const owned=link.matches('[data-journey-explore]')||journey.site==='mapthewild'&&link.matches('[data-world-mode]');
   if(owned){event.preventDefault();event.stopImmediatePropagation();start();}
  },true);
  document.addEventListener('journey:checkpoint',e=>{
   const frame=e.detail&&[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.detail.source);if(!frame)return;
   let returnTo;if(frame.id==='sea-frame'&&document.querySelector('#explore-entry')){
    const u=new URL(location.href);for(const key of ['explore','shore','visit','place'])u.searchParams.delete(key);u.hash='';
    returnTo={href:u.pathname+u.search,scroll:0}; // Match the blog's existing Back to writing action.
   }
   e.detail.trail=journey.checkpointTrail(returnTo);
  });
  addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='journey:explore'&&[...document.querySelectorAll('iframe')].some(f=>f.contentWindow===e.source))start();});
  document.querySelectorAll('audio').forEach(a=>a.volume=.25);
  document.dispatchEvent(new Event('journey:restore-ready'));
  if(journey.restored?.audio?.some(a=>a.playing)){
   const p=document.createElement('p');p.className='journey-resume-note';p.textContent='Your episode is at the place you left it. Press Play to continue.';p.setAttribute('role','status');document.querySelector('audio')?.after(p);
  }
 }
}
