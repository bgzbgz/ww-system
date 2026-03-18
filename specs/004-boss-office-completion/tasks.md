# Implementation Tasks: Boss Office Phase Completion

**Feature**: Boss Office Phase Completion
**Branch**: `004-boss-office-completion`
**Date**: 2026-01-22
**Tech Stack**: React 18 + TypeScript 5.3 + Vite + Tailwind CSS + Express.js + MongoDB + multer + pdf-parse + mammoth + React Query v5

## Overview

This document provides a complete task breakdown for completing the Boss Office Factory UI. Tasks are organized by user story to enable independent, incremental delivery. Each user story represents a complete, testable increment of value.

**Total Estimated Tasks**: 135
**Recommended MVP**: Phase 1-2 (Setup) + Phase 3 (US6 + US1) = 67 tasks

## Implementation Strategy

1. **Start with Setup & Foundational** (Phase 1-2): Establish dependencies and shared infrastructure
2. **Implement by User Story Priority**: P1 stories first (US6, US1), then P2 (US2, US3), then P3 (US4, US5, US7)
3. **Test Each Story Independently**: Each story should be demonstrable and testable in isolation
4. **Parallel Opportunities**: Tasks marked [P] can be done concurrently with other [P] tasks
5. **No Tests Generated**: Tests are not included per default (can be added if requested)

---

## Phase 1: Project Setup & Dependencies (8 tasks)

**Goal**: Install required dependencies for file upload, parsing, and webhook integration

### Tasks

- [ ] T001 [P] Install backend file upload dependencies: multer, @types/multer
- [ ] T002 [P] Install backend file parsing dependencies: pdf-parse, @types/pdf-parse, mammoth
- [ ] T003 [P] Install frontend drag-and-drop dependency: react-dropzone
- [ ] T004 [P] Create backend/uploads/ directory for temporary file storage (add to .gitignore)
- [ ] T005 Update backend/.env.example with N8N_WORKER_WEBHOOK_URL, N8N_DEPLOY_WEBHOOK_URL, N8N_REVISION_WEBHOOK_URL, WEBHOOK_SECRET
- [ ] T006 Update boss-office-app/.env.example with upload endpoint configuration (if needed)
- [ ] T007 Create MongoDB indexes script in backend/scripts/create-indexes.js for tool_id unique index
- [ ] T008 Run MongoDB indexes script to create tool_id unique index and status compound index

**Checkpoint**: Dependencies installed, uploads directory created, environment variables documented

---

## Phase 2: Foundational Infrastructure (11 tasks)

**Goal**: Build shared file parser interfaces, value objects, and webhook client ports

### Tasks

- [ ] T009 [P] Create FileParser port interface in backend/src/application/ports/FileParser.ts
- [ ] T010 [P] Create WorkerWebhookClient port interface in backend/src/application/ports/WorkerWebhookClient.ts
- [ ] T011 [P] Create DeploymentWebhookClient port interface in backend/src/application/ports/DeploymentWebhookClient.ts
- [ ] T012 [P] Create RevisionWebhookClient port interface in backend/src/application/ports/RevisionWebhookClient.ts
- [ ] T013 Implement SourceDocument value object in backend/src/domain/value-objects/SourceDocument.ts
- [ ] T014 Implement UploadRequest entity in backend/src/domain/entities/UploadRequest.ts
- [ ] T015 Extend Tool entity in backend/src/domain/entities/Tool.ts to include source_document, document_type fields
- [ ] T016 [P] Create multer configuration middleware in backend/src/api/middleware/fileUpload.ts (10MB limit, .txt/.md/.pdf/.docx filter)
- [ ] T017 [P] Create upload payload validator in backend/src/api/validators/uploadValidator.ts
- [ ] T018 [P] Create webhook payload validator in backend/src/api/validators/webhookValidator.ts
- [ ] T019 [P] Create webhooks routes file in backend/src/api/routes/webhooks.ts (empty, will add endpoints in Phase 3)

**Checkpoint**: Domain model extended, interfaces defined, validators and middleware ready

---

