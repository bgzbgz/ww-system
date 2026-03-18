# Research: Factory Integration

**Spec**: 007-factory-integration
**Date**: 2026-01-24

---

## Research Questions

### Q1: How should the webhook payload be structured?

**Decision**: JSON payload with base64-encoded file content

**Rationale**:
- n8n webhook accepts JSON payloads natively
- Base64 encoding allows binary file transmission over JSON
- Standard approach for webhook file payloads
- Preserves file integrity across HTTP

**Alternatives Considered**:
- Multipart form-data: More complex parsing on n8n side
- URL to file: Requires external file hosting and additional request from n8n
- Binary body: Not standard for webhook payloads

**Payload Structure**:
```json
{
  "job_id": "uuid-v4",
  "original_filename": "document.pdf",
  "file_type": "PDF",
  "file_size_bytes": 1234567,
  "file_content": "base64-encoded-binary",
  "submitted_at": "2026-01-24T10:30:00.000Z"
}
```

---

### Q2: What HTTP client approach for webhook calls?

**Decision**: Native fetch API with timeout using AbortController

**Rationale**:
- Built into modern Node.js (18+) and browsers
- No additional dependencies
- AbortController provides proper timeout handling
- Simpler than axios for single-endpoint use case

**Alternatives Considered**:
- axios: Additional dependency for simple use case
- node-fetch: Polyfill not needed in Node 18+
- http/https modules: More verbose, no timeout helper

**Implementation Pattern**:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(FACTORY_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal
  });
  clearTimeout(timeout);
  // handle response
} catch (error) {
  clearTimeout(timeout);
  // handle error
}
```

---

### Q3: How should FAILED_SEND status be added to Job model?

**Decision**: Extend existing JobStatus enum with FAILED_SEND

**Rationale**:
- Minimal change to existing model (spec 006)
- Clear distinction from FAILED (which means Factory processing failed)
- Easy to query for retry candidates

**Implementation**:
```typescript
export enum JobStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  FAILED_SEND = 'FAILED_SEND'  // NEW: Submission to Factory failed
}
```

**New Job Fields**:
```typescript
interface Job {
  // ... existing fields
  submitted_at?: Date;        // When successfully sent to Factory
  last_attempt_at?: Date;     // When last send was attempted
  failure_reason?: string;    // Error description for FAILED_SEND
}
```

---

### Q4: Where should webhook URL be stored?

**Decision**: Hardcoded constant in factory.ts service

**Rationale**:
- URL is LOCKED per spec (spec change required to modify)
- Environment variable adds unnecessary configuration
- Single source of truth in code
- Clear code audit trail

**Against Environment Variable**:
- Spec explicitly says "not a config tweak"
- Risks accidental change
- Reduces visibility of canonical URL

**Implementation**:
```typescript
// backend/src/services/factory.ts

/**
 * LOCKED: Canonical Factory webhook URL
 * Per spec 007: "If this webhook ever changes, it is a spec change, not a config tweak"
 */
export const FACTORY_WEBHOOK_URL =
  'https://n8n-edge.fasttrack-diagnostic.com/webhook/b17aa9c0-88cb-48fe-a0f2-43096c382dea';
```

---

### Q5: What error messages should be displayed?

**Decision**: Per Fast Track DNA - short, direct, actionable

**Error Messages** (following spec 006 pattern):
| Condition | Message |
|-----------|---------|
| Non-200 response | "Factory rejected the job. Try again." |
| Timeout | "Unable to reach Factory. Check your connection." |
| Invalid response | "Factory response invalid. Try again." |
| Already submitted | "Job already sent to Factory." |
| File missing | "File not found. Re-upload the document." |
| Network error | "Unable to reach Factory. Check your connection." |

**Success Message**:
- "Job sent to Factory"

---

### Q6: How should retry be implemented?

**Decision**: Manual retry via dedicated button and API endpoint

**Rationale**:
- Spec explicitly says "no automatic retry"
- Boss must manually trigger retry
- Clear user control over when to retry
- Simple implementation (reuse submit logic)

**API Design**:
- POST /api/boss/jobs/:jobId/submit - Works for both initial submit and retry
- Endpoint checks current status (must be DRAFT or FAILED_SEND)
- Reuses same webhook submission logic

**UI Flow**:
1. Job in FAILED_SEND state shows "Retry" button
2. Click triggers same submit flow
3. On success: status → SUBMITTED
4. On failure: status stays FAILED_SEND, error updated

---

### Q7: How should the file content be retrieved for submission?

**Decision**: Use existing storage service from spec 006

**Rationale**:
- storage.ts already has retrieveFile(storageKey) function
- Returns Buffer, easy to convert to base64
- Consistent with existing architecture

**Implementation**:
```typescript
import { retrieveFile } from './storage';

async function getFileContent(job: Job): Promise<string> {
  const buffer = await retrieveFile(job.file_storage_key);
  return buffer.toString('base64');
}
```

---

## Technical Decisions Summary

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Payload format | JSON with base64 file | Standard webhook pattern |
| HTTP client | Native fetch + AbortController | No dependencies, proper timeout |
| Status enum | Add FAILED_SEND | Clear distinction from FAILED |
| Webhook URL | Hardcoded constant | LOCKED per spec |
| Error messages | Fast Track DNA style | Consistent UX |
| Retry | Manual button + same endpoint | Per spec requirement |
| File retrieval | Use existing storage service | Code reuse |

---

## Dependencies Confirmed

| Dependency | Source | Status |
|------------|--------|--------|
| Job model | spec 006 | Implemented |
| Storage service | spec 006 | Implemented |
| Fast Track CSS | spec 005 | Implemented |
| MongoDB | spec 001 | Assumed |

---

## Next Step

Proceed to Phase 1: data-model.md, contracts/, quickstart.md
