import { it, expect, vi } from 'vitest';
import { journalNavigation } from './journalNavigation';
import { standaloneEssays } from './standaloneEssays';

it('adds the shared reading route without changing essay text or duplicating footer navigation', async () => {
  const data=journalNavigation('/mapthewild/the-mapping-problem.html',standaloneEssays);
  const original='The words of the essay stay exactly as written.';
  document.body.className='';
  document.body.setAttribute('data-journal-essay','');
  document.body.innerHTML=`<nav class="essay-nav"><a href="/mapthewild/posts">Posts</a></nav><article class="prose"><h1>The Mapping Problem</h1><p>${original}</p></article><nav class="essay-footer"><a href="/mapthewild/the-glass-blower.html">Previous: The Glass Blower</a><a class="all-posts" href="/mapthewild/posts">Posts</a></nav><nav class="reading-world-mode">Read <a href="/mapthewild/explore">Explore</a></nav>`;
  window.history.replaceState({},'',data.path);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>[data]}));
  vi.stubGlobal('matchMedia',()=>({matches:true}));
  Object.defineProperty(document,'fonts',{value:{ready:Promise.resolve()},configurable:true});
  await import('../../public/journal/journal.js');
  await Promise.resolve();
  expect(document.querySelector('.prose p')?.textContent).toBe(original);
  expect(document.querySelector('.essay-footer .all-posts')).toBeNull();
  expect(document.querySelector('.essay-footer a')?.textContent).toBe('Previous: The Glass Blower');
  expect(document.querySelectorAll('[data-journal-explore]')).toHaveLength(1);
  expect(document.querySelectorAll('.journal-footer')).toHaveLength(1);
  expect(document.querySelector('.journal-window')?.textContent).toContain('Map');
  expect(document.querySelectorAll('.journal-stop')).toHaveLength(4);
  expect(document.querySelector('.reading-world-mode')).toBeNull();
  vi.unstubAllGlobals();
});
