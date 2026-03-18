# Feature Specification: Factory Integration - Send Jobs to Webhook

**Feature Branch**: `007-factory-integration`
**Created**: 2026-01-24
**Status**: Draft
**Input**: User description: "Factory Integration - Boss Office sends jobs to canonical Factory webhook"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Job to Factory (Priority: P1)

As the Boss, I want to submit a DRAFT job to the Factory, so that the tool generation process begins.

**Why this priority**: This is the core functionality. Without the ability to send jobs to the Factory, uploaded documents cannot be processed.

**Independent Test**: Can be fully tested by creating a Job in DRAFT state, clicking "Submit to Factory", and verifying the job status changes and the Factory webhook receives the request.

**Acceptance Scenarios**:

1. **Given** Boss has a Job in DRAFT status, **When** Boss clicks "Submit to Factory", **Then** the system sends the job to the Factory webhook
2. **Given** Boss submits a job, **When** the Factory responds with 200 OK, **Then** the Job status changes to SUBMITTED
3. **Given** Boss submits a job, **When** submission succeeds, **Then** Boss sees success message "Job sent to Factory"
4. **Given** Boss submits a job, **When** the submission is in progress, **Then** Boss sees a loading indicator and the submit button is disabled

---

### User Story 2 - Handle Factory Submission Failure (Priority: P1)

As the Boss, I want to see a clear error and retry option when Factory submission fails, so that I can recover from network or service issues.

**Why this priority**: Failure handling is essential for reliability. Without it, failed jobs would be stuck with no recovery path.

**Independent Test**: Can be fully tested by simulating a network timeout or Factory error, verifying the job status shows FAILED_SEND, and confirming the retry button is available.

**Acceptance Scenarios**:

1. **Given** Boss submits a job, **When** the Factory responds with non-200 status, **Then** the Job status changes to FAILED_SEND
2. **Given** Boss submits a job, **When** the request times out (30 seconds), **Then** the Job status changes to FAILED_SEND
3. **Given** Boss submits a job, **When** the Factory returns invalid response body, **Then** the Job status changes to FAILED_SEND
4. **Given** a job has status FAILED_SEND, **When** Boss views the job, **Then** Boss sees error message and a "Retry" button
5. **Given** a job has status FAILED_SEND, **When** Boss clicks "Retry", **Then** the system attempts to send the job again

---

### User Story 3 - View Submission Status (Priority: P2)

As the Boss, I want to see the current status of my jobs, so that I know which have been sent and which failed.

**Why this priority**: Status visibility provides essential feedback but is secondary to the core send/retry functionality.

**Independent Test**: Can be fully tested by viewing a job list with jobs in various states (DRAFT, SUBMITTED, FAILED_SEND) and confirming each displays the correct status badge.

**Acceptance Scenarios**:

1. **Given** Boss views a job in DRAFT status, **When** the job detail loads, **Then** Boss sees status badge "DRAFT" and "Submit to Factory" button
2. **Given** Boss views a job in SUBMITTED status, **When** the job detail loads, **Then** Boss sees status badge "SUBMITTED" and no submit button
3. **Given** Boss views a job in FAILED_SEND status, **When** the job detail loads, **Then** Boss sees status badge "FAILED" (red/yellow per brand), error message, and "Retry" button

---

### Edge Cases

- What happens when Boss attempts to submit a job that is already SUBMITTED? System shows "Job already sent to Factory" and disables submit button.
- What happens when Boss attempts to submit while already submitting? System ignores duplicate clicks (submit button disabled during request).
- What happens when network is completely unavailable? System shows "Unable to reach Factory. Check your connection." after timeout.
- What happens if the stored file is missing when submitting? System shows "File not found. Re-upload the document." and does not attempt to send.
- What happens when multiple jobs are submitted rapidly? Each submission is processed independently; no batching.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST send all jobs to the canonical Factory webhook URL: `https://n8n-edge.fasttrack-diagnostic.com/webhook/b17aa9c0-88cb-48fe-a0f2-43096c382dea`
- **FR-002**: System MUST NOT route to any other webhook endpoint or department-specific URLs
- **FR-003**: System MUST provide a "Submit to Factory" action for jobs in DRAFT status
- **FR-004**: System MUST change Job status to SUBMITTED when Factory responds with 200 OK
- **FR-005**: System MUST change Job status to FAILED_SEND when Factory responds with non-200 status
- **FR-006**: System MUST change Job status to FAILED_SEND when request times out (30 second timeout)
- **FR-007**: System MUST change Job status to FAILED_SEND when Factory returns invalid response body
- **FR-008**: System MUST provide a "Retry" action for jobs in FAILED_SEND status
- **FR-009**: System MUST display the current status of each job (DRAFT, SUBMITTED, FAILED_SEND)
- **FR-010**: System MUST show success feedback "Job sent to Factory" on successful submission
- **FR-011**: System MUST show loading indicator during submission
- **FR-012**: System MUST disable submit button during active submission to prevent duplicates
- **FR-013**: System MUST include job metadata in the Factory request (job_id, original_filename, file_type)
- **FR-014**: System MUST include the stored file content in the Factory request
- **FR-015**: System MUST store the timestamp of last submission attempt on the Job entity

### Key Entities

- **Job** (extended from spec 006): Adds status values FAILED_SEND. New attributes: submitted_at (timestamp, when successfully sent to Factory), last_attempt_at (timestamp, when last send was attempted), failure_reason (string, error description for FAILED_SEND status).

- **Factory Webhook Request**: The payload sent to the Factory. Key attributes: job_id (UUID), original_filename (string), file_type (enum: PDF, DOCX, TXT, MD), file_content (base64-encoded binary), submitted_at (ISO timestamp).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Boss can submit a DRAFT job to Factory and see SUBMITTED status within 5 seconds (excluding network latency)
- **SC-002**: Failed submissions show FAILED_SEND status and error message within 35 seconds (including 30s timeout)
- **SC-003**: Retry functionality allows Boss to re-attempt failed submissions
- **SC-004**: 100% of submissions go to the canonical Factory webhook (no routing to other endpoints)
- **SC-005**: Job status is always accurate and reflects the true state of the submission
- **SC-006**: Boss can distinguish between DRAFT, SUBMITTED, and FAILED_SEND jobs at a glance
- **SC-007**: All UI follows Fast Track brand guidelines (colors, typography, no rounded corners)

## Assumptions and Constraints

### Assumptions

- Job entity exists from spec 006 (Upload Command) with DRAFT status
- Stored file binary is available via file_storage_key from spec 006
- Factory webhook endpoint is stable and available
- Fast Track brand CSS system (spec 005) is implemented
- Boss is authenticated before accessing job submission

### Constraints

- **LOCKED**: Factory webhook URL is canonical and must not be changed without a spec change
- Single webhook endpoint only; no routing logic in Boss Office
- 30 second timeout for Factory requests
- No batching; each job submitted individually
- Factory internal routing/orchestration is out of scope (happens inside n8n)

## Out of Scope

- Factory-side processing logic (handled by n8n internally)
- Department-specific routing (all handled behind the canonical webhook)
- Webhook URL changes (requires spec change, not config)
- Job status updates from Factory (covered in separate completion spec)
- Real-time progress updates during Factory processing
- Batch submission of multiple jobs
- Automatic retry (Boss must manually trigger retry)
