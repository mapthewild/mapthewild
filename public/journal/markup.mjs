const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Keep the external-link arrow attached to the final word on narrow screens.
const linkTitle = (title, href) => {
  if (!href.startsWith('https://')) return esc(title);
  const split = title.lastIndexOf(' ');
  return `${split < 0 ? '' : esc(title.slice(0,split))+' '}<span class="journal-link-tail">${esc(title.slice(split+1))} <span aria-hidden="true">↗</span></span>`;
};
export function headerMarkup(data) {
  const selected = href => data.path === href.replace(/\/$/,'') ? ' aria-current="page"' : '';
  return `<a class="journal-skip" href="#journal-content">Skip to content</a><header class="journal-header"><a class="journal-brand" href="/mapthewild/"><img class="journal-mark" src="/mapthewild/world/marks/mapthewild.png" alt="" width="34" height="34">Map the Wild</a><nav aria-label="Main"><a href="/mapthewild/posts/"${selected('/mapthewild/posts/')}>Writing</a><a href="/mapthewild/islands/"${selected('/mapthewild/islands/')}>Places</a><a href="/mapthewild/?explore=1#explore-entry" data-journal-explore>Explore</a></nav></header>`;
}
export function voyageMarkup(data) {
  const collectionLink = data.isArticle ? `<a href="${esc(data.collection.href)}">${esc(data.collection.title)}</a>` : '';
  return `<section class="journal-voyage" aria-label="Places and writing">
    <a class="journal-window" href="${esc(data.artHref)}"${data.art.crop?` data-crop="${esc(data.art.crop)}"`:''} style="background-image:url('${esc(data.art.src)}');background-position:${esc(data.art.position)};background-size:${esc(data.art.size)}"><span>${esc(data.artTitle)} <span aria-hidden="true">→</span></span></a>
    <div class="journal-route">
      <div class="journal-route-heading">
        <nav aria-label="From this place"><a href="/mapthewild/">Home</a><a href="/mapthewild/islands/">Places</a>${collectionLink}</nav>
        <div class="journal-scroll-controls" hidden><button type="button" data-route-scroll="-1" aria-label="Previous items" aria-controls="journal-reading-route">←</button><button type="button" data-route-scroll="1" aria-label="Next items" aria-controls="journal-reading-route">→</button></div>
      </div>
      <div class="journal-route-scroll" id="journal-reading-route" tabindex="0" aria-label="${esc(data.artTitle)} navigation"><div class="journal-route-board">
        <svg class="journal-route-lines" aria-hidden="true"></svg><img class="journal-boat" src="/mapthewild/journal/traveller-boat.png" alt="" width="68" aria-hidden="true">
        <nav class="journal-stops" aria-label="Reading route">${data.stops.map(p=>`<a href="${esc(p.href)}" class="journal-stop" aria-label="${esc(p.title+(p.meta?', '+p.meta:'')+(p.current?', current page':''))}"${p.current?' aria-current="page"':''}><span class="journal-marker" aria-hidden="true">${p.kind==='post'?'⌁':'⚑'}</span><span class="journal-stop-title">${linkTitle(p.title,p.href)}</span><span class="journal-stop-meta">${esc(p.meta)}${p.current?' · Here':''}</span></a>`).join('')}</nav>
      </div></div>
    </div>
  </section>`;
}
export function departureMarkup() {
  return `<section class="journal-departure" aria-label="Places and writing after the article"><div id="journal-end-slot"></div></section>`;
}
export function mobileMarkup(data) {
  return `<nav class="journal-mobile" aria-label="Reading and voyage" hidden><button type="button" id="journal-open-voyage">Voyage</button><a href="${esc(data.next?.href ?? (data.collection.title==='About this place'?'/mapthewild/islands/':data.collection.href))}">${data.next?'Next post →':data.collection.title==='About this place'?'Places →':esc(data.collection.title)+' →'}</a></nav><dialog class="journal-dialog" id="journal-voyage-dialog" aria-labelledby="journal-voyage-title"><div class="journal-dialog-heading"><span id="journal-voyage-title">Your voyage</span><button type="button" id="journal-close-voyage">Close ×</button></div><div id="journal-dialog-slot"></div></dialog>`;
}
