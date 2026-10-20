import * as T from 'three';
export type PaintedFrame={rect:[number,number,number,number];anchor:[number,number]};

/** Atlas frames retain their drawing scale; authored anchors prevent frame jitter. */
export function paintedSprite(file:string,size:[number,number],frames:PaintedFrame[],unit:number,onReady:()=>void){
  const root=new T.Group();let ready=false,current=-1;
  const map=new T.TextureLoader().load('/mapthewild/world/nowbrary/art/'+file,()=>{ready=true;onReady();});map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=false;map.minFilter=T.LinearFilter;map.magFilter=T.LinearFilter;
  const mesh=new T.Mesh(new T.PlaneGeometry(1,1,48,32),new T.MeshBasicMaterial({map,transparent:true,alphaTest:.1,depthWrite:false,toneMapped:false,side:T.DoubleSide}));root.add(mesh);
  const vertices=mesh.geometry.attributes.position,rest=vertices.array.slice();
  function pose(index:number){
    if(index===current)return;current=index;
    const {rect:[x,y,w,h],anchor:[ax,ay]}=frames[index];
    map.repeat.set(w/size[0],h/size[1]);map.offset.set(x/size[0],1-(y+h)/size[1]);
    mesh.scale.set(w*unit,h*unit,1);mesh.position.set((x+w/2-ax)*unit,(ay-y-h/2)*unit,0);
  }
  function deform(move:(x:number,y:number)=>[number,number]){
    const [x,y,w,h]=frames[current].rect;
    for(let i=0;i<vertices.count;i++){
      const p=move(x+(rest[i*3]+.5)*w,y+(.5-rest[i*3+1])*h);
      vertices.setXY(i,(p[0]-x)/w-.5,.5-(p[1]-y)/h);
    }vertices.needsUpdate=true;
  }
  pose(0);return{root,pose,deform,get ready(){return ready;},dispose(){map.dispose();}};
}
