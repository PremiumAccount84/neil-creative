const SUPABASE_URL = 'https://htcunyeepqjcbxlfpcny.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v_UsqCq_AHjTqptN93prDw_yCsZc99t';
const FEED_URL = 'https://thechrisneil.substack.com/feed';

function extractItems(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) items.push(m[1]);
  return items;
}

function tag(block, name) {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`);
  const m = re.exec(block);
  if (!m) return '';
  return m[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = async (req, res) => {
  try {
    const feedRes = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeilCreativeSiteBot/1.0)' },
    });
    if (!feedRes.ok) throw new Error('feed fetch failed: ' + feedRes.status);
    const xml = await feedRes.text();
    const items = extractItems(xml);

    let imported = 0;
    for (const block of items) {
      const guid = tag(block, 'guid') || tag(block, 'link');
      const title = tag(block, 'title');
      const url = tag(block, 'link');
      const pubDateRaw = tag(block, 'pubDate');
      const publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : null;
      const author = tag(block, 'dc:creator');
      const content = tag(block, 'content:encoded');
      const excerpt = stripHtml(content || tag(block, 'description')).slice(0, 280);

      const rpcRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/import_writing_post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          p_guid: guid,
          p_title: title,
          p_url: url,
          p_published_at: publishedAt,
          p_excerpt: excerpt,
          p_author: author || null,
        }),
      });
      if (rpcRes.ok) imported++;
    }

    res.status(200).json({ ok: true, itemsFound: items.length, imported });
  } catch (err) {
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
};