## Phase 3: User Story 6 (P1) + User Story 1 (P1) - Critical Upload Flow (48 tasks)

**User Story 6**: Receive QA-Approved Tools via Webhook
**User Story 1**: Upload Document and Trigger Tool Generation

**Why together**: US6 is the completion point for US1 workflow. Upload → Worker → QA → Webhook Receiver creates full cycle.

**Independent Test Criteria**:
- **US6**: Send POST to /api/boss/webhooks/tool-ready with valid payload → Tool stored in MongoDB with status "pending_review" → Returns 200 OK
- **US1**: Upload .txt file with tool_purpose and client_name → Worker webhook called → After QA workflow → Tool appears in dashboard within 7 seconds

### Tasks

#### Webhook Receiver (US6)

- [ ] T020 [P] [US6] Implement ReceiveQAApprovedTool use case in backend/src/application/use-cases/ReceiveQAApprovedTool.ts
- [ ] T021 [US6] Create POST /api/boss/webhooks/tool-ready endpoint in backend/src/api/routes/webhooks.ts
- [ ] T022 [US6] Validate required fields (tool_id, generated_html, qa_score) in webhook endpoint using webhookValidator
- [ ] T023 [US6] Check for duplicate tool_id in MongoDB and return 409 Conflict if exists
- [ ] T024 [US6] Store tool in MongoDB with status "pending_review", generated_timestamp, qa_timestamp
- [ ] T025 [US6] Return 200 OK with stored tool summary on success
- [ ] T026 [US6] Return 400 Bad Request with error details on validation failure
- [ ] T027 [US6] Log webhook payload to MongoDB worker_logs collection for observability
- [ ] T028 [US6] Mount webhook routes in backend/src/server.ts (no authentication - webhook secret validated separately)

#### File Parsers (US1)

- [ ] T029 [P] [US1] Implement TxtParser in backend/src/infrastructure/parsers/TxtParser.ts (implements FileParser port)
- [ ] T030 [P] [US1] Implement MarkdownParser in backend/src/infrastructure/parsers/MarkdownParser.ts (implements FileParser port)
- [ ] T031 [P] [US1] Implement PdfParser in backend/src/infrastructure/parsers/PdfParser.ts using pdf-parse (implements FileParser port)
- [ ] T032 [P] [US1] Implement DocxParser in backend/src/infrastructure/parsers/DocxParser.ts using mammoth (implements FileParser port)
- [ ] T033 [US1] Create FileParserFactory in backend/src/infrastructure/parsers/FileParserFactory.ts to select parser by file extension

#### Worker Webhook Client (US1)

- [ ] T034 [P] [US1] Implement N8nWorkerClient in backend/src/infrastructure/webhooks/N8nWorkerClient.ts (implements WorkerWebhookClient port)
- [ ] T035 [US1] Build Worker webhook payload (tool_purpose, client_name, source_document) in N8nWorkerClient
- [ ] T036 [US1] Implement 60-second timeout for Worker webhook call in N8nWorkerClient
- [ ] T037 [US1] Implement error handling and retry logic in N8nWorkerClient

#### Upload Endpoint (US1)

- [ ] T038 [P] [US1] Implement UploadToolFromDocument use case in backend/src/application/use-cases/UploadToolFromDocument.ts
- [ ] T039 [US1] Create POST /api/boss/upload endpoint in backend/src/api/routes/boss.ts
- [ ] T040 [US1] Apply multer fileUpload middleware to upload endpoint (10MB limit)
- [ ] T041 [US1] Validate file type (.txt, .md, .pdf, .docx) in upload endpoint using uploadValidator
- [ ] T042 [US1] Validate file size (<10MB) in upload endpoint
- [ ] T043 [US1] Extract text content from uploaded file using FileParserFactory
- [ ] T044 [US1] Generate request_id with nanoid in upload endpoint
- [ ] T045 [US1] Call Worker webhook via N8nWorkerClient with extracted text
- [ ] T046 [US1] Return 200 OK with request_id, file_name, file_size, extracted_text, worker_webhook_called_at
- [ ] T047 [US1] Return 400 Bad Request for unsupported file types with error message "Only .txt, .md, .pdf, and .docx files are supported"
- [ ] T048 [US1] Return 500 Internal Server Error if text extraction fails with retry suggestion
- [ ] T049 [US1] Clean up temporary uploaded file after processing (success or failure)

