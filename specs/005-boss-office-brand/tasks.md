# Tasks: Boss Office Brand & Design Compliance

**Input**: Design documents from `/specs/005-boss-office-brand/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Type**: Constraint Specification - CSS Design System Implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This feature creates CSS/asset infrastructure for the Boss Office frontend:
- **CSS Files**: `frontend/src/styles/`
- **Font Assets**: `frontend/public/fonts/`
- **Logo Assets**: `frontend/public/images/`
- **Source Fonts**: `Designs/03. Fonts/woff2/`
- **Source Logo**: `Designs/02. logos/`

---

## Phase 1: Setup (Asset Infrastructure)

**Purpose**: Copy assets and create directory structure

- [ ] T001 Create styles directory structure at frontend/src/styles/tokens/
- [ ] T002 [P] Copy WOFF2 fonts from Designs/03. Fonts/woff2/ to frontend/public/fonts/
- [ ] T003 [P] Copy FastTrack_F_White.png from Designs/02. logos/ to frontend/public/images/
- [ ] T004 [P] Add font preload links to frontend/index.html (or _document.tsx for Next.js)

---

## Phase 2: Foundational (Design Token System)

**Purpose**: Core CSS variables that ALL user stories depend on

**⚠️ CRITICAL**: No component styling can begin until tokens are defined

- [ ] T005 Create @font-face declarations in frontend/src/styles/fonts.css per research.md pattern
- [ ] T006 [P] Create color tokens in frontend/src/styles/tokens/colors.css per data-model.md
- [ ] T007 [P] Create typography tokens in frontend/src/styles/tokens/typography.css per data-model.md
- [ ] T008 [P] Create spacing tokens in frontend/src/styles/tokens/spacing.css per data-model.md
- [ ] T009 [P] Create border tokens in frontend/src/styles/tokens/borders.css per data-model.md
- [ ] T010 Create brand reset stylesheet in frontend/src/styles/brand-reset.css per research.md pattern
- [ ] T011 Create main brand.css that imports all token files in correct order at frontend/src/styles/brand.css

**Checkpoint**: Foundation ready - all CSS custom properties defined and reset applied

---

## Phase 3: User Story 1 - Visual Brand Compliance (Priority: P1) 🎯 MVP

**Goal**: Establish the core visual language - colors only from palette, borders black, no rounded corners

**Independent Test**: Open any Boss Office page in DevTools, verify only #000000, #FFFFFF, #B2B2B2, #FFF469 colors exist

### Implementation for User Story 1

- [ ] T012 [US1] Create base element styles (body, div, section) in frontend/src/styles/base.css enforcing brand colors
- [ ] T013 [US1] Create container/card component styles in frontend/src/styles/components/cards.css with 3px black borders
- [ ] T014 [P] [US1] Create header component styles with logo positioning in frontend/src/styles/components/header.css
- [ ] T015 [US1] Add brand.css import to main application entry point (frontend/src/index.css or globals.css)

**Checkpoint**: Visual foundation complete - all elements use brand colors, black borders, no rounded corners

---

## Phase 4: User Story 2 - Typography Hierarchy (Priority: P1)

**Goal**: All text uses correct fonts (Plaak headlines UPPERCASE, Riforma body, Monument labels UPPERCASE)

**Independent Test**: Inspect any text element, verify font-family and text-transform match typography contracts

### Implementation for User Story 2

- [ ] T016 [P] [US2] Create headline styles (h1-h6) in frontend/src/styles/typography/headlines.css using Plaak UPPERCASE
- [ ] T017 [P] [US2] Create body text styles (p, span, div) in frontend/src/styles/typography/body.css using Riforma
- [ ] T018 [P] [US2] Create label styles (.label, .meta, .badge) in frontend/src/styles/typography/labels.css using Monument UPPERCASE
- [ ] T019 [US2] Create combined typography.css that imports all typography files at frontend/src/styles/typography.css
- [ ] T020 [US2] Update brand.css to import typography.css in frontend/src/styles/brand.css

**Checkpoint**: Typography complete - all text elements use correct font families and transforms

---

## Phase 5: User Story 3 - Color System Compliance (Priority: P1)

**Goal**: Yellow used sparingly for accent only, backgrounds are only black or white, proper contrast

**Independent Test**: Audit all color values in rendered CSS, verify palette compliance

### Implementation for User Story 3

- [ ] T021 [P] [US3] Create background utility classes in frontend/src/styles/utilities/backgrounds.css
- [ ] T022 [P] [US3] Create text color utility classes in frontend/src/styles/utilities/text-colors.css
- [ ] T023 [US3] Create semantic color classes (.ft-accent, .ft-muted, .ft-inverted) in frontend/src/styles/utilities/semantic.css
- [ ] T024 [US3] Update brand.css to import all utility files in frontend/src/styles/brand.css

**Checkpoint**: Color system complete - palette enforced throughout UI

---

## Phase 6: User Story 4 - Layout and Spacing (Priority: P2)

**Goal**: 12-column grid, left-aligned content, consistent 8px-based spacing

**Independent Test**: Inspect page layouts, verify grid structure and spacing uses token values

### Implementation for User Story 4

- [ ] T025 [P] [US4] Create grid layout classes in frontend/src/styles/layout/grid.css per layout.yaml contract
- [ ] T026 [P] [US4] Create spacing utility classes in frontend/src/styles/layout/spacing.css using spacing tokens
- [ ] T027 [P] [US4] Create alignment utility classes in frontend/src/styles/layout/alignment.css enforcing left-align default
- [ ] T028 [US4] Create combined layout.css that imports all layout files at frontend/src/styles/layout.css
- [ ] T029 [US4] Update brand.css to import layout.css in frontend/src/styles/brand.css

**Checkpoint**: Layout complete - grid and spacing follow brand guidelines

---

## Phase 7: User Story 5 - Forbidden Pattern Enforcement (Priority: P2)

**Goal**: CSS rules that prevent gradients, shadows, rounded corners, fancy transitions

**Independent Test**: Attempt to add border-radius or box-shadow in DevTools, verify brand-reset.css overrides

### Implementation for User Story 5

- [ ] T030 [US5] Verify brand-reset.css properly resets border-radius to 0 in frontend/src/styles/brand-reset.css
- [ ] T031 [US5] Verify brand-reset.css properly removes box-shadow in frontend/src/styles/brand-reset.css
- [ ] T032 [US5] Verify brand-reset.css properly removes transitions except buttons in frontend/src/styles/brand-reset.css
- [ ] T033 [P] [US5] Create CSS linter configuration for forbidden patterns in .stylelintrc.json

**Checkpoint**: Forbidden patterns enforced - CSS actively prevents brand violations

---

## Phase 8: User Story 6 - Tone of Voice (Priority: P2)

**Goal**: Button labels, error messages, and UI copy follow Fast Track voice guidelines

**Independent Test**: Read all UI text, verify imperative verbs on buttons, no hedging words

### Implementation for User Story 6

- [ ] T034 [P] [US6] Create button component styles in frontend/src/styles/components/buttons.css per buttons.yaml contract
- [ ] T035 [P] [US6] Create error state styles (yellow background) in frontend/src/styles/components/feedback.css
- [ ] T036 [P] [US6] Create success state styles (black checkmark) in frontend/src/styles/components/feedback.css
- [ ] T037 [P] [US6] Create form element styles in frontend/src/styles/components/forms.css
- [ ] T038 [US6] Create combined components.css that imports all component files at frontend/src/styles/components.css
- [ ] T039 [US6] Update brand.css to import components.css in frontend/src/styles/brand.css

**Checkpoint**: Component styles complete - buttons, forms, feedback follow brand

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and validation

- [ ] T040 Verify all CSS files import correctly in production build
- [ ] T041 [P] Create responsive breakpoint media queries in frontend/src/styles/responsive.css
- [ ] T042 [P] Document all CSS classes in frontend/src/styles/README.md
- [ ] T043 Run full brand compliance checklist from specs/005-boss-office-brand/checklists/requirements.md
- [ ] T044 Verify font loading performance < 500ms in Lighthouse audit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational (Phase 2)
  - US1 (Visual) → US2 (Typography) → US3 (Color) can proceed in sequence for MVP
  - US4, US5, US6 depend on US1-US3 token definitions but are otherwise independent
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Visual) | Foundational | None - MVP first |
| US2 (Typography) | Foundational, US1 tokens | US3 |
| US3 (Color) | Foundational, US1 tokens | US2 |
| US4 (Layout) | Foundational, US1-US3 | US5, US6 |
| US5 (Forbidden) | Foundational | US4, US6 |
| US6 (Tone/Components) | Foundational, US1-US3 | US4, US5 |

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
```bash
# These can run in parallel (different files):
T006: colors.css
T007: typography.css
T008: spacing.css
T009: borders.css
```

**Within User Story Phases**:
```bash
# US2 parallel tasks:
T016: headlines.css
T017: body.css
T018: labels.css

