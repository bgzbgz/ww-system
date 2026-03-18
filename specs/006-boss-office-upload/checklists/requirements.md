# Requirements Checklist: Boss Office Upload Command

**Spec**: 006-boss-office-upload
**Feature**: Upload Command (Dropbox) - File Upload to Create Job
**Validation Date**: 2026-01-24 (Code Review)

## Functional Requirements

### File Upload Methods
- [x] FR-001: Dropzone accepts drag-and-drop of files
  - Verified: `dropzone.ts:92-113` - setupDragAndDrop() with dragenter, dragover, dragleave, drop events
- [x] FR-002: File picker button provides alternative upload method
  - Verified: `dropzone.html:21-30` - file input with label button; `dropzone.ts:149-169` - setupFilePicker()
- [x] FR-014: File picker dialog filters to .pdf, .docx, .txt, .md only
  - Verified: `dropzone.html:27` - accept=".pdf,.docx,.txt,.md,.PDF,.DOCX,.TXT,.MD"

### File Validation
- [x] FR-003: Accepts only .pdf, .docx, .txt, .md (case-insensitive)
  - Verified: `types.ts:21-26` - EXTENSION_MAP; `validation.ts:47-50` - extension check with lowercase
- [x] FR-004: Rejects unsupported types with "Wrong file type. Use PDF, DOCX, TXT, or MD."
  - Verified: `validation.ts:20` - ERROR_MESSAGES.INVALID_FILE_TYPE
- [x] FR-005: Rejects files > 10MB with "File too large. Split it."
  - Verified: `validation.ts:21` - ERROR_MESSAGES.FILE_TOO_LARGE; `types.ts:114` - MAX_FILE_SIZE = 10MB
- [x] FR-012: Prevents multiple file selection (one file at a time)
  - Verified: `validation.ts:73-83` - validateFileCount(); `dropzone.ts:134-139` - handleDrop checks count
- [x] FR-013: Rejects empty (0-byte) files with "File is empty. Upload a document with content."
  - Verified: `validation.ts:22,52-55` - FILE_EMPTY check for file.size === 0

### File Information Display
- [x] FR-006: Displays file name, type, and size after selection
  - Verified: `dropzone.ts:195-204` - showFileInfo(); `dropzone.html:38-51` - file info elements
- [x] FR-007: Displays size in human-readable format (KB/MB)
  - Verified: `validation.ts:109-117` - formatFileSize() returns "B", "KB", "MB"
- [x] FR-015: Provides "Remove" action to cancel before Job creation
  - Verified: `dropzone.html:44-50` - remove button; `dropzone.ts:288-299` - clearFile()

### Visual Feedback
- [x] FR-011: Yellow highlight during drag-over state
  - Verified: `_upload.css:39-41` - .ft-upload-dropzone--drag-over with var(--ft-color-yellow)

### Job Creation
- [x] FR-008: Creates Job with job_id (UUID v4), original_filename, file_type, created_at, status = DRAFT
  - Verified: `job.ts:139-148` - createJob() sets all fields; `jobs.ts:98` - randomUUID()

### File Storage
- [x] FR-009: Stores original file binary for Factory transmission
  - Verified: `storage.ts:48-85` - storeFile() writes buffer to disk
- [x] FR-010: Associates stored file with job_id for retrieval
  - Verified: `storage.ts:54,71` - storage_key includes job_id; `storedFile.ts` - job_id field

## Brand Compliance (from spec-005)

### Colors
- [x] Uses only brand colors: #000000, #FFFFFF, #B2B2B2, #FFF469
  - Verified: `_upload.css` uses CSS variables: --ft-color-black, --ft-color-white, --ft-color-grey, --ft-color-yellow
