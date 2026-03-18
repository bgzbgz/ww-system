# Technical Research: Boss Office Phase Completion

**Date**: 2026-01-22
**Feature**: Boss Office Phase Completion
**Purpose**: Resolve technical unknowns identified in plan.md Phase 0

---

## R001: File Parser Libraries for Node.js

### Decision: pdf-parse (PDF) + mammoth (DOCX)

**PDF Parsing: pdf-parse (Recommended)**

**Comparison:**

| Feature | pdf-parse | pdfjs-dist |
|---------|-----------|------------|
| Weekly Downloads | 1,214,751 | 6,409,745 |
| TypeScript Support | Native (Pure TS) | Available (@types) |
| API Complexity | Simple | Steep learning curve |
| Use Case | Text extraction | Full PDF rendering |
| Accuracy | 95%+ standard PDFs | 98%+ complex PDFs |

**Rationale**: pdf-parse provides simple text extraction API perfect for Boss Office requirements (source document parsing). Pure TypeScript implementation with excellent type safety. More lightweight than pdfjs-dist which is designed for full PDF rendering.

**DOCX Parsing: mammoth (Recommended)**

**Comparison:**

| Feature | mammoth | docx |
|---------|---------|------|
| Weekly Downloads | 814,160 | 447,491 |
| GitHub Stars | 6,025 | 5,349 |
| Primary Use Case | Extract/convert DOCX | Create DOCX |
| Text Extraction | Excellent (95%+) | Not designed for extraction |

**Rationale**: mammoth is specifically designed for reading and converting DOCX files to HTML/text. Higher popularity and more stars. The `docx` library is for *creating* documents, not parsing them.

**Installation:**

```bash
npm install pdf-parse mammoth
npm install --save-dev @types/pdf-parse @types/mammoth
```

**Implementation Example:**

```typescript
// backend/src/infrastructure/parsers/PdfParser.ts
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export async function parsePdf(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// backend/src/infrastructure/parsers/DocxParser.ts
import mammoth from 'mammoth';

export async function parseDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}
```

**Alternatives Considered:**
- pdfjs-dist: Too complex for simple text extraction
- docx: Designed for creating documents, not parsing

---

## R002: Multer Configuration for Express

### Decision: Disk storage with 10MB limit, temporary uploads/ directory, automatic cleanup

**Configuration:**

```typescript
// backend/src/api/middleware/fileUpload.ts
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhash-sanitized.ext
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();

    // Security: Sanitize original filename (remove directory traversal)
    const safeName = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, '_')
      .substring(0, 50);

    cb(null, `${uniqueSuffix}-${safeName}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedExtensions = ['.txt', '.md', '.pdf', '.docx'];
  const allowedMimeTypes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }

  cb(null, true);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
}
```

**Security Considerations:**

1. **Directory Traversal Prevention:**
   - Use `path.basename()` to strip any directory components
   - Replace special characters with underscores
   - Never trust user-provided filenames directly

2. **File Type Validation:**
   - Check both extension AND MIME type (double validation)
   - Use whitelist approach (only allow specific types)

3. **File Size Limits:**
   - Set `fileSize` limit to prevent DoS attacks (10MB)
   - Set `files` limit to prevent multiple file uploads (1 file)

4. **Automatic Cleanup:**
   - Delete files immediately after processing with `cleanupFile()`
   - Run scheduled cleanup for orphaned files (24-hour retention)

**Rationale**: Disk storage is more reliable than memory storage for 10MB files. Unique filename generation prevents collisions. Sanitization prevents directory traversal attacks.

---

## R003: Iframe Sandboxing Best Practices

### Decision: sandbox="allow-scripts allow-forms allow-popups allow-modals" (WITHOUT allow-same-origin)

**Critical Security Warning:**

**NEVER use `allow-scripts` and `allow-same-origin` together.** This combination allows the iframe to remove its own sandbox attribute, effectively breaking out of all sandboxing.

**Recommended Configuration:**

```typescript
// boss-office-app/src/presentation/components/ToolPreviewModal.tsx
export const ToolPreviewModal: React.FC<{ html: string }> = ({ html }) => {
  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);

  React.useEffect(() => {
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  return (
    <iframe
      src={blobUrl}
      title="Tool Preview"
      sandbox="allow-scripts allow-forms allow-popups allow-modals"
      referrerPolicy="no-referrer"
      loading="lazy"
      style={{ width: '100%', height: '600px', border: '1px solid #000' }}
    />
  );
};
```

**Sandbox Attribute Breakdown:**

| Attribute | Purpose | Security Impact |
|-----------|---------|-----------------|
| `allow-scripts` | Allows JavaScript execution | Needed for interactive tools |
| `allow-forms` | Allows form submission | Needed for user inputs |
| `allow-popups` | Allows window.open() | Optional (for external links) |
| `allow-modals` | Allows alert(), confirm() | Optional (for user feedback) |
| **NOT `allow-same-origin`** | Would allow access to parent | **DANGEROUS with allow-scripts** |

**What This Prevents:**
- Accessing parent page DOM (no XSS)
- Accessing localStorage/cookies from parent domain
- Making AJAX requests to parent origin
- Downloading files without user interaction
- Navigating the top-level window

**What This Allows:**
- Running JavaScript within the iframe
- Submitting forms within the iframe
- Opening popup windows (if needed)
- Displaying modal dialogs (alerts, confirms)

**Rationale**: Blob URL approach provides good security without requiring a separate subdomain. Sandbox without `allow-same-origin` prevents XSS while allowing tool functionality.

**Alternatives Considered:**
- Content Security Policy on separate subdomain: More complex, not needed for MVP

---

## R004: React Query Mutation Patterns

### Decision: useMutation with optimistic updates, onMutate/onError rollback, onSuccess invalidation

**Pattern:**

```typescript
// boss-office-app/src/presentation/hooks/useApproveTool.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useApproveTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tool_id: string) => {
      return await approveTool(tool_id); // API call
    },

    // Optimistic update: Update UI immediately before server response
    onMutate: async (tool_id) => {
      await queryClient.cancelQueries({ queryKey: ['tools'] });

      const previousTools = queryClient.getQueryData(['tools']);

      queryClient.setQueryData(['tools'], (old: Tool[]) =>
        old.map(tool =>
          tool.tool_id === tool_id
            ? { ...tool, status: 'deployed', boss_review_status: 'approved' }
            : tool
        )
      );

      return { previousTools }; // Context for rollback
    },

    // Rollback on error: Revert to previous state if mutation fails
    onError: (error, tool_id, context) => {
      if (context?.previousTools) {
        queryClient.setQueryData(['tools'], context.previousTools);
      }
      console.error('Approve failed:', error);
    },

    // Update with server response: Replace optimistic data with real data
    onSuccess: (data, tool_id) => {
      queryClient.setQueryData(['tools'], (old: Tool[]) =>
        old.map(tool => (tool.tool_id === tool_id ? data : tool))
      );

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    }
  });
}
```

**Key Patterns:**

1. **Optimistic Updates**: Update UI immediately before server response (instant feedback)
2. **Rollback on Error**: Revert to previous state if mutation fails (data integrity)
3. **Context Passing**: Use `onMutate` return value for rollback data
4. **Query Invalidation**: Refresh data after successful mutation (consistency)
5. **TypeScript Generics**: Proper typing for mutation data and errors
6. **Loading States**: Track `isPending` for UI feedback
7. **Error Handling**: Capture errors in `onError` callback

**Usage in Component:**

```typescript
const approveMutation = useApproveTool();