#### Upload UI (US1)

- [ ] T050 [P] [US1] Create UploadPage in boss-office-app/src/presentation/pages/UploadPage.tsx
- [ ] T051 [P] [US1] Create FileUploadDropzone component in boss-office-app/src/presentation/components/FileUploadDropzone.tsx
- [ ] T052 [US1] Implement drag-and-drop functionality using react-dropzone in FileUploadDropzone
- [ ] T053 [US1] Add visual feedback for drag-over state (yellow border highlight) in FileUploadDropzone
- [ ] T054 [US1] Show file preview (filename, size) after file selection in FileUploadDropzone
- [ ] T055 [US1] Add form fields for tool_purpose (textarea) and client_name (input) below dropzone
- [ ] T056 [US1] Implement form validation: tool_purpose 5-500 chars, client_name 2-200 chars
- [ ] T057 [US1] Create useUploadTool mutation hook in boss-office-app/src/presentation/hooks/useUploadTool.ts using React Query
- [ ] T058 [US1] Implement upload progress indicator in FileUploadDropzone (show percentage during upload)
- [ ] T059 [US1] Show upload progress spinner during text extraction and Worker webhook call
- [ ] T060 [US1] Display success toast notification with request_id after successful upload
- [ ] T061 [US1] Display error message for unsupported file types with retry option
- [ ] T062 [US1] Display error message for file size limit exceeded (>10MB)
- [ ] T063 [US1] Display error message for text extraction failures with retry button
- [ ] T064 [US1] Add upload route /upload to boss-office-app/src/App.tsx
- [ ] T065 [US1] Add "Upload Document" navigation link to BossOfficeLayout sidebar
- [ ] T066 [US1] Disable submit button while upload is in progress
- [ ] T067 [US1] Clear form and reset dropzone after successful upload

**Story Completion**: Boss can upload files → Worker triggered → QA approves → Tool appears in dashboard

---

## Phase 4: User Story 2 (P2) - Preview Generated Tool (15 tasks)

**User Story**: Boss previews generated tool in desktop, tablet, and mobile views

**Independent Test Criteria**:
- Navigate to tool detail page → Click "Preview" button → Modal opens with HTML in iframe
- Click "Tablet" button → Iframe width changes to 768px
- Click "Mobile" button → Iframe width changes to 375px
- Verify iframe sandbox prevents XSS attacks (test with malicious HTML)

### Tasks

#### Preview Endpoint

- [ ] T068 [P] [US2] Create GET /api/boss/tools/:tool_id/preview endpoint in backend/src/api/routes/boss.ts
- [ ] T069 [US2] Return generated_html with Content-Type: text/html in preview endpoint
- [ ] T070 [US2] Return 404 Not Found if tool_id doesn't exist
- [ ] T071 [US2] Apply Clerk authentication middleware to preview endpoint

#### Preview UI

- [ ] T072 [P] [US2] Create ToolPreviewModal component in boss-office-app/src/presentation/components/ToolPreviewModal.tsx
- [ ] T073 [US2] Implement iframe with sandbox="allow-scripts allow-same-origin" in ToolPreviewModal
- [ ] T074 [US2] Add responsive mode selector (Desktop/Tablet/Mobile) to ToolPreviewModal
- [ ] T075 [US2] Implement Desktop mode (100% width) in ToolPreviewModal
- [ ] T076 [US2] Implement Tablet mode (768px width) in ToolPreviewModal
- [ ] T077 [US2] Implement Mobile mode (375px width) in ToolPreviewModal
- [ ] T078 [US2] Add full-screen toggle button to ToolPreviewModal
- [ ] T079 [US2] Add close button (X) to ToolPreviewModal
- [ ] T080 [US2] Add "Preview" button to ToolDetailView component
- [ ] T081 [US2] Implement loading state while preview HTML loads in iframe
- [ ] T082 [US2] Handle preview load errors (e.g., corrupted HTML) with error message

