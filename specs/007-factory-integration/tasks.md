# Tasks: Factory Integration

**Input**: Design documents from `/specs/007-factory-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Type**: Webhook Integration - Submit Jobs to Factory

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1-US3) - required for story phases only
- All paths are relative to repository root

## Path Conventions (from plan.md)

```text
backend/
├── src/
│   ├── models/
│   │   └── job.ts           # MODIFY: Add FAILED_SEND, new fields
│   ├── services/
│   │   ├── storage.ts       # EXISTING: File retrieval
│   │   └── factory.ts       # NEW: Factory webhook client
│   └── routes/
│       └── jobs.ts          # MODIFY: Add submit endpoint

src/
├── api/
│   ├── jobs.ts              # EXISTING: Job API client
│   └── factory.ts           # NEW: Submit API client
├── components/
│   └── jobs/
│       └── job-status.html  # NEW: Status display component
├── styles/
│   └── components/
│       └── _job-status.css  # NEW: Status badge styles
└── lib/
    └── jobs/
        └── submit.ts        # NEW: Submit handler
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure for new files

- [x] T001 Create frontend directory structure: src/api/, src/components/jobs/, src/lib/jobs/
- [x] T002 [P] Create _job-status.css import in src/styles/main.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend Job model with new status and fields that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add FAILED_SEND to JobStatus enum in backend/src/models/job.ts
- [x] T004 [P] Add submitted_at field (Date, optional) to Job interface in backend/src/models/job.ts
- [x] T005 [P] Add last_attempt_at field (Date, optional) to Job interface in backend/src/models/job.ts
- [x] T006 [P] Add failure_reason field (String, optional, max 500) to Job interface in backend/src/models/job.ts
- [x] T007 Update JobSchema with new fields (submitted_at, last_attempt_at, failure_reason) in backend/src/models/job.ts
- [x] T008 [P] Update JobResponse interface with optional submitted_at, last_attempt_at, failure_reason in backend/src/models/job.ts
- [x] T009 Update jobToResponse() to include new fields in backend/src/models/job.ts

**Checkpoint**: Foundation ready - Job model extended, user story implementation can begin

---

## Phase 3: User Story 1 - Submit Job to Factory (Priority: P1) 🎯 MVP

**Goal**: Boss can submit a DRAFT job to Factory and see SUBMITTED status

**Independent Test**: Create a Job in DRAFT state, click "Submit to Factory", verify status changes to SUBMITTED and Factory webhook receives the request

### Implementation for User Story 1

#### Backend Service

- [x] T010 [US1] Create factory.ts service file in backend/src/services/factory.ts
- [x] T011 [US1] Define FACTORY_WEBHOOK_URL constant (LOCKED) in backend/src/services/factory.ts
- [x] T012 [US1] Create FactoryWebhookRequest interface in backend/src/services/factory.ts
- [x] T013 [US1] Create SubmitResult interface (success/failure types) in backend/src/services/factory.ts
- [x] T014 [US1] Implement buildWebhookPayload() function (job + base64 file content) in backend/src/services/factory.ts
- [x] T015 [US1] Implement submitJobToFactory() with fetch + AbortController (30s timeout) in backend/src/services/factory.ts
- [x] T016 [US1] Add success handling (200 OK → SubmitResult.success) in backend/src/services/factory.ts

#### Backend Route

- [x] T017 [US1] Add POST /api/boss/jobs/:jobId/submit endpoint in backend/src/routes/jobs.ts
- [x] T018 [US1] Add job lookup by jobId in submit route in backend/src/routes/jobs.ts
- [x] T019 [US1] Add status validation (must be DRAFT) in submit route in backend/src/routes/jobs.ts
- [x] T020 [US1] Call submitJobToFactory() and handle success response in backend/src/routes/jobs.ts
- [x] T021 [US1] Update job status to SUBMITTED, set submitted_at and last_attempt_at in backend/src/routes/jobs.ts
- [x] T022 [US1] Return SubmitSuccessResponse per contracts/submit.yaml in backend/src/routes/jobs.ts

#### Frontend API Client

- [x] T023 [US1] Create factory.ts API client file in src/api/factory.ts
- [x] T024 [US1] Implement submitJob(jobId) function in src/api/factory.ts

#### Frontend Submit Handler

