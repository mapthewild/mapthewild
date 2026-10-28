// Only fixed site IDs and opaque, per-tab bookmark IDs cross the domain boundary.
export const SITES=['mapthewild','nowbrary','future-dads'];
export const ENTRIES=['sea','jetty','radio','room','content'];
const TOKEN=/^[a-zA-Z0-9_-]{12,64}$/;
export function safePath(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return null;
 try {const u=new URL(value,'https://local.invalid');return u.origin==='https://local.invalid'?u.pathname+u.search+u.hash:null;}catch{return null;}
}
export function validConfig(config){
 if(!config||config.version!==1||!config.sites)return false;
 if(new Set(SITES.map(id=>config.sites[id]?.origin)).size!==SITES.length)return false;
 return SITES.every(id=>{try{const s=config.sites[id],u=new URL(s.origin);return u.origin===s.origin&&!u.username&&!u.password&&(u.protocol==='https:'||(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))&&['home','explore','return'].every(key=>safePath(s[key]))&&(!s.room||!!safePath(s.room));}catch{return false;}});
}
export function decodeTicket(value){
 try{
  if(typeof value!=='string'||value.length>6000)return null;
  const v=JSON.parse(decodeURIComponent(value));
  if(v.v!==1||!SITES.includes(v.to)||!ENTRIES.includes(v.entry)||!Array.isArray(v.trail)||v.trail.length>12)return null;
  if(v.resume!==undefined&&!TOKEN.test(v.resume))return null;
  if(v.from!==undefined&&!SITES.includes(v.from))return null;
  if(!v.trail.every(c=>SITES.includes(c.site)&&TOKEN.test(c.id)&&['episode','shelf','writing','place','sea'].includes(c.kind)))return null;
  return {v:1,to:v.to,entry:v.entry,from:v.from,resume:v.resume,trail:v.trail.map(({site,id,kind})=>({site,id,kind}))};
 }catch{return null;}
}
export function destination(config,site,entry,ticket){
 if(!validConfig(config)||!SITES.includes(site)||!ENTRIES.includes(entry))throw Error('Unknown destination');
 const s=config.sites[site],path=ticket?.resume?s.return:entry==='content'?s.home:entry==='room'?(s.room||s.explore):s.explore;
 const u=new URL(path,s.origin);u.searchParams.set('entry',entry);
 if(ticket)u.searchParams.set('journey',JSON.stringify({...ticket,v:1,to:site,entry}));
 return u.href;
}
export function pushTrail(trail,crumb){return [...trail.slice(-11),crumb];}
export function readBookmark(storage,id,now=Date.now()){
 if(!TOKEN.test(id||''))return null;
 try{const b=JSON.parse(storage.getItem('journey:bookmark:'+id)||'null');if(!b||!safePath(b.href)||!Number.isFinite(b.at)||now-b.at>86400000||b.at>now+60000)return null;return b;}catch{return null;}
}
export function returnLabel(kind){return {episode:'Back to your episode',shelf:'Back to your shelf',writing:'Back to writing',place:'Back to the landing',sea:'Back to sea'}[kind]||'Back';}
