import {SHELF_X,isReader,type ReaderId} from './shelf-data';
export type FootPoint = [number, number, number];
export type WalkPlace = 'quay' | 'shop' | 'garden' | ReaderId;
export type FootNode = 'boat' | 'jetty' | 'steps' | 'quay' | 'corner' | 'threshold' | 'hall' | WalkPlace;
export const FOOT_POINTS: Record<FootNode, FootPoint> = {
  boat: [9,.78,14],jetty:[9,.78,12.6],steps:[9,1.16,9.4],quay:[11.1,1.26,9.4],
  corner:[16.5,1.26,9.4],threshold:[16.5,1.12,7.35],shop:[16.5,1.12,5.7],hall:[15,1.12,5.7],garden:[18.8,1.18,9.4],
  moe:[SHELF_X.moe-.55,1.12,4.9],melville:[SHELF_X.melville-.55,1.12,4.9],montaigne:[SHELF_X.montaigne-.55,1.12,4.9],
};
export const WALK_PLACES:Record<WalkPlace,{title:string;action:string;point:FootPoint}>={
  quay:{title:'The quay',action:'Walk to the quay',point:FOOT_POINTS.quay},
  shop:{title:'Nowbrary',action:'Enter the bookshop',point:FOOT_POINTS.shop},
  garden:{title:'Shaded terrace',action:'Walk to the shade',point:FOOT_POINTS.garden},
  moe:{title:'Moe',action:'Walk to Moe’s shelf',point:FOOT_POINTS.moe},
  melville:{title:'Melville',action:'Walk to Melville’s shelf',point:FOOT_POINTS.melville},
  montaigne:{title:'Montaigne',action:'Walk to Montaigne’s shelf',point:FOOT_POINTS.montaigne},
};
const edges:[FootNode,FootNode][]=[['boat','jetty'],['jetty','steps'],['steps','quay'],['quay','corner'],['corner','threshold'],['threshold','shop'],['corner','garden'],['shop','hall'],['hall','moe'],['hall','melville'],['shop','montaigne']];
export function isWalkPlace(value:unknown):value is WalkPlace{return value==='quay'||value==='shop'||value==='garden'||isReader(value);}
export function isInside(value:unknown){return value==='shop'||isReader(value);}
export function footRoute(from:FootNode,to:FootNode):FootPoint[]{
  const queue:FootNode[][]=[[from]],visited=new Set<FootNode>();
  while(queue.length){const path=queue.shift()!,last=path.at(-1)!;if(last===to)return path.map(key=>[...FOOT_POINTS[key]]);if(visited.has(last))continue;visited.add(last);for(const[a,b]of edges){if(a===last&&!visited.has(b))queue.push([...path,b]);if(b===last&&!visited.has(a))queue.push([...path,a]);}}
  return [];
}
