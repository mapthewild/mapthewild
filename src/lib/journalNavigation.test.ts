import { describe, it, expect } from 'vitest';
import { journalNavigation } from './journalNavigation';
import { standaloneEssays } from './standaloneEssays';
import { canonicalTerritory } from './territories';
import { futureDadsEpisodes } from './futureDadsEpisodes';
import { headerMarkup, voyageMarkup, departureMarkup, mobileMarkup } from '../../public/journal/markup.mjs';
const post=(slug:string,island='nowbrary',draft=false)=>({slug,data:{title:slug,date:new Date('2026-01-0'+slug.at(-1)),islands:[island],draft}});
describe('shared journal navigation',()=>{
  it('recognizes each standalone essay and keeps its real address',()=>{
    for(const essay of standaloneEssays){const nav=journalNavigation(essay.href,standaloneEssays);expect(nav.isArticle).toBe(true);expect(nav.stops.find(p=>p.current)?.href).toBe(essay.href);expect(nav.territory).toBe(canonicalTerritory(essay.data.islands[0]));}
  });
  it('keeps the entire reading route and the current post as a collection grows',()=>{
    const entries=Array.from({length:7},(_,i)=>post('post'+(i+1)));
    const nav=journalNavigation('/mapthewild/posts/post4/',entries);
    expect(nav.stops.map(p=>p.title)).toEqual(['Nowbrary',...entries.map(p=>p.data.title)]);
    expect(nav.next?.href).toBe('/mapthewild/posts/post5');
  });
  it('does not expose drafts and starts a series at the beginning',()=>{
    const nav=journalNavigation('/mapthewild/islands/nowbrary/',[post('post1'),post('post2','nowbrary',true),post('post3'),post('post4'),post('post5')]);
    expect(nav.stops.map(p=>p.title)).toEqual(['Nowbrary','post1','post3','post4','post5']);
    expect(nav.stops[1].meta).toBe('Part 1 of 4');
  });
  it('includes every podcast episode in the scrollable route',()=>{
    const nav=journalNavigation('/mapthewild/islands/futuredads/',futureDadsEpisodes);
    expect(nav.stops).toHaveLength(futureDadsEpisodes.length+1);
    expect(new Set(nav.stops.slice(1).map(p=>p.href))).toEqual(new Set(futureDadsEpisodes.map(p=>p.href)));
    expect(nav.collection.title).toBe('All episodes');
  });
  it('joins old Territory essays to Map without changing authored metadata or addresses',()=>{
    const snapshot=JSON.stringify(standaloneEssays);
    const nav=journalNavigation('/mapthewild/the-mapping-problem.html',standaloneEssays);
    expect(nav.artTitle).toBe('Map');
    expect(nav.collection.href).toBe('/mapthewild/islands/map');
    expect(nav.stops.slice(1).map(p=>p.href)).toEqual(standaloneEssays.map(p=>p.href));
    expect(JSON.stringify(standaloneEssays)).toBe(snapshot);
  });
  it('offers Explore only in the site header, with one page-ending route',()=>{
    const nav=journalNavigation('/mapthewild/the-mapping-problem.html',standaloneEssays);
    document.body.innerHTML=headerMarkup(nav)+voyageMarkup(nav)+departureMarkup()+mobileMarkup(nav);
    expect(document.querySelectorAll('[data-journal-explore]')).toHaveLength(1);
    expect(document.querySelector('[data-journal-explore]')?.closest('header')).not.toBeNull();
    expect(document.querySelectorAll('.journal-departure a')).toHaveLength(0);
    expect(document.querySelectorAll('[data-route-scroll]')).toHaveLength(2);
  });
  it('keeps all six places on the directory without claiming one is current',()=>{
    const nav=journalNavigation('/mapthewild/islands/',[]);
    expect(nav.stops).toHaveLength(6);expect(nav.stops.some(s=>s.current)).toBe(false);
    expect(nav.artHref).toBe('/mapthewild/islands/');
  });
});