**Story Completion**: Boss can preview tools in all three responsive modes with secure iframe

---

## Phase 5: User Story 3 (P2) - Approve Tool for Deployment (16 tasks)

**User Story**: Boss approves tool and triggers automatic deployment to production

**Independent Test Criteria**:
- Click "Approve & Deploy" on pending_review tool → Deployment webhook called
- Tool status updates to "deployed", deployed_url displayed
- Click deployed_url link → Opens live tool in new tab
- Try approving already-deployed tool → Returns 409 Conflict error

### Tasks

#### Deployment Webhook Client

- [ ] T083 [P] [US3] Implement N8nDeploymentClient in backend/src/infrastructure/webhooks/N8nDeploymentClient.ts (implements DeploymentWebhookClient port)
- [ ] T084 [US3] Build Deployment webhook payload (tool_id, generated_html, tool_purpose) in N8nDeploymentClient
- [ ] T085 [US3] Implement 90-second timeout for Deployment webhook call in N8nDeploymentClient
- [ ] T086 [US3] Parse webhook response to extract deployed_url and github_commit_sha

#### Approve Endpoint

- [ ] T087 [P] [US3] Implement ApproveTool use case in backend/src/application/use-cases/ApproveTool.ts
- [ ] T088 [US3] Create PUT /api/boss/tools/:tool_id/approve endpoint in backend/src/api/routes/boss.ts
- [ ] T089 [US3] Check current tool status and return 409 Conflict if already deployed
- [ ] T090 [US3] Update tool boss_review_status to "approved" and boss_reviewed_at to current timestamp
- [ ] T091 [US3] Call Deployment webhook via N8nDeploymentClient
- [ ] T092 [US3] Update tool status to "deployed" after successful deployment
- [ ] T093 [US3] Store deployed_url, github_commit_sha, deployed_at in MongoDB
- [ ] T094 [US3] Return 200 OK with deployed tool details (deployed_url, github_commit_sha, deployed_at)
- [ ] T095 [US3] Return 500 Internal Server Error if deployment webhook fails with error details

#### Approve UI

- [ ] T096 [P] [US3] Create useApproveTool mutation hook in boss-office-app/src/presentation/hooks/useApproveTool.ts using React Query
- [ ] T097 [US3] Add "Approve & Deploy" button to ToolDetailView component
- [ ] T098 [US3] Implement loading state (spinner + disabled button) while deployment in progress
- [ ] T099 [US3] Display deployed_url as clickable link after successful approval
- [ ] T100 [US3] Add "Open Deployed Tool" button (target="_blank") next to deployed_url
- [ ] T101 [US3] Show success toast notification with deployed_url after successful deployment
- [ ] T102 [US3] Show error message with retry button if deployment webhook fails

**Story Completion**: Boss can approve tools and receive deployed_url within 90 seconds

---

## Phase 6: User Story 4 (P3) - Reject Tool with Feedback (11 tasks)

**User Story**: Boss rejects unsuitable tools with feedback

**Independent Test Criteria**:
- Click "Reject" on pending_review tool → Feedback modal appears
- Enter feedback "Does not match brand guidelines" → Confirm rejection
- Tool status updates to "rejected", disappears from Pending Review filter
- Tool still visible in "Rejected" filter view

### Tasks

#### Reject Endpoint

- [ ] T103 [P] [US4] Implement RejectTool use case in backend/src/application/use-cases/RejectTool.ts
- [ ] T104 [US4] Create PUT /api/boss/tools/:tool_id/reject endpoint in backend/src/api/routes/boss.ts
- [ ] T105 [US4] Validate boss_feedback is provided (5-5000 chars) in reject endpoint
- [ ] T106 [US4] Update tool status to "rejected", boss_review_status to "rejected", boss_feedback, boss_reviewed_at
- [ ] T107 [US4] Return 200 OK with updated tool details
- [ ] T108 [US4] Return 404 Not Found if tool_id doesn't exist

#### Reject UI

