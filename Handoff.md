# Neil Creative — Handoff for Claude Code

Target: Next.js (or similar) on Vercel, replacing WordPress at neilcreative.com.

## Files in this design
| File | Becomes | Notes |
|---|---|---|
| `Home.dc.html` | `/` | Six snapping sections |
| `Card.dc.html` | `/card` | Normal scroll |
| `Writing.dc.html` | `/writing` | Normal scroll |
| `Questionnaire.dc.html` | Shared modal + `/get-connected`, `/get-connected/form` | Used by Home and Card |
| `Subscribe.dc.html` | Shared inline/modal component | Used by Home, Card, Writing |
| `Design System.dc.html` | Tokens reference | |
| `Overview.dc.html` | 390 / 768 / 1440 previews | |
| `assets/` | `/public` | `cj-lounge.png` (hero, plus circular crops on the card and questionnaire welcome), `deedshare.png` (DeedShare). Not used: CJ.png / `cj-portrait.png` (yellow disc baked into the image clashes with the lime palette), the calendar graphic, and the DSC7642 photo. |

## Prototype vs. real
**Working in the prototype (all local, nothing sent):** navigation, section snapping and indicator, questionnaire steps/branching/validation/progress, subscription channel switching/validation/consent, simulated outcomes, feed states.
Simulated outcomes are switched from the Tweaks panel (`demoQuestionnaire`, `demoSubscribe`, `feedState`). "fail" fails the first attempt, then succeeds on retry.

**Not live, needs integration:** questionnaire storage/delivery, email provider, SMS provider, Substack import, notification sending, QR generation (prototype uses api.qrserver.com — generate locally at build time, e.g. `qrcode` package, SVG, black on white, ≥4-module quiet zone).

## Homepage sequence (v2: one idea per swipe)
`Home v1.dc.html` is the earlier six-section version, kept for reference.
1. Introduction: photo, name/title, headline, supporting line, Get connected (+ "Explore my work" text link)
2. My focus: "Rather than chasing trends…"
3. How I approach it: "My work has always focused on…" + operational clarity / behavioral psychology / infrastructure-first thinking
4. Why systems: "My philosophy is rooted in a simple belief…"
5. Core question
6. Philosophy (gold)
7. What I build: DeedShare
8. Side missions: Pynding, DeedShare Labs + Day job line
9. Featured writing
10. Subscribe: Email / Text / Both open the subscription sheet with that channel preselected
11. Connect with intention + footer (/card link)

Desktop/tablet (≥900px) keeps the same order; screens 1, 3, 7, 8 and 11 become two columns. The header takes on each section's surface color.

### Copy changes for approval (all other copy is verbatim from neilcreative.com)
- "BUSINESS" (all caps on the current site) → italic "business".
- "PERMENANTLY" → "permanently" (spelling).
- "A GREAT BRAND IS not BUILT ON MORE EFFORT. THEY ARE BUILT ON GREAT SYSTEMS." → "A great brand is *not* built on more effort. It's built on great systems." (sentence case, "They are" → "It's" for agreement).
- "How I approach it" and "Things I've built / Side missions" are new section labels. "Connect with intention." is from the brief.
- The DeedShare description is still draft copy from the brief.

## Typography & color
Inter throughout (substitute for Phonic, which is licensed and not included). No serif fonts. Weights: 400 for headlines and statements, 500 for controls and emphasis. Buttons: capsule, 36px radius.
Palette: black #000000, white #FFFFFF, warm black #110E08 for text on green and light surfaces, neutral grays #111111 / #1A1A1A / #262626 / #333333 / #A6A6A6, light #F4F4F2. Accent: neon green #CCFF00 (hover #D9FF4D). Previous gold #FFC400 is retired.

## Homepage snapping
- Scroller is a full-height container: `scroll-snap-type: y mandatory`; each section `min-height: 100dvh; scroll-snap-align: start; scroll-snap-stop: always` (prevents multi-section flings).
- No wheel/touch interception. Keyboard: Space/PageUp/PageDown/arrows work natively on the focused scroller.
- Sections taller than the viewport (Founder Perspective and Subscribe on small phones) grow; the browser lets you scroll through them before snapping. **Test on iOS Safari** — if it traps content, fall back to `proximity` below ~700px height.
- Indicator (right edge) uses IntersectionObserver with a centerline root margin; dots are 28×30 hit areas with `aria-current`.
- While any form is open: `overflow: hidden; scroll-snap-type: none` on the scroller.
- Reduced motion: `scroll-behavior: auto`, transitions off.
- `/card` and `/writing` never snap.

## QR scan capture (/card)
- The QR encodes `https://neilcreative.com/card?src=qr`. On load with `src=qr`, the card opens a contact sheet: First Name, Last Name, Email, Phone (all required, pending approval). On submit it closes, shows a confirmation toast, and removes `src` from the URL with `history.replaceState`, so a refresh doesn't reopen it. × / Esc skips it.
- This is separate from the questionnaire and from subscriptions (it creates no subscription). It needs its own storage/delivery endpoint with dedupe on email.
- In the prototype, the `simulateScan` tweak (default on) opens the sheet without the query param, and `demoScan` = fail makes the first submit fail.

