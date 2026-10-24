# design.md — Rewind

> Look: **"Sticker Arcade."** A light, chalky canvas with thick ink outlines, hard offset shadows, flat candy-pastel color blocks, and chunky arcade-style buttons. Gamified, but every screen still has one obvious thing to press.
> Rule of thumb: if it glows, gradients, or looks like a SaaS dashboard, it is wrong.

---

## 1. Design principles

1. **Flat, outlined, tactile.** 2.5px ink outlines + hard offset shadows (no blur). Buttons look pressable.
2. **Color means state.** Yellow = you are here / do this. Pink = trouble. Seafoam = saved. Frost = rewind. Never decorative.
3. **One thing to press.** One primary button per screen, always yellow.
4. **No glow, no gradients, no glassmorphism, no neon.** Motion provides the "shine", not color.
5. **Big and readable.** Projector-friendly: body 18px minimum.

---

## 2. Color palette ("Sticker Arcade")

Deliberately avoids: shiny/royal blue, navy, orange, shiny red, shiny green, shiny purple/indigo, brown, beige/skin tones, neon cyan, and gradients of any kind.

| Token | Name | Hex | Use |
|---|---|---|---|
| `--ink` | Ink | `#17171C` | Text, outlines, shadows, nav bar |
| `--chalk` | Chalk | `#F2F2EE` | App background |
| `--card` | Paper | `#FFFFFF` | Cards, inputs |
| `--stone` | Stone | `#D9D9D4` | Locked / disabled / empty meter |
| `--butter` | Butter | `#FFDC4A` | **Primary action, current step**, selected |
| `--flamingo` | Flamingo | `#FF86AD` | Alerts, wrong choice, danger, glitch |
| `--seafoam` | Seafoam | `#8FE3CB` | Solved, saved timeline, correct |
| `--frost` | Frost | `#BDE8F2` | Rewind, tokens, info |
| `--mute` | Slate Text | `#5B5B66` | Secondary text (4.5:1 on Chalk) |

**Pairing rules**
- Text on any color fill is always **Ink**. Never white text on pastels.
- Maximum 2 accent colors visible on a screen at once (plus Ink/Chalk/Stone).
- Hover/pressed states: shift the button by the shadow offset instead of changing its color.

**Evidence card tints** (flat fills, ink outline): log = Paper with mono text on a Stone header strip · metric = Butter · message = Frost bubble · screen = Paper with dashed ink wireframe.

---

## 3. Typography

All from Google Fonts. No Inter, no Space Grotesk, no system-default stacks.

| Role | Font | Weight | Size / Line |
|---|---|---|---|
| Display / headings | **Bricolage Grotesque** | 800 | H1 44/48 · H2 30/34 · H3 22/28 |
| Body / UI | **Instrument Sans** | 500 / 600 | 18/28 body · 15/22 small |
| Evidence / numbers | **DM Mono** | 500 | 16/24 |
| Big numbers (score, meter) | Bricolage Grotesque | 800 | 56/56 |

Headings: sentence case. Buttons: sentence case, 600 weight. Letter-spacing: -1% on display only.

---

## 4. Shape, spacing, depth

| Token | Value |
|---|---|
| Outline | `2.5px solid var(--ink)` |
| Radius (cards) | 20px |
| Radius (buttons, chips) | 14px |
| Radius (pills, nodes) | 999px |
| Shadow (hard offset) | `4px 4px 0 var(--ink)` (cards) · `3px 3px 0 var(--ink)` (buttons) |
| Pressed button | translate(3px,3px), shadow 0 |
| Spacing scale | 4 · 8 · 12 · 16 · 24 · 32 · 48 |
| Max content width | 760px, centered |
| Page padding | 16px mobile · 32px desktop |

Tailwind snippet (put in `tailwind.config.ts` → `theme.extend`):
```ts
colors: {
  ink: '#17171C', chalk: '#F2F2EE', stone: '#D9D9D4',
  butter: '#FFDC4A', flamingo: '#FF86AD', seafoam: '#8FE3CB',
  frost: '#BDE8F2', mute: '#5B5B66',
},
boxShadow: { card: '4px 4px 0 #17171C', btn: '3px 3px 0 #17171C' },
borderRadius: { card: '20px', btn: '14px' },
fontFamily: {
  display: ['Bricolage Grotesque', 'sans-serif'],
  sans: ['Instrument Sans', 'sans-serif'],
  mono: ['DM Mono', 'monospace'],
},
```

