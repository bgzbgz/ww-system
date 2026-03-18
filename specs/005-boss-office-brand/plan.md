# Implementation Plan: Boss Office Brand & Design Compliance

**Branch**: `005-boss-office-brand` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-boss-office-brand/spec.md`
**Type**: Constraint Specification (Spec 000) - Design Rules, Not Feature Implementation

## Summary

This is a **constraint specification** that defines mandatory design rules for the Boss Office UI. Unlike feature specs that describe what to build, this spec describes **how everything must look and feel**. It provides the authoritative design contract that complements the functional spec (`004-boss-office-completion`).

**Primary Deliverables**:
1. CSS design tokens (colors, typography, spacing)
2. Font loading configuration (@font-face)
3. Component styling guidelines
4. Brand compliance validation checklist

## Technical Context

**Language/Version**: CSS3, HTML5
**Primary Dependencies**: WOFF2 fonts (self-hosted), PNG logo asset
**Storage**: N/A (static assets only)
**Testing**: Visual regression testing, manual brand audit
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Design system / CSS configuration
**Performance Goals**: Font loading < 500ms, no layout shift
**Constraints**: 4-color palette only, no rounded corners, no shadows
**Scale/Scope**: All Boss Office pages (Dashboard, Tool Detail, Upload, Preview)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Law | Status | Notes |
|-----|--------|-------|
| LAW I — Decision Is the Product | **EXEMPT** | This is a constraint spec, not a tool. No decision is being forced on users. |
| LAW II — Spec Is the Source of Truth | **PASS** | Spec exists and is complete. Implementation will trace to spec requirements. |
| LAW III — Contracts Over Interpretation | **PASS** | All visual requirements are explicitly defined (colors, fonts, layouts, forbidden patterns). |
| LAW IV — Human Authority Is Final | **PASS** | Brand guidelines approved by Fast Track leadership. |
| World-Class Tool Test | **EXEMPT** | Not a user-facing tool - design system constraints. |
| Fast Track DNA | **PASS** | Spec explicitly enforces Fast Track DNA (brutalist, honest, decisive). |

**Gate Result**: PASS (with exemptions noted for constraint spec type)

## Project Structure

### Documentation (this feature)

```text
specs/005-boss-office-brand/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output - font loading, CSS patterns
├── data-model.md        # Phase 1 output - design token definitions
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - component style contracts
│   ├── colors.yaml      # Color token contract
│   ├── typography.yaml  # Font usage contract
│   ├── buttons.yaml     # Button style contract
│   └── layout.yaml      # Grid and spacing contract
└── checklists/
    └── requirements.md  # Brand compliance validation (complete)
```

### Source Code (repository root)

```text
# Design system assets integration
Designs/
├── 02. logos/
│   └── FastTrack_F_White.png    # Header logo
└── 03. Fonts/
    └── woff2/
        ├── Plaak3Trial-43-Bold.woff2      # Headlines
        ├── RiformaLL-Regular.woff2         # Body
        └── MonumentGrotesk-Mono.woff2      # Labels

# CSS integration (target location in Boss Office codebase)
frontend/
└── src/
    └── styles/
        ├── tokens/
        │   ├── colors.css       # Color CSS variables
        │   ├── typography.css   # Font definitions
        │   └── spacing.css      # Grid and spacing
        ├── fonts.css            # @font-face declarations
        └── brand.css            # Combined brand styles
```

**Structure Decision**: Design tokens will be defined as CSS custom properties for maximum compatibility with any frontend framework (React, Vue, plain HTML).

## Complexity Tracking

> No violations - this is a straightforward design system implementation.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Color system | Low | 4 colors, no variations |
| Typography | Medium | 3 fonts with specific usage rules |
| Layout | Low | Standard 12-column grid |
| Forbidden patterns | Low | Explicit deny-list in CSS |

## Implementation Phases

### Phase 0: Research (Complete)

Research areas:
- WOFF2 font loading best practices
- CSS custom property patterns for design tokens
- Cross-browser compatibility for @font-face
- Accessibility contrast ratios within 4-color palette

### Phase 1: Design Artifacts

1. **data-model.md**: Design token schema
   - Color tokens (4 values)
   - Typography tokens (3 font families, sizes, weights)
   - Spacing tokens (8px base unit scale)
   - Border tokens (widths, no radius)

2. **contracts/**: Style contracts per component type
   - Colors: When to use each color
   - Typography: Which font for which context
   - Buttons: Primary, secondary, tertiary, disabled states
   - Layout: Grid, alignment, spacing rules

3. **quickstart.md**: How to apply brand to new components

### Phase 2: Implementation Tasks

Tasks will be generated via `/speckit.tasks` and include:
- Create CSS custom property definitions
- Configure @font-face for WOFF2 fonts
- Create button component styles
- Create card component styles
- Create form element styles
- Add logo to header component
- Create brand compliance test suite