## Questionnaire
- Flow A (Investor / Team Member / Strategic Partner): Role → Name → Contact → Background → Company & affiliation → Submit → Booking handoff. Progress "Step n of 5".
- Flow B (App User): Role → DeedShare early access (Join DeedShare ↗ / Done, back to site / I'd also like to talk). "Talk" continues through Name…Company (Step n of 6) before booking.
- Required (pending approval): role, first name, last name, email. Phone optional but format-checked (7–15 digits).
- Submit uses an idempotency key (`subId`) that stays the same across retries until an answer changes; server must dedupe on it. Button disabled while submitting.
- Failure keeps all answers and shows an inline banner.
- Booking handoff shows three separate milestones: Questionnaire submitted ✓ → Calendar opened (after clicking) → Meeting booked (only Calendly confirms). Never claim booked. Optional: Calendly webhook `invitee.created` to confirm.
- Calendar: https://calendly.com/deedshare-cj/30min (opens new tab). Consider prefilling `name`/`email` query params.
- Close restores focus to the trigger; page scroll is untouched. Answers persist across close/reopen until completion.
- Does **not** subscribe anyone to email/SMS.
- Mobile: full-screen, sticky footer actions, safe-area padding. ≥768px: centered 600px surface.
- Redirect `/get-connected/` and `/get-connected/form/` to `/#get-connected` (Home opens the questionnaire on that hash), or render the flow as its own page.
- "Premium Only" from the old site is intentionally dropped.

## Subscription
- Channels: Email / Text / Both; only relevant fields show. Name optional. Country code + number for text.
- Separate, unchecked consent per channel. SMS copy is placeholder — have it reviewed for TCPA/CTIA with the chosen provider; add Privacy/Terms links (placeholder line in form).
- States: validation, submitting, verification pending (email link / reply YES), success, already subscribed, failure + retry (fields kept), partial success (email ok, text failed → Retry text).
- Do not assume a website email signup creates a Substack subscriber. Verify the chosen email service's API. Store per-channel status separately.

## Writing
- `/writing` is a full-screen vertical feed: Cover (Notes From Your Chief of Staff) → one card per article, newest first → Subscribe card. Swiping past the Subscribe card loops back to the Cover, and swiping up from the Cover goes to Subscribe. The loop uses cloned first and last cards: once the scroll settles on a clone, the feed jumps without animation to the real card. Clones are aria-hidden and their controls get tabIndex -1.
- Native `scroll-snap-type: y mandatory` plus `scroll-snap-stop: always` (one card per swipe). ↑/↓/PageUp/PageDown/j/k and the on-screen rail step between cards. Story-style progress segments sit at the top. Share uses the Web Share API, falling back to copying the link.
- Subscribe cards hold the full inline subscription form. Cadence: with fewer than 10 articles, one Subscribe card at the end. With 10 or more, a mid-feed Subscribe card ("Enjoying these?") after every 5th article (not after the last one), plus the final card. The `sampleFeed` tweak = "12 sample" shows the cadence using labelled placeholder notes (prototype only).
- The site footer is not on /writing (a looping feed has no end). The previous list version is kept as `Writing v1.dc.html`.
- Feed: https://thechrisneil.substack.com/feed (not verified — fetch failed from design tooling).
- Scheduled import (e.g. Vercel Cron) → upsert into durable storage keyed by post GUID/URL; never delete on failure; keep last good set. One-time backfill if the feed doesn't include older posts.
- Newest successfully imported post becomes the Home featured article.
- States designed: loaded, loading (skeleton), empty, refresh failed (keeps saved list + banner), error with no cache.
- Verified metadata: "The Best Leaders Make Themselves Less Necessary" — Substack byline Sep 23, 2026; no article image (og:image is the generic subscribe card, so the design has no image). Its subtitle reads "September 17, 2026" — confirm which date is canonical. The excerpt shown is the article's opening sentence, verbatim.
- The other two posts could not be fetched; date and excerpt are left blank until import. Order among them is unconfirmed.

## Notifications (later)
Publish in Substack → import → for each new post, per channel, send once (track `post_id + channel` sent). SMS provider and auto vs. manual approval are undecided.

## Pending inputs (not invented)
- DeedShare Instagram URL → Card shows "Pending" row; set `instagramUrl`.
- Public email → Card shows "Pending" row; set `contactEmail` (mailto).
- Employer name/link — Day job shows title only.
- DeedShare description approval (draft copy).
- Required vs. optional questionnaire fields.
- Where questionnaire submissions go.
- Email and SMS providers; alert approval mode.
- Substack feed verification and refresh frequency.
- Writing archive rows use a "CN" monogram tile when a post has no image; replace it with the post image when imported.
- Luma Mobbin screens were inaccessible; layout follows the brief's direction (stacked cover image, pill actions, rounded list rows) without copying unseen screens.

## Migration checklist
Back up WordPress · crawl existing URLs and add redirects (`/get-connected/*`) · keep email DNS (MX/SPF/DKIM) and unrelated subdomains untouched when moving the apex · titles, meta descriptions, OG image, favicon · test 390 / 768 / 1440 and short/zoomed viewports · all questionnaire branches · subscription channels once providers exist · scan the production QR with a phone.
