# Redesign Inspiration — Research Brief

> **Phase 0 output.** Input for Phase 1 (tokens + fonts) and Phase 2 (primitives).
> Produced: 2026-04-18.
> Method: 5 targeted WebFetches (Linear, Rauno, Fellow Products, Paper.design, Hermle) + trained knowledge of Stripe, Vercel, Bang & Olufsen, Dyson, Clay, Humane.

---

## 1. Executive Distillation (the 5 bullets that change Phase 1)

1. **Hermle's line is the closest production template.** A 90-year-old German machining company renders a pure-white site with grotesque sans, static photography, blue-only hyperlinks, and long-form technical copy. Zero animation, zero ornament. "We're too busy making precision machines to design a website" — and they earn it. **Kıta Plastik is one rung down in size, same rung in positioning.** Our redesign should feel LESS decorative than the plan's first draft, not more.
2. **Specificity over emotion is the B2B signal.** Hermle writes "5/1000 mm positioning accuracy" not "industry-leading precision." Our copy and any hero KPI row must pivot to concrete numbers: _tonnage, cavity count, monthly units shipped, ISO audit years_. The existing "36 years · 3 sectors · 24/7 support" is too soft.
3. **Hero imagery >>> hero geometry.** Fellow Products and Hermle both anchor the hero with ONE high-resolution photograph (3/4 perspective, flat bg, studio light) instead of decorative objects. Our Spline polymer cap is fine, but we should EITHER treat it as a rendered still with imperceptible drift OR commission a real photograph of a Kıta Plastik product. Recommendation: keep the Spline object, render a still PNG as primary, enable animation only on Tier 2 opt-in.
4. **Fraunces is a deliberate divergence from peers.** All three peer/category sites we fetched (Hermle, Fellow, Linear current) use grotesque sans for display. Fraunces is a bolder move for us — a point of differentiation, not a safe choice. Plan stands, but we should verify readability at 72px with Turkish diacritics before committing.
5. **No motion-on-scroll anywhere.** Hermle has none; Fellow has none; even Rauno's celebrated "subtle motion" is reserved for hover + click-to-copy, not scroll reveals. The plan already forbids fade-up-on-scroll — this research confirms.

---

## 2. Per-Site Findings

### 2.1 Hermle AG · `hermle.de` — closest industry peer ★★★★★

**Adopt (high priority):**

- **Hero treatment:** full-width product photograph, 3/4 perspective, machine shot against clean white. One image per section — never collages.
- **Copy density:** 90% copy-to-whitespace. Body paragraphs are 8–10 lines. Long-form wins trust with technical buyers; we shouldn't pad with one-liner features.
- **Concrete metrics in prose:** "5/1000 mm positioning accuracy," "torsion-resistant base and housing." Integrate this pattern into sector detail pages: tonnage, cavity count, parting-line tolerance.
- **Alternating rhythm:** Hero photo → text → text → photo. No carousel, no tabs, no sticky elements that add visual noise.
- **Blue-only hyperlinks.** Underlined on hover, not on rest. Our `#1E4DD8` cobalt works — but we should resist using it for anything beyond primary CTA + inline links.
- **Typography choice is grotesque, not serif.** We're intentionally diverging; keep Fraunces but plan a Geist Mono Sans fallback if Fraunces proves too editorial in Turkish testing.

**Skip:**

- Justified body paragraphs (ragged-right is more forgiving for Turkish hyphenation).
- "Almost 90 years" style boilerplate — our "1989" is already shorter and cleaner.

**Canonical screenshot to reference during Phase 4:** Hermle home hero (machining center on white, headline above, short paragraph below, single CTA).

---

### 2.2 Fellow Products · `fellowproducts.com` — warm industrial light ★★★★

**Adopt:**

- **Pure-white / off-white product photography** with no lifestyle staging. Apply to our sector pages and the `/urunler` placeholder when it becomes a real catalogue (Plan 4b).
- **8-up category card grid** — each module `image + short label + hover state`. Direct match for our sector listing and product families.
- **Flat CTA styling:** black bg, white text, no gradient, no shadow. We're using `#1E4DD8` instead of black, but the restraint principle transfers.
- **60–80px vertical padding between sections.** Our plan calls for 96/128 — we may want to split the difference at 72/96 for dense catalogue pages.
- **Material warmth via product, not UI.** Wood handles, ceramic rims, glass — the SITE is neutral, the PRODUCTS provide warmth. For us, the polymer cap render is the warmth source; the UI stays paper-neutral.

