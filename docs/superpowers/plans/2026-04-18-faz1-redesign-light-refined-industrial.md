# Faz 1 — Redesign: Light "Refined Industrial" + Subtle 3D

> **Status:** Draft · waiting user approval
> **Author:** 2026-04-18 Berkay + Claude (Opus 4.7)
> **Supersedes:** the dark "Industrial Precision" palette and the FBM atmospheric shader introduced in Plan 2
> **Does NOT replace:** Plan 4 (admin CRUD + SEO + analytics) — that plan's backend scope is untouched, only its UI surfaces will inherit new tokens

---

## 1. Rationale

Current site (Plan 1 + 2) uses:
- Palette: `#0a1628` dark navy base, hot accents (`red #c5252c`, `cyan #39c5bb`)
- 3D: site-wide fullscreen fragment shader (FBM + domain warping) with continuous motion
- Typography: Inter (body) + JetBrains Mono (technical)

Issues surfaced in 2026-04-18 review:
1. **Eye fatigue** — dark bg + bright text + always-moving shader over a full viewport; procurement engineers stay on product/spec pages for 5–10 min reading.
2. **Tonal mismatch** — "dark dashboard SaaS" aesthetic conflicts with the brand truth: a 36-year-old plastic injection shop in Bursa. Industrial heritage reads better in warm paper-white editorial than dark cockpit.
3. **Generic typography** — Inter on dark navy is the default "AI portfolio" look; no character.
4. **Shader was frozen until 2026-04-18 fix** — even after fix, the animated FBM competes with content for attention; not honest to "precision" positioning.

Goal of this plan: a light, quietly confident "Refined Industrial" design that a customer can read for 20 minutes without strain, while still feeling premium and distinctive (no generic Tailwind-SaaS look).

---

## 2. Design Principles (guide every decision)

1. **Calm canvas, loud proof.** Background stays silent; content (specs, photos, certifications) is the loudest element.
2. **Warm, not clinical.** Off-white (`#FAFAF7`) beats pure white. Deep ink (`#0A0F1E`) beats black. Character over correctness.
3. **Motion is a scalpel, not a paintbrush.** Any movement must be <0.5s, <3% of viewport. No continuous ambient animation.
4. **Typographic gravity.** Hierarchy via type scale + weight, not ornament. Display serif for voice, grotesque for body, mono for numbers.
5. **Material honesty.** Where we show depth, reference the product (translucent polymer, frosted glass) — not decorative glows.
6. **A11y is the floor.** Body text ≥ AA 4.5:1 everywhere (target AAA 7:1 on prose pages), ≥ 16px base, focus rings visible.

---

## 3. Aesthetic Direction — "Refined Industrial"

**Think:** a high-end German machining supplier catalogue circa 1988 reprinted in 2026 — warm off-white paper, deep ink, a single spot color, one technical photograph per spread, generous margins.

**Not:** modern SaaS landing pages, dark hacker dashboards, purple-gradient startup decks, maximalist agency portfolios.

**Tone words:** precise · honest · warm · confident · unhurried · legible.

### Reference sites (to research with `mcp__magic__21st_magic_component_inspiration` and `mcp__firecrawl__firecrawl_scrape`)

| Site | What to steal |
|---|---|
| `linear.app` | Type scale + soft micro-gradients under headlines + sectioning rhythm |
| `stripe.com/atlas` | Trust bars, clarity of forms, button discipline |
| `vercel.com` | Negative space + hairline dividers + mono numerics for figures |
| `rauno.me` | Subtle 3D tastefulness, micro-interactions |
| `paper.design` | Mesh-gradient-only "3D" without shader cost |
| `clay.global` | Luxurious industrial b2b on white |
| `dyson.com` | Engineering trust signals, product photography layouts |
| `fellowproducts.com` | Warm white tool-catalog typography |
| `hermle-ag.de` | Machinery industry on light — the closest competitor template |
| `humane.com/press` | Editorial density on white |
| `bangolufsen.com` | Precision + warmth on near-white |

Pull one specific detail from each, document in research file.

---

## 4. Design Tokens v2

### 4.1 Color — "Warm Paper + Cobalt/Jade"

```css
/* Surfaces */
--color-bg-primary:     #FAFAF7;  /* warm paper */
--color-bg-secondary:   #F4F4EF;  /* section contrast */
--color-bg-elevated:    #FFFFFF;  /* cards, modals, form containers */
--color-bg-ink:         #0A0F1E;  /* rare dark block / footer */

/* Ink (text) */
--color-text-primary:   #0A0F1E;  /* deep warm black */
--color-text-secondary: #525A6B;  /* medium slate, calm */
--color-text-tertiary:  #8B94A5;  /* muted labels */
--color-text-inverse:   #FAFAF7;  /* on ink block */

/* Borders / hairlines */
--color-border-hairline:#E7E5E0;  /* default divider */
--color-border-default: #D9D6CF;  /* card border */
--color-border-strong:  #A8A59E;  /* focus / pressed */

/* Accents — used SPARINGLY */
--color-accent-cobalt:  #1E4DD8;  /* primary action (engineering blue) */
--color-accent-cobalt-hover: #1740B8;
--color-accent-cobalt-tint:  #EEF2FE;  /* for soft backgrounds */

--color-accent-jade:    #0FA37F;  /* secondary action / success (precision green) */
--color-accent-jade-hover: #0C8A6A;
--color-accent-jade-tint:  #E8F6F1;

--color-alert-amber:    #D97706;  /* warnings */
--color-alert-red:      #B91C1C;  /* errors only */

/* Focus ring */
--color-focus-ring:     #1E4DD8;  /* cobalt, 2px offset, 3px width */
```

Hard rules:
- Never use more than 2 accent colors on the same screen.
- Accent colors never exceed ~5% of visible pixels.
- No gradients between accents. Meshes use only tints of primary bg.
- Dark block (`bg-ink`) used at most once per page (e.g., footer) to anchor the bottom.

### 4.2 Typography

