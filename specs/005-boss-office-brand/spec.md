# Feature Specification: Boss Office Brand & Design Compliance

**Feature Branch**: `005-boss-office-brand`
**Created**: 2026-01-23
**Status**: Draft
**Type**: Constraint Specification (Spec 000)
**Input**: User description: "Brand compliance spec for Boss Office - Fast Track brand colors, fonts, layout rules, and tone of voice"

## Overview

This is a **constraint specification** that defines the mandatory design rules all Boss Office components must follow. It does not describe a feature to build, but rather the visual and tonal contract that ensures the Boss Office embodies the Fast Track brand identity.

**Decision Being Forced**: Does the Boss Office look and feel like Fast Track?

---

## Brand Foundations

### Core Identity

Fast Track is a **Brutally Honest, Elite Performance Accelerator**. The visual design must reflect:

- **Focused** - Ruthless clarity on what matters
- **Personal** - Business is always personal
- **Challenging** - Progress comes from tension, not comfort

### Design Philosophy

Fast Track is not decorative. Every word, image, colour, and layout must earn its place. The aesthetic is **bold, minimalist, and brutalist** - rejecting polished corporate softness in favor of decisive, high-contrast design.

**No grit. No growth.**

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Brand Compliance Check (Priority: P1)

As a design reviewer, I want to verify the Boss Office UI follows Fast Track brand guidelines, so that the interface is indistinguishable from other Fast Track products in look and feel.

**Why this priority**: Brand consistency is foundational. Without it, the Boss Office feels like a third-party tool rather than a Fast Track product.

**Independent Test**: Open the Boss Office in a browser, take screenshots of each page, and compare against the brand guidelines checklist for colors, fonts, layout, and forbidden patterns.

**Acceptance Scenarios**:

1. **Given** the Dashboard page is rendered, **When** inspecting color values in DevTools, **Then** only #000000 (black), #FFFFFF (white), #B2B2B2 (grey), and #FFF469 (yellow) are present
2. **Given** any heading element exists, **When** inspecting font-family, **Then** it uses Plaak Ex Condensed 43 Bold and is UPPERCASE
3. **Given** any body text exists, **When** inspecting font-family, **Then** it uses Riforma LL Regular in sentence case
4. **Given** any label or meta text exists, **When** inspecting font-family, **Then** it uses Monument Grotesk Mono in UPPERCASE
5. **Given** any container or card element exists, **When** inspecting border-radius, **Then** the value is 0 (no rounded corners)
6. **Given** the header area, **When** inspecting the top-right corner, **Then** the Fast Track F mark (white) is visible

---

### User Story 2 - Typography Hierarchy Compliance (Priority: P1)

As a design reviewer, I want to verify typography follows the Fast Track type system, so that information hierarchy is clear and brand-consistent.

**Why this priority**: Typography is 60% of the Fast Track brand. Incorrect fonts break brand recognition instantly.

**Independent Test**: Inspect all text elements on each page and verify font-family, weight, case, and size relationships match the type system.

**Acceptance Scenarios**:

1. **Given** a page title exists, **When** inspecting styles, **Then** it uses Plaak, uppercase, bold weight
2. **Given** body copy exists, **When** inspecting styles, **Then** it uses Riforma, sentence case, regular weight
3. **Given** labels or annotations exist, **When** inspecting styles, **Then** they use Monument Grotesk Mono, uppercase
4. **Given** multiple heading levels exist, **When** comparing sizes, **Then** there is clear visual hierarchy (larger = more important)
5. **Given** any text element, **When** checking font-size, **Then** sizes are consistent across similar elements (no arbitrary mixing)

---

### User Story 3 - Color System Compliance (Priority: P1)

As a design reviewer, I want to verify the color palette follows Fast Track guidelines, so that the UI maintains visual consistency and brand recognition.

**Why this priority**: Fast Track is predominantly black and white. Yellow is a precision tool for emphasis, not decoration.

**Independent Test**: Extract all unique color values from the rendered CSS and verify each maps to an approved brand color.

**Acceptance Scenarios**:

