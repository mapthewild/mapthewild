import {useEffect,useRef,useState} from 'react';

const gallery='/mapthewild/world/nowbrary/gallery.html';
export default function ReadingRoom({open,onClose,readHref,onRead}:{open:boolean;onClose:()=>void;readHref:string;onRead:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),frame=useRef<HTMLIFrameElement>(null);
  const [loaded,setLoaded]=useState(false),[revision,setRevision]=useState(0),[hash,setHash]=useState('#moe');
  useEffect(()=>{
    if(open){setLoaded(false);dialog.current?.showModal();}
    else dialog.current?.close();
  },[open]);
  function close(){
    // Keep the selected shelf/book when stepping back into the room.
    try{const next=frame.current?.contentWindow?.location.hash;if(next&&/^#[a-z0-9/-]+$/.test(next))setHash(next);}catch{}
    onClose();
  }
  return <dialog className="reading-room" ref={dialog} aria-label="Inside the Nowbrary" onCancel={event=>{event.preventDefault();close();}}>
    <header className="reading-room-header">
      <button onClick={close} autoFocus><span aria-hidden="true">←</span> Back to the courtyard</button>
      <p>NOWBRARY <span>/</span> THE READING ROOM</p>
      <a href={readHref} onClick={onRead}>Read page <span aria-hidden="true">↗</span></a>
    </header>
    <div className="reading-room-content">
      {open&&<iframe key={revision} ref={frame} src={gallery+hash} title="Nowbrary shelves and books" onLoad={()=>setLoaded(true)} allow="fullscreen"/>}
      {!loaded&&<div className="reading-room-loading" role="status"><span aria-hidden="true">✳</span><p>Opening the reading room…</p><a href={gallery+hash} target="_blank" rel="noopener">Open the shelves in their own window ↗</a><button onClick={()=>setRevision(n=>n+1)}>Try again</button></div>}
    </div>
  </dialog>;
}
