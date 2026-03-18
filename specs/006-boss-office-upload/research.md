# Research: Boss Office Upload Command

**Spec**: 006-boss-office-upload
**Date**: 2026-01-24
**Purpose**: Resolve technical unknowns and document design decisions

---

## Technical Context Resolution

### Language/Version

**Decision**: TypeScript 5.x / HTML5 / CSS3
**Rationale**: Aligns with existing Boss Office implementation (spec-001, spec-004). TypeScript provides type safety for file handling and validation logic.
**Alternatives**: Vanilla JavaScript rejected (no type safety for complex validation).

### Primary Dependencies

**Decision**:
- Frontend: HTML5 File API, Drag and Drop API
- Existing: Fast Track CSS Design System (spec-005)
- Storage: Browser FileReader API for client-side validation

**Rationale**: Native browser APIs provide robust file handling without external dependencies. Brand CSS system already implemented.
**Alternatives**: Third-party libraries (react-dropzone, Dropzone.js) rejected - unnecessary complexity for simple single-file upload.

### Storage Solution

**Decision**:
- Job metadata: MongoDB (existing `fast_track_tools.jobs` collection)
- File binary: Local filesystem or cloud storage (Azure Blob / AWS S3) via backend API

**Rationale**: MongoDB for structured metadata aligns with existing architecture. Binary storage separate from metadata for scalability.
**Alternatives**: Base64 in MongoDB rejected (inefficient for 10MB files).

### Testing Approach

**Decision**:
- Unit: Jest for validation logic
- Integration: Backend API tests
- E2E: Manual browser testing with various file types

**Rationale**: Validation logic is critical - unit tests ensure file type/size checks work correctly.
**Alternatives**: Playwright E2E rejected for this phase (overkill for upload component).

### Target Platform

**Decision**: Desktop browser (Chrome, Firefox, Edge, Safari)
**Rationale**: Boss Office is desktop-first per spec-001 assumptions.
**Alternatives**: Mobile support out of scope per spec.

---

## File Handling Research

### Supported MIME Types

| Extension | MIME Type | Validation |
|-----------|-----------|------------|
| .pdf | application/pdf | Extension + MIME |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | Extension + MIME |
| .txt | text/plain | Extension + MIME |
| .md | text/markdown, text/plain | Extension only (MIME varies) |

**Decision**: Primary validation by file extension (case-insensitive). MIME type as secondary check where reliable.
**Rationale**: MIME types for .md files are inconsistent across browsers. Extension validation is more reliable.

### File Size Handling

**Decision**: Client-side validation using `File.size` property before upload.
**Rationale**: Prevents unnecessary network transfer for oversized files. Immediate feedback per SC-003/SC-004.

**Validation Logic**:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const isValidSize = (file: File) => file.size > 0 && file.size <= MAX_FILE_SIZE;
```

### Drag and Drop Best Practices

**Decision**: Use HTML5 Drag and Drop API with these event handlers:
- `dragenter`: Show highlight
- `dragover`: Prevent default (required for drop)
- `dragleave`: Remove highlight
- `drop`: Process file

**Rationale**: Native API provides all needed functionality. Yellow highlight per brand guidelines.

---

## Job Entity Design

### UUID Generation

**Decision**: Use `crypto.randomUUID()` for job_id generation.
**Rationale**: Native browser API, no dependencies, generates RFC 4122 compliant UUIDs.
**Alternatives**: nanoid considered but UUID is simpler for this use case.

### Job Status Enum

**Decision**: Define enum with five states:
```typescript
enum JobStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
```

**Rationale**: Matches spec requirements. DRAFT is initial state for this spec; other states handled by downstream specs.

---

## Error Message Design

### Fast Track Brand Alignment

Per constitution section 3 (Fast Track DNA):
- "Brutally honest"
- "Short sentences"
- "Active voice"
- "No hedging"

**Decision**: Error messages must be:
1. Direct and actionable
2. Maximum 10 words
3. Tell user exactly what to do

**Error Messages**:
| Condition | Message |
|-----------|---------|
| Wrong file type | "Wrong file type. Use PDF, DOCX, TXT, or MD." |
| File too large | "File too large. Split it." |
| Empty file | "File is empty. Upload a document with content." |
| Multiple files | "One file at a time. Drop a single file." |
| Network error | "Upload failed. Check connection and try again." |
| Storage error | "Storage unavailable. Try again later." |

---

## Integration Points

### Backend API Contract

**Decision**: POST `/api/boss/jobs` for job creation with multipart/form-data.
**Rationale**: RESTful convention. Multipart allows file + metadata in single request.

### Existing Brand CSS

**Decision**: Use existing Fast Track CSS classes from spec-005:
- `.ft-card` for dropzone container
- `.ft-button--primary` for upload button
- `.ft-error` for error feedback
- `.ft-success` for success state
- `.ft-badge` for file type display

**Rationale**: Brand compliance already solved. Reuse existing components.

---

## Constraints Validation

### Constitution Compliance Check

| Law | Compliance |
|-----|------------|
| LAW I - Decision Is Product | N/A - This is infrastructure, not a tool |
| LAW II - Spec Is Source of Truth | PASS - Implementing from spec.md |
| LAW III - Contracts Over Interpretation | PASS - All behaviors specified in contracts |
| LAW IV - Human Authority Is Final | PASS - Boss initiates upload action |

**Note**: Upload Command is supporting infrastructure for the tool generation pipeline, not a decision-forcing tool itself. Constitutional tool requirements apply to generated tools, not admin components.

---

## Performance Targets

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| File validation | < 500ms | Client-side, no network |
| Job creation | < 3 seconds | Includes file upload |
| File size handling | Up to 10MB | No timeout/memory errors |

---

## Summary

All technical unknowns resolved. Implementation can proceed with:
- TypeScript for validation logic
- HTML5 native APIs for drag-and-drop
- Existing Fast Track CSS for styling
- MongoDB for job metadata
- Backend file storage service for binaries
