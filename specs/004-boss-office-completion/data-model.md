# Data Model: Boss Office Phase Completion

**Date**: 2026-01-22
**Feature**: Boss Office Phase Completion
**Purpose**: Define entities, value objects, and relationships for file upload, preview, review workflow

---

## Domain Entities

### Tool (Aggregate Root - Extended)

**Description**: Generated HTML tool with source document, compliance scores, and deployment status. Primary aggregate in the Boss Office domain.

**TypeScript Interface**:

```typescript
export interface Tool {
  tool_id: string;                          // Unique identifier (e.g., "tool_001")
  source_document: SourceDocument;          // NEW: File metadata (value object)
  tool_purpose: string;                     // What the tool does (e.g., "Budget Calculator")
  client_name: string;                      // Who it's for (e.g., "Acme Corp")
  document_type: DocumentType;              // NEW: File type enum
  generated_html: string;                   // Generated tool HTML (single-file)
  generated_timestamp: Date;                // When AI created it
  status: ToolStatus;                       // pending_review | approved | rejected | deployed | revision_requested
  qa_score: number;                         // 0-100 compliance score
  qa_feedback: string;                      // QA department comments
  qa_timestamp: Date;                       // When QA scored it
  boss_review_status: BossReviewStatus | null;  // approved | rejected | null
  boss_feedback: string | null;             // Boss's comments (for reject/revision)
  boss_reviewed_at: Date | null;            // When Boss reviewed
  deployed_url: string | null;              // Live tool URL (e.g., https://tools.fasttrack.com/knowthyself)
  deployed_at: Date | null;                 // Deployment timestamp
  github_commit_sha: string | null;         // Git commit hash
  revision_history: Revision[];             // Array of previous versions
}
```

**MongoDB Schema** (fast_track_tools.tools collection):

```typescript
{
  _id: ObjectId,
  tool_id: string (unique index),
  source_document: {
    file_path: string,
    file_type: 'txt' | 'md' | 'pdf' | 'docx',
    file_size: number,
    uploaded_at: ISODate,
    extracted_text: string
  },
  tool_purpose: string,
  client_name: string,
  document_type: 'txt' | 'md' | 'pdf' | 'docx',
  generated_html: string,
  generated_timestamp: ISODate,
  status: string (index on status + generated_timestamp),
  qa_score: number,
  qa_feedback: string,
  qa_timestamp: ISODate,
  boss_review_status: string | null,
  boss_feedback: string | null,
  boss_reviewed_at: ISODate | null,
  deployed_url: string | null,
  deployed_at: ISODate | null,
  github_commit_sha: string | null,
  revision_history: [
    {
      revision_number: number,
      revised_html: string,
      revised_at: ISODate,
      revision_reason: string
    }
  ]
}
```

**Invariants**:
- `tool_id` MUST be unique (enforced by MongoDB unique index)
- `status` transitions follow state machine rules (see State Transitions section)
- `deployed_url` MUST be non-null if status is 'deployed'
- `boss_feedback` MUST be non-null if boss_review_status is 'rejected' or status is 'revision_requested'

**Business Rules**:
1. Tool can only be approved if status is 'pending_review'
2. Tool can only be rejected if status is 'pending_review'
3. Tool can only request revision if status is 'pending_review'
4. Once status is 'deployed', it cannot be changed (immutable)
5. boss_reviewed_at timestamp MUST be set when boss_review_status changes

---

## Value Objects

### SourceDocument (NEW)

**Description**: Metadata about uploaded source document file. Immutable once created.

**TypeScript Interface**:

```typescript
export interface SourceDocument {
  file_path: string;        // Path to uploaded file (e.g., "uploads/1234567890-abcdef12-knowthyself.docx")
  file_type: DocumentType;  // txt | md | pdf | docx
  file_size: number;        // File size in bytes
  uploaded_at: Date;        // Upload timestamp
  extracted_text: string;   // Parsed text content (all formats converted to plain text)
}
```

**Validation Rules**:
- `file_path` MUST be absolute path within uploads/ directory
- `file_size` MUST be ≤ 10MB (10,485,760 bytes)
- `file_type` MUST match file extension
- `extracted_text` MUST be non-empty (if empty, file parsing failed)

**Factory Method**:

```typescript
export function createSourceDocument(
  filePath: string,
  fileType: DocumentType,
  fileSize: number,
  extractedText: string
): SourceDocument {
  if (fileSize > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit');
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('Extracted text is empty - file parsing may have failed');
  }

  return {
    file_path: filePath,
    file_type: fileType,
    file_size: fileSize,
    uploaded_at: new Date(),
    extracted_text: extractedText
  };
}
```

---

### ToolStatus (Existing - Extended)

**Description**: Tool lifecycle state.

**TypeScript Enum**:

```typescript
export enum ToolStatus {
  PendingReview = 'pending_review',    // QA-approved, awaiting Boss review
  Approved = 'approved',                // Boss approved, ready for deployment
  Rejected = 'rejected',                // Boss rejected, terminal state
  Deployed = 'deployed',                // Deployed to production, terminal state
  RevisionRequested = 'revision_requested'  // NEW: Boss requested changes
}
```

**State Transitions** (see State Machine section below)

---

### BossReviewStatus

**Description**: Boss's decision on a tool.

**TypeScript Enum**:

```typescript
export enum BossReviewStatus {
  Approved = 'approved',   // Boss approved for deployment
  Rejected = 'rejected'    // Boss rejected
}
```

---

### DocumentType

**Description**: Supported source document file types.

**TypeScript Enum**:

```typescript
export enum DocumentType {
  Txt = 'txt',
  Markdown = 'md',
  Pdf = 'pdf',
  Docx = 'docx'
}
```

**MIME Type Mapping**:

```typescript
export const DOCUMENT_MIME_TYPES: Record<DocumentType, string[]> = {
  [DocumentType.Txt]: ['text/plain'],
  [DocumentType.Markdown]: ['text/markdown', 'text/x-markdown'],
  [DocumentType.Pdf]: ['application/pdf'],
  [DocumentType.Docx]: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};
```

---

### Revision

**Description**: Historical record of tool revisions.

**TypeScript Interface**:

```typescript
export interface Revision {
  revision_number: number;    // Sequential revision number (1, 2, 3...)
  revised_html: string;       // HTML after revision
  revised_at: Date;           // When revision was made
  revision_reason: string;    // Boss's change request text
}
```

---

## Transient Entities

### UploadRequest (NEW)

**Description**: Represents an in-progress file upload. Created when Boss initiates upload, completed when Worker webhook is called. Not persisted to MongoDB (temporary).

**TypeScript Interface**:

```typescript
export interface UploadRequest {
  request_id: string;                    // Unique upload ID (nanoid)
  file_name: string;                     // Original filename (e.g., "knowthyself.docx")
  file_size: number;                     // Bytes
  file_type: DocumentType;               // txt | md | pdf | docx
  file_path: string;                     // Temporary path on server (e.g., "uploads/...")
  tool_purpose: string;                  // Provided by Boss
  client_name: string;                   // Provided by Boss
  extracted_text: string;                // Parsed content
  upload_timestamp: Date;                // When uploaded
  worker_webhook_called_at: Date | null; // When Worker was triggered
  status: UploadStatus;                  // uploading | processing | completed | failed
}

export enum UploadStatus {
  Uploading = 'uploading',         // File is being uploaded
  Processing = 'processing',       // File is being parsed
  Completed = 'completed',         // Worker webhook called successfully
  Failed = 'failed'                // Upload or parsing failed
}
```

**Lifecycle**: Created → Uploading → Processing → Worker webhook called → Completed → Garbage collected

**Storage**: In-memory only (not persisted). Exists only during upload operation.

---

### WebhookPayload (NEW)

**Description**: Data received from n8n workflows (QA-approved tools, deployment results, revision results).

**TypeScript Interface**:

```typescript
export interface WebhookPayload {
  webhook_id: string;                    // Unique webhook call ID (generated)
  webhook_type: WebhookType;             // tool-ready | deployment-result | revision-result
  received_at: Date;                     // Timestamp
  payload_data: Record<string, any>;     // JSON payload (varies by type)
  processing_status: ProcessingStatus;   // pending | processed | failed
}

export enum WebhookType {
  ToolReady = 'tool-ready',              // QA-approved tool from Boss Office Storage workflow
  DeploymentResult = 'deployment-result', // Deployment confirmation from Deployment workflow
  RevisionResult = 'revision-result'     // Revised tool from Revision workflow
}

export enum ProcessingStatus {
  Pending = 'pending',       // Received, not yet processed
  Processed = 'processed',   // Successfully processed
  Failed = 'failed'          // Processing failed
}
```

**MongoDB Schema** (fast_track_tools.webhook_logs collection):

```typescript
{
  _id: ObjectId,
  webhook_id: string (unique index),
  webhook_type: string,
  received_at: ISODate (index),
  payload_data: object,
  processing_status: string,
  error_message: string | null,
  processed_at: ISODate | null
}
```

**Variants by WebhookType**:

**ToolReady Payload** (from QA workflow):

```typescript
{
  tool_id: string,
  tool_purpose: string,
  client_name: string,
  document_type: DocumentType,
  source_document: string,      // Extracted text
  generated_html: string,
  qa_score: number,
  qa_feedback: string
}
```

**DeploymentResult Payload** (from Deployment workflow):

