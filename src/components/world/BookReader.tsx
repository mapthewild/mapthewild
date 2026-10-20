import {useEffect,useRef,useState} from 'react';
import type {BookChoice} from '../../lib/world/shelf-data';

export default function BookReader({choice,motion,onClose,onTaken}:{choice:BookChoice|null;motion:boolean;onClose:()=>void;onTaken:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),frame=useRef<HTMLIFrameElement>(null),closeRef=useRef(onClose),takenRef=useRef(onTaken);
  closeRef.current=onClose;takenRef.current=onTaken;
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  useEffect(()=>{
    if(!choice){dialog.current?.close();return;}
    setReady(false);setFailed(false);dialog.current?.showModal();
    let started=false;
    const timeout=window.setTimeout(()=>{if(!started)setFailed(true);},10000);
    function receive(event:MessageEvent){
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;
      if(event.data?.type==='ready'){
        started=true;clearTimeout(timeout);setReady(true);
        frame.current?.contentWindow?.postMessage({type:'open',id:choice!.book.id,vol:choice!.book.volIndex||0,rect:choice!.rect,tex:choice!.book.tex,cloth:choice!.book.cloth,animate:motion},location.origin);
        frame.current?.focus();
      }else if(event.data?.type==='taken')takenRef.current();
      else if(event.data?.type==='closed')closeRef.current();
    }
    window.addEventListener('message',receive);
    return()=>{clearTimeout(timeout);window.removeEventListener('message',receive);};
  },[choice]);
  function close(){if(ready)frame.current?.contentWindow?.postMessage({type:'close'},location.origin);else closeRef.current();}
  return <dialog ref={dialog} className={`world-book ${ready?'is-ready':''}`} aria-label={choice?`Reading ${choice.book.title}`:'Read a book'} onCancel={event=>{event.preventDefault();close();}}>
    {choice&&<iframe ref={frame} title={`${choice.book.title} — pages and notes`} src={`/mapthewild/world/nowbrary/reader/${choice.page}?embed=gallery&motion=${motion?'on':'off'}`}/>}
    {!ready&&<div className="book-opening" role="status"><p>{failed?'The book is taking longer to open.':'Taking a book from the shelf…'}</p>{failed&&choice&&<a href={`/mapthewild/world/nowbrary/gallery.html#${choice.reader}/${choice.book.id}`} target="_blank" rel="noopener">Open it in the gallery ↗</a>}<button onClick={close}>Back to the shelf</button></div>}
  </dialog>;
}
