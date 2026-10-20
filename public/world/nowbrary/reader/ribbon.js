/* A cloth bookmark: one sewn end, a fixed material length, and friction
   against the paper. Unsupported cloth falls; only paper contact can hold it. */
window.RibbonChain = class RibbonChain {
  constructor(height, width, count=48) {
    this.count=count;this.height=height;this.width=width;this.length=height+72;this.step=this.length/count;
    this.points=Array.from({length:count+1},(_,i)=>({x:5*Math.sin(i/count*Math.PI),y:i*this.step,z:0,px:5*Math.sin(i/count*Math.PI),py:i*this.step,pz:0}));
    this.held=null;this.bendSide=1;this.contacts=new Map();
  }
  supported(p) {return p.x>=-this.width && p.x<=this.width && p.y>=0 && p.y<=this.height;}
  floor(p) {return this.supported(p)?0:-Infinity;}
  pin() {
    Object.assign(this.points[0],{x:0,y:0,z:0});
    for(const [i,p] of this.contacts)Object.assign(this.points[i],p);
    if(this.held) Object.assign(this.points[this.held.index],this.held.target);
  }
  fixed(i) {return i===0 || i===this.held?.index || this.contacts.has(i);}
  distance(aIndex,bIndex,length,strength=1,minimum=false) {
    const a=this.points[aIndex],b=this.points[bIndex],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
    const distance=Math.max(.00001,Math.hypot(dx,dy,dz));
    if(minimum && distance>=length)return;
    const correction=(distance-length)/distance*strength;
    const af=this.fixed(aIndex),bf=this.fixed(bIndex);
    if(af && bf)return;
    if(!af){const w=bf?1:.5;a.x+=dx*correction*w;a.y+=dy*correction*w;a.z+=dz*correction*w;}
    if(!bf){const w=af?1:.5;b.x-=dx*correction*w;b.y-=dy*correction*w;b.z-=dz*correction*w;}
  }
  constrain(iterations=48) {
    for(let pass=0;pass<iterations;pass++) {
      this.pin();
      // Very light bending resistance only in the air. Contact friction,
      // rather than a shape-restoring spring, holds folds lying on the page.
      for(let i=1;i<this.count-1;i++)if(this.held || (this.points[i].z>1 && this.points[i+2].z>1))this.distance(i,i+2,this.step*1.75,.025,true);
      if(pass%2)for(let i=this.count-1;i>=0;i--)this.distance(i,i+1,this.step);
      else for(let i=0;i<this.count;i++)this.distance(i,i+1,this.step);
      for(let i=1;i<=this.count;i++)if(!this.fixed(i)){const p=this.points[i];p.z=Math.max(this.floor(p),p.z);}
    }
    this.pin();
  }
  freeze() {for(const p of this.points){p.px=p.x;p.py=p.y;p.pz=p.z;}}
  hold(index,x,y) {
    this.contacts.clear();
    index=Math.max(1,Math.min(this.count,index));
    const lift=Math.min(24,index*this.step*.18),reach=Math.sqrt((index*this.step*.997)**2-lift**2);
    const distance=Math.max(.001,Math.hypot(x,y)),scale=Math.min(1,reach/distance);
    x*=scale;y*=scale;
    const previous=this.points.map(p=>({x:p.x,y:p.y,z:p.z})),from=previous[index];
    const travel=Math.hypot(x-from.x,y-from.y,lift-from.z),steps=Math.max(1,Math.ceil(travel/7));
    this.held={index,target:{...from}};
    // Move the grasp through the existing cloth. Reconstructing a Bezier
    // from the binding to the pointer erased every fold and made it a rod.
    for(let n=1;n<=steps;n++) {
      const t=n/steps;this.held.target={x:from.x+(x-from.x)*t,y:from.y+(y-from.y)*t,z:from.z+(lift-from.z)*t};
      this.constrain(36);
    }
    this.constrain(120);
    for(const [i,p] of this.points.entries()) {
      const limit=v=>Math.max(-7,Math.min(7,v))*.45;
      p.px=p.x-limit(p.x-previous[i].x);p.py=p.y-limit(p.y-previous[i].y);p.pz=p.z-limit(p.z-previous[i].z);
    }
  }
  release() {this.held=null;}
  stepFrame() {
    const before=this.points.map(p=>[p.x,p.y,p.z]);
    for(let i=1;i<=this.count;i++) {
      if(this.fixed(i))continue;
      const p=this.points[i],onPaper=this.supported(p) && p.z<=.3;
      const friction=onPaper?.12:.94;
      const vx=(p.x-p.px)*friction,vy=(p.y-p.py)*friction,vz=(p.z-p.pz)*.8;
      p.px=p.x;p.py=p.y;p.pz=p.z;p.x+=vx;p.y+=vy+(onPaper?0:.72);p.z+=vz-(this.supported(p)?.65:.28);
    }
    this.constrain(this.held?96:192);
    if(!this.held)for(let i=1;i<=this.count;i++) {
      if(this.contacts.has(i))continue;
      const p=this.points[i],a=this.points[i-1],b=this.points[Math.min(this.count,i+1)];
      const strain=Math.max(Math.abs(Math.hypot(p.x-a.x,p.y-a.y,p.z-a.z)-this.step),i<this.count?Math.abs(Math.hypot(p.x-b.x,p.y-b.y,p.z-b.z)-this.step):0);
      if(this.supported(p) && p.z===0 && Math.hypot(p.x-before[i][0],p.y-before[i][1])<.12 && strain<.12){this.contacts.set(i,{x:p.x,y:p.y,z:0});break;}
    }
    if(this.held){const p=this.points[this.held.index];p.px=p.x;p.py=p.y;p.pz=p.z;}
    return this.points.reduce((sum,p,i)=>sum+Math.hypot(p.x-before[i][0],p.y-before[i][1],p.z-before[i][2]),0);
  }
};