1. **Given** the page background, **When** inspecting background-color, **Then** it is #FFFFFF (white) or #000000 (black)
2. **Given** primary text, **When** inspecting color, **Then** it is #000000 (black) on light backgrounds or #FFFFFF (white) on dark backgrounds
3. **Given** secondary/muted text, **When** inspecting color, **Then** it is #B2B2B2 (grey)
4. **Given** accent elements (CTAs, highlights, focus states), **When** inspecting color, **Then** they use #FFF469 (yellow)
5. **Given** any color value in the UI, **When** checking against brand palette, **Then** no unapproved colors exist (no blues, greens, reds, gradients)

---

### User Story 4 - Layout and Spacing Compliance (Priority: P2)

As a design reviewer, I want to verify layouts follow Fast Track grid and spacing rules, so that the UI feels structured and intentional.

**Why this priority**: Layout discipline reinforces the brutalist, decisive brand character.

**Independent Test**: Inspect page layouts for grid alignment, spacing consistency, and left-alignment patterns.

**Acceptance Scenarios**:

1. **Given** page content, **When** inspecting alignment, **Then** text and elements are strongly left-aligned (not centered unless intentional)
2. **Given** cards or containers, **When** inspecting borders, **Then** they have solid black borders (no drop shadows, no subtle greys)
3. **Given** any corner radius, **When** inspecting border-radius, **Then** the value is 0 (sharp corners only)
4. **Given** spacing between elements, **When** comparing, **Then** spacing is consistent and uses a predictable scale
5. **Given** the page layout, **When** inspecting structure, **Then** it follows a clear grid system (12-column for desktop)

---

### User Story 5 - Forbidden Pattern Detection (Priority: P2)

As a design reviewer, I want to verify no forbidden design patterns exist, so that the UI avoids generic SaaS cliches and maintains Fast Track distinctiveness.

**Why this priority**: Fast Track is intentionally divisive. Generic patterns dilute the brand.

**Independent Test**: Audit the UI for presence of any forbidden patterns and flag violations.

**Acceptance Scenarios**:

1. **Given** any UI element, **When** checking for gradients, **Then** no gradients exist (solid colors only)
2. **Given** any UI element, **When** checking for rounded corners, **Then** no rounded corners exist (border-radius: 0)
3. **Given** any UI element, **When** checking for drop shadows, **Then** no drop shadows exist (use borders instead)
4. **Given** any imagery, **When** evaluating style, **Then** no stock photography, no illustrations, no CGI renders
5. **Given** button or interactive elements, **When** checking hover states, **Then** no fancy animations or transitions (simple state changes only)
6. **Given** any iconography, **When** evaluating style, **Then** icons are minimal, monochrome, and functional (no colored icons)

---

### User Story 6 - Tone of Voice Compliance (Priority: P2)

As a content reviewer, I want to verify all UI copy follows Fast Track tone of voice, so that the interface speaks with brand authority.

**Why this priority**: Tone of voice is as important as visual identity. Every sentence signals confidence, authority, and intent.

**Independent Test**: Read all UI text (labels, buttons, messages, errors) and verify compliance with voice guidelines.

**Acceptance Scenarios**:

1. **Given** any button label, **When** reading text, **Then** it uses imperative verbs ("Upload", "Approve", "Reject" - not "Submit your file")
2. **Given** any error message, **When** reading text, **Then** it is direct and specific (not apologetic or vague)
3. **Given** any heading, **When** reading text, **Then** it is a verdict, not a label ("Tools Pending Review" not "Your Dashboard")
4. **Given** any body copy, **When** checking language, **Then** no corporate jargon (synergy, leverage, optimize, stakeholder)
5. **Given** any UI text, **When** checking hedging words, **Then** no "might", "could", "perhaps", "possibly" exists
6. **Given** any UI text, **When** checking case, **Then** headings are UPPERCASE (Plaak), body is sentence case (Riforma)

---

### Edge Cases