const handleApprove = async (tool_id: string) => {
  try {
    await approveMutation.mutateAsync(tool_id);
    toast.success('Tool approved and deployed!');
  } catch (error) {
    toast.error(`Approval failed: ${error.message}`);
  }
};

return (
  <button onClick={() => handleApprove(tool.tool_id)} disabled={approveMutation.isPending}>
    {approveMutation.isPending ? 'Approving...' : 'Approve & Deploy'}
  </button>
);
```

**Rationale**: React Query v5 provides robust mutation patterns with optimistic updates for instant UX, rollback for reliability, and invalidation for consistency.

**Alternatives Considered:**
- Manual state management: Too complex, requires more code
- RTK Query: Not needed, React Query is simpler for this use case

---

## R005: Fast Track Font Loading

### Decision: Tailwind font-family config + @font-face with font-display: swap

**Configuration:**

**Step 1: @font-face Rules**

```css
/* boss-office-app/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  @font-face {
    font-family: 'Plaak Ex Condensed';
    font-style: normal;
    font-weight: 700;
    font-display: swap; /* Prevents CLS, shows fallback immediately */
    src: url('/fonts/plaak-ex-condensed-bold.woff2') format('woff2'),
         url('/fonts/plaak-ex-condensed-bold.woff') format('woff');
  }

  @font-face {
    font-family: 'Riforma LL';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/riforma-ll-regular.woff2') format('woff2'),
         url('/fonts/riforma-ll-regular.woff') format('woff');
  }
}
```

**Step 2: Tailwind Config**

```typescript
// boss-office-app/tailwind.config.js
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'plaak': ['"Plaak Ex Condensed"', ...defaultTheme.fontFamily.sans],
        'riforma': ['"Riforma LL"', ...defaultTheme.fontFamily.sans],
        'sans': ['"Riforma LL"', ...defaultTheme.fontFamily.sans], // Default
      },

      fontSize: {
        'plaak-hero': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'plaak-title': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
      }
    },
  },
  plugins: [],
};
```

**Step 3: HTML Preload (for critical fonts)**

```html
<!-- boss-office-app/index.html -->
<head>
  <!-- Preload critical fonts for better performance -->
  <link
    rel="preload"
    href="/fonts/plaak-ex-condensed-bold.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
  <link
    rel="preload"
    href="/fonts/riforma-ll-regular.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
</head>
```

**Step 4: Usage in Components**

```typescript
// Headings with Plaak
<h1 className="font-plaak text-plaak-hero text-black">
  Boss Office Admin
</h1>

