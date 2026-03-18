# Quickstart: Boss Office Brand Implementation

**Feature**: 005-boss-office-brand
**Date**: 2026-01-23
**Purpose**: Step-by-step guide to apply Fast Track brand to Boss Office UI

---

## Prerequisites

Before starting, ensure you have:
- [ ] Access to `Designs/` folder with font files and logo
- [ ] Understanding of [spec.md](./spec.md) requirements
- [ ] Reviewed [data-model.md](./data-model.md) for token definitions

---

## Step 1: Set Up Font Loading

### 1.1 Copy Font Files

Copy WOFF2 fonts to your project's public directory:

```
From: Designs/03. Fonts/woff2/
To:   public/fonts/ (or frontend/public/fonts/)

Files:
- Plaak3Trial-43-Bold.woff2
- RiformaLL-Regular.woff2
- MonumentGrotesk-Mono.woff2
```

### 1.2 Add Preload Links

In your HTML `<head>`:

```html
<link rel="preload" href="/fonts/Plaak3Trial-43-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/RiformaLL-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/MonumentGrotesk-Mono.woff2" as="font" type="font/woff2" crossorigin>
```

### 1.3 Create @font-face Declarations

Create `fonts.css`:

```css
@font-face {
  font-family: 'Plaak';
  src: url('/fonts/Plaak3Trial-43-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Riforma';
  src: url('/fonts/RiformaLL-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Monument Grotesk Mono';
  src: url('/fonts/MonumentGrotesk-Mono.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

## Step 2: Create Design Tokens

Create `tokens.css`:

```css
:root {
  /* ========== COLORS ========== */
  --ft-color-black: #000000;
  --ft-color-white: #FFFFFF;
  --ft-color-grey: #B2B2B2;
  --ft-color-yellow: #FFF469;

  /* Semantic color aliases */
  --ft-color-background: var(--ft-color-white);
  --ft-color-text-primary: var(--ft-color-black);
  --ft-color-text-muted: var(--ft-color-grey);
  --ft-color-accent: var(--ft-color-yellow);
  --ft-color-border: var(--ft-color-black);

  /* ========== TYPOGRAPHY ========== */
  --ft-font-headline: 'Plaak', sans-serif;
  --ft-font-body: 'Riforma', sans-serif;
  --ft-font-mono: 'Monument Grotesk Mono', monospace;

  --ft-font-size-xs: 12px;
  --ft-font-size-sm: 14px;
  --ft-font-size-base: 16px;
  --ft-font-size-md: 18px;
  --ft-font-size-lg: 24px;
  --ft-font-size-xl: 32px;
  --ft-font-size-2xl: 48px;

  --ft-line-height-tight: 1.2;
  --ft-line-height-normal: 1.5;

  /* ========== SPACING (8px base) ========== */
  --ft-space-1: 8px;
  --ft-space-2: 16px;
  --ft-space-3: 24px;
  --ft-space-4: 32px;
  --ft-space-5: 40px;
  --ft-space-6: 48px;

  /* ========== BORDERS ========== */
  --ft-border-width: 3px;
  --ft-border: 3px solid var(--ft-color-black);
  --ft-border-thin: 1px solid var(--ft-color-black);
  --ft-border-radius: 0; /* ALWAYS ZERO */
}
```

---

## Step 3: Create Brand Reset

Create `brand-reset.css` to override framework defaults:

```css
/* Fast Track Brand Reset - Apply AFTER framework CSS */

/* Remove all rounded corners */
*,
*::before,
*::after {
  border-radius: 0 !important;
}

/* Remove all shadows */
* {
  box-shadow: none !important;
}

/* Remove transitions by default */
* {
  transition: none !important;
}

/* Base typography */
body {
  font-family: var(--ft-font-body);
  font-size: var(--ft-font-size-base);
  line-height: var(--ft-line-height-normal);
  color: var(--ft-color-text-primary);
  background-color: var(--ft-color-background);
}

/* Headlines - Plaak, UPPERCASE */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--ft-font-headline);
  font-weight: 700;
  text-transform: uppercase;
  line-height: var(--ft-line-height-tight);
}

/* Labels - Monument Mono, UPPERCASE */
label,
.label,
.meta,
.badge {
  font-family: var(--ft-font-mono);
  text-transform: uppercase;
  font-size: var(--ft-font-size-xs);
}
```

---

## Step 4: Create Button Components

Create `buttons.css`:

```css
/* Base button styles */
.ft-button {
  font-family: var(--ft-font-body);
  font-size: var(--ft-font-size-base);
  font-weight: 400;
  padding: var(--ft-space-2) var(--ft-space-3);
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.1s ease-in-out !important;
}

/* Primary - Yellow with black text */
.ft-button--primary {
  background-color: var(--ft-color-yellow);
  color: var(--ft-color-black);
}

