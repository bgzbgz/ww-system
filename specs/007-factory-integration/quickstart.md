# Quickstart: Factory Integration

**Spec**: 007-factory-integration
**Estimated Effort**: 3-4 hours

---

## Overview

This feature adds the ability to submit uploaded jobs to the Factory webhook. The Boss can submit DRAFT jobs to Factory, see the submission status, and retry failed submissions.

---

## Prerequisites

| Dependency | Spec | Status |
|------------|------|--------|
| Job model with DRAFT status | spec-006 | ✓ Implemented |
| File storage service | spec-006 | ✓ Implemented |
| Fast Track CSS | spec-005 | ✓ Implemented |
| Jobs API routes | spec-006 | ✓ Implemented |

---

## Implementation Steps

### Step 1: Extend Job Model (Backend)

**File**: `backend/src/models/job.ts`

Add FAILED_SEND to JobStatus enum:
```typescript
export enum JobStatus {
  // ... existing
  FAILED_SEND = 'FAILED_SEND'
}
```

Add new fields to Job interface:
```typescript
submitted_at?: Date;
last_attempt_at?: Date;
failure_reason?: string;
```

---

### Step 2: Create Factory Service (Backend)

**File**: `backend/src/services/factory.ts`

```typescript
// LOCKED: Canonical Factory webhook URL
export const FACTORY_WEBHOOK_URL =
  'https://n8n-edge.fasttrack-diagnostic.com/webhook/b17aa9c0-88cb-48fe-a0f2-43096c382dea';

export async function submitJobToFactory(job: Job): Promise<SubmitResult>;
```

Key logic:
1. Retrieve file from storage
2. Encode file as base64
3. Build webhook payload
4. POST to Factory with 30s timeout
5. Return success/failure result

---

### Step 3: Add Submit Route (Backend)

**File**: `backend/src/routes/jobs.ts`

Add endpoint:
```typescript
POST /api/boss/jobs/:jobId/submit
```

Logic:
1. Find job by ID
2. Validate status (DRAFT or FAILED_SEND)
3. Call factory.submitJobToFactory()
4. Update job status based on result
5. Return response

---

### Step 4: Create Submit API Client (Frontend)

**File**: `src/api/factory.ts`

```typescript
export async function submitJob(jobId: string): Promise<SubmitResponse>;
```

---

### Step 5: Add Job Status Display (Frontend)

**File**: `src/components/jobs/job-status.html`

Show status badges:
- DRAFT: "DRAFT" badge + "Submit to Factory" button
- SUBMITTED: "SUBMITTED" badge (success)
- FAILED_SEND: "FAILED" badge + error + "Retry" button

---

### Step 6: Add Submit Button Handler (Frontend)

**File**: `src/lib/jobs/submit.ts`

```typescript
export async function handleSubmit(jobId: string): Promise<void>;
export async function handleRetry(jobId: string): Promise<void>;
```

Both use same API endpoint, different UI feedback.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/models/job.ts` | MODIFY | Add FAILED_SEND, new fields |
| `backend/src/services/factory.ts` | CREATE | Factory webhook client |
| `backend/src/routes/jobs.ts` | MODIFY | Add submit endpoint |
| `src/api/factory.ts` | CREATE | Frontend API client |
| `src/components/jobs/job-status.html` | CREATE | Status display component |
| `src/styles/components/_job-status.css` | CREATE | Status badge styles |
| `src/lib/jobs/submit.ts` | CREATE | Submit handler logic |

---

## Testing Checklist

### Backend Tests
- [ ] Submit DRAFT job → status becomes SUBMITTED
- [ ] Submit already SUBMITTED job → 400 error
- [ ] Factory returns 500 → status becomes FAILED_SEND
- [ ] Request times out → status becomes FAILED_SEND
- [ ] Retry FAILED_SEND → status becomes SUBMITTED

### Frontend Tests
- [ ] DRAFT job shows "Submit to Factory" button
- [ ] SUBMITTED job shows "SUBMITTED" badge, no button
- [ ] FAILED_SEND job shows error + "Retry" button
- [ ] Submit shows loading state
- [ ] Success shows "Job sent to Factory" message
- [ ] Failure shows appropriate error message

### Integration Tests
- [ ] End-to-end submit flow
- [ ] End-to-end retry flow
- [ ] Timeout handling (mock slow response)

---

## Error Messages Reference

| Code | Message |
|------|---------|
| FACTORY_ERROR | "Factory rejected the job. Try again." |
| TIMEOUT | "Unable to reach Factory. Check your connection." |
| INVALID_RESPONSE | "Factory response invalid. Try again." |
| FILE_NOT_FOUND | "File not found. Re-upload the document." |
| NETWORK_ERROR | "Unable to reach Factory. Check your connection." |
| ALREADY_SUBMITTED | "Job already sent to Factory." |

---

## Brand Compliance

- Status badges use Fast Track brand colors
- FAILED_SEND uses yellow (ft-color-yellow), NOT red
- All buttons follow ft-button styles
- No rounded corners (border-radius: 0)
- Error messages follow Fast Track DNA (short, direct)

---

## Webhook Payload Example

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "original_filename": "market-analysis.pdf",
  "file_type": "PDF",
  "file_size_bytes": 2457600,
  "file_content": "JVBERi0xLjQKJeLjz9MK...",
  "submitted_at": "2026-01-24T10:30:00.000Z"
}
```

---

## Next Step

Run `/speckit.tasks` to generate detailed implementation tasks.