```typescript
{
  tool_id: string,
  deployed_url: string,
  github_commit_sha: string,
  deployed_at: string,          // ISO 8601
  deployment_duration_ms: number
}
```

**RevisionResult Payload** (from Revision workflow):

```typescript
{
  tool_id: string,
  revised_html: string,
  revision_timestamp: string,   // ISO 8601
  revision_count: number
}
```

---

## Relationships

### Aggregates

**Tool** is the aggregate root. All operations go through Tool entity.

**Relationships**:

```
Tool 1 ──── 1 SourceDocument (composition - owned by Tool)
Tool 1 ──── * Revision (composition - owned by Tool)
Tool 1 ──── 1 User (Boss) (association - Boss reviews Tool)

UploadRequest 1 ──── 1 Tool (results in, after Worker/QA completion)
WebhookPayload * ──── 1 Tool (creates or updates)
```

**Composition vs Association**:
- **Composition** (strong ownership): SourceDocument and Revision are owned by Tool. When Tool is deleted, these are deleted too.
- **Association** (weak reference): User (Boss) is independent. Tool references Boss via boss email, but Boss entity is managed separately.

---

## State Transitions

### Tool Status State Machine

```
┌─────────────────┐
│  pending_review │  ← Entry point (from QA webhook)
└─────────────────┘
        │
        ├─── Boss clicks "Approve & Deploy"
        │         ↓
        │    ┌──────────┐
        │    │ approved │
        │    └──────────┘
        │         ↓ (deployment webhook succeeds)
        │    ┌──────────┐
        │    │ deployed │ ← Terminal state
        │    └──────────┘
        │
        ├─── Boss clicks "Reject"
        │         ↓
        │    ┌──────────┐
        │    │ rejected │ ← Terminal state
        │    └──────────┘
        │
        └─── Boss clicks "Request Revision"
                  ↓
             ┌───────────────────┐
             │ revision_requested │
             └───────────────────┘
                  ↓ (n8n Revision workflow regenerates)
             ┌─────────────────┐
             │  pending_review │ ← Cycle back
             └─────────────────┘
```

**Allowed Transitions**:

| From State | To State | Trigger | Boss Action Required |
|------------|----------|---------|----------------------|
| `pending_review` | `approved` | Boss clicks "Approve" | Yes |
| `approved` | `deployed` | Deployment webhook succeeds | No (automatic) |
| `pending_review` | `rejected` | Boss clicks "Reject" | Yes (+ feedback) |
| `pending_review` | `revision_requested` | Boss clicks "Request Revision" | Yes (+ feedback) |
| `revision_requested` | `pending_review` | n8n Revision workflow completes | No (automatic) |

**Illegal Transitions** (enforced by application layer):
- `deployed` → Any state (deployed is terminal)
- `rejected` → Any state (rejected is terminal)
- `approved` → `rejected` (cannot reject after approve)
- `approved` → `revision_requested` (cannot revise after approve)

---

### UploadRequest Status State Machine

```
┌───────────┐
│ uploading │  ← Entry point
└───────────┘
     │
     ↓ (multer receives file)
┌────────────┐
│ processing │
└────────────┘
     │
     ├─── Parser succeeds + Worker webhook called
     │         ↓
     │    ┌───────────┐
     │    │ completed │ ← Terminal state
     │    └───────────┘
     │
     └─── Parser fails OR Worker webhook fails
               ↓
          ┌────────┐
          │ failed │ ← Terminal state
          └────────┘
```

---

## Domain Services

### FileParserService (NEW)

**Responsibility**: Parse uploaded files to extract plain text content.

**Interface**:

```typescript
export interface FileParserService {
  parseTxt(filePath: string): Promise<string>;
  parseMarkdown(filePath: string): Promise<string>;
  parsePdf(filePath: string): Promise<string>;
  parseDocx(filePath: string): Promise<string>;
}
```

**Implementation**: `backend/src/infrastructure/parsers/` (uses pdf-parse, mammoth)

---

### WorkerWebhookClient (NEW)

**Responsibility**: Call n8n Worker webhook to trigger tool generation.

**Interface**:

```typescript
export interface WorkerWebhookClient {
  triggerGeneration(request: {
    tool_purpose: string;
    client_name: string;
    source_document: string;
  }): Promise<WorkerWebhookResponse>;
}

export interface WorkerWebhookResponse {
  tool_id: string;
  generated_html: string;
  worker_duration_ms: number;
  worker_timestamp: string;
}
```

**Implementation**: `backend/src/infrastructure/webhooks/N8nWorkerClient.ts`

---

### DeploymentWebhookClient (NEW)

**Responsibility**: Call n8n Deployment webhook to deploy approved tools.

**Interface**:

