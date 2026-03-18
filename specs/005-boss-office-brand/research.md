# Research: Boss Office Brand & Design Compliance

**Feature**: 005-boss-office-brand
**Date**: 2026-01-23
**Purpose**: Resolve technical questions for brand implementation

---

## Research Area 1: WOFF2 Font Loading

### Decision
Use WOFF2 format with `font-display: swap` and preload hints for critical fonts.

### Rationale
- WOFF2 provides 30-50% better compression than WOFF
- Supported by all modern browsers (Chrome 36+, Firefox 39+, Safari 10+, Edge 14+)
- `font-display: swap` prevents invisible text during font loading
- Preloading ensures fonts load before first paint

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Google Fonts CDN | Fonts are custom/licensed, not on Google Fonts |
| OpenType (.otf) | Larger file size, WOFF2 is web-optimized |
| System font fallback only | Brand requires specific fonts |
| Base64 inline | Increases HTML size, worse caching |

### Implementation Pattern
```css
/* Preload in HTML head */
<link rel="preload" href="/fonts/Plaak3Trial-43-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/RiformaLL-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/MonumentGrotesk-Mono.woff2" as="font" type="font/woff2" crossorigin>

/* @font-face declarations */
@font-face {
  font-family: 'Plaak';
  src: url('/fonts/Plaak3Trial-43-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

---

## Research Area 2: CSS Custom Properties for Design Tokens

### Decision
Use CSS custom properties (CSS variables) with a `--ft-` namespace prefix.

### Rationale
- Native browser support, no build step required
- Can be updated at runtime (for theming if ever needed)
- Clear namespacing prevents conflicts
- Works with any framework (React, Vue, plain CSS)

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| SCSS variables | Requires build step, not runtime-adjustable |
| CSS-in-JS (styled-components) | Framework-specific, adds complexity |
| Tailwind config | Adds dependency, overkill for 4 colors |
| Hardcoded values | No single source of truth, harder to audit |

### Implementation Pattern
```css
:root {
  /* Colors */
  --ft-color-black: #000000;
  --ft-color-white: #FFFFFF;
  --ft-color-grey: #B2B2B2;
  --ft-color-yellow: #FFF469;

  /* Typography */
  --ft-font-headline: 'Plaak', sans-serif;
  --ft-font-body: 'Riforma', sans-serif;
  --ft-font-mono: 'Monument Grotesk Mono', monospace;

  /* Spacing (8px base) */
  --ft-space-1: 8px;
  --ft-space-2: 16px;
  --ft-space-3: 24px;
  --ft-space-4: 32px;
  --ft-space-5: 40px;
  --ft-space-6: 48px;

  /* Borders */
  --ft-border-width: 3px;
  --ft-border-color: var(--ft-color-black);
  --ft-border: var(--ft-border-width) solid var(--ft-border-color);
}
```

---

## Research Area 3: Accessibility Within Brand Constraints

### Decision
The 4-color palette meets WCAG AA contrast requirements for most combinations. Document valid and invalid combinations.

### Rationale
- Black (#000000) on White (#FFFFFF): 21:1 contrast ratio (AAA)
- Black (#000000) on Yellow (#FFF469): 16.3:1 contrast ratio (AAA)
- White (#FFFFFF) on Black (#000000): 21:1 contrast ratio (AAA)
- Grey (#B2B2B2) on White (#FFFFFF): 2.6:1 (FAIL - use for decorative only)
- Grey (#B2B2B2) on Black (#000000): 8.0:1 (AA)

### Valid Combinations (WCAG AA)
| Background | Text | Contrast | Use |
|------------|------|----------|-----|
| White | Black | 21:1 | Primary text |
| Black | White | 21:1 | Inverted sections |
| Yellow | Black | 16.3:1 | CTAs, highlights |
| Black | Grey | 8.0:1 | Secondary text on dark |

### Invalid Combinations (Do Not Use)
| Background | Text | Contrast | Issue |
|------------|------|----------|-------|
| White | Grey | 2.6:1 | Fails AA for text |
| Yellow | White | 1.3:1 | Fails all standards |
| Grey | White | 2.6:1 | Fails AA for text |

### Implementation Note
Grey (#B2B2B2) should only be used for:
- Decorative borders
- Disabled states (with larger text or icons)
- Non-essential metadata where black would be too heavy

---

## Research Area 4: Forbidden Pattern Enforcement

### Decision
Create explicit CSS rules that reset/override common framework defaults.

### Rationale
- Many CSS frameworks (Bootstrap, Tailwind, MUI) add rounded corners and shadows by default
- Explicit overrides ensure brand compliance even when using third-party components
- Linting rules can catch violations before they reach production

### Implementation Pattern
```css
/* Reset file: brand-reset.css */

/* Remove all rounded corners */
*, *::before, *::after {
  border-radius: 0 !important;
}

/* Remove all box shadows */
* {
  box-shadow: none !important;
}

/* Remove transitions (keep only allowed) */
* {
  transition: none !important;
}

/* Re-enable specific allowed transitions */
.ft-button {
  transition: background-color 0.1s ease-in-out !important;
}
```

### Linting Rule (CSS Linter Config)
```json
{
  "rules": {
    "declaration-property-value-disallowed-list": {
      "border-radius": ["/[1-9]/"],
      "box-shadow": ["/./"],
      "background": ["/gradient/"]
    },
    "color-no-invalid-hex": true
  }
}
```

---

## Research Area 5: Layout Grid Implementation

### Decision
Use CSS Grid with 12-column template and 8px gap, left-aligned content.

### Rationale
- CSS Grid is natively supported, no framework needed
- 12-column grid matches brand guidelines
- 8px base unit aligns with spacing token system
- Left alignment enforced by default (no `justify-content: center`)

### Implementation Pattern
```css
.ft-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--ft-space-3); /* 24px */
  padding: var(--ft-space-4); /* 32px */
}

.ft-grid > * {
  text-align: left;
}

/* Responsive stacking */
@media (max-width: 768px) {
  .ft-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Research Area 6: Error and Success States Without Red/Green

### Decision
Use yellow background with black text for errors, black checkmark icon for success.

### Rationale
- Red and green are explicitly forbidden in brand guidelines
- Yellow provides sufficient visual distinction for errors
- Black checkmark is universally understood for success
- Maintains 4-color palette constraint

### Implementation Pattern
```css
/* Error state */
.ft-error {
  background-color: var(--ft-color-yellow);
  color: var(--ft-color-black);
  border: var(--ft-border);
  padding: var(--ft-space-2);
}

/* Success state */
.ft-success {
  color: var(--ft-color-black);
  display: flex;
  align-items: center;
  gap: var(--ft-space-1);
}

.ft-success::before {
  content: '✓';
  font-weight: bold;
}

/* Form validation */
.ft-input.invalid {
  border: 3px solid var(--ft-color-yellow);
}

.ft-input.valid {
  border: 3px solid var(--ft-color-black);
}
```

---

## Summary of Decisions

| Area | Decision |
|------|----------|
| Font Format | WOFF2 with `font-display: swap` and preload |
| Design Tokens | CSS custom properties with `--ft-` prefix |
| Accessibility | Documented valid/invalid color combinations |
| Forbidden Patterns | CSS reset file with `!important` overrides |
| Grid Layout | CSS Grid, 12-column, 8px gap, left-aligned |
| Error/Success States | Yellow background for errors, black checkmark for success |

All NEEDS CLARIFICATION items have been resolved.
