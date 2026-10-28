// A long bed of irregular receiver hiss. It runs continuously during a turn;
// filters and quiet carrier tones move over it, rather than retriggering a clip.
export function tuningSamples(sampleRate=44100,duration=12,seed=76321){
 const samples=new Float32Array(Math.ceil(sampleRate*duration));
 let low=0,rumble=0,drift=0;
 const a=1-Math.exp(-2*Math.PI*7000/sampleRate),b=1-Math.exp(-2*Math.PI*220/sampleRate);
 for(let i=0;i<samples.length;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const white=seed/2147483648-1,t=i/sampleRate;
  low+=a*(white-low);rumble+=b*(low-rumble);drift+=.0001*(white-drift);
  const edge=Math.min(1,t/.008,(duration-t)/.008);
  samples[i]=Math.max(-.12,Math.min(.12,(low-rumble)*.20*(.82+Math.min(.18,Math.abs(drift)*12))*edge));
 }
 samples[0]=samples[samples.length-1]=0;return samples;
}

export function receiverProfile(station,speed=0){
 const gap=Math.min(1,Math.abs(station-Math.round(station))*2),motion=Math.min(1,speed/12);
 return{
  hiss:.3+.55*Math.sqrt(gap)+.15*motion,
  cutoff:1500+gap*3900+motion*1000,
  colour:850+gap*1900+Math.sin(station*1.7)*230,
  // A few weak carriers between stations, not a whistle on every tick.
  whistle:Math.pow(Math.max(0,Math.sin(station*2.17+.8)),4)*gap*.012,
  pitch:260+Math.pow(gap,1.4)*2300+Math.sin(station*4.1)*90,
  voice:.14+.86*(1-Math.sqrt(gap))*(1-motion*.7)
 };
}

export function createTuningReceiver(context,output){
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*12),context.sampleRate);
 buffer.copyToChannel(tuningSamples(context.sampleRate,12,Math.floor(Math.random()*0xffffffff)),0);
 let active=null;
 function stop(immediate=false){
  if(!active)return;
  const voice=active;active=null;const now=context.currentTime;
  voice.level.gain.cancelScheduledValues(now);
  if(immediate)voice.level.gain.setValueAtTime(0,now);
  else voice.level.gain.setTargetAtTime(0,now,.045);
  voice.source.stop(immediate?now:now+.24);voice.carrier.stop(immediate?now:now+.24);
 }
 function turn(station,speed,distanceGain){
  const now=context.currentTime,p=receiverProfile(station,speed);
  if(!active){
   const source=context.createBufferSource(),colour=context.createBiquadFilter(),lowpass=context.createBiquadFilter();
   const hiss=context.createGain(),carrier=context.createOscillator(),tone=context.createGain(),level=context.createGain();
   source.buffer=buffer;source.loop=true;colour.type='bandpass';colour.Q.value=.45;lowpass.type='lowpass';lowpass.Q.value=.45;
   carrier.type='sine';tone.gain.value=0;level.gain.value=0;
   source.connect(colour);colour.connect(lowpass);lowpass.connect(hiss);hiss.connect(level);carrier.connect(tone);tone.connect(level);level.connect(output);
   active={source,colour,lowpass,hiss,carrier,tone,level};
   const voice=active;
   source.addEventListener('ended',()=>{for(const node of Object.values(voice))node.disconnect();});
   source.start(now,Math.random()*10);carrier.start(now);
  }
  active.colour.frequency.setTargetAtTime(p.colour,now,.035);
  active.lowpass.frequency.setTargetAtTime(p.cutoff,now,.035);
  active.hiss.gain.setTargetAtTime(p.hiss,now,.025);
  active.carrier.frequency.setTargetAtTime(p.pitch,now,.045);
  active.tone.gain.setTargetAtTime(p.whistle,now,.035);
  active.level.gain.setTargetAtTime(.75*distanceGain/.8,now,.025);
 }
 function setDistance(gain){active?.level.gain.setTargetAtTime(.75*gain/.8,context.currentTime,.03);}
 return {turn,stop,setDistance};
}
