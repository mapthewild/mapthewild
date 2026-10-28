// Shared by Astro reading pages and the three standalone HTML essays.
// Complete site paths let the mapthewild.xyz publication rewrite see every address.
(() => {
  // The surrounding reading page already supplies the mode switch inside a pane.
  if (window.parent !== window) document.querySelector('.reading-world-mode')?.remove();
  const safeReadHref = value =>
    typeof value === 'string' && value.startsWith('/mapthewild/') &&
    !value.startsWith('//') && !value.startsWith('/mapthewild/explore') &&
    !/[\\\r\n]/.test(value) ? value : '/mapthewild/';
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const target = new URL(link.href, location.href);
    const journalEntry = link.hasAttribute('data-journal-explore');
    if (target.origin !== location.origin || (!journalEntry && target.pathname.replace(/\/$/, '') + '/' !== '/mapthewild/explore/')) return;
    // A pane returns to its full blog post, rather than leaving the reader in an embed.
    const path = document.body.dataset.readingHref || location.pathname + location.search + location.hash;
    if (journalEntry) target.searchParams.set('returnTo', safeReadHref(path));
    try {
      sessionStorage.setItem('mtw-read-return', JSON.stringify({ href: safeReadHref(path), scroll: document.body.dataset.readingHref ? 0 : window.scrollY }));
      const memory = JSON.parse(sessionStorage.getItem('mtw-world-v1') || 'null');
      if ((journalEntry || link.hasAttribute('data-world-mode')) && memory?.entered === true) {
        target.searchParams.delete('port'); target.searchParams.delete('shore'); link.href = target.href; return;
      }
    } catch { /* Navigation works when storage is unavailable. */ }
    if (!target.searchParams.has('port')) {
      const port = path.includes('nowbrary') ? 'nowbrary' : path.includes('futuredads') ? 'future-dads' : path.includes('sundayritual') || path.includes('soulfield') ? 'together' : null;
      if (port) target.searchParams.set(journalEntry ? 'shore' : 'port', port);
    }
    link.href = target.href;
  });
  try {
    const requested = sessionStorage.getItem('mtw-restore-reading');
    const record = JSON.parse(sessionStorage.getItem('mtw-read-return') || 'null');
    if (requested) {
      sessionStorage.removeItem('mtw-restore-reading');
      if (record && safeReadHref(record.href) === location.pathname + location.search + location.hash && Number.isFinite(record.scroll)) {
        const restore = () => requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, record.scroll), behavior: 'instant' })));
        const ready = () => document.fonts.ready.then(restore);
        if (document.body.hasAttribute('data-journal-essay') && !document.body.dataset.journalReady) document.addEventListener('mtw:journal-ready', ready, { once: true });
        else if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready, { once: true });
      }
    }
  } catch { /* Reading does not depend on stored state. */ }
})();