```typescript
export interface DeploymentWebhookClient {
  deployTool(request: {
    tool_id: string;
    generated_html: string;
    tool_purpose: string;
  }): Promise<DeploymentWebhookResponse>;
}

export interface DeploymentWebhookResponse {
  tool_id: string;
  deployed_url: string;
  github_commit_sha: string;
  deployed_at: string;
  deployment_duration_ms: number;
}
```

**Implementation**: `backend/src/infrastructure/webhooks/N8nDeploymentClient.ts`

---

### RevisionWebhookClient (NEW)

**Responsibility**: Call n8n Revision webhook to regenerate tools with Boss feedback.

**Interface**:

```typescript
export interface RevisionWebhookClient {
  requestRevision(request: {
    tool_id: string;
    boss_feedback: string;
    current_html: string;
  }): Promise<RevisionWebhookResponse>;
}

export interface RevisionWebhookResponse {
  tool_id: string;
  revised_html: string;
  revision_timestamp: string;
  revision_count: number;
}
```

**Implementation**: `backend/src/infrastructure/webhooks/N8nRevisionClient.ts`

---

## MongoDB Indexes

**Required Indexes** (for query performance):

```javascript
// backend/scripts/create-indexes.js

// Tools collection
db.tools.createIndex({ "tool_id": 1 }, { unique: true });
db.tools.createIndex({ "status": 1, "generated_timestamp": -1 });  // For "Pending Review" filter
db.tools.createIndex({ "deployed_at": -1 });  // For recent deployments

// Webhook logs collection
db.webhook_logs.createIndex({ "webhook_id": 1 }, { unique: true });
db.webhook_logs.createIndex({ "received_at": -1 });  // For recent webhooks
db.webhook_logs.createIndex({ "processing_status": 1, "received_at": -1 });  // For failed webhooks
```

---

## Validation Rules

### Tool Entity Validation

```typescript
export function validateTool(tool: Tool): ValidationResult {
  const errors: string[] = [];

  // tool_id format: "tool_" + 3+ alphanumeric
  if (!/^tool_[a-z0-9]{3,}$/.test(tool.tool_id)) {
    errors.push('Invalid tool_id format. Expected: tool_xxx');
  }

  // tool_purpose required, 1-200 chars
  if (!tool.tool_purpose || tool.tool_purpose.length > 200) {
    errors.push('tool_purpose required (max 200 chars)');
  }

  // client_name required, 1-100 chars
  if (!tool.client_name || tool.client_name.length > 100) {
    errors.push('client_name required (max 100 chars)');
  }

  // qa_score 0-100
  if (tool.qa_score < 0 || tool.qa_score > 100) {
    errors.push('qa_score must be 0-100');
  }

  // deployed_url required if status is 'deployed'
  if (tool.status === ToolStatus.Deployed && !tool.deployed_url) {
    errors.push('deployed_url required when status is deployed');
  }

  // boss_feedback required if rejected or revision_requested
  if ((tool.boss_review_status === BossReviewStatus.Rejected ||
       tool.status === ToolStatus.RevisionRequested) &&
      !tool.boss_feedback) {
    errors.push('boss_feedback required for reject or revision');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### SourceDocument Validation

```typescript
export function validateSourceDocument(doc: SourceDocument): ValidationResult {
  const errors: string[] = [];

  // file_size ≤ 10MB
  if (doc.file_size > 10 * 1024 * 1024) {
    errors.push('File size exceeds 10MB limit');
  }

  // extracted_text non-empty
  if (!doc.extracted_text || doc.extracted_text.trim().length === 0) {
    errors.push('Extracted text is empty');
  }

  // file_type valid enum
  if (!Object.values(DocumentType).includes(doc.file_type)) {
    errors.push('Invalid file type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

## Summary

**Key Entities**:
- **Tool** (aggregate root): Generated HTML tool with review workflow
- **SourceDocument** (value object): Uploaded file metadata
- **UploadRequest** (transient): In-progress file upload
- **WebhookPayload** (transient): n8n webhook data

**Key Relationships**:
- Tool owns SourceDocument (composition)
- Tool owns Revisions (composition)
- UploadRequest results in Tool (after Worker/QA completion)
- WebhookPayload creates/updates Tool

**State Machines**:
- Tool: pending_review → approved → deployed (or rejected/revision_requested)
- UploadRequest: uploading → processing → completed (or failed)

**Domain Services**:
- FileParserService: Parse txt, md, pdf, docx files
- WorkerWebhookClient: Trigger n8n Worker generation
- DeploymentWebhookClient: Deploy approved tools
- RevisionWebhookClient: Request tool revisions

**Indexes**:
- tool_id (unique), status + generated_timestamp, deployed_at
- webhook_id (unique), received_at, processing_status + received_at

---

**Data Model Status**: ✅ Complete
**Next Step**: Create API contracts (OpenAPI specs)