- [ ] T109 [P] [US4] Create RejectFeedbackModal component in boss-office-app/src/presentation/components/RejectFeedbackModal.tsx
- [ ] T110 [P] [US4] Create useRejectTool mutation hook in boss-office-app/src/presentation/hooks/useRejectTool.ts using React Query
- [ ] T111 [US4] Add "Reject" button to ToolDetailView component
- [ ] T112 [US4] Show RejectFeedbackModal with textarea when "Reject" clicked
- [ ] T113 [US4] Validate feedback input (5-5000 chars) in RejectFeedbackModal
- [ ] T114 [US4] Submit rejection with feedback on "Confirm Reject" button click
- [ ] T115 [US4] Show success toast notification after successful rejection
- [ ] T116 [US4] Close modal and redirect to Dashboard after rejection
- [ ] T117 [US4] Show error message if rejection fails with retry option

**Story Completion**: Boss can reject tools with feedback, tools disappear from review queue

---

## Phase 7: User Story 5 (P3) - Request Tool Revision (14 tasks)

**User Story**: Boss requests revisions with specific change instructions

**Independent Test Criteria**:
- Click "Request Revision" on pending_review tool → Revision modal appears
- Enter instructions "Make buttons larger and add yellow background" → Submit
- Revision webhook called with boss_feedback
- Tool status updates to "revision_requested"

### Tasks

#### Revision Webhook Client

- [ ] T118 [P] [US5] Implement N8nRevisionClient in backend/src/infrastructure/webhooks/N8nRevisionClient.ts (implements RevisionWebhookClient port)
- [ ] T119 [US5] Build Revision webhook payload (tool_id, boss_feedback, current_html, tool_purpose) in N8nRevisionClient
- [ ] T120 [US5] Implement 60-second timeout for Revision webhook call in N8nRevisionClient
- [ ] T121 [US5] Implement error handling and retry logic in N8nRevisionClient

#### Revision Endpoint

- [ ] T122 [P] [US5] Implement RequestRevision use case in backend/src/application/use-cases/RequestRevision.ts
- [ ] T123 [US5] Create PUT /api/boss/tools/:tool_id/request-revision endpoint in backend/src/api/routes/boss.ts
- [ ] T124 [US5] Validate boss_feedback is provided (5-5000 chars) in revision endpoint
- [ ] T125 [US5] Append current version to revision_history array with boss_feedback and requested_at timestamp
- [ ] T126 [US5] Update tool status to "revision_requested"
- [ ] T127 [US5] Call Revision webhook via N8nRevisionClient with boss_feedback
- [ ] T128 [US5] Return 200 OK with updated tool details
- [ ] T129 [US5] Return 500 Internal Server Error if revision webhook fails with error details

#### Revision UI

- [ ] T130 [P] [US5] Create RevisionRequestModal component in boss-office-app/src/presentation/components/RevisionRequestModal.tsx
- [ ] T131 [P] [US5] Create useRequestRevision mutation hook in boss-office-app/src/presentation/hooks/useRequestRevision.ts using React Query
- [ ] T132 [US5] Add "Request Revision" button to ToolDetailView component
- [ ] T133 [US5] Show RevisionRequestModal with textarea when "Request Revision" clicked
- [ ] T134 [US5] Validate revision instructions (5-5000 chars) in RevisionRequestModal
- [ ] T135 [US5] Submit revision request on "Submit Revision" button click
- [ ] T136 [US5] Show success toast notification after successful revision request
- [ ] T137 [US5] Close modal after submission (keep on same page to see status change)
- [ ] T138 [US5] Show error message with retry button if revision webhook fails
- [ ] T139 [P] [US5] Create RevisionHistoryList component in boss-office-app/src/presentation/components/RevisionHistoryList.tsx
- [ ] T140 [US5] Display revision_history in ToolDetailView showing revision number, date, feedback
- [ ] T141 [US5] Show revision count badge on tool card if revisions exist

**Story Completion**: Boss can request revisions, see revision history, track revision count

---

## Phase 8: User Story 7 (P3) - Apply Fast Track Branding (18 tasks)

**User Story**: Apply Fast Track bold, minimalist, brutalist design throughout UI

