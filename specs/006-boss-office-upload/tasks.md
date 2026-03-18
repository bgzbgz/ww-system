# Tasks: Boss Office Upload Command

**Input**: Design documents from `/specs/006-boss-office-upload/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Type**: File Upload Feature - Drag-and-Drop + File Picker to Create Job

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1-US6) - required for story phases only
- All paths are relative to repository root

## Path Conventions (from plan.md)

```text
src/
├── styles/
│   ├── components/
│   │   └── _upload.css      # Upload dropzone styles
│   └── main.css             # Entry point
├── lib/
│   └── upload/
│       ├── types.ts         # Type definitions
│       ├── validation.ts    # File validation logic
│       └── dropzone.ts      # Drag-drop handler
├── api/
│   └── jobs.ts              # Job creation API client
├── components/
│   └── upload/
│       └── dropzone.html    # Upload component template
└── pages/
    └── upload.ts            # Upload page logic

backend/
├── src/
│   ├── routes/
│   │   └── jobs.ts          # POST /api/boss/jobs
│   ├── services/
│   │   └── storage.ts       # File storage service
│   └── models/
│       ├── job.ts           # Job mongoose model
│       └── storedFile.ts    # StoredFile interface
└── tests/
    └── jobs.test.ts         # Job API tests
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and base files

- [x] T001 Create frontend directory structure: src/lib/upload/, src/components/upload/, src/pages/, src/api/
- [x] T002 [P] Create backend directory structure: backend/src/routes/, backend/src/services/, backend/src/models/
- [x] T003 [P] Add _upload.css import to src/styles/main.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared validation logic and data models that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create FileType and JobStatus enums in src/lib/upload/types.ts per data-model.md
- [x] T005 [P] Create file validation function (validateFile) in src/lib/upload/validation.ts per contracts/validation.yaml
- [x] T006 [P] Create file size formatter (formatFileSize) in src/lib/upload/validation.ts per data-model.md
- [x] T007 [P] Create filename sanitizer (sanitizeFilename) in src/lib/upload/validation.ts per data-model.md
- [x] T008 Create Job mongoose model in backend/src/models/job.ts per contracts/job.yaml
- [x] T009 [P] Create StoredFile interface in backend/src/models/storedFile.ts per data-model.md

**Checkpoint**: Foundation ready - validation logic and models defined, user story implementation can begin

---

## Phase 3: User Story 1 - Upload via Drag-and-Drop (Priority: P1) 🎯 MVP

**Goal**: Boss can drag-drop a PDF/DOCX/TXT/MD file into dropzone and create a Job in DRAFT state

**Independent Test**: Drag a .pdf file into dropzone, verify yellow highlight on drag-over, file info displays, and Job created with correct metadata

### Implementation for User Story 1

- [x] T010 [US1] Create dropzone HTML template in src/components/upload/dropzone.html with drag-drop area per contracts/upload.yaml
- [x] T011 [US1] Create dropzone CSS styles in src/styles/components/_upload.css with yellow highlight on drag-over per brand guidelines
- [x] T012 [US1] Implement drag-and-drop event handlers (dragenter, dragover, dragleave, drop) in src/lib/upload/dropzone.ts
- [x] T013 [US1] Add file validation call on drop event in src/lib/upload/dropzone.ts using validateFile()
- [x] T014 [US1] Add file info display (filename, type badge, size) after successful drop in src/lib/upload/dropzone.ts
- [x] T015 [US1] Create upload page that initializes dropzone in src/pages/upload.ts

**Checkpoint**: Drag-and-drop working - Boss can drop files and see validation feedback

---

## Phase 4: User Story 2 - Upload via File Picker (Priority: P1)

**Goal**: Boss can click "Choose File" button as alternative to drag-drop

**Independent Test**: Click "Choose File" button, select a .txt file from dialog (filtered to supported types), verify Job created identically to drag-drop

### Implementation for User Story 2

- [x] T016 [US2] Add file input element with accept filter to src/components/upload/dropzone.html per contracts/upload.yaml
- [x] T017 [US2] Add "Choose File" button styled per brand in src/styles/components/_upload.css
- [x] T018 [US2] Implement file input change handler in src/lib/upload/dropzone.ts calling same validation as drag-drop
- [x] T019 [US2] Ensure file picker dialog filters to .pdf,.docx,.txt,.md in src/components/upload/dropzone.html

