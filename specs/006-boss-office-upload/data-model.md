# Data Model: Boss Office Upload Command

**Spec**: 006-boss-office-upload
**Date**: 2026-01-24

---

## Entities

### Job

Primary entity representing a document upload that will be processed by Factory.

```typescript
interface Job {
  // Identity
  job_id: string;           // UUID v4, e.g., "550e8400-e29b-41d4-a716-446655440000"

  // File metadata
  original_filename: string; // Original name, e.g., "market-analysis.pdf"
  file_type: FileType;       // PDF, DOCX, TXT, MD
  file_size_bytes: number;   // Size in bytes

  // Storage reference
  file_storage_key: string;  // Reference to StoredFile

  // Timestamps
  created_at: Date;          // ISO 8601 timestamp

  // Status
  status: JobStatus;         // DRAFT on creation
}
```

#### Field Constraints

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| job_id | string | Yes | UUID v4 format |
| original_filename | string | Yes | Max 255 chars, sanitized |
| file_type | enum | Yes | PDF, DOCX, TXT, MD only |
| file_size_bytes | number | Yes | 1 to 10,485,760 (10MB) |
| file_storage_key | string | Yes | Valid storage reference |
| created_at | Date | Yes | ISO 8601 format |
| status | enum | Yes | DRAFT on creation |

---

### StoredFile

Represents the binary file in storage.

```typescript
interface StoredFile {
  // Identity
  storage_key: string;       // Unique storage identifier
  job_id: string;            // Reference to Job

  // File properties
  content_type: string;      // MIME type
  size_bytes: number;        // File size
  original_filename: string; // Original name for retrieval

  // Timestamps
  uploaded_at: Date;         // When stored
}
```

#### Field Constraints

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| storage_key | string | Yes | Unique identifier |
| job_id | string | Yes | Valid Job reference |
| content_type | string | Yes | Valid MIME type |
| size_bytes | number | Yes | Matches Job.file_size_bytes |
| original_filename | string | Yes | Sanitized for storage |
| uploaded_at | Date | Yes | ISO 8601 format |

---

## Enums

### FileType

```typescript
enum FileType {
  PDF = 'PDF',
  DOCX = 'DOCX',
  TXT = 'TXT',
  MD = 'MD'
}
```

#### Mapping

| FileType | Extensions | MIME Types |
|----------|------------|------------|
| PDF | .pdf | application/pdf |
| DOCX | .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| TXT | .txt | text/plain |
| MD | .md | text/markdown, text/plain |

---

### JobStatus

```typescript
enum JobStatus {
  DRAFT = 'DRAFT',           // Initial state after upload
  SUBMITTED = 'SUBMITTED',   // Sent to Factory (future spec)
  PROCESSING = 'PROCESSING', // Factory working (future spec)
  COMPLETED = 'COMPLETED',   // Factory done (future spec)
  FAILED = 'FAILED'          // Processing failed (future spec)
}
```

**Note**: This spec only creates jobs in DRAFT status. Other statuses handled by downstream specs.

---

## Relationships

```
┌─────────────┐         1:1         ┌─────────────┐
│    Job      │ ─────────────────── │ StoredFile  │
└─────────────┘                     └─────────────┘
     │                                     │
     │ job_id (PK)                         │ storage_key (PK)
     │ file_storage_key (FK) ──────────────│ job_id (FK)
     │                                     │
```

---

## MongoDB Schema

### Collection: `jobs`

```javascript
{
  _id: ObjectId,
  job_id: String,           // Indexed, unique
  original_filename: String,
  file_type: String,        // "PDF" | "DOCX" | "TXT" | "MD"
  file_size_bytes: Number,
  file_storage_key: String,
  created_at: Date,
  status: String            // "DRAFT" | "SUBMITTED" | "PROCESSING" | "COMPLETED" | "FAILED"
}
```

**Indexes**:
- `job_id`: unique index
- `status`: for filtering
- `created_at`: for sorting

---

## Validation Rules

### File Validation (Client-Side)

```typescript
interface FileValidationResult {
  valid: boolean;
  error?: string;
}

function validateFile(file: File): FileValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check file size (not empty)
  if (file.size === 0) {
    return { valid: false, error: 'File is empty. Upload a document with content.' };
  }

  // Check file size (not too large)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large. Split it.' };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['pdf', 'docx', 'txt', 'md'];
  if (!extension || !validExtensions.includes(extension)) {
    return { valid: false, error: 'Wrong file type. Use PDF, DOCX, TXT, or MD.' };
  }

  return { valid: true };
}
```

### Filename Sanitization

```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')  // Remove invalid chars
    .replace(/\.+$/, '')                       // Remove trailing dots
    .substring(0, 255);                        // Max length
}
```

---

## State Transitions

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    │   [Upload Spec Scope - This Spec]       │
                    │                                         │
    ┌───────────┐   │                                         │
    │  (start)  │───┼──► DRAFT                                │
    └───────────┘   │       │                                 │
                    │       │                                 │
                    └───────┼─────────────────────────────────┘
                            │
                            │ (future specs)
                            ▼
                      ┌───────────┐
                      │ SUBMITTED │
                      └─────┬─────┘
                            │
                            ▼
                      ┌────────────┐
                      │ PROCESSING │
                      └──────┬─────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼
         ┌───────────┐ ┌───────────┐
         │ COMPLETED │ │  FAILED   │
         └───────────┘ └───────────┘
```

---

## Display Formatting

### File Size Formatting

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### File Type Badge

| FileType | Badge Class | Display |
|----------|-------------|---------|
| PDF | `.ft-badge` | "PDF" |
| DOCX | `.ft-badge` | "DOCX" |
| TXT | `.ft-badge` | "TXT" |
| MD | `.ft-badge` | "MD" |
