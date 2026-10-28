import * as T from 'three';
import type {HousePalette} from './reading-house-materials';

type V3 = [number, number, number];
type Batch = {geometry:T.BufferGeometry; material:T.Material; matrices:T.Matrix4[]; colours:T.Color[]; name:string};

/** Connected, human-scale rooms around an open court. All views use real geometry. */
export function createReadingHouseArchitecture(palette:HousePalette):T.Group {
  const house=new T.Group();house.name='Reading house: rooms, courtyard and stair';
  const geometry=new Map<string,T.BufferGeometry>(),batches=new Map<string,Batch>();
  const white=new T.Color(0xffffff),up=new T.Vector3(0,1,0);
  let seed=93177;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const between=(a:number,b:number)=>a+(b-a)*random();
  const cached=(key:string,make:()=>T.BufferGeometry)=>{let g=geometry.get(key);if(!g){g=make();geometry.set(key,g);}return g;};
  const cube=cached('box',()=>new T.BoxGeometry(1,1,1));
  const cylinder=cached('cylinder',()=>new T.CylinderGeometry(1,1,1,8));
  const taper=cached('taper',()=>new T.CylinderGeometry(.66,1,1,9));
  const leaf=cached('olive-leaf',()=>new T.PlaneGeometry(1,1));
  const petal=cached('petal',()=>new T.SphereGeometry(1,5,3));
  function put(g:T.BufferGeometry,m:T.Material,position:V3,scale:V3,rotation:V3=[0,0,0],tone=1,name='Architectural details'){
    const key=g.uuid+'/'+m.uuid;
    let batch=batches.get(key);
    if(!batch){batch={geometry:g,material:m,matrices:[],colours:[],name};batches.set(key,batch);}
    const quaternion=new T.Quaternion().setFromEuler(new T.Euler(...rotation));
    batch.matrices.push(new T.Matrix4().compose(new T.Vector3(...position),quaternion,new T.Vector3(...scale)));
    batch.colours.push(white.clone().multiplyScalar(tone));
  }
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,rotation:V3=[0,0,0],tone=1)=>put(cube,m,[x,y,z],[w,h,d],rotation,tone);
  function rod(a:V3,b:V3,r:number,m:T.Material,tapered=false,tone=1){
    const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);
    const euler=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(up,delta.clone().normalize()));
    put(tapered?taper:cylinder,m,from.add(to).multiplyScalar(.5).toArray() as V3,[r,delta.length(),r],[euler.x,euler.y,euler.z],tone);
  }
  function branch(points:V3[],r:number,m=palette.timber){
    for(let i=1;i<points.length;i++)rod(points[i-1],points[i],r*(1-(i-1)/points.length*.78),m,true,between(.83,1.06));
  }
  function scatterLeaves(centre:V3,radii:V3,count:number,olive=true){
    // Loose sprays of individual leaves preserve openings through the crown.
    for(let i=0;i<count;i++){
      const angle=random()*Math.PI*2,vertical=between(-1,1),radius=Math.cbrt(random()),ring=Math.sqrt(1-vertical*vertical);
      const p:V3=[centre[0]+Math.cos(angle)*ring*radius*radii[0],centre[1]+vertical*radius*radii[1],centre[2]+Math.sin(angle)*ring*radius*radii[2]];
      const length=olive?between(.13,.24):between(.15,.26),width=olive?length*.36:length*.65;
      put(leaf,random()<.22?palette.leafLight:palette.leaf,p,[width,length,1],[between(-1.1,1.1),angle,between(-1.5,1.5)],between(.85,1.12),'Olive leaves and climbing vine');
    }
  }
  function flowers(centre:V3,radius:number,count:number){
    for(let i=0;i<count;i++){
      const x=centre[0]+between(-radius,radius),y=centre[1]+between(-radius*.7,radius*.7),z=centre[2]+between(-radius*.6,radius*.6);
      const size=between(.025,.055),angle=random()*Math.PI*2;
      for(let p=0;p<3;p++){
        const a=angle+p*Math.PI*2/3;
        put(petal,palette.flower,[x+Math.cos(a)*size*.6,y+Math.sin(a)*size*.6,z],[size*.75,size,.009],[between(-.4,.4),between(-.4,.4),a],between(.74,1.17),'Bougainvillea bracts');
      }
    }
  }
  // Stonework has actual bed joints, irregular course lengths and projecting
  // edges. The structural wall behind it keeps rooms solid from every angle.
  function masonry(x:number,z:number,width:number,height:number,depth=.36,base=0,yaw=0){
    box(x,base+height/2,z,width,height,depth,palette.plaster,[0,yaw,0]);
    for(let row=0;row<Math.ceil(height/.31);row++){
      const h=Math.min(.29,height-row*.31);if(h<=0)continue;
      let at=-width/2;
      while(at<width/2-.03){
        const w=Math.min(between(.36,.78),width/2-at);
        const local=at+w/2,face=depth/2+.018;
        const px=x+local*Math.cos(yaw)+face*Math.sin(yaw),pz=z-local*Math.sin(yaw)+face*Math.cos(yaw);
        box(px,base+row*.31+h/2,pz,Math.max(.02,w-.018),h,.045,palette.stone,[0,yaw,between(-.006,.006)],between(.89,1.08));
        at+=w;
      }
    }
  }
  function coping(x:number,y:number,z:number,w:number,d:number){
    const count=Math.ceil(w/.65);
    for(let i=0;i<count;i++)box(x-w/2+(i+.5)*w/count,y,z,w/count-.014,.13,d,palette.stone,[0,0,0],between(.91,1.06));
  }

  // Continuous foundations, then individually laid court paving. The central
  // route and doorway remain level; the eastern stair is the only large rise.
  box(0,-.18,0,12.2,.36,14.2,palette.stone);
  box(0,-.015,0,11.9,.035,14,palette.floor);
  for(let row=0;row<22;row++){
    const z=-6.8+row*.63;
    for(let col=0;col<17;col++){
      const x=-5.8+col*.7+(row%2)*.34;if(x>5.8)continue;
      const inTreeBed=Math.hypot((x+2.85)/1.1,(z+2.55)/.93)<1;
      if(inTreeBed)continue;
      box(x,.012+between(0,.008),z,between(.62,.68),.045,between(.55,.60),palette.floor,[0,between(-.022,.022),0],between(.82,1.12));
    }
  }
  // A narrow stone threshold marks the deep, open entrance without a front wall.
  box(0,.055,6.75,11.8,.11,.3,palette.stone);

  // Left reading room: an open east edge, a back wall for bookcases, and a
  // deeply recessed blue window on the west. Furniture is supplied separately.
  masonry(-4.1,-1.06,3.8,3.5,.34);
  masonry(-6,3.6,1.1,3.5,.34,0,Math.PI/2);
  masonry(-6,-.45,1.25,3.5,.34,0,Math.PI/2);
  masonry(-6,1.62,2.9,.72,.34,0,Math.PI/2);
  masonry(-6,1.62,2.9,.45,.34,3.05,Math.PI/2);
  box(-5.76,.78,1.62,.68,.13,3.05,palette.stone);
  box(-5.97,1.91,1.62,.08,2.13,2.7,palette.glass);
  for(const z of [.29,1.18,2.07,2.96])box(-5.74,1.91,z,.15,2.24,.072,palette.blue);
  for(const y of [.82,1.57,2.32,3.04])box(-5.74,y,1.62,.15,.072,2.75,palette.blue);
  for(const z of [-.82,4.1]){
    masonry(-2.08,z,.34,3.5,.43);
    box(-2.08,3.42,z,.53,.18,.62,palette.stone);
  }
  // Heavy beams, close ceiling boards and small rafter tails make the shaded
  // foreground feel inhabited, while the court itself stays open to the sky.
  box(-4.04,3.59,1.48,4.05,.14,5.45,palette.darkTimber);
  for(let z=-1.1;z<4.3;z+=.24)box(-4.04,3.49,z,4.03,.075,.215,palette.timber,[0,0,0],between(.82,1.12));
  for(const z of [-.95,.72,2.38,4.08])box(-4.04,3.34,z,4.1,.24,.17,palette.darkTimber);
  box(-2.02,3.4,1.5,.19,.28,5.5,palette.timber);
  for(const x of [-5.94,5.78]){
    box(x,1.78,6.55,.25,3.56,.27,palette.darkTimber);
    box(x,3.57,5.2,.28,.25,3.05,palette.timber);
    rod([x,2.8,6.55],[x,3.43,5.85],.065,palette.timber);
  }
  for(const z of [4.13,5.45,6.7])box(-.08,3.61,z,12.1,.22,.19,palette.darkTimber);
  for(const x of [3.2]){
    box(x,1.78,6.7,.2,3.56,.22,palette.timber);
    box(x,.12,6.7,.32,.24,.34,palette.stone);
    for(const side of [-1,1])rod([x,2.91,6.7],[x+side*.62,3.52,6.7],.055,palette.darkTimber);
  }
  for(let x=-5.85;x<5.95;x+=.34)box(x,3.77,5.42,.13,.1,2.9,palette.timber,[0,0,0],between(.82,1.1));
  for(let z=4.12;z<6.85;z+=.31)box(-.08,3.84,z,12,.045,.055,palette.timber);

  // Rear court wall and a real vaulted opening to the garden beyond.
  const archX=-1,archZ=-6.12,archRadius=1.02,spring=1.94,wallHeight=3.56;
  masonry(-4.02,archZ,3.96,wallHeight,.42);
  masonry(3.02,archZ,6,3.2,.42);
  const archShape=new T.Shape();
  archShape.moveTo(-archRadius,0);archShape.lineTo(-archRadius,wallHeight-spring);
  archShape.lineTo(archRadius,wallHeight-spring);archShape.lineTo(archRadius,0);
  archShape.absarc(0,0,archRadius,0,Math.PI,false);archShape.closePath();
  const archFill=cached('arch-spandrel',()=>new T.ExtrudeGeometry(archShape,{depth:.42,steps:1,bevelEnabled:false,curveSegments:24}));
  put(archFill,palette.plaster,[archX,spring,archZ-.21],[1,1,1]);
  for(const side of [-1,1]){
    for(let course=0;course<6;course++)box(archX+side*(archRadius+.13),spring/6*(course+.5),archZ+.04,.25,spring/6-.012,.55,palette.stone,[0,0,0],between(.9,1.1));
    box(archX+side*(archRadius+.14),spring-.02,archZ+.08,.35,.13,.61,palette.stone);
  }
  const wedge=new T.Shape(),wedgeAngle=Math.PI/15;
  wedge.absarc(0,0,archRadius,0,wedgeAngle,false);wedge.lineTo(Math.cos(wedgeAngle)*(archRadius+.27),Math.sin(wedgeAngle)*(archRadius+.27));
  wedge.absarc(0,0,archRadius+.27,wedgeAngle,0,true);wedge.closePath();
  const voussoir=cached('arch-stone',()=>new T.ExtrudeGeometry(wedge,{depth:.56,bevelEnabled:false,curveSegments:4}));
  for(let i=0;i<15;i++)put(voussoir,palette.stone,[archX,spring,archZ-.22],[.994,.994,1],[0,0,i*wedgeAngle],between(.88,1.09),'Limestone arch');
  box(archX,.06,archZ,2.05,.12,.7,palette.stone);
  coping(-3.95,3.6,archZ,4.1,.56);

  // The tall east wall has an actual ground-floor doorway. Its interior is
  // visible from the court, rather than a painted rectangle on the masonry.
  masonry(5.82,-2.91,6.22,3.22,.36,0,-Math.PI/2);
  masonry(5.82,3.53,2.3,3.22,.36,0,-Math.PI/2);
  masonry(5.82,1.3,2.15,.62,.36,2.6,-Math.PI/2);
  box(5.65,2.65,1.3,.55,.16,2.36,palette.stone);
  for(const z of [.24,2.36])box(5.61,1.3,z,.3,2.6,.12,palette.blue);
  box(5.61,2.52,1.3,.3,.14,2.2,palette.blue);
  // A half-open door and its brass latch remain recognisable in silhouette.
  box(5.33,1.24,.57,.075,2.43,.9,palette.blue,[0,.55,0]);
  for(const y of [.45,1.4,2.1])box(5.28,y,.57,.09,.095,.85,palette.blue,[0,.55,0],.86);
  put(petal,palette.brass,[5.08,1.12,.89],[.035,.05,.035]);

  // Eighteen solid, shallow risers connect the courtyard to the upper landing.
  const stairX=4,stairFront=1.0,stairBack=-3.83,rise=3.2,steps=18,run=(stairFront-stairBack)/steps;
  for(let i=0;i<steps;i++){
    const y=(i+1)*rise/steps,z=stairFront-(i+.5)*run;
    box(stairX,y/2,z,1.72,y,run+.006,palette.stone,[0,0,0],between(.92,1.07));
    box(stairX,y+.026,z+.022,1.79,.055,run+.052,palette.floor,[0,0,0],between(.94,1.1));
    for(const x of [3.27,4.73])box(x,y-.07,z+run/2+.027,.2,.115,.05,palette.stone,[0,0,0],between(.8,1.02));
  }
  // Iron balusters lean neither through the treads nor through the doorway.
  for(const x of [3.08,4.92]){
    for(let i=0;i<=steps;i+=2){const y=i*rise/steps,z=stairFront-i*run;rod([x,y+.08,z],[x,y+1.02,z],.021,palette.iron);}
    rod([x,1.02,stairFront+.04],[x,rise+1.02,stairBack-.04],.032,palette.iron);
    rod([x,.49,stairFront],[x,rise+.49,stairBack],.014,palette.iron);
  }

  // Upper room, wide blue opening and a balcony on the west side of the stair.
  box(3.65,3.06,-5.22,3.7,.28,3.25,palette.stone);
  box(3.65,3.21,-5.22,3.6,.045,3.2,palette.floor);
  masonry(3.65,-6.75,3.7,2.88,.34,3.2);
  masonry(5.5,-5.2,3.08,2.88,.34,3.2,-Math.PI/2);
  masonry(1.79,-5.2,3.08,2.88,.3,3.2,Math.PI/2);
  masonry(2.07,-3.72,.58,2.88,.34,3.2);
  masonry(5.16,-3.72,.68,2.88,.34,3.2);
  masonry(3.61,-3.72,2.5,.43,.34,5.65);
  box(3.6,5.66,-3.51,2.7,.16,.53,palette.timber);
  box(3.63,3.24,-3.78,2.7,.08,.22,palette.stone);
  box(3.64,6.15,-5.13,4.12,.17,3.79,palette.darkTimber);
  for(let z=-6.9;z<-3.3;z+=.25)box(3.64,6.03,z,4.05,.09,.22,palette.timber,[0,0,0],between(.85,1.1));
  for(const x of [2.05,3.6,5.18])box(x,5.96,-5.15,.15,.23,3.85,palette.timber);
  // Roof tiles have their own depth and overlaps rather than one orange slab.
  const tile=cached('roof-tile',()=>new T.CylinderGeometry(.105,.105,1,8,1,true,Math.PI/2,Math.PI));
  for(let x=1.65;x<5.7;x+=.22)for(let z=-6.9;z<-3.4;z+=.44)put(tile,palette.terracotta,[x,6.28,z],[1,.5,1],[Math.PI/2,0,0],between(.8,1.14),'Clay roof tiles');
  function shutter(hinge:number,z:number,side:number){
    const yaw=side*.55,centreX=hinge+side*.35*Math.cos(yaw),centreZ=z-side*.35*Math.sin(yaw);
    const transform=(x:number,zz:number):V3=>[centreX+x*Math.cos(yaw)+zz*Math.sin(yaw),4.45,centreZ-x*Math.sin(yaw)+zz*Math.cos(yaw)];
    for(let i=0;i<7;i++){const p=transform(-.3+i*.1,0);box(p[0],4.45,p[2],.095,2.28,.065,palette.blue,[0,yaw,0],between(.87,1.1));}
    for(const y of [3.42,4.45,5.48])box(centreX,y,centreZ+.025,.71,.095,.09,palette.blue,[0,yaw,0],.88);
    for(const y of [3.62,5.24])box(hinge,y,z+.06,.17,.045,.075,palette.iron);
  }
  shutter(2.39,-3.48,-1);shutter(4.82,-3.48,1);
  box(2.38,4.44,-3.58,.11,2.5,.16,palette.blue);box(4.84,4.44,-3.58,.11,2.5,.16,palette.blue);
  // This balcony remains open at its eastern end, where the stair arrives.
  box(2.48,3.1,-3.19,1.45,.2,1.25,palette.stone);
  for(let x=1.81;x<=3.08;x+=.16)rod([x,3.21,-2.59],[x,4.14,-2.59],.018,palette.iron);
  rod([1.79,4.15,-2.59],[3.1,4.15,-2.59],.031,palette.iron);
  rod([1.79,3.61,-2.59],[3.1,3.61,-2.59],.013,palette.iron);
  rod([1.79,3.21,-2.59],[1.79,4.15,-2.59],.03,palette.iron);
  rod([1.79,4.15,-2.59],[1.79,4.15,-3.73],.031,palette.iron);
  for(let z=-3.65;z<-2.6;z+=.18)rod([1.79,3.21,z],[1.79,4.14,z],.018,palette.iron);

  // The olive is a leaning, branching tree with separated sprays, not a crown
  // assembled from spheres. Its trunk leaves the central walking line clear.
  const trunk:V3[]=[[-2.87,.08,-2.54],[-2.92,.8,-2.58],[-2.77,1.7,-2.59],[-2.52,2.6,-2.72],[-2.14,3.6,-2.79],[-1.92,4.3,-2.88]];
  branch(trunk,.25);
  const boughs:V3[][]=[
    [[-2.77,1.7,-2.59],[-3.11,2.7,-2.8],[-3.52,3.7,-3.05],[-4.08,4.25,-2.9]],
    [[-2.52,2.6,-2.72],[-2.9,3.43,-1.93],[-3.26,4.25,-1.22],[-3.7,4.55,-.6]],
    [[-2.14,3.6,-2.79],[-1.32,4.22,-2.5],[-.48,4.77,-2.18],[.42,4.95,-1.87]],
    [[-2.52,2.6,-2.72],[-2.05,3.42,-3.55],[-1.54,4.3,-4.13],[-.87,4.7,-4.55]],
    [[-2.14,3.6,-2.79],[-2.18,4.3,-3.11],[-2.65,5.09,-3.27],[-3.02,5.42,-3.37]],
    [[-2.9,3.43,-1.93],[-2.36,4.16,-1.1],[-1.89,4.65,-.56],[-1.4,4.92,-.12]],
  ];
  for(const points of boughs){
    branch(points,.12);
    for(let i=1;i<points.length;i++){
      const p=points[i];
      for(let j=0;j<3;j++){
        const angle=between(-Math.PI,Math.PI),end:V3=[p[0]+Math.cos(angle)*between(.35,.7),p[1]+between(.05,.4),p[2]+Math.sin(angle)*between(.3,.65)];
        rod(p,end,.018,palette.darkTimber,true);
        scatterLeaves(end,[.64,.34,.55],88);
      }
    }
  }
  // Broad, offset terminal sprays join neighbouring boughs while preserving
  // the split crown and the air beneath it. Their branches remain visible.
  for(const [start,end] of [
    [[-3.52,3.7,-3.05],[-4.42,4.05,-3.24]],
    [[-3.26,4.25,-1.22],[-4.15,4.56,-.82]],
    [[-.48,4.77,-2.18],[.61,4.87,-2.15]],
    [[-1.89,4.65,-.56],[-.78,4.8,-.3]],
    [[-2.65,5.09,-3.27],[-2.9,5.5,-4.07]],
    [[-1.54,4.3,-4.13],[-.6,4.63,-4.51]],
  ] as [V3,V3][]){
    rod(start,end,.025,palette.darkTimber,true);
    scatterLeaves(end,[.72,.36,.65],130);
  }
  // Raised, irregular stone edging protects the roots and catches sunlight.
  for(let i=0;i<13;i++){
    const a=i/13*Math.PI*2;
    box(-2.87+Math.cos(a)*.95,.21,-2.54+Math.sin(a)*.83,.39,.42,.25,palette.stone,[0,-a,between(-.025,.025)],between(.85,1.09));
  }
  for(let i=0;i<8;i++){
    const a=i*.83;
    scatterLeaves([-2.85+Math.cos(a)*.72,.4,-2.55+Math.sin(a)*.6],[.27,.2,.24],16,false);
  }

  // A climbing bougainvillea connects the arch, upper balcony and pergola.
  // Woody stems precede the foliage so the plant reads as something grown.
  const vines:V3[][]=[
    [[.4,.08,-5.8],[.23,1.3,-5.75],[.15,2.45,-5.7],[-.45,3.15,-5.69],[-1.45,3.4,-5.7],[-2.6,3.23,-5.73]],
    [[-2.38,.06,-5.77],[-2.43,1.25,-5.78],[-2.34,2.3,-5.78],[-2.05,3.12,-5.72],[-1.4,3.38,-5.7]],
    [[5.5,.08,-2.7],[5.43,1.55,-2.8],[5.4,2.8,-2.99],[5.35,4.05,-3.25],[5.17,5.45,-3.42],[4.36,6.05,-3.43]],
    [[5.35,4.05,-3.25],[4.7,4.9,-3.3],[4.25,5.73,-3.3],[3.4,6,-3.32],[2.5,5.83,-3.33]],
    [[5.44,1.6,2.8],[5.5,2.7,3.1],[5.1,3.82,4.05],[3.5,3.88,4.15],[2.1,3.85,4.13]],
    [[5.55,.04,3.8],[5.55,.9,3.77],[5.52,1.7,3.59],[5.5,2.5,3.25],[5.48,3.1,2.9]],
    [[5.58,.07,-.9],[5.57,1.1,-.87],[5.54,2.05,-1.1],[5.5,2.9,-1.65],[5.47,3.35,-2.25]],
  ];
  for(const points of vines){
    branch(points,.037,palette.darkTimber);
    for(let segment=1;segment<points.length;segment++){
      const a=points[segment-1],b=points[segment];
      for(let i=0;i<3;i++){
        const t=(i+.5)/3,p:V3=[T.MathUtils.lerp(a[0],b[0],t),T.MathUtils.lerp(a[1],b[1],t),T.MathUtils.lerp(a[2],b[2],t)];
        const onEastWall=p[0]>5.2;
        scatterLeaves(p,onEastWall?[.16,.35,.32]:[.35,.32,.23],30,false);
        if(p[1]>2.15)flowers([p[0],p[1]-.06,p[2]+.1],onEastWall?.16:.26,18);
      }
    }
  }
  for(let x=2.1;x<5.7;x+=.42){
    const y=3.17-between(.05,.42);
    branch([[x,3.25,-3.58],[x+.05,y,-3.39],[x-.08,y-.24,-3.32]],.009,palette.darkTimber);
    scatterLeaves([x,y,-3.36],[.25,.3,.13],28,false);
  }

  // The arched passage opens onto another piece of the same property. A
  // shaded path, low walls and foliage provide depth through the real opening.
  box(-1,-.07,-8.72,3.6,.14,5.3,palette.floor);
  for(let i=0;i<7;i++)box(-1+(i%2)*.08,.03,-6.8-i*.6,1.65,.06,.53,palette.stone,[0,between(-.04,.04),0],between(.87,1.05));
  masonry(-2.95,-8.7,4.6,.8,.24,0,Math.PI/2);masonry(.95,-8.7,4.6,.8,.24,0,-Math.PI/2);
  masonry(-1,-11.04,4.2,1.16,.25);
  coping(-1,1.2,-11.04,4.35,.4);
  for(let i=0;i<13;i++){
    const side=i%2?-1:1,p:V3=[-1+side*between(1.4,2.05),between(.65,1.6),between(-10.6,-7.1)];
    branch([[p[0],.05,p[2]],[p[0]+.12,p[1]*.65,p[2]],[p[0],p[1],p[2]]],.025,palette.darkTimber);
    scatterLeaves(p,[.42,.5,.38],75,false);
    if(i%3===0)flowers([p[0],p[1]-.05,p[2]+.1],.2,10);
  }
  // A second, deeper garden is visible through the arch: a small flowering
  // tree grows beside the path and reaches over it, with layered underplanting.
  // Nothing is placed in the opening or the central passage at ground level.
  const rearTrunk:V3[]=[[-2.35,.04,-10.53],[-2.37,.85,-10.55],[-2.24,1.68,-10.57],[-1.94,2.43,-10.58],[-1.58,3.25,-10.62]];
  branch(rearTrunk,.13);
  const rearBranches:V3[][]=[
    [[-2.24,1.68,-10.57],[-2.77,2.25,-10.25],[-3.1,2.91,-10.05]],
    [[-1.94,2.43,-10.58],[-1.16,2.7,-10.35],[-.4,3.08,-10.18]],
    [[-2.37,.85,-10.55],[-2.15,1.7,-9.96],[-1.78,2.18,-9.67]],
    [[-1.58,3.25,-10.62],[-.95,3.72,-10.5],[-.47,4.02,-10.32]],
    [[-1.94,2.43,-10.58],[-1.87,3.4,-11],[-2.28,3.99,-11.15]],
  ];
  for(const points of rearBranches){
    branch(points,.055);
    for(let i=1;i<points.length;i++){
      const p=points[i];
      scatterLeaves(p,[.55,.4,.47],130,false);
      flowers([p[0],p[1]-.08,p[2]+.2],.34,15);
      for(let j=0;j<2;j++){
        const end:V3=[p[0]+between(-.43,.43),p[1]+between(.07,.35),p[2]+between(-.36,.36)];
        rod(p,end,.013,palette.darkTimber,true);scatterLeaves(end,[.34,.27,.32],48,false);
      }
    }
  }
  for(const p of [[-.04,1.35,-10.55],[-2.75,1.25,-8.95],[.4,1.15,-8.3]] as V3[]){
    branch([[p[0],.04,p[2]],[p[0]-.1,p[1]*.6,p[2]],[p[0],p[1],p[2]]],.035);
    scatterLeaves(p,[.42,.6,.44],155,false);flowers([p[0],p[1]-.13,p[2]+.23],.3,24);
  }

  // The west window looks onto a real side garden. Near flowers, a crooked
  // olive and a low, distant boundary give the seated view three depths.
  box(-8.45,-.13,1.8,5.1,.22,6.1,palette.stone);
  box(-8.45,-.005,1.8,4.95,.04,5.95,palette.floor,[0,0,0],.8);
  masonry(-10.88,1.8,5.8,.72,.26,0,Math.PI/2);
  masonry(-8.48,-1.22,4.8,.58,.25);
  for(let i=0;i<7;i++){
    box(-10.88,.78,-.86+i*.87,.43,.13,.85,palette.stone,[0,0,0],between(.91,1.06));
    box(-6.44,.16,-.54+i*.7,.29,.3,.66,palette.stone,[0,0,between(-.015,.015)],between(.92,1.08));
  }
  for(let i=0;i<5;i++)box(-6.95-i*.62,.035,3.16+Math.sin(i*.85)*.3,.52,.07,.61,palette.stone,[0,between(-.13,.13),0],between(.86,1.04));
  const westTrunk:V3[]=[[-8.85,.01,1.25],[-8.91,.75,1.2],[-8.74,1.55,1.18],[-8.44,2.38,1.11],[-8.15,3.2,1.08]];
  branch(westTrunk,.18);
  const westBoughs:V3[][]=[
    [[-8.74,1.55,1.18],[-9.27,2.29,.7],[-9.71,3.03,.25]],
    [[-8.44,2.38,1.11],[-7.77,2.92,.67],[-7.24,3.35,.22]],
    [[-8.91,.75,1.2],[-8.65,1.84,2],[-8.26,2.66,2.85]],
    [[-8.44,2.38,1.11],[-8.88,3.12,2],[-9.1,3.65,2.54]],
    [[-8.15,3.2,1.08],[-7.98,3.8,1.52],[-7.63,4.08,2.01]],
  ];
  for(const points of westBoughs){
    branch(points,.075);
    for(let i=1;i<points.length;i++){
      const p=points[i];scatterLeaves(p,[.57,.35,.55],105);
      for(let j=0;j<3;j++){
        const end:V3=[p[0]+between(-.42,.42),p[1]+between(.08,.33),p[2]+between(-.45,.45)];
        rod(p,end,.015,palette.darkTimber,true);scatterLeaves(end,[.39,.3,.36],50);
      }
    }
  }
  for(const p of [
    [-6.8,.67,.25],[-6.9,.8,1.26],[-6.83,.73,2.43],
    [-9.85,.83,-.42],[-10.05,1.15,.65],[-10.03,1.03,2.3],[-9.68,.9,3.7],
  ] as V3[]){
    branch([[p[0],.03,p[2]],[p[0]-.07,p[1]*.65,p[2]],[p[0],p[1],p[2]]],.023,palette.darkTimber);
    scatterLeaves(p,[.37,.43,.4],120,false);
    flowers([p[0]+.1,p[1]-.03,p[2]],.27,22);
  }

  // Turning from the balcony reveals the approach to the house, rather than
  // the end of a stage. Low boundaries frame an open, level entrance path.
  box(0,-.14,9.75,14,.28,5.7,palette.stone);
  box(0,.013,9.75,13.8,.035,5.7,palette.floor);
  box(0,-.1,13.25,14.4,.18,1.65,palette.floor,[0,0,0],.77);
  for(let row=0;row<8;row++){
    for(let col=0;col<17;col++){
      const x=-5.85+col*.71+(row%2)*.33;
      box(x,.05+between(0,.008),7.33+row*.64,.66,.04,.59,palette.floor,[0,between(-.018,.018),0],between(.86,1.08));
    }
  }
  for(const x of [-6.91,6.91]){
    masonry(x,9.74,5.62,.62,.25,0,Math.PI/2);
    for(let i=0;i<9;i++)box(x,.68,7.24+i*.63,.4,.13,.61,palette.stone,[0,0,0],between(.92,1.06));
  }
  for(const x of [-4.13,4.13]){
    masonry(x,12.51,5.56,.82,.29,0,Math.PI);
    coping(x,.88,12.51,5.68,.44);
  }
  for(const x of [-1.35,1.35]){
    masonry(x,12.51,.35,1.05,.38);
    box(x,1.12,12.51,.5,.14,.53,palette.stone);
  }
  for(let i=0;i<3;i++)box(0,.044,12.41+i*.52,2.27,.07,.49,palette.stone,[0,between(-.018,.018),0],between(.91,1.05));

  const approachTrees:{base:V3;boughs:V3[][]}[]=[
    {base:[-5.64,.02,11.43],boughs:[
      [[-5.52,1.5,11.4],[-6.1,2.24,11.16],[-6.6,2.95,10.95]],
      [[-5.3,2.28,11.3],[-4.64,2.82,11.01],[-4.12,3.48,10.81]],
      [[-5.3,2.28,11.3],[-5.14,3.14,11.72],[-4.86,3.92,12.12]],
      [[-5.52,1.5,11.4],[-5.91,2.15,12.1],[-6.15,2.89,12.68]],
    ]},
    {base:[5.66,.02,10.73],boughs:[
      [[5.78,1.5,10.7],[5.17,2.3,10.3],[4.61,3.15,9.98]],
      [[6,2.28,10.6],[6.4,2.92,11.23],[6.68,3.69,11.77]],
      [[6,2.28,10.6],[5.74,3.21,10.94],[5.4,4.07,11.28]],
      [[5.78,1.5,10.7],[6.41,2.11,10.27],[6.83,2.98,9.86]],
    ]},
  ];
  for(const {base,boughs} of approachTrees){
    branch([base,[base[0]-.03,.73,base[2]-.01],[base[0]+.12,1.5,base[2]-.03],[base[0]+.34,2.28,base[2]-.13],[base[0]+.42,3.15,base[2]-.2]],.17);
    for(const points of boughs){
      branch(points,.07);
      for(let i=1;i<points.length;i++){
        const p=points[i];scatterLeaves(p,[.64,.39,.59],115);
        for(let j=0;j<2;j++){
          const end:V3=[p[0]+between(-.46,.46),p[1]+between(.08,.3),p[2]+between(-.41,.41)];
          rod(p,end,.015,palette.darkTimber,true);scatterLeaves(end,[.39,.27,.37],48);
        }
      }
    }
  }
  // Uneven planting sits along the perimeter, keeping the middle two metres
  // open all the way from the forecourt to the reading house threshold.
  for(const p of [
    [-6.47,.75,8.04],[-6.36,1.03,9.48],[-5.2,1.2,12.86],[-3.92,1.62,13.08],[-2.37,1.18,12.94],
    [2.58,1.35,13.04],[3.96,1.72,13.11],[5.22,1.1,12.95],[6.43,.85,8.37],[6.4,1.14,11.94],
  ] as V3[]){
    branch([[p[0],.03,p[2]],[p[0]+.08,p[1]*.6,p[2]],[p[0],p[1],p[2]]],.03,palette.darkTimber);
    scatterLeaves(p,[.62,.58,.5],175,false);
    flowers([p[0],p[1]-.1,p[2]-.22],.35,18);
  }

  // One draw call per shared geometry/material, including the many leaves and
  // masonry faces. Parent scene owns the light and the resource lifecycle.
  for(const batch of batches.values()){
    const mesh=new T.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);
    mesh.name=batch.name;mesh.castShadow=true;mesh.receiveShadow=true;
    batch.matrices.forEach((matrix,index)=>{mesh.setMatrixAt(index,matrix);mesh.setColorAt(index,batch.colours[index]);});
    mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingBox();mesh.computeBoundingSphere();house.add(mesh);
  }
  house.userData.architecture={upperFloor:3.2,stair:{x:4,front:1,back:-3.83,width:1.72},entrance:[0,2.2,7.8],arch:[archX,archZ]};
  return house;
}
