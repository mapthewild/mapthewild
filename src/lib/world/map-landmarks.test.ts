import {afterAll,describe,expect,it} from 'vitest';
import {Box3,Mesh,PerspectiveCamera,Raycaster,Vector3} from 'three';
import {createMapLandmarks} from './map-landmarks';
import {MAP_ISLANDS} from './map-islands';

describe('Solid islands in the sea map',()=>{
  const landmarks=createMapLandmarks();
  afterAll(()=>landmarks.dispose());
  it('has elevated scenery and finished backs that can be selected from either side',()=>{
    for(const island of landmarks.islands){
      island.updateMatrixWorld(true);
      const bounds=new Box3().setFromObject(island),size=bounds.getSize(new Vector3()),centre=bounds.getCenter(new Vector3());
      expect(size.y).toBeGreaterThan(10);
      expect(size.z).toBeGreaterThan(15);
      const target=centre.clone();target.y=.6;
      for(const side of [-1,1]){
        const eye=target.clone().add(new Vector3(10,35,side*35));
        const ray=new Raycaster(eye,target.clone().sub(eye).normalize());
        expect(landmarks.hit(ray)).toBe(island.userData.port);
      }
      // A changed viewpoint must produce parallax between the tree and shore.
      const lower=new Vector3(centre.x+5,.6,centre.z),upper=new Vector3(centre.x,10,centre.z);
      const camera=new PerspectiveCamera(34,1,2,1000);
      camera.position.copy(centre).add(new Vector3(0,35,45));camera.lookAt(centre);camera.updateMatrixWorld();
      const front=upper.clone().project(camera).sub(lower.clone().project(camera));
      camera.position.copy(centre).add(new Vector3(40,35,20));camera.lookAt(centre);camera.updateMatrixWorld();
      const side=upper.clone().project(camera).sub(lower.clone().project(camera));
      expect(front.distanceTo(side)).toBeGreaterThan(.001);
      expect(island.position.x).toBe(MAP_ISLANDS[island.userData.port as keyof typeof MAP_ISLANDS].port[0]);
    }
  });
  it('uses a small number of merged draws and no island image textures',()=>{
    let draws=0,vertices=0;
    for(const island of landmarks.islands)island.traverse(object=>{
      if(!(object instanceof Mesh))return;draws++;
      const position=object.geometry.attributes.position;vertices+=position.count;
      expect(Array.from(position.array).every(Number.isFinite)).toBe(true);
      for(const material of Array.isArray(object.material)?object.material:[object.material])expect(material.map).toBeFalsy();
    });
    expect(draws).toBeLessThanOrEqual(8);
    expect(vertices).toBeLessThan(1500000);
  });
});
