import {useEffect,useRef,useState} from 'react';
import {FUTURE_DADS_VISIT} from '../../lib/world/future-dads-sea';
import {visitMessage,visitTransform} from '../../lib/world/future-dads-bridge';
type Frame={x:number;y:number;size:number;yaw:number};
type Engine={suspend:(v:boolean)=>void;futureDadsFrame:()=>Frame;prepareFutureDadsReturn:(yaw:number)=>Frame;leaveFutureDads:()=>void};
export default function FutureDadsVoyage({active,motion,engine,onReturn}:{active:boolean;motion:boolean;engine:{current:Engine|null};onReturn:()=>void}){
 const iframe=useRef<HTMLIFrameElement>(null),layer=useRef<HTMLDivElement>(null);
 const ready=useRef(false),entered=useRef(false),activeRef=useRef(active);
 const [status,setStatus]=useState('Loading Future Dads…'),[failed,setFailed]=useState(false);
 const send=(data:object)=>iframe.current?.contentWindow?.postMessage(data,location.origin);
 function enter(){
  if(!activeRef.current||!ready.current||entered.current)return;
  entered.current=true;setStatus('');setFailed(false);
  const frame=engine.current?.futureDadsFrame();engine.current?.suspend(true);
  send({type:'fd:enter',motion,frame});
 }
 useEffect(()=>{send({type:'fd:motion',motion});},[motion]);
 useEffect(()=>{activeRef.current=active;if(active)enter();else send({type:'fd:visibility',visible:false});},[active]);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   const data=visitMessage(event,iframe.current?.contentWindow||null,location.origin);if(!data)return;
   if(data?.type==='fd:ready'){ready.current=true;enter();}
   if(data?.type==='fd:entered'&&activeRef.current){
    const start=engine.current?.futureDadsFrame(),end=data.frame;
    if(start&&end&&[end.x,end.y,end.size].every(Number.isFinite)&&end.size>0&&layer.current){
     const {x,y,scale}=visitTransform(start,end);
     const from=`translate(${x}px,${y}px) scale(${scale})`;
     layer.current.animate([{transform:from,opacity:0},{transform:'none',opacity:1}],{duration:motion?1000:0,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.then(()=>{if(activeRef.current){send({type:'fd:approach'});iframe.current?.focus({preventScroll:true});}});
    }else send({type:'fd:approach'});
   }
   if(data?.type==='fd:left'&&activeRef.current){
    send({type:'fd:visibility',visible:false});
    const finish=()=>{entered.current=false;engine.current?.leaveFutureDads();onReturn();};
    const end=data.frame,start=engine.current?.prepareFutureDadsReturn(Number.isFinite(end?.yaw)?end.yaw:0);
    if(layer.current&&motion&&start&&end&&['x','y','size'].every(key=>Number.isFinite(end[key]))&&end.size>0){
     const {x,y,scale}=visitTransform(start,end);
     layer.current.animate([{transform:'none',opacity:1},{transform:`translate(${x}px,${y}px) scale(${scale})`,opacity:0}],{duration:1000,easing:'cubic-bezier(.4,0,.2,1)'}).finished.then(finish);
    }else finish();
   }
   if(data?.type==='fd:error'){setStatus('The island could not open. You can return to the sea.');setFailed(true);engine.current?.suspend(false);}
   if(data?.type==='mtw:page-scroll'&&activeRef.current&&window.parent!==window)window.parent.postMessage(data,location.origin);
  };
  const visibility=()=>send({type:'fd:visibility',visible:activeRef.current&&!document.hidden});
  const blogVisibility=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===window.parent&&event.data?.type==='mtw:page-visibility')send({type:'fd:visibility',visible:activeRef.current&&event.data.visible});};
  addEventListener('message',receive);addEventListener('message',blogVisibility);document.addEventListener('visibilitychange',visibility);
  return()=>{removeEventListener('message',receive);removeEventListener('message',blogVisibility);document.removeEventListener('visibilitychange',visibility);};
 },[motion]);
 useEffect(()=>{if(!active||ready.current)return;const timeout=setTimeout(()=>{if(!ready.current){setFailed(true);setStatus('The island is taking longer to load. You can return to the sea.');}},15000);return()=>clearTimeout(timeout);},[active]);
 return <div ref={layer} className={`future-dads-voyage ${active?'is-active':''}`} aria-hidden={!active} inert={!active}>
  <iframe ref={iframe} src={FUTURE_DADS_VISIT} title="Future Dads Club: land, walk to the radio and return" allow="autoplay" tabIndex={active?0:-1}/>
  {active&&status&&<div className="future-dads-loading" role="status"><p>{status}</p>{failed&&<button onClick={()=>{entered.current=false;engine.current?.leaveFutureDads();onReturn();}}>Back to the sea</button>}</div>}
 </div>;
}
