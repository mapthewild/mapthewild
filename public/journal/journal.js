import {headerMarkup,voyageMarkup,departureMarkup,mobileMarkup} from './markup.mjs';

let data;
if(document.body.hasAttribute('data-journal-essay')) {
  try {
    const records=await fetch('/mapthewild/journal-essays.json').then(r=>{if(!r.ok)throw Error('Navigation unavailable');return r.json();});
    data=records.find(p=>p.path===location.pathname.replace(/\/$/,''));
    if(data) {
      const content=document.createElement('div');content.id='journal-content';content.className='journal-reading-content essay-document';content.tabIndex=-1;
      const oldNav=document.querySelector('.essay-nav');
      const end=document.querySelector('.reading-world-mode');
      let item=oldNav.nextSibling;
      while(item&&item!==end){const next=item.nextSibling;content.append(item);item=next;}
      oldNav.remove();end?.remove();
      // The shared footer already supplies Writing; keep only adjacent essays here.
      content.querySelector('.essay-footer .all-posts')?.remove();
      document.body.classList.add('journal-site','journal-reading','journal-essay');
      const layout=document.createElement('div');layout.className='journal-reading-layout';
      layout.innerHTML='<aside class="journal-companion" aria-label="Your place in the article"><div id="journal-side-slot"></div><div id="journal-guide"></div></aside>';
      layout.append(content);document.body.prepend(layout);
      layout.insertAdjacentHTML('beforebegin',headerMarkup(data)+'<div id="journal-top-slot">'+voyageMarkup(data)+'</div>');
      layout.insertAdjacentHTML('afterend','<div id="journal-departure-slot"></div><footer class="journal-footer"><nav aria-label="Site"><a href="/mapthewild/">Home</a><a href="/mapthewild/posts/">Writing</a><a href="/mapthewild/islands/">Places</a><a href="/mapthewild/about/">About</a></nav></footer>');
    }
  } catch { /* Original essay navigation remains available if loading fails. */ }
} else {
  const json=document.querySelector('#journal-data');
  if(json) data=JSON.parse(json.textContent);
}

