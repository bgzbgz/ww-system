# Data Model: Factory Integration

**Spec**: 007-factory-integration
**Date**: 2026-01-24

---

## Entity Changes

### Job Entity (Extended from Spec 006)

The Job entity from spec 006 is extended with new fields and status values.

#### New Status Value

```typescript
export enum JobStatus {
  DRAFT = 'DRAFT',           // From spec 006: Initial state after upload
  SUBMITTED = 'SUBMITTED',   // From spec 006: Successfully sent to Factory
  PROCESSING = 'PROCESSING', // From spec 006: Factory is processing
  COMPLETED = 'COMPLETED',   // From spec 006: Factory finished
  FAILED = 'FAILED',         // From spec 006: Factory processing failed
  FAILED_SEND = 'FAILED_SEND' // NEW: Submission to Factory failed
}
```

#### New Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| submitted_at | Date | No | null | Timestamp when job was successfully sent to Factory |
| last_attempt_at | Date | No | null | Timestamp of most recent send attempt |
| failure_reason | String | No | null | Error description when status is FAILED_SEND |

#### Updated Interface

```typescript
export interface Job {
  // Existing fields (from spec 006)
  job_id: string;
  original_filename: string;
  file_type: FileType;
  file_size_bytes: number;
  file_storage_key: string;
  created_at: Date;
  status: JobStatus;

  // New fields (spec 007)
  submitted_at?: Date;       // Set when status → SUBMITTED
  last_attempt_at?: Date;    // Set on every submit attempt
  failure_reason?: string;   // Set when status → FAILED_SEND
}
```

#### Updated Mongoose Schema

```typescript
export const JobSchema = {
  // ... existing fields from spec 006

  // New fields (spec 007)
  submitted_at: {
    type: Date,
    required: false,
    default: null
  },
  last_attempt_at: {
    type: Date,
    required: false,
    default: null
  },
  failure_reason: {
    type: String,
    required: false,
    default: null,
    maxlength: 500
  }
};
```

---

## New Entity: Factory Webhook Request

This is a data transfer object (DTO), not persisted.

### Structure

```typescript
export interface FactoryWebhookRequest {
  job_id: string;           // UUID v4 from Job
  original_filename: string; // From Job
  file_type: string;        // PDF | DOCX | TXT | MD
  file_size_bytes: number;  // From Job
  file_content: string;     // Base64-encoded binary
  submitted_at: string;     // ISO 8601 timestamp
}
```

### Validation Rules

| Field | Validation |
|-------|------------|
| job_id | UUID v4 format |
| original_filename | 1-255 characters |
| file_type | One of: PDF, DOCX, TXT, MD |
| file_size_bytes | 1 - 10,485,760 (10MB) |
| file_content | Valid base64 string |
| submitted_at | ISO 8601 format |

---

## State Transitions

### Job Status State Machine

```
                 [Upload]
                    │
                    ▼
                 ┌─────┐
                 │DRAFT│
                 └──┬──┘
                    │
        [Submit to Factory]
                    │
           ┌───────┴───────┐
           │               │
      [200 OK]        [Error/Timeout]
           │               │
           ▼               ▼
     ┌──────────┐   ┌───────────┐
     │SUBMITTED │   │FAILED_SEND│◄──┐
     └────┬─────┘   └─────┬─────┘   │
          │               │         │
          │         [Retry]─────────┘
          │
    [Factory processes]
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌──────┐
│COMPLETED│ │FAILED│
└─────────┘ └──────┘
```

### Valid Transitions (This Spec)

| From | To | Trigger | Fields Updated |
|------|----|---------|----------------|
| DRAFT | SUBMITTED | 200 OK response | status, submitted_at, last_attempt_at |
| DRAFT | FAILED_SEND | Error/timeout | status, last_attempt_at, failure_reason |
| FAILED_SEND | SUBMITTED | Retry + 200 OK | status, submitted_at, last_attempt_at, failure_reason=null |
| FAILED_SEND | FAILED_SEND | Retry + Error | last_attempt_at, failure_reason |

### Invalid Transitions (Blocked)

- SUBMITTED → DRAFT (Cannot un-submit)
- SUBMITTED → FAILED_SEND (Use FAILED for Factory errors)
- COMPLETED → any (Terminal state)
- FAILED → any (Terminal state)

---

## API Response Extensions

### Job Response (Extended)

```typescript
export interface JobResponse {
  // Existing fields
  job_id: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  status: string;

  // New fields (optional in response)
  submitted_at?: string;      // ISO 8601 if submitted
  last_attempt_at?: string;   // ISO 8601 if attempted
  failure_reason?: string;    // Present if FAILED_SEND
}
```

---

## Database Indexes (New)

| Index | Fields | Purpose |
|-------|--------|---------|
| status_idx | status | Filter by status (DRAFT, FAILED_SEND for retry) |
| last_attempt_idx | last_attempt_at | Sort failed jobs by recency |

---

## Error Messages Mapping

| Condition | failure_reason Value |
|-----------|---------------------|
| Non-200 HTTP response | "Factory rejected: {status_code}" |
| Request timeout | "Request timeout after 30s" |
| Invalid response body | "Invalid Factory response" |
| Network error | "Network error: {message}" |
| File not found | "Stored file not found" |

---

## Compatibility Notes

- All new fields are optional (nullable)
- Existing Jobs from spec 006 remain valid
- No migration needed (new fields default to null)
- Frontend gracefully handles missing fields
