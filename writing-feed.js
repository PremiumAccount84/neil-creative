// Shared by Home and Writing. The daily import preserves the older archive;
// the live RSS feed supplies newly published posts without waiting for it.
(() => {
  const ARCHIVE_URL = 'https://htcunyeepqjcbxlfpcny.supabase.co/rest/v1/writing_posts?select=title,url,excerpt,published_at&order=published_at.desc.nullslast';
  const PUBLISHABLE_KEY = 'sb_publishable_v_UsqCq_AHjTqptN93prDw_yCsZc99t';
  let pending;

  function post(row) {
    let url;
    try { url = new URL(row.url); } catch { return null; }
    if (url.protocol !== 'https:' || url.hostname !== 'thechrisneil.substack.com' || !row.title) return null;
    const stamp = Date.parse(row.published_at);
    const date = Number.isFinite(stamp) ? new Date(stamp) : null;
    return {
      title: row.title, url: url.href, excerpt: row.excerpt || '',
      published_at: date ? date.toISOString() : '',
      date: date ? date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'UTC' }) : '',
      iso: date ? date.toISOString().slice(0, 10) : '',
    };
  }

  function parseFeed(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror') || !doc.querySelector('rss > channel')) throw new Error('Invalid feed');
    return Array.from(doc.querySelectorAll('channel > item')).map(item => {
      const text = name => item.getElementsByTagName(name)[0]?.textContent.trim() || '';
      const description = text('description') || text('content:encoded');
      const excerptDoc = new DOMParser().parseFromString(description, 'text/html');
      excerptDoc.querySelectorAll('script, style').forEach(el => el.remove());
      return post({ title:text('title'), url:text('link'), published_at:text('pubDate'), excerpt:(excerptDoc.body.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 280) });
    }).filter(Boolean);
  }

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Writing unavailable');
    return response;
  }

  async function load() {
    const [live, archive] = await Promise.allSettled([
      request('/api/writing-feed').then(r => r.text()).then(parseFeed),
      request(ARCHIVE_URL, { headers: { apikey:PUBLISHABLE_KEY, Authorization:'Bearer ' + PUBLISHABLE_KEY } })
        .then(r => r.json()).then(rows => rows.map(post).filter(Boolean)),
    ]);
    if (live.status === 'rejected' && archive.status === 'rejected') throw new Error('Writing unavailable');
    const posts = new Map();
    if (archive.status === 'fulfilled') archive.value.forEach(p => posts.set(p.url, p));
    if (live.status === 'fulfilled') live.value.forEach(p => posts.set(p.url, p));
    return {
      posts: Array.from(posts.values()).sort((a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0)),
      stale: live.status === 'rejected',
    };
  }

  window.NeilWriting = Object.freeze({
    load() {
      if (!pending) pending = load().finally(() => { pending = null; });
      return pending;
    },
  });
})();
