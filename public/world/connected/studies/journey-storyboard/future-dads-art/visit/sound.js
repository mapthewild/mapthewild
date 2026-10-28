import {soundProfile,HEARING_THRESHOLD} from '../radio-approach/sound-profile.mjs';
import {episodes} from './episodes.mjs';
import {createTuningReceiver,receiverProfile} from './tuning-noise.mjs';
import {connectDial} from './rotary-dial.mjs';

export function createRadio(){
 const $=id=>document.getElementById(id),audio=$('episode'),saved=new Map();
 let context,filter,voiceGain,master,pan,analyser,receiver,meterFrame=0;
 let enabled=false,manualPause=false,ended=false,distance=0,request=null,generation=0,failed=false;
 let index=14,candidate=14,tuning=false,commitTimer=0,settleTimer=0,pendingSeek=null,lastTune=0,lastStation=15,tuningSpeed=0;
 const format=t=>Math.floor((t||0)/60)+':'+String(Math.floor((t||0)%60)).padStart(2,'0');
 const audible=()=>distance>=HEARING_THRESHOLD;
 const wanted=()=>enabled&&!manualPause&&!ended&&!failed&&!document.hidden&&audible();
 function invalidate(){generation++;request=null;audio.pause();}
 function graph(){
  if(context)return;
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)throw Error('Audio effects unavailable');
  context=new C();
  const source=context.createMediaElementSource(audio);
  filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.value=.35;
  voiceGain=context.createGain();voiceGain.gain.value=0;
  master=context.createGain();master.gain.value=0;
  analyser=context.createAnalyser();analyser.fftSize=1024;
  source.connect(filter);
  if(context.createStereoPanner){pan=context.createStereoPanner();filter.connect(pan);pan.connect(voiceGain);}else filter.connect(voiceGain);
  voiceGain.connect(master);master.connect(analyser);analyser.connect(context.destination);
  receiver=createTuningReceiver(context,master);
  context.addEventListener('statechange',()=>{render();if(context.state==='running'){sync();startMeter();}});
 }
 function startMeter(){
  if(meterFrame||!analyser)return;
  const samples=new Float32Array(analyser.fftSize);
  function read(){
   meterFrame=0;
   if(!enabled||document.hidden||context.state!=='running'){$('signal').value=0;$('signal').title='Sound level: 0%';return;}
   analyser.getFloatTimeDomainData(samples);
   let sum=0;for(const sample of samples)sum+=sample*sample;
   const level=Math.min(1,Math.sqrt(sum/samples.length)*14);
   $('signal').value=level;$('signal').title='Sound level: '+Math.round(level*100)+'%';
   meterFrame=requestAnimationFrame(read);
  }
  meterFrame=requestAnimationFrame(read);
 }
 function stopNoise(){
  receiver?.stop(!enabled||manualPause||document.hidden||context.state!=='running');
 }
 function noise(){
  if(!context||context.state!=='running'||!wanted())return;
  receiver.turn(Number($('tuning').value),tuningSpeed,soundProfile(distance,$('clear').checked,1).gain);
 }
 function apply(){
  if(context){
   const p=soundProfile(distance,$('clear').checked,1),now=context.currentTime;
   master.gain.setTargetAtTime(enabled&&!manualPause&&!document.hidden?Number($('volume').value)/100:0,now,.015);
   voiceGain.gain.setTargetAtTime(wanted()?p.gain*(tuning?receiverProfile(Number($('tuning').value),tuningSpeed).voice:1):0,now,.08);
   filter.frequency.setTargetAtTime(p.cutoff,now,.14);pan?.pan.setTargetAtTime(p.pan,now,.14);
   if(!wanted())stopNoise();
   else receiver.setDistance(p.gain);
  }
 }
 function showEpisode(){
  const e=episodes[candidate];
  $('episode-number').textContent='Episode '+e.number+' of '+episodes.length;
  const link=$('episode-page'),url=new URL(e.href,location.origin);link.replaceChildren(document.createTextNode(e.title));if(url.origin!==location.origin&&!document.body.classList.contains('owned-visit')){const arrow=document.createElement('span');arrow.textContent=' ↗';arrow.setAttribute('aria-hidden','true');link.append(arrow);}link.href=document.body.classList.contains('owned-visit')?url.pathname:e.href;
  link.setAttribute('aria-label',e.title+(document.body.classList.contains('owned-visit')?', open episode page':', open episode page in a new tab'));
  $('episode-meta').textContent=new Date(e.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+' · '+e.length;
  $('tuning').setAttribute('aria-valuetext','Episode '+e.number+': '+e.title);
  $('previous-episode').disabled=candidate===0;$('next-episode').disabled=candidate===episodes.length-1;
  $('radio-knob').setAttribute('aria-valuetext','Episode '+e.number+': '+e.title);
 }
 function render(){
  $('sound').textContent=enabled?'Sound on · turn off':'Enable sound';$('sound').setAttribute('aria-pressed',String(enabled));
  const suspended=enabled&&context&&context.state!=='running';
  $('pause-audio').disabled=enabled&&!manualPause&&!ended&&!failed&&!suspended&&!audible();
  $('pause-audio').textContent=failed?'Retry sound':!enabled?'Turn radio on':suspended?'Resume audio':ended?'Play again':manualPause?'Resume episode':!audible()?'Sound ready':'Pause episode';
  $('seek').disabled=!enabled||!Number.isFinite(audio.duration)||tuning;
  $('tuning-state').textContent=tuning?'Tuning…':'Episode '+episodes[candidate].number;
  const message=failed?'The recording could not play. Choose Retry sound.':!enabled?'Sound is off.':suspended?'Choose Resume audio to hear the recording.':manualPause?'Episode paused.':ended?'The episode has finished.':!audible()?'Sound is on. The radio is out of earshot.':tuning?'Tuning to '+episodes[candidate].title:request?'Loading the episode…':audio.paused?'Getting the recording ready…':'Playing “'+episodes[index].title+'”';
  if($('sound-state').textContent!==message)$('sound-state').textContent=message;
 }
 function sync(){
  if(!wanted()){if(!audio.paused||request)invalidate();render();return;}
  if(context?.state!=='running'||!audio.paused||request){render();return;}
  const pending={generation};request=pending;render();
  Promise.resolve(audio.play()).catch(error=>{
   if(request===pending&&error.name!=='AbortError'){failed=true;apply();}
  }).finally(()=>{
   // A late play result from an older station must never pause the new one.
   if(request!==pending)return;
   request=null;if(!wanted())audio.pause();render();startMeter();
  });
 }
 function remember(){if(Number.isFinite(audio.currentTime))saved.set(index,audio.currentTime);}
 function commit(){
  if(candidate===index)return;
  remember();invalidate();index=candidate;ended=false;failed=false;
  pendingSeek=saved.get(index)||0;
  audio.src=episodes[index].audio;audio.load();
  $('time').textContent=format(pendingSeek);$('seek').value=String(Math.floor(pendingSeek));
  $('duration').textContent=episodes[index].length;apply();sync();
 }
 function settle(){
  clearTimeout(commitTimer);commitTimer=0;clearTimeout(settleTimer);commit();tuning=false;
  $('tuning').dispatchEvent(new Event('tuned'));stopNoise();apply();sync();
 }
 function tune(value){
  clearTimeout(settleTimer);
  const now=performance.now(),elapsed=(now-lastTune)/1000;
  tuningSpeed=elapsed<.4?Math.abs(value-lastStation)/Math.max(.016,elapsed):0;lastStation=value;lastTune=now;
  candidate=Math.max(0,Math.min(episodes.length-1,Math.round(value)-1));
  tuning=true;ended=false;showEpisode();apply();
  if(context&&enabled)context.resume().catch(()=>{});
  noise();render();
  if(!commitTimer)commitTimer=setTimeout(()=>{commitTimer=0;commit();},180);
  settleTimer=setTimeout(settle,320);
 }
 async function enable(){
  try{
   graph();invalidate();enabled=true;manualPause=false;failed=false;
   if(ended){audio.currentTime=0;ended=false;}
   apply();render();
   const pending={generation};request=pending;
   // Both calls happen in the explicit click handler, including when offshore.
   // The gain remains zero outside hearing range while the element is primed.
   const resume=context.resume(),play=audio.play();
   try{await Promise.all([resume,play]);if(request===pending&&!wanted())audio.pause();}
   catch(error){if(request===pending&&error.name!=='AbortError')failed=true;}
   finally{if(request===pending)request=null;apply();sync();startMeter();}
  }catch{failed=true;enabled=false;render();}
 }
 function disable(){enabled=false;settle();invalidate();stopNoise();apply();render();$('signal').value=0;$('signal').title='Sound level: 0%';}
 $('sound').addEventListener('click',()=>enabled?disable():enable());
 $('pause-audio').addEventListener('click',()=>{
  if(!enabled||failed||context?.state!=='running'){enable();return;}
  if(ended){audio.currentTime=0;ended=false;manualPause=false;}else manualPause=!manualPause;
  settle();apply();sync();
 });
 $('volume').addEventListener('input',()=>{$('volume-value').textContent=$('volume').value+'%';apply();});
 $('clear').addEventListener('change',()=>{apply();render();});
 $('tuning').addEventListener('input',()=>tune(Number($('tuning').value)));
 $('tuning').addEventListener('change',()=>{clearTimeout(settleTimer);settleTimer=setTimeout(settle,180);});
 for(const [id,offset] of [['previous-episode',-1],['next-episode',1]])$(id).addEventListener('click',()=>{const value=Math.max(1,Math.min(episodes.length,candidate+1+offset));$('tuning').value=String(value);$('tuning').dispatchEvent(new Event('input',{bubbles:true}));});
 $('seek').addEventListener('input',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number($('seek').value);ended=false;apply();sync();}});
 audio.addEventListener('loadedmetadata',()=>{
  if(pendingSeek!==null){audio.currentTime=pendingSeek< audio.duration-.25?pendingSeek:0;pendingSeek=null;}
  $('duration').textContent=format(audio.duration);$('seek').max=String(Math.floor(audio.duration));render();
 });
 audio.addEventListener('timeupdate',()=>{$('time').textContent=format(audio.currentTime);$('seek').value=String(Math.floor(audio.currentTime));$('seek').setAttribute('aria-valuetext',format(audio.currentTime));});
 audio.addEventListener('playing',render);
 audio.addEventListener('ended',()=>{ended=true;stopNoise();render();});
 audio.addEventListener('error',()=>{failed=true;stopNoise();apply();render();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){settle();stopNoise();}apply();sync();startMeter();});
 window.addEventListener('pagehide',()=>{remember();settle();invalidate();stopNoise();});
 window.addEventListener('pageshow',()=>{apply();sync();});
 showEpisode();connectDial($('radio-knob'),$('tuning'));render();return{
  enable,
  snapshot(){remember();return {index,time:audio.currentTime,volume:Number($('volume').value),positions:[...saved]};},
  restore(state){
   if(!state||!Number.isInteger(state.index)||state.index<0||state.index>=episodes.length)return;
   index=candidate=state.index;pendingSeek=Number.isFinite(state.time)?Math.max(0,state.time):0;
   if(Array.isArray(state.positions))for(const [i,t] of state.positions)if(Number.isInteger(i)&&i>=0&&i<episodes.length&&Number.isFinite(t)&&t>=0)saved.set(i,t);
   $('tuning').value=String(index+1);$('volume').value=String(Math.max(0,Math.min(100,state.volume??25)));$('volume-value').textContent=$('volume').value+'%';
   audio.src=episodes[index].audio;audio.load();showEpisode();apply();render();
  },
  setDistance(value){if(Math.abs(value-distance)<.000001)return;distance=value;apply();sync();},
  get station(){return Number($('tuning').value);}
 };
}
