/* One drawing surface for the entire turning spread. No per-strip DOM
   clipping, layer resizing, or compositor sorting is involved in a turn.
   The actual HTML remains the reading/accessibility surface at rest. */
window.BookTurnRenderer = class BookTurnRenderer {
  constructor(rig, dialog, paper, bookmark) {
    this.rig=rig;this.dialog=dialog;this.paper=paper;this.bookmark=bookmark;this.cache=new Map();this.epoch=0;
    this.canvas=document.createElement('canvas');this.canvas.className='turn-canvas';
    this.canvas.setAttribute('aria-hidden','true');rig.append(this.canvas);
    const gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false});
    this.gl=gl;this.available=!!gl;
    if(!gl)return;
    try {this.initialize();} catch(error) {
      this.available=false;console.warn('Page drawing unavailable; using immediate page changes.',error);
    }
  }
  initialize() {
    const gl=this.gl;
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    this.program=gl.createProgram();
    gl.attachShader(this.program,shader(gl.VERTEX_SHADER,`
      attribute vec3 aPosition;
      attribute vec2 aUV;
      attribute float aShade;
      uniform vec3 uCamera;
      uniform vec4 uBounds;
      varying vec2 vUV;
      varying float vShade;
      varying vec2 vLocal;
      void main() {
        // Intersect the camera ray with the canvas's plane. CSS then projects
        // that plane through the same camera: the paper keeps its real depth.
        float w=(uCamera.z-aPosition.z)/(uCamera.z-6.0);
        vec2 p=uCamera.xy+(aPosition.xy-uCamera.xy)/w;
        vec2 clip=(p-uBounds.xy)/uBounds.zw*2.0-1.0;
        gl_Position=vec4(clip.x*w,-clip.y*w,(.5-aPosition.z/500.0)*w,w);
        vUV=aUV;vShade=aShade;vLocal=aPosition.xy;
      }`));
    gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,`
      precision mediump float;
      uniform sampler2D uFront;
      uniform sampler2D uBack;
      uniform float uShadow;
      uniform vec3 uPaperBounds;
      varying vec2 vUV;
      varying float vShade;
      varying vec2 vLocal;
      void main() {
        if(uShadow>0.0) {
          if(vLocal.x<uPaperBounds.x||vLocal.x>uPaperBounds.y||vLocal.y<0.0||vLocal.y>uPaperBounds.z)discard;
          gl_FragColor=vec4(vec3(.22,.19,.12)*uShadow,uShadow);return;
        }
        vec4 ink=gl_FrontFacing?texture2D(uFront,vUV):texture2D(uBack,vec2(1.0-vUV.x,vUV.y));
        ink.rgb*=1.0-vShade;
        gl_FragColor=ink;
      }`));
    gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    for(const [name,size,offset] of [['aPosition',3,0],['aUV',2,12],['aShade',1,20]]) {
      const at=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,24,offset);
    }
    this.cameraUniform=gl.getUniformLocation(this.program,'uCamera');this.boundsUniform=gl.getUniformLocation(this.program,'uBounds');
    this.shadowUniform=gl.getUniformLocation(this.program,'uShadow');this.paperBoundsUniform=gl.getUniformLocation(this.program,'uPaperBounds');
    gl.uniform1i(gl.getUniformLocation(this.program,'uFront'),0);gl.uniform1i(gl.getUniformLocation(this.program,'uBack'),1);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
    this.canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();this.available=false;this.hide();this.onFailure?.();
    });
    // A failed GPU must never expose a bare board or leave controls locked.
    // Subsequent turns use the same finite reader without motion.
  }
  key(page,side) {return `${side}:${page.kind||'passage'}:${page.index??''}`;}
  plan(reader,direction,position=reader.position) {
    const to=reader.destination(direction,position);if(to===null)return null;
    const before=reader.spread(position),after=reader.spread(to);
    return {left:[direction>0?before[0]:after[0],'left'],right:[direction>0?after[1]:before[1],'right'],
      front:[direction>0?before[1]:after[1],'right'],back:[direction>0?after[0]:before[0],'left']};
  }
  needed(reader,position=reader.position) {
    const needed=new Map();
    for(const direction of [-1,1]) {
      const plan=this.plan(reader,direction,position);
      if(plan)for(const [page,side] of Object.values(plan))needed.set(this.key(page,side),[page,side]);
    }
    return needed;
  }
  layoutKey(reader,g) {return `${reader.book.id}:${g.width}:${g.height}:${g.vw}:${g.vh}:${devicePixelRatio}`;}
  ready(reader,g) {return this.layout===this.layoutKey(reader,g)&&[...this.needed(reader).keys()].every(key=>this.cache.get(key)?.texture);}
  ensure(reader,page,side,g) {
    const key=this.key(page,side),layout=this.layout;
    if(!this.cache.has(key)) {
      const record={};this.cache.set(key,record);
      record.promise=this.capture(reader,page,side,g).then(image=>{
        if(layout!==this.layout || this.cache.get(key)!==record || !this.available)return null;
        return record.texture=this.texture(image);
      });
    }
    const record=this.cache.get(key);this.cache.delete(key);this.cache.set(key,record);
    return record.promise;
  }
  trim() {
    for(const [key,record] of this.cache) {
      if(this.cache.size<=16)break;
      if(this.protected?.has(key)||Object.values(this.textures||{}).includes(record.texture))continue;
      if(record.texture)this.gl.deleteTexture(record.texture);this.cache.delete(key);
    }
  }
  ahead(reader,g,epoch) {
    const future=new Map();
    for(const direction of [-1,1]) {
      const position=reader.destination(direction);
      if(position!==null)for(const [key,value] of this.needed(reader,position))if(!this.cache.has(key))future.set(key,value);
    }
    const jobs=[...future.values()];
    const schedule=()=>{
      if(!jobs.length||epoch!==this.epoch||!this.available)return;
      const run=()=>{
        if(epoch!==this.epoch||!this.available)return;
        // Prepare one future page at a time while the reader is at rest.
        if(this.active)return; // Landing schedules a fresh look-ahead pass.
        const [page,side]=jobs.shift();
        this.ensure(reader,page,side,g).then(()=>{this.trim();schedule();}).catch(()=>{});
      };
      if(window.requestIdleCallback)requestIdleCallback(run,{timeout:500});else setTimeout(run,40);
    };
    schedule();
  }
  async warm(reader,g) {
    if(!this.available)return;
    const epoch=++this.epoch,layout=this.layoutKey(reader,g);
    if(layout!==this.layout) {this.clear();this.layout=layout;}
    this.g=g;
    const needed=this.needed(reader);this.protected=new Set(needed.keys());
    const promises=[...needed.values()].map(([page,side])=>this.ensure(reader,page,side,g));
    try {await Promise.all(promises);} catch(error) {this.available=false;console.warn('Page drawing unavailable; using immediate page changes.',error);}
    if(epoch!==this.epoch)return;
    this.trim();this.ahead(reader,g,epoch);
  }
  clear() {
    for(const record of this.cache.values())if(record.texture)this.gl.deleteTexture(record.texture);this.cache.clear();
    if(this.ribbonTexture)this.gl.deleteTexture(this.ribbonTexture);
    this.ribbonTexture=null;this.ribbonDrawing=null;
  }
  async capture(reader,page,side,g) {
    // Measure in the same local styles, then freeze every computed property.
    // Embedded SVG contains no external styles, fonts, images, or scripts.
    const stage=reader.measure.cloneNode(false);stage.style.visibility='hidden';
    const surface=document.createElement('div');surface.className=side==='left'?'left-reading':'right-page';
    Object.assign(surface.style,{position:'relative',inset:'auto',left:'0',top:'0',width:g.width+'px',height:g.height+'px',transform:'none',visibility:'visible',boxShadow:'none'});
    surface.append(reader.content(page));stage.append(surface);document.body.append(stage);
    const copyStyle=(from,to,pseudo)=>{
      const style=getComputedStyle(from,pseudo);
      for(const property of style)to.style.setProperty(property,style.getPropertyValue(property));
      to.style.setProperty('visibility','visible');to.style.setProperty('animation','none');to.style.setProperty('transition','none');
      return style;
    };
    const freeze=from=>{
      const to=from.cloneNode(false);copyStyle(from,to);
      for(const pseudo of ['::before',null,'::after']) {
        if(!pseudo){for(const node of from.childNodes)to.append(node.nodeType===1?freeze(node):node.cloneNode(true));continue;}
        const style=getComputedStyle(from,pseudo),content=style.content;
        if(!content||content==='none'||content==='normal')continue;
        const generated=document.createElement('span');copyStyle(from,generated,pseudo);generated.style.content='normal';
        try {generated.textContent=JSON.parse(content);}catch{generated.textContent=content.replace(/^['"]|['"]$/g,'');}
        to.append(generated);
      }
      return to;
    };
    const frozen=freeze(surface);stage.remove();frozen.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
    frozen.style.contain='none';frozen.style.willChange='auto';
    const ratio=2,w=Math.ceil(g.width*ratio),h=Math.ceil(g.height*ratio);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${g.width} ${g.height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(frozen)}</foreignObject></svg>`;
    const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    await image.decode();return image;
  }
  texture(image) {
    const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    // SVG foreignObject is first painted into a bitmap. WebGL intentionally
    // refuses an SVG source on some engines even when it is self-contained.
    const bitmap=document.createElement('canvas');bitmap.width=image.width;bitmap.height=image.height;
    bitmap.getContext('2d').drawImage(image,0,0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);return t;
  }
  begin(reader,direction,g) {
    const plan=this.plan(reader,direction);if(!this.available||!plan)return false;
    const textures={};
    for(const [name,[page,side]] of Object.entries(plan)) {
      const t=this.cache.get(this.key(page,side))?.texture;if(!t)return false;textures[name]=t;
    }
    this.textures=textures;this.g=g;this.active=true;
    // Include loose cloth beyond the paper, keeping these bounds fixed for
    // the entire gesture just like the sheet's drawing surface.
    const cloth=this.bookmark?.drawing()?.bounds;
    const x=Math.min(-g.width*1.4,cloth?cloth[0]-12:Infinity),y=Math.min(-g.height*.3,cloth?cloth[1]-12:Infinity);
    const width=Math.max(g.width*1.4,cloth?cloth[0]+cloth[2]+12:-Infinity)-x;
    const height=Math.max(g.height*1.3,cloth?cloth[1]+cloth[3]+12:-Infinity)-y;
    this.bounds=[x,y,width,height];
    const ratio=2;
    if(this.canvas.width!==Math.ceil(width*ratio))this.canvas.width=Math.ceil(width*ratio);
    if(this.canvas.height!==Math.ceil(height*ratio))this.canvas.height=Math.ceil(height*ratio);
    Object.assign(this.canvas.style,{left:this.bounds[0]+'px',top:this.bounds[1]+'px',width:width+'px',height:height+'px'});
    const inverse=new DOMMatrixReadOnly(getComputedStyle(this.rig).transform).inverse();
    const camera=inverse.transformPoint(new DOMPoint(g.vw/2-g.openLeft,g.vh/2-g.top-g.height/2,2600));
    this.camera=[camera.x,camera.y+g.height/2,camera.z];
    return true;
  }
  hide() {this.active=false;delete this.dialog.dataset.paperRenderer;}
  draw(vertices,front,back=front) {
    const gl=this.gl;
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,front);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,back);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/6);
  }
  drawRibbon() {
    const drawing=this.bookmark?.drawing();if(!drawing)return;
    const gl=this.gl;
    if(drawing!==this.ribbonDrawing) {
      if(this.ribbonTexture)gl.deleteTexture(this.ribbonTexture);
      this.ribbonTexture=this.texture(drawing.canvas);this.ribbonDrawing=drawing;
    }
    const [x,y,w,h]=drawing.bounds;
    const v=(x,y,u,v)=>[x,y,9,u,v,0];
    // Match the resting cloth plane. The page mesh's depth, rather than
    // the canvas rectangle, decides which pieces of cloth it covers.
    const vertices=[...v(x,y,0,0),...v(x,y+h,0,1),...v(x+w,y,1,0),...v(x+w,y,1,0),...v(x,y+h,0,1),...v(x+w,y+h,1,1)];
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    this.draw(vertices,this.ribbonTexture);
    gl.depthMask(true);gl.disable(gl.BLEND);
  }
  render(progress,flex,options) {
    if(!this.active||!this.available)return;
    const gl=this.gl,{width:w,height:h}=this.g;
    gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(this.cameraUniform,this.camera);gl.uniform4fv(this.boundsUniform,this.bounds);
    gl.uniform1f(this.shadowUniform,0);
    const quad=(left,right,z=0,yaw=0)=>{
      const v=(x,y,u,v)=>[x*Math.cos(yaw),y,z-x*Math.sin(yaw),u,v,0];
      return [...v(left,0,0,0),...v(left,h,0,1),...v(right,0,1,0),...v(right,0,1,0),...v(left,h,0,1),...v(right,h,1,1)];
    };
    if(!this.g.mobile)this.draw(quad(-w,0,1),this.textures.left);
    this.draw(quad(0,w,0,.8*Math.PI/180),this.textures.right);
    const s=this.paper.shape(progress,w,h,flex,options);this.paper.currentShape=s;
    // Clip along the *material* fold coordinates. Adjacent polygons share
    // exact edges, so the GPU rasterizes a watertight sheet, including its
    // flat regions, in the same framebuffer as the underlying spread.
    const offset=s.ny*s.edgeY+s.crease,min=-Math.abs(s.ny)*h-s.crease,max=s.nx*w-s.crease;
    const cuts=s.flat?[0,1]:[min,0,...Array.from({length:64},(_,i)=>Math.PI*s.radius*(i+1)/64),max].filter(d=>d>=min&&d<=max).sort((a,b)=>a-b);
    const vertices=[],rectangle=[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
    for(let i=0;i<cuts.length-1;i++) {
      const lo=cuts[i],hi=cuts[i+1];if(hi-lo<.00001)continue;
      let polygon=rectangle;
      if(!s.flat){polygon=this.paper.clip(polygon,s.nx,s.ny,lo+offset,true);polygon=this.paper.clip(polygon,s.nx,s.ny,hi+offset,false);}
      const vertex=p=>{
        const q=this.paper.point(p.x,p.y,s),d=s.nx*p.x+s.ny*(p.y-s.edgeY)-s.crease;
        const angle=s.flat?0:Math.max(0,Math.min(Math.PI,d/Math.max(.00001,s.radius)));
        const shade=.16*Math.sin(angle)+.05*(1-Math.abs(Math.cos(angle)));
        return [q.x,q.y,q.z+3,p.x/w,p.y/h,shade];
      };
      for(let j=1;j<polygon.length-1;j++)vertices.push(...vertex(polygon[0]),...vertex(polygon[j+1]),...vertex(polygon[j]));
    }
    if(!s.flat) {
      gl.uniform3f(this.paperBoundsUniform,this.g.mobile?0:-w,w,h);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      // A soft contact shadow is drawn into the same surface as the paper.
      for(const spread of [-2,0,2]) {
        const shadow=[];
        for(let i=0;i<vertices.length;i+=6) {
          const [x,y,z,u,v]=vertices.slice(i,i+5);
          shadow.push(x+z*.12+spread,y+z*.18+spread,2,u,v,0);
        }
        gl.uniform1f(this.shadowUniform,.035*Math.sin(Math.PI*progress));
        this.draw(shadow,this.textures.front);
      }
      gl.disable(gl.BLEND);gl.depthMask(true);gl.uniform1f(this.shadowUniform,0);
    }
    this.draw(vertices,this.textures.front,this.textures.back);
    this.drawRibbon();
    this.dialog.dataset.paperRenderer='canvas';
    this.canvas.dataset.progress=String(progress);
  }
};
