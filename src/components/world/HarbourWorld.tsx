import {useEffect,useRef,useState,type MouseEvent,type ReactNode} from 'react';
import {PORTS,STORAGE_KEY,parseMemory,safeReadHref,isPort,type Port,type WorldMemory} from '../../lib/world/navigation';
import type {createWorld,FootState} from '../../lib/world/scene';
import {WALK_PLACES,isInside,isWalkPlace,type WalkPlace} from '../../lib/world/ashore';
import {isReader,type ReaderId,type ShelfReader,type BookChoice} from '../../lib/world/shelf-data';
import BookReader from './BookReader';
import ShoreReader,{SpyglassIcon} from './ShoreReader';
import type {ShoreEssay,ShoreEssaySlug,LensOrigin} from '../../lib/world/shore-reading';
import '../../styles/world/harbour.css';

type World=ReturnType<typeof createWorld>;
export default function HarbourWorld({essays,nowbraryPost,startingPost}:{essays:ShoreEssay[];nowbraryPost:ReactNode;startingPost:ReactNode}){
  const mount=useRef<HTMLDivElement>(null),engine=useRef<World|null>(null),labels=useRef<Partial<Record<Port,HTMLButtonElement>>>({}),panel=useRef<HTMLElement>(null),footLabels=useRef<Partial<Record<WalkPlace|'boat',HTMLButtonElement>>>({}),shopButton=useRef<HTMLButtonElement>(null);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[entered,setEntered]=useState(false),[selected,setSelected]=useState<Port|null>(null),[sailing,setSailing]=useState<Port|null|false>(false),[motion,setMotion]=useState(true),[readHref,setReadHref]=useState('/mapthewild/'),[social,setSocial]=useState('Sunday Ritual');
  const [foot,setFoot]=useState<FootState>(null),[book,setBook]=useState<BookChoice|null>(null),[shelves,setShelves]=useState<ShelfReader[]>([]),[bookMenu,setBookMenu]=useState(false);
  const [paintedReady,setPaintedReady]=useState(false);
  const [essay,setEssay]=useState<ShoreEssaySlug|null>(null),[lensOrigin,setLensOrigin]=useState<LensOrigin>({x:500,y:400});
  useEffect(()=>{
    let cancelled=false;let memory:WorldMemory|null=null;
    try{memory=parseMemory(sessionStorage.getItem(STORAGE_KEY));const read=JSON.parse(sessionStorage.getItem('mtw-read-return')||'null');setReadHref(safeReadHref(read?.href));}catch{}
    const address=new URL(location.href),visit=address.searchParams.get('visit');
    if(isWalkPlace(visit)){
      memory={ship:[9,14],look:[14.4,6.5],zoom:1,port:'nowbrary',entered:true,ashore:visit};
      address.searchParams.delete('visit');address.searchParams.set('port','nowbrary');history.replaceState(null,'',address.pathname+address.search+address.hash);
    }
    if(memory){setEntered(memory.entered);setSelected(memory.ashore?null:memory.port);if(memory.ashore)setFoot({place:memory.ashore,walking:false,destination:null});}
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;setMotion(!reduced);
    import('../../lib/world/scene').then(({createWorld})=>{
      if(cancelled||!mount.current)return;
      try{
        engine.current=createWorld(mount.current,{memory,labels:labels.current,footLabels:footLabels.current,onPainted:()=>setPaintedReady(true),onFoot:setFoot,onBook:choice=>{setBookMenu(false);setBook(choice);},onShelves:setShelves,onReady:()=>setReady(true),onError:()=>setFailed(true),onSailing:p=>{setEntered(true);setSelected(null);setSailing(p);const address=new URL(location.href);if(p)address.searchParams.set('port',p);else address.searchParams.delete('port');history.replaceState(null,'',address.pathname+address.search+address.hash);},onArrival:p=>{setSailing(false);setSelected(p);if(p)requestAnimationFrame(()=>panel.current?.focus());}});
        const port=new URLSearchParams(location.search).get('port');
        if(isPort(port)&&(!memory||memory.port!==port)){setEntered(true);engine.current.go(port);}
      }catch(error){console.error('The harbour could not start.',error);setFailed(true);}
    }).catch(()=>setFailed(true));
    return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
  },[]);
  useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented&&!document.querySelector('dialog[open]')){setSelected(null);setSocial('Sunday Ritual');}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[]);
  function go(port:Port){setEntered(true);engine.current?.go(port);}
  function read(){engine.current?.save();try{sessionStorage.setItem('mtw-restore-reading','1');}catch{}}
  function overview(){setEntered(true);engine.current?.enter();engine.current?.overview();}
  function toggleMotion(){engine.current?.setMotion(!motion);setMotion(!motion);}
  function walk(place:WalkPlace|'boat'){setBookMenu(false);engine.current?.walkTo(place);}
  function closeBook(){setBook(null);engine.current?.closeBook();requestAnimationFrame(()=>shopButton.current?.focus());}
  function openEssay(event:MouseEvent<HTMLElement>,slug:ShoreEssaySlug){
    if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();engine.current?.save();
    const bounds=event.currentTarget.getBoundingClientRect();
    setLensOrigin(engine.current?.spyglass(true)||{x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2});setEssay(slug);
  }
  function closeEssay(){setEssay(null);engine.current?.spyglass(false);}
  const inside=!!foot&&isInside(foot.place),approaching=!!foot?.walking&&isInside(foot.destination);
  const reader=foot&&isReader(foot.place)?shelves.find(r=>r.id===foot.place):null;
  const showIntro=!entered&&!failed;
  return <main className={`harbour-world ${ready?'is-ready':''} ${showIntro?'has-intro':''} ${failed?'has-error':''} ${foot?'is-ashore':''} ${inside?'is-inside':''} ${approaching?'is-approaching':''} ${foot&&paintedReady?'has-painted-visit':''} ${essay?'has-shore-reading':''}`}>
    <div className="world-canvas" ref={mount}/>
    <div className="world-edge" aria-hidden="true"/>
    <header className="world-header">
      <a className="world-brand" href={'/mapthewild/'}><span className="world-emblem" aria-hidden="true">✳</span><span>Map the Wild</span></a>
      <nav className="world-mode" aria-label="View mode"><a href={readHref} onClick={read}>Read</a><span aria-current="page">Explore</span></nav>
    </header>
    {!ready&&!failed&&<div className="world-loading" role="status"><span className="loading-sun" aria-hidden="true">✳</span><p>Finding the first shore…</p></div>}
    {showIntro&&<section className="world-intro" aria-labelledby="world-title">
      <p className="world-kicker"><span/> The first shores</p>
      <h1 id="world-title">A world,<br/>still <em>unfolding.</em></h1>
      <p className="intro-copy">Books kept close. Questions worth sharing.<br className="desktop-break"/> A little company across the water.</p>
      <button className="world-primary" onClick={()=>go('nowbrary')} disabled={!ready}>Sail to Nowbrary <span aria-hidden="true">↗</span></button>
      <button className="world-text-button" onClick={overview} disabled={!ready}>Or take a look around <span aria-hidden="true">→</span></button>
      <p className="intro-footnote">A small beginning, with room to grow.</p>
    </section>}
    <div className="world-labels" aria-label="Harbours" aria-hidden={showIntro||!!foot}>
      {(Object.keys(PORTS) as Port[]).map(id=><button ref={el=>{if(el)labels.current[id]=el;}} key={id} className={`world-pin pin-${id} ${selected===id?'is-current':''}`} onClick={()=>go(id)} aria-label={`Sail to ${PORTS[id].title}`} disabled={!ready} tabIndex={showIntro||foot?-1:0}>
        <span className="pin-dot"/><span>{PORTS[id].title}</span><small>{id==='horizon'?'Room to grow':id==='nowbrary'?'Reading & ideas':'Conversation & play'}</small>
      </button>)}
    </div>
    <div className="foot-labels" aria-label="Places on the quay" aria-hidden={!foot||inside||approaching}>
      {(['shop','garden','boat'] as const).map(place=><button key={place} ref={el=>{if(el)footLabels.current[place]=el;}} className={`foot-pin foot-pin-${place}`} onClick={()=>walk(place)} disabled={!ready||!foot||foot.walking} tabIndex={foot&&!foot.walking?0:-1}>
        <span>{place==='boat'?'Return to the boat':WALK_PLACES[place].action}</span><span aria-hidden="true">{place==='boat'?'↙':'↗'}</span>
      </button>)}
    </div>
    {entered&&!failed&&!foot&&<>
      <div className="world-weather"><span className="weather-dot"/> Rain on the far shore. Sun on this one.</div>
      <nav className="world-destinations" aria-label="Choose a shore">
        <button onClick={()=>go('nowbrary')} aria-pressed={selected==='nowbrary'}><span>01</span> Nowbrary</button>
        <button onClick={()=>go('together')} aria-pressed={selected==='together'}><span>02</span> Being together</button>
        <button onClick={()=>go('horizon')} aria-pressed={selected==='horizon'}><span>↗</span> Further shores</button>
      </nav>
    </>}
    {selected&&!failed&&<section className="world-landing" ref={panel} tabIndex={-1} aria-label={PORTS[selected].title}>
      <button className="landing-close" aria-label="Close shore details" onClick={()=>setSelected(null)}>×</button>
      <p className="world-kicker">{selected==='nowbrary'?'The reading coast':selected==='together'?'A place for company':'A world taking shape'}</p>
      <h2>{selected==='horizon'?'Room for what comes next.':PORTS[selected].title}</h2>
      {selected==='nowbrary'?<>
        <p>A few books within reach. A place to return to them, and notice what they’re saying now.</p>
        <button className="world-primary step-ashore" onClick={()=>engine.current?.stepAshore()}>Step ashore <span aria-hidden="true">↗</span></button>
        <p className="arrival-hint">Walk to the bookshop. The shelves are inside.</p>
        <a className="landing-story" href={'/mapthewild/posts/nowbrary-living-constellation'} onClick={event=>openEssay(event,'nowbrary-living-constellation')} aria-haspopup="dialog"><span><small>BEGIN HERE</small>The Nowbrary</span><SpyglassIcon/></a>
        <a className="landing-story" href={'/mapthewild/posts/starting-your-nowbrary'} onClick={event=>openEssay(event,'starting-your-nowbrary')} aria-haspopup="dialog"><span><small>MAKE IT YOURS</small>Starting your Nowbrary</span><SpyglassIcon/></a>
        <p className="landing-aside">As the readings and notes grow, new topic neighbourhoods can take shape along this shore.</p>
      </>:selected==='together'?<>
        <p>Different ways to spend time with one another, with a shared landing between them.</p>
        <div className="social-tabs" role="tablist" aria-label="Places to gather">{['Sunday Ritual','Life in 5','Soulfield'].map(name=><button key={name} role="tab" tabIndex={social===name?0:-1} onKeyDown={event=>{const names=['Sunday Ritual','Life in 5','Soulfield'];const index=names.indexOf(name);const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:-1;if(next>=0){event.preventDefault();setSocial(names[next]);document.getElementById(`tab-${names[next].replaceAll(' ','-')}`)?.focus();}}} aria-selected={social===name} aria-controls="social-description" id={`tab-${name.replaceAll(' ','-')}`} onClick={()=>setSocial(name)}>{name}</button>)}</div>
        <div role="tabpanel" id="social-description" aria-labelledby={`tab-${social.replaceAll(' ','-')}`}>
          {social==='Sunday Ritual'?<><p className="social-copy">A weekly practice for two. Answer separately, then come back together.</p><a className="world-primary" href={'/mapthewild/sundayritual'} onClick={()=>engine.current?.save()}>Begin Sunday Ritual <span aria-hidden="true">↗</span></a></>:<><p className="social-copy">{social==='Life in 5'?'A short story can open a real conversation.':'A place to sit down and play together.'}</p><p className="landing-aside">This landing is still being prepared. Sunday Ritual is open across the courtyard.</p><button className="world-text-button" onClick={()=>setSocial('Sunday Ritual')}>Visit Sunday Ritual →</button></>}
        </div>
      </>:<>
        <p>This is the beginning of Map the Wild. As more reading, writing and shared experiences arrive, these shores will gain new rooms, gardens and neighbourhoods.</p>
        <div className="future-note"><span aria-hidden="true">✳</span><p>Connections between ideas will give the boats new reasons to cross.</p></div>
        <button className="world-primary" onClick={()=>go('nowbrary')}>Visit the first harbour <span aria-hidden="true">↗</span></button>
      </>}
    </section>}
    {foot&&!failed&&<>
      <button className="shore-about" onClick={event=>openEssay(event,'nowbrary-living-constellation')} aria-haspopup="dialog" aria-label="Read about Nowbrary"><SpyglassIcon/><span>Island notes</span></button>
      {!inside&&<div className="ashore-caption"><span>THE READING COAST</span><h1>{foot.place==='garden'?'A little shade.':'Welcome ashore.'}</h1><p>{foot.place==='garden'?'A place to pause, with the water in sight.':'Your boat can wait. There are books within reach.'}</p></div>}
      {inside?<>
        <div className="inside-caption"><span>NOWBRARY</span><h1>{reader?`${reader.name}’s shelf`:'Books within reach.'}</h1><p>{reader?'Choose a spine, or browse the book titles below.':'Step closer to a shelf.'}</p></div>
        <nav className="inside-actions" aria-label="Walk between the shelves">
          <p role="status">{foot.walking?`Walking to ${WALK_PLACES[foot.destination as WalkPlace]?.title||'the courtyard'}…`:reader?'The books we keep near us.':'Three readers. Different things to return to.'}</p>
          <div>{(['moe','melville','montaigne'] as ReaderId[]).map(id=><button key={id} disabled={!ready||foot.walking} aria-pressed={foot.place===id} onClick={()=>walk(id)}>{WALK_PLACES[id].title}</button>)}<button onClick={()=>walk('quay')} disabled={foot.walking}>Courtyard ↗</button></div>
          {reader&&<button ref={shopButton} className="choose-book" aria-expanded={bookMenu} onClick={()=>setBookMenu(v=>!v)} disabled={foot.walking}>Choose a book <span aria-hidden="true">{bookMenu?'−':'+'}</span></button>}
          {!shelves.length&&<a href={'/mapthewild/world/nowbrary/gallery.html#moe'}>Open the shelves directly ↗</a>}
        </nav>
        {reader&&bookMenu&&<section className="shelf-titles" aria-label={`Books on ${reader.name}’s shelf`}><button className="shelf-titles-close" aria-label="Close book titles" onClick={()=>setBookMenu(false)}>×</button><p>{reader.name}’s nowbrary</p>{reader.books.filter((b,i,all)=>all.findIndex(a=>a.id===b.id)===i).map(b=><button key={b.id} onClick={()=>engine.current?.openBook(reader.id,b.id,b.volIndex||0)}>{b.title}<small>{b.author}</small><span aria-hidden="true">↗</span></button>)}</section>}
      </>:<nav className="ashore-actions" aria-label="Explore Nowbrary on foot">
        <p role="status">{foot.walking?(foot.destination==='boat'?'Walking back to your boat…':foot.destination==='shop'?'Through the doorway…':foot.destination==='garden'?'Walking to the shade…':'Stepping onto the quay…'):'Choose a place to walk.'}</p>
        <div><button ref={shopButton} disabled={!ready||foot.walking} onClick={()=>walk('shop')}>Enter the bookshop <span aria-hidden="true">↗</span></button><button disabled={!ready||foot.walking} onClick={()=>walk('garden')}>{WALK_PLACES.garden.title}</button><button disabled={!ready||foot.walking} onClick={()=>walk('boat')}>Back to boat <span aria-hidden="true">↙</span></button></div>
      </nav>}
    </>}
    {sailing!==false&&<div className="world-sailing" role="status"><span className="sailing-line"/>{sailing?`Sailing to ${PORTS[sailing].title}`:'Following your course'}<span aria-hidden="true">↗</span></div>}
    {ready&&!failed&&<div className="world-tools" aria-label="World controls">
      <button onClick={()=>engine.current?.zoomBy(1.2)} aria-label="Zoom in">+</button>
      <button onClick={()=>engine.current?.zoomBy(1/1.2)} aria-label="Zoom out">−</button>
      <button onClick={overview} aria-label={foot?'Look around Nowbrary':'Show the whole bay'} title={foot?'The quay':'The whole bay'}>⌖</button>
      <button onClick={toggleMotion} aria-label={motion?'Pause ambient motion':'Resume ambient motion'} aria-pressed={!motion} title={motion?'Pause motion':'Resume motion'}>{motion?'Ⅱ':'▷'}</button>
    </div>}
    {failed&&<section className="world-fallback" role="status"><p className="world-kicker">The first shores</p><h1>The harbour needs<br/>a clearer day.</h1><p>The 3D world couldn’t open on this device. The reading and Sunday Ritual are ready below.</p><a className="world-primary" href={'/mapthewild/posts/nowbrary-living-constellation'}>Read the Nowbrary ↗</a><a href={'/mapthewild/sundayritual'}>Begin Sunday Ritual →</a><button className="world-text-button" onClick={()=>location.reload()}>Try the world again</button></section>}
    <footer className="world-footer"><span>FIRST SHORES <i/> GROWING OVER TIME</span><span className="world-help">{inside?'Choose a shelf · touch a spine to read':foot?'Choose a place · drag to look · scroll or pinch to zoom':entered?'Choose a shore · drag to look · scroll or pinch to zoom':'An inhabited corner of the internet'}</span></footer>
    <BookReader choice={book} motion={motion} onClose={closeBook} onTaken={()=>engine.current?.setBookTaken(true)}/>
    <ShoreReader selected={essay} essays={essays} bodies={{'nowbrary-living-constellation':nowbraryPost,'starting-your-nowbrary':startingPost}} origin={lensOrigin} motion={motion} ashore={!!foot} onSelect={setEssay} onClose={closeEssay} onStepAshore={()=>engine.current?.stepAshore()}/>
    <noscript><div className="world-fallback"><h1>Map the Wild</h1><p>Exploration uses JavaScript. You can read everything directly.</p><a href={'/mapthewild/posts/nowbrary-living-constellation'}>The Nowbrary</a><a href={'/mapthewild/sundayritual'}>Sunday Ritual</a></div></noscript>
  </main>;
}
