import React,{useEffect,useRef,useState} from 'react';
import {FUTURE_DADS_EPISODES} from '../../lib/world/future-dads-episodes';
import '../../styles/world/podcast-listener.css';

// The radio on the island and this room share one note in the tab: which episode, where, and whether it was on.
type Heard={slug:string;time:number;on:boolean;at:number};
function heardNote():Heard|null{try{const n=JSON.parse(sessionStorage.getItem('fd-listening')||'null');return n&&Date.now()-n.at<86400000&&FUTURE_DADS_EPISODES.some(e=>e.id===n.slug)?n:null;}catch{return null;}}
function writeNote(slug:string,time:number,on:boolean){if(document.body.classList.contains('journey-leaving'))return;try{sessionStorage.setItem('fd-listening',JSON.stringify({slug,time,on,at:Date.now()}));}catch{}}

function clock(seconds:number){const n=Math.max(0,Math.floor(seconds||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}

/** One player stays mounted while the episode list opens and closes. */
export default function PodcastListener({open,active,onClose,onWebsite}:{open:boolean;active:boolean;onClose:()=>void;onWebsite?:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),audio=useRef<HTMLAudioElement>(null),title=useRef<HTMLHeadingElement>(null);
  const carried=useRef<Heard|null>(null),noted=useRef(0);
  const positions=useRef<Record<string,number>>({});
  const [episodeId,setEpisodeId]=useState(FUTURE_DADS_EPISODES[0].id),[failed,setFailed]=useState(false);
  const [visited,setVisited]=useState(false),[playing,setPlaying]=useState(false);
  const [time,setTime]=useState(0),[duration,setDuration]=useState(0),[volume,setVolume]=useState(.25);
  const episode=FUTURE_DADS_EPISODES.find(e=>e.id===episodeId)||FUTURE_DADS_EPISODES[0];
  useEffect(()=>{
    if(open&&!dialog.current?.open){setVisited(true);dialog.current?.showModal();if(dialog.current)dialog.current.scrollTop=0;title.current?.focus({preventScroll:true});}
    else if(!open&&dialog.current?.open)dialog.current.close();
  },[open]);
  useEffect(()=>{if(!active)audio.current?.pause();},[active]);
  // Read the note once the page is running (the server-built page can't know it), then pick up that episode.
  useEffect(()=>{const n=heardNote();if(!n)return;carried.current=n;positions.current[n.slug]=n.time;setEpisodeId(n.slug);setTime(n.time);setVisited(true);},[]);
  // Arriving with the radio on: carry on playing here, or wait for Play if the browser needs a click.
  useEffect(()=>{const n=carried.current;if(active&&n?.on&&episodeId===n.slug&&audio.current){carried.current={...n,on:false};void audio.current.play().catch(()=>{});}},[active,episodeId]);
  useEffect(()=>{if(audio.current)audio.current.volume=volume;},[episodeId,volume]);
  useEffect(()=>{const player=audio.current;return()=>player?.pause();},[episodeId]);
  function choose(id:string){
    if(id!==episodeId){
      if(audio.current){positions.current[episodeId]=audio.current.currentTime;audio.current.pause();}
      setFailed(false);setPlaying(false);setTime(positions.current[id]||0);setDuration(0);setEpisodeId(id);
    }
    if(dialog.current)dialog.current.scrollTop=0;
    title.current?.focus({preventScroll:true});
  }
  function close(){onClose();}
  function togglePlayback(){
    const player=audio.current;if(!player)return;
    if(!player.paused)player.pause();
    else{setFailed(false);void player.play().catch(()=>setFailed(true));}
  }
  function controls(){return <div className="podcast-transport">
    <button className="podcast-play" onClick={togglePlayback}>{playing?'Pause episode':'Play episode'}</button>
    <label className="podcast-volume"><span>Volume {Math.round(volume*100)}%</span><input aria-label="Episode volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={e=>setVolume(Number(e.currentTarget.value))}/></label>
    <label className="podcast-progress"><span>{clock(time)}</span><input aria-label="Episode position" aria-valuetext={`${clock(time)} of ${clock(duration)}`} type="range" min="0" max={duration||1} step="1" disabled={!duration} value={Math.min(time,duration||1)} onChange={e=>{if(audio.current){audio.current.currentTime=Number(e.currentTarget.value);setTime(audio.current.currentTime);}}}/><span>{clock(duration)}</span></label>
    {failed&&<p role="status">This episode could not play. Try again or choose another episode.</p>}
  </div>;}
  return <>
    <audio ref={audio} key={episode.id} hidden preload="none" src={episode.audioUrl}
      onPlay={e=>{setPlaying(true);writeNote(episodeId,e.currentTarget.currentTime,true);}} onPause={e=>{setPlaying(false);writeNote(episodeId,e.currentTarget.currentTime,false);}} onEnded={()=>setPlaying(false)} onError={()=>setFailed(true)}
      onTimeUpdate={e=>{const now=e.currentTarget.currentTime;positions.current[episodeId]=now;setTime(now);if(Date.now()-noted.current>1000){noted.current=Date.now();writeNote(episodeId,now,!e.currentTarget.paused);}}}
      onVolumeChange={e=>setVolume(e.currentTarget.volume)}
      onLoadedMetadata={e=>{const player=e.currentTarget,saved=positions.current[episodeId];setDuration(Number.isFinite(player.duration)?player.duration:0);if(saved&&saved<player.duration)player.currentTime=saved;setTime(player.currentTime);}}/>
    {active&&visited&&!open&&<section className="podcast-player" aria-label="Episode player">
      <h2>{episode.title}</h2>
      {controls()}
    </section>}
    <dialog className="podcast-listener" ref={dialog} aria-labelledby="podcast-title" onCancel={e=>{e.preventDefault();close();}}>
    <header><span>Future Dads Club</span><button onClick={close}>Back to the listening place ×</button></header>
    <div className="podcast-listener-body">
      <div className="podcast-listener-art"><img src="/mapthewild/world/connected/future-dads-cover.jpg" alt="Original Future Dad Pod Cast cover: a father lifting a baby beside a lion"/><small>Logo by @adnanmakes</small></div>
      <section className="podcast-listener-current">
        <p className="podcast-kicker">Because you want to become a present dad</p>
        <h1 id="podcast-title" ref={title} tabIndex={-1}>{episode.title}</h1>
        <p className="podcast-episode-meta">{episode.date} · {episode.duration}</p>
        {controls()}
        {episode.description&&<details key={episode.id} className="podcast-notes"><summary>Episode notes</summary><p className="podcast-description">{episode.description}</p></details>}
        {onWebsite?<a href="/" onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey){e.preventDefault();onWebsite();}}}>All episodes</a>:<a href="https://futuredadsclub.com/" target="_blank" rel="noopener noreferrer">Podcast website ↗</a>}
      </section>
      <nav className="podcast-episode-list" aria-label="Future Dads episodes">
        <h2>Episodes</h2>
        {FUTURE_DADS_EPISODES.map(item=><button key={item.id} aria-pressed={episodeId===item.id} onClick={()=>choose(item.id)}>{item.title}<small>{item.date} · {item.duration}</small></button>)}
      </nav>
    </div>
    </dialog>
  </>;
}
