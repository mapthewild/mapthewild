/* Nowbrary — a shelf of familiar books, opening to the words kept inside. */
(() => {
  'use strict';
  const embedded=new URLSearchParams(location.search).get('embed')==='gallery'&&parent!==window;
  if(embedded)document.documentElement.classList.add('gallery-reader');
  let galleryOrigin=null, gallerySpine=null;
  const tellGallery=type=>{if(embedded&&galleryOrigin)parent.postMessage({type},galleryOrigin);};
  const shelf = document.querySelector('.bookcase');
  const dialog = document.querySelector('.open-book');
  const rig = document.querySelector('.book-rig');
  const binding = document.querySelector('.rig-spine');
  const board = document.querySelector('.front-board');
  const bundle = document.querySelector('.left-bundle');
  const keepsakeHolder = document.querySelector('.keepsake-holder');
  const leafHolder = document.querySelector('.leaves');
  const leftStack = document.querySelector('.left-page-block');
  const rightPage = document.querySelector('.right-page');
  const leftReading = document.querySelector('.left-reading');
  const readerNav = document.querySelector('.reader-nav');
  const reader = new BookReader(leftReading,rightPage,readerNav);
  const turnShadow = document.querySelector('.page-turn-shadow');
  const shadowShape=document.createElement('div');shadowShape.className='paper-shadow-shape';turnShadow.append(shadowShape);
  const shadow = document.querySelector('.book-shadow');
  const closeButton = document.querySelector('.close-book');
  const grips = [...document.querySelectorAll('.page-grip')];
  const coverGrip = document.querySelector('.cover-grip');
  const keepsake = document.querySelector('.keepsake');
  const keepsakeShadow = document.querySelector('.keepsake-shadow');
  const ribbon = document.querySelector('.ribbon-main');
  const dust = document.querySelector('.dust');
  const reducedMotion = matchMedia(embedded && new URLSearchParams(location.search).get('motion') === 'off' ? 'all' : '(prefers-reduced-motion: reduce)');
  const bookmark = new BookmarkRibbon(ribbon, document.querySelector('.ribbon-grip'), reducedMotion);
  const cubbies = [...shelf.querySelectorAll('.cubby')];
  const positions = [0, 6, 2, 7, 4, 1, 5, 3];
  const colors = [['#88412f', '#eed9ab'], ['#3a5147', '#d9c596'], ['#8a6b6b', '#f5f0e6'], ['#b49757', '#372f28']];
  const books = new Map();
  const empty = document.createElement('div');
  const paper = new BoundPaper(leafHolder, empty, empty);
  const spreadTurn = new BookTurnRenderer(rig,dialog,paper,bookmark);
  let preparation=0;
  const flyleaves = [...document.querySelectorAll('.flyleaf')].map(host => ({host, paper: new BoundPaper(host, empty, empty, 40)}));
  const motes = Array.from({length: 13}, (_, i) => {
    const mote = document.createElement('i');
    dust.append(mote);
    return {el: mote, x: (i * .6180339) % 1, y: (i * .4142135) % 1};
  });
  const openingDuration = 3100;
  const closingDuration = 1650;
  let current = null, geometry = null, progress = 0, pageProgress = 1;
  let pageFrom = 0, pageSkew = .46, pageCornerSide = 'bottom';
  let frame = 0, pageFrame = 0, pagePaintFrame = 0, priorHash = '', pointerOutside = false;
  let drag = null, ignoreClick = false, restingPage = 1, closingPageCap = 1;
  let leafFrame = 0, leafLift = 0;
  let coverFrame = 0, coverProgress = 0, coverDrag = null, coverIgnoreClick = false;
  let pageCommitted = false, coverCommitted = false, coverPageStart = 1, turnFocus = null, pendingClose = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const lerp = (a,b,t) => a + (b-a)*t;
  const smooth = t => { t = clamp(t); return t*t*(3-2*t); };
  const phase = (a,b,t) => smooth((t-a)/(b-a));
  function hashId() { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } }
  function replaceHash(hash) {
    try { history.replaceState(null, '', location.pathname + location.search + hash); }
    catch { location.hash = hash; }
  }
  function sizeSpine(item) {
    if (item.spine.parentElement !== item.button) return;
    const style = getComputedStyle(item.button);
    item.spine.style.width = style.height;
    item.spine.style.height = style.width;
  }
  function layout() {
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    const mobile = vw < 640;
    const width = mobile ? vw - 48 : Math.min(382, (vw - 134)/2, (vh - 166)*.67);
    const height = mobile ? Math.min(vh - 182, Math.max(470, width*1.7)) : width/.67;
    const rect = gallerySpine?{left:gallerySpine.x,top:gallerySpine.y,width:gallerySpine.w,height:gallerySpine.h}:current.button.getBoundingClientRect();
    const style = getComputedStyle(current.button);
    const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
    const scale = (gallerySpine?rect.height:parseFloat(style.height))/height;
    const depth = (gallerySpine?rect.width:parseFloat(style.width))/scale;
    geometry = {
      width, height, mobile, vw, vh, depth, scale,
      top: Math.max(62, (vh-height)/2 - 9),
      closedLeft: (vw-width)/2,
      openLeft: mobile ? 24 : vw/2,
      sourceX: rect.left + rect.width/2 + depth/2*scale,
      sourceY: rect.top + rect.height/2 - height/2,
      sourceFont: parseFloat(style.fontSize),
      lean: gallerySpine?0:Math.atan2(matrix.b,matrix.a)*180/Math.PI
    };
    rig.style.setProperty('--page-width', width+'px');
    rig.style.setProperty('--page-height', height+'px');
    rig.style.setProperty('--book-depth', depth+'px');
    dialog.dataset.mobile = String(mobile);
    // The reading cloth follows the book's footprint without changing its geometry.
    dialog.style.setProperty('--reading-width', (mobile ? width : width * 2) + 'px');
    dialog.style.setProperty('--reading-height', height + 'px');
    dialog.style.setProperty('--reading-top', geometry.top + 'px');
    bookmark.layout(height,width,current.data.id+(mobile?':single':':spread'));
  }
  function renderKeepsake(arrival = 1, lift = leafLift) {
    if (!geometry) return;
    const g = geometry;
    const travel = phase(.58, 1, arrival);
    const air = Math.sin(Math.PI * travel);
    const amount = Math.max(air, lift);
    const dx = g.mobile ? 0 : (1 - travel) * g.width * .77 + lift * 16;
    const dy = g.mobile ? -lift * 14 : -air * 80 - (1-travel)*20 - lift*56;
    const z = 18 + amount*65;
    const roll = -19 + air*29 + Math.sin(travel*Math.PI*4)*air*12 + lift*21;
    const pitch = Math.sin(travel*Math.PI*5)*air*35 + lift*25;
    const visible = phase(.49,.63,arrival);
    keepsake.style.opacity = visible;
    keepsake.style.transform = `translate3d(${dx}px,${dy}px,${z}px) rotateZ(${roll}deg) rotateX(${pitch}deg) rotateY(${amount*-22}deg)`;
    keepsakeShadow.style.opacity = visible * (.21 - amount*.13);
    keepsakeShadow.style.filter = `brightness(.1) sepia(1) blur(${1.4+amount*7}px)`;
    keepsakeShadow.style.transform = `translate3d(${dx+4+amount*14}px,${dy+4+amount*30}px,12px) rotateZ(${roll}deg) scale(${1-amount*.13})`;
    // In the single-page layout the small keepsake overlaps the upper corner.
    // Keep that corner available to the sheet rather than a decorative target.
    const leafInert = g.mobile || reducedMotion.matches || dialog.dataset.state !== 'open';
    if (leafInert && keepsake.contains(document.activeElement)) dialog.focus({preventScroll:true});
    keepsake.inert = leafInert;
    ribbon.style.opacity=phase(.42,.7,arrival);
    document.querySelector('.ribbon-left').style.opacity=phase(.75,.9,arrival);
    dialog.style.setProperty('--breath', amount);
    for (const [i, mote] of motes.entries()) {
      const t = clamp((travel-mote.y*.16)/.84);
      mote.el.style.left = `${g.vw*.31 + mote.x*g.width*1.3 + t*42}px`;
      mote.el.style.top = `${g.top+g.height*.18 + mote.y*g.height*.75 - t*95 + Math.sin(t*4+i)*8}px`;
      mote.el.style.opacity = reducedMotion.matches ? 0 : Math.sin(Math.PI*t) * .65;
    }
  }
  function liftKeepsake() {
    if (reducedMotion.matches || dialog.dataset.state !== 'open') return;
    cancelAnimationFrame(leafFrame);
    const start = performance.now();
    function tick(now) {
      const t = clamp((now-start)/1600);
      leafLift = Math.pow(Math.sin(Math.PI*t), 1.4) * (1-t*.3);
      renderKeepsake(1);
      if(t < 1) leafFrame=requestAnimationFrame(tick); else {leafLift=0;leafFrame=0;}
    }
    leafFrame=requestAnimationFrame(tick);
  }
  function printedPage(item) {
    const content = document.createElement('div');
    content.className = 'leaf-print';
    const heading = document.createElement('h2');
    heading.textContent = item.data.title;
    const author = document.createElement('p');
    author.textContent = item.data.author;
    content.append(heading, author, document.createElement('i'));
    return content;
  }
  function renderPage(value, corner = 1) {
    if (!geometry) return;
    pageProgress = clamp(value);
    const options={origin:pageFrom,skew:pageSkew,corner:pageCornerSide};
    if(spreadTurn.active)spreadTurn.render(pageProgress,corner,options);
    else paper.render(pageProgress, geometry.width, geometry.height, corner, options);
    // The atomic renderer depth-tests the cloth against the curled sheet.
    // Keep its interactive plane accessible instead of hiding it wholesale.
    bookmark.setPage(spreadTurn.active?1:pageProgress);
    bookmark.setEnabled(dialog.dataset.state==='open' && !drag && !pageCommitted && !coverDrag && !coverCommitted);
    const curl = Math.sin(Math.PI*pageProgress);
    const silhouette=paper.shadowPolygon();
    turnShadow.style.left=-geometry.width+'px';turnShadow.style.width=geometry.width*2+'px';
    turnShadow.style.opacity=curl*.20;
    turnShadow.style.transform='translateZ(1px)';
    shadowShape.style.background='#52472f';
    shadowShape.style.clipPath=silhouette.length?`polygon(${silhouette.map(p=>`${p.x+geometry.width}px ${p.y}px`).join(',')})`:'none';
    turnShadow.style.filter=`blur(${2+curl*7}px)`;
    dialog.dataset.turn = pageProgress.toFixed(4);
    const pageInert = !!reader.transition || dialog.dataset.state !== 'open';
    if (pageInert && rightPage.contains(document.activeElement)) dialog.focus({preventScroll:true});
    rightPage.inert = pageInert;
    leftReading.inert = pageInert || geometry.mobile;
    if(dialog.dataset.state === 'open') renderKeepsake();
  }
  function render(value) {
    if (!current || !geometry) return;
    const g = geometry;
    bundle.style.transform='';keepsakeHolder.style.transform='';for(const grip of grips)grip.style.opacity='';
    if(leafHolder.parentElement!==bundle)bundle.append(leafHolder);
    const arrival = phase(.015,.32,value), spread = phase(.29,.68,value);
    const cover = phase(.28,.58,value), page = phase(.59,.85,value);
    bookmark.setCover(1-cover);
    const x = lerp(g.sourceX,g.closedLeft,arrival) + (g.openLeft-g.closedLeft)*spread;
    const y = lerp(g.sourceY,g.top,arrival) - Math.sin(Math.PI*arrival)*24 + Math.sin(Math.PI*phase(.7,1,value))*2;
    const scale = lerp(g.scale,1,arrival);
    const yaw = lerp(90,-16,arrival)*(1-spread);
    const roll = lerp(g.lean,-5,arrival)*(1-spread) - (g.mobile ? 0 : 2.2)*spread;
    const pitch = g.mobile ? Math.sin(Math.PI*arrival)*3 : arrival*(4+8*spread);
    rig.style.left = x+'px'; rig.style.top = y+'px';
    rig.style.transform = `scale(${scale}) rotateZ(${roll}deg) rotateY(${yaw}deg) rotateX(${pitch}deg)`;
    current.spine.style.fontSize = (g.sourceFont/g.scale)+'px';
    board.style.transform = `translateZ(${lerp(12,-8,cover)}px) rotateY(${-180*cover}deg)`;
    rightPage.style.transform = `rotateY(${.8*spread}deg)`;
    leftStack.style.visibility = value > .76 ? 'visible' : 'hidden';
    leftStack.style.transform = 'translateZ(-4px)';
    pageFrom=0;pageSkew=.46;pageCornerSide='bottom';renderPage(Math.min(page,closingPageCap));
    for(const [i,leaf] of flyleaves.entries()) {
      const p = i === 0 ? phase(.51,.76,value) : phase(.44,.69,value);
      leaf.host.style.transform = `translateZ(${p===1 ? (i ? -6 : -3) : (i ? 7 : 5)}px)`;
      leaf.paper.render(p,g.width,g.height,i ? .8 : 1.15);
    }
    renderKeepsake(value);
    shadow.style.left = (x-g.width*spread)+'px';
    shadow.style.top = (g.top+30)+'px';
    shadow.style.width = (g.width*(1+spread))+'px';
    shadow.style.height = (g.height-3)+'px';
    shadow.style.opacity = .24*arrival;
    shadow.style.filter = `blur(${lerp(35,17,spread)}px)`;
    shadow.style.transform = `scale(${lerp(.8,1,arrival)}) rotate(-2.2deg)`;
    dialog.style.setProperty('--arrival',arrival);
    dialog.dataset.phase = value < .42 ? 'lifting' : value < .61 ? 'cover' : 'paper';
  }
  function cancelMotion() { cancelAnimationFrame(frame); frame=0; }
  function cancelPage() { cancelAnimationFrame(pageFrame);cancelAnimationFrame(pagePaintFrame);pageFrame=0;pagePaintFrame=0;reader.waitingForPaint=false; }
  function finishOpen(focus=true) {
    pendingClose=false;
    cancelPage();delete dialog.dataset.coverMoving;
    cancelMotion(); cancelAnimationFrame(leafFrame); leafFrame=0; leafLift=0;
    cancelAnimationFrame(coverFrame); coverFrame=0; coverProgress=0; coverDrag=null;
    coverCommitted=false; pageCommitted=false;delete dialog.dataset.dragging;
    progress=1; dialog.dataset.state='open';
    render(1); reader.paint(); restReading();
    bookmark.setEnabled(true); coverGrip.inert=false;
    closeButton.inert=false;
    if (focus) dialog.focus({preventScroll:true});
    tellGallery('opened');
  }
  function finishClose(returnFocus=true) {
    preparation++;spreadTurn.hide();
    pendingClose=false;
    cancelMotion(); cancelPage(); cancelAnimationFrame(leafFrame); leafFrame=0; leafLift=0; drag=null;
    cancelAnimationFrame(coverFrame); coverFrame=0; coverDrag=null; coverProgress=0;
    bookmark.stop(); bookmark.setEnabled(false);
    if (!current) return;
    if(reader.transition)reader.finish(false);reader.remember();
    const item=current;
    item.spine.style.fontSize=''; item.button.append(item.spine);
    delete item.button.dataset.away; sizeSpine(item);
    dialog.close(); dialog.dataset.state='closed';
    current=null; progress=0; pointerOutside=false;
    if (returnFocus) { item.button.dataset.returned=''; item.button.focus({preventScroll:true}); }
    tellGallery('closed');gallerySpine=null;
  }
  function moveTo(target) {
    cancelMotion(); cancelPage();
    if (reducedMotion.matches) { target ? finishOpen() : finishClose(); return; }
    const from=progress, duration=Math.abs(target-from)*(target ? openingDuration : closingDuration);
    const start=performance.now();
    function tick(now) {
      const elapsed=duration ? clamp((now-start)/duration) : 1;
      progress=lerp(from,target,elapsed); render(progress);
      if (elapsed<1) frame=requestAnimationFrame(tick);
      else target ? finishOpen() : finishClose();
    }
    frame=requestAnimationFrame(tick);
  }
  function turnTo(target, duration=600, done, velocity=0) {
    cancelPage();
    if (reducedMotion.matches || (reader.transition&&!spreadTurn.active)) { renderPage(target); if(done) done(); return; }
    const from=pageProgress,start=performance.now(),travel=Math.abs(target-from);
    const landing=(target===0||target===1)&&travel>.18&&dialog.dataset.state==='open';
    duration=Math.max(160,duration*Math.pow(travel,.55));
    const travelFraction=landing?.8:1;
    const tangent=travel?Math.max(0,Math.min(2.4,velocity*duration*travelFraction/(target-from))):0;
    function tick(now) {
      const t=clamp((now-start)/duration);
      if(t<=travelFraction) {
        const u=clamp(t/travelFraction);
        // Acceleration into the turn, followed by deceleration at contact.
        const ease=u*u*(3-2*u)+tangent*u*(1-u)*(1-u);
        renderPage(lerp(from,target,ease));
      } else {
        // Once the body lands, the lightly loaded corner follows with one
        // small, damped flex. The whole sheet does not bounce as a panel.
        const u=(t-travelFraction)/(1-travelFraction);
        pageFrom=target;
        const lift=.022*Math.sin(Math.PI*u)*Math.exp(-2.6*u);
        renderPage(target+(target?-1:1)*lift);
      }
      if(t<1) pageFrame=requestAnimationFrame(tick);
      else {pageFrame=0;renderPage(target);if(done)done();}
    }
    pageFrame=requestAnimationFrame(tick);
  }
  function openBook(id,{motion=true,updateHash=true,external=null}={}) {
    const item=books.get(id); if(!item) return;
    if(current===item) {finishOpen(); return;}
    if(current) finishClose(false);
    gallerySpine=external?.rect||null;
    priorHash=books.has(hashId()) ? '' : location.hash;
    current=item; closingPageCap=1; layout(); item.button.dataset.away='';
    binding.append(item.spine); item.spine.style.width=''; item.spine.style.height='';
    dialog.style.setProperty('--spine-color',item.color);
    dialog.style.setProperty('--spine-ink',item.ink);
    dialog.style.setProperty('--annotation-color',item.data.annotationColor||'#416777');
    dialog.style.setProperty('--annotation-ink',item.data.annotationInk||'#493426');
    dialog.dataset.historical=item.data.historical?'true':'';
    dialog.dataset.binding=item.data.look?.kind||'cloth';
    binding.style.backgroundImage=external?.tex?`url("${external.tex}")`:'';
    binding.style.backgroundSize='100% 100%';binding.classList.toggle('facsimile-spine',!!external?.tex);
    if(external?.cloth)dialog.style.setProperty('--spine-color',external.cloth);
    dialog.dataset.variant=item.button.dataset.variant;
    for(const el of dialog.querySelectorAll('[data-book-title]')) el.textContent=item.data.title;
    for(const el of dialog.querySelectorAll('[data-book-author]')) el.textContent=item.data.author;
    let edition=item.data;
    if(external&&item.data.volumes?.length) {
      const volume=Math.max(0,Math.min(item.data.volumes.length-1,external.vol||0));
      edition={...item.data,id:item.data.id+':'+volume,titlePage:item.data.volumes[volume].titlePage||item.data.titlePage,pages:item.data.pages.filter(p=>p.kind==='card'||p.vol===volume+1)};
      if(!edition.pages.some(p=>p.kind!=='card'))edition.pages.push({kind:'card',printed:true,text:'No marked passages from this volume are included in this selection.'});
    }
    reader.open(edition,geometry);
    leafHolder.style.visibility='visible';leftReading.style.visibility='hidden';
    paper.setContent(printedPage(item),reader.snapshot(reader.spread()[0]));
    rightPage.inert=true;leftReading.inert=true;closeButton.inert=true;
    dialog.dataset.state='opening'; progress=0; restingPage=1; render(0);
    dialog.showModal(); dialog.focus({preventScroll:true});
    tellGallery('taken');
    if(updateHash) replaceHash('#'+encodeURIComponent(id));
    if(!motion || reducedMotion.matches) finishOpen(); else moveTo(1);
  }
  function syncGrip() {
    for(const grip of grips) {
      const direction=Number(grip.dataset.direction);
      const available=reader.destination(direction)!==null;
      grip.hidden=!available;
      grip.inert=!available || dialog.dataset.state!=='open' || pageCommitted || reader.waitingForPaint;
    }
  }
  function restReading() {
    spreadTurn.hide();
    restingPage=1;pageFrom=0;pageSkew=.46;pageCornerSide='bottom';pageProgress=1;
    leafHolder.style.visibility='hidden';leftReading.style.visibility='visible';
    turnShadow.style.opacity=0;dialog.dataset.turn='1';
    rightPage.inert=dialog.dataset.state!=='open';leftReading.inert=rightPage.inert||geometry.mobile;
    bookmark.setPage(1);bookmark.setEnabled(dialog.dataset.state==='open'&&!coverProgress);
    reader.sync();syncGrip();renderKeepsake();prepareTurns();
  }
  reader.nav.addEventListener('reader-jump',event=>{
    if(dialog.dataset.state!=='open'||pageCommitted||coverCommitted||coverDrag||bookmark.drag||reader.waitingForPaint)return;
    if(reader.transition)cancelReading();
    if(reader.goToSource(event.detail))restReading();
  });
  function prepareTurns() {
    const ticket=++preparation;
    if(reducedMotion.matches || !spreadTurn.available)return;
    reader.waitingForPaint=!spreadTurn.ready(reader,geometry);reader.sync();syncGrip();
    spreadTurn.warm(reader,geometry).finally(()=>{
      if(ticket!==preparation)return;
      reader.waitingForPaint=false;reader.sync();syncGrip();
    });
  }
  spreadTurn.onFailure=()=>{
    if(reader.transition){
      const closing=pendingClose;pendingClose=false;
      cancelPage();reader.finish(pageCommitted);pageCommitted=false;drag=null;delete dialog.dataset.dragging;restReading();
      if(closing)closeBook();
    }
  };
  function beginPage(direction,corner='bottom') {
    if(dialog.dataset.state!=='open'||pageCommitted||coverCommitted||coverDrag||bookmark.drag||bookmark.keyboardHeld||reader.waitingForPaint)return false;
    cancelAnimationFrame(coverFrame);coverFrame=0;
    if(coverProgress)renderCover(0);
    if(reader.transition && (reader.transition.direction!==direction || pageCornerSide!==corner))cancelReading();
    const active=!!reader.transition;
    if(!active && !reducedMotion.matches)spreadTurn.begin(reader,direction,geometry);
    const turn=reader.prepare(direction);if(!turn){spreadTurn.hide();return false;}
    if(!active) {
      cancelPage();pageFrom=direction>0?0:1;restingPage=pageFrom;pageSkew=.46;pageCornerSide=corner;
      if(!spreadTurn.active)paper.setContent(turn.front,turn.back);
      leafHolder.style.visibility='visible';renderPage(pageFrom);
    }
    return true;
  }
  function cancelReading() {
    cancelPage();drag=null;pageCommitted=false;
    if(reader.transition)reader.finish(false);
    restReading();
  }
  function landReading(commit,done) {
    reader.waitingForPaint=!reducedMotion.matches;
    reader.finish(commit);
    const finish=()=>{
      pagePaintFrame=0;reader.waitingForPaint=false;pageCommitted=false;
      restReading();if(done)done();
    };
    if(reducedMotion.matches){finish();return;}
    // Keep the flat turning sheet on top until its live replacement has
    // passed through a paint. Never unmount both representations together.
    rightPage.inert=true;leftReading.inert=true;
    pagePaintFrame=requestAnimationFrame(()=>{
      pagePaintFrame=requestAnimationFrame(finish);
    });
  }
  bookmark.beforeGrab=()=>{
    if(drag || pageCommitted || coverDrag || coverCommitted || dialog.dataset.state!=='open')return false;
    // A corner preview is tentative. Touching the cloth cancels it before
    // mapping the hand to the book, so neither object steals the gesture.
    if(reader.transition)cancelReading();
    return true;
  };
  function commitPage(target,velocity=0) {
    if(!reader.transition || dialog.dataset.state!=='open' || coverCommitted || coverDrag)return;
    const commit=target!==restingPage;
    pageCommitted=true;syncGrip();
    turnTo(target,600,()=>{
      landReading(commit,()=>{
        if(turnFocus){const focus=turnFocus.disabled?dialog:turnFocus;focus.focus({preventScroll:true});turnFocus=null;}
      });
    },velocity);
  }
  function advance(direction,focus=null,corner='bottom') {
    if(beginPage(direction,corner)){turnFocus=focus;commitPage(1-restingPage);}
  }
  function renderCover(value) {
    if(!geometry) return;
    coverProgress=clamp(value);
    dialog.dataset.coverMoving=String(coverProgress>0);
    const q=coverProgress, g=geometry;
    bookmark.setCover(q);bookmark.setEnabled(q===0 && dialog.dataset.state==='open');
    for(const grip of grips)grip.style.opacity=1-phase(.015,.07,q);
    // The cover and the pages already lying on it rotate as one bound stack.
    // Bending each sheet separately here adds a second perspective and lets
    // the cover intersect the paper; one shared hinge preserves their order.
    bundle.style.transform=`translateZ(${12*q}px) rotateY(${180*q}deg)`;
    board.style.transform='translateZ(-8px) rotateY(-180deg)';
    if(coverPageStart>.5) {
      if(leafHolder.parentElement!==bundle)bundle.append(leafHolder);
      paper.render(1,g.width,g.height,0);
    } else {
      if(leafHolder.parentElement===bundle)bundle.before(leafHolder);
      paper.render(0,g.width,g.height,0);
    }
    for(const [i,leaf] of flyleaves.entries()) {
      leaf.host.style.transform=`translateZ(${i ? -6 : -3}px)`;
      leaf.paper.render(1,g.width,g.height,0);
    }
    leftStack.style.transform='translateZ(-4px)';leftStack.style.visibility='visible';
    turnShadow.style.left='0';turnShadow.style.width='100%';turnShadow.style.filter='blur(8px)';
    shadowShape.style.clipPath='none';shadowShape.style.background='linear-gradient(90deg,#44341e77,#44341e22 30%,transparent 75%)';
    turnShadow.style.opacity=Math.sin(Math.PI*q)*.48;
    keepsakeHolder.style.transform=g.mobile ? '' : bundle.style.transform;
    keepsake.style.opacity=g.mobile ? 1-phase(.86,1,q) : 1;
    keepsakeShadow.style.opacity=.21;
    keepsake.inert=g.mobile || q>0 || reducedMotion.matches;
    const pitch=g.mobile?0:12*(1-Math.sin(Math.PI*q)*.75);
    rig.style.transform=`rotateZ(${g.mobile?0:-2.2}deg) rotateX(${pitch}deg)`;
    dialog.dataset.cover=q.toFixed(4);
  }
  function settleCover(target,done,velocity=0) {
    cancelAnimationFrame(coverFrame);
    if(reducedMotion.matches) {renderCover(target);if(done)done();return;}
    const from=coverProgress,start=performance.now(),duration=Math.max(170,(target ? 750 : 340)*Math.pow(Math.abs(target-from),.55));
    const tangent=target===from?0:Math.max(0,Math.min(2.4,velocity*duration/(target-from)));
    const tick=now=>{
      const t=clamp((now-start)/duration);
      renderCover(lerp(from,target,smooth(t)+tangent*t*(1-t)*(1-t)));
      if(t<1) coverFrame=requestAnimationFrame(tick);
      else {coverFrame=0;if(done)done();}
    };
    coverFrame=requestAnimationFrame(tick);
  }
  function returnToShelf() {
    // Once shut, carry the same closed volume home. No rewinding the pages.
    const g=geometry,start=performance.now(),duration=780;
    const tick=now=>{
      const t=smooth((now-start)/duration),roll=lerp(g.mobile?0:-2.2,g.lean,t);
      rig.style.left=lerp(g.openLeft,g.sourceX,t)+'px';
      rig.style.top=(lerp(g.top,g.sourceY,t)-Math.sin(Math.PI*t)*20)+'px';
      rig.style.transform=`scale(${lerp(1,g.scale,t)}) rotateZ(${roll}deg) rotateY(${90*t}deg) rotateX(${(g.mobile?0:12)*(1-t)}deg)`;
      shadow.style.opacity=.24*(1-t);dialog.style.setProperty('--arrival',1-t);
      if(t<1) frame=requestAnimationFrame(tick); else finishClose();
    };
    frame=requestAnimationFrame(tick);
  }
  function closeBook({motion=true,updateHash=true,velocity=0}={}) {
    if(!current || dialog.dataset.state==='closing' || pendingClose) return;
    if(reader.transition && motion && !reducedMotion.matches) {
      // Let a held sheet land before the board moves. Replacing its contents
      // immediately made an interrupted turn snap flat in a single frame.
      pendingClose=true;drag=null;delete dialog.dataset.dragging;
      const commit=Math.abs(pageProgress-restingPage)>.5;
      pageCommitted=true;syncGrip();closeButton.inert=true;
      turnTo(commit?1-restingPage:restingPage,360,()=>{
        landReading(commit,()=>{pendingClose=false;closeBook({motion,updateHash,velocity});});
      });
      return;
    }
    if(updateHash && books.has(hashId())) replaceHash(priorHash);
    if(!motion || reducedMotion.matches) {finishClose();return;}
    if(reader.transition){const commit=Math.abs(pageProgress-restingPage)>.5;cancelPage();reader.finish(commit);restReading();}
    reader.remember();
    const wasOpening=dialog.dataset.state==='opening';
    drag=null;coverDrag=null;cancelPage();cancelAnimationFrame(leafFrame);leafFrame=0;leafLift=0;
    cancelAnimationFrame(coverFrame);coverFrame=0;bookmark.stop();bookmark.setEnabled(false);
    dialog.focus({preventScroll:true});rightPage.inert=true;closeButton.inert=true;for(const grip of grips)grip.inert=true;coverGrip.inert=true;leftReading.inert=true;
    dialog.dataset.state='closing';coverCommitted=true;
    if(wasOpening) {closingPageCap=pageProgress;moveTo(0);return;}
    if(coverProgress===0) coverPageStart=pageProgress;
    if(coverProgress===0 && pageProgress>.025 && pageProgress<.975) {
      coverPageStart=pageProgress>.5?1:0;
      turnTo(coverPageStart,360,()=>settleCover(1,returnToShelf));
    } else settleCover(1,returnToShelf,velocity);
  }
  function followHash() {
    if(books.has(hashId())) openBook(hashId(),{motion:false,updateHash:false});
    else closeBook({motion:false,updateHash:false});
  }
  function drawShelf(data) {
    if(current) finishClose(false);
    for(const cubby of cubbies) cubby.replaceChildren(); books.clear();
    for(const [index,book] of data.books.entries()) {
      const [defaultColor,defaultInk]=colors[index%colors.length];
      const color=book.look?.cloth||defaultColor,ink=book.look?.ink||defaultInk;
      const button=document.createElement('button'); button.type='button'; button.className='book';
      button.setAttribute('aria-label',book.title); button.setAttribute('aria-haspopup','dialog'); button.setAttribute('aria-controls','book-dialog');
      button.dataset.bookId=book.id; button.dataset.variant=String(index%4);
      button.style.setProperty('--spine-color',color); button.style.setProperty('--spine-ink',ink);
      const spine=document.createElement('span'); spine.className='side spine'; spine.dataset.variant=String(index%4); spine.setAttribute('aria-hidden','true');
      const spineTitle=document.createElement('span'); spineTitle.className='spine-title'; spineTitle.textContent=book.title;
      const spineAuthor=document.createElement('span'); spineAuthor.className='spine-author'; spineAuthor.textContent=book.author;
      spine.append(spineTitle,spineAuthor); button.append(spine);
      button.addEventListener('click',()=>openBook(book.id));
      button.addEventListener('blur',()=>{delete button.dataset.returned;});
      button.addEventListener('pointerenter',()=>{delete button.dataset.returned;});
      cubbies[positions[index%positions.length]].append(button);
      const item={data:book,button,spine,color,ink}; books.set(book.id,item); sizeSpine(item);
    }
    followHash();
  }
  function validShelf(data) {
    return data && Array.isArray(data.books) && data.books.every(b=>typeof b.id==='string' && b.id.length>0 && typeof b.title==='string' && typeof b.author==='string' && ((typeof b.why==='string' && Array.isArray(b.highlights)) || Array.isArray(b.pages))) && new Set(data.books.map(b=>b.id)).size===data.books.length;
  }
  function localDelta(event,startX,startY) {
    const angle=(geometry.mobile?0:-2.2)*Math.PI/180;
    return (event.clientX-startX)*Math.cos(angle)+(event.clientY-startY)*Math.sin(angle);
  }
  function pageCorner(value,skew=pageSkew) {
    const g=geometry,edge=paper.corner(value,g.width,g.height,{origin:pageFrom,skew,corner:pageCornerSide});
    const sceneDepth=2600;
    const point=new DOMPoint(edge.x,edge.y-g.height/2,edge.z+3);
    const transformed=new DOMMatrixReadOnly(getComputedStyle(rig).transform).transformPoint(point);
    const x=g.openLeft+transformed.x,y=g.top+g.height/2+transformed.y,z=transformed.z;
    return {x:g.vw/2+(x-g.vw/2)*sceneDepth/(sceneDepth-z),y:g.vh/2+(y-g.vh/2)*sceneDepth/(sceneDepth-z)};
  }
  function coverPoint(value,x,y) {
    const g=geometry,angle=Math.PI*value,pitch=(g.mobile?0:12*(1-Math.sin(angle)*.75));
    const local=new DOMPoint(x*Math.cos(angle)+6*Math.sin(angle),y-g.height/2,-x*Math.sin(angle)+12*value+6*Math.cos(angle));
    const pose=new DOMMatrix().rotateAxisAngle(0,0,1,g.mobile?0:-2.2).rotateAxisAngle(1,0,0,pitch);
    const p=pose.transformPoint(local),depth=2600;
    const sx=g.openLeft+p.x,sy=g.top+g.height/2+p.y;
    return {x:g.vw/2+(sx-g.vw/2)*depth/(depth-p.z),y:g.vh/2+(sy-g.vh/2)*depth/(depth-p.z)};
  }
  for(const grip of grips) {
  const direction=Number(grip.dataset.direction);
  const cornerSide=grip.dataset.corner||'bottom';
  grip.addEventListener('pointerdown',event=>{
    if(dialog.dataset.state!=='open' || coverCommitted || coverDrag || (event.pointerType==='mouse' && event.button!==0)) return;
    if(!beginPage(direction,cornerSide))return;
    cancelPage();ignoreClick=false;
    cancelAnimationFrame(coverFrame);coverFrame=0;
    if(coverProgress) {renderCover(0);renderPage(restingPage);}
    pageFrom=restingPage;
    const corner=pageCorner(pageProgress);
    drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,start:pageProgress,corner,distance:0,time:event.timeStamp,velocity:0};
    grip.setPointerCapture(event.pointerId);event.preventDefault();
    dialog.dataset.dragging='page';
  });
  grip.addEventListener('pointermove',event=>{
    if(!drag || event.pointerId!==drag.id) return;
    const dx=event.clientX-drag.startX;
    drag.distance=Math.max(drag.distance,Math.hypot(dx,event.clientY-drag.startY));
    if(reducedMotion.matches) return;
    const dy=event.clientY-drag.startY,before=pageProgress;
    // The narrow view pans the spread, so a screen-width swipe completes a
    // turn. On a spread the held corner tracks both axes of the pointer.
    if(geometry.mobile) {
      pageSkew=Math.max(.18,Math.min(.95,.46+(pageCornerSide==='top'?dy:-dy)/geometry.height));
      renderPage(clamp(drag.start-dx/geometry.width));
    } else {
      const wantedX=drag.corner.x+dx,wantedY=drag.corner.y+dy;
      let value=pageProgress;
      for(let iteration=0;iteration<4;iteration++) {
        let lo=0,hi=1;
        for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(pageCorner(mid).x>wantedX)lo=mid;else hi=mid;}
        value=(lo+hi)/2;
        let a=.16,b=1.05;
        const vertical=pageCornerSide==='top'?-1:1;
        for(let i=0;i<12;i++){const mid=(a+b)/2;if(pageCorner(value,mid).y*vertical>wantedY*vertical)a=mid;else b=mid;}
        pageSkew=(a+b)/2;
      }
      renderPage(value);
    }
    const elapsed=Math.max(1,event.timeStamp-drag.time);
    drag.velocity=drag.velocity*.35+(pageProgress-before)/elapsed*.65;drag.time=event.timeStamp;
  });
  function release(event,cancelled=false) {
    if(!drag || event.pointerId!==drag.id) return;
    const moved=drag.distance>5;
    const velocity=event.timeStamp-drag.time<90?drag.velocity:0;
    const projected=pageProgress+Math.max(-.22,Math.min(.22,velocity*160));
    const target=cancelled ? restingPage : moved && !reducedMotion.matches ? (projected>.5?1:0) : 1-restingPage;
    drag=null;ignoreClick=true;delete dialog.dataset.dragging;
    commitPage(target,cancelled?0:velocity);
  }
  grip.addEventListener('pointerup',event=>release(event));
  grip.addEventListener('pointercancel',event=>release(event,true));
  grip.addEventListener('lostpointercapture',event=>{if(drag)release(event,true);});
  grip.addEventListener('click',event=>{
    if(ignoreClick && event.detail!==0) {ignoreClick=false;return;}
    ignoreClick=false;advance(direction,null,cornerSide);
  });
  grip.addEventListener('pointerenter',event=>{
    if(bookmark.drag || bookmark.keyboardHeld || performance.now()-bookmark.releasedAt<500 || drag || pageCommitted || coverProgress || coverDrag || event.pointerType!=='mouse' || reducedMotion.matches || dialog.dataset.state!=='open') return;
    if(beginPage(direction,cornerSide))turnTo(restingPage ? .97 : .03,220);
  });
  grip.addEventListener('pointerleave',()=>{
    if(reader.transition && !drag && !pageCommitted && !coverProgress && !coverDrag && dialog.dataset.state==='open')turnTo(restingPage,260,cancelReading);
  });
  }
  reader.previous.addEventListener('click',()=>advance(-1,reader.previous));
  reader.next.addEventListener('click',()=>advance(1,reader.next));
  // The board only moves when held. An automatic hover lift could disable
  // a nearby ribbon just as the reader reached for it.
  coverGrip.addEventListener('pointerdown',event=>{
    if(dialog.dataset.state!=='open' || drag || pageCommitted || bookmark.drag || bookmark.keyboardHeld || (event.pointerType==='mouse' && event.button!==0))return;
    cancelReading();
    cancelPage();cancelAnimationFrame(coverFrame);coverFrame=0;pageCommitted=false;coverPageStart=restingPage;
    bookmark.mapPlane();const held=bookmark.local(event);
    const localX=Math.max(-geometry.width,Math.min(-geometry.width*.1,held.x)),localY=held.y;
    coverDrag={id:event.pointerId,x:event.clientX,y:event.clientY,start:coverProgress,distance:0,time:event.timeStamp,velocity:0,localX,localY,point:coverPoint(coverProgress,localX,localY)};
    coverIgnoreClick=false;coverGrip.setPointerCapture(event.pointerId);event.preventDefault();dialog.dataset.dragging='cover';
  });
  coverGrip.addEventListener('pointermove',event=>{
    if(!coverDrag || coverDrag.id!==event.pointerId)return;
    const dx=localDelta(event,coverDrag.x,coverDrag.y);coverDrag.distance=Math.max(coverDrag.distance,Math.abs(dx));
    if(reducedMotion.matches)return;
    const before=coverProgress;
    if(geometry.mobile) {
      const start=-geometry.width*Math.cos(Math.PI*coverDrag.start);
      renderCover(Math.acos(Math.max(-1,Math.min(1,-(start+dx)/geometry.width)))/Math.PI);
    } else {
      const wanted=coverDrag.point.x+event.clientX-coverDrag.x;
      let lo=0,hi=1;
      for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(coverPoint(mid,coverDrag.localX,coverDrag.localY).x<wanted)lo=mid;else hi=mid;}
      renderCover((lo+hi)/2);
    }
    const elapsed=Math.max(1,event.timeStamp-coverDrag.time);
    coverDrag.velocity=coverDrag.velocity*.35+(coverProgress-before)/elapsed*.65;coverDrag.time=event.timeStamp;
  });
  function releaseCover(event,cancelled=false) {
    if(!coverDrag || coverDrag.id!==event.pointerId)return;
    const velocity=event.timeStamp-coverDrag.time<90?coverDrag.velocity:0;
    const projected=coverProgress+Math.max(-.18,Math.min(.18,velocity*160));
    const finish=!cancelled && (coverDrag.distance<5 || projected>.5 || reducedMotion.matches);
    coverDrag=null;coverIgnoreClick=true;delete dialog.dataset.dragging;
    if(finish)closeBook({velocity});else settleCover(0,()=>renderPage(restingPage),cancelled?0:velocity);
  }
  coverGrip.addEventListener('pointerup',event=>releaseCover(event));
  coverGrip.addEventListener('pointercancel',event=>releaseCover(event,true));
  coverGrip.addEventListener('lostpointercapture',event=>{if(coverDrag)releaseCover(event,true);});
  coverGrip.addEventListener('click',event=>{
    if(coverIgnoreClick && event.detail!==0) {coverIgnoreClick=false;return;}
    coverIgnoreClick=false;closeBook();
  });
  closeButton.addEventListener('click',()=>closeBook());
  keepsake.addEventListener('click',liftKeepsake);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeBook();});
  const outside=event=>!event.target.closest('.book-rig, .close-book, .reader-nav');
  dialog.addEventListener('pointerdown',event=>{pointerOutside=outside(event);});
  dialog.addEventListener('click',event=>{if(pointerOutside && outside(event)) closeBook();pointerOutside=false;});
  dialog.addEventListener('keydown',event=>{
    if(dialog.dataset.state!=='open' || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    if(event.defaultPrevented || event.target.closest('.ribbon-grip,select,input,textarea'))return;
    if(event.shiftKey||event.altKey||event.ctrlKey||event.metaKey||window.getSelection()?.isCollapsed===false)return;
    event.preventDefault();advance(event.key==='ArrowRight' ? 1 : -1);
  });
  window.addEventListener('hashchange',followHash);
  function settleAndResize() {
    if(dialog.dataset.state==='closing' || pendingClose) finishClose();
    else if(current) {
      if(reader.transition){cancelPage();reader.finish(pageCommitted);}
      reader.remember();drag=null;layout();reader.resize(geometry);finishOpen(false);
    }
    for(const item of books.values()) sizeSpine(item);
  }
  window.addEventListener('resize',settleAndResize);
  reducedMotion.addEventListener('change',event=>{if(event.matches) settleAndResize();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden && current && dialog.dataset.state==='open')bookmark.wake();});
  const handwriting=['Bradley Hand','Segoe Print','Noteworthy','Comic Neue'].find(face=>{
    const context=document.createElement('canvas').getContext('2d'); if(!context) return false;
    context.font='16px monospace'; const base=context.measureText('i keep coming back').width;
    context.font=`16px "${face}", monospace`; return context.measureText('i keep coming back').width!==base;
  });
  if(handwriting)dialog.style.setProperty('--handwriting',`"${handwriting}", Georgia, serif`);
  async function start() {
    let data=JSON.parse(document.getElementById('shelf-data').textContent);
    if(!embedded&&!data.localEdition&&(location.protocol==='http:' || location.protocol==='https:')) {
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),2000);
      try {const response=await fetch('../shelf.json',{cache:'no-store',signal:controller.signal});if(response.ok){const live=await response.json();if(validShelf(live)) data=live;}}
      catch {} finally {clearTimeout(timeout);}
    }
    if(validShelf(data)) drawShelf(data);
    if(embedded) {
      addEventListener('message',event=>{
        if(event.source!==parent||event.origin!==location.origin)return;
        const message=event.data;
        if(message?.type==='close'){closeBook({updateHash:false});return;}
        if(!['open','reframe'].includes(message?.type))return;
        if(!message.rect||!['x','y','w','h'].every(k=>Number.isFinite(message.rect[k]))||message.rect.w<=0||message.rect.h<=0)return;
        if(message.type==='reframe'){if(current){gallerySpine=message.rect;settleAndResize();}return;}
        if(!books.has(message.id))return;
        galleryOrigin=event.origin;
        openBook(message.id,{motion:message.animate!==false,updateHash:false,external:message});
      });
      await document.fonts.ready;
      parent.postMessage({type:'ready'},location.origin);
    }
  }
  start();
})();