**Checkpoint**: File picker working - Boss has two upload methods with identical behavior

---

## Phase 5: User Story 3 - Block Unsupported File Types (Priority: P1)

**Goal**: Show actionable error when unsupported file type is dropped/selected

**Independent Test**: Drop a .exe file, verify error "Wrong file type. Use PDF, DOCX, TXT, or MD." appears immediately, no Job created

### Implementation for User Story 3

- [x] T020 [US3] Add error message container to src/components/upload/dropzone.html using .ft-error component
- [x] T021 [US3] Implement showError() function in src/lib/upload/dropzone.ts that displays validation errors
- [x] T022 [US3] Wire file type validation error to error display in src/lib/upload/dropzone.ts
- [x] T023 [US3] Implement hideError() function that clears error when new file is dropped in src/lib/upload/dropzone.ts

**Checkpoint**: File type validation working - unsupported files rejected with correct message

---

## Phase 6: User Story 4 - Block Files Exceeding Size Limit (Priority: P2)

**Goal**: Show actionable error when file exceeds 10MB limit

**Independent Test**: Attempt to upload a 15MB PDF, verify error "File too large. Split it." appears, no Job created

### Implementation for User Story 4

- [x] T024 [US4] Ensure MAX_SIZE constant (10MB) defined in src/lib/upload/types.ts
- [x] T025 [US4] Wire file size validation error to error display in src/lib/upload/dropzone.ts
- [x] T026 [US4] Add empty file (0-byte) validation with error "File is empty. Upload a document with content." in src/lib/upload/validation.ts

**Checkpoint**: Size validation working - oversized and empty files rejected with correct messages

---

## Phase 7: User Story 5 - Display File Information (Priority: P2)

**Goal**: Show filename, type badge, and formatted size after file selection

**Independent Test**: Drop "market-analysis.pdf" (2.5MB), verify display shows filename, "PDF" badge, "2.5 MB" size

### Implementation for User Story 5

- [x] T027 [US5] Create file info display section in src/components/upload/dropzone.html with placeholders for name, badge, size
- [x] T028 [US5] Style file info display and type badge in src/styles/components/_upload.css using .ft-badge
- [x] T029 [US5] Implement showFileInfo() function in src/lib/upload/dropzone.ts that populates file info
- [x] T030 [US5] Add "Remove" button to file info section in src/components/upload/dropzone.html
- [x] T031 [US5] Implement clearFile() function in src/lib/upload/dropzone.ts for remove button

**Checkpoint**: File info display working - Boss sees file details before submission

---

## Phase 8: User Story 6 - Store File and Create Job (Priority: P1)

**Goal**: Store uploaded file and create Job entity in MongoDB with DRAFT status

**Independent Test**: Upload a file, verify file exists in storage with correct content, Job record exists with all required fields

### Implementation for User Story 6

- [x] T032 [US6] Create file storage service in backend/src/services/storage.ts per data-model.md
- [x] T033 [US6] Implement storeFile() function that saves binary and returns storage_key in backend/src/services/storage.ts
- [x] T034 [US6] Implement retrieveFile() function for Factory to get stored file in backend/src/services/storage.ts
- [x] T035 [US6] Create POST /api/boss/jobs endpoint in backend/src/routes/jobs.ts per contracts/job.yaml
- [x] T036 [US6] Add multipart file upload middleware to jobs route in backend/src/routes/jobs.ts
- [x] T037 [US6] Implement job creation logic: generate UUID, store file, create Job record in backend/src/routes/jobs.ts
- [x] T038 [US6] Create API client createJob() function in src/api/jobs.ts
- [x] T039 [US6] Wire submit action to API call in src/lib/upload/dropzone.ts
- [x] T040 [US6] Add success feedback display using .ft-success in src/lib/upload/dropzone.ts
- [x] T041 [US6] Add loading state during upload in src/lib/upload/dropzone.ts

**Checkpoint**: End-to-end working - File stored, Job created in DRAFT state

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and final validation