- What happens when the UI displays a very long tool name? Text truncates with ellipsis, maintaining layout integrity.
- What happens when error messages need to be shown? Red is NOT used. Errors use black text with yellow background for visibility.
- What happens when success feedback is needed? Green is NOT used. Success uses black text or black checkmark icon.
- What happens on mobile viewports? Layout stacks vertically, maintaining left-alignment and brand colors.
- What happens with form validation states? Invalid fields get 3px yellow border, not red.

---

## Requirements *(mandatory)*

### Visual Requirements

- **VR-001**: Primary color palette MUST be limited to #000000 (black), #FFFFFF (white), #B2B2B2 (grey), #FFF469 (yellow)
- **VR-002**: No additional colors MUST be introduced (no reds, blues, greens, or any color outside the palette)
- **VR-003**: Yellow (#FFF469) MUST be used sparingly for emphasis only (CTAs, highlights, active states)
- **VR-004**: Background colors MUST be either #FFFFFF or #000000
- **VR-005**: All borders MUST be solid black (#000000), minimum 2px width for containers
- **VR-006**: Border radius MUST be 0 on all elements (no rounded corners)
- **VR-007**: No gradients MUST exist anywhere in the UI
- **VR-008**: No drop shadows MUST exist (use borders for depth)
- **VR-009**: No transparency/opacity effects MUST be used (except for overlays/modals)

### Typography Requirements

- **TR-001**: Headlines MUST use Plaak Ex Condensed 43 Bold, UPPERCASE
- **TR-002**: Body copy MUST use Riforma LL Regular, sentence case
- **TR-003**: Labels and meta text MUST use Monument Grotesk Mono, UPPERCASE
- **TR-004**: Font files MUST be loaded from: `Designs/03. Fonts/woff2/` (WOFF2 format)
- **TR-005**: Font stack MUST include system fallbacks (sans-serif)
- **TR-006**: Line height MUST provide comfortable reading (1.4-1.6 for body text)
- **TR-007**: Headlines MUST be short, punchy statements only

### Layout Requirements

- **LR-001**: Text and elements MUST be strongly left-aligned
- **LR-002**: Desktop layout MUST follow 12-column grid system
- **LR-003**: Cards and containers MUST have solid black borders (3px minimum)
- **LR-004**: Spacing MUST be consistent using a predictable scale (8px base unit)
- **LR-005**: Visual hierarchy MUST be clear through size, weight, and spacing
- **LR-006**: White space MUST be generous and intentional

### Logo Requirements

- **LOGO-001**: Fast Track F mark MUST appear in top-right corner of header
- **LOGO-002**: F mark MUST be white version: `Designs/02. logos/FastTrack_F_White.png`
- **LOGO-003**: F mark MUST have adequate padding from edges (minimum 16px)
- **LOGO-004**: F mark MUST NOT be distorted, recolored, or animated

### Button & Interactive Element Requirements

- **BTN-001**: Primary CTA buttons MUST have yellow background (#FFF469) with black text
- **BTN-002**: Secondary buttons MUST have black background (#000000) with white text
- **BTN-003**: Tertiary/ghost buttons MUST have transparent background with black border and black text
- **BTN-004**: Button hover states MUST be simple (invert colors or add underline, no fancy transitions)
- **BTN-005**: Focus states MUST be visible (yellow outline) for accessibility
- **BTN-006**: Disabled states MUST use grey (#B2B2B2) for background/text

### Tone of Voice Requirements

- **TOV-001**: Button labels MUST use imperative verbs (Upload, Approve, Reject, Preview)
- **TOV-002**: Headlines MUST be verdicts, not labels
- **TOV-003**: Error messages MUST be direct and specific, never apologetic
- **TOV-004**: No corporate jargon MUST appear (synergy, leverage, optimize, stakeholder, etc.)
- **TOV-005**: No hedging words MUST appear (might, could, perhaps, possibly, maybe, should)
- **TOV-006**: Copy MUST be concise - one idea per sentence, max 3 sentences per paragraph
- **TOV-007**: Numbers MUST only be used when citing real data (never invented statistics)

### Forbidden Patterns (MUST NOT exist)

- **FP-001**: Rounded corners
- **FP-002**: Gradients
- **FP-003**: Drop shadows
- **FP-004**: Generic stock photography
- **FP-005**: Illustrations or CGI
- **FP-006**: Colored icons (icons must be monochrome)
- **FP-007**: Fancy animations or transitions
- **FP-008**: Red for errors or green for success
- **FP-009**: Centered text layouts (except intentional hero moments)
- **FP-010**: Soft, muted, or pastel colors
- **FP-011**: Corporate buzzwords in copy

---

## Key Entities

- **Brand Color**: A hex color value from the approved palette (#000000, #FFFFFF, #B2B2B2, #FFF469). Each has a specific role: black (primary), white (background/text), grey (secondary/muted), yellow (accent/emphasis).

- **Typeface**: A font family used in the design system. Three are defined: Plaak (headlines), Riforma (body), Monument Grotesk Mono (labels). Each has strict usage rules for weight, case, and context.

- **Layout Grid**: The underlying structure for page composition. Fast Track uses a 12-column grid with strong left alignment and generous white space.

- **Forbidden Pattern**: A design element explicitly banned from the brand. These include gradients, rounded corners, drop shadows, stock photography, and corporate jargon.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of rendered colors match the approved brand palette (0 violations in color audit)
- **SC-002**: 100% of headlines use Plaak font in UPPERCASE
- **SC-003**: 100% of body text uses Riforma font in sentence case
- **SC-004**: 100% of labels/meta text use Monument Grotesk Mono in UPPERCASE
- **SC-005**: 0 instances of border-radius > 0 (no rounded corners)
- **SC-006**: 0 instances of gradients, drop shadows, or transparency effects
- **SC-007**: 0 instances of colors outside the approved palette
- **SC-008**: Fast Track F mark is visible in top-right header corner on all pages
- **SC-009**: Primary CTAs consistently use yellow background with black text
- **SC-010**: All UI copy passes tone of voice review (no jargon, no hedging)
- **SC-011**: Visual hierarchy is clear - a 5-second glance reveals information priority
- **SC-012**: Layout maintains brand consistency across Desktop, Tablet, and Mobile views

---

## Asset References

### Fonts (WOFF2 Format - Web Optimized)

| Font | File | Usage |
|------|------|-------|
| Plaak Ex Condensed 43 Bold | `Designs/03. Fonts/woff2/Plaak3Trial-43-Bold.woff2` | Headlines (UPPERCASE) |
| Riforma LL Regular | `Designs/03. Fonts/woff2/RiformaLL-Regular.woff2` | Body copy (sentence case) |
| Monument Grotesk Mono | `Designs/03. Fonts/woff2/MonumentGrotesk-Mono.woff2` | Labels/meta (UPPERCASE) |

### Logo

| Asset | File | Usage |
|-------|------|-------|
| F Mark (White) | `Designs/02. logos/FastTrack_F_White.png` | Top-right header position |

### Color Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Black | #000000 | 0, 0, 0 | Primary text, borders, dark backgrounds |
| White | #FFFFFF | 255, 255, 255 | Light backgrounds, text on dark |
| Grey | #B2B2B2 | 178, 178, 178 | Secondary text, muted elements, disabled states |
| Yellow | #FFF469 | 255, 244, 105 | Accent only - CTAs, highlights, active states |

---

## Assumptions and Constraints

### Assumptions

- Font files (WOFF2) can be self-hosted and loaded via CSS @font-face
- Brand guidelines document is the authoritative source for design decisions
- The Boss uses a modern browser that supports WOFF2 fonts
- All Boss Office components will be reviewed against this spec before deployment

### Constraints

- No colors outside the 4-color palette may be introduced
- Yellow is a precision tool - overuse dilutes its impact
- Font licensing allows web embedding (trial/licensed fonts in use)
- Accessibility requirements (WCAG AA) must be met within brand constraints

---

## Out of Scope

- Animation guidelines (beyond "no fancy transitions")
- Responsive breakpoint definitions (covered in implementation)
- Component library implementation details
- Icon set selection and management
- Email template design
- Print material design
- Social media asset guidelines
- Photography art direction for tools
