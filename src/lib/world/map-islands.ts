/** Stable coast and mooring measurements retained from the approved map references. */
type Point=[number,number];
export type MapIslandId='nowbrary'|'future-dads';
export const MAP_ISLANDS={
 nowbrary:{file:'nowbrary-map-v1.png',pixels:[1585,992],width:40,mooring:[790,965],port:[22,24]},
 'future-dads':{file:'future-dads-map-v1.png',pixels:[1536,1024],width:28,mooring:[700,940],port:[17,55]},
} satisfies Record<MapIslandId,{file:string;pixels:Point;width:number;mooring:Point;port:Point}>;
const horizontal=Math.hypot(6,65),right=[65/horizontal,-6/horizontal],down=[6/horizontal,65/horizontal];
const elevation=57/Math.hypot(6,57,65);
/** Reference-image measurements locate the 3D coast and its boat stop. */
export function mapSeaPoint(id:MapIslandId,pixel:Point):Point{
 const a=MAP_ISLANDS[id],scale=a.width/a.pixels[0],x=(pixel[0]-a.mooring[0])*scale,z=(pixel[1]-a.mooring[1])*scale/elevation;
 return[a.port[0]+right[0]*x+down[0]*z,a.port[1]+right[1]*x+down[1]*z];
}
// Trace the solid shoreline, excluding the transparent margin and shallow water.
const outlines:Record<MapIslandId,Point[]>={
 nowbrary:[[115,535],[260,425],[400,270],[850,180],[1230,315],[1440,450],[1490,620],[1320,760],[975,840],[795,875],[510,825],[240,720],[100,620]],
 'future-dads':[[160,460],[320,365],[475,230],[800,210],[1200,315],[1400,470],[1455,580],[1300,700],[1050,785],[800,810],[690,825],[590,790],[320,655],[155,535]],
};
export const MAP_COASTS={nowbrary:outlines.nowbrary.map(p=>mapSeaPoint('nowbrary',p)),'future-dads':outlines['future-dads'].map(p=>mapSeaPoint('future-dads',p))};
