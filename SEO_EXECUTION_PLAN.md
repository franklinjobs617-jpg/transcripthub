# Transcripthub SEO Execution Plan (2026-03-29)

## Scope
- Source of truth:
  - `执行步骤与验收标准-Transcripthub-2026-03-25.md`
  - `transcripthub.net 建站-2026_3_25.md`
- Goal:
  - Close required route gaps
  - Align page-level keyword targeting
  - Preserve conversion-first UX and visual consistency

## Page Keyword Map

| Route | Page Type | Primary Keyword | Secondary Keywords | Search Intent | Main CTA | Priority |
|---|---|---|---|---|---|---|
| `/` | Hub Root | transcript generator | ai transcript generator, video to text | Commercial + Tool Use | Paste URL and generate | P0 |
| `/instagram-transcript` | Hub | instagram transcript | instagram transcript generator, reels transcript | Tool Use | Generate transcript | P0 |
| `/tiktok-transcript` | Hub | tiktok transcript | tiktok transcript generator, tiktok script extractor | Tool Use | Generate transcript | P0 |
| `/facebook-transcript` | Hub | facebook transcript | facebook video to text, fb transcript generator | Tool Use | Generate transcript | P0 |
| `/pricing` | Conversion | transcript pricing | transcript plans, subtitle export pricing | Transactional | Start Pro | P0 |
| `/result` | Product Utility | transcript result | transcript preview, transcript export | Tool Use + Conversion | Copy / Upgrade / Export | P0 |
| `/privacy` | Legal | privacy policy | ai transcript privacy | Trust | Read policy | P0 |
| `/terms` | Legal | terms of service | transcript tool terms | Trust | Read terms | P0 |
| `/cookies` | Legal | cookie policy | website cookies | Trust | Read cookie controls | P0 |
| `/contact` | Support | contact transcripthub | support transcript tool | Support | Send message | P1 |
| `/settings` | Account | account settings | profile settings | Navigational | Manage account | P1 |
| `/billing` | Account | billing | subscription billing | Navigational + Transactional | Manage plan | P1 |
| `/instagram-reels-transcript` | Spoke | instagram reels transcript | reels transcript generator | Tool Use | Generate transcript | P1 |
| `/free-instagram-transcript` | Spoke | free instagram transcript | instagram transcript free | Tool Use | Start free preview | P1 |
| `/tiktok-script-extractor` | Spoke | tiktok script extractor | tiktok script to text | Tool Use | Extract script | P1 |
| `/tiktok-transcript-generator` | Spoke | tiktok transcript generator | tiktok subtitle generator | Tool Use | Generate transcript | P2 |
| `/fb-video-transcript-generator` | Spoke | fb video transcript generator | facebook video transcript | Tool Use | Generate transcript | P2 |

## On-Page Standards (Per Route)
- One clear H1 aligned with primary keyword intent.
- Unique title and meta description.
- Canonical set to the route itself.
- At least one internal link to a related hub page.
- Conversion action visible above the fold.
- FAQ section where useful (tool/hub/spoke pages).

## Technical SEO Standards
- Keep `robots.ts` and `sitemap.ts` aligned with new routes.
- Ensure no internal nav/footer links point to 404 routes.
- Ensure legal pages are crawlable and indexable.
- Keep structured data present on key landing pages.

## Design Standards
- Keep one visual language across all new pages:
  - same spacing rhythm
  - same `ui-card` and button hierarchy
  - same text contrast in dark mode
- Avoid placeholder-only sections; each section must support user decision-making.

## Execution Order
1. Create required P0 routes (`/result`, legal pages).
2. Create P1 support/account routes used by navigation (`/contact`, `/settings`, `/billing`).
3. Create P1/P2 spoke routes with clean internal linking back to hub routes.
4. Run build and route integrity checks.
5. Run SEO audit pass and patch findings.

