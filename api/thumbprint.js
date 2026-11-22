const {createHash, timingSafeEqual} = require('node:crypto');
const newsroom = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Newsroom | Thumbprint Realty</title><link rel=\"stylesheet\" href=\"/thumbprint-assets/style.css\"></head><body class=\"\"><header><a href=\"/thumbprint\" aria-label=\"Thumbprint Realty launch\"><img src=\"/thumbprint-assets/logo.png\" alt=\"Thumbprint Realty\"></a><a href=\"/thumbprint\">Launch overview</a></header><main class=\"news\"><h1>Newsroom</h1><p class=\"intro\">The latest announcements from Thumbprint Realty.</p><div class=\"grid\"><article class=\"story feature\"><img class=\"art\" src=\"/thumbprint-assets/culture.webp\" alt=\"\" loading=\"eager\"><div class=\"body\"><p class=\"eyebrow\">New Culture</p><h2>A culture of trust.</h2><p>Thumbprint’s ambition is to become the world’s most trusted real estate brokerage. For agents, that starts long before a client sits down at the closing table.</p><details><summary>Read announcement</summary><p>The shift begins with preparation. Practice the offer, ask a colleague for a second opinion, and explain the next step clearly enough that a client can make a confident decision. Those everyday habits give trust a place to grow.</p></details></div></article><article class=\"story \"><img class=\"art\" src=\"/thumbprint-assets/lifestyle.webp\" alt=\"\" loading=\"lazy\"><div class=\"body\"><p class=\"eyebrow\">Lifestyle Membership</p><h2>Closing is just the beginning.</h2><p>Thumbprint Lifestyle Membership gives clients access to special offers after closing.</p><a class=\"more\" href=\"https://lifestyle.thumbprintrealty.support/\">Explore Lifestyle Membership ↗</a></div></article><article class=\"story \"><img class=\"art\" src=\"/thumbprint-assets/mentor.webp\" alt=\"\" loading=\"lazy\"><div class=\"body\"><p class=\"eyebrow\">Mentorship Program</p><h2>Nobody builds alone.</h2><p>New agents work alongside a mentor as they learn to represent clients, from the first introduction through the offer.</p><details><summary>Read announcement</summary><p>Mentors and mentees meet regularly to tour MLS, practice writing offers and review client work together. The program is designed for new agents and agents working toward their first closing.</p></details></div></article><article class=\"story \"><div aria-hidden=\"true\" class=\"art typeart \">Agent Support</div><div class=\"body\"><p class=\"eyebrow\">Support Site</p><h2>Every guide, on the job.</h2><p>The agent support site puts the Buyer Transaction Guide, loan products and grant resources within reach when a client has a question.</p><a class=\"more\" href=\"https://app.thumbprintrealty.support/\">Open Agent Support ↗</a></div></article><article class=\"story \"><div aria-hidden=\"true\" class=\"art typeart dark\">CRM + Site</div><div class=\"body\"><p class=\"eyebrow\">CRM + Site Upgrade</p><h2>A new home for follow-up.</h2><p>Coming soon. Thumbprint is upgrading its CRM and website, the tools agents use to manage relationships and clients use to explore the brokerage.</p><details><summary>Read announcement</summary><p>The upgrade covers both sides of the client experience, from visiting the website to staying in touch with an agent. Rollout details will follow.</p></details></div></article></div></main></body></html>";
const hash = value => createHash('sha256').update(value).digest('hex');
const matches = (value, expected) => timingSafeEqual(Buffer.from(hash(value)), Buffer.from(expected));

module.exports = function thumbprint(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  function redirect(location) {
    res.writeHead(303, {Location: location});
    return res.end();
  }
  if (req.method === 'POST') {
    const form = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body;
    const code = form && typeof form.code === 'string' ? form.code.trim() : '';
    if (!matches('thumbprint/access/' + code, '1320a30c3c2f5004433f147a447dd2bb305d16af7eb82d59fa2c43d11f4d5a61')) return redirect('/thumbprint#error');
    const token = hash('thumbprint/session/' + code);
    res.setHeader('Set-Cookie', 'tp_news=' + token + '; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Lax');
    return redirect('/thumbprint/newsroom');
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {Allow: 'GET, HEAD, POST'});
    return res.end();
  }
  const token = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('tp_news='));
  if (!token || !matches('thumbprint/session/check/' + token.slice(8), '42ef96cec82379a33affdf5f21450d6e6ebc8e20a7665478c83b70c29442c908')) return redirect('/thumbprint');
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
  return res.end(req.method === 'HEAD' ? undefined : newsroom);
};