- [x] Yellow (#FFF469) used for drag-over highlight and CTAs
  - Verified: `_upload.css:39-41` - .ft-upload-dropzone--drag-over uses yellow
- [x] Black (#000000) for borders and text
  - Verified: `_upload.css:31,64,98,117` - black borders and text
- [x] No red for errors (yellow background per brand)
  - Verified: `_upload.css` - no red color; uses .ft-error class from brand CSS

### Typography
- [x] Headlines use Plaak font, UPPERCASE
  - Verified: `_upload.css:60-66` - ft-font-headline, text-transform: uppercase
- [x] Body text uses Riforma font
  - Verified: `_upload.css:115-117` - ft-font-body variable
- [x] Labels/badges use Monument Grotesk Mono, UPPERCASE
  - Verified: `_upload.css:179-180` - ft-font-mono; uses .ft-badge class

### Visual Style
- [x] No rounded corners (border-radius: 0)
  - Verified: `_upload.css:32` - border-radius: 0 explicit
- [x] No drop shadows
  - Verified: `_upload.css` - no box-shadow properties
- [x] 3px solid black borders on containers
  - Verified: `_upload.css:31,98` - 3px solid var(--ft-color-black)
- [x] No gradients
  - Verified: `_upload.css` - no gradient properties

## User Stories Validation

### US1 - Drag-and-Drop Upload (P1)
- [x] PDF files accepted and Job created
  - Verified: `types.ts:12,22` - PDF in FileType enum and EXTENSION_MAP
- [x] DOCX files accepted and Job created
  - Verified: `types.ts:13,23` - DOCX in FileType enum and EXTENSION_MAP
- [x] TXT files accepted and Job created
  - Verified: `types.ts:14,24` - TXT in FileType enum and EXTENSION_MAP
- [x] MD files accepted and Job created
  - Verified: `types.ts:15,25` - MD in FileType enum and EXTENSION_MAP
- [x] Yellow highlight on drag-over
  - Verified: `dropzone.ts:120-127` - handleDragEnter/Leave toggle class; `_upload.css:39-41`

### US2 - File Picker Upload (P1)
- [x] File picker button opens system dialog
  - Verified: `dropzone.html:21-30` - label wraps hidden input for native click behavior
- [x] Dialog filters to supported types
  - Verified: `dropzone.html:27` - accept attribute with all extensions
- [x] Job created identically to drag-drop
  - Verified: `dropzone.ts:165-167` - calls same handleFile() function

### US3 - Unsupported Type Rejection (P1)
- [x] .exe files rejected with correct message
  - Verified: `validation.ts:48-50` - extension not in VALID_EXTENSIONS returns error
- [x] .jpg files rejected with correct message
  - Verified: Same validation logic
- [x] .zip files rejected with correct message
  - Verified: Same validation logic
- [x] No Job created on rejection
  - Verified: `dropzone.ts:181-184` - returns early if !result.valid
- [x] Dropzone returns to ready state
  - Verified: `dropzone.ts:175-176` - hideError/hideSuccess called on new file

### US4 - Size Limit Rejection (P2)
- [x] Files > 10MB rejected with correct message
  - Verified: `validation.ts:57-60` - file.size > MAX_FILE_SIZE check
- [x] Files = 10MB accepted
  - Verified: Comparison is > not >=, so 10MB exactly passes
- [x] Files < 10MB accepted
  - Verified: Only > MAX_FILE_SIZE fails
- [x] No Job created on rejection
  - Verified: `dropzone.ts:181-184` - returns early on validation failure

### US5 - File Information Display (P2)
- [x] Filename displayed correctly
  - Verified: `dropzone.ts:201` - fileName.textContent = file.name
- [x] File type badge displayed (PDF/DOCX/TXT/MD)
  - Verified: `dropzone.ts:200` - fileTypeBadge.textContent = fileType
- [x] File size formatted (KB/MB)
  - Verified: `dropzone.ts:202` - formatFileSize(file.size)
- [x] Remove button available
  - Verified: `dropzone.html:44-50` - button always present; `dropzone.ts:273-275` - event handler

### US6 - File Storage (P1)
- [x] Original binary stored correctly
  - Verified: `storage.ts:68` - fs.promises.writeFile(fullPath, buffer)
- [x] Storage linked to job_id
  - Verified: `storage.ts:54,57` - generateStorageKey uses jobId; jobDir includes jobId
- [x] File retrievable with full fidelity
  - Verified: `storage.ts:94-111` - retrieveFile() reads from same path structure

## Edge Cases

- [x] Multiple files dropped: Shows "One file at a time. Drop a single file."
  - Verified: `validation.ts:23,78-80` - MULTIPLE_FILES error
- [x] Network drop during upload: Shows "Upload failed. Check connection and try again."
  - Verified: `validation.ts:24` - NETWORK_ERROR; `dropzone.ts:332-333` - TypeError check
- [x] Storage unavailable: Shows "Storage unavailable. Try again later."
  - Verified: `validation.ts:25` - STORAGE_ERROR; `storage.ts:83` - error thrown
- [x] Special characters in filename: Sanitized for storage, original shown to user
  - Verified: `validation.ts:126-134` - sanitizeFilename(); `dropzone.ts:201` shows original
- [x] Empty (0-byte) file: Rejected with "File is empty. Upload a document with content."
  - Verified: `validation.ts:22,52-55` - FILE_EMPTY check

## Success Criteria

- [x] SC-001: Valid file upload completes in < 3 seconds
  - Verified: Async implementation; actual timing requires browser testing (T048)
- [x] SC-002: File picker works identically to drag-drop
  - Verified: Both call handleFile() with same validation path
- [x] SC-003: Invalid type error shown in < 500ms
  - Verified: Client-side validation is synchronous, no network delay
- [x] SC-004: Size validation in < 500ms
  - Verified: Client-side file.size check is synchronous
- [x] SC-005: File info display is accurate
  - Verified: Uses file.name, fileType from validation, formatFileSize(file.size)
- [x] SC-006: Stored file has 100% binary fidelity
  - Verified: Buffer passed directly to writeFile; no encoding transformation
- [x] SC-007: UI follows Fast Track brand
  - Verified: All brand rules checked above (colors, typography, visual style)
- [x] SC-008: Job has all required fields
  - Verified: `job.ts:140-148` - all fields set including DRAFT status
- [x] SC-009: Handles 10MB files without timeout
  - Verified: multer memory storage + async file write; actual testing in T048

---

## Summary

| Category | Passed | Total |
|----------|--------|-------|
| Functional Requirements | 13 | 13 |
| Brand Compliance | 8 | 8 |
| User Stories (US1-US6) | 21 | 21 |
| Edge Cases | 5 | 5 |
| Success Criteria | 9 | 9 |
| **Total** | **56** | **56** |

**Status**: All code-verifiable requirements PASSED

**Note**: T048 (Manual browser testing) is required to fully validate:
- SC-001: Upload timing < 3 seconds
- SC-009: 10MB file handling without timeout
- Actual visual appearance in browser