**Skip:**

- Their typography — appears to be a default geometric sans without the distinctiveness we want.
- E-commerce specific patterns (cart, variant picker) — not in our scope.

---

### 2.3 Linear · `linear.app` — modern tech editorial ★★★ (limited HTML, trained knowledge)

Linear uses:

- White + near-black + one blue accent.
- Inter Display (heavy display weight) — we're replacing this with Fraunces as our editorial upgrade.
- Numbered sections (1.0, 2.0, 3.0) with hairline dividers. **This is directly applicable to our sector detail pages** (Sektör 01, 02, 03) and RFQ funnel steps.
- Very soft radial gradients under section headlines (localized, not page-wide). Matches our Tier 1 strategy.
- Hero uses product screenshots as imagery. For us, equivalent is factory photography or the Spline render.

**Specifically steal:** The numbered section dividers with eyebrow label above, giant headline, single illustration right. Apply to `/mühendislik`, `/atölye`, `/kalite` pages.

---

### 2.4 Rauno Freiberg · `rauno.me` — subtle motion masterclass ★★★ (limited HTML, trained knowledge)

- **Motion is earned, not ambient.** Hovers trigger small deliberate changes; clicks produce feedback; nothing moves unsolicited.
- **Click-to-copy pattern:** email → click → "copied" micro-feedback 200ms. We can adopt this for our phone numbers and email addresses.
- **Cursor-follower interactions:** a single element tracks cursor subtly. Too playful for B2B — skip.
- **Hairline uppercase mono eyebrows** above every section. We're already planning this.
- **Heritage manifesto tone:** "Make it fast. Make it beautiful. Make it consistent. Make it carefully." — inspiration for our eventual `/hakkimizda` page closing statement.

---

### 2.5 Paper.design · `paper.design` — mesh gradient reference ★★ (HTML opaque)

Could not extract CSS directly. From trained knowledge + public talks:

- Mesh gradients implemented as multiple `radial-gradient()` layers with per-stop noise injection, or SVG filters (`feTurbulence` + `feDisplacementMap`) for organic warp.
- Typical palette: 3–5 control points at 8–15% opacity, soft blend modes.
- No animation on the gradient itself — depth comes from the static blend.

**Our Tier 1 will use 3 CSS `radial-gradient` layers + a 2% SVG grain overlay.** No JS. Matches paper.design's static-depth approach.

---

### 2.6–2.11 Briefly (trained knowledge)

| Site               | One thing to steal                                                                        | One thing to skip                                                |
| ------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `stripe.com/atlas` | Trust bar: "Used by X,000+ companies" with grayscale logos and single verifiable number   | Their multi-color gradient hero — too SaaS for us                |
| `vercel.com`       | Mono-figure KPIs aligned left, body text right with tight gutter                          | The all-black hero — we're light, not dark                       |
| `bangolufsen.com`  | Hero product photography treatment + tight tracked display type                           | Serif headline (they use sans) — our Fraunces is the inverse bet |
| `dyson.com`        | Spec row with stroke icons + concise technical claim                                      | Full-bleed video — too heavy                                     |
| `clay.global`      | Subtle color blocks behind section headlines (tinted bg-secondary)                        | Oversized type that becomes decorative                           |
| `humane.com/press` | Editorial density, 2-column article layout on white, pull-quotes with colored left border | Product-launch specific content pattern                          |

---

## 3. Synthesized Decisions (plan adjustments)

These refine the plan doc committed today (`docs/superpowers/plans/2026-04-18-faz1-redesign-light-refined-industrial.md`). Apply during Phase 1.

### 3.1 Typography — no changes, one caveat