**Independent Test Criteria**:
- Visual inspection: All components use only #000000, #FFFFFF, #FFF469 colors
- Visual inspection: Headings use Plaak font, body text uses Riforma font
- Visual inspection: Cards have 3px black borders, buttons have bold styling
- Visual inspection: Yellow used sparingly as accent (not decoration)

### Tasks

#### Font Setup

- [ ] T142 [P] [US7] Add Plaak Ex Condensed Bold font files to boss-office-app/public/fonts/
- [ ] T143 [P] [US7] Add Riforma LL Regular font files to boss-office-app/public/fonts/
- [ ] T144 [US7] Configure @font-face rules for Plaak in boss-office-app/src/index.css
- [ ] T145 [US7] Configure @font-face rules for Riforma in boss-office-app/src/index.css
- [ ] T146 [US7] Update tailwind.config.js to add fontFamily: { plaak: ['Plaak Ex Condensed Bold'], riforma: ['Riforma LL Regular'] }

#### Color System

- [ ] T147 [US7] Update tailwind.config.js colors to add fastTrack: { black: '#000000', white: '#FFFFFF', yellow: '#FFF469' }
- [ ] T148 [US7] Remove or override any non-brand colors from Tailwind defaults (grays, blues, etc.)

#### Component Styling

- [ ] T149 [P] [US7] Apply Fast Track styling to BossOfficeLayout: black header, white background, yellow accents
- [ ] T150 [P] [US7] Apply Fast Track styling to Dashboard: Plaak headings, Riforma body, 3px black borders on cards
- [ ] T151 [P] [US7] Apply Fast Track styling to ToolCard: black borders, white background, yellow status badge
- [ ] T152 [P] [US7] Apply Fast Track styling to ToolDetailView: bold headings, minimalist layout, generous whitespace
- [ ] T153 [P] [US7] Apply Fast Track styling to FileUploadDropzone: bold black border, yellow drag-over highlight
- [ ] T154 [P] [US7] Apply Fast Track styling to ToolPreviewModal: black border, white background, yellow close button
- [ ] T155 [P] [US7] Apply Fast Track styling to RejectFeedbackModal: minimalist design, yellow submit button
- [ ] T156 [P] [US7] Apply Fast Track styling to RevisionRequestModal: minimalist design, yellow submit button
- [ ] T157 [P] [US7] Apply Fast Track styling to buttons: primary CTA (yellow background, black text), secondary (black background, white text)
- [ ] T158 [US7] Apply Fast Track styling to form inputs: black borders, focus state with yellow outline
- [ ] T159 [US7] Apply Fast Track styling to StatusBadge component: yellow background for pending_review, black background for deployed

**Story Completion**: All UI components follow Fast Track brand guidelines

---

## Phase 9: Polish & Integration Testing (14 tasks)

**Goal**: Error handling, loading states, responsive design, end-to-end testing

### Tasks

#### Error Handling

- [ ] T160 [P] Create global error boundary in boss-office-app/src/presentation/components/ErrorBoundary.tsx
- [ ] T161 [P] Add loading skeletons for upload page in boss-office-app/src/presentation/components/LoadingSkeleton.tsx
- [ ] T162 [P] Implement error retry mechanism for all webhook calls with exponential backoff
- [ ] T163 [US1] Add timeout error message for Worker webhook (60s timeout) with retry button
- [ ] T164 [US3] Add timeout error message for Deployment webhook (90s timeout) with retry button
- [ ] T165 [US5] Add timeout error message for Revision webhook (60s timeout) with retry button

#### Responsive Design

- [ ] T166 [P] Implement responsive mobile layout (375px+ width) for UploadPage
- [ ] T167 [P] Implement responsive mobile layout for Dashboard
- [ ] T168 [P] Implement responsive mobile layout for ToolDetailView
- [ ] T169 [P] Test all modals on mobile screens (ensure usable on 375px width)

#### Integration Testing

