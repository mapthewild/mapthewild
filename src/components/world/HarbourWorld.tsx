import {useEffect,useRef,useState,type MouseEvent,type ReactNode} from 'react';
import {PORTS,STORAGE_KEY,parseMemory,safeReadHref,isPort,type Port,type WorldMemory} from '../../lib/world/navigation';
import type {createWorld,FootState,PortalState} from '../../lib/world/scene';
import {WALK_PLACES,isInside,isWalkPlace,type WalkPlace} from '../../lib/world/ashore';
import {isReader,type ReaderId,type ShelfReader,type BookChoice} from '../../lib/world/shelf-data';
import BookReader from './BookReader';
import ShoreReader,{SpyglassIcon} from './ShoreReader';
import type {ShoreEssay,ShoreEssaySlug,LensOrigin} from '../../lib/world/shore-reading';
import '../../styles/world/harbour.css';
import {isBlogEmbed,connectBlogEmbed} from '../../lib/world/blog-embed';
import {type PortalDestination} from '../../lib/world/portal-garden';
import PodcastListener from './PodcastListener';
import FutureDadsVoyage from './FutureDadsVoyage';
import '../../styles/world/connected-sites.css';

type World=ReturnType<typeof createWorld>;
// What the caption says on each reader's shelf: Moe's own line on his, a short line from each author on theirs
// (Moe, 20 Oct 2026). Checked against public-domain texts: Melville in The Apple-Tree Table (Gutenberg 53861);
// Montaigne in Florio's translation, Saintsbury's edition, vol. 2 (1893), and Strowski's French, vol. 2 (1909).
const SHELF_LINES:Record<ReaderId,{text:string;cite?:string}>={
  moe:{text:'The books we keep near us.'},
  melville:{text:'“It is better to fail in originality, than to succeed in imitation.”',cite:'Herman Melville, “Hawthorne and His Mosses”, 1850'},
  montaigne:{text:'“When I am playing with my Cat, who knowes whether she have more sport in dallying with me, than I have in gaming with her?”',cite:'Montaigne, Essays II.12, in John Florio’s English, 1603'},
};
export default function HarbourWorld({essays,nowbraryPost,startingPost,owner='mapthewild'}:{essays:ShoreEssay[];nowbraryPost?:ReactNode;startingPost?:ReactNode;owner?:'mapthewild'|'nowbrary'|'future-dads'}){
  const journey=useRef<any>(null),departing=useRef(false);
  const [connection,setConnection]=useState<{title:string;home:string;backLabel:string}|null>(null);
  const owned=owner!=='mapthewild';
  const mount=useRef<HTMLDivElement>(null),engine=useRef<World|null>(null),labels=useRef<Partial<Record<Port,HTMLButtonElement>>>({}),panel=useRef<HTMLElement>(null),footLabels=useRef<Partial<Record<WalkPlace|'boat',HTMLButtonElement>>>({}),shopButton=useRef<HTMLButtonElement>(null);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[entered,setEntered]=useState(false),[selected,setSelected]=useState<Port|null>(null),[sailing,setSailing]=useState<Port|null|false>(false),[motion,setMotion]=useState(true),[readHref,setReadHref]=useState('/mapthewild/'),[social,setSocial]=useState('Sunday Ritual');
  const [foot,setFoot]=useState<FootState>(null),[book,setBook]=useState<BookChoice|null>(null),[shelves,setShelves]=useState<ShelfReader[]>([]),[bookMenu,setBookMenu]=useState(false);
  const [paintedReady,setPaintedReady]=useState(false);
  const [lampOn,setLampOn]=useState(true);
  const [portal,setPortal]=useState<PortalState>({phase:'closed',ready:false,error:null,destination:'reading-house'});
  const [podcastOpen,setPodcastOpen]=useState(false);
  const [futureLoaded,setFutureLoaded]=useState(false),[futureVisit,setFutureVisit]=useState(false);
  const listenButton=useRef<HTMLButtonElement>(null);
  const portalEnter=useRef<HTMLButtonElement>(null),portalBack=useRef<HTMLButtonElement>(null),lastPortalPhase=useRef<PortalState['phase']>('closed');
  const [embeddedBlog,setEmbeddedBlog]=useState(false);
  const [essay,setEssay]=useState<ShoreEssaySlug|null>(null),[lensOrigin,setLensOrigin]=useState<LensOrigin>({x:500,y:400});
  useEffect(()=>{
    let cancelled=false;let memory:WorldMemory|null=null;let bridge:ReturnType<typeof connectBlogEmbed>|null=null;
    void (async()=>{
    try{const runtime='/mapthewild/journey/client.mjs';const mod=await import(/* @vite-ignore */ runtime);journey.current=await mod.connectJourney();}catch{}
    if(cancelled)return;
    const j=journey.current;
    if(j){
      j.register(owner==='mapthewild'?'sea':'place',()=>{engine.current?.save();try{return {world:JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null')};}catch{return {};}});
      const activity=j.activity;
      setConnection({title:j.config.sites[owner].name,home:j.config.sites[owner].home,backLabel:activity?({episode:'Back to your episode',shelf:'Back to your shelf',writing:'Back to writing'} as any)[activity.kind]:owner==='nowbrary'?'Open Nowbrary':'Episodes'});
    }
    const embedded=isBlogEmbed(location.href,window.parent!==window);setEmbeddedBlog(embedded);
    let pageVisible=!embedded;
    const root=mount.current?.closest<HTMLElement>('.harbour-world');
    bridge=embedded&&root?connectBlogEmbed(root,visible=>{pageVisible=visible;engine.current?.setPageVisible(visible);},factor=>engine.current?.zoomBy(factor)):null;
    try{memory=parseMemory(sessionStorage.getItem(STORAGE_KEY));const read=JSON.parse(sessionStorage.getItem('mtw-read-return')||'null');setReadHref(safeReadHref(read?.href));}catch{}
    if(j?.restored?.custom?.world)memory=parseMemory(JSON.stringify(j.restored.custom.world));
    else if(owned){memory={ship:[...PORTS.nowbrary.point],look:[14.4,6.5],zoom:1,port:'nowbrary',entered:true,ashore:owner==='future-dads'?'yours':j?.entry==='sea'?null:'quay',...(owner==='future-dads'?{portalDestination:'future-dads',portal:{view:'garden',yaw:0,pitch:0,zoom:1}}:{})};}
    else if(j?.ticket){const from=j.ticket.from;memory={ship:[...(from==='future-dads'?PORTS['future-dads'].point:from==='nowbrary'?PORTS.nowbrary.point:[0,20])] as [number,number],look:[0,15],zoom:.6,port:null,entered:true};}
    const address=new URL(location.href),visit=address.searchParams.get('visit');
    const requestedPlace=address.searchParams.get('place');
    if(isWalkPlace(visit)){
      memory={ship:[...PORTS.nowbrary.point],look:[14.4,6.5],zoom:1,port:'nowbrary',entered:true,ashore:visit};
      address.searchParams.delete('visit');address.searchParams.set('port','nowbrary');history.replaceState(null,'',address.pathname+address.search+address.hash);
    }
    if(memory){setEntered(memory.entered);if(!j&&memory.port==='future-dads'&&!memory.ashore){setFutureLoaded(true);setFutureVisit(true);}setSelected(memory.ashore||memory.port==='future-dads'?null:memory.port);if(memory.ashore)setFoot({place:memory.ashore,walking:false,destination:null});}
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;setMotion(!reduced);
    import('../../lib/world/scene').then(({createWorld})=>{
      if(cancelled||!mount.current)return;
      try{
        engine.current=createWorld(mount.current,{memory,pageVisible,embeddedBlog:embedded,labels:labels.current,footLabels:footLabels.current,onPainted:()=>setPaintedReady(true),onFoot:setFoot,onPortal:setPortal,onPortalListen:openPodcast,onBook:choice=>{setBookMenu(false);setBook(choice);},onShelves:setShelves,onReady:()=>{setReady(true);bridge?.ready();},onError:()=>setFailed(true),onSailing:p=>{if(p==='future-dads'&&!j)setFutureLoaded(true);setEntered(true);setSelected(null);setSailing(p);const address=new URL(location.href);if(p)address.searchParams.set('port',p);else address.searchParams.delete('port');history.replaceState(null,'',address.pathname+address.search+address.hash);},onArrival:p=>{setSailing(false);if(j&&!departing.current&&p&&(p==='nowbrary'||p==='future-dads')){if(owner==='mapthewild'){departing.current=true;engine.current?.save();j.go(p,'sea');return;}if(owner==='nowbrary'&&p==='nowbrary'&&engine.current){departing.current=true;j.go('mapthewild','sea');return;}}if(p==='future-dads'){setFutureLoaded(true);setFutureVisit(true);setSelected(null);}else setSelected(p);if(p&&p!=='future-dads')requestAnimationFrame(()=>panel.current?.focus());}});
        if(requestedPlace==='future-dads'||requestedPlace==='reading-house'){
          engine.current.setPortalDestination(requestedPlace);
          const clean=new URL(location.href);clean.searchParams.delete('place');history.replaceState(history.state,'',clean);
        }
        const port=new URLSearchParams(location.search).get('port');
        if(isPort(port)&&(!memory||memory.port!==port)){setEntered(true);engine.current.go(port);}
      }catch(error){console.error('The harbour could not start.',error);setFailed(true);}
    }).catch(()=>setFailed(true));
    })();
    return()=>{cancelled=true;bridge?.dispose();engine.current?.dispose();engine.current=null;};
  },[]);
  useEffect(()=>{const reset=()=>{departing.current=false;document.body.classList.remove('journey-leaving');};window.addEventListener('pageshow',reset);document.addEventListener('journey:cancel',reset);return()=>{window.removeEventListener('pageshow',reset);document.removeEventListener('journey:cancel',reset);};},[]);
  useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&!document.querySelector('dialog[open]')){if(portal.phase!=='closed'){if(owner==='future-dads'&&journey.current)journey.current.go('future-dads','radio');else engine.current?.leavePortal();}else if(selected&&!foot)overview();setSocial('Sunday Ritual');}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[selected,foot,portal.phase]);
  useEffect(()=>{if(portal.phase==='garden')portalBack.current?.focus({preventScroll:true});else if(portal.phase==='closed'&&lastPortalPhase.current!=='closed')portalEnter.current?.focus({preventScroll:true});lastPortalPhase.current=portal.phase;},[portal.phase]);
  useEffect(()=>{
    const root=mount.current?.closest('.harbour-world');if(!root)return;
    for(const child of Array.from(root.children) as HTMLElement[]){
      if(child.classList.contains('future-dads-voyage'))continue;
      if(futureVisit&&!child.inert){child.inert=true;child.dataset.futureDadsInert='true';}
      else if(!futureVisit&&child.dataset.futureDadsInert){child.inert=false;delete child.dataset.futureDadsInert;}
    }
  },[futureVisit]);
  function returnFromFutureDads(){setFutureVisit(false);const url=new URL(location.href);url.searchParams.delete('port');history.replaceState(history.state,'',url);requestAnimationFrame(()=>labels.current['future-dads']?.focus({preventScroll:true}));}
  function backToActivity(){const j=journey.current;if(j?.activity)j.resume(j.activity);else if(j)j.go(owner,'content');}
  function enterChosenPortal(){if(journey.current&&portal.destination==='future-dads'){engine.current?.save();journey.current.go('future-dads','radio');}else engine.current?.enterPortal();}
  function go(port:Port){setEntered(true);engine.current?.go(port);}
  function read(){engine.current?.save();try{sessionStorage.setItem('mtw-restore-reading','1');}catch{}}
  function overview(){setEntered(true);engine.current?.enter();engine.current?.overview();}
  function toggleMotion(){engine.current?.setMotion(!motion);setMotion(!motion);}
  function walk(place:WalkPlace|'boat'){setBookMenu(false);engine.current?.walkTo(place);}
  function closeBook(){setBook(null);engine.current?.closeBook();requestAnimationFrame(()=>shopButton.current?.focus());}
  function openEssay(event:MouseEvent<HTMLElement>,slug:ShoreEssaySlug){
    if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();engine.current?.save();
    if(owned&&journey.current){journey.current.page('mapthewild','/posts/'+slug+'/');return;}
    const bounds=event.currentTarget.getBoundingClientRect();
    setLensOrigin(engine.current?.spyglass(true)||{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2});setEssay(slug);
  }
  function closeEssay(){setEssay(null);engine.current?.spyglass(false);}
  function openPodcast(){engine.current?.suspend(true);setPodcastOpen(true);}
  function closePodcast(){setPodcastOpen(false);engine.current?.suspend(false);requestAnimationFrame(()=>listenButton.current?.focus({preventScroll:true}));}
  function choosePortal(destination:PortalDestination){engine.current?.setPortalDestination(destination);}
  const inPortal=portal.phase!=='closed',yours=foot?.place==='yours';
  const futureDads=portal.destination==='future-dads';
  const portalTitle=futureDads?'Future Dads Club':'A reading house';
  const inside=!!foot&&isInside(foot.place),approaching=!!foot?.walking&&isInside(foot.destination);
  const reader=foot&&isReader(foot.place)?shelves.find(r=>r.id===foot.place):null;
  const showIntro=!entered&&!failed;
  return <main data-site-owner={owner} data-connected={!!connection} data-embedded-blog={embeddedBlog?'true':undefined} data-portal-destination={portal.destination} className={`harbour-world ${ready?'is-ready':''} ${futureVisit?'in-future-dads':''} ${showIntro?'has-intro':''} ${failed?'has-error':''} ${foot?'is-ashore':''} ${inside?'is-inside':''} ${approaching?'is-approaching':''} ${foot&&paintedReady?'has-painted-visit':''} ${essay?'has-shore-reading':''} ${yours?'at-yours':''} ${inPortal?'in-portal':''} ${portal.phase==='entering'||portal.phase==='leaving'?'portal-crossing':''}`}>
    <div className="world-canvas" ref={mount}/>
    <div className="world-edge" aria-hidden="true"/>
    <header className="world-header">
      <a className="world-brand" aria-label={`${connection?.title||'Map the Wild'} home`} href={owned?connection?.home||'/':'/mapthewild/'}><span className="world-emblem" aria-hidden="true">✳</span><span>{connection?.title||'Map the Wild'}</span></a>
      {!owned&&<a className="world-places" href="/mapthewild/islands/" onClick={read}>Places</a>}
      <nav className="world-mode" aria-label="View mode">{owned?<button onClick={backToActivity}>{connection?.backLabel||"Open the website"}</button>:<a href={readHref} onClick={event=>{const j=journey.current;if(!embeddedBlog&&j?.activity?.site==='mapthewild'&&j.activity.kind==='writing'&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();engine.current?.save();j.resume(j.activity);}else read();}}>Read</a>}<span aria-current="page">Explore</span></nav>
    </header>
    {!ready&&!failed&&<div className="world-loading" role="status"><span className="loading-sun" aria-hidden="true">✳</span><p>{owned?`Opening ${owner==='nowbrary'?'Nowbrary':'the listening room'}…`:'Finding the first shore…'}</p></div>}
    {!owned&&showIntro&&<section className="world-intro" aria-labelledby="world-title">
      <p className="world-kicker"><span/> The first shores</p>
      <h1 id="world-title">A world,<br/>still <em>unfolding.</em></h1>
      <button className="world-primary" onClick={()=>go('nowbrary')} disabled={!ready}>Sail to Nowbrary</button>
      <button className="world-text-button" onClick={overview} disabled={!ready}>Or take a look around <span aria-hidden="true">→</span></button>
    </section>}
    <div className="world-labels" aria-label="Harbours" aria-hidden={showIntro||!!foot}>
      {(Object.keys(PORTS) as Port[]).map(id=><button ref={el=>{if(el)labels.current[id]=el;}} key={id} className={`world-pin pin-${id} ${selected===id?'is-current':''}`} onClick={()=>go(id)} aria-label={`Sail to ${PORTS[id].title}`} disabled={!ready} tabIndex={showIntro||foot?-1:0}>
        <span className="world-pin-number" aria-hidden="true">{{nowbrary:'01',together:'02','future-dads':'03',horizon:'04'}[id]}</span><span className="world-pin-name">{PORTS[id].title}</span><small>{id==='horizon'?'Not open yet':id==='nowbrary'?'Reading & ideas':id==='future-dads'?'Podcast':'Conversation & play'}</small>
      </button>)}
    </div>
    <div className="foot-labels" aria-label="Places on the quay" aria-hidden={!foot||inside||approaching}>
      {(['shop','garden','boat'] as const).map(place=><button key={place} ref={el=>{if(el)footLabels.current[place]=el;}} className={`foot-pin foot-pin-${place}`} onClick={()=>walk(place)} disabled={!ready||!foot||foot.walking} tabIndex={foot&&!foot.walking?0:-1}>
        <span>{place==='boat'?(owned?'Set sail':'Back to the boat'):WALK_PLACES[place].action}</span>
      </button>)}
    </div>
    {!owned&&entered&&!failed&&!foot&&<>
      <nav className="world-destinations" aria-label="Choose a shore">
        <button onClick={()=>go('nowbrary')} aria-pressed={selected==='nowbrary'}><span>01</span> Nowbrary</button>
        <button onClick={()=>go('together')} aria-pressed={selected==='together'}><span>02</span> Being together</button>
        <button onClick={()=>go('future-dads')} aria-pressed={selected==='future-dads'}><span>03</span> Future Dads Club</button>
        <button onClick={()=>go('horizon')} aria-pressed={selected==='horizon'}><span>04</span> The next shore</button>
      </nav>
    </>}
    {selected&&!failed&&<section className="world-landing" ref={panel} tabIndex={-1} aria-label={PORTS[selected].title}>
      <button className="landing-close" aria-label="Close shore details" onClick={overview}>×</button>
      <h2>{PORTS[selected].title}</h2>
      {selected==='nowbrary'?<>
        <p>Two posts about the nowbrary, and a bookshop with three readers’ shelves.</p>
        <button className="world-primary step-ashore" onClick={()=>engine.current?.stepAshore()}>Step ashore</button>
        <p className="arrival-hint">Walk to the bookshop. The shelves are inside.</p>
        <a className="landing-story" href={'/mapthewild/posts/nowbrary-living-constellation'} onClick={event=>openEssay(event,'nowbrary-living-constellation')} aria-haspopup="dialog"><span><small>PART 1</small>The Nowbrary</span><SpyglassIcon/></a>
        <a className="landing-story" href={'/mapthewild/posts/starting-your-nowbrary'} onClick={event=>openEssay(event,'starting-your-nowbrary')} aria-haspopup="dialog"><span><small>PART 2</small>Starting Your Nowbrary</span><SpyglassIcon/></a>
      </>:selected==='together'?<>
        <p>Different ways to spend time with one another, with a shared landing between them.</p>
        <div className="social-tabs" role="tablist" aria-label="Places to gather">{['Sunday Ritual','Life in 5','Soulfield Oasis'].map(name=><button key={name} role="tab" tabIndex={social===name?0:-1} onKeyDown={event=>{const names=['Sunday Ritual','Life in 5','Soulfield Oasis'];const index=names.indexOf(name);const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:-1;if(next>=0){event.preventDefault();setSocial(names[next]);document.getElementById(`tab-${names[next].replaceAll(' ','-')}`)?.focus();}}} aria-selected={social===name} aria-controls="social-description" id={`tab-${name.replaceAll(' ','-')}`} onClick={()=>setSocial(name)}>{name}</button>)}</div>
        <div role="tabpanel" id="social-description" aria-labelledby={`tab-${social.replaceAll(' ','-')}`}>
          {social==='Sunday Ritual'?<><p className="social-copy">A weekly practice for two. Answer separately, then come back together.</p><a className="world-primary" href={'/mapthewild/sundayritual'} onClick={()=>engine.current?.save()}>Begin Sunday Ritual</a></>:social==='Life in 5'?<><p className="social-copy">A conversation game for two or three people.</p><a className="world-primary" href="https://mylifein5.com" onClick={()=>engine.current?.save()}>Open Life in 5 <span aria-hidden="true">↗</span></a></>:<><p className="social-copy">A card game for two players.</p><a className="world-primary" href={'/mapthewild/islands/soulfield'} onClick={()=>engine.current?.save()}>Open Soulfield Oasis</a></>}
        </div>
      </>:<>
        <p>Nothing to visit here yet.</p>
        <button className="world-primary" onClick={()=>go('nowbrary')}>Back to Nowbrary</button>
      </>}
    </section>}
    {foot&&!failed&&!inPortal&&<>
      <button className="shore-about" onClick={event=>openEssay(event,'nowbrary-living-constellation')} aria-haspopup="dialog" aria-label="Read the Nowbrary posts"><SpyglassIcon/><span>Nowbrary posts</span></button>
      {!inside&&<div className="ashore-caption"><span>NOWBRARY</span><h1>{foot.place==='garden'?'Shaded terrace':'Welcome ashore.'}</h1><p>{foot.place==='garden'?'Seats in the shade, beside the bookshop.':'Your boat can wait. There are books within reach.'}</p></div>}
      {inside?<>
        <div className="inside-caption"><span>NOWBRARY</span><h1>{yours?'Yours?':reader?`${reader.name}’s shelf`:'Books within reach.'}</h1>{reader?<><p className="inside-line">{SHELF_LINES[reader.id as ReaderId].text}</p>{SHELF_LINES[reader.id as ReaderId].cite&&<p className="inside-cite">{SHELF_LINES[reader.id as ReaderId].cite}</p>}</>:<p>{yours?'A place for the books you keep near.':'Choose a reader’s shelf.'}</p>}</div>
        {yours&&<section className="portal-invitation" aria-labelledby="portal-title">
          <nav className="portal-place-choices" aria-label="Places through the picture">
            <button aria-pressed={!futureDads} disabled={foot.walking||portal.phase!=='closed'} onClick={()=>choosePortal('reading-house')}>Reading house</button>
            <button aria-pressed={futureDads} disabled={foot.walking||portal.phase!=='closed'} onClick={()=>choosePortal('future-dads')}>Future Dads Club</button>
          </nav>
          <h2 id="portal-title">{portalTitle}</h2>
          <p>{futureDads?'Moe’s podcast, with a place to sit and listen.':'An example of a place for the books you keep near.'}</p>
          <button className="world-primary" ref={portalEnter} disabled={!portal.ready||!!portal.error||!paintedReady||foot.walking} onClick={enterChosenPortal}>{futureDads&&connection?'Go to the radio':futureDads?'Enter the listening place':'Enter the house'} <span aria-hidden="true">→</span></button>
          {!portal.ready&&!portal.error&&<p role="status">Opening the place…</p>}
          {portal.error&&<p role="status">This place could not open. You can choose another place or return to the shelves.</p>}
          {!futureDads&&<a href="/mapthewild/posts/starting-your-nowbrary" onClick={event=>openEssay(event,'starting-your-nowbrary')} aria-haspopup="dialog">Starting Your Nowbrary</a>}
        </section>}
        <nav className="inside-actions" aria-label="Walk between the shelves">
          <p role="status">{foot.walking?(foot.destination==='quay'?'Going outside…':`${(WALK_PLACES[foot.destination as WalkPlace]?.action||'Walk to the shelves').replace(/^Walk to/,'Walking to')}…`):''}</p>
          <div>{(['moe','melville','montaigne','yours'] as WalkPlace[]).map(id=><button key={id} disabled={!ready||foot.walking} aria-pressed={foot.place===id} onClick={()=>walk(id)}>{WALK_PLACES[id].title}</button>)}<button onClick={()=>walk('quay')} disabled={foot.walking}>Go outside</button></div>
          {reader&&<button ref={shopButton} className="choose-book" aria-expanded={bookMenu} onClick={()=>setBookMenu(v=>!v)} disabled={foot.walking}>Choose a book <span aria-hidden="true">{bookMenu?'−':'+'}</span></button>}
          {!shelves.length&&<a href={'/mapthewild/world/nowbrary/gallery.html#moe'}>Open the shelves directly</a>}
        </nav>
        {reader&&bookMenu&&<section className="shelf-titles" aria-label={`Books on ${reader.name}’s shelf`}><button className="shelf-titles-close" aria-label="Close book titles" onClick={()=>setBookMenu(false)}>×</button><p>{reader.name}’s shelf</p>{reader.books.filter((b,i,all)=>all.findIndex(a=>a.id===b.id)===i).map(b=><button key={b.id} onClick={()=>engine.current?.openBook(reader.id,b.id,b.volIndex||0)}>{b.title}<small>{b.author}</small></button>)}</section>}
      </>:<nav className="ashore-actions" aria-label="Explore Nowbrary on foot">
        <p role="status">{foot.walking?(foot.destination==='boat'?'Walking back to your boat…':foot.destination==='shop'?'Through the doorway…':foot.destination==='garden'?'Walking to the shaded terrace…':'Stepping onto the quay…'):'Choose a place to walk.'}</p>
        <div><button ref={shopButton} disabled={!ready||foot.walking} onClick={()=>walk('shop')}>Enter the bookshop</button><button disabled={!ready||foot.walking} onClick={()=>walk('garden')}>{WALK_PLACES.garden.title}</button><button disabled={!ready||foot.walking} onClick={()=>walk('boat')}>{owned?'Set sail':'Back to the boat'}</button></div>
      </nav>}
    </>}
    {inPortal&&<section className="portal-visit" aria-label={futureDads?'Future Dads Club listening place':'Reading house'}>
      <div className="portal-caption"><span>{futureDads?'FUTURE DADS CLUB':'NOWBRARY'}</span><h1>{futureDads?'A place to listen':'Reading house'}</h1><p>{portal.error?'This place could not be drawn. You can return to the bookshop.':futureDads?'Because you want to become a present dad':'A seat, a courtyard, another room upstairs.'}</p>{futureDads&&<small>Original cover by @adnanmakes</small>}</div>
      <nav className="portal-actions" aria-label={futureDads?'In the listening place':'In the reading house'}>
        <button ref={portalBack} className="portal-back" onClick={()=>owner==='future-dads'&&journey.current?journey.current.go('future-dads','radio'):engine.current?.leavePortal()}>{owner==='future-dads'?'Back to the radio':'← Back to the bookshop'}</button>
        {futureDads?<div><button disabled={portal.phase!=='garden'} onClick={()=>engine.current?.portalView('island')}>From the sea</button><button disabled={portal.phase!=='garden'} onClick={()=>engine.current?.portalView('garden')}>The entrance</button><button disabled={portal.phase!=='garden'} onClick={()=>engine.current?.portalView('bench')}>By the chairs</button><button disabled={portal.phase!=='garden'} onClick={()=>engine.current?.portalView('shelf')}>Listening table</button><button ref={listenButton} disabled={portal.phase!=='garden'} aria-haspopup="dialog" onClick={openPodcast}>Choose an episode</button></div>:<div><button disabled={portal.phase!=='garden'} onClick={()=>engine.current?.portalView('bench')}>Window seat</button><button disabled={portal.phase!=='garden'} onClick={()=>engine.current?.portalView('shelf')}>Courtyard</button><button disabled={portal.phase!=='garden'} onClick={()=>engine.current?.portalView('upstairs')}>Upstairs</button><button aria-pressed={lampOn} disabled={portal.phase!=='garden'} onClick={()=>setLampOn(engine.current?.toggleGardenLamp()||false)}>{lampOn?'Turn off the lamp':'Light the lamp'}</button><a href="/mapthewild/posts/starting-your-nowbrary" onClick={event=>openEssay(event,'starting-your-nowbrary')} aria-haspopup="dialog">Starting Your Nowbrary</a></div>}
      </nav>
    </section>}
    {sailing!==false&&<div className="world-sailing" role="status"><span className="sailing-line"/>{sailing?`Sailing to ${PORTS[sailing].title}`:'Following your course'}</div>}
    {ready&&!failed&&<div className="world-tools" aria-label="World controls">
      <button onClick={()=>engine.current?.zoomBy(1.2)} aria-label="Zoom in">+</button>
      <button onClick={()=>engine.current?.zoomBy(1/1.2)} aria-label="Zoom out">−</button>
      <button onClick={overview} aria-label={inPortal?(futureDads?'Look around the listening place':'Look around the house'):foot?'Look around Nowbrary':'Show the whole bay'} title={inPortal?'The place':foot?'The quay':'The whole bay'}>⌖</button>
      <button onClick={toggleMotion} aria-label={motion?'Pause ambient motion':'Resume ambient motion'} aria-pressed={!motion} title={motion?'Pause motion':'Resume motion'}>{motion?'Ⅱ':'▷'}</button>
    </div>}
    {failed&&<section className="world-fallback" role="status"><h1>Explore could not open</h1><p>You can still read the website.</p><a className="world-primary" href={owned?(owner==='nowbrary'?'/gallery.html#all':'/'):'/mapthewild/'}>Open {owner==='nowbrary'?'Nowbrary':owner==='future-dads'?'Future Dads Club':'Map the Wild'}</a><button className="world-text-button" onClick={()=>location.reload()}>Try again</button></section>}
    <footer className="world-footer"><span>{owned?connection?.title:'THE FIRST SHORES'}</span><span className="world-help">{embeddedBlog?'Scroll or swipe through the page · drag to look · pinch or +/− to zoom':inside?'Choose a shelf · touch a spine to read':foot?'Choose a place · drag to look · scroll or pinch to zoom':entered?'Choose a shore · drag to look · scroll or pinch to zoom':''}</span></footer>
    {connection&&owner==='mapthewild'&&journey.current?.activity&&<button className="connected-activity" onClick={backToActivity}>{connection.backLabel}</button>}
    {connection&&owner==='nowbrary'&&inside&&!inPortal&&<button className="connected-native" onClick={()=>journey.current.contentLink('/gallery.html#'+(reader?.id||'all'))}>Open {reader?`${reader.name}’s shelf`:'Nowbrary'}</button>}
    <BookReader choice={book} motion={motion} onClose={closeBook} onTaken={()=>engine.current?.setBookTaken(true)}/>
    {ready&&futureLoaded&&<FutureDadsVoyage active={futureVisit} motion={motion} engine={engine} onReturn={returnFromFutureDads}/>}
    <PodcastListener open={podcastOpen} active={portal.phase==='garden'&&futureDads&&!futureVisit} onClose={closePodcast} onWebsite={owner==='future-dads'?()=>journey.current?.contentLink('/'):undefined}/>
    <ShoreReader selected={essay} essays={essays} bodies={{'nowbrary-living-constellation':nowbraryPost,'starting-your-nowbrary':startingPost}} origin={lensOrigin} motion={motion} ashore={!!foot} returnLabel={inPortal?'Back to the house':undefined} onSelect={setEssay} onClose={closeEssay} onStepAshore={()=>engine.current?.stepAshore()}/>
    <noscript><div className="world-fallback"><h1>Explore</h1><p>Exploration uses JavaScript. You can read the website directly.</p><a href={owned?(owner==='nowbrary'?'/gallery.html#all':'/'):'/mapthewild/'}>Open the website</a></div></noscript>
  </main>;
}
