export type ReaderId='moe'|'melville'|'montaigne';
export type ShelfBook={id:string;title:string;author:string;volIndex:number;thick:number;tall:number;depth:number;row:number;cloth:string;tex:string};
export type ShelfReader={id:ReaderId;name:string;page:string;contemporary:boolean;look:{wood:string;recess:string};books:ShelfBook[]};
export type BookChoice={reader:ReaderId;page:string;book:ShelfBook;rect:{x:number;y:number;w:number;h:number}};
export const SHELF_X:Record<ReaderId,number>={moe:12.85,melville:15.05,montaigne:17.2};
export function isReader(id:unknown):id is ReaderId{return id==='moe'||id==='melville'||id==='montaigne';}

