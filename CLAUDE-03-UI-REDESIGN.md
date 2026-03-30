# CLAUDE-03-UI-REDESIGN.md — Chalet-inspired UI with mountain hero

> **Extends**: `CLAUDE.md` + `CLAUDE-02-STATE-AND-I18N.md`
> **Scope**: Complete visual redesign. Replaces the "alpine luxe" design system from the base CLAUDE.md. All component specs and i18n/state logic from CLAUDE-02 remain unchanged — this document only covers visual/CSS changes and new layout structure.

---

## Design direction: "Swiss chalet, modern soul"

The previous design was restrained and editorial. The new direction is warmer, more playful, and distinctly Swiss — it should feel like you're browsing a booking page while sitting inside a timber chalet looking out at the mountains.

### Key visual elements

1. **Mountain hero** — an SVG illustrated Lötschental skyline (not a photo) with layered green ridges, snow-capped peaks, and gradient sky. Overlaid with the logo, tagline, and a Swiss flag badge. This creates the emotional anchor.

2. **Wood warmth** — the body area below the hero uses warm paper/timber tones (#f7f2eb → #f0e8dd). A thin decorative wood-grain strip separates the hero from the content. Cards have subtle warm shadows.

3. **Swiss flag accent** — a small Swiss cross appears in two places: (a) a red badge in the hero ("Lötschental, Switzerland") and (b) next to the logo in the footer. The cross is always drawn as CSS pseudo-elements — never an emoji, never an image.

4. **Red + green as the accent pair** — Swiss red (#c8302b) for branding accents and the flag; forest green (#2d6b30) for interactive/available states and primary actions. The red is used sparingly — it's a highlight, not a dominant color.

5. **Playful but functional** — rounded corners are slightly larger (10-12px), cards have a thin red top-stripe for personality, and the calendar has a wood-card wrapper. Typography stays refined (Cormorant + DM Sans) but the overall feel is friendlier.

---

## Updated color palette

Replace the entire CSS variables block in App.css:

```css
:root {
  /* Base backgrounds */
  --color-bg: #f7f2eb;
  --color-bg-warm: #f0e8dd;
  --color-surface: #ffffff;

  /* Text */
  --color-text: #2a1f17;
  --color-text-muted: #8a7e76;
  --color-text-light: #b5aa9e;

  /* Primary action — forest green */
  --color-primary: #2d6b30;
  --color-primary-light: #3a8040;
  --color-primary-soft: #d4e8d0;

  /* Swiss red — branding accent only */
  --color-swiss-red: #c8302b;
  --color-swiss-red-dark: #a02824;

  /* Booking states */
  --color-booked: #c4574a;
  --color-booked-bg: #fce8e3;
  --color-pending: #854f0b;
  --color-pending-bg: #faeeda;
  --color-pending-border: #d4a040;

  /* Selection */
  --color-selected: #2d6b30;
  --color-selected-bg: #d4e8d0;
  --color-range-bg: #e4f0e2;

  /* Neutral */
  --color-past: #e8e4df;
  --color-error: #c8302b;
  --color-error-bg: #fce3e3;
  --color-border: #e0dbd5;
  --color-border-light: #ece8e2;

  /* Pricing/info callout */
  --color-info-bg: #faf5ed;
  --color-info-border: #e8dcc8;
  --color-info-text: #6b5530;

  /* Layout */
  --radius: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 2px 8px rgba(42, 31, 23, 0.06);
  --shadow-md: 0 4px 16px rgba(42, 31, 23, 0.08);
  --shadow-lg: 0 8px 24px rgba(42, 31, 23, 0.12);

  /* Typography — unchanged */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, sans-serif;
  --transition: 0.2s ease;
}
```

---

## Layout structure changes

### Overall page structure

```
┌─────────────────────────────────────────┐
│            MOUNTAIN HERO                 │
│   SVG skyline + overlay + logo/badge     │
│   Language selector (top-right)          │
├══════════════════════════════════════════┤ ← wood-grain strip (4px)
│            WARM BODY AREA                │
│                                          │
│   Section title                          │
│   Selection bar                          │
│   ┌──── Wood card (red top-stripe) ───┐ │
│   │  Calendar grid (6 months)          │ │
│   │  Legend                            │ │
│   └────────────────────────────────────┘ │
│   Suggestion / Next available            │
│   Form card (when step=form)             │
│   Confirmation (when step=confirmed)     │
│                                          │
├──────────────────────────────────────────┤
│            FOOTER                        │
│   Swiss cross + Alte Liebe + contact     │
└──────────────────────────────────────────┘
```

### 1. Mountain hero section

The hero replaces the old header. It's 280px tall on desktop, 200px on mobile.

**SVG mountain illustration** (NOT a photograph):
- Draw as an inline `<svg>` with `preserveAspectRatio="xMidYMax slice"` so it covers the full width and crops from top
- Sky: vertical gradient from #5a9abf (top) → #87CEEB (mid) → #c8dce8 (bottom)
- Three mountain ridges layered front-to-back:
  - Back ridge: #6b8f5e at 70% opacity — gentle peaks
  - Mid ridge: #4a7040 — more defined peaks
  - Front ridge: #3a5c30 — tallest, closest, darkest
- 2-3 snow caps: white triangles on the tallest peaks (#fff, 90% opacity)
- Each ridge is a single `<polygon>` with organic, hand-drawn-looking point spacing (not perfectly symmetric)

**Overlay**: A dark gradient from top (15% opacity) to bottom (60% opacity) ensures text readability regardless of the SVG artwork behind it.

**Content layered on top (z-index):**
- Swiss flag badge: red pill with white cross + "Lötschental, Switzerland" — sits above the logo
- Logo: "Alte Liebe" in Cormorant Garamond 36px white bold, with subtle text-shadow
- Tagline: "Your mountain home since 1742" in italic Cormorant — this is a fictional founding year for charm, can be adjusted or removed

**Language selector**: positioned absolute top-right of the hero. Pill group with frosted glass effect: `background: rgba(255,255,255,0.15); backdrop-filter: blur(4px)`. Active language has white background with dark text; inactive have white text at 70% opacity.

```css
.hero {
  position: relative;
  height: 280px;
  overflow: hidden;
}

.hero-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(42,31,23,0.15) 0%, rgba(42,31,23,0.6) 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

@media (max-width: 640px) {
  .hero { height: 200px; }
  .hero h1 { font-size: 28px; }
}
```

### Swiss flag badge (in hero)

The badge is a red pill with a CSS-drawn Swiss cross:

```css
.flag-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(200, 48, 43, 0.9);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 999px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.swiss-cross {
  width: 16px;
  height: 16px;
  position: relative;
  display: inline-block;
}

.swiss-cross::before,
.swiss-cross::after {
  content: '';
  position: absolute;
  background: #fff;
  border-radius: 1px;
}

.swiss-cross::before {
  width: 12px;
  height: 3.5px;
  top: 6.25px;
  left: 2px;
}

.swiss-cross::after {
  width: 3.5px;
  height: 12px;
  top: 2px;
  left: 6.25px;
}
```

### 2. Wood-grain separator strip

A thin decorative bar (4px) between the hero and the body, using a CSS repeating-linear-gradient to simulate wood grain:

```css
.wood-body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    #8b6f4e 0px,
    #a08060 2px,
    #7a5f3f 4px,
    #9a7a55 6px,
    #8b6f4e 8px
  );
}
```

### 3. Wood card wrapper for the calendar

The calendar grid is wrapped in a white card with a thin red top-stripe — a nod to the Swiss flag and to decorative chalet trim. This makes the calendar feel like a framed object, not just floating content:

```css
.calendar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.calendar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-swiss-red), #e04540, var(--color-swiss-red));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
```

### 4. Updated calendar day cells

The calendar cells get slightly larger border-radius (6px) and the pending state uses the hatched pattern from CLAUDE-02:

```css
.cal-cell.booked-confirmed {
  background: var(--color-booked-bg);
  color: var(--color-booked);
  cursor: not-allowed;
  border-radius: 6px;
}

.cal-cell.booked-pending {
  background: repeating-linear-gradient(
    135deg,
    var(--color-pending-bg) 0px,
    var(--color-pending-bg) 2.5px,
    transparent 2.5px,
    transparent 5px
  );
  color: var(--color-pending);
  border: 0.5px dashed var(--color-pending-border);
  border-radius: 6px;
  cursor: not-allowed;
}

.cal-cell.selectable {
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
}

.cal-cell.selectable:hover {
  background: var(--color-primary-soft);
  transform: scale(1.12);
  box-shadow: var(--shadow-sm);
}

.cal-cell.check-in,
.cal-cell.check-out {
  background: var(--color-primary) !important;
  color: white !important;
  font-weight: 700;
  border-radius: 6px;
  transform: scale(1.12);
  box-shadow: 0 2px 8px rgba(45, 107, 48, 0.35);
  z-index: 2;
}

.cal-cell.today {
  outline: 2px solid var(--color-swiss-red);
  outline-offset: -2px;
}
```

### 5. Pricing info callout

The pricing box in the reservation form uses a warm amber background with a small Swiss cross icon:

```css
.price-info {
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--color-info-text);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.price-info-icon {
  width: 22px;
  height: 22px;
  background: var(--color-swiss-red);
  border-radius: 4px;
  flex-shrink: 0;
  position: relative;
}

/* Swiss cross drawn inside */
.price-info-icon::before,
.price-info-icon::after {
  content: '';
  position: absolute;
  background: #fff;
  border-radius: 0.5px;
}
.price-info-icon::before {
  width: 10px; height: 2.5px; top: 9.75px; left: 6px;
}
.price-info-icon::after {
  width: 2.5px; height: 10px; top: 6px; left: 9.75px;
}
```

### 6. Primary buttons

Primary buttons are now forest green. The "Make another reservation" button on the confirmation screen uses Swiss red for visual variety:

```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius);
}

.btn-primary:hover {
  background: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-accent {
  background: var(--color-swiss-red);
  color: white;
  border-radius: var(--radius);
}

.btn-accent:hover {
  background: var(--color-swiss-red-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### 7. Footer

The footer gets a Swiss cross + "Alte Liebe" mini-lockup:

```html
<footer class="footer">
  <div class="footer-brand">
    <span class="swiss-cross-sm"></span>
    <span class="footer-logo">Alte Liebe</span>
  </div>
  <p>Biel, 3918 Wiler (Lötschental) · <a href="mailto:info@alteliebe.com">info@alteliebe.com</a></p>
</footer>
```

```css
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.25rem;
}

.footer-logo {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Smaller Swiss cross for footer */
.swiss-cross-sm {
  width: 12px;
  height: 12px;
  position: relative;
  display: inline-block;
}

.swiss-cross-sm::before,
.swiss-cross-sm::after {
  content: '';
  position: absolute;
  background: var(--color-swiss-red);
  border-radius: 0.5px;
}

.swiss-cross-sm::before {
  width: 9px; height: 2.5px; top: 4.75px; left: 1.5px;
}

.swiss-cross-sm::after {
  width: 2.5px; height: 9px; top: 1.5px; left: 4.75px;
}
```

### 8. "Don't forget to bring" box on confirmation

The confirmation screen includes a warm info box reminding guests what to bring (from the property PDF). This uses the same info-box styling as the pricing callout:

```html
<div class="bring-reminder">
  <strong>{t('bringReminderTitle')}</strong> {t('bringReminder')}
</div>
```

```css
.bring-reminder {
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--color-info-text);
  text-align: left;
}

.bring-reminder strong {
  color: var(--color-text);
}
```

---

## Hero image approach: why SVG, not a photo

A photo of the Lötschental would be beautiful but creates problems:
- **Performance**: A hero photo is 200-500KB. The SVG illustration is <3KB.
- **Hosting**: A photo needs to live somewhere (Azure blob, CDN). SVG is inline code.
- **Consistency**: A photo can clash with the warm color palette. The SVG mountain layers are tuned to the exact greens and blues of the design system.
- **Responsiveness**: SVG scales perfectly at any viewport size with `preserveAspectRatio`.
- **Personality**: A hand-illustrated mountain range feels more charming and unique than a stock photo. It says "someone cared about this" rather than "someone searched Unsplash."

If the owner later wants to add a real photo, the hero component can easily be swapped to use a `<img>` or CSS `background-image` with the same overlay gradient. The overlay ensures text remains readable regardless.

---

## Asset: SVG mountain illustration

The mountain SVG should be created as a separate component `src/components/MountainHero.jsx` (or inline in the hero section of App.jsx). Here's the spec:

**ViewBox**: 1200 x 400 (wide format, crops via preserveAspectRatio)

**Layers (back to front)**:
1. Sky gradient: #5a9abf → #87CEEB → #c8dce8
2. Far mountains: fill #6b8f5e, opacity 0.7 — gentle rolling peaks
3. Mid mountains: fill #4a7040 — sharper peaks, 2 snow caps (white triangles)
4. Near mountains: fill #3a5c30 — tallest, most defined, 1 snow cap
5. Optional: very faint cloud wisps (white, 10% opacity, high in the sky)

**Important**: The polygon points should not be mathematically symmetric. Vary the spacing and heights to look organic — real mountains aren't regular. Use 10-14 points per ridge polygon for sufficient detail.

The snow caps are separate small `<polygon>` triangles positioned at the tallest peaks of the mid and near ridges, with white fill at 85-95% opacity.

---

## Summary of changes from base design

| Element | Old (CLAUDE.md) | New (this doc) |
|---------|-----------------|----------------|
| Header | Flat warm gradient, centered text | SVG mountain hero with overlay |
| Brand mark | ✦ symbol | Swiss flag badge (red pill + cross) |
| Primary color | #3d5a3e (muted green) | #2d6b30 (vivid forest green) |
| Accent color | #c47a4a (terracotta) | #c8302b (Swiss red) |
| Background | #faf8f5 (cool off-white) | #f7f2eb → #f0e8dd (warm paper) |
| Calendar wrapper | No wrapper | White card with red top-stripe |
| Day cell radius | 8px | 6px |
| Today marker | Terracotta outline | Swiss red outline |
| Selection bar | Plain white | White with warm shadow |
| Buttons | Muted green | Vivid green; red variant for CTAs |
| Footer | Simple text | Swiss cross + brand lockup |
| Language selector | In header area | Frosted glass pill, top-right of hero |
| Grain overlay | SVG noise filter | Removed (wood-grain strip replaces it) |
| Hero separator | None | 4px wood-grain CSS strip |
| Body background | Flat | Subtle vertical gradient (warm) |
| Confirmation page | Plain | Includes "bring" reminder box |

---

## Updated quality checklist (additions)

- [ ] SVG mountain illustration renders at all viewport widths (test at 320px and 1440px)
- [ ] Hero text is readable over the mountain illustration (overlay gradient applied)
- [ ] Swiss cross renders correctly in hero badge and footer (CSS pseudo-elements, not emoji)
- [ ] Language selector has frosted glass effect and is usable on all hero colors
- [ ] Wood-grain strip is visible between hero and body
- [ ] Calendar card has red top-stripe
- [ ] Pending dates show hatched amber pattern
- [ ] Today marker uses Swiss red
- [ ] Primary buttons are forest green
- [ ] "Make another reservation" button uses Swiss red
- [ ] Bring-reminder box appears on confirmation screen
- [ ] No photo assets — the mountain hero is pure SVG
- [ ] SVG mountain polygons look organic (not mathematically symmetric)
- [ ] Background gradient flows smoothly from hero dark → body warm
- [ ] Old grain overlay is removed
