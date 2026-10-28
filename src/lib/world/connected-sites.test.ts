import {describe,it,expect} from 'vitest';
import {safePath,validConfig,decodeTicket,destination,readBookmark,pushTrail} from '../../../public/journey/core.mjs';
import config from '../../../public/journey/config.json';
const crumb={site:'future-dads',id:'abcdefghijklmnop',kind:'episode'};
describe('independent site journeys',()=>{
 it('uses fixed destinations on distinct origins',()=>{
  expect(validConfig(config)).toBe(true);
  const u=new URL(destination(config,'nowbrary','jetty',{trail:[crumb],from:'future-dads'}));
  expect(u.origin).toBe('http://127.0.0.1:4341');expect(u.pathname).toBe('/explore/');
  expect(decodeTicket(u.searchParams.get('journey'))).toMatchObject({to:'nowbrary',entry:'jetty',trail:[crumb]});
 });
 it('does not accept an arbitrary return address or a credential-bearing site',()=>{
  for(const path of ['//evil.test/','/\\evil.test/','https://evil.test/','javascript:alert(1)','/\nheader'])expect(safePath(path)).toBeNull();
  const bad=structuredClone(config);bad.sites.nowbrary.origin='https://secret@example.com';expect(validConfig(bad)).toBe(false);
  expect(()=>destination(config,'https://evil.test','jetty',{})).toThrow();
 });
 it('rejects a misconfigured site boundary or room path',()=>{
  const same=structuredClone(config);same.sites.nowbrary.origin=same.sites.mapthewild.origin;expect(validConfig(same)).toBe(false);
  const room=structuredClone(config);room.sites['future-dads'].room='//another.example/';expect(validConfig(room)).toBe(false);
 });
 it('passes no reading or listening data across origins',()=>{
  const value=JSON.stringify({v:1,to:'nowbrary',entry:'jetty',trail:[{...crumb,url:'https://evil.test',time:30}],audio:'private',resume:'abcdefghijklmnop'});
  expect(decodeTicket(value)).toEqual({v:1,to:'nowbrary',entry:'jetty',from:undefined,resume:'abcdefghijklmnop',trail:[crumb]});
 });
 it('bounds journeys and rejects malformed tickets',()=>{
  for(const value of ['{','x'.repeat(6001),JSON.stringify({v:1,to:'nowbrary',entry:'jetty',trail:[{...crumb,id:'../x'}]}),JSON.stringify({v:1,to:'nowbrary',entry:'jetty',trail:Array(13).fill(crumb)})])expect(decodeTicket(value)).toBeNull();
  expect(pushTrail(Array(12).fill(crumb),crumb)).toHaveLength(12);
 });
 it('returns only to unexpired local bookmarks, and tolerates denied storage',()=>{
  const now=Date.now(),saved={href:'/episodes/song/#notes',at:now,scroll:140,audio:[{time:56}]};
  expect(readBookmark({getItem:()=>JSON.stringify(saved)},crumb.id,now)).toEqual(saved);
  expect(readBookmark({getItem:()=>JSON.stringify({...saved,at:now-86400001})},crumb.id,now)).toBeNull();
  expect(readBookmark({getItem:()=>JSON.stringify({...saved,href:'//evil.test/'})},crumb.id,now)).toBeNull();
  expect(readBookmark({getItem:()=>{throw Error('blocked');}},crumb.id)).toBeNull();
 });
 it('uses a destination-owned return page, never a source-supplied redirect',()=>{
  const u=new URL(destination(config,'future-dads','jetty',{resume:crumb.id,trail:[]}));
  expect(u.origin).toBe(config.sites['future-dads'].origin);expect(u.pathname).toBe('/journey/return.html');
 });
});
