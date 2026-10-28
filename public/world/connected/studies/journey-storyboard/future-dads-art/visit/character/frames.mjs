// UV windows into the original, unmodified PNGs. Anchors mark contact with the deck/path.
export const characterId='future-dads-02';
export const sheets={
 walking:{url:'./character/art/walking-front-back-v4.webp',size:[1024,1536]},
 returning:{url:'./character/art/walking-v2.webp',size:[1536,1024]},
 boarding:{url:'./character/art/boarding-v1.webp',size:[1536,1024]}
};
// sheet, bounds, foot anchor, displayed body height in world units, mirror
// Use only back and rear-three-quarter drawings. The visitor is not a face-on portrait.
export const frames=[
 ['walking',[183,23,443,747],[319,734],1.72,false],
 ['walking',[582,23,829,730],[705,718],1.70,true],
 ['walking',[183,23,443,747],[319,734],1.72,true],
 ['walking',[582,23,829,730],[705,718],1.70,false],
 ['returning',[121,27,384,516],[248,507],1.72,true],
 ['returning',[526,30,701,506],[610,497],1.70,true],
 ['returning',[857,30,1110,516],[985,507],1.72,true],
 ['returning',[1244,30,1449,505],[1370,496],1.70,true],
 ['boarding',[145,57,435,485],[342,477],1.53],
 ['boarding',[615,44,848,490],[737,480],1.59],
 ['boarding',[1142,10,1338,494],[1240,485],1.72],
 ['boarding',[124,508,417,996],[275,986],1.74],
 ['boarding',[597,517,901,995],[713,985],1.72],
 ['boarding',[1113,508,1355,1001],[1220,992],1.74]
];
export const POSE={seated:8,rising:9,standing:10,lift:11,reach:12,land:13,idle:10};

export function walkingPose(position,direction){
 // Spatial phase stops when movement pauses and reverses with the return journey.
 const phase=((Math.floor((position-42)*.68)%4)+4)%4;
 return (direction>0?0:4)+(direction>0?phase:3-phase);
}