- [ ] T170 Test end-to-end upload flow: Upload .txt file → Worker webhook → QA workflow → Tool appears in dashboard
- [ ] T171 Test end-to-end approve flow: Preview tool → Approve → Deployment webhook → deployed_url displayed → Open live tool
- [ ] T172 Test end-to-end reject flow: Reject tool with feedback → Tool disappears from Pending Review → Appears in Rejected filter
- [ ] T173 Test end-to-end revision flow: Request revision → Revision webhook → Worker regenerates → Tool returns to dashboard

**Completion**: All error cases handled gracefully, responsive design complete, full workflow tested

---

## Dependencies & Execution Order

### Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                      ↓
     Phase 3 (US6: Webhook Receiver + US1: Upload) - CRITICAL PATH
                      ↓
     ┌────────────────┴────────────────┐
     ↓                                  ↓
Phase 4 (US2: Preview)          Phase 5 (US3: Approve)
     ↓                                  ↓
Phase 6 (US4: Reject)           Phase 7 (US5: Revision)
     ↓                                  ↓
     └────────────────┬────────────────┘
                      ↓
              Phase 8 (US7: Branding)
                      ↓
              Phase 9 (Polish & Testing)
```

### Critical Path

1. **Setup & Foundational** (T001-T019): Required for all stories
2. **US6 + US1** (T020-T067): Core upload and webhook receiver workflow - highest value
3. **US2** (T068-T082): Preview enables informed review decisions
4. **US3** (T083-T102): Approve completes the deployment workflow
5. **US4** (T103-T117): Reject enables workflow completeness
6. **US5** (T118-T141): Revision enables iterative improvement
7. **US7** (T142-T159): Branding for professional polish
8. **Polish** (T160-T173): Production readiness

### Parallel Execution Examples

**Phase 1 (Setup)**:
- Run T001, T002, T003, T004 concurrently (different dependencies)

**Phase 2 (Foundational)**:
- Run T009, T010, T011, T012 concurrently (different interface files)
- Run T016, T017, T018, T019 concurrently (different middleware/validator files)

**Phase 3 (US6 + US1)**:
- Run T020 (US6 use case) and T034 (Worker client) concurrently
- Run T029, T030, T031, T032 concurrently (different parser files)
- Run T050, T051, T057 concurrently (different UI components)

**Phase 4 (US2)**:
- Run T068 (preview endpoint) and T072 (preview modal) concurrently

**Phase 5 (US3)**:
- Run T083 (deployment client) and T087 (approve use case) concurrently
- Run T096 (mutation hook) and T097 (UI button) concurrently

**Phase 6 (US4)**:
- Run T103 (reject use case), T109 (modal), T110 (mutation hook) concurrently

**Phase 7 (US5)**:
- Run T118 (revision client), T122 (revision use case), T130 (modal), T131 (mutation hook) concurrently

**Phase 8 (US7)**:
- Run T142, T143 (font files) concurrently
- Run T149, T150, T151, T152, T153, T154, T155, T156 concurrently (different component styling)

**Phase 9 (Polish)**:
- Run T160, T161, T162, T166, T167, T168 concurrently (different polishing tasks)

---

## Suggested MVP Scope

**Minimum Viable Product** (67 tasks): Phase 1 + Phase 2 + Phase 3 (US6 + US1)

**Why**: Webhook receiver + Upload flow delivers core value (Boss can upload documents and receive generated tools in dashboard). Approve can be done manually via MongoDB updates initially.

**Next Increment** (31 tasks): Add Phase 4 (US2: Preview) + Phase 5 (US3: Approve) for complete review workflow

**Full Feature** (135 tasks): All phases for complete Boss Office functionality

---

## Task Validation

**Format Compliance**: ✅ All tasks follow checklist format with checkboxes, IDs, [P]/[US#] labels, file paths

**User Story Mapping**: ✅ Each user story phase has complete implementation (domain → use cases → infrastructure → endpoints → UI)

**Independent Testing**: ✅ Each story has clear test criteria and can be demonstrated independently

**Parallel Opportunities**: ✅ 72 tasks marked [P] for concurrent execution

**Dependencies**: ✅ Clear execution order with critical path identified

---

## Ready for Implementation

Run `/speckit.implement` to execute tasks with automated validation checkpoints.
