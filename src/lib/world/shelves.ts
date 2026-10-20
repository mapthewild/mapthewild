import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SHELF_X,type ShelfReader,type ShelfBook} from './shelf-data';
import {makeShelfLife} from './shelf-life';
export * from './shelf-data';

/** The existing shelves' bindings and reader data, in the harbour's room. */
export function makeShelves(readers:ShelfReader[],onTexture:()=>void){
  const root=new T.Group(),books:{reader:ShelfReader;book:ShelfBook;mesh:T.Group}[]=[];
  const loader=new T.TextureLoader();
  const life=makeShelfLife(onTexture);
  const material=(color:string|number)=>new T.MeshStandardMaterial({color,roughness:.87});
  const wood=(color:string)=>{const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d')!;g.fillStyle=color;g.fillRect(0,0,512,128);for(let i=0;i<120;i++){g.strokeStyle=i%3?'#291c141c':'#f4e1b621';g.lineWidth=i%3?.7:1.4;g.beginPath();const y=(i*39.13)%128;g.moveTo(0,y);for(let x=0;x<=512;x+=16)g.lineTo(x,y+Math.sin(x*.019+i)*2);g.stroke();}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:tex,roughness:.83});};
  function box(p:T.Group,w:number,h:number,d:number,m:T.Material,x:number,y:number,z:number){const o=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.009,w*.12,h*.12,d*.12)),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
  for(const reader of readers){
    const station=new T.Group();station.position.set(SHELF_X[reader.id],1.12,3.34);root.add(station);
    const oak=wood(reader.contemporary?'#75543d':reader.id==='melville'?'#72553b':'#836247'),dark=material('#645441'),scale=.028;
    const rows=Math.max(...reader.books.map(b=>b.row))+1;
    const sourceWidth=reader.contemporary?66:Math.max(40,...Array.from({length:rows},(_,k)=>reader.books.filter(b=>b.row===k).reduce((s,b)=>s+b.thick+.15,0)+20))+4.4;
    const width=Math.min(1.94,sourceWidth*scale),s=width/sourceWidth;
    let bases:number[]=[],top=65.9*s;
    if(reader.contemporary){
      const steel=material('#263c37');for(const x of [-31,31])for(const z of [-10.2,10.2])box(station,1.15*s,66*s,1.15*s,steel,x*s,33*s,z*s);
      for(const y of [9,37,65])box(station,64*s,1.8*s,23*s,oak,0,y*s,0);
      // Open shelving lets the room's plaster and leaf shadows show through.
      bases=[37.9,9.9];
    }else{
      const heights=Array.from({length:rows},(_,k)=>Math.max(...reader.books.filter(b=>b.row===k).map(b=>b.tall))+5),total=heights.reduce((a,b)=>a+b,0)+2.4*(rows+1);let y=0;
      top=total*s;
      box(station,sourceWidth*s,2.4*s,26*s,oak,0,1.2*s,0);
      for(let k=rows-1;k>=0;k--){bases[k]=y+2.4;y+=2.4+heights[k];box(station,sourceWidth*s,2.4*s,26*s,oak,0,(y+1.2)*s,0);}
      for(const side of [-1,1])box(station,2.2*s,total*s,26*s,oak,side*(sourceWidth/2-1.1)*s,total*s/2,0);
      box(station,(sourceWidth-4.4)*s,total*s,.8*s,dark,0,total*s/2,-12.6*s);
    }
    for(let row=0;row<rows;row++){
      const items=reader.books.filter(b=>b.row===row),rowWidth=items.reduce((v,b)=>v+b.thick+.15,0);let x=reader.contemporary?(row===0?-23:7):-rowWidth/2;
      for(const book of items){
        const group=new T.Group(),w=book.thick*s,h=book.tall*s,d=book.depth*s;
        const cover=material(book.cloth),paper=material('#e8dfc8');box(group,w,h,d,cover,0,0,0);box(group,w*.83,h*.97,d*.96,paper,0,.002,-.006);
        const map=loader.load(book.tex,()=>onTexture());map.colorSpace=T.SRGBColorSpace;
        const spine=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:.76}));spine.position.z=d/2+.003;group.add(spine);
        group.position.set((x+book.thick/2)*s,(bases[row]+book.tall/2)*s,.30-d/2);station.add(group);books.push({reader,book,mesh:group});x+=book.thick+.2;
      }
    }
    // Small linen catalogue labels attached to the cabinet edge, not signs above it.
    const plaqueWidth=reader.id==='moe'?.30:.88;
    const c=document.createElement('canvas');c.width=Math.round(plaqueWidth*700);c.height=70;const g=c.getContext('2d')!;g.fillStyle='#ded7c1';g.fillRect(0,0,c.width,70);g.fillStyle='#443e32';g.font='36px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(reader.name,c.width/2,36);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
    box(station,plaqueWidth+.018,.106,.017,material('#80694d'),0,top-.035,.374);
    const plaque=new T.Mesh(new T.PlaneGeometry(plaqueWidth,.09),new T.MeshStandardMaterial({map:t,roughness:1}));plaque.position.set(0,top-.035,.384);station.add(plaque);
    if(!reader.contemporary){
      // Cabinet mouldings catch the same daylight as the bindings.
      for(const y of [.035,top-.015])box(station,width+.025,.032,.75,oak,0,y,0);
      for(const x of [-width/2+.05,width/2-.05])box(station,.019,top-.1,.02,oak,x,top/2,.368);
    }
    life.add(reader.id,station,top);
  }
  return {root,books,update:life.update};
}