// Body text with Riforma (or just font-sans which defaults to Riforma)
<p className="font-riforma text-base text-gray-800">
  Review and approve client completion documents.
</p>
```

**Performance Optimization:**

1. **Use WOFF2 format** (best compression, ~30% smaller than WOFF)
2. **font-display: swap** prevents invisible text during load (CRITICAL for CLS)
3. **Preload critical fonts** in HTML `<head>` (faster initial load)
4. **Fallback fonts** in Tailwind config (graceful degradation)

**Rationale**: font-display: swap prevents Cumulative Layout Shift (CLS) by showing fallback font immediately while custom fonts load. WOFF2 format provides best compression. Preloading critical fonts improves perceived performance.

**Alternatives Considered:**
- font-display: block: Causes invisible text during load (bad UX)
- Google Fonts: Requires external request, less control over performance

---

## R006: n8n Webhook Response Handling

### Decision: TypeScript interfaces matching n8n workflow outputs

**Worker Webhook Response:**

```typescript
// backend/src/infrastructure/webhooks/N8nWorkerClient.ts
export interface WorkerWebhookResponse {
  tool_id: string;
  generated_html: string;
  worker_duration_ms: number;
  worker_timestamp: string; // ISO 8601
}
```

**Deployment Webhook Response:**

```typescript
// backend/src/infrastructure/webhooks/N8nDeploymentClient.ts
export interface DeploymentWebhookResponse {
  tool_id: string;
  deployed_url: string;
  github_commit_sha: string;
  deployed_at: string; // ISO 8601
  deployment_duration_ms: number;
}
```

**Revision Webhook Response:**

```typescript
// backend/src/infrastructure/webhooks/N8nRevisionClient.ts
export interface RevisionWebhookResponse {
  tool_id: string;
  revised_html: string;
  revision_timestamp: string; // ISO 8601
  revision_count: number;
}
```

**Rationale**: TypeScript interfaces ensure type safety when calling n8n webhooks. ISO 8601 timestamps for consistency. Duration metrics for observability.

---

## R007: MongoDB Webhook Idempotency

### Decision: Unique index on tool_id + upsert pattern

**Implementation:**

```javascript
// backend/scripts/create-indexes.js
db.tools.createIndex({ "tool_id": 1 }, { unique: true });
db.tools.createIndex({ "status": 1, "generated_timestamp": -1 });
```

**Webhook Receiver Pattern:**

```typescript
// backend/src/application/use-cases/ReceiveQAApprovedTool.ts
export async function receiveQAApprovedTool(payload: WebhookPayload) {
  try {
    const result = await toolsCollection.updateOne(
      { tool_id: payload.tool_id },
      {
        $setOnInsert: {
          tool_id: payload.tool_id,
          generated_timestamp: new Date(),
        },
        $set: {
          generated_html: payload.generated_html,
          qa_score: payload.qa_score,
          qa_feedback: payload.qa_feedback,
          status: 'pending_review',
          qa_timestamp: new Date(),
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount === 0 && result.modifiedCount === 0) {
      throw new Error('Conflict: tool_id already exists');
    }

    return { success: true };
  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error
      throw new Error('Conflict: tool_id already exists');
    }
    throw error;
  }
}
```

**Rationale**: MongoDB unique index on tool_id prevents duplicates at database level. Upsert pattern with `$setOnInsert` ensures idempotency - webhook can be called multiple times without creating duplicates.

**Alternatives Considered:**
- Application-level duplicate check: Race condition risk
- Idempotency key in separate collection: More complex, not needed

---

## Summary of Decisions

| Research Question | Decision | Rationale |
|-------------------|----------|-----------|
| **PDF Parser** | pdf-parse | Simple text extraction API, pure TypeScript, 95%+ accuracy |
| **DOCX Parser** | mammoth | Designed for reading DOCX, converts to HTML/text, 814K downloads |
| **Multer Config** | Disk storage, 10MB limit, temp uploads/ dir | Reliable for large files, automatic cleanup, security-focused |
| **Iframe Sandbox** | allow-scripts allow-forms (NO allow-same-origin) | Prevents XSS while allowing tool functionality |
| **React Query Mutations** | Optimistic updates + rollback + invalidation | Instant UX, reliable error handling, data consistency |
| **Fast Track Fonts** | Tailwind config + @font-face + font-display: swap | Prevents CLS, optimal performance, graceful fallback |
| **n8n Webhooks** | TypeScript interfaces matching workflow outputs | Type safety, consistency, observability |
| **MongoDB Idempotency** | Unique index on tool_id + upsert pattern | Prevents duplicates, idempotent webhooks |

---

## Installation Commands

```bash
# Backend
cd backend
npm install pdf-parse mammoth multer
npm install --save-dev @types/pdf-parse @types/mammoth @types/multer

# Frontend
cd boss-office-app
npm install @tanstack/react-query@5

# Create uploads directory
mkdir -p backend/uploads
echo "uploads/" >> backend/.gitignore
```

---

**Research Status**: ✅ Complete
**Next Step**: Generate data-model.md and API contracts
