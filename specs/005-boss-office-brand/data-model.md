# Data Model: Boss Office Brand Design Tokens

**Feature**: 005-boss-office-brand
**Date**: 2026-01-23
**Purpose**: Define the schema for all design tokens used in Boss Office brand compliance

---

## Overview

Design tokens are the **single source of truth** for visual decisions. They replace hardcoded values with named, semantic tokens that enforce brand consistency.

---

## Token Categories

### 1. Color Tokens

| Token Name | Value | RGB | Usage |
|------------|-------|-----|-------|
| `--ft-color-black` | `#000000` | 0, 0, 0 | Primary text, borders, dark backgrounds |
| `--ft-color-white` | `#FFFFFF` | 255, 255, 255 | Light backgrounds, text on dark |
| `--ft-color-grey` | `#B2B2B2` | 178, 178, 178 | Secondary text, disabled states, muted elements |
| `--ft-color-yellow` | `#FFF469` | 255, 244, 105 | Accent only - CTAs, highlights, active states |

**Semantic Aliases**:

| Semantic Token | Maps To | Usage |
|----------------|---------|-------|
| `--ft-color-background` | `--ft-color-white` | Default page background |
| `--ft-color-background-inverted` | `--ft-color-black` | Dark sections |
| `--ft-color-text-primary` | `--ft-color-black` | Main body text |
| `--ft-color-text-inverted` | `--ft-color-white` | Text on dark backgrounds |
| `--ft-color-text-muted` | `--ft-color-grey` | Secondary/helper text |
| `--ft-color-accent` | `--ft-color-yellow` | CTAs, highlights |
| `--ft-color-border` | `--ft-color-black` | All borders |
| `--ft-color-disabled` | `--ft-color-grey` | Disabled elements |

---

### 2. Typography Tokens

#### Font Families

| Token Name | Value | Fallback | Usage |
|------------|-------|----------|-------|
| `--ft-font-headline` | `'Plaak'` | `sans-serif` | Headlines, titles (UPPERCASE) |
| `--ft-font-body` | `'Riforma'` | `sans-serif` | Body copy, paragraphs |
| `--ft-font-mono` | `'Monument Grotesk Mono'` | `monospace` | Labels, meta text, annotations (UPPERCASE) |

#### Font Weights

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-font-weight-regular` | `400` | Body text |
| `--ft-font-weight-bold` | `700` | Headlines, emphasis |

#### Font Sizes (Desktop)

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-font-size-xs` | `12px` | Labels, captions |
| `--ft-font-size-sm` | `14px` | Small text, meta |
| `--ft-font-size-base` | `16px` | Body copy default |
| `--ft-font-size-md` | `18px` | Lead paragraphs |
| `--ft-font-size-lg` | `24px` | Section headings |
| `--ft-font-size-xl` | `32px` | Page titles |
| `--ft-font-size-2xl` | `48px` | Hero headlines |

#### Line Heights

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-line-height-tight` | `1.2` | Headlines |
| `--ft-line-height-normal` | `1.5` | Body copy |
| `--ft-line-height-relaxed` | `1.75` | Long-form reading |

#### Text Transform

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-text-transform-headline` | `uppercase` | All headlines |
| `--ft-text-transform-label` | `uppercase` | All labels/meta |
| `--ft-text-transform-body` | `none` | Body copy (sentence case) |

---

### 3. Spacing Tokens (8px Base Unit)

| Token Name | Value | Multiplier | Usage |
|------------|-------|------------|-------|
| `--ft-space-0` | `0` | 0x | No spacing |
| `--ft-space-1` | `8px` | 1x | Tight gaps, icon padding |
| `--ft-space-2` | `16px` | 2x | Standard element spacing |
| `--ft-space-3` | `24px` | 3x | Section padding, card padding |
| `--ft-space-4` | `32px` | 4x | Large gaps, page margins |
| `--ft-space-5` | `40px` | 5x | Section separators |
| `--ft-space-6` | `48px` | 6x | Major section breaks |
| `--ft-space-8` | `64px` | 8x | Page-level spacing |
| `--ft-space-10` | `80px` | 10x | Hero sections |

---

### 4. Border Tokens

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-border-width-thin` | `1px` | Subtle separators |
| `--ft-border-width-normal` | `2px` | Standard borders |
| `--ft-border-width-thick` | `3px` | Cards, containers, emphasis |
| `--ft-border-radius` | `0` | **ALWAYS ZERO** - no rounded corners |
| `--ft-border-color` | `var(--ft-color-black)` | All borders are black |
| `--ft-border-style` | `solid` | Only solid borders |

**Composite Border Tokens**:

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-border` | `3px solid #000000` | Default container border |
| `--ft-border-thin` | `1px solid #000000` | Subtle separators |
| `--ft-border-focus` | `3px solid #FFF469` | Focus ring (accessibility) |

---

### 5. Shadow Tokens

| Token Name | Value | Notes |
|------------|-------|-------|
| `--ft-shadow-none` | `none` | **ONLY VALUE** - no shadows allowed |

---

### 6. Transition Tokens

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-transition-none` | `none` | Default - no transitions |
| `--ft-transition-fast` | `0.1s ease-in-out` | Button hover only |

**Rule**: Transitions are forbidden except for simple button state changes.

---

### 7. Grid Tokens

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-grid-columns` | `12` | Desktop column count |
| `--ft-grid-gap` | `var(--ft-space-3)` | 24px gutter |
| `--ft-grid-margin` | `var(--ft-space-4)` | 32px page margins |

---

### 8. Breakpoint Tokens

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ft-breakpoint-mobile` | `375px` | Mobile viewport |
| `--ft-breakpoint-tablet` | `768px` | Tablet viewport |
| `--ft-breakpoint-desktop` | `1024px` | Desktop viewport |
| `--ft-breakpoint-wide` | `1440px` | Wide desktop |

---

## Token Validation Rules

### Color Validation

```
VALID colors: #000000, #FFFFFF, #B2B2B2, #FFF469
INVALID: Any other hex value, rgb(), hsl(), named colors (except black, white)
```

### Border Radius Validation

```
VALID: 0, 0px
INVALID: Any value > 0
```

### Shadow Validation

```
VALID: none
INVALID: Any box-shadow value
```

### Font Family Validation

```
VALID: 'Plaak', 'Riforma', 'Monument Grotesk Mono', system fallbacks
INVALID: Any other font family
```

---

## Token Usage Matrix

| Element Type | Font | Size | Color | Border |
|--------------|------|------|-------|--------|
| Page Title | Plaak | 2xl | Black | None |
| Section Heading | Plaak | xl | Black | None |
| Card Title | Plaak | lg | Black | None |
| Body Text | Riforma | base | Black | None |
| Label | Monument | xs | Black/Grey | None |
| Button (Primary) | Riforma | base | Black | None |
| Button (Secondary) | Riforma | base | White | Black 3px |
| Card Container | - | - | White bg | Black 3px |
| Error Message | Riforma | sm | Black | Yellow bg |
| Input Field | Riforma | base | Black | Black 2px |
