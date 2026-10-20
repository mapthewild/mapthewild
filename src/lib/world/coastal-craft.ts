import * as T from 'three';

/** Close-view joinery and planting; coordinates belong to the existing shop. */
export function coastalCraft(){
  const wood=new T.MeshStandardMaterial({color:0x51473b,roughness:.95});
  const cut=new T.MeshStandardMaterial({color:0x81715a,roughness:1});
  const shutter=new T.MeshStandardMaterial({color:0x416c68,roughness:.93});
  const clay=new T.MeshStandardMaterial({color:0x99735b,roughness:1});
  const soil=new T.MeshStandardMaterial({color:0x393e30,roughness:1});
  const greens=[0x52644c,0x788369,0x3b5746].map(color=>new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}));
  function add(p:T.Object3D,g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0){
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;
  }
  function beam(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m=wood){return add(p,new T.BoxGeometry(w,h,d),m,x,y,z);}
  function stem(p:T.Object3D,a:T.Vector3,b:T.Vector3,r:number,m:T.Material){const v=b.clone().sub(a),o=add(p,new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());}
  function screen(p:T.Object3D,x:number,y:number,z:number,w:number,h:number){
    for(const side of [-1,1]){beam(p,x+side*w/2,y,z,.055,h+.08,.09);beam(p,x,y+side*h/2,z,w+.1,.055,.09);}
    const cols=Math.max(1,Math.round(w/.24)),rows=Math.max(1,Math.round(h/.28));
    const cw=w/cols,ch=h/rows;
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const cx=x-w/2+(i+.5)*cw,cy=y-h/2+(j+.5)*ch;
      const corners=[new T.Vector3(cx,cy+ch/2,z),new T.Vector3(cx+cw/2,cy,z),new T.Vector3(cx,cy-ch/2,z),new T.Vector3(cx-cw/2,cy,z)];
      corners.forEach((a,k)=>stem(p,a,corners[(k+1)%4],.012,cut));
      beam(p,cx,cy,z+.015,.025,.025,.025,cut);
    }
  }
  function doorway(p:T.Object3D){
    // Frames and folded shutters stay outside the existing clear walking opening.
    for(const x of [.23,3.08]){
      beam(p,x,1.49,2.25,.12,2.85,.13);
      beam(p,x+(x<1?-.11:.11),1.49,2.25,.045,2.96,.17,cut);
      for(let i=0;i<12;i++){const rosette=beam(p,x,.3+i*.21,2.33,.05,.05,.025,cut);rosette.rotation.z=Math.PI/4;}
    }
    beam(p,1.65,2.93,2.24,3.06,.14,.2);
    // Shutter leaves are folded flat against the side jamb, parallel to the aisle.
    for(const x of [.11,3.2]){
      const leaf=new T.Group();leaf.position.set(x,0,2.24);leaf.rotation.y=Math.PI/2;p.add(leaf);
      beam(leaf,-.42,1.52,0,.82,2.62,.07,shutter);
      for(let i=0;i<5;i++)beam(leaf,-.75+i*.16,1.52,.045,.018,2.55,.018,wood);
      for(const y of [.39,1.5,2.65])beam(leaf,-.42,y,.065,.8,.065,.045,wood);
    }
    // A pierced panel above the baraza echoes the room's upper screen.
    screen(p,-1.8,2.28,2.27,1.5,.57);
  }
  function palm(p:T.Object3D,x:number,y:number,z:number,s=1){
    const root=new T.Group();root.position.set(x,y,z);root.scale.setScalar(s);p.add(root);
    add(root,new T.LatheGeometry([new T.Vector2(.22,0),new T.Vector2(.28,.08),new T.Vector2(.36,.53),new T.Vector2(.38,.58),new T.Vector2(.37,.64)],24),clay);
    add(root,new T.CylinderGeometry(.34,.34,.02,24),soil,0,.59,0);
    // Curved feather fronds, with tapered leaflets rather than spherical foliage.
    for(let f=0;f<10;f++){
      const a=f*2.399,length=.95+(f%3)*.22,height=1.2+(f%4)*.23;
      const at=(t:number)=>new T.Vector3(Math.cos(a)*length*t, .59+height*Math.sin(t*Math.PI*.64),Math.sin(a)*length*t);
      const path=new T.CatmullRomCurve3([at(0),at(.33),at(.66),at(1)]);
      add(root,new T.TubeGeometry(path,12,.012,5,false),greens[f%3]);
      for(let j=1;j<12;j++)for(const side of [-1,1]){
        const t=j/13,b=at(t),end=at(Math.min(1,t+.15));
        const spread=Math.sin(t*Math.PI)*.32;
        const tip=b.clone().add(new T.Vector3(Math.cos(a+Math.PI/2)*spread*side,-.09,Math.sin(a+Math.PI/2)*spread*side));
        const mid=b.clone().lerp(tip,.55);mid.y+=.025;
        const vertices=[...b.toArray(),...mid.toArray(),...end.toArray(),...mid.toArray(),...tip.toArray(),...end.toArray()];
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex([0,1,2,3,4,5]);g.computeVertexNormals();add(root,g,greens[(f+j)%3]);
      }
    }
  }
  return {screen,doorway,palm};
}
