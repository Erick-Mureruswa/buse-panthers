# BUSE Panthers — *Cold-Blooded*

A flagship, immersive single-page experience for the **BUSE Panthers** basketball
program (Bindura University of Science Education) — designed and engineered by
**[ZimDevs](https://zimdevs.co.zw)** as a portfolio / lead-generation asset.

> **Visual direction:** *Arctic Panther* — deep navy-black, ice cyan, white.
> Cold, precise, futuristic. Built to make a viewer ask *"who built this?"*

---

## What's in here

```
busePanthers/
├── index.html              # the whole experience (semantic, SEO + JSON-LD)
├── assets/
│   ├── css/
│   │   ├── tokens.css      # design system: colour, type scale, motion, spacing
│   │   ├── base.css        # reset, nav, cursor, preloader, buttons, marquee
│   │   └── sections.css    # every section's bespoke layout
│   ├── js/
│   │   └── app.js          # Lenis + GSAP/ScrollTrigger engine, canvas, reveals
│   └── img/
│       └── panther-mark.svg # custom geometric panther emblem (the logo system)
├── vercel.json             # security headers + asset caching
└── README.md
```

No build step. No framework. Libraries (GSAP, ScrollTrigger, Lenis) load from CDN.

## Sections / the journey

1. **Preloader** — animated emblem draw + counter, curtain reveal
2. **Hero** — kinetic "COLD / BLOODED" type over a live constellation + court grid
3. **Identity** — scroll-scrubbed manifesto + three brand pillars
4. **Roster** — draggable player cards with jersey-number watermarks
5. **Numbers** — animated count-up stat grid ("Proof, not promises")
6. **Season** — live countdown to the next game + results ledger
7. **Moments** — bento gallery
8. **Join** — fan / season-pass conversion section
9. **Built by ZimDevs** — the case-study lead-gen section (the showpiece)
10. **Footer**

## Run locally

It's static — open `index.html`, or serve the folder:

```bash
npx serve busePanthers        # or: python -m http.server -d busePanthers
```

## Deploy (Vercel)

From the repo root:

```bash
cd busePanthers
vercel            # preview
vercel --prod     # production
```

`vercel.json` sets a CSP that allowlists the GSAP (cdnjs), Lenis (jsdelivr) and
Google Fonts origins. If you self-host those (recommended for top Lighthouse),
tighten the CSP accordingly.

---

## 🔁 Swapping in the real BUSE Panthers assets

Everything below is crafted placeholder content, structured so real data drops in
cleanly. Search `index.html` for these anchors:

| Replace | Where | How |
|---|---|---|
| **Logo / emblem** | `assets/img/panther-mark.svg` + inline `<symbol id="ico-panther">` in `index.html` | Swap the SVG; keep the `id` so every `<use>` updates at once. |
| **Player photos** | `.player-card__photo` in `#roster` | Real photos live in `assets/img/players/`. A photo card uses `class="player-card player-card--photo"` and an `<img class="ph">` + `<span class="player-card__tint">` inside `.player-card__photo` (see the `#77` and `#12` cards). Stylized squad cards keep the `<svg><use…></svg>` mark — swap them the same way as photos arrive. |
| **Dual-image swap** | `.player-card--swap` (the `#77` "EKS" card) | Two `<img class="ph ph-a/ph-b">` cross-wipe on hover (desktop) or tap (touch). Drop in `ph-a`/`ph-b` sources; CSS handles the clip-wipe + cyan sweep. |
| **Roster data** | `.player-card` markup (`#roster`) | Edit number, name, position, stats, and the `★ Captain` badge. **The `#77` (EKS) and `#12` names are placeholders — replace with the real names/positions.** |
| **Stats** | `.stat` blocks (`#numbers`) | Edit `data-count`, `data-prefix`, `data-suffix` and the label. |
| **Schedule / results** | `.next-game` + `.fixtures` (`#season`) | Edit team names, dates, venues, scores. Countdown target is computed in `initCountdown()` — point it at a real fixture datetime. |
| **Gallery** | `.gallery__tile` (`#gallery`) | Add `background-image` (or an `<img>`) per tile and update the caption. |
| **Pricing / CTAs** | `#join` | Wire the buttons to real ticketing / social URLs. |
| **Contact** | `#zimdevs` + footer | Already points to `zimdevs.co.zw` and `hello@zimdevs.co.zw`. |

When you add player photos, also add explicit `width`/`height` (or an aspect-ratio
wrapper — the cards already use `aspect-ratio: 3/4`) to keep CLS at zero.

## Engineering notes

- **Performance:** GPU-only transforms (`transform`/`opacity`), deferred scripts,
  IntersectionObserver reveals, canvas paused off-screen, capped DPR. No raster
  images shipped — all visuals are SVG/CSS/canvas.
- **Accessibility:** semantic landmarks, skip link, ARIA labels, visible focus,
  `prefers-reduced-motion` fully honored (smooth scroll, scrub, cursor, and
  count-ups all degrade gracefully).
- **Responsive:** mobile-first, verified at 390px and 1440px with **zero
  horizontal overflow**; fluid `clamp()` type and spacing throughout.
- **For Lighthouse 95+:** self-host the four font families and subset them; that's
  the single biggest remaining win.

---

**Design & build — [ZimDevs](https://zimdevs.co.zw)** · hello@zimdevs.co.zw
*We create websites that make organizations impossible to ignore.*
