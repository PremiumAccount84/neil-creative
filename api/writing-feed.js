// Same-origin RSS proxy: Substack does not allow direct browser feed requests.
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const upstream = await fetch('https://thechrisneil.substack.com/feed', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeilCreativeSiteBot/1.0)', Accept: 'application/rss+xml, application/xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) throw new Error('Substack feed unavailable');
    const xml = await upstream.text();
    if (!/<rss[\s>]/i.test(xml) || !/<channel[\s>]/i.test(xml)) throw new Error('Invalid RSS response');
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(xml);
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Writing feed temporarily unavailable' });
  }
};