- [x] T025 [US1] Create submit.ts handler file in src/lib/jobs/submit.ts
- [x] T026 [US1] Implement handleSubmit(jobId) function in src/lib/jobs/submit.ts
- [x] T027 [US1] Add loading state management in src/lib/jobs/submit.ts
- [x] T028 [US1] Add success feedback "Job sent to Factory" display in src/lib/jobs/submit.ts

#### Frontend UI

- [x] T029 [US1] Create job-status.html component in src/components/jobs/job-status.html
- [x] T030 [US1] Add DRAFT status badge display in src/components/jobs/job-status.html
- [x] T031 [US1] Add SUBMITTED status badge display in src/components/jobs/job-status.html
- [x] T032 [US1] Add "Submit to Factory" button for DRAFT jobs in src/components/jobs/job-status.html
- [x] T033 [US1] Add loading indicator during submission in src/components/jobs/job-status.html
- [x] T034 [US1] Add button disabled state during submission in src/components/jobs/job-status.html

#### Frontend Styles

- [x] T035 [US1] Create _job-status.css styles file in src/styles/components/_job-status.css
- [x] T036 [US1] Add .ft-badge--default styles for DRAFT in src/styles/components/_job-status.css
- [x] T037 [US1] Add .ft-badge--success styles for SUBMITTED in src/styles/components/_job-status.css
- [x] T038 [US1] Add loading spinner styles in src/styles/components/_job-status.css

**Checkpoint**: Boss can submit DRAFT jobs to Factory - core MVP complete

---

## Phase 4: User Story 2 - Handle Factory Submission Failure (Priority: P1)

**Goal**: Boss sees error and retry option when submission fails

**Independent Test**: Simulate network timeout or Factory error, verify job shows FAILED_SEND status with error message and Retry button

### Implementation for User Story 2

#### Backend Error Handling

- [x] T039 [US2] Add error handling for non-200 response in backend/src/services/factory.ts
- [x] T040 [US2] Add timeout handling (AbortError) in backend/src/services/factory.ts
- [x] T041 [US2] Add network error handling in backend/src/services/factory.ts
- [x] T042 [US2] Add file not found handling (missing storage file) in backend/src/services/factory.ts
- [x] T043 [US2] Map errors to failure_reason strings per data-model.md in backend/src/services/factory.ts

#### Backend Route Error Handling

- [x] T044 [US2] Handle SubmitResult.failure in submit route in backend/src/routes/jobs.ts
- [x] T045 [US2] Update job status to FAILED_SEND, set last_attempt_at and failure_reason in backend/src/routes/jobs.ts
- [x] T046 [US2] Return SubmitFailureResponse per contracts/submit.yaml in backend/src/routes/jobs.ts

#### Backend Retry Support

- [x] T047 [US2] Update status validation to allow FAILED_SEND in submit route in backend/src/routes/jobs.ts
- [x] T048 [US2] Clear failure_reason on successful retry in backend/src/routes/jobs.ts

#### Frontend Error Display

- [x] T049 [US2] Add FAILED_SEND status badge (yellow per brand) in src/components/jobs/job-status.html
- [x] T050 [US2] Add error message display from failure_reason in src/components/jobs/job-status.html
- [x] T051 [US2] Add "Retry" button for FAILED_SEND jobs in src/components/jobs/job-status.html

#### Frontend Retry Handler

- [x] T052 [US2] Implement handleRetry(jobId) function in src/lib/jobs/submit.ts
- [x] T053 [US2] Wire retry button to handleRetry in src/lib/jobs/submit.ts

#### Frontend Styles

- [x] T054 [US2] Add .ft-badge--warning styles for FAILED_SEND (yellow, not red) in src/styles/components/_job-status.css
- [x] T055 [US2] Add error message styles in src/styles/components/_job-status.css

**Checkpoint**: Boss can see failures and retry - failure handling complete

---

## Phase 5: User Story 3 - View Submission Status (Priority: P2)

**Goal**: Boss can see status of all jobs at a glance

**Independent Test**: View job list with DRAFT, SUBMITTED, FAILED_SEND jobs, verify each shows correct status badge and appropriate actions

### Implementation for User Story 3

#### Backend Job List

- [x] T056 [US3] Ensure GET /api/boss/jobs includes new fields (submitted_at, last_attempt_at, failure_reason) in backend/src/routes/jobs.ts
- [x] T057 [US3] Ensure GET /api/boss/jobs/:jobId includes new fields in backend/src/routes/jobs.ts

#### Frontend Status Display Enhancements

