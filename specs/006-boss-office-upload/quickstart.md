# Quickstart: Boss Office Upload Command

**Spec**: 006-boss-office-upload
**Time to First Working Feature**: ~2 hours

---

## Overview

Implement file upload functionality for Boss Office. Boss drops a file (PDF, DOCX, TXT, MD) to create a Job in DRAFT state.

---

## Prerequisites

- Fast Track CSS Design System (spec-005) implemented
- Node.js/TypeScript environment
- MongoDB connection configured

---

## Step 1: Create Upload Component HTML (30 min)

Create the dropzone component using existing Fast Track CSS classes.

```html
<!-- src/components/upload/dropzone.html -->
<div class="ft-card ft-upload-dropzone" id="dropzone">
  <div class="ft-upload-dropzone__content">
    <h3>DROP FILE HERE</h3>
    <p class="ft-text-muted">or</p>
    <label class="ft-button ft-button--primary">
      Choose File
      <input type="file"
             id="file-input"
             accept=".pdf,.docx,.txt,.md"
             hidden>
    </label>
    <span class="ft-meta ft-mt-2">PDF, DOCX, TXT, or MD (max 10MB)</span>
  </div>

  <!-- File info (shown after selection) -->
  <div class="ft-upload-dropzone__file-info" id="file-info" hidden>
    <span class="ft-badge" id="file-type-badge"></span>
    <span id="file-name"></span>
    <span class="ft-text-muted" id="file-size"></span>
    <button class="ft-button ft-button--tertiary" id="remove-btn">Remove</button>
  </div>

  <!-- Error message -->
  <div class="ft-error" id="error-message" hidden>
    <span class="ft-error__message" id="error-text"></span>
  </div>
</div>
```

---

## Step 2: Add Dropzone CSS (15 min)

Extend the brand CSS with upload-specific styles.

```css
/* src/styles/components/_upload.css */

.ft-upload-dropzone {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: background-color 0.1s;
}

.ft-upload-dropzone--drag-over {
  background-color: var(--ft-color-yellow);
}

.ft-upload-dropzone__content {
  padding: var(--ft-space-4);
}

.ft-upload-dropzone__file-info {
  display: flex;
  align-items: center;
  gap: var(--ft-space-2);
  padding: var(--ft-space-3);
  background: var(--ft-color-white);
  border-top: var(--ft-border);
  width: 100%;
}
```

---

## Step 3: Implement Validation Logic (30 min)

```typescript
// src/lib/upload/validation.ts

const VALID_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileType?: 'PDF' | 'DOCX' | 'TXT' | 'MD';
}

export function validateFile(file: File): ValidationResult {
  // Check single file (handled at drop level)
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check empty file
  if (file.size === 0) {
    return { valid: false, error: 'File is empty. Upload a document with content.' };
  }

  // Check size
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large. Split it.' };
  }

  // Check extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !VALID_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Wrong file type. Use PDF, DOCX, TXT, or MD.' };
  }

  return {
    valid: true,
    fileType: extension.toUpperCase() as 'PDF' | 'DOCX' | 'TXT' | 'MD'
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

---

## Step 4: Implement Drag-and-Drop Handler (30 min)

```typescript
// src/lib/upload/dropzone.ts

import { validateFile, formatFileSize, ValidationResult } from './validation';

export function initDropzone(dropzoneId: string): void {
  const dropzone = document.getElementById(dropzoneId);
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const fileInfo = document.getElementById('file-info');
  const errorMessage = document.getElementById('error-message');

  if (!dropzone || !fileInput) return;

  let selectedFile: File | null = null;

  // Drag events
  dropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropzone.classList.add('ft-upload-dropzone--drag-over');
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.classList.remove('ft-upload-dropzone--drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('ft-upload-dropzone--drag-over');

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      showError('One file at a time. Drop a single file.');
      return;
    }

    handleFile(files[0]);
  });

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  });

  // Remove button
  document.getElementById('remove-btn')?.addEventListener('click', () => {
    clearFile();
  });

  function handleFile(file: File): void {
    const result = validateFile(file);

    if (!result.valid) {
      showError(result.error!);
      return;
    }

    selectedFile = file;
    showFileInfo(file, result.fileType!);
    hideError();
  }

  function showFileInfo(file: File, type: string): void {
    if (!fileInfo) return;

    document.getElementById('file-type-badge')!.textContent = type;
    document.getElementById('file-name')!.textContent = file.name;
    document.getElementById('file-size')!.textContent = formatFileSize(file.size);

    fileInfo.hidden = false;
  }

  function showError(message: string): void {
    if (!errorMessage) return;

    document.getElementById('error-text')!.textContent = message;
    errorMessage.hidden = false;

    if (fileInfo) fileInfo.hidden = true;
  }

  function hideError(): void {
    if (errorMessage) errorMessage.hidden = true;
  }

  function clearFile(): void {
    selectedFile = null;
    fileInput.value = '';
    if (fileInfo) fileInfo.hidden = true;
  }
}
```

---

## Step 5: Implement Job Creation API (30 min)

```typescript
// src/api/jobs.ts

interface CreateJobRequest {
  file: File;
}

interface Job {
  job_id: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
  status: 'DRAFT';
}

export async function createJob(request: CreateJobRequest): Promise<Job> {
  const formData = new FormData();
  formData.append('file', request.file);

  const response = await fetch('/api/boss/jobs', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}
```

---

## Step 6: Wire It Together (15 min)

```typescript
// src/pages/upload.ts

import { initDropzone } from '../lib/upload/dropzone';
import { createJob } from '../api/jobs';

document.addEventListener('DOMContentLoaded', () => {
  initDropzone('dropzone');

  // Add submit handler when ready to create job
  document.getElementById('submit-btn')?.addEventListener('click', async () => {
    const file = getSelectedFile(); // Implement based on dropzone state

    if (!file) return;

    try {
      const job = await createJob({ file });
      showSuccess(`Job created: ${job.job_id}`);
    } catch (error) {
      showError('Upload failed. Check connection and try again.');
    }
  });
});
```

---

## Verification Checklist

- [ ] Drag PDF file → Yellow highlight appears
- [ ] Drop valid file → Shows filename, type badge, size
- [ ] Drop .exe file → "Wrong file type. Use PDF, DOCX, TXT, or MD."
- [ ] Drop 15MB file → "File too large. Split it."
- [ ] Drop empty file → "File is empty. Upload a document with content."
- [ ] Drop 2 files → "One file at a time. Drop a single file."
- [ ] Click Choose File → Opens filtered dialog
- [ ] Click Remove → Clears file selection
- [ ] Submit → Job created with DRAFT status

---

## Next Steps

1. Implement backend `/api/boss/jobs` endpoint
2. Implement file storage service
3. Connect to MongoDB
4. Add success/error toast notifications
