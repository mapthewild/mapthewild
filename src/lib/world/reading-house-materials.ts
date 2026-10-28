import * as T from 'three';

/** Local, deterministic material painting. No remote textures or image-plane scenery. */
export function createHousePalette(){
  const textures:T.Texture[]=[];
  function surface(kind:'plaster'|'stone'|'timber'|'cloth'|'paper'){
    const size=256,data=new Uint8Array(size*size*4);let seed=731;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      let value=230;
      const fine=random()-.5,cloud=Math.sin(x*.035+Math.sin(y*.041)*2)*Math.sin(y*.047+x*.008);
      if(kind==='plaster')value=235+cloud*8+fine*16;
      if(kind==='stone')value=225+cloud*12+fine*23+(random()>.99?-25:0);
      if(kind==='timber')value=208+Math.sin(x*.38+Math.sin(y*.025)*1.6+Math.sin(x*.018)*3)*13+Math.sin(x*1.13+y*.009)*7+fine*12;
      if(kind==='cloth')value=231+(x%4<2?6:-6)+(y%4<2?5:-5)+fine*9;
      if(kind==='paper')value=238+(y%3===0?-13:0)+fine*5;
      const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,value));data[i+3]=255;
    }
    const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;texture.anisotropy=4;textures.push(texture);return texture;
  }
  const plasterMap=surface('plaster'),stoneMap=surface('stone'),woodMap=surface('timber'),clothMap=surface('cloth'),paperMap=surface('paper');
  function painted(color:number,map:T.Texture,roughness=.9,bump=.015){return new T.MeshStandardMaterial({color,map,bumpMap:map,bumpScale:bump,roughness});}
  const leafMap=(()=>{
    const n=64,data=new Uint8Array(n*n*4);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const u=(x+.5)/n,v=(y+.5)/n,width=Math.sin(v*Math.PI)*.34;
      const inside=Math.abs(u-.5)<width;const i=(y*n+x)*4;
      const shade=210+Math.sin(v*50)*8+(u<.5?18:0)+(Math.abs(u-.5)<.018?18:0);
      data[i]=data[i+1]=data[i+2]=shade;data[i+3]=inside?255:0;
    }
    const t=new T.DataTexture(data,n,n);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.push(t);return t;
  })();
  return {
    plaster:painted(0xf0e5cf,plasterMap,.98,.022),
    stone:painted(0xe0cba8,stoneMap,.95,.035),
    floor:painted(0xd9c5a2,stoneMap,.94,.022),
    timber:painted(0x8f653f,woodMap,.82,.025),
    darkTimber:painted(0x493728,woodMap,.85,.02),
    blue:painted(0x3b7185,woodMap,.88,.014),
    terracotta:painted(0xaf6950,stoneMap,.9,.018),
    brass:new T.MeshStandardMaterial({color:0xb99454,roughness:.36,metalness:.65}),
    iron:new T.MeshStandardMaterial({color:0x363b32,roughness:.73,metalness:.45}),
    leaf:new T.MeshStandardMaterial({color:0x657647,map:leafMap,side:T.DoubleSide,alphaTest:.45,roughness:.95}),
    leafLight:new T.MeshStandardMaterial({color:0x8c945e,map:leafMap,side:T.DoubleSide,alphaTest:.45,roughness:.95}),
    flower:new T.MeshStandardMaterial({color:0xcd5070,roughness:.85,side:T.DoubleSide}),
    linen:painted(0xc5a47b,clothMap,.98,.012),
    indigo:painted(0x406b85,clothMap,.96,.012),
    paper:painted(0xe8d8b7,paperMap,.95,.006),
    glass:new T.MeshStandardMaterial({color:0x9bc2bc,transparent:true,opacity:.15,roughness:.16,metalness:.15,depthWrite:false}),
    bookMaterials:[0x597070,0x9b5646,0xb09361,0x5d6450,0x746073,0x414c57].map(color=>painted(color,clothMap,.92,.006)),
    textures,
  };
}
export type HousePalette=ReturnType<typeof createHousePalette>;
export function disposeHousePalette(palette:HousePalette){
  const materials=new Set<T.Material>();
  for(const value of Object.values(palette)){if(value instanceof T.Material)materials.add(value);else if(Array.isArray(value))for(const item of value)if(item instanceof T.Material)materials.add(item);}
  materials.forEach(material=>material.dispose());palette.textures.forEach(texture=>texture.dispose());
}