- [x] T058 [US3] Add conditional button display based on status in src/components/jobs/job-status.html
- [x] T059 [US3] Hide submit button for SUBMITTED jobs in src/components/jobs/job-status.html
- [x] T060 [US3] Show "Waiting for Factory" message for SUBMITTED jobs in src/components/jobs/job-status.html
- [x] T061 [US3] Add last_attempt_at timestamp display for FAILED_SEND jobs in src/components/jobs/job-status.html

**Checkpoint**: Status visibility complete - Boss can track all job states

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, validation, and final polish

- [x] T062 Add already submitted validation with message "Job already sent to Factory" in backend/src/routes/jobs.ts
- [x] T063 [P] Add job not found validation with 404 response in backend/src/routes/jobs.ts
- [x] T064 [P] Verify brand compliance: yellow for warnings, black borders, no rounded corners in src/styles/components/_job-status.css
- [x] T065 Verify all error messages match Fast Track DNA (short, direct) per contracts/job-status.yaml
- [x] T066 Run full requirements checklist from specs/007-factory-integration/checklists/requirements.md
- [ ] T067 Manual browser testing with submit, failure simulation, and retry flows

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────┐
    │                                                 │
    ▼                                                 │
Phase 2 (Foundational) ◄── BLOCKS ALL USER STORIES   │
    │                                                 │
    ├───────────────┬─────────────────────────────────┤
    ▼               ▼                                 │
Phase 3         Phase 4                               │
(US1)           (US2)                                 │
    │               │                                 │
    └───────┬───────┘                                 │
            ▼                                         │
        Phase 5 ◄─────────────────────────────────────┘
        (US3)
            │
            ▼
        Phase 6 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Submit) | Phase 2 Foundational | US2 (mostly) |
| US2 (Failure) | Phase 2, shares backend with US1 | US1 (backend) |
| US3 (Status Display) | US1 and US2 complete | None |

**Note**: US1 and US2 are tightly coupled - both P1 priority, both involve submit endpoint. Implement together as the MVP.

### Parallel Opportunities per Phase

**Phase 2 (Foundational)** - 4 tasks in parallel:
```bash
T004: submitted_at field
T005: last_attempt_at field
T006: failure_reason field
T008: JobResponse interface update
```

**Phase 3 (US1)** - Backend and Frontend can partially parallel:
```bash
# Backend first (T010-T022), then:
# Frontend parallel:
T023-T024: API client
T025-T028: Submit handler
T029-T034: UI component
T035-T038: Styles
```

**Phase 4 (US2)** - Error handling parallel:
```bash
T039-T043: Backend service error handling (parallel)
T049-T051: Frontend error display (parallel)
T054-T055: Error styles (parallel)
```

---

## Implementation Strategy

### MVP First (Phase 1-4: US1 + US2)

1. **Phase 1**: Create directory structure
2. **Phase 2**: Extend Job model with FAILED_SEND and new fields
3. **Phase 3**: Implement submit flow (US1)
4. **Phase 4**: Implement failure handling (US2)
5. **VALIDATE**: Submit a job, simulate failure, retry
6. **DEPLOY**: Core submission functionality live

### Incremental Delivery

| Milestone | Phases | Validation |
|-----------|--------|------------|
| Foundation | 1-2 | Job model extended, new fields available |
| MVP Submit | 3-4 | Submit works, failures handled with retry |
| Status View | 5 | All statuses visible with correct UI |
| Polish | 6 | All edge cases handled, brand compliant |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 67 |
| **Completed** | 66 |
| **Remaining** | 1 (manual browser testing) |
| **Phase 1 (Setup)** | 2/2 ✓ |
| **Phase 2 (Foundational)** | 7/7 ✓ |
| **US1 (Submit)** | 29/29 ✓ |
| **US2 (Failure)** | 17/17 ✓ |
| **US3 (Status Display)** | 6/6 ✓ |
| **Phase 6 (Polish)** | 5/6 ✓ |

---

## Notes

- US1 and US2 are both P1 and tightly coupled - treat as combined MVP
- FACTORY_WEBHOOK_URL is LOCKED - hardcode per spec, not configurable
- Error messages follow Fast Track DNA (short, direct, actionable)
- Uses existing Fast Track CSS from spec-005
- Yellow (#FFF469) for warnings (FAILED_SEND), not red
- 30 second timeout is hardcoded per spec
- [P] tasks can run in parallel (different files)
- [Story] label maps task to spec.md user story
- Commit after each task or logical group