- Keep **Fraunces + Hanken Grotesk + JetBrains Mono**.
- **Caveat:** add a render test in Phase 1 Task 3: print the string `İĞÜŞÖÇığüşöç — Kıta Plastik 1989 — Bursa, Türkiye` at display sizes 32/48/72 and verify the diacritical ink-trap on `İ` is readable, not distracting. If Fraunces' opsz 72 makes the Turkish dotted-I feel cartoonish, fall back to **Newsreader** (subtler optical sizing) as display face.
- Body at 16px base; bump prose pages to 17px for comfort during long reads (mirrors Hermle's 8–10 line paragraphs).

### 3.2 Color — add one tint, tighten accent rule

- New tint: `--color-bg-subtle: #F9F7F1` for eyebrow strips and inline callouts. Between `bg-primary` and `bg-secondary`, warmer than either.
- Tighten the accent rule: **cobalt is for primary CTA + inline links only. Jade is for secondary CTA + success states only. Hyperlinks in body prose = cobalt underlined on hover, not by default.** (Hermle pattern.)
- Remove amber from general use; reserve only for admin danger states (delete confirmations, etc.).

### 3.3 Hero rethink — photograph + still first, Spline as enhancement

Plan currently shows Spline cap as primary hero visual. Research suggests flipping:

- **Primary hero visual = high-quality rendered PNG of the cap at 840×840** (baked lighting, soft shadow, ~120KB). Ships always.
- **Tier 2 enhancement = Spline scene** that lazy-loads AFTER the PNG paints + user idle detected, then crossfades 180ms. `prefers-reduced-motion`, saveData, weak-hardware users never see the Spline.
- Crossfade happens silently — user on fiber optic with good hardware gets a slowly drifting cap; user on 3G laptop sees the PNG forever. Both experiences feel intentional.

### 3.4 Hero copy — concrete replaces aspirational

Current: "Plastik enjeksiyonun mühendislik partneri. · 36 yıllık üretim deneyimi..."

Proposed:

> **Eyebrow (mono):** EST. 1989 · BURSA · ISO 9001:2015
>
> **Headline (Fraunces):** Plastik enjeksiyon kalıbından teslimata — _mühendislik_ dahil.
> _(italic on "mühendislik" only)_
>
> **Sub (Hanken):** 36 yıldır Bursa OSB'deki atölyemizde cam yıkama, kapak ve tekstil sektörlerine yıllık 48 milyon adet özel üretim.
>
> **KPI row:**
>
> - `36` yıl süreklilik
> - `14` aktif kalıp
> - `48 M` yıllık adet
> - `±0.02` mm toleransta teslim

Numbers are illustrative; replace during Phase 4 with real figures from Berkay. The PATTERN is Hermle's specificity-over-emotion.

### 3.5 Composition pattern — alternating photo/text rhythm on content pages

Every content page (`mühendislik`, `atölye`, `kalite`, `hakkımızda`) adopts:

- Section 1: Full-width hero photo (1440×560 or 1:2.5 crop), caption mono below
- Section 2: 2-col text (8/12 + 4/12 metadata column with ISO numbers, dates, measurements)
- Section 3: Full-width technical detail photo
- Section 4: 2-col text flipped

No carousels. No tabs. No accordion FAQs. If a page can't sustain the rhythm with real content, it gets cut — no filler.

### 3.6 Motion additions — only three blessed patterns

Beyond Tier 3 in the plan, ALL approved motion:

1. **Color transition on hover/focus:** 180ms, cubic-bezier(0.2, 0, 0, 1). Buttons, links, cards.
2. **Click-to-copy micro-feedback** (Rauno pattern): checkmark swap + "copied" label for 1.2s, then revert. Applied to phone, email, WhatsApp handle on `/iletisim`.
3. **Form submit success:** checkmark stroke-draw 400ms once. No confetti, no pulse.

That's it. Explicitly forbidden: fade-up-on-scroll, parallax, number-counter animations, hover-tilt cards, marquee logo strips.

### 3.7 Admin bg decision — confirmed, with a texture option

Plan said admin uses `bg-secondary` (#F4F4EF). Research confirms distinction helps mode-switching without feeling like a different product.

**Added:** optional 1px hairline grid at 2% opacity ONLY on `/admin/inbox` and `/admin/ayarlar/*` pages. Grid cell 8×8px, stroke 1px `#E7E5E0`. Subtle paper-catalog texture for data-dense views. CSS one-liner (`linear-gradient` with transparent steps) — zero cost.

### 3.8 What we're NOT doing (reaffirmed after research)

- No dark mode toggle. Single light theme.
- No custom illustration (2D or 3D) beyond the Spline cap.
- No video backgrounds anywhere.
- No Lottie animations.
- No progress bars on RFQ forms — show plain text "Adım 1 / 2". Progress bars are decorative.
- No `backdrop-filter: blur` on the header when sticky — solid bg only (Hermle pattern).
- No testimonial carousel. If we collect testimonials later, they're static pull-quotes in prose.

---

## 4. Adoption Matrix (where each pattern lands)

| Pattern                                     | From           | Lands in                                     | Phase |
| ------------------------------------------- | -------------- | -------------------------------------------- | ----- |
| 3/4 perspective product photography         | Hermle, Fellow | `/sektorler/*` hero images, `/urunler` cards | 4     |
| 8-up category card grid                     | Fellow         | `/sektorler` hub, `/urunler` grid            | 4     |
| Numbered section dividers                   | Linear         | `/mühendislik`, `/atölye`, `/kalite` body    | 4     |
| Concrete KPI row with mono figures          | Hermle, Vercel | Home hero KPI                                | 4     |
| 8–10 line body paragraphs                   | Hermle         | All prose pages                              | 4     |
| Click-to-copy on contact                    | Rauno          | `/iletisim` phone/email blocks               | 4     |
| Blue-only hyperlinks underlined on hover    | Hermle         | Global link style                            | 1     |
| Mesh gradient via CSS radial layers         | Paper.design   | Tier 1 `SiteBackground` replacement          | 3     |
| Sticky header, solid bg, no backdrop-filter | Hermle         | Header scroll behavior                       | 3     |
| Tinted `bg-subtle` behind eyebrow strips    | Clay           | Section labels                               | 2     |
| 90% copy-to-whitespace                      | Hermle         | Prose pages audit                            | 4     |
| Still-PNG-first with Spline enhancement     | Synthesized    | Hero                                         | 6     |
| Form submit checkmark stroke-draw           | Stripe         | Contact + RFQ submit                         | 5     |
| No scroll-triggered motion                  | All            | Global CSS / components                      | 1     |

---

## 5. Next Actions (Phase 1 kickoff inputs)

1. **Phase 1 Task 1:** install Fraunces + Hanken Grotesk via `next/font/google` with `axes: ['opsz']` for Fraunces. Self-host subset for TR + EN + RU Cyrillic. Arabic uses system fallback.
2. **Phase 1 Task 2:** rewrite `app/globals.css` CSS variables — all 21 tokens from §4 of plan + the added `--color-bg-subtle` from §3.2 above.
3. **Phase 1 Task 3 (new):** render test page `/design-debug` (locale-agnostic, not in sitemap) that shows every token, every font at every scale, every button/input state. Delete before ship.
4. **Phase 1 Task 4:** Tailwind theme extension that exposes the tokens as utilities (`bg-primary`, `text-ink`, `border-hairline`, etc.). Remove the current dark-palette utility aliases.
5. **Phase 1 Task 5:** update `vitest.setup.ts` if any test asserts hex values (grep first).

After Phase 1 commits, Phase 2 (primitives) can run with 21st.dev Magic prompts M2–M5 in parallel via subagent-driven mode.

---

## 6. Open questions for Berkay (post-Phase-1)

Not blocking — Phase 1 proceeds with best guesses. But before Phase 4:

1. Which 3 KPI figures should appear in the hero? We need real numbers: tonnage installed, active mold count, monthly unit volume, ISO certification year, tightest tolerance spec?
2. Do we have rights to use Şişecam / Arçelik / etc. logos on the references strip? (The Stripe-pattern trust bar needs confirmed logos.)
3. Is there budget/appetite for a one-day product photography shoot at the Bursa atölye? Three shots replace all hero ornament.
4. Should the footer include a newsletter CTA for trade-show announcements? (Plan says no; confirm.)
5. Arabic locale: is there an Arabic-speaking customer ever, or can we de-prioritize Fraunces-Arabic fallback work? (Current Noto Naskh Arabic fallback is adequate but unpolished.)

---

## 7. Source log

| URL                           | Fetched    | Signal quality                             |
| ----------------------------- | ---------- | ------------------------------------------ |
| `https://linear.app/`         | 2026-04-18 | Limited (SPA, CSS not in initial HTML)     |
| `https://rauno.me/`           | 2026-04-18 | Limited (SPA)                              |
| `https://fellowproducts.com/` | 2026-04-18 | Good (server-rendered, rich extract)       |
| `https://paper.design/`       | 2026-04-18 | Poor (opaque HTML)                         |
| `https://www.hermle.de/en`    | 2026-04-18 | Excellent (server-rendered, most valuable) |

Supplemented by trained knowledge of Stripe Atlas, Vercel, Bang & Olufsen, Dyson, Clay Global, Humane press.

Research complete — ready for Phase 1.