Self-hosted via `next/font/google` (TR/RU/AR fallbacks locked in).

| Role | Family | Weights | Reason |
|---|---|---|---|
| Display (hero, section headlines) | **Fraunces** (variable, optical sizing) | 300, 500, 700 + opsz 72 | Warm serif with SOFT(1) optical ink traps; reads "1950s technical catalogue"; supports Cyrillic. |
| Body / UI | **Hanken Grotesk** (variable) | 400, 500, 600, 700 | Crisp neutral grotesque, warmer than Inter, supports Cyrillic, x-height optimized for small sizes. |
| Mono / numerics | **JetBrains Mono** (keep) | 400, 500 | Tabular figures for specs tables, RFQ part numbers, phone/email. |
| Arabic | system `ui-serif`, fallback `Noto Naskh Arabic` | — | Fraunces lacks Arabic → per-locale font stack. |

Type scale (major-third, 1.25):

| Token | px (desktop) | px (mobile) | Usage |
|---|---|---|---|
| `display-xl` | 72 | 48 | Hero H1 only |
| `display-lg` | 56 | 40 | Section H1 |
| `display-md` | 44 | 32 | Sub-hero, article H1 |
| `heading-xl` | 32 | 26 | H2 |
| `heading-lg` | 26 | 22 | H3 |
| `heading-md` | 20 | 18 | Card titles, H4 |
| `body-lg` | 18 | 17 | Intro paragraphs |
| `body` | 16 | 16 | Default |
| `body-sm` | 14 | 14 | Meta, labels |
| `caption` | 12 | 12 | Fine print, eyebrow |

Line-height: display 1.05 · heading 1.2 · body 1.6.
Tracking: display -0.02em · heading -0.01em · body 0 · caption 0.04em.

### 4.3 Spacing / Rhythm

8px grid. Stack scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`. Section padding desktop 96/128, mobile 48/64.

### 4.4 Elevation / Shadow

Physical, warm, layered — NOT the generic Tailwind shadow-xl purple.

```css
--shadow-hairline: 0 0 0 1px var(--color-border-hairline);
--shadow-card:     0 1px 2px rgba(10, 15, 30, 0.04),
                   0 4px 12px rgba(10, 15, 30, 0.04);
--shadow-float:    0 2px 4px rgba(10, 15, 30, 0.06),
                   0 12px 32px rgba(10, 15, 30, 0.06);
--shadow-focus:    0 0 0 2px var(--color-bg-primary),
                   0 0 0 4px var(--color-accent-cobalt);