if(data) {
  const voyage=document.querySelector('.journal-voyage');
  const top=document.querySelector('#journal-top-slot');
  const departureSlot=document.querySelector('#journal-departure-slot');
  if(departureSlot) departureSlot.innerHTML=departureMarkup();
  const end=document.querySelector('#journal-end-slot');
  const article=document.body.classList.contains('journal-reading');
  if(article) document.body.insertAdjacentHTML('beforeend',mobileMarkup(data));
  const side=document.querySelector('#journal-side-slot'),dialog=document.querySelector('#journal-voyage-dialog');
  const bar=document.querySelector('.journal-mobile');
  const board=voyage?.querySelector('.journal-route-board'),boat=voyage?.querySelector('.journal-boat');
  const stops=voyage?[...voyage.querySelectorAll('.journal-stop')]:[];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const scroller=voyage?.querySelector('.journal-route-scroll');
  const scrollControls=voyage?.querySelector('.journal-scroll-controls');
  const scrollButtons=scrollControls?[...scrollControls.querySelectorAll('button')]:[];
  let moving=false,tick=0,positionFrame=0;
  function updateScrollControls() {
    if(!scroller)return;
    const narrow=!!board.closest('.journal-companion');
    const limit=narrow?scroller.scrollHeight-scroller.clientHeight:scroller.scrollWidth-scroller.clientWidth;
    const position=narrow?scroller.scrollTop:scroller.scrollLeft;
    scrollControls.hidden=limit<2||scroller.clientHeight===0;
    scrollButtons.forEach(button=>{
      const previous=Number(button.dataset.routeScroll)<0;
      button.disabled=previous?position<2:position>limit-2;
      button.textContent=narrow?(previous?'↑':'↓'):(previous?'←':'→');
    });
  }
  scroller?.addEventListener('scroll',updateScrollControls,{passive:true});
  scrollButtons.forEach(button=>button.addEventListener('click',()=>{
    const narrow=!!board.closest('.journal-companion');
    const amount=(narrow?scroller.clientHeight:scroller.clientWidth)*.8*Number(button.dataset.routeScroll);
    scroller.scrollBy({[narrow?'top':'left']:amount,behavior:reduce.matches?'instant':'smooth'});
  }));
  const point=stop=>{const b=board.getBoundingClientRect(),m=stop.querySelector('.journal-marker').getBoundingClientRect();return {x:m.left-b.left+m.width/2,y:m.top-b.top-17};};
  const placeBoat=p=>{boat.style.left=p.x+'px';boat.style.top=p.y+'px';};
  function drawRoute() {
    if(!board||moving)return;
    const narrow=!!board.closest('.journal-companion');
    const scroller=voyage.querySelector('.journal-route-scroll');
    board.style.width=(narrow?scroller.clientWidth:Math.max(scroller.clientWidth,stops.length*168+24))+'px';
    const pts=stops.map(point),svg=board.querySelector('svg');
    svg.setAttribute('viewBox',`0 0 ${board.clientWidth} ${board.clientHeight}`);
    svg.innerHTML=pts.slice(1).map((p,i)=>`<path d="M ${pts[i].x} ${pts[i].y} C ${pts[i].x+35} ${pts[i].y+15}, ${p.x-35} ${p.y-15}, ${p.x} ${p.y}"/>`).join('');
    const current=stops.find(s=>s.hasAttribute('aria-current'));
    placeBoat(current?point(current):{x:38,y:42});
    if(current) {
      if(narrow)scroller.scrollTop=Math.max(0,current.offsetTop-scroller.clientHeight/2+current.clientHeight/2);
      else scroller.scrollLeft=Math.max(0,point(current).x-scroller.clientWidth/2);
    }
    updateScrollControls();
  }
  function move(slot) {
    if(!voyage||!slot||voyage.parentNode===slot)return;
    const focused=voyage.contains(document.activeElement)?document.activeElement:null;
    slot.append(voyage);drawRoute();
    if(focused) {
      // append() drops focus. A phone's closed panel must not receive it.
      const target=slot.id==='journal-dialog-slot'&&!dialog?.open
        ? document.querySelector('#journal-open-voyage')
        : focused.getClientRects().length?focused:voyage.querySelector('.journal-window');
      target?.focus({preventScroll:true});
    }
  }
  function position() {
    positionFrame=0;
    if(!voyage||dialog?.open||moving)return;
    if(!article)return;
    const atEnd=end.getBoundingClientRect().top<innerHeight*.78;
    const pastTop=top.getBoundingClientRect().bottom<30;
    bar.hidden=atEnd||!pastTop||innerWidth>760;
    if(atEnd)move(end);
    else if(pastTop)move(innerWidth>760?side:document.querySelector('#journal-dialog-slot'));
    else move(top);
  }
  function measure() {
    if(dialog?.open)dialog.close();
    move(top);drawRoute();
    if(voyage){const h=voyage.getBoundingClientRect().height;top.style.minHeight=h+'px';if(end)end.style.minHeight=h+'px';}
    position();
  }
  if(voyage) {
    voyage.addEventListener('click',event=>{
      const stop=event.target.closest('.journal-stop');
      if(!stop||moving||event.defaultPrevented||event.button||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||stop.target||stop.hasAttribute('download')||new URL(stop.href).origin!==location.origin||reduce.matches)return;
      if(stop.hasAttribute('aria-current'))return;
      event.preventDefault();moving=true;
      const from={x:parseFloat(boat.style.left)||30,y:parseFloat(boat.style.top)||42},to=point(stop),started=performance.now();
      boat.style.setProperty('--facing',to.x>=from.x?1:-1);
      function sail(now){const t=Math.min(1,(now-started)/600),e=t*t*(3-2*t);placeBoat({x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e-Math.sin(e*Math.PI)*7});if(t<1)tick=requestAnimationFrame(sail);else location.assign(stop.href);}
      tick=requestAnimationFrame(sail);
    });
  }
  if(article) {
    const root=document.querySelector('#journal-content');
    const prose=root.querySelector('.prose')||root;
    const heads=[...prose.querySelectorAll('h2')];
    const words=prose.textContent.trim().split(/\s+/).length;
    const guide=document.querySelector('#journal-guide');
    const label=document.createElement('p');label.className='journal-guide-title';label.textContent=data.title;guide.append(label);
    const time=document.createElement('p');time.className='journal-guide-meta';time.textContent=`About ${Math.max(1,Math.ceil(words/220))} min`;guide.append(time);
    if(heads.length>=3&&words>=500){
      document.body.classList.add('journal-has-outline');
      const toc=document.createElement('nav');toc.className='journal-toc';toc.setAttribute('aria-label','In this article');
      heads.forEach((h,i)=>{if(!h.id)h.id='reading-section-'+i;const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;toc.append(a);});guide.append(toc);
      const updateToc=()=>{const active=[...heads].reverse().find(h=>h.getBoundingClientRect().top<innerHeight*.3)||heads[0];toc.querySelectorAll('a').forEach(a=>{if(a.hash==='#'+active.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});};
      const observer=new IntersectionObserver(updateToc,{rootMargin:'-15% 0px -60% 0px'});heads.forEach(h=>observer.observe(h));updateToc();
    }
    document.querySelector('#journal-open-voyage').addEventListener('click',()=>{move(document.querySelector('#journal-dialog-slot'));dialog.showModal();drawRoute();});
    document.querySelector('#journal-close-voyage').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',position);
    dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientY<b.top||event.clientY>b.bottom||event.clientX<b.left||event.clientX>b.right)dialog.close();}});
  }
  addEventListener('scroll',position,{passive:true});
  addEventListener('resize',measure);
  addEventListener('hashchange',position);
  addEventListener('pageshow',()=>{moving=false;cancelAnimationFrame(tick);measure();});
  document.fonts.ready.then(measure);measure();
}

if(document.body.hasAttribute('data-journal-essay')){document.body.dataset.journalReady='true';document.dispatchEvent(new Event('mtw:journal-ready'));}