.ft-button--primary:hover {
  background-color: var(--ft-color-black);
  color: var(--ft-color-white);
}

/* Secondary - Black with white text */
.ft-button--secondary {
  background-color: var(--ft-color-black);
  color: var(--ft-color-white);
}

.ft-button--secondary:hover {
  background-color: var(--ft-color-yellow);
  color: var(--ft-color-black);
}

/* Tertiary - Ghost button */
.ft-button--tertiary {
  background-color: transparent;
  color: var(--ft-color-black);
  border: var(--ft-border);
}

.ft-button--tertiary:hover {
  background-color: var(--ft-color-black);
  color: var(--ft-color-white);
}

/* Disabled state - all types */
.ft-button:disabled {
  background-color: var(--ft-color-grey);
  color: var(--ft-color-white);
  cursor: not-allowed;
}

/* Focus state - accessibility */
.ft-button:focus {
  outline: 3px solid var(--ft-color-yellow);
  outline-offset: 2px;
}
```

---

## Step 5: Create Card Component

Create `cards.css`:

```css
.ft-card {
  background-color: var(--ft-color-white);
  border: var(--ft-border);
  padding: var(--ft-space-3);
  border-radius: 0;
  box-shadow: none;
}

.ft-card__title {
  font-family: var(--ft-font-headline);
  font-size: var(--ft-font-size-lg);
  text-transform: uppercase;
  margin-bottom: var(--ft-space-2);
}

.ft-card__meta {
  font-family: var(--ft-font-mono);
  font-size: var(--ft-font-size-xs);
  text-transform: uppercase;
  color: var(--ft-color-text-muted);
}

.ft-card__body {
  font-family: var(--ft-font-body);
  font-size: var(--ft-font-size-base);
  line-height: var(--ft-line-height-normal);
}
```

---

## Step 6: Add Header with Logo

### 6.1 Copy Logo File

```
From: Designs/02. logos/FastTrack_F_White.png
To:   public/images/FastTrack_F_White.png
```

### 6.2 Create Header CSS

```css
.ft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--ft-color-black);
  height: 64px;
  padding: 0 var(--ft-space-4);
}

.ft-header__logo {
  margin-left: auto; /* Push to right */
  padding: var(--ft-space-2);
}

.ft-header__logo img {
  height: 32px;
  width: auto;
}
```

### 6.3 Header HTML

```html
<header class="ft-header">
  <nav class="ft-header__nav">
    <!-- Navigation items -->
  </nav>
  <div class="ft-header__logo">
    <img src="/images/FastTrack_F_White.png" alt="Fast Track" />
  </div>
</header>
```

---

## Step 7: Error & Success States

```css
/* Error state - Yellow background, NOT red */
.ft-error {
  background-color: var(--ft-color-yellow);
  color: var(--ft-color-black);
  border: var(--ft-border);
  padding: var(--ft-space-2);
  font-family: var(--ft-font-body);
}

/* Success state - Black checkmark, NOT green */
.ft-success {
  color: var(--ft-color-black);
  font-family: var(--ft-font-body);
  display: flex;
  align-items: center;
  gap: var(--ft-space-1);
}

.ft-success::before {
  content: '✓';
  font-weight: bold;
  font-size: var(--ft-font-size-lg);
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

## Step 8: Import Order

In your main CSS file or entry point:

```css
/* 1. Fonts first */
@import './fonts.css';

/* 2. Design tokens */
@import './tokens.css';

/* 3. Brand reset (AFTER any framework CSS) */
@import './brand-reset.css';

/* 4. Components */
@import './buttons.css';
@import './cards.css';
@import './forms.css';
/* ... */
```

---

## Validation Checklist

Before shipping, verify:

- [ ] Only 4 colors used (#000000, #FFFFFF, #B2B2B2, #FFF469)
- [ ] All headlines are Plaak, UPPERCASE
- [ ] All body text is Riforma, sentence case
- [ ] All labels are Monument Mono, UPPERCASE
- [ ] No rounded corners anywhere (border-radius: 0)
- [ ] No drop shadows anywhere
- [ ] No gradients anywhere
- [ ] Logo visible in top-right header
- [ ] Primary CTAs are yellow with black text
- [ ] Errors use yellow background, NOT red
- [ ] Success uses black checkmark, NOT green

See [checklists/requirements.md](./checklists/requirements.md) for full validation checklist.

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Using `border-radius: 4px` | Always use `border-radius: 0` |
| Using `box-shadow` | Remove all shadows, use borders |
| Using red for errors | Use yellow background |
| Using green for success | Use black checkmark |
| Centered text layouts | Left-align by default |
| Using framework default colors | Override with brand tokens |
| Mixing arbitrary font sizes | Use token scale only |
