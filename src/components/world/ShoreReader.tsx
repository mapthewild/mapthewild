import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type ReactNode,type PointerEvent,type FocusEvent} from 'react';
import type {LensOrigin,ShoreEssay,ShoreEssaySlug} from '../../lib/world/shore-reading';
import '../../styles/world/shore-reader.css';

export function SpyglassIcon(){
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m5 23 5 3 13-15-5-4L5 23Z" stroke="currentColor" strokeWidth="1.5"/><path d="m16 9 5 4M10 16l5 4M4 22l5 4M18 6l6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="m20 20 3 5M23 18l5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
}

type Props={
  selected:ShoreEssaySlug|null;essays:ShoreEssay[];bodies:Record<ShoreEssaySlug,ReactNode>;
  origin:LensOrigin;motion:boolean;ashore:boolean;
  onSelect:(slug:ShoreEssaySlug)=>void;onClose:()=>void;onStepAshore:()=>void;
};

export default function ShoreReader({selected,essays,bodies,origin,motion,ashore,onSelect,onClose,onStepAshore}:Props){
  const dialog=useRef<HTMLDialogElement>(null),scroller=useRef<HTMLDivElement>(null);
  const stage=useRef<HTMLDivElement>(null);
  const optics=useRef({width:0,height:0,diameter:0});
  const openingUntil=useRef(0),viewProgress=useRef<number|null>(null);
  const headings=useRef<Partial<Record<ShoreEssaySlug,HTMLHeadingElement>>>({});
  const positions=useRef<Partial<Record<ShoreEssaySlug,number>>>({});
  const returnFocus=useRef<HTMLElement|null>(null),closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const closingRef=useRef(false);
  const [closing,setClosing]=useState(false),[progress,setProgress]=useState(0);
  const [fullPage,setFullPage]=useState(false);
  const current=essays.find(essay=>essay.slug===selected)||essays[0];
  const index=essays.indexOf(current),next=essays[index+1];

  useEffect(()=>{
    if(selected&&!dialog.current?.open){
      returnFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
      setFullPage(matchMedia('(max-width: 640px)').matches);openingUntil.current=performance.now()+1100;
      closingRef.current=false;setClosing(false);dialog.current?.showModal();
    }else if(!selected&&dialog.current?.open){
      dialog.current.close();returnFocus.current?.focus({preventScroll:true});
    }
    if(selected&&scroller.current){
      scroller.current.scrollTop=positions.current[selected]||0;
      headings.current[selected]?.focus({preventScroll:true});
      updateProgress();
    }
  },[selected]);
  useEffect(()=>()=>{if(closeTimer.current)clearTimeout(closeTimer.current);},[]);
  useEffect(()=>{
    const element=stage.current;if(!element)return;
    const measure=()=>{
      const bounds=element.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
      const diameter=Math.max(0,Math.min(bounds.width-48,bounds.height-48,720));
      optics.current={width:bounds.width,height:bounds.height,diameter};
      element.style.setProperty('--lens-size',`${diameter}px`);
      element.style.setProperty('--scope-x',`${bounds.width/2}px`);
      element.style.setProperty('--scope-y',`${bounds.height/2}px`);
      element.style.setProperty('--scope-padding',`${(bounds.height-diameter)/2+diameter*.16}px`);
      element.style.setProperty('--entry-x',`${origin.x-bounds.left-bounds.width/2}px`);
      element.style.setProperty('--entry-y',`${origin.y-bounds.top-bounds.height/2}px`);
    };
    const observer=new ResizeObserver(measure);observer.observe(element);measure();
    return()=>observer.disconnect();
  },[origin.x,origin.y]);
  useLayoutEffect(()=>{
    if(viewProgress.current===null||!scroller.current)return;
    const element=scroller.current;
    element.scrollTop=viewProgress.current*Math.max(0,element.scrollHeight-element.clientHeight);
    viewProgress.current=null;updateProgress();
  },[fullPage]);

  function updateProgress(){
    const el=scroller.current;if(!el)return;
    const distance=el.scrollHeight-el.clientHeight;
    setProgress(distance>0?el.scrollTop/distance:1);
    if(selected)positions.current[selected]=el.scrollTop;
  }
  function close(land=false){
    if(closingRef.current)return;
    closingRef.current=true;setClosing(true);
    const finish=()=>{onClose();if(land)onStepAshore();};
    if(motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches)closeTimer.current=setTimeout(finish,220);
    else finish();
  }
  function select(slug:ShoreEssaySlug){
    if(closingRef.current)return;
    aimLens(optics.current.width/2,optics.current.height/2);onSelect(slug);
  }
  function aimLens(x:number,y:number){
    const {width,height,diameter}=optics.current,padding=diameter/2+18;
    stage.current?.style.setProperty('--scope-x',`${Math.max(padding,Math.min(width-padding,x))}px`);
    stage.current?.style.setProperty('--scope-y',`${Math.max(padding,Math.min(height-padding,y))}px`);
  }
  function moveLens(event:PointerEvent<HTMLDivElement>){
    if(fullPage||!motion||event.pointerType!=='mouse'||performance.now()<openingUntil.current)return;
    const bounds=event.currentTarget.getBoundingClientRect();
    aimLens(event.clientX-bounds.left,event.clientY-bounds.top);
  }
  function revealFocusedLink(event:FocusEvent<HTMLDivElement>){
    if(fullPage||!event.target.matches('a,button'))return;
    requestAnimationFrame(()=>{
      if(!stage.current)return;
      const bounds=stage.current.getBoundingClientRect(),target=event.target.getBoundingClientRect();
      aimLens(target.x+target.width/2-bounds.x,target.y+target.height/2-bounds.y);
    });
  }
  function toggleView(){
    const element=scroller.current;
    viewProgress.current=element?element.scrollTop/Math.max(1,element.scrollHeight-element.clientHeight):0;
    if(fullPage)openingUntil.current=performance.now()+1100;
    setFullPage(value=>!value);
  }
  const style={'--reading-progress':progress} as CSSProperties;
  return <dialog ref={dialog} className={`shore-reader ${fullPage?'is-full-page':'is-spyglass'} ${closing?'is-closing':''} ${!motion?'is-still':''}`} style={style}
    aria-labelledby="shore-reading-title"
    onCancel={event=>{event.preventDefault();close();}}
    onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}}>
    <div className="shore-reading-veil" aria-hidden="true"/>
    <div className="shore-reading-reveal">
      <header className="shore-reading-toolbar">
        <span><SpyglassIcon/> <span>NOWBRARY</span></span>
        <button onClick={()=>close()} aria-label="Close the posts"><span aria-hidden="true">×</span></button>
      </header>
      <div className="shore-reading-options">
        <nav className="shore-lens-essays" aria-label="Nowbrary posts" hidden={fullPage}>
          {essays.map((essay,i)=><button key={essay.slug} onClick={()=>select(essay.slug)} aria-current={current.slug===essay.slug?'page':undefined}>
            <small>0{i+1}</small><span>{essay.title}</span>
          </button>)}
        </nav>
        <button className="shore-view-toggle" onClick={toggleView} aria-pressed={fullPage}>{fullPage?'Use spyglass':'Read full page'}</button>
      </div>
      <div className="shore-reading-stage" ref={stage} onPointerMove={moveLens}>
      <div className="shore-optic">
      <div className="shore-paper">
        <aside className="shore-reading-index">
          <div className="shore-chart-mark" aria-hidden="true"><span>✳</span></div>
          <p className="shore-small-label">NOWBRARY<br/>POSTS</p>
          <p className="shore-index-intro">{ashore?'Before you go':'Before you'}<br/><em>{ashore?'into the bookshop.':'step ashore.'}</em></p>
          <nav aria-label="Nowbrary posts">{essays.map((essay,i)=><button key={essay.slug} onClick={()=>select(essay.slug)} aria-current={current.slug===essay.slug?'page':undefined}>
            <span className="shore-essay-number">0{i+1}</span><span>{essay.title}<small>{essay.minutes} min read</small></span>
          </button>)}</nav>
        </aside>
        <div className="shore-reading-scroll" ref={scroller} onScroll={updateProgress} onFocusCapture={revealFocusedLink} tabIndex={0} aria-label="Essay text">
          {essays.map((essay,i)=><article key={essay.slug} hidden={current.slug!==essay.slug}>
            <header className="shore-essay-heading">
              <p className="shore-small-label">NOWBRARY <span>·</span> 0{i+1} / 0{essays.length} <span>·</span> {essay.minutes} MIN READ</p>
              <h1 id={current.slug===essay.slug?'shore-reading-title':undefined} ref={el=>{if(el)headings.current[essay.slug]=el;}} tabIndex={-1}>{essay.title}</h1>
              <p className="shore-essay-deck">{essay.description}</p>
              <div className="shore-essay-rule" aria-hidden="true"><span>✳</span></div>
            </header>
            <div className="shore-essay-prose" onClick={event=>{
              const link=event.target instanceof Element?event.target.closest('a'):null;
              if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
              const other=essays.find(item=>link.pathname.replace(/\/$/,'')===`/mapthewild/posts/${item.slug}`&&link.origin===location.origin);
              if(other){event.preventDefault();select(other.slug);}
            }}>{bodies[essay.slug]}</div>
            {next&&current.slug===essay.slug&&<button className="shore-next-essay" onClick={()=>select(next.slug)}><span><small>CONTINUE READING</small>{next.title}</span><span aria-hidden="true">→</span></button>}
            <a className="shore-plain-link" href={`/mapthewild/posts/${essay.slug}`} target="_blank" rel="noopener noreferrer">Open as a blog post <span aria-hidden="true">↗</span><span className="shore-sr-only"> in a new tab</span></a>
          </article>)}
        </div>
        <div className="shore-reading-progress" aria-hidden="true"><span/></div>
      </div>
      <div className="shore-lens-rim" aria-hidden="true"/>
      </div>
      </div>
      <footer className="shore-reading-footer">
        <button onClick={()=>close()}><span aria-hidden="true">←</span> {ashore?'Back to Nowbrary':'Back to the boat'}</button>
        <span>{fullPage?'Scroll to read':<>{motion&&<span className="shore-mouse-hint">Move the glass · </span>}Scroll to read</>}</span>
        {!ashore&&<button className="shore-step-ashore" onClick={()=>close(true)}>Step ashore</button>}
      </footer>
    </div>
  </dialog>;
}
