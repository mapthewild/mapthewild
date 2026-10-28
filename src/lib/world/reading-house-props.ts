import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {HousePalette} from './reading-house-materials';

/** Furnishings are separately modelled objects; real shelf data stays in the bookshop. */
export function createReadingHouseProps(p:HousePalette){
  const root=new T.Group();root.name='Reading house furnishings';
  const cube=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,12),leafPlane=new T.PlaneGeometry(.16,.31);
  const batch=new Map<T.Material,{matrix:T.Matrix4;colour?:T.Color}[]>();
  const dummy=new T.Object3D();
  function box(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material,rounded:boolean|number=false){
    const mesh=new T.Mesh(rounded?new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*(typeof rounded==='number'?rounded:.12)):cube,material);
    mesh.position.set(x,y,z);if(!rounded)mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function block(x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material,rotation=0){
    dummy.position.set(x,y,z);dummy.rotation.set(0,0,rotation);dummy.scale.set(w,h,d);dummy.updateMatrix();
    if(!batch.has(material))batch.set(material,[]);batch.get(material)!.push({matrix:dummy.matrix.clone()});
  }
  function rod(parent:T.Object3D,a:T.Vector3,b:T.Vector3,r:number,material:T.Material){
    const mesh=new T.Mesh(cylinder,material),delta=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(r,delta.length(),r);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function pot(x:number,y:number,z:number,size:number,material=p.terracotta){
    const profile=[[.25,0],[.3,.04],[.34,.13],[.46,.7],[.48,.73],[.48,.8],[.41,.8],[.39,.73],[.29,.1]].map(([r,h])=>new T.Vector2(r*size,h*size));
    const object=new T.Mesh(new T.LatheGeometry(profile,20),material);object.position.set(x,y,z);object.castShadow=object.receiveShadow=true;root.add(object);
    const soil=new T.Mesh(new T.CircleGeometry(size*.39,18),p.darkTimber);soil.rotation.x=-Math.PI/2;soil.position.set(x,y+size*.74,z);root.add(soil);
    return {x,y:y+size*.73,z};
  }
  function plant(x:number,y:number,z:number,size:number){
    const c=pot(x,y,z,size);const count=24,leaves=new T.InstancedMesh(leafPlane,p.leaf,count*7);
    let index=0;
    for(let branch=0;branch<count;branch++){
      const a=branch*2.399963,r=size*(.4+(branch%4)*.12),end=new T.Vector3(c.x+Math.cos(a)*r,c.y+size*(.5+(branch%3)*.25),c.z+Math.sin(a)*r);
      rod(root,new T.Vector3(c.x,c.y,c.z),end,.009*size,p.leafLight);
      for(let j=1;j<=7;j++){
        const t=j/7;dummy.position.set(T.MathUtils.lerp(c.x,end.x,t),T.MathUtils.lerp(c.y,end.y,t),T.MathUtils.lerp(c.z,end.z,t));dummy.rotation.set(-.5+(j%3)*.4,a+(j%2)*1.8,j%2?.5:-.5);dummy.scale.setScalar(size*(1.2-t*.35));dummy.updateMatrix();leaves.setMatrixAt(index++,dummy.matrix);
      }
    }
    leaves.castShadow=leaves.receiveShadow=true;root.add(leaves);
  }
  // A built-in seat within the left bay, facing the courtyard, not a park bench.
  const bench=new T.Group();bench.name='Reading window seat';bench.userData.role='seat';root.add(bench);
  box(bench,-4.28,.29,1.4,2.6,.58,1.02,p.plaster,true);
  box(bench,-4.28,.63,1.4,2.5,.18,1.02,p.indigo,.4);
  box(bench,-4.28,1.04,1,2.5,.7,.18,p.linen,true).rotation.x=-.13;
  for(let i=0;i<3;i++){
    const cushion=box(bench,-5.1+i*.8,1.06,1.28,.68,.61,.22,i===1?p.indigo:p.bookMaterials[1],.45);cushion.rotation.set(-.18,0,i===1?-.12:.13);
  }
  const throwMat=p.linen.clone();throwMat.side=T.DoubleSide;
  const clothGeometry=new T.PlaneGeometry(.62,1.35,20,32),clothPositions=clothGeometry.getAttribute('position');
  for(let i=0;i<clothPositions.count;i++){
    const u=clothPositions.getX(i),t=clothPositions.getY(i)+.675,bend=Math.max(0,t-.64),wave=Math.sin(u*48)*.018;
    clothPositions.setXYZ(i,-3.64+u,.755-bend+wave*(.25+bend),1.23+Math.min(t,.64)+Math.sin(Math.min(1,bend/.12)*Math.PI/2)*.11);
  }
  clothGeometry.computeVertexNormals();const cloth=new T.Mesh(clothGeometry,throwMat);cloth.castShadow=cloth.receiveShadow=true;bench.add(cloth);
  for(let i=0;i<18;i++)rod(bench,new T.Vector3(-3.94+i*.034,.045,1.98),new T.Vector3(-3.94+i*.034,-.005,1.99),.003,p.linen);
  // A pair of tall bookcases encloses the seat; an upper band links them.
  const shelf=new T.Group();shelf.name='Reading house shelves';shelf.userData.role='shelf';root.add(shelf);
  function bookcase(cx:number,cz:number,width:number,height:number,rows:number){
    box(shelf,cx,height/2,cz-.16,width,height,.08,p.darkTimber);
    for(const side of [-1,1])box(shelf,cx+side*width/2,height/2,cz,.1,height,.43,p.timber);
    for(let row=0;row<=rows;row++){
      const y=.12+row*(height-.14)/rows;box(shelf,cx,y,cz,width+.12,.07,.45,p.timber);
      if(row===rows)continue;
      let x=cx-width/2+.11,index=0;
      while(x<cx+width/2-.1){
        const w=.045+((index*7+row*3)%6)*.012,h=.21+((index*3+row*7)%8)*.019;
        const material=p.bookMaterials[(index+row*3)%p.bookMaterials.length];
        block(x+w/2,y+.05+h/2,cz+.035,w,h,.235,material,index%11===8?-.065:0);
        // Spine head/tail and occasional inset binding bands in muted brass.
        block(x+w/2,y+.075,cz+.156,w*.82,.009,.006,p.paper);
        if(index%3===0){block(x+w/2,y+.05+h-.035,cz+.156,w*.82,.009,.006,p.brass);block(x+w/2,y+.11,cz+.156,w*.82,.009,.006,p.brass);}
        x+=w+.012;index++;
      }
    }
    box(shelf,cx,height+.065,cz,width+.23,.13,.56,p.darkTimber,true);
  }
  bookcase(-5.18,.25,1.15,3.08,6);bookcase(-3.35,.25,1.55,3.08,6);
  // Books upstairs are visible through the open room, not additional invented owners.
  bookcase(2.8,-5.92,1.52,2.5,5);
  // Move the upper bookcase geometry and its instanced books above the floor.
  // Its base is separate so the entire collection remains spatially coherent.
  for(const child of shelf.children)if(child.position.z<-5)child.position.y+=3.2;
  for(const entries of batch.values())for(const entry of entries)if(entry.matrix.elements[14]<-5)entry.matrix.elements[13]+=3.2;

  function table(cx:number,cz:number,w:number,d:number,h=.78){
    const table=new T.Group();table.name='Reading table';root.add(table);
    for(let plank=0;plank<5;plank++)box(table,cx-w/2+(plank+.5)*w/5,h,cz,w/5-.008,.08,d,p.timber,true);
    for(const x of [-1,1])for(const z of [-1,1])box(table,cx+x*(w/2-.12),h/2,cz+z*(d/2-.11),.09,h,.09,p.darkTimber,true);
    box(table,cx,.24,cz,w-.1,.08,.07,p.timber);return table;
  }
  table(3.1,2.8,2.1,1.05);table(-3.55,2.75,.64,.62,.55);
  function chair(cx:number,cz:number,rotation=0){
    const group=new T.Group();group.position.set(cx,0,cz);group.rotation.y=rotation;root.add(group);
    box(group,0,.49,0,.48,.07,.46,p.timber,true);
    box(group,0,.54,0,.43,.04,.4,p.indigo,true);
    for(const x of [-.19,.19])for(const z of [-.17,.17])box(group,x,.25,z,.045,.5,.045,p.darkTimber);
    for(const x of [-.21,.21])box(group,x,.87,-.2,.045,.8,.045,p.timber);
    box(group,0,1.15,-.2,.48,.08,.045,p.timber,true);
    for(const x of [-.12,0,.12])box(group,x,.9,-.2,.025,.47,.027,p.timber);
    return group;
  }
  chair(3.12,3.7,0);chair(2.8,1.96,Math.PI);
  table(4.35,-5.52,.62,.62,.68).position.y=3.22;
  chair(4.35,-4.65,0).position.y=3.22;
  function closedBook(x:number,y:number,z:number,w:number,d:number,material:T.Material,angle=0){
    const book=new T.Group();book.position.set(x,y,z);book.rotation.y=angle;root.add(book);
    box(book,0,.022,0,w,.045,d,p.paper);for(const h of [-.005,.049])box(book,0,h,0,w+.025,.012,d+.025,material);box(book,-w/2,.023,0,.018,.062,d+.02,material);
  }
  closedBook(2.53,.855,2.5,.25,.35,p.bookMaterials[1],.23);closedBook(2.55,.92,2.51,.23,.33,p.bookMaterials[4],-.08);
  closedBook(-4.95,.75,1.67,.29,.39,p.bookMaterials[0],.13);
  closedBook(4.35,3.95,-5.52,.24,.32,p.bookMaterials[2],.12);
  // Open pages, a pencil and a ceramic cup make the seats belong to readers.
  const open=new T.Group();open.position.set(-3.55,.6,2.74);open.rotation.y=.2;root.add(open);
  box(open,-.105,.02,0,.2,.027,.28,p.paper).rotation.z=.08;box(open,.105,.02,0,.2,.027,.28,p.paper).rotation.z=-.08;
  rod(root,new T.Vector3(-3.29,.61,2.6),new T.Vector3(-3.24,.61,2.88),.007,p.timber);
  function cup(x:number,y:number,z:number){
    const points=[[.05,0],[.065,.025],[.074,.11],[.077,.13],[.064,.13],[.059,.035]].map(([r,h])=>new T.Vector2(r,h));
    const c=new T.Mesh(new T.LatheGeometry(points,20),p.linen);c.position.set(x,y,z);c.castShadow=c.receiveShadow=true;root.add(c);
    const handle=new T.Mesh(new T.TorusGeometry(.045,.009,6,16),p.blue);handle.position.set(x+.075,y+.075,z);root.add(handle);
    const drink=new T.Mesh(new T.CircleGeometry(.062,20),p.darkTimber);drink.rotation.x=-Math.PI/2;drink.position.set(x,y+.105,z);root.add(drink);
  }
  cup(-3.74,.6,2.6);cup(3.68,.83,2.5);
  // A small stack of loose paper lies under a smooth stone on the main table.
  for(let i=0;i<3;i++)box(root,3.23+i*.006,.835+i*.004,2.74,.43,.004,.31,p.paper).rotation.y=.14+i*.025;
  const weight=new T.Mesh(new T.SphereGeometry(.075,12,8),p.stone);weight.scale.set(1,.5,.7);weight.position.set(3.25,.88,2.73);root.add(weight);

  box(root,-4.1,1.08,.48,.5,.07,.5,p.timber);
  const lamp=new T.Group();lamp.name='Reading house lamp';lamp.userData.role='light';lamp.position.set(-4.1,0,.61);root.add(lamp);
  const base=new T.Mesh(new T.CylinderGeometry(.12,.16,.05,20),p.brass);base.position.y=1.12;lamp.add(base);
  rod(lamp,new T.Vector3(0,1.12,0),new T.Vector3(0,1.72,0),.013,p.brass);
  rod(lamp,new T.Vector3(0,1.72,0),new T.Vector3(.2,1.72,.1),.013,p.brass);
  const shade=new T.Mesh(new T.ConeGeometry(.14,.12,24,1,true),p.brass);shade.position.set(.2,1.66,.1);shade.castShadow=true;lamp.add(shade);
  const bulbMaterial=new T.MeshBasicMaterial({color:0xffd497});
  const bulb=new T.Mesh(new T.SphereGeometry(.037,12,8),bulbMaterial);bulb.position.set(.2,1.6,.1);lamp.add(bulb);
  const lampLight=new T.PointLight(0xffcf8c,3.2,3,2);lampLight.position.set(.2,1.58,.1);lamp.add(lampLight);
  // A woven rug made of visible threads and a border, catching the same real shadows.
  box(root,-3.75,.017,3.5,2.65,.018,1.6,p.linen);
  for(const z of [2.78,4.22])box(root,-3.75,.03,z,2.58,.004,.1,p.terracotta);
  for(let i=0;i<46;i++)block(-5.04+i*.057,.035,3.5,.009,.003,1.46,i%3===0?p.indigo:p.paper);
  for(const z of [2.66,4.34])for(let i=0;i<39;i++)block(-5.03+i*.068,.02,z,.014,.005,.17,p.linen);
  plant(-5.45,.04,3.65,.66);plant(-2.15,.02,.1,.58);plant(4.85,.02,2.4,.7);plant(.15,.02,-4.6,.5);plant(3.65,3.22,-3.85,.37);
  pot(1.1,.01,-3.6,.45,p.linen);pot(-1.8,.01,-4.65,.36);
  for(const [material,entries] of batch){
    const mesh=new T.InstancedMesh(cube,material,entries.length);entries.forEach((entry,i)=>mesh.setMatrixAt(i,entry.matrix));mesh.castShadow=mesh.receiveShadow=true;mesh.name='Furnishing detail';root.add(mesh);
  }
  return {root,objects:{bench,shelf,lamp},lampLight,bulbMaterial};
}
