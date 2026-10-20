/* A developable sheet: a diagonal cylindrical bend travels from the held
   corner toward the binding. Flat paper stays flat until the bend reaches it.
   Both faces retain live, cropped HTML; the sewn edge never moves. */
window.BoundPaper = class BoundPaper {
  constructor(host, frontContent, backContent, count=48) {
    this.host=host;this.count=count;
    this.bands=Array.from({length:count},()=>{
      const band=document.createElement('div');band.className='paper-band';
      const front=document.createElement('div'),back=document.createElement('div');
      front.className='paper-surface paper-front';back.className='paper-surface paper-back';
      front.append(frontContent.cloneNode(true));back.append(backContent.cloneNode(true));
      band.append(front,back);host.append(band);return {band,front,back};
    });
  }
  setContent(frontContent,backContent) {
    this.lastRender=null;
    for(const {front,back} of this.bands){front.replaceChildren(frontContent.cloneNode(true));back.replaceChildren(backContent.cloneNode(true));}
  }
  shape(progress,width,height,flex=1,options={}) {
    const p=Math.max(0,Math.min(1,progress));
    const origin=options.origin===1?1:0,sign=origin?-1:1,t=origin?1-p:p;
    // A steeper pull makes a more diagonal fold. Its angle relaxes as the
    // paper approaches the opposite stack, keeping every binding point fixed.
    const skew=options.skew??.46;
    const angle=skew*Math.pow(1-t,.85),nx=Math.cos(angle),ny=Math.sin(angle)*(options.corner==='top'?-1:1);
    const edgeY=options.corner==='top'?0:height;
    const radius=width*.18*Math.sin(Math.PI*t)*Math.max(.55,Math.min(1.3,flex));
    const crease=Math.max(0,nx*width-width*t/nx-Math.PI*radius/2);
    return {p,t,origin,sign,width,height,nx,ny,edgeY,radius,crease,flat:p===0||p===1||flex===0};
  }
  bend(d,s) {
    if(d<=0)return {f:d,z:0};
    const arc=Math.PI*s.radius;
    if(d>=arc)return {f:arc-d,z:2*s.radius};
    const angle=d/s.radius;
    return {f:s.radius*Math.sin(angle),z:s.radius*(1-Math.cos(angle))};
  }
  point(x,y,s) {
    if(s.flat)return {x:(s.p>.5?-1:1)*x,y,z:2};
    const d=s.nx*x+s.ny*(y-s.edgeY)-s.crease,b=this.bend(d,s);
    return {x:s.sign*(x+s.nx*(b.f-d)),y:y+s.ny*(b.f-d),z:2+b.z};
  }
  corner(progress,width,height,options={}) {const s=this.shape(progress,width,height,1,options);return this.point(width,s.edgeY,s);}
  clip(polygon,nx,ny,bound,above) {
    const result=[];
    for(let i=0;i<polygon.length;i++) {
      const a=polygon[i],b=polygon[(i+1)%polygon.length];
      const da=nx*a.x+ny*a.y-bound,db=nx*b.x+ny*b.y-bound;
      const inside=above?da>=0:da<=0,next=above?db>=0:db<=0;
      if(inside)result.push(a);
      if(inside!==next){const t=da/(da-db);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
    }
    return result;
  }
  render(progress,width,height,flex=1,options={}) {
    const signature=`${progress},${width},${height},${flex},${options.origin},${options.skew},${options.corner}`;
    if(signature===this.lastRender)return;
    this.lastRender=signature;
    const s=this.shape(progress,width,height,flex,options),{nx,ny,sign}=s;
    this.currentShape=s;
    const rectangle=[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}];
    const offset=ny*s.edgeY+s.crease,min=-Math.abs(ny)*height-s.crease,max=nx*width-s.crease;
    const cuts=s.flat?[0,1]:[min,0,...Array.from({length:this.count-2},(_,i)=>Math.PI*s.radius*(i+1)/(this.count-2)),max].filter(d=>d>=min&&d<=max).sort((a,b)=>a-b);
    let used=0;
    for(let i=0;i<cuts.length-1;i++) {
      const lo=cuts[i],hi=cuts[i+1];if(hi-lo<.00001)continue;
      let polygon=rectangle;
      let matrix,shade=0;
      if(s.flat) {
        const side=s.p>.5?-1:1;
        matrix=[side,0,0,0,0,1,0,0,0,0,side,0,0,0,2,1];
      } else {
        polygon=this.clip(polygon,nx,ny,lo+offset-.10,true);
        polygon=this.clip(polygon,nx,ny,hi+offset+.10,false);
        if(polygon.length<3)continue;
        const a=this.bend(lo,s),b=this.bend(hi,s),span=hi-lo;
        const ca=(b.f-a.f)/span,sa=(b.z-a.z)/span,length=Math.hypot(ca,sa);
        const ax=1+(ca-1)*nx*nx,ay=(ca-1)*nx*ny,by=1+(ca-1)*ny*ny;
        const shift=a.f-ca*lo-(ca-1)*offset;
        matrix=[sign*ax,ay,sa*nx,0,sign*ay,by,sa*ny,0,-sa*nx/length,-sign*sa*ny/length,sign*ca/length,0,sign*nx*shift,ny*shift,2+a.z-sa*(lo+offset),1];
        // The inside of the roll darkens; the upturned face catches light.
        shade=.015+.17*Math.abs(sa)+.09*(1-Math.abs(ca));
      }
      const {band,front,back}=this.bands[used++];
      band.style.display='';band.style.transform=`matrix3d(${matrix.join(',')})`;
      for(const [face,reverse] of [[front,false],[back,true]]) {
        const poly=polygon.map(p=>({x:reverse?width-p.x:p.x,y:p.y}));
        const left=Math.min(...poly.map(p=>p.x)),top=Math.min(...poly.map(p=>p.y));
        const right=Math.max(...poly.map(p=>p.x)),bottom=Math.max(...poly.map(p=>p.y));
        Object.assign(face.style,{inset:'auto',left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px',transformOrigin:`${width/2-left}px ${height/2-top}px`,overflow:'hidden',clipPath:s.flat?'none':`polygon(${poly.map(p=>`${p.x-left}px ${p.y-top}px`).join(',')})`,backgroundSize:`${width}px ${height}px, 180px 180px`,backgroundPosition:`${-left}px ${-top}px, ${-left}px ${-top}px`});
        const ink=face.firstElementChild;
        if(ink)Object.assign(ink.style,{position:'absolute',width:width+'px',height:height+'px',left:-left+'px',top:-top+'px',padding:ink.classList.contains('page-snapshot')?'0':`${width*.41}px ${width*.16}px ${width*.27}px`});
        face.style.setProperty('--fold-shade',(shade*(reverse?.8:1)).toFixed(3));
      }
    }
    for(let i=used;i<this.bands.length;i++)this.bands[i].band.style.display='none';
  }
  shadowPolygon() {
    const s=this.currentShape;if(!s||s.flat)return [];
    const result=[];
    for(let edge=0;edge<4;edge++)for(let i=0;i<=20;i++) {
      const t=i/20,x=edge===0?s.width*t:edge===1?s.width:edge===2?s.width*(1-t):0;
      const y=edge===0?0:edge===1?s.height*t:edge===2?s.height: s.height*(1-t);
      const p=this.point(x,y,s);result.push({x:p.x+p.z*.12,y:p.y+p.z*.18});
    }
    return result;
  }
};