---

## 5. Navbar (global, slim)

Fixed top, 64px tall, Ink background, Chalk text, 2.5px bottom outline not needed (it's solid ink).

```
[ ⏪ Rewind ]      Case   Curve   New skill            🔥 3   ★ 240   ⏪⏪⏪
 logo (left)       nav (max 3 links)                    stats cluster (right)
```

- **Logo:** word "Rewind" in Bricolage 800 with a small butter-yellow rewind-arrow badge.
- **Links (max 3):** `Case` (current case), `Curve` (learning curve page), `New skill` (restart at Home). Active link: Butter pill with Ink text.
- **Stats cluster:** streak (flame icon in Butter), score (star icon), rewind tokens (3 Frost circles, filled = available). These are display only, not links.
- **Mobile:** links collapse into a 3-icon bottom tab bar (same Ink background). Stats stay at top.
- No dropdowns, no hamburger, no search.

---

## 6. Core components

### Primary button ("Press")
Butter fill, Ink text 600, 2.5px outline, `shadow-btn`, 56px tall, full width on mobile. Pressed: translate(3px,3px), no shadow. Disabled: Stone fill.

### Option button (the 4 choices)
Paper fill, ink outline, `shadow-btn`, left badge with letter (A–D) in a Chalk circle. Hover: Butter fill. Selected: Butter. After reveal: correct = Seafoam with check, chosen-wrong = Flamingo with cross, others fade to 40%.

### Timeline strip (the roadmap)
Horizontal row of 5 nodes joined by a 3px ink line (dashed where locked).
- **Done:** Seafoam circle, check icon. **Perfect (0 rewinds):** Seafoam with a Butter ring and a small star.
- **Current:** Butter circle, slightly larger, bouncing pulse (scale 1 → 1.12, 1.4s loop).
- **Locked:** Stone circle with lock icon, dashed line.
- Under the current node only: incident title (small, Ink).
- Mobile: same strip, nodes 36px, titles hidden.

### Stability meter
Pill-shaped bar, 28px tall, ink outline, Stone track. Fill color by value: ≤30 Flamingo · 31–69 Butter · ≥70 Seafoam (flat fill, no gradient). Number on the right in DM Mono. Fill animates with a spring (~600ms; 900ms when dropping). Subtle tick marks every 25%.

### Alert banner (Incident screen)
Flamingo fill, ink outline, hard shadow, slight 0.5° rotation. Siren icon (line) + the alert headline in Bricolage 800. Clock line underneath in DM Mono.

### Evidence card
Paper card, ink outline, 20px radius. Header strip with the kind label (LOG / METRIC / MESSAGE / SCREEN) in DM Mono caps on its tint. Content max 25 words.

### Debrief card
Big Paper card with a Butter "ribbon" label ("Rule of thumb"). Rule of thumb text in Bricolage 800, 30px. Below: three short rows (Why it works / In real life / Up next) each with a tiny Frost, Butter, Chalk icon chip.

### Share card (Incident Report)
1080×1350 export. Chalk background, big Ink outline frame, rank sticker (rotated −4°) in Butter, concept stickers in Frost / Seafoam / Flamingo (max 3 colors), score in 56px Bricolage, verdict text, small "Rewind" logo.

### Chips (home examples)
Paper pill, ink outline, hover Butter. Four chips only.

---

## 7. Screens

All screens: Chalk background, navbar on top, content centered in a 760px column.

### 7.1 Home
```
[Navbar]
        Fix the worst day.
        Learn the skill.                  ← H1, 2 lines
  ┌──────────────────────────────┐
  │ What do you want to learn?   │        ← one big input (Paper)
  └──────────────────────────────┘
  (Cybersecurity) (UI/UX) (SQL) (DevOps)  ← chips
  [        Start the case        ]        ← primary button
```
Small decoration: two tilted sticker shapes (a clock, a rewind arrow) in Frost and Flamingo behind the heading. Decoration never overlaps the input.

### 7.2 Incident
```
[Navbar]
[ Timeline strip: ✓ ✓ ● 🔒 🔒 ]
[ Stability meter ─────── 50 ]
[ ALERT banner (flamingo) ]
  clock line (mono)
[ Evidence ][ Evidence ][ Evidence ]   ← 3 cards (stack on mobile)
  What do you do first?
  (A) option   (B) option
  (C) option   (D) option
```
No primary button here: tapping an option commits the choice. Add a small mute line: "One decision. Choose carefully, or rewind."

### 7.3 Reveal
- **Wrong:** card with the outcome text, meter drops, screen performs a 700ms glitch (two Flamingo/Frost offset ghost copies of the card jittering horizontally, then settling). Primary button is **Rewind** (Frost fill with token icons, only if tokens > 0); secondary text link "Skip to explanation" when out of tokens.
- **Right:** meter fills to Seafoam, the Seafoam "Timeline restored" sticker stamps in (scale 1.4 → 1, rotate −6°), the current node on the strip fills Seafoam. Primary button: **Continue** (Butter).

### 7.4 Debrief
Debrief card, then one primary button **Next incident**. Score gain shown as a "+100" Butter sticker that flies up to the navbar score.

### 7.5 Curve (learning curve page)
```
[Navbar: "Curve" active]
  Your learning curve
  ┌───────────────────────────────┐
  │ line chart: points per incident│  ← SVG, 5 x-points
  │ dots colored by rewinds used   │
  └───────────────────────────────┘
  Concepts: [Isolate first ✓] [Least privilege ✓] [?] ...
  AI note (Frost card): one sentence on how they are improving
```
Chart: Ink line 3px, dots 14px (Seafoam = 0 rewinds, Butter = 1, Flamingo = 2+), Stone grid. Plain SVG, no chart library.

### 7.6 Case Closed
Rank sticker (large, tilted), score, Perfect Timeline count, concept stickers, **Download card** (primary) and a text link "Start another skill".

---

## 8. Motion

Keep each animation under 1s. Use `framer-motion`. Respect `prefers-reduced-motion` (replace with instant state changes + a simple fade).

| Moment | Animation |
|---|---|
| Screen change | 200ms slide-up + fade |
| Option press | button depresses (translate 3px) |
| Wrong reveal | glitch jitter 700ms, meter drop 900ms spring |
| Rewind press | the strip's current node spins counter-clockwise once (360°, 500ms), screen wipes in from the left |
| Right reveal | "Timeline restored" sticker stamp, node fill, meter spring up |
| Perfect Timeline | star pops on the node (scale 0 → 1.3 → 1) |
| Score gain | "+100" sticker floats up to the navbar score, number ticks |

No sound required. No confetti (it reads as generic).

---

## 9. Iconography & imagery

- Icons: **Lucide**, stroke 2.5px to match outlines. Siren, rewind, lock, check, star, flame, clock.
- No illustrations, no stock photos, no AI-generated images. Personality comes from the flat stickers, shapes, and type.

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| Flat pastel fills with ink outlines | Gradients, glows, blurred shadows |
| Hard offset shadows | Drop-shadow with blur, glassmorphism |
| Color = state | Color as decoration |
| One yellow primary button per screen | Two competing buttons |
| Short text, big type | Dense paragraphs |
| Navbar with ≤3 links | Sidebars, hamburger menus, modals |
| Rounded, tactile, playful | Dark navy dashboards, neon accents, purple-blue hero gradients |

---

## 11. Figma setup (build order)

**Already built for you:** https://www.figma.com/design/FhndCjZo56AHFq6DS2Am6k (file "Rewind — Sticker Arcade"). It contains the color styles, hard-shadow effect styles, text styles, and 4 desktop frames: Home, Incident, Reveal (wrong choice, with glitch ghosts), Curve. Still to design in Figma if you have time: Debrief, Reveal (right choice), Case Closed, and mobile versions. Antigravity can build those directly from `design.md`.

1. **Styles first:** create color styles from §2, text styles from §3, and an effect style "Hard shadow" (4px 4px, 0 blur, Ink).
2. **Components:** Navbar, Primary button, Option button (default / selected / correct / wrong), Timeline node (done / perfect / current / locked), Stability meter, Evidence card (4 kinds), Debrief card.
3. **Frames (desktop 1440 + mobile 390):** Home, Incident, Reveal-wrong, Reveal-right, Debrief, Curve, Case Closed.
4. **Handoff to Antigravity:** copy each frame's link and ask the agent to implement it with the Figma MCP (see `prompts.md`, step B2.5). Tokens in §4 already match so it should map 1:1.