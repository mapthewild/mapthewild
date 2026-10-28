import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import config from '../../../public/journey/config.json';

describe('crossing when the other website is unavailable',()=>{
 beforeEach(()=>{vi.resetModules();sessionStorage.clear();document.body.innerHTML='';});
 afterEach(()=>{vi.unstubAllGlobals();});
 it('keeps the current page and provides a working Stay here action',async()=>{
  const local=structuredClone(config);local.sites.mapthewild.origin=location.origin;
  const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>local}).mockRejectedValue(new Error('offline'));
  vi.stubGlobal('fetch',fetcher);
  const {connectJourney}=await import('../../../public/journey/client.mjs');
  const journey=await connectJourney();expect(journey?.site).toBe('mapthewild');
  const cancelled=vi.fn();document.addEventListener('journey:cancel',cancelled,{once:true});
  expect(await journey.go('future-dads','jetty')).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(document.body.textContent).toContain('That place could not open.');
  const stay=[...document.querySelectorAll('button')].find(b=>b.textContent==='Stay here')!;
  expect(document.activeElement).toBe(stay);stay.click();
  expect(cancelled).toHaveBeenCalledOnce();expect(document.querySelector('[role="alert"]')).toBeNull();
  expect(document.body.classList.contains('journey-leaving')).toBe(false);
 });
 it('does not cross into a different site accidentally deployed at the target',async()=>{
  const local=structuredClone(config);local.sites.mapthewild.origin=location.origin;
  const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>local}).mockResolvedValue({ok:true,json:async()=>({version:1,site:'nowbrary'})});vi.stubGlobal('fetch',fetcher);
  const {connectJourney}=await import('../../../public/journey/client.mjs');const journey=await connectJourney();
  expect(await journey.go('future-dads','jetty')).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(document.querySelector('[role="alert"]')).not.toBeNull();
 });
 it('gives an owned sea iframe a return to its surrounding reading page',async()=>{
  const local=structuredClone(config);local.sites.mapthewild.origin=location.origin;
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>local}));
  await import('../../../public/journey/native.mjs');
  const denied={source:{},trail:null};document.dispatchEvent(new CustomEvent('journey:checkpoint',{detail:denied}));
  expect(denied.trail).toBeNull();
  const frame=document.createElement('iframe');frame.id='sea-frame';document.body.innerHTML='<section id="explore-entry"></section>';document.body.append(frame);vi.stubGlobal('scrollY',900);
  const accepted:{source:Window|null;trail:any}= {source:frame.contentWindow,trail:null};
  document.dispatchEvent(new CustomEvent('journey:checkpoint',{detail:accepted}));
  expect(accepted.trail).toHaveLength(1);expect(accepted.trail[0]).toMatchObject({site:'mapthewild',kind:'writing'});
  const saved=JSON.parse(sessionStorage.getItem('journey:bookmark:'+accepted.trail[0].id)!);
  expect(saved.href).toBe(location.pathname+location.search);expect(saved.scroll).toBe(0);
 });
});