```

### 4.5 Radii

- `radius-xs: 2px` (inputs)
- `radius-sm: 4px` (buttons, badges)
- `radius-md: 8px` (cards)
- `radius-lg: 16px` (modals, panels)
- No pill buttons. No huge rounded cards.

### 4.6 Motion

- Default duration: **180ms**
- Snappy easing: `cubic-bezier(0.2, 0, 0, 1)` (ease-out)
- Hover color transitions only — never slide/scale on hover
- Reveal on scroll: **forbidden** (no "fade-up" chains)
- Single allowed "page enter" animation: hero text 120ms fade-in, 0 y-transform

---

## 5. 3D Strategy — Tiered, Opt-Out Safe

Three tiers layered from cheap → expensive. Each higher tier is additive over the lower.

### Tier 1 — Mesh Gradient + Grain (zero JS, always on)

CSS-only backdrop. Three overlapping `radial-gradient`s at very low opacity, with an SVG grain overlay at 2% opacity over `bg-primary`:

- Radial 1: center-top, `hsl(216 88% 88%)` at 12% opacity, 60vw radius (cobalt tint)
- Radial 2: bottom-left, `hsl(158 60% 84%)` at 8% opacity, 70vw radius (jade tint)
- Radial 3: right, `hsl(36 40% 92%)` at 6% opacity, 50vw radius (warm highlight)
- Grain: 160x160 SVG turbulence, `mix-blend-mode: multiply`, opacity 0.025

Result: paper-like depth, never moves, zero CPU.

### Tier 2 — Hero Object (optional, progressive enhancement)

A single 3D object on the hero ONLY (not full-screen). Sized ~420x420 desktop, right side. Two implementation options (pick one, user call):

**Option 2a — Spline scene (recommended for ship)**
- Design in Spline, export `.splinecode`
- Load via `@splinetool/react-spline` lazy
- Subject: translucent frosted polymer shape (extruded "K" monogram OR abstract injection-molded form)
- Material: glass/refractive, slight roughness, warm interior light
- Motion: drift rotation on Y axis, 60s per revolution, pause on hover for 400ms
- Fallback: static rendered PNG at same dimensions

**Option 2b — Hand-written R3F (more control, more risk)**
- Single `<mesh>` with `MeshPhysicalMaterial` (transmission 1, roughness 0.1, ior 1.45, thickness 0.5)
- Environment map: blurry indoor studio HDRI (neutral)
- Shape: imported GLB (designed elsewhere) OR procedural `extrudeGeometry` of "K" glyph
- Drift rotation via `useFrame` delta-based, respects `prefers-reduced-motion`

Motion is genuinely imperceptible (3°/sec) — object reads "alive" in peripheral vision, calm in focus.

### Tier 3 — Accent Micro-animations (rare, deliberate)

- Button press: translateY(1px) 80ms
- Focus ring bloom: 200ms ease-out
- Form success: 1 green checkmark stroke-draw, 400ms, then static
- RFQ submit: button → spinner → checkmark (no confetti)

### Tier 0 — Accessibility safe-path

If `prefers-reduced-motion: reduce` OR `saveData` OR `hardwareConcurrency < 4` OR no WebGL2:
- Tier 2 disabled entirely (no Spline load, no canvas)
- Tier 3 motion → instant state changes
- Tier 1 still renders (it doesn't move)

This is the ONLY place the dynamic `useShouldReduceMotion` hook fires. No more site-wide shader.

---

## 6. Component Inventory & Redesign Strategy

Each row: current state → new intent → who builds (MCP + agent).

| # | Component | Current | New | Builder |
|---|---|---|---|---|
| 1 | `Button` (primary/secondary/tertiary/ghost) | ad-hoc classes | token-driven, 3 sizes, 4 variants, proper states | 21st.dev Magic |
| 2 | `Badge` / `Tag` | none | spec rows, status pills | 21st.dev Magic |
| 3 | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `FileUploader` | ad-hoc | full form system, consistent focus ring, label+helper+error | 21st.dev Magic |
| 4 | `Card` (sector, reference, stat, spec) | none | 4 variants on warm paper bg, hairline border | 21st.dev Magic |
| 5 | `Divider` (hairline, section) | ad-hoc | tokenized | inline |
| 6 | `Header` | transparent on dark | solid `bg-primary`, hairline bottom, 72px tall, mono locale code | 21st.dev Magic + Stitch |
| 7 | `Footer` | dark already | dark `bg-ink` kept, but re-typed with display serif, 4-column grid | 21st.dev Magic + Stitch |
| 8 | `LocaleSwitcher` | dropdown | 4 mono codes (TR · EN · RU · AR), current underlined | 21st.dev Magic |
| 9 | `WhatsAppFab` | green circle fixed | keep, but jade token, subtle shadow, no bounce | inline |
| 10 | `KitaLogo` | inline SVG | keep, re-ink to `--color-text-primary` | inline |
| 11 | `SiteBackground` | fullscreen FBM shader | deleted; replaced by Tier 1 CSS mesh | delete + new CSS in globals |
| 12 | `Hero` (home) | dark hero text | display-xl serif headline, eyebrow monoSmall, 2 CTAs (cobalt + jade ghost), Tier 2 object right | Stitch screen + 21st.dev refinement |
| 13 | `SectorGrid` | 3 basic cards | 3 richer cards with photo thumb + title + 2 specs + arrow CTA | 21st.dev Magic |
| 14 | `ReferencesStrip` | logo strip | grayscale logos at 60% opacity, hover → 100%, hairline top/bottom, section eyebrow "Güvenen markalar" | 21st.dev Magic |
| 15 | Content pages (`hakkimizda`, `kalite`, `atolye`, `muhendislik`) | plain text | editorial layout: sidebar TOC + prose column + pull-quote, photos | Stitch screens |
| 16 | `İletişim` | 2-col (good) | palette swap, nicer card treatment for WA/TG, compact form | Stitch refinement |
| 17 | `/teklif-iste` hub | 2 funnel cards | 2 large decision cards with illustration + "Ne zaman kullanmalıyım?" micro-FAQ | Stitch + 21st.dev |
| 18 | `CustomRfqForm`, `StandartRfqForm` | basic inputs | grouped fieldsets, progress indicator, sticky submit, inline validation | 21st.dev Magic |
| 19 | Admin shell (`/admin/*`) | plain TR-only | distinct subtle bg (`bg-secondary`), left rail nav, top search, data-dense tables | 21st.dev Magic + Stitch |
| 20 | 404 | basic | centered display headline + primary CTA back home | inline |

---

## 7. MCP Workflow

Three tools orchestrated. Roles:

```
                   ┌───────────────────────────────┐
                   │  frontend-design skill        │
                   │  (methodology, quality gate)  │
                   └──────────────┬────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│  Stitch MCP    │      │ 21st.dev Magic │      │ firecrawl +    │
│  (page-level)  │      │ (component)    │      │ exa (inspo)    │
│                │      │                │      │                │
│ design system, │      │ buttons,       │      │ scrape ref     │
│ full screens,  │      │ cards, inputs, │      │ sites, extract │
│ screen         │      │ hero object,   │      │ tokens/motion  │
│ compositions   │      │ nav, footer    │      │ patterns       │
└────────────────┘      └────────────────┘      └────────────────┘
         │                        │                        │
         └────────────────────────┴────────────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │  Next.js codebase   │
                       │  (TSX + Tailwind)   │
                       └─────────────────────┘
```

Sequence:
1. **Research** (firecrawl + exa) — scrape ref sites, pull typography/spacing/motion patterns. Output: `.planning/research/redesign-inspiration.md`.
2. **Tokens in code** — hand-write `app/globals.css` v2 + Tailwind theme extension. No MCP needed for tokens.
3. **Stitch design system** — register our tokens in Stitch so screens match.
4. **Stitch screens** — generate 6 key screen compositions (home, sektör detay, iletişim, teklif-iste hub, custom RFQ, admin inbox). These are visual references, not code imports.
5. **21st.dev Magic per component** — for each of the 20 components, use `_inspiration` then `_component_builder`. Integrate hand-edited into `components/ui/`.
6. **Refine** — `_component_refiner` on top 5 polish-critical components (Button, Hero, SectorCard, RfqForm, ReferencesStrip).
7. **Logo pass** — `logo_search` for any client logos we lack SVG for (vs current static files in `public/logos/`).
8. **3D Tier 2 decision** — user picks 2a (Spline) or 2b (R3F). Then build.
9. **Page assembly** — wire components into pages, verify against Stitch screens.
10. **Polish + E2E update** — rewrite Playwright specs whose selectors change.

---

## 8. MCP Prompts (copy-paste ready, extremely detailed)

Each prompt assumes the MCP has received the token set from §4 as system context. Where tokens are referenced inline, use the hex values verbatim.

### Prompt S1 — Stitch: Create Design System

Tool: `mcp__stitch__create_design_system`

```
Name: "Kıta Plastik — Refined Industrial (Light)"

Description:
A light, warm, editorial design system for a 36-year-old Turkish plastic
injection manufacturer targeting B2B procurement teams. Aesthetic goal:
German engineering catalogue circa 1988, reprinted 2026. Calm canvas,
typographic gravity, spot accent colors used sparingly. No SaaS gloss,
no dark mode, no purple gradients, no pill buttons, no continuous ambient
animation.

Primary surface: warm off-white #FAFAF7 (paper).
Ink: deep warm black #0A0F1E.
Two accent colors, used at most 5% of visible pixels:
- Cobalt #1E4DD8 (primary action, engineering)
- Jade #0FA37F (secondary action, precision)
Alert amber #D97706 for warnings, alert red #B91C1C for errors.

Typography:
- Display: Fraunces variable (serif), opsz 72 for headlines ≥32px,
  weights 300/500/700. Tight tracking (-0.02em on display). Used for
  H1/H2 and any >24px heading.
- Body / UI: Hanken Grotesk variable (grotesque), weights 400/500/600/700.
  1.6 line-height, 0 tracking. Used for body, buttons, labels.
- Mono / numerics: JetBrains Mono 400/500. Tabular figures ON. Used for
  part numbers, phone/email, stat figures, locale codes.

Spacing: 8px grid, stack [4,8,12,16,24,32,48,64,96,128]. Desktop section
padding 96/128, mobile 48/64.

Radii: inputs 2px, buttons 4px, cards 8px, modals 16px. Never pills.

Shadows: hairline (1px), card (subtle layered warm-black at 4% alpha),
float (2-layer for modals), focus (cobalt 2px + paper 2px offset). No
heavy drop-shadow glows.

Motion: default 180ms, ease-out cubic-bezier(0.2, 0, 0, 1). No continuous
ambient. No fade-up-on-scroll chains. Accessibility tier disables all
Tier 2+ motion.

A11y: body text AA 4.5:1 minimum, AAA 7:1 on prose pages. Focus rings
always visible.

Brand voice: precise, honest, warm, unhurried. Turkish-first with EN/RU/AR
locales. Arabic uses ui-serif fallback since Fraunces lacks Arabic.
```

### Prompt M1 — 21st.dev Magic: Inspiration for Hero (industrial light)

Tool: `mcp__magic__21st_magic_component_inspiration`

```
/ui hero section, light warm paper background (#FAFAF7), B2B industrial
manufacturer (plastic injection molding), Turkish heritage since 1989,
premium editorial feel, display serif headline (Fraunces-like), subtle
eyebrow label in uppercase mono, two CTA buttons (primary solid cobalt
blue, secondary ghost with jade accent), single translucent frosted
polymer 3D object on the right occupying ~35% viewport width, generous
negative space, no SaaS tropes, no purple gradients, no pill buttons.
Reference tone: Fellow Products, Bang & Olufsen press, Stripe Atlas,
Hermle-AG machinery, Dyson engineering pages. AVOID: agency portfolios,
neon glows, parallax card stacks, video backgrounds.
```

### Prompt M2 — 21st.dev Magic: Button System (build)

Tool: `mcp__magic__21st_magic_component_builder`

```
Component: <Button>

Produce a React + TailwindCSS component file (TypeScript, strict) with
these exact specs:

VARIANTS (prop: variant)
- "primary": bg #1E4DD8, text #FAFAF7. Hover bg #1740B8. Active translateY(1px).
   Disabled bg #D9D6CF, text #8B94A5, cursor-not-allowed, no hover.
- "secondary": bg transparent, border 1.5px solid #0FA37F, text #0FA37F.
   Hover bg #E8F6F1, border #0C8A6A, text #0C8A6A. Active translateY(1px).
- "tertiary" (ghost): bg transparent, text #0A0F1E. Hover bg #F4F4EF.
   Active bg #E7E5E0. No border.
- "destructive": bg #B91C1C, text #FAFAF7. Hover opacity 0.92.

SIZES (prop: size)
- "sm": h-8 (32px), px-3, text-[14px], font-weight 500, gap-1.5 for icons.
- "md" (default): h-10 (40px), px-4, text-[15px], font-weight 500, gap-2.
- "lg": h-12 (48px), px-6, text-[16px], font-weight 600, gap-2.5.

SHAPE
- Radius 4px (never pills).
- Font: Hanken Grotesk (use CSS var --font-sans).
- Letter-spacing: 0.

STATES
- Focus-visible: outline none, box-shadow 0 0 0 2px #FAFAF7, 0 0 0 4px #1E4DD8.
- Loading: prop `isLoading` replaces label with centered spinner (stroke 2px,
  rotates 720ms linear). Button stays same width (measure before, reserve).
- Disabled overrides loading.

ICON SUPPORT
- Optional `leadingIcon` and `trailingIcon` React nodes.
- Icons auto-sized 16px (sm/md) or 18px (lg), stroke 1.5px.

ACCESSIBILITY
- Use <button> element. Accept all HTML button attributes.
- `aria-busy={isLoading}`, `aria-disabled={disabled}`.
- Spinner has `aria-hidden` and sr-only loading text.

MOTION
- All color transitions 180ms cubic-bezier(0.2, 0, 0, 1).
- No transform on hover (only on :active).

EXAMPLE USAGE
<Button variant="primary" size="lg" leadingIcon={<ArrowRight />}>
  Teklif İste
</Button>

DO NOT: add gradient backgrounds, shimmer effects, neon glows, rounded-full,
uppercase labels, shadow-xl, Framer Motion wrappers, scaling on hover.
The aesthetic is German catalogue, not Vercel landing page.
```

### Prompt M3 — 21st.dev Magic: SectorCard

```
/ui B2B industrial sector card, light warm paper background #FAFAF7,
card surface #FFFFFF with hairline border #E7E5E0, radius 8px,
padding 32px desktop / 24px mobile. Internal layout:

1. 64px square technical icon (stroke-only, 1.5px stroke, color #0A0F1E).
   Icons are custom line drawings of the sector subject (glass-washing
   crates, caps/lids, textile components). No filled icons. No emoji.
2. Section eyebrow (uppercase Hanken Grotesk 12px, tracking 0.08em,
   color #8B94A5). Example: "SEKTÖR 01".
3. Headline (Fraunces serif 26px/1.2, weight 500, color #0A0F1E).
   Example: "Cam Yıkama".
4. Two-line description (Hanken Grotesk 15px/1.5, color #525A6B).
5. Spec row: 2 bullets with mono numerics (JetBrains Mono 13px),
   e.g., "Ø 80–320 mm  ·  12 g–480 g".
6. Footer: "Detaylara git →" link (Hanken Grotesk 14px 500, color #1E4DD8,
   arrow moves 2px on hover, no color change).

CARD HOVER: background #F4F4EF, border stays, shadow adds 0 4px 12px rgba(10,15,30,0.04),
transition 180ms ease-out. No scale, no translate, no tilt.

NO: gradient overlays, photo backgrounds, dark overlays, badges, pills,
"Learn more" buttons in English, skeumorphic shadows.
```

### Prompt M4 — 21st.dev Magic: ReferencesStrip

```
/ui client-logo trust strip for B2B manufacturer, full-width band set into
warm paper bg #FAFAF7, bordered top and bottom with 1px hairline #E7E5E0,
vertical padding 64px desktop / 48px mobile. Inside:

- Optional eyebrow above: "GÜVENEN MARKALAR" (uppercase Hanken Grotesk 12px,
  tracking 0.1em, #8B94A5, centered, 32px below becomes the logo row).
- Logo row: 8 logos horizontally, equal spacing via flex gap 48px desktop /
  24px mobile. Each logo capped at height 36px desktop / 28px mobile,
  max-width 140px, object-fit contain.
- All logos rendered as grayscale (filter: grayscale(1) brightness(0.6)),
  opacity 0.55 at rest.
- Hover on a single logo: grayscale 0, opacity 1.0, siblings stay muted.
- Transition 180ms ease-out.
- Mobile: logos scroll horizontally with snap points, 3-4 visible at once,
  no scrollbar, 16px edge padding.

NO: animated marquee, carousel arrows, pagination dots, "Trusted by 10,000+"
counter, gradient fades on scroll container.
```

### Prompt M5 — 21st.dev Magic: Form field system

```
Component pack: <TextField>, <TextArea>, <SelectField>, <FileUploader>, <Checkbox>.

All share a <Field> primitive:
- Label above, 14px Hanken Grotesk 500, color #0A0F1E, margin-bottom 8px.
- Helper text below, 13px Hanken Grotesk 400, color #525A6B.
- Error text replaces helper, color #B91C1C, same size, slide 4px, 180ms.
- Required indicator: asterisk in #B91C1C after label, or "(opsiyonel)" in #8B94A5.

Inputs:
- Height 44px, padding-x 14px, font-size 15px, font Hanken Grotesk 400.
- Border 1px #D9D6CF, bg #FFFFFF, radius 2px (intentionally sharper than cards).
- Hover border #A8A59E.
- Focus: outline none, border #1E4DD8 1.5px, box-shadow 0 0 0 3px #EEF2FE.
  180ms transition.
- Disabled bg #F4F4EF, text #8B94A5, cursor-not-allowed.
- Invalid: border #B91C1C, focus-shadow rgba(185,28,28,0.12).

TextArea: min-height 120px, resize vertical only.

SelectField: custom caret chevron 14px (stroke 1.5px), color #525A6B,
right-padding 36px. Dropdown uses radix-ui primitives, surface
#FFFFFF, shadow-float, radius 8px, item hover bg #F4F4EF.

FileUploader: dashed border 1.5px #D9D6CF, bg #FAFAF7, 24px padding,
centered. Drop hover: bg #EEF2FE, border solid #1E4DD8. File list below:
each row is filename (Hanken 14px) + size in mono (#8B94A5) + remove
button (ghost, red on hover).

Checkbox: 16px square, border 1.5px #A8A59E, radius 2px. Checked bg
#1E4DD8, border same, white checkmark stroke. Label 15px 400 ink.

AUTOFILL: override webkit autofill yellow to #FFFFFF bg, #0A0F1E text.

ACCESSIBILITY
- All fields use <label htmlFor>. No placeholder-as-label.
- Error messages linked via aria-describedby.
- Focus order: label does not receive focus, input does.
- FileUploader: keyboard accessible (Enter/Space triggers file dialog).
```

### Prompt M6 — 21st.dev Magic: Header (top nav)

```
/ui top navigation bar for Turkish B2B industrial manufacturer. Full width,
height 72px desktop / 60px mobile, bg #FAFAF7 (same as page), hairline
bottom border #E7E5E0. Inside a max-width 1280px container with 32px
horizontal padding:

- Left: KitaLogo SVG (company mark), height 28px, link to /.
- Center desktop / hamburger mobile: nav links. Links are Hanken Grotesk 15px
  weight 500, color #525A6B, 24px gap. Active link color #0A0F1E with a
  2px underline (2px below baseline) in #1E4DD8, 20px long. No drop-down
  menus. Links: Sektörler, Ürünler, Mühendislik, Referanslar, Hakkımızda, İletişim.
- Right: LocaleSwitcher + primary CTA "Teklif İste" (Button variant primary
  size sm).

LocaleSwitcher: four monospace codes TR · EN · RU · AR (JetBrains Mono 13px,
#8B94A5, with dots between). Current locale colored #0A0F1E with underline.
Clicks swap locale.

Sticky: bg stays #FAFAF7 on scroll (NOT translucent), border gets slightly
darker #D9D6CF after 80px scroll, shadow-hairline appears.

Mobile: hamburger opens full-screen overlay, links stacked 24px gap, 32px
horizontal padding, locale switcher at bottom above CTA.

NO: blur backdrops, gradient shadows, mega-menus, cart icon, login/signup
pair, announcement bar, search input in header.
```

### Prompt M7 — 21st.dev Magic: Footer

```
/ui footer for Turkish B2B manufacturer, used once per page as visual
anchor. Full width, bg #0A0F1E (deep ink block), text #FAFAF7, padding
96px top / 48px bottom desktop, 64px/32px mobile. Inside max-width 1280px.

Layout: 4-column grid desktop, single column mobile, with 48px gap.

Column 1 (brand): KitaLogo in inverse (white), 32px height. Then address
block in Hanken Grotesk 14px 400 with tabular figures, line-height 1.7.
Example:
  Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.
  Organize Sanayi Bölgesi
  16159 Bursa, Türkiye
Then mono block of phone + whatsapp + email, JetBrains Mono 13px.

Column 2 (sitemap): heading "Sektörler" (Fraunces 18px 500) then links
stacked, Hanken 14px 400, color rgba(250,250,247,0.7), hover 1.0.

Column 3 (şirket): "Şirket" heading + Hakkımızda · Kalite · Atölye ·
Mühendislik · Referanslar.

Column 4 (iletişim): "İletişim" heading + Teklif İste (primary Button in
inverse style — bg #FAFAF7 text #0A0F1E), then 2 secondary links.

Bottom strip: 1px divider rgba(250,250,247,0.1), below it on desktop a
flex row with: "© 2026 Kıta Plastik" left (Hanken 13px, opacity 0.5),
legal links right ("Gizlilik · KVKK · Çerezler"). Mobile: stacked.

NO: newsletter signup, social icon grid larger than 3, "built with ❤️",
dark gradient, back-to-top button.
```

### Prompt S2 — Stitch: Hero screen composition

Tool: `mcp__stitch__generate_screen_from_text`

```
Screen: Home Hero

Context: Landing page hero for Kıta Plastik, a 36-year-old Turkish plastic
injection manufacturer. Uses the "Refined Industrial (Light)" design
system already registered.

Layout (desktop 1440w):
- 1280w container, 96px top padding, 128px bottom padding.
- Two-column: left 7/12, right 5/12, 48px gutter.

LEFT COLUMN
- Eyebrow: mono 13px uppercase letter-spaced "EST. 1989 · BURSA, TÜRKİYE"
  in color #8B94A5.
- Display headline, Fraunces 72px/1.05 weight 500, color #0A0F1E,
  max-width 560px: "Plastik enjeksiyonun mühendislik partneri."
  The word "mühendislik" is weight 300 italic for quiet emphasis.
- Sub: Hanken Grotesk 18px/1.55 weight 400 color #525A6B, max-width 520px,
  24px margin-top: "36 yıllık üretim deneyimi. Bursa atölyemizden cam
  yıkama, kapak ve tekstil sektörlerine özel üretim ve mühendislik."
- CTA row, 32px margin-top:
  • Primary Button "Teklif İste" (cobalt solid, size lg, trailing arrow icon)
  • Secondary Button "Sektörleri Keşfet" (jade ghost, size lg)
- 48px margin-top: 3 KPI row with mono figures:
  "36" years · "3" sectors · "24/7" technical support
  Each figure JetBrains Mono 32px 500, label below Hanken Grotesk 13px
  #8B94A5. Dividers hairline 1px vertical #E7E5E0 between.

RIGHT COLUMN
- Hero object slot, 420x420 centered. Tier 2 Spline scene (frosted
  translucent polymer abstract mark), drift rotation 60s/rev. Shadow
  beneath: soft oval shadow-float, mix-blend-multiply, 40px y-offset,
  80px blur, color rgba(10,15,30,0.06).
- Below object: tiny mono caption "POLI-DM™ cross-section · 1:2" in
  #8B94A5 13px, centered.

BACKGROUND: Tier 1 mesh (three soft radial gradients on #FAFAF7). No
video, no particles, no animated SVG. Section divider at bottom: single
hairline #E7E5E0 full width.

Mobile (390w): Single column, object stacks below text at 280x280,
display headline drops to 48px.
```

### Prompt S3 — Stitch: Teklif-İste hub screen

```
Screen: RFQ Hub (/teklif-iste)

Context: Users choose between two request types — "Özel Üretim" (custom)
or "Standart Ürün" (catalog). This screen is the decision point.

Layout (desktop 1280w):
- 96px top padding.
- Breadcrumb: "Anasayfa / Teklif İste" Hanken 13px 400 #8B94A5, 32px below.
- Display headline: Fraunces 56px/1.1 weight 500 "Hangi teklifi istiyorsunuz?"
- Sub (Hanken 17px #525A6B, max-w 560px): "İhtiyacınıza en uygun yolu
  seçin. Özel ürün gerektiriyorsa mühendislik ekibimiz sizi yönlendirir."
- 64px margin-top: 2-column grid, 32px gap, two large decision cards.

EACH DECISION CARD
- Width equal, min-height 360px, bg #FFFFFF, border hairline #E7E5E0,
  radius 8px, padding 40px.
- Top: 48px icon (stroke line art, custom for each).
  • Card A: gear + wrench crossed (for "Özel Üretim")
  • Card B: grid of 3x3 items (for "Standart Ürün")
- Eyebrow mono 12px "A" / "B" in color #1E4DD8 (card A) or #0FA37F (card B).
- Card headline Fraunces 28px 500: "Özel Üretim" / "Standart Ürün".
- 3-line description, Hanken 15px 400 #525A6B.
- Divider hairline 24px margin-y.
- Meta-list, 3 rows:
  • "Tipik süreç: 3–5 iş günü / 1 saat içinde"
  • "Ekler: CAD, teknik çizim, fotoğraf / Ürün kodu, adet"
  • "Sonuç: Teklif + DFM önerisi / Fiyat + stok durumu"
  Each row: icon 14px + mono label + Hanken value.
- Bottom: "İleri →" link-button occupying full width bottom, Button tertiary
  with trailing arrow. Card A uses cobalt arrow, Card B uses jade.

CARD HOVER: bg #FAFAFA, border #D9D6CF, shadow-card. 180ms.

Below cards: 48px margin-top, small FAQ-lite strip of 3 Q&A ("Kaç dosya
yükleyebilirim?" etc.) in a flat list, not accordion.

FOOTER spacing: 128px bottom padding.

NO: pricing tables, video testimonials, "Most popular" badges on either
card, chat widget mention.
```

### Prompt M8 — 21st.dev Magic: Admin Inbox table

```
Component: <InboxTable>

Admin-only view listing RFQ submissions. Turkish-only UI.

Layout: full-width table inside a <Card>-like surface. bg #FFFFFF,
border #E7E5E0, radius 8px, overflow hidden.

Header row: bg #F4F4EF, height 44px, columns:
- Checkbox (40px) · Durum (120px) · Kind (80px) · Ad Soyad (180px) ·
  Firma (200px) · E-posta (auto) · Ek (60px) · Tarih (140px) · ⋯ (44px)
Column labels: mono 12px uppercase tracking 0.08em #525A6B.

Body rows: height 56px, hairline divider between rows (#E7E5E0).
- Checkbox (padded).
- Status pill: small 24px tall pill with tokenized colors
  - "new" bg #EEF2FE text #1E4DD8
  - "reviewing" bg #E8F6F1 text #0FA37F
  - "quoted" bg #FEF3C7 text #92400E
  - "closed" bg #F4F4EF text #525A6B
- Kind: mono 13px "CUSTOM" or "STANDART", color #0A0F1E.
- Name / Firma: Hanken 14px 500 (name) / 400 (firma), #0A0F1E / #525A6B.
- E-posta: mono 13px, truncate with ellipsis.
- Ek: icon-only paperclip + count ("3") if any, mono 12px.
- Tarih: mono 13px "18 Nis 2026" format + relative "· 2sa" in #8B94A5.
- Actions: ghost kebab button, opens dropdown (Görüntüle / Durumu
  Değiştir / E-posta Yanıtla / Sil).

Row hover: bg #FAFAF7. Row selected (checkbox): bg #EEF2FE left border 2px #1E4DD8.

Empty state: centered block 48px padding, icon + "Henüz teklif yok"
Fraunces 20px + Hanken 14px #8B94A5 helper + primary button "Form linkini kopyala".

Pagination footer: inside table, bg #FAFAF7, border-top hairline, 48px tall.
Left: "1–20 / 73" Hanken 13px #525A6B. Right: prev/next mono chevrons.

Bulk actions bar (appears when any checkbox selected): slides in from top,
bg #EEF2FE, border-bottom 1px #1E4DD8, 48px tall, shows "3 seçildi" mono
+ "Durum değiştir" dropdown + "Sil" destructive button. 180ms slide.

Responsive: below 900px, table becomes stacked cards with same info
reordered (status + date top row, name + firma middle, email bottom,
actions as full-width ghost button).
```

### Prompt M9 — 21st.dev Magic: Spline hero object spec

NOTE: This is a DESIGN prompt for the user to take to Spline. MCP can't
design 3D scenes; we produce the spec here.

```
Spline scene spec (for export as .splinecode, ~200-400KB):

Subject: Abstract frosted polymer monogram "K" reinterpreted as a
precision-molded component. Not a literal letter — a sculptural object
that READS as K from the primary camera angle and dissolves into a
generic abstract shape from other angles.

Geometry:
- Extruded 2D path (the K silhouette) with 24mm depth.
- Bevel: 2mm, 3 segments. Never sharp corners — subtle chamfer.
- Edge rounding via subdivision surface, light (level 1).

Material: Physical glass / translucent polymer.
- baseColor: #F4F4EF (warm paper tint from inside)
- transmission: 0.92
- roughness: 0.18
- ior: 1.48
- thickness: 4.0 (enables attenuation color)
- attenuationColor: #D9E9FF (very subtle cool cast in thick sections)
- attenuationDistance: 180
- clearcoat: 0.35, clearcoatRoughness: 0.12

Lighting (3-point soft):
- Key: area light top-right, 45° azimuth 60° elevation, warm (#FFF4E6),
  intensity 3.0, size 2x3.
- Fill: area light left, cool (#EAF2FF), intensity 1.2, size 3x2.
- Rim: small spot behind-right, 3000 lumens, neutral.
- Environment: studio HDRI, blurred heavily (roughness 1.0 on IBL),
  intensity 0.4. No visible background.

Camera: Perspective, focal length 85mm equivalent, slight downward tilt
(−6°). Framing: object occupies ~70% of 420x420 viewport, 20% top
headroom.

Animation: Single looped keyframe on Y rotation. 0→360° over 60s,
perfectly linear (constant angular velocity). Prefers-reduced-motion
triggers the fallback (Spline's built-in attribute) to pause at 0°.

Floor shadow: single disc below object, 2x object width, radial gradient
#0A0F1E center at 8% alpha → transparent at edge, mix-blend-multiply.

Export target: .splinecode, 60fps capped, alpha background transparent.
File size target <500KB. Fallback static render: PNG 840x840 @2x with
shadow baked in, transparent bg.

AVOID: chrome/metal look, rainbow dispersion, strong specular highlights,
floor reflection, multiple objects, particles, motion blur.
```

### Prompt S4 — Stitch: Sector detail screen

```
Screen: Sector Detail (e.g., /sektorler/cam-yikama)

Layout (desktop 1280w, 96px top padding):
- Breadcrumb "Anasayfa / Sektörler / Cam Yıkama".
- Hero block: 50/50 split
  • Left: eyebrow "SEKTÖR 01", Fraunces 56px headline "Cam yıkama
    makinesi bileşenleri", 17px sub 520 max, meta line "Üretim hattı
    no: B2 · Kalıp sayısı: 14 · Aylık kapasite: 480.000 adet" in mono 13px.
  • Right: 560x420 technical photograph of a clean factory floor or
    ultrasonic bath detail. Hairline border, radius 8px.
- 96px spacer.
- 3-col specifications strip: each col has 48px line-icon, Fraunces 22px
  title, 2-line body, hairline dividers vertical between.
- 96px spacer.
- "Ürün ailesi" section: 4-up grid of small product cards (photo + name +
  2-line spec + mono SKU). Photo 1:1, radius 4px.
- 96px spacer.
- "Kalite & sertifikalar" section: 6-up logo grid (ISO, CE, TSE, etc.),
  grayscale muted like ReferencesStrip. Below each logo, 11px mono caption.
- 96px spacer.
- Closing CTA block: centered, max-w 640, eyebrow mono, Fraunces 36px
  "Bu sektörde bir projemiz mi var?", 2 CTAs side by side.
- 128px bottom padding.

No case-study slider, no "Why us" 6-icon grid, no price tiers.
```

### Prompt R1 — 21st.dev Magic: Refiner (top 5 components)

After M2–M8 produce initial components, run refiner with:

```
Refine these 5 components against the "Refined Industrial (Light)"
design system. Prioritize:

1. Typographic alignment (exact px from token scale, no stray 15.5px).
2. Focus ring uniformity (2px paper offset + 4px cobalt for all interactive).
3. Remove any leftover gradient, shimmer, scale-on-hover, pill radius,
   or Tailwind-default shadow.
4. Verify Turkish character rendering (İ / ı / ş / ğ / ü) for every
   variable font.
5. Add proper dir="auto" / logical properties so components flip in
   Arabic locale without breaking.
6. Measure button + input heights — they must be 32 / 40 / 48 (buttons)
   and 44 (inputs) exactly.
7. Strip aria labels that duplicate visible text; keep only meaningful ones.
```

### Prompt L1 — logo_search for references strip

Tool: `mcp__magic__logo_search`

Query each client brand for canonical SVG:

```
Queries (one at a time, SVG format, inverse-dark OR monochrome variant preferred):
- Şişecam
- Arçelik
- BSH Türkiye
- Vestel
- Eczacıbaşı
- Coca-Cola İçecek (Türkiye)
- PepsiCo Türkiye
- Hayat Kimya
(Replace with actual client list from public/logos/)
```

If a brand's logo isn't commercially redistributable, use the existing
static in `public/logos/` and skip.

---

## 9. Execution Phases

| # | Phase | Tasks | Dependencies | Est. |
|---|---|---|---|---|
| 0 | Research + approval | scrape 8 ref sites, pull tokens, user signs off on direction | — | 1 session |
| 1 | Tokens + fonts | globals.css v2, Tailwind theme, self-host Fraunces + Hanken Grotesk, matchMedia AR fallback | 0 | 1 session |
| 2 | Primitives | Button · Badge · Input set · Card · Divider · Dropdown · Modal — integrated into `components/ui/` | 1 | 2 sessions |
| 3 | Shell | Header · Footer · LocaleSwitcher · WhatsAppFab palette swap · delete SiteBackground + replace with Tier 1 mesh CSS | 1 | 1 session |
| 4 | Public pages | Hero · SectorGrid · ReferencesStrip · all content pages · İletişim · 404 | 2, 3 | 2 sessions |
| 5 | RFQ + Admin | /teklif-iste hub · Custom/Standart forms · /admin/login · /admin shell · inbox · bildirimler | 2 | 2 sessions |
| 6 | 3D Tier 2 (optional) | Spline export OR R3F build, integration, static fallback | 4 | 1 session |
| 7 | Polish + E2E | Playwright selector updates · Lighthouse ≥ 95 · contrast audit · type-check clean · remove probe-* scripts | 4, 5, 6 | 1 session |

Total: ~10 sessions (~3–5 days of Claude Opus time). Can run phases 2+3 in parallel with subagent-driven-development.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Fraunces or Hanken miss a Turkish/Cyrillic glyph | Pre-verify with Turkish test string `İĞÜŞÖÇığüşöç`, Cyrillic `ЖЩЪЮ`. Font subset lookup step before ship. |
| Spline scene too heavy (>500KB) or slow first-load | Static PNG fallback always wired; lazy-load Spline only after hero is painted + on idle. |
| Existing unit tests (73) break on color/class changes | Tests assert text + role, not class — expected pass rate ≥ 95%. Update the few that grep hex. |
| E2E Playwright selectors change (hero "Bizimle iletişime geçin" etc.) | Update specs in same commit as text changes; quarantine flaky for 24h if needed. |
| Admin UI feels too "same" as public (no visual hierarchy) | Admin uses `bg-secondary` (#F4F4EF) base + elevated cards + tighter density. Optional subtle monospaced grid background. |
| User wants to revert | Tag current state `v0.2-dark-industrial` before any Phase 1 commit; all work on feature branch `redesign/light-refined` until approved. |

---

## 11. Out of Scope

- Complete re-translation (copy stays; we only re-type it)
- Switching CMS / backend — Supabase schema untouched
- Changing 4-locale strategy
- Adding new pages beyond what Plan 1–3 defined
- Dark mode toggle — single theme, light only. If requested, revisit post-ship.
- Marketing illustrations beyond the Spline hero — no custom 2D art this phase.

---

## 12. Success Criteria

- [ ] All body-text / border combinations pass AA 4.5:1; prose pages pass AAA 7:1.
- [ ] Lighthouse (mobile, simulated throttling) home ≥ 95 all categories.
- [ ] First Contentful Paint ≤ 1.2s, LCP ≤ 1.8s (4G), CLS < 0.03.
- [ ] Zero `console.log` / `console.warn` in production build.
- [ ] All 73 unit tests pass (or rationale noted + replaced); E2E specs updated and green.
- [ ] No continuous-motion element in the default Tier 2 scene at ≥ 10px/s.
- [ ] Works in Safari 17 / Firefox 127 / Chromium 124 / iOS 17 Safari / Android Chrome 125.
- [ ] User reports: "I could read this for 20 minutes without my eyes hurting."

---

## 13. First two commands on approval

1. Create branch `git checkout -b redesign/light-refined` and tag current `v0.2-dark-industrial`.
2. Phase 0: research via
   ```
   mcp__firecrawl__firecrawl_scrape(url="https://linear.app", formats=["markdown", "html"])
   mcp__firecrawl__firecrawl_scrape(url="https://stripe.com/atlas", ...)
   ...
   ```
   and dump parsed token/layout notes into `.planning/research/redesign-inspiration.md`.
