import * as T from 'three';

type V3=[number,number,number];
type Pose={eye:V3;look:V3};
type Batch={geometry:T.BufferGeometry;material:T.Material;matrices:T.Matrix4[];colours:T.Color[]};

/** A locally authored listening place; no renderer, network service or animation loop. */
export function createFutureDadsPlace(onDirty?:()=>void){
  const scene=new T.Scene();scene.name='Future Dads Club · listening place';
  scene.background=new T.Color(0xece3d3);scene.fog=new T.Fog(0xece3d3,65,165);
  scene.userData.artwork={credit:'Logo by @adnanmakes',source:'/mapthewild/world/connected/future-dads-cover.jpg'};
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
  const batches=new Map<string,Batch>(),architecture=new T.Group();architecture.name='Paper, timber and orange cloth';scene.add(architecture);
  let disposed=false,seed=20190307,artworkReady=false,artworkError:string|null=null;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const between=(a:number,b:number)=>a+(b-a)*random();
  const geo=<G extends T.BufferGeometry>(g:G):G=>{geometries.add(g);return g;};
  const mat=<M extends T.Material>(m:M):M=>{materials.add(m);return m;};
  const texture=<X extends T.Texture>(t:X):X=>{textures.add(t);return t;};

  // Fine material grain is procedural code, not replacement artwork or scenery.
  function grain(kind:'paper'|'wood'|'cloth'){
    const size=128,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const fibre=kind==='wood'?Math.sin(x*.57+Math.sin(y*.06)*2)*13+Math.sin(x*.13)*6:kind==='cloth'?((x%3===0?7:-2)+(y%3===0?7:-2)):Math.sin(y*.14+x*.03)*3;
      const value=Math.round(237+fibre+between(-9,9)),i=(y*size+x)*4;
      data[i]=data[i+1]=data[i+2]=T.MathUtils.clamp(value,0,255);data[i+3]=255;
    }
    const t=texture(new T.DataTexture(data,size,size));t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;
    t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
  }
  const paperMap=grain('paper'),woodMap=grain('wood'),clothMap=grain('cloth');
  const painted=(color:number,map:T.Texture,roughness=.92)=>mat(new T.MeshStandardMaterial({color,map,bumpMap:map,bumpScale:.011,roughness}));
  // Colours are the existing site's cover-derived tokens.
  const paper=painted(0xf6f4ee,paperMap),card=painted(0xfffdf8,paperMap),orange=painted(0xdf995f,clothMap),rust=painted(0xb76b3b,clothMap);
  const timber=painted(0x8c6749,woodMap,.78),lightWood=painted(0xc6a77f,woodMap,.83),ink=painted(0x3b2a1d,woodMap,.84),sand=painted(0xd9c6a7,paperMap);
  const cloth=painted(0xe5dbc8,clothMap),brownCloth=painted(0x8b715b,clothMap),rubber=mat(new T.MeshStandardMaterial({color:0x332d28,roughness:.84}));
  const brass=mat(new T.MeshStandardMaterial({color:0xa88650,metalness:.65,roughness:.36}));
  const ground=painted(0xb38c66,paperMap),rock=painted(0xa47b59,paperMap),paleRock=painted(0xc7a885,paperMap);
  const leaf=mat(new T.MeshStandardMaterial({color:0x7d805b,roughness:.96,side:T.DoubleSide}));
  const cube=geo(new T.BoxGeometry(1,1,1)),cylinder=geo(new T.CylinderGeometry(1,1,1,24)),thinCylinder=geo(new T.CylinderGeometry(1,1,1,10));
  const sphere=geo(new T.SphereGeometry(1,16,10)),torus=geo(new T.TorusGeometry(1,.035,8,48));
  const outlineRing=geo(new T.TorusGeometry(1,.009,6,64));
  // Three reusable eroded stone shapes: broad shoulders and worn faces, with
  // continuous normals. Deterministic spatial ripples avoid both boxes and balls.
  const wornStone=Array.from({length:3},(_,variant)=>{
    const g=geo(new T.SphereGeometry(1,18,12)),positions=g.getAttribute('position');
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),phase=variant*1.71;
      const wear=.97+Math.sin(x*5+z*3+phase)*.075+Math.sin(z*7-y*2+phase)*.045;
      const px=Math.sign(x)*Math.pow(Math.abs(x),.76)*wear;
      const pz=Math.sign(z)*Math.pow(Math.abs(z),.73)*(1+Math.sin(x*4+y*3+phase)*.07);
      const py=Math.max(-.73,Math.min(.84,Math.sign(y)*Math.pow(Math.abs(y),.64)+Math.sin(x*4+z*5+phase)*.065));
      positions.setXYZ(i,px,py,pz);
    }
    positions.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
  });
  const leafShape=new T.Shape();leafShape.moveTo(0,-.5);leafShape.quadraticCurveTo(.32,-.05,0,.5);leafShape.quadraticCurveTo(-.32,-.05,0,-.5);
  const leafGeo=geo(new T.ShapeGeometry(leafShape,4));
  const up=new T.Vector3(0,1,0),white=new T.Color(0xffffff);
  function put(g:T.BufferGeometry,m:T.Material,p:V3,s:V3,r:V3=[0,0,0],tone=1){
    const key=g.uuid+'/'+m.uuid;let b=batches.get(key);if(!b){b={geometry:g,material:m,matrices:[],colours:[]};batches.set(key,b);}
    b.matrices.push(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...r)),new T.Vector3(...s)));
    b.colours.push(white.clone().multiplyScalar(tone));
  }
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,r:V3=[0,0,0],tone=1)=>put(cube,m,[x,y,z],[w,h,d],r,tone);
  function rod(a:V3,b:V3,r:number,m:T.Material){
    const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),rot=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(up,delta.clone().normalize()));
    put(thinCylinder,m,av.add(bv).multiplyScalar(.5).toArray() as V3,[r,delta.length(),r],[rot.x,rot.y,rot.z]);
  }
  function mesh(g:T.BufferGeometry,m:T.Material,p:V3,s:V3=[1,1,1],r:V3=[0,0,0],parent:T.Object3D=scene){
    const o=new T.Mesh(g,m);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  function line(points:V3[],radius:number,m:T.Material,parent:T.Object3D=scene){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(geo(new T.TubeGeometry(curve,Math.max(10,points.length*5),radius,6,false)),m,[0,0,0],[1,1,1],[0,0,0],parent);
  }

  // A rounded timber floor opens directly onto a dry planted forecourt. The
  // room is at human scale; its paper-like shell has real depth and openings.
  put(cylinder,timber,[0,-.06,0],[5.6,.23,5.3]);
  for(let x=-5.35;x<5.45;x+=.31){
    const length=Math.sqrt(Math.max(0,1-x*x/(5.5*5.5)))*10.35;
    if(length>.1)box(x,.069,0,.294,.055,length,lightWood,[0,0,0],between(.86,1.08));
  }
  put(outlineRing,ink,[0,.08,0],[5.53,5.23,1],[Math.PI/2,0,0]);
  box(0,-.09,6.2,2.5,.16,2.4,timber);box(0,.005,6.2,2.44,.06,2.4,lightWood);
  for(let z=5.12;z<7.4;z+=.29)box(0,.046,z,2.4,.024,.018,ink);
  // Curving rear shell: low window sill, high clerestory, then alternate full
  // panels and open views through to the ochre landscape.
  const segments=28,start=Math.PI+.04,end=Math.PI*2-.04;
  for(let i=0;i<segments;i++){
    const a=start+(i+.5)*(end-start)/segments,x=5.18*Math.cos(a),z=4.83*Math.sin(a),yaw=-a-Math.PI/2,w=.6;
    const window=i>=3&&i<=9;
    if(window){
      box(x,.47,z,w,.8,.14,paper,[0,yaw,0]);box(x,3.04,z,w,.5,.14,paper,[0,yaw,0]);
      box(x,.9,z,.65,.07,.28,timber,[0,yaw,0]);
    }else box(x,1.68,z,w,3.23,.14,paper,[0,yaw,0]);
    box(x,.21,z,w,.25,.19,timber,[0,yaw,0]);
    rod([x,.09,z],[x,3.33,z],.025,ink);
    if(!window&&i%3===1){
      box(x*.975,1.87,z*.975,.43,1.93,.075,orange,[0,yaw,0],between(.94,1.06));
      for(let y=1.03;y<2.8;y+=.145)box(x*.966,y,z*.966,.41,.01,.024,rust,[0,yaw,0]);
    }
  }
  // A folded radial canopy leaves the centre open to daylight. Panels are
  // geometry, with a thin stitched rim and dark pencil-like timber ribs.
  const roofPos:number[]=[],roofUV:number[]=[];
  const roofPoint=(a:number,r:number,y:number):V3=>[Math.cos(a)*r,y,Math.sin(a)*r*.94];
  for(let i=0;i<36;i++){
    const a=i*Math.PI*2/36+.008,b=(i+1)*Math.PI*2/36-.008;
    const p=[roofPoint(a,5.52,3.34),roofPoint(b,5.52,3.34),roofPoint(a,1.24,4.02),roofPoint(b,1.24,4.02)];
    for(const n of [0,2,1,1,2,3])roofPos.push(...p[n]);
    roofUV.push(0,0,0,1,1,0,1,0,0,1,1,1);
    if(i%2===0)rod(p[0],p[2],.029,timber);
  }
  const roofGeo=geo(new T.BufferGeometry());roofGeo.setAttribute('position',new T.Float32BufferAttribute(roofPos,3));roofGeo.setAttribute('uv',new T.Float32BufferAttribute(roofUV,2));roofGeo.computeVertexNormals();
  const roofMaterial=mat(paper.clone());roofMaterial.side=T.DoubleSide;mesh(roofGeo,roofMaterial,[0,0,0]);
  put(outlineRing,timber,[0,3.33,0],[5.53,5.2,1],[Math.PI/2,0,0]);put(torus,timber,[0,4.02,0],[1.25,1.175,.7],[Math.PI/2,0,0]);
  for(const x of [-5.15,5.15]){rod([x,.1,.3],[x,3.35,.3],.065,timber);rod([x,2.65,.3],[x*.84,3.35,1.38],.038,timber);}

  // A woven conversation rug gives the seats a shared centre without a stage.
  put(cylinder,cloth,[-.35,.108,.1],[2.8,.025,2.38]);
  for(let i=0;i<8;i++)put(torus,i%2?rust:brownCloth,[-.35,.123,.1],[2.6-i*.09,2.2-i*.076,.18],[Math.PI/2,0,0]);
  for(let i=0;i<38;i++){
    const a=i*Math.PI*2/38;rod([-.35+Math.cos(a)*2.72,.12,.1+Math.sin(a)*2.3],[-.35+Math.cos(a)*2.9,.12,.1+Math.sin(a)*2.46],.012,cloth);
  }

  // Chairs face one another. Bent arms, woven backs and loose cushions carry
  // the cover's drawn, tactile character without inventing people in the room.
  function chair(x:number,z:number,yaw:number,seatMaterial:T.Material,rocking=false){
    const p=(u:number,v:number,w:number):V3=>[x+u*Math.cos(yaw)+w*Math.sin(yaw),v,z-u*Math.sin(yaw)+w*Math.cos(yaw)];
    const b=(u:number,v:number,w:number,sx:number,sy:number,sz:number,m:T.Material,tilt=0)=>put(cube,m,p(u,v,w),[sx,sy,sz],[tilt,yaw,0]);
    b(0,.47,0,.89,.11,.79,timber);b(0,.565,.025,.83,.16,.73,seatMaterial);
    b(0,.95,-.34,.81,.66,.1,seatMaterial,-.15);
    for(const side of [-1,1]){
      rod(p(side*.44,.45,.3),p(side*.44,.94,.27),.033,timber);
      rod(p(side*.44,.43,-.31),p(side*.44,1.36,-.43),.034,timber);
      rod(p(side*.44,.92,.33),p(side*.44,1,-.39),.048,lightWood);
      if(rocking){
        line([p(side*.43,.2,.67),p(side*.43,.105,.38),p(side*.43,.08,0),p(side*.43,.12,-.48),p(side*.43,.24,-.78)],.04,timber,architecture);
        rod(p(side*.4,.12,.29),p(side*.39,.49,.28),.038,timber);rod(p(side*.4,.14,-.4),p(side*.39,.49,-.31),.038,timber);
      }else for(const w of [-.29,.28])rod(p(side*.36,.08,w*1.25),p(side*.36,.47,w),.034,timber);
    }
    rod(p(-.44,1.35,-.43),p(.44,1.35,-.43),.045,timber);
    for(let u=-.32;u<=.33;u+=.08)rod(p(u,.64,-.375),p(u,1.27,-.46),.012,lightWood);
    for(let v=.68;v<1.28;v+=.09)rod(p(-.36,v,-.42),p(.36,v,-.42),.012,lightWood);
  }
  chair(-2.5,.1,.91,orange,true);chair(1.82,.52,-.72,cloth);chair(-.65,-2.25,.04,rust);
  // A folded blanket rests on the rocking chair; it is an object, not a person.
  box(-2.22,.7,.18,.44,.11,.58,cloth,[.08,.91,.06]);
  for(let i=0;i<7;i++)box(-2.2+i*.035,.76,.2,.015,.017,.52,rust,[0,.91,0]);

  // Low conversation table, ceramic cups and a real tabletop microphone.
  put(cylinder,lightWood,[-.25,.53,.05],[.95,.13,.77]);
  for(const a of [.1,2.2,4.3])rod([-.25+Math.cos(a)*.54,.14,.05+Math.sin(a)*.48],[-.25+Math.cos(a)*.59,.48,.05+Math.sin(a)*.52],.045,timber);
  function cup(x:number,y:number,z:number){
    put(cylinder,card,[x,y+.075,z],[.075,.15,.075]);put(cylinder,ink,[x,y+.152,z],[.058,.004,.058]);put(torus,card,[x+.085,y+.08,z],[.052,.065,.052],[0,Math.PI/2,0]);
  }
  cup(-.75,.6,.23);cup(.29,.6,-.12);
  const mic=new T.Group();mic.name='Table microphone';scene.add(mic);
  mesh(cylinder,rubber,[-.18,.625,-.15],[.13,.035,.13],[0,0,0],mic);
  mesh(thinCylinder,brass,[-.18,.77,-.15],[.018,.28,.018],[0,0,0],mic);
  mesh(sphere,rubber,[-.18,.96,-.15],[.07,.12,.07],[0,0,0],mic);
  for(let y=.89;y<1.055;y+=.023)mesh(torus,brass,[-.18,y,-.15],[.063,.063,.18],[Math.PI/2,0,0],mic);
  line([[-.18,.64,-.15],[-.23,.61,-.31],[.12,.6,-.43],[.54,.6,-.36],[.68,.3,-.45],[.88,.12,-.8]],.009,rubber,architecture);

  // A timber listening console is the tangible entry to the genuine episode
  // player. This group is intentionally separate for the caller's hit testing.
  box(2.36,.84,-2.63,2.45,.14,.76,lightWood);box(2.36,.67,-2.64,2.28,.2,.66,timber);
  for(const x of [1.31,3.4])for(const z of [-2.92,-2.35])rod([x,.1,z],[x,.78,z],.04,timber);
  const listen=new T.Group();listen.name='Listen to Future Dads Club';listen.userData.action='listen';scene.add(listen);
  mesh(cube,timber,[1.88,1.155,-2.59],[1.15,.5,.45],[0,0,0],listen);
  mesh(cube,ink,[1.88,1.155,-2.348],[1.05,.4,.025],[0,0,0],listen);
  mesh(cylinder,brownCloth,[1.66,1.16,-2.325],[.155,.026,.155],[Math.PI/2,0,0],listen);
  mesh(torus,brass,[1.66,1.16,-2.304],[.16,.16,.65],[0,0,0],listen);
  for(let i=-5;i<=5;i++){
    const x=i*.022,h=Math.sqrt(Math.max(0,.143*.143-x*x))*2;
    mesh(cube,cloth,[1.66+x,1.16,-2.302],[.008,h,.009],[0,0,0],listen);
  }
  mesh(cube,paper,[2.11,1.22,-2.321],[.36,.105,.014],[0,0,0],listen);
  for(let i=0;i<13;i++)mesh(cube,ink,[1.957+i*.025,1.23,-2.31],[.004,i%3===0?.048:.025,.005],[0,0,0],listen);
  mesh(cylinder,brass,[2.12,1.055,-2.306],[.048,.03,.048],[Math.PI/2,0,0],listen);
  // Headphones have a padded arc, separate earcups and a loose connecting lead.
  line([[2.61,1.05,-2.51],[2.59,1.3,-2.54],[2.72,1.44,-2.56],[2.9,1.4,-2.55],[2.98,1.16,-2.52]],.029,rubber,listen);
  for(const x of [2.61,2.98])mesh(sphere,rubber,[x,1.06,-2.51],[.074,.105,.1],[0,0,0],listen);
  line([[2.61,.99,-2.5],[2.53,.93,-2.41],[2.37,.92,-2.32],[2.3,.94,-2.35],[2.35,1.03,-2.36]],.008,rubber,listen);
  // The listener's hand can reach the large front dial from the shelf view.
  listen.userData.label='Listen';listen.userData.credit='Logo by @adnanmakes';

  // The original image is mounted in full on a freestanding drawing easel.
  // Its native portrait proportion is preserved; the orange title band stays.
  const coverWidth=1.48,coverHeight=coverWidth*1200/1039,coverX=.18,coverZ=-3.58,coverY=1.68;
  box(coverX,coverY,coverZ,coverWidth+.16,coverHeight+.16,.075,ink);
  box(coverX,coverY,coverZ+.043,coverWidth+.065,coverHeight+.065,.018,card);
  const coverMaterial=mat(new T.MeshBasicMaterial({color:0xffffff,side:T.FrontSide,toneMapped:false}));
  const coverPlane=mesh(geo(new T.PlaneGeometry(coverWidth,coverHeight)),coverMaterial,[coverX,coverY,coverZ+.06]);coverPlane.name='Original cover · @adnanmakes';coverPlane.castShadow=false;
  const coverTexture=texture(new T.TextureLoader().load('/mapthewild/world/connected/future-dads-cover.jpg',loaded=>{
    if(disposed){loaded.dispose();return;}loaded.colorSpace=T.SRGBColorSpace;loaded.anisotropy=4;coverMaterial.map=loaded;coverMaterial.needsUpdate=true;artworkReady=true;onDirty?.();
  },undefined,()=>{if(disposed)return;artworkError='The original Future Dads Club cover could not be loaded.';onDirty?.();}));coverTexture.colorSpace=T.SRGBColorSpace;
  rod([coverX-.62,.1,coverZ+.14],[coverX-.46,2.9,coverZ-.05],.045,timber);
  rod([coverX+.62,.1,coverZ+.14],[coverX+.46,2.9,coverZ-.05],.045,timber);
  rod([coverX,.1,coverZ-.8],[coverX,2.45,coverZ-.09],.04,timber);
  box(coverX,.81,coverZ+.15,1.75,.08,.23,lightWood);
  // Ordinary text signage is drawn locally; the supplied illustration is never
  // redrawn. The same credit is exposed for accessible HTML in the parent UI.
  function sign(text:string,w:number,h:number,p:V3,fontSize=38){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#f6f4ee';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#3b2a1d';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${fontSize}px Georgia, serif`;ctx.fillText(text,512,80,980);
    const tex=texture(new T.CanvasTexture(canvas));tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    const material=mat(new T.MeshBasicMaterial({map:tex,side:T.FrontSide,toneMapped:false}));const o=mesh(geo(new T.PlaneGeometry(w,h)),material,p);o.castShadow=false;return o;
  }
  sign('Logo by @adnanmakes',1.3,.203,[coverX,.64,coverZ+.17],44);
  sign('Future Dads Club',2.08,.325,[1.75,2.73,-4.25],64);

  // A little carved lion rests beside the cover. It is visibly a wooden
  // object, echoing the source drawing without substituting for its figures.
  box(-1.53,.5,-3.23,.73,.06,.6,timber);for(const x of [-1.8,-1.26])rod([x,.11,-3.24],[x,.48,-3.24],.027,timber);
  put(sphere,lightWood,[-1.54,.69,-3.23],[.19,.12,.11]);
  for(const x of [-1.66,-1.42])for(const z of [-3.29,-3.17])put(thinCylinder,lightWood,[x,.59,z],[.028,.18,.028]);
  put(sphere,rust,[-1.39,.82,-3.2],[.12,.145,.1]);put(sphere,lightWood,[-1.35,.83,-3.135],[.078,.09,.066]);
  put(sphere,ink,[-1.35,.83,-3.071],[.017,.013,.012]);
  line([[-1.71,.71,-3.25],[-1.82,.77,-3.25],[-1.84,.84,-3.24]],.015,timber,architecture);

  // The same pavilion belongs to an asymmetric ochre headland. Its outline
  // and layered cliff remain legible from sea distance; there is no second
  // model standing in for the interior, and no round display plinth.
  const coastCount=80;
  const coast=(i:number,scale=1,y=-.16):V3=>{
    const a=i*Math.PI*2/coastCount,landingNotch=Math.exp(-Math.pow(Math.cos(a)/.16,2))*Math.max(0,Math.sin(a))*1.05;
    const r=15.8+1.25*Math.sin(a*3+.6)+.72*Math.cos(a*5-.5)+.42*Math.sin(a*9)-landingNotch;
    return [Math.cos(a)*r*scale,y,(Math.sin(a)*r*.91-.4)*scale];
  };
  function surfaceGeometry(positions:number[],uvs:number[]){
    const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeVertexNormals();return g;
  }
  const headlandTop:number[]=[],headlandUV:number[]=[];
  for(let i=0;i<coastCount;i++)for(const p of [[0,-.16,0],coast(i+1),coast(i)] as V3[]){headlandTop.push(...p);headlandUV.push(p[0]*.18,p[2]*.18);}
  mesh(surfaceGeometry(headlandTop,headlandUV),ground,[0,0,0]).name='Future Dads headland';
  const strata:[number,number,number,number,T.Material][]=[
    [1,-.16,1.025,-.65,paleRock],[1.025,-.65,1.055,-1.21,rock],[1.055,-1.21,1.105,-1.63,sand],[1.105,-1.63,1.12,-2.2,ground],
  ];
  for(const [topScale,topY,bottomScale,bottomY,material] of strata){
    const points:number[]=[],uvs:number[]=[];
    for(let i=0;i<coastCount;i++){
      const p=[coast(i,topScale,topY),coast(i+1,topScale,topY),coast(i,bottomScale,bottomY),coast(i+1,bottomScale,bottomY)];
      for(const n of [0,1,2,1,3,2]){points.push(...p[n]);uvs.push(i*.3,n<2?0:1);}
    }
    mesh(surfaceGeometry(points,uvs),material,[0,0,0]).name='Layered ochre shore';
  }
  // The sea uses the existing world's green-blue palette and broad glints.
  // It is deliberately still in this design study; the owner owns all motion.
  const seaMaterial=mat(new T.ShaderMaterial({fog:true,uniforms:T.UniformsUtils.merge([T.UniformsLib.fog]),vertexShader:`
    #include <common>
    #include <fog_pars_vertex>
    varying vec3 vP;
    void main(){vec4 world=modelMatrix*vec4(position,1.);vP=world.xyz;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`,fragmentShader:`
    #include <common>
    #include <fog_pars_fragment>
    varying vec3 vP;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    void main(){vec2 p=vP.xz;float n=noise(p*.35);float shore=length(p/vec2(18.,17.));float shallows=1.-smoothstep(.95,1.65,shore+n*.1);
      vec3 colour=mix(vec3(.018,.155,.19),vec3(.105,.44,.36),shallows);colour+=floor(n*4.)*.012;
      float waves=sin(p.x*1.8+p.y*.65+sin(p.y*.8));float glint=smoothstep(.984,1.,waves)*smoothstep(.61,.76,noise(p*.6));colour=mix(colour,vec3(.44,.70,.58),glint*.18);
      gl_FragColor=vec4(colour,1.);
      #include <fog_fragment>
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`}));
  const sea=mesh(geo(new T.PlaneGeometry(1500,1500)),seaMaterial,[0,-1.77,0],[1,1,1],[-Math.PI/2,0,0]);sea.name='Shared sea surrounding the listening place';sea.castShadow=sea.receiveShadow=false;
  const foamMaterial=mat(new T.LineBasicMaterial({color:0xd5d7bd,transparent:true,opacity:.35,depthWrite:false}));
  const foamGeo=geo(new T.BufferGeometry().setFromPoints(Array.from({length:coastCount},(_,i)=>new T.Vector3(...coast(i,1.108,-1.75)))));
  const foam=new T.LineLoop(foamGeo,foamMaterial);foam.name='Quiet edge of the headland';scene.add(foam);
  // A low stone landfall and a level path lead to this room's existing open
  // entrance. They are a design study, not a new global navigation port.
  for(let i=0;i<7;i++){
    const z=8+i*.69;box(Math.sin(i*.55)*.13,-.105,z,2.06,.11,.64,sand,[0,Math.sin(i*.4)*.04,0],between(.94,1.07));
  }
  for(let i=0;i<9;i++){
    const top=-.045-i*.21,bottom=-2.2;
    box(0,(top+bottom)/2,12.9+i*.37,2.14+i*.08,top-bottom,.41,paleRock,[0,0,0],between(.94,1.07));
  }
  // Eroded shelves rise unevenly behind the room. Broad worn stones overlap
  // at different depths; their quiet, broken crest keeps the pavilion visible.
  for(let band=0;band<3;band++){
    const radius=8.8+band*2.18,count=band===1?13:12;
    for(let i=0;i<count;i++){
      const a=Math.PI*1.015+(i+.12+between(-.13,.13))*Math.PI*.97/(count-1),r=radius+between(-.35,.35);
      const x=Math.cos(a)*r,z=Math.sin(a)*r,height=.68+band*.57+Math.sin(i*.83+band)*.25;
      const width=between(2.15,3.25),depth=between(1.95,2.85),variant=(i+band)%3;
      put(wornStone[variant],(i+band)%4===0?rock:paleRock,[x,height*.45-.13,z],[width*.55,height*.7,depth*.55],[between(-.06,.06),-a+between(-.12,.12),between(-.06,.06)],between(.91,1.07));
      if(band>0&&i%4===1){
        // A few thin capstones suggest sediment, without a repeated masonry row.
        put(wornStone[(variant+1)%3],ground,[x+between(-.3,.3),height*.98-.11,z+between(-.2,.2)],[width*.39,.2,depth*.4],[between(-.06,.06),-a+.16,between(-.04,.04)],between(.96,1.07));
      }
    }
  }
  // A handful of low worn stones and planting mark the forecourt edges.
  // The centre stays open; these are neither a wall nor a second dock.
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const x=side*(2.9+i*.69),z=7.7+Math.sin(i*.63)*.65;
    put(wornStone[i%3],i%3===0?rock:paleRock,[x,.035+between(-.035,.035),z],[between(.28,.45),between(.19,.29),between(.29,.43)],[between(-.11,.11),between(-.4,.4),between(-.08,.08)],between(.91,1.09));
  }
  function shrub(x:number,z:number,height:number,width=1){
    for(let b=0;b<5;b++){
      const a=b*Math.PI*2/5,end:V3=[x+Math.cos(a)*.29*width,height,z+Math.sin(a)*.29*width];rod([x,-.05,z],end,.016,timber);
      for(let i=0;i<28;i++){
        const p:V3=[end[0]+between(-.34,.34)*width,end[1]+between(-.27,.27),end[2]+between(-.34,.34)*width];
        put(leafGeo,leaf,p,[between(.12,.2),between(.2,.35),1],[between(-1,1),between(0,Math.PI*2),between(-1,1)],between(.85,1.15));
      }
    }
  }
  for(const [x,z,h] of [[-6.2,1.7,1.25],[-6.6,-2,1.5],[-7,-4.2,1.2],[6.4,1.6,.9],[6.9,-2.3,1.3],[-3.5,8.5,.7],[4.3,8.8,.9],[-1.9,-6.7,1.2],[2.8,-6.9,1.4]])shrub(x,z,h);
  for(const [x,z,h,w] of [[-9.35,-3.8,1.06,1.25],[-7.7,-7.05,1.18,1.3],[-4.2,-9.1,.92,1.1],[4.9,-8.2,1.05,1.25],[8,-5.5,1.12,1.3],[9.65,-1.1,.85,1.15]])shrub(x,z,h,w);
  // Straw-coloured grass tufts nestle in the sunny gaps between stones.
  for(const [x,z] of [[-11.1,-2.7],[-8.4,-6.1],[-2.8,-10.6],[6.2,-7.5],[10.1,-4.5],[-5.35,7.55],[5.7,8.2]]){
    for(let blade=0;blade<9;blade++){
      const angle=blade*.82,height=between(.28,.58);
      rod([x+Math.cos(angle)*.07,-.09,z+Math.sin(angle)*.07],[x+Math.cos(angle)*.26,height,z+Math.sin(angle)*.26],.009,lightWood);
    }
  }
  // A bare branching tree against the rear opening gives scale to the rock.
  for(const [a,b,r] of [
    [[-7,.01,-4],[-7.2,1.5,-4],.15],[[-7.2,1.5,-4],[-6.9,3.1,-4.2],.11],
    [[-6.9,3.1,-4.2],[-6.4,4.8,-4.4],.065],[[-7.2,1.5,-4],[-8.2,2.9,-4.1],.08],
    [[-8.2,2.9,-4.1],[-8.8,4,-4],.04],[[-6.9,3.1,-4.2],[-5.8,4,-3.9],.045],
    [[-8.2,2.9,-4.1],[-9.1,3.3,-3.7],.035],
  ] as [V3,V3,number][])rod(a,b,r,timber);

  // Most furniture, architecture and planting share a few instanced batches.
  for(const batch of batches.values()){
    const o=new T.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);o.name='Listening place shared details';
    batch.matrices.forEach((matrix,i)=>{o.setMatrixAt(i,matrix);o.setColorAt(i,batch.colours[i]);});
    o.castShadow=o.receiveShadow=true;o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();architecture.add(o);
  }
  scene.add(new T.HemisphereLight(0xfff5df,0x8c6749,1.65));
  const sun=new T.DirectionalLight(0xffeed6,3);sun.position.set(-3,10,4);sun.target.position.set(0,.5,-.5);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.camera.near=.5;sun.shadow.camera.far=45;sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;
  const bounce=new T.PointLight(0xffd5a4,5.5,9,2);bounce.position.set(0,2.8,-1.2);scene.add(bounce);
  const preview={eye:[0,1.9,6.55] as V3,look:[0,1.5,-1.25] as V3,fov:57};
  const views:{garden:Pose;bench:Pose;shelf:Pose;island:Pose}={
    island:{eye:[23,15,29],look:[0,.8,0]},
    garden:{eye:[0,1.75,5.7],look:[0,1.45,-1.1]},
    bench:{eye:[-2.8,1.3,1.8],look:[.25,1.15,-.8]},
    shelf:{eye:[3.4,1.6,.2],look:[1.45,1.25,-2.65]},
  };
  const approach:[V3,V3]=[[3.8,4,12.5],[0,1.75,8.2]];
  return {scene,preview,views,approach,objects:{listen},get artworkReady(){return artworkReady;},get artworkError(){return artworkError;},dispose(){
    if(disposed)return;disposed=true;
    scene.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();if(o instanceof T.DirectionalLight||o instanceof T.PointLight)o.shadow.dispose();});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.clear();
  }};
}