- [x] T042 Add multiple file rejection with message "One file at a time. Drop a single file." in src/lib/upload/dropzone.ts
- [x] T043 [P] Add network error handling with message "Upload failed. Check connection and try again." in src/lib/upload/dropzone.ts
- [x] T044 [P] Add storage error handling with message "Storage unavailable. Try again later." in backend/src/routes/jobs.ts
- [x] T045 [P] Add retry button for failed uploads in src/components/upload/dropzone.html
- [x] T046 Verify brand compliance: yellow highlight, black borders, no rounded corners in src/styles/components/_upload.css
- [x] T047 Run full requirements checklist from specs/006-boss-office-upload/checklists/requirements.md
- [ ] T048 Manual browser testing with all file types (PDF, DOCX, TXT, MD)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────┐
    │                                                 │
    ▼                                                 │
Phase 2 (Foundational) ◄── BLOCKS ALL USER STORIES   │
    │                                                 │
    ├───────────┬───────────┬───────────┬───────────┤
    ▼           ▼           ▼           ▼           │
Phase 3     Phase 4     Phase 5     Phase 6         │
(US1)       (US2)       (US3)       (US4)          │
    │           │           │           │           │
    └─────┬─────┴─────┬─────┴───────────┘           │
          ▼           ▼                             │
      Phase 7     Phase 8 ◄─────────────────────────┘
      (US5)       (US6)
          │           │
          └─────┬─────┘
                ▼
          Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Drag-Drop) | Phase 2 Foundational | US2, US3, US4 |
| US2 (File Picker) | Phase 2 | US1, US3, US4 |
| US3 (Type Validation) | Phase 2 | US1, US2, US4 |
| US4 (Size Validation) | Phase 2 | US1, US2, US3 |
| US5 (File Info) | US1 or US2 complete | US6 |
| US6 (Storage/Job) | Phase 2, some UI from US1 | US5 |

### Parallel Opportunities per Phase

**Phase 2 (Foundational)** - 4 tasks in parallel:
```bash
T005: src/lib/upload/validation.ts (validateFile)
T006: src/lib/upload/validation.ts (formatFileSize)
T007: src/lib/upload/validation.ts (sanitizeFilename)
T009: backend/src/models/storedFile.ts
```

**Phase 8 (US6)** - Backend parallel with frontend:
```bash
# Backend (parallel):
T032-T034: backend/src/services/storage.ts
T035-T037: backend/src/routes/jobs.ts

# Frontend (after backend):
T038-T041: src/api/jobs.ts, src/lib/upload/dropzone.ts
```

**Phase 9 (Polish)** - 3 error handlers in parallel:
```bash
T043: Network error handling
T044: Storage error handling
T045: Retry button
```

---

## Implementation Strategy

### MVP First (Phase 1-3 + Phase 8)

1. **Phase 1**: Create directory structure
2. **Phase 2**: Implement validation logic and models
3. **Phase 3**: Implement drag-and-drop (US1)
4. **Phase 8**: Implement file storage and Job creation (US6)
5. **VALIDATE**: Drop a .pdf file, verify Job created
6. **DEPLOY**: Core upload functionality is live

### Incremental Delivery

| Milestone | Phases | Validation |
|-----------|--------|------------|
| Foundation | 1-2 | Validation functions work, models defined |
| MVP Upload | 3 + 8 | Drag-drop creates Job in DRAFT |
| File Picker | 4 | Alternative upload method works |
| Validation UI | 5-6 | Error messages display correctly |
| File Info | 7 | File details shown before submit |
| Polish | 9 | All edge cases handled |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 48 |
| **Completed** | 47 |
| **Remaining** | 1 (browser testing) |
| **Phase 1 (Setup)** | 3/3 ✓ |
| **Phase 2 (Foundational)** | 6/6 ✓ |
| **US1 (Drag-Drop)** | 6/6 ✓ |
| **US2 (File Picker)** | 4/4 ✓ |
| **US3 (Type Validation)** | 4/4 ✓ |
| **US4 (Size Validation)** | 3/3 ✓ |
| **US5 (File Info)** | 5/5 ✓ |
| **US6 (Storage/Job)** | 10/10 ✓ |
| **Phase 9 (Polish)** | 6/7 ✓ |

---

## Notes

- All validation happens client-side first (< 500ms per contract)
- Backend validates again as defense-in-depth
- [P] tasks can run in parallel (different files)
- [Story] label maps task to spec.md user story
- Uses existing Fast Track CSS from spec-005
- Job created in DRAFT state only; other states in future specs
- Commit after each task or logical group