# US6 parallel tasks:
T034: buttons.css
T035: feedback.css
T036: feedback.css (same file - NOT parallel)
T037: forms.css
```

---

## Implementation Strategy

### MVP First (Visual Foundation)

1. Complete Phase 1: Setup (copy assets)
2. Complete Phase 2: Foundational (all tokens defined)
3. Complete Phase 3: US1 - Visual Brand (colors, borders, containers)
4. **STOP and VALIDATE**: Open Boss Office, verify 4-color palette enforced
5. Deploy/demo if ready - visual brand is established

### Incremental Delivery

1. **Foundation** → Tokens and reset ready
2. **US1 Visual** → Base styling complete → Validate colors
3. **US2 Typography** → Fonts applied → Validate font families
4. **US3 Color** → Semantic colors → Validate accent usage
5. **US4 Layout** → Grid and spacing → Validate alignment
6. **US5 Forbidden** → Pattern enforcement → Validate no violations
7. **US6 Components** → Interactive elements → Validate buttons/forms
8. **Polish** → Documentation and audit → Final validation

### File Creation Order

```text
1. frontend/src/styles/fonts.css              (Phase 2)
2. frontend/src/styles/tokens/colors.css      (Phase 2)
3. frontend/src/styles/tokens/typography.css  (Phase 2)
4. frontend/src/styles/tokens/spacing.css     (Phase 2)
5. frontend/src/styles/tokens/borders.css     (Phase 2)
6. frontend/src/styles/brand-reset.css        (Phase 2)
7. frontend/src/styles/brand.css              (Phase 2 - imports all)
8. frontend/src/styles/base.css               (US1)
9. frontend/src/styles/components/cards.css   (US1)
10. frontend/src/styles/components/header.css (US1)
...
```

---

## Notes

- All tasks create CSS files - no JavaScript implementation needed
- [P] tasks can run in parallel (different files)
- [Story] label maps task to specific user story from spec.md
- Font assets must be copied before fonts.css can work
- brand.css must import files in correct order (tokens → reset → base → components)
- Validate with checklists/requirements.md after each user story