window.BookmarkRibbon = class BookmarkRibbon {
  constructor(svg, handle, reducedMotion) {
    this.svg=svg;this.leftSVG=document.querySelector('.ribbon-left');this.visuals=[svg,this.leftSVG];this.handle=handle;this.reducedMotion=reducedMotion;this.hit=svg.querySelector('.ribbon-hit');
    this.frame=0;this.drag=null;this.releasedAt=-Infinity;this.enabled=false;this.key=null;this.saved=new Map();this.cover=0;this.layer=9;this.page=1;this.keyboardHeld=false;
    this.markers=Array.from({length:4},()=>{const p=document.createElement('i');p.className='ribbon-map';p.setAttribute('aria-hidden','true');svg.parentElement.append(p);return p;});
    for(const target of [handle,this.hit]) {
      target.addEventListener('pointerdown',event=>this.start(event));
      target.addEventListener('pointermove',event=>this.move(event));
      target.addEventListener('pointerup',event=>this.release(event));
      target.addEventListener('pointercancel',event=>this.release(event));
      target.addEventListener('lostpointercapture',event=>this.release(event));
    }
    handle.setAttribute('aria-description','Drag the ribbon, or use arrow keys to move it. Enter picks it up or lays it down. Home returns it to the gutter.');
    handle.setAttribute('aria-pressed','false');
    handle.addEventListener('click',event=>{
      if(event.detail!==0 || !this.enabled)return;
      if(this.beforeGrab?.()===false)return;
      this.keyboardHeld=!this.keyboardHeld;handle.setAttribute('aria-pressed',String(this.keyboardHeld));
      if(this.keyboardHeld){const end=this.chain.points.at(-1);this.chain.hold(this.chain.count,end.x,end.y);}else this.chain.release();
      this.draw();this.wake();
    });
    handle.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      if(!this.enabled || this.beforeGrab?.()===false)return;
      if(event.key==='Home'){this.saved.delete(this.key);this.reset();return;}
      const end=this.chain.points.at(-1);
      this.chain.hold(this.chain.count,end.x+(event.key==='ArrowLeft'?-24:event.key==='ArrowRight'?24:0),end.y+(event.key==='ArrowUp'?-24:event.key==='ArrowDown'?24:0));
      if(!this.keyboardHeld)this.chain.release();this.draw();this.wake();
    });
  }
  layout(height,width,key) {
    this.remember();this.stop();this.enabled=false;this.key=key;this.height=height;this.width=width;
    for(const svg of this.visuals){
      svg.setAttribute('viewBox',`${-width-100} -100 ${width*2+200} ${height+260}`);
      Object.assign(svg.style,{left:(-width-100)+'px',top:'-100px',width:(width*2+200)+'px',height:(height+260)+'px'});
    }
    this.svg.querySelector('.ribbon-clip').setAttribute('d',`M -1200 -1200 H 1200 V 1800 H -1200 Z M 0 0 V ${height} H ${width} V 0 Z`);
    for(const [i,p] of this.markers.entries()){p.style.left=(i===1 || i===2?width:0)+'px';p.style.top=(i>=2?height:0)+'px';}
    this.chain=new RibbonChain(height,width);
    const old=this.saved.get(key);
    if(old)for(let i=1;i<=this.chain.count;i++)Object.assign(this.chain.points[i],{x:old.points[i].x*width/old.width,y:old.points[i].y*height/old.height,z:old.points[i].z});
    this.chain.constrain(100);this.chain.freeze();this.cover=0;this.draw();
  }
  reset() {this.stop();this.chain=new RibbonChain(this.height,this.width);this.draw();this.remember();}
  remember() {
    if(this.chain && this.key)this.saved.set(this.key,{height:this.height,width:this.width,points:this.chain.points.map(({x,y,z})=>({x,y,z}))});
  }
  stop() {
    cancelAnimationFrame(this.frame);this.frame=0;this.drag=null;
    this.chain?.release();this.keyboardHeld=false;this.handle.setAttribute('aria-pressed','false');delete this.handle.dataset.dragging;delete this.svg.dataset.dragging;
  }
  setEnabled(enabled) {
    if(!enabled && (this.drag || this.keyboardHeld))this.stop();
    const resumed=enabled&&!this.enabled;this.enabled=enabled;this.hit.style.pointerEvents=enabled?'stroke':'none';this.updateHandle();if(resumed && this.chain)this.wake();
  }
  updateHandle() {
    const p=this.chain?.points.at(-1),hidden=this.page<.03 && p && p.x>0 && p.x<this.width && p.y>0 && p.y<this.height;
    const inert=!this.enabled || hidden;
    if(inert && document.activeElement===this.handle)this.handle.closest('dialog').focus({preventScroll:true});
    this.handle.inert=inert;this.handle.style.visibility=hidden?'hidden':'';
  }
  setPage(value) {
    this.page=value;this.setLayer(value>.97?9:1);
    this.hit.style.clipPath=value<.03?'url(#ribbon-uncovered)':'';
    this.updateHandle();
  }
  setCover(amount) {if(this.cover===amount)return;this.cover=amount;this.draw();}
  drawing() {
    if(!this.chain)return null;
    const paths=['shadow','edge','silk'].map(name=>this.svg.querySelector('.ribbon-'+name));
    const key=[this.width,this.height,this.svg.closest('dialog').dataset.variant,...paths.map(p=>p.getAttribute('d'))].join('|');
    if(this.drawingCache?.key===key)return this.drawingCache;
    const xs=[],ys=[];
    for(const p of this.chain.points){xs.push(p.x,p.x+.25+Math.max(0,p.z)*.20);ys.push(p.y,p.y+.35+Math.max(0,p.z)*.17);}
    const x=Math.floor(Math.min(...xs)-8),y=Math.floor(Math.min(...ys)-8);
    const bounds=[x,y,Math.ceil(Math.max(...xs)+8)-x,Math.ceil(Math.max(...ys)+8)-y];
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(bounds[2]*2);canvas.height=Math.ceil(bounds[3]*2);
    const context=canvas.getContext('2d');context.setTransform(2,0,0,2,-bounds[0]*2,-bounds[1]*2);
    for(const path of paths) {
      const style=getComputedStyle(path),shape=new Path2D(path.getAttribute('d'));
      context.save();context.globalAlpha=Number(style.opacity);context.lineWidth=parseFloat(style.strokeWidth);
      context.lineCap=style.strokeLinecap;context.lineJoin=style.strokeLinejoin;
      if(path.classList.contains('ribbon-shadow'))context.filter='blur(1.3px)';
      if(style.fill!=='none'){context.fillStyle=style.fill;context.fill(shape);}
      if(style.stroke!=='none'){context.strokeStyle=style.stroke;context.stroke(shape);}
      context.restore();
    }
    return this.drawingCache={key,canvas,bounds};
  }
  setLayer(layer) {this.layer=layer;for(const svg of this.visuals)svg.style.transform=`translateZ(${layer}px)`;this.handle.style.transform=`translateZ(${layer}px)`;for(const p of this.markers)p.style.transform=`translateZ(${layer}px)`;}
  mapPlane() {
    // SVG's 2-D screen matrix omits the perspective divide of a tilted book.
    // Four projected points recover that plane exactly for pointer tracking.
    const p=this.markers.map(m=>m.getBoundingClientRect());
    const dx1=p[1].x-p[2].x,dx2=p[3].x-p[2].x,dx3=p[0].x-p[1].x+p[2].x-p[3].x;
    const dy1=p[1].y-p[2].y,dy2=p[3].y-p[2].y,dy3=p[0].y-p[1].y+p[2].y-p[3].y;
    const det=dx1*dy2-dx2*dy1;
    const g=Math.abs(det)>1e-8?(dx3*dy2-dx2*dy3)/det:0,h=Math.abs(det)>1e-8?(dx1*dy3-dx3*dy1)/det:0;
    this.map={a:p[1].x-p[0].x+g*p[1].x,b:p[3].x-p[0].x+h*p[3].x,c:p[0].x,d:p[1].y-p[0].y+g*p[1].y,e:p[3].y-p[0].y+h*p[3].y,f:p[0].y,g,h};
  }
  local(event) {
    const m=this.map,x=event.clientX,y=event.clientY;
    const a=m.a-x*m.g,b=m.b-x*m.h,c=x-m.c,d=m.d-y*m.g,e=m.e-y*m.h,f=y-m.f,det=a*e-b*d;
    return {x:(c*e-b*f)/det*this.width,y:(a*f-c*d)/det*this.height};
  }
  start(event) {
    if(!this.enabled || (event.pointerType==='mouse' && event.button!==0))return;
    if(this.beforeGrab?.()===false)return;
    this.stop();this.mapPlane();const p=this.local(event);
    let index=this.chain.count;
    if(event.currentTarget===this.hit) {
      let distance=Infinity;
      for(let i=1;i<=this.chain.count;i++){const v=this.chain.points[i],d=Math.hypot(v.x-p.x,v.y-p.y);if(d<distance){distance=d;index=i;}}
    }
    const held=this.chain.points[index];
    this.drag={id:event.pointerId,index,offsetX:held.x-p.x,offsetY:held.y-p.y};
    event.currentTarget.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
    this.handle.dataset.dragging='';this.svg.dataset.dragging='';
    this.chain.hold(index,held.x,held.y);this.draw();this.wake();
  }
  move(event) {
    if(!this.drag || this.drag.id!==event.pointerId)return;
    const p=this.local(event);this.chain.hold(this.drag.index,p.x+this.drag.offsetX,p.y+this.drag.offsetY);this.draw();this.wake();event.preventDefault();
  }
  release(event) {
    if(!this.drag || event.pointerId!==this.drag.id)return;
    this.drag=null;this.releasedAt=performance.now();delete this.handle.dataset.dragging;delete this.svg.dataset.dragging;
    this.chain.release();this.draw();this.wake();this.remember();
  }
  wake() {
    if(this.reducedMotion.matches) {
      if(!this.drag && !this.keyboardHeld){let quiet=0;for(let i=0;i<1800&&quiet<12;i++){quiet=this.chain.stepFrame()<.10?quiet+1:0;}this.draw();this.remember();}return;
    }
    if(this.frame)return;
    let quiet=0,last=performance.now(),accumulator=0;
    this.svg.dataset.motion='falling';
    const tick=now=>{
      if(!this.enabled){this.frame=0;this.svg.dataset.motion='paused';return;}
      accumulator+=Math.min(64,now-last)/(1000/60);last=now;
      while(accumulator>=1){const energy=this.chain.stepFrame();quiet=this.drag||this.keyboardHeld?0:energy<.10?quiet+1:0;accumulator--;}
      this.draw();
      // Do not freeze an airborne ribbon just because a timer has expired.
      if(this.drag || this.keyboardHeld || quiet<12)this.frame=requestAnimationFrame(tick);
      else{this.frame=0;this.chain.freeze();this.remember();this.svg.dataset.motion='resting';}
    };
    this.frame=requestAnimationFrame(tick);
  }
  draw() {
    if(!this.chain)return;
    const points=this.chain.points;
    const path=shadow=>{
      const pts=points.map(p=>({x:p.x+(shadow?.25+Math.max(0,p.z)*.20:0),y:p.y+(shadow?.35+Math.max(0,p.z)*.17:0)}));
      let d=`M ${pts[0].x} ${pts[0].y}`;
      for(let i=1;i<pts.length-1;i++)d+=` Q ${pts[i].x} ${pts[i].y}, ${(pts[i].x+pts[i+1].x)/2} ${(pts[i].y+pts[i+1].y)/2}`;
      const end=pts.at(-1);return d+` L ${end.x} ${end.y}`;
    };
    const d=path(false);
    this.svg.querySelector('.ribbon-hit').setAttribute('d',d);
    const left=[],right=[];
    for(let i=0;i<points.length;i++) {
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],p=points[i];
      const size=Math.max(.001,Math.hypot(b.x-a.x,b.y-a.y));
      const half=2.8*(.92+.08*Math.sin(i*.24));
      left.push({x:p.x-(b.y-a.y)/size*half,y:p.y+(b.x-a.x)/size*half});
      right.push({x:p.x+(b.y-a.y)/size*half,y:p.y-(b.x-a.x)/size*half});
    }
    const end=points.at(-1),prev=points.at(-2),length=Math.max(.001,Math.hypot(end.x-prev.x,end.y-prev.y));
    const notch={x:end.x-(end.x-prev.x)/length*3.6,y:end.y-(end.y-prev.y)/length*3.6};
    const smooth=(points,move='M')=>{
      let d=`${move} ${points[0].x} ${points[0].y}`;
      for(let i=1;i<points.length-1;i++)d+=` Q ${points[i].x} ${points[i].y}, ${(points[i].x+points[i+1].x)/2} ${(points[i].y+points[i+1].y)/2}`;
      return d+` L ${points.at(-1).x} ${points.at(-1).y}`;
    };
    const edge=smooth(left)+` L ${notch.x} ${notch.y} `+smooth(right.reverse(),'L')+' Z';
    for(const svg of this.visuals) {
      svg.querySelector('.ribbon-edge').setAttribute('d',edge);
      svg.querySelector('.ribbon-silk').setAttribute('d',smooth(left));
      svg.querySelector('.ribbon-shadow').setAttribute('d',path(true));
    }
    this.handle.style.left=(end.x-22)+'px';this.handle.style.top=(end.y-22)+'px';
    this.handle.dataset.x=end.x.toFixed(2);this.handle.dataset.y=end.y.toFixed(2);this.updateHandle();
  }
};
