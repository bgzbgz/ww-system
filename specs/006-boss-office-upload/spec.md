# Feature Specification: Boss Office Upload Command (Dropbox)

**Feature Branch**: `006-boss-office-upload`
**Created**: 2026-01-24
**Status**: Draft
**Input**: User description: "Upload Command - Boss drops a file to create a Job"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Document via Drag-and-Drop (Priority: P1)

As the Boss, I want to drag-and-drop a document file into the dropzone, so that a new Job is created in DRAFT state ready for further configuration.

**Why this priority**: This is the primary entry point for creating Jobs. Without document upload, the Boss cannot initiate the tool generation pipeline.

**Independent Test**: Can be fully tested by dragging a .pdf file into the dropzone, verifying the file is accepted, and confirming a Job appears with status DRAFT containing the correct job_id, original_filename, file_type, and created_at.

**Acceptance Scenarios**:

1. **Given** Boss is on the upload page, **When** Boss drags a .pdf file into the dropzone, **Then** the dropzone shows a yellow highlight indicating drag-over state
2. **Given** Boss drops a valid .pdf file, **When** the file is released, **Then** the system displays the filename, file type (PDF), and file size
3. **Given** Boss drops a valid file, **When** validation completes, **Then** a new Job is created with job_id (UUID), original_filename, file_type, created_at timestamp, and status = DRAFT
4. **Given** Boss drops a .docx file, **When** the file is accepted, **Then** the file type shows "DOCX" and the Job is created successfully
5. **Given** Boss drops a .txt file, **When** the file is accepted, **Then** the file type shows "TXT" and the Job is created successfully
6. **Given** Boss drops a .md file, **When** the file is accepted, **Then** the file type shows "MD" and the Job is created successfully

---

### User Story 2 - Upload Document via File Picker (Priority: P1)

As the Boss, I want to click a file picker button to select a document, so that I have an alternative upload method that doesn't require drag-and-drop.

**Why this priority**: File picker provides essential accessibility and is required alongside drag-and-drop for complete upload functionality.

**Independent Test**: Can be fully tested by clicking the "Choose File" button, selecting a .txt file from the system dialog, and verifying the Job is created identically to drag-and-drop upload.

**Acceptance Scenarios**:

1. **Given** Boss is on the upload page, **When** Boss clicks the "Choose File" button, **Then** the system file dialog opens with filter for PDF, DOCX, TXT, MD files
2. **Given** Boss selects a valid file from the file dialog, **When** Boss confirms selection, **Then** the system displays the filename, file type, and file size
3. **Given** Boss selects a file via file picker, **When** validation completes, **Then** a Job is created with identical structure as drag-and-drop (job_id, original_filename, file_type, created_at, status = DRAFT)

---

### User Story 3 - Block Unsupported File Types (Priority: P1)

As the Boss, I want to see an actionable error message when I upload an unsupported file type, so that I know exactly what file types are accepted.

**Why this priority**: Validation feedback is critical for usability and prevents confusion when uploads fail.

**Independent Test**: Can be fully tested by attempting to drag-drop a .exe file and verifying the error message "Wrong file type. Use PDF, DOCX, TXT, or MD." appears immediately.

**Acceptance Scenarios**:

1. **Given** Boss drags a .exe file into the dropzone, **When** the file is dropped, **Then** the system shows error: "Wrong file type. Use PDF, DOCX, TXT, or MD."
2. **Given** Boss drags a .jpg file into the dropzone, **When** the file is dropped, **Then** the system shows error: "Wrong file type. Use PDF, DOCX, TXT, or MD."
3. **Given** Boss drags a .zip file into the dropzone, **When** the file is dropped, **Then** the system shows error: "Wrong file type. Use PDF, DOCX, TXT, or MD."
4. **Given** An unsupported file is rejected, **When** the error appears, **Then** no Job is created and the dropzone returns to ready state
5. **Given** Boss selects an unsupported file via file picker, **When** validation runs, **Then** the same error message appears: "Wrong file type. Use PDF, DOCX, TXT, or MD."

---

### User Story 4 - Block Files Exceeding Size Limit (Priority: P2)

As the Boss, I want to see an actionable error message when I upload a file that exceeds the size limit, so that I know to split or reduce the file size.

**Why this priority**: Size validation prevents system overload and provides clear guidance to the user.

**Independent Test**: Can be fully tested by attempting to upload a 15MB PDF file (over 10MB limit) and verifying the error message "File too large. Split it." appears.

**Acceptance Scenarios**:

1. **Given** Boss drops a 15MB PDF file, **When** validation runs, **Then** the system shows error: "File too large. Split it."
2. **Given** Boss drops a 10MB file (at limit), **When** validation runs, **Then** the file is accepted and Job is created
3. **Given** Boss drops a 9.9MB file (under limit), **When** validation runs, **Then** the file is accepted and Job is created
4. **Given** An oversized file is rejected, **When** the error appears, **Then** no Job is created and the dropzone returns to ready state

---

### User Story 5 - Display File Information Before Submission (Priority: P2)

As the Boss, I want to see the file name, type, and size displayed after dropping a file, so that I can confirm I selected the correct document before the Job is created.

**Why this priority**: Visual confirmation prevents accidental uploads of wrong files.

**Independent Test**: Can be fully tested by dropping a file and verifying the filename, type badge (PDF/DOCX/TXT/MD), and size (formatted as KB/MB) are displayed correctly.

**Acceptance Scenarios**:

1. **Given** Boss drops "market-analysis.pdf" (2.5MB), **When** the file is accepted, **Then** display shows: filename "market-analysis.pdf", type "PDF", size "2.5 MB"
2. **Given** Boss drops "notes.txt" (12KB), **When** the file is accepted, **Then** display shows: filename "notes.txt", type "TXT", size "12 KB"
3. **Given** Boss drops a file, **When** info is displayed, **Then** a "Remove" button appears to cancel before Job creation

---

### User Story 6 - Store Original File for Factory Transmission (Priority: P1)

As the system, I want to store the uploaded file in its original format, so that it can be transmitted to the Factory workflow later.

**Why this priority**: File storage is required for the downstream Factory processing pipeline.

**Independent Test**: Can be fully tested by uploading a file, then verifying the file exists in storage with the correct job_id reference and original content intact.

**Acceptance Scenarios**:

1. **Given** Boss uploads a PDF file, **When** the Job is created, **Then** the original PDF binary is stored with reference to job_id
2. **Given** Boss uploads a DOCX file, **When** the Job is created, **Then** the original DOCX binary is stored with reference to job_id
3. **Given** A file is stored, **When** the Factory requests it, **Then** the file can be retrieved with identical content to the original upload

---

### Edge Cases

- What happens when Boss drops multiple files at once? System accepts only the first file and shows message "One file at a time. Drop a single file."
- What happens when the upload network connection drops mid-transfer? System shows "Upload failed. Check connection and try again." with retry button.
- What happens when file storage is unavailable? System shows "Storage unavailable. Try again later." and does not create the Job.
- What happens when Boss drops a file with special characters in the filename? System sanitizes filename for storage but displays original name to user.
- What happens when Boss drops a 0-byte empty file? System rejects with "File is empty. Upload a document with content."
- What happens when Boss drops a valid extension but corrupted file? System accepts based on extension; content validation happens in Factory.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dropzone that accepts drag-and-drop of files
- **FR-002**: System MUST provide a file picker button as alternative to drag-and-drop
- **FR-003**: System MUST accept only these file types: .pdf, .docx, .txt, .md (case-insensitive)
- **FR-004**: System MUST reject files with unsupported extensions with message: "Wrong file type. Use PDF, DOCX, TXT, or MD."
- **FR-005**: System MUST reject files exceeding 10MB with message: "File too large. Split it."
- **FR-006**: System MUST display file name, type, and size after successful file selection
- **FR-007**: System MUST display file size in human-readable format (KB for < 1MB, MB otherwise)
- **FR-008**: System MUST create a Job entity with: job_id (UUID v4), original_filename, file_type, created_at (timestamp), status = "DRAFT"
- **FR-009**: System MUST store the original file binary for later transmission to Factory
- **FR-010**: System MUST associate stored file with job_id for retrieval
- **FR-011**: Dropzone MUST show visual feedback during drag-over state (yellow highlight per brand guidelines)
- **FR-012**: System MUST prevent multiple file selection/drop (one file at a time)
- **FR-013**: System MUST reject empty (0-byte) files with message: "File is empty. Upload a document with content."
- **FR-014**: File picker dialog MUST filter to show only .pdf, .docx, .txt, .md files
- **FR-015**: System MUST provide a "Remove" action to cancel file selection before Job creation

### Key Entities

- **Job**: Represents a document upload that will be processed by Factory. Key attributes: job_id (UUID v4, unique identifier), original_filename (string, the uploaded file's name), file_type (enum: PDF, DOCX, TXT, MD), file_size_bytes (integer), created_at (timestamp, when Job was created), status (enum: DRAFT, SUBMITTED, PROCESSING, COMPLETED, FAILED), file_storage_key (string, reference to stored file). Relationships: has one StoredFile.

- **StoredFile**: Represents the binary file in storage. Key attributes: storage_key (unique identifier), job_id (reference to Job), content_type (MIME type), size_bytes (integer), uploaded_at (timestamp). Relationships: belongs to one Job.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Boss can drag-drop a valid file and see Job created with correct metadata in under 3 seconds (excluding network latency)
- **SC-002**: Boss can use file picker to upload a file with identical results as drag-drop
- **SC-003**: Invalid file type rejection shows error message within 500ms of drop
- **SC-004**: File size validation rejects files over 10MB within 500ms
- **SC-005**: File info display shows correct filename, type badge, and formatted size
- **SC-006**: Stored file can be retrieved with 100% binary fidelity
- **SC-007**: All upload UI follows Fast Track brand: yellow (#FFF469) drag-over highlight, black (#000000) borders, no rounded corners
- **SC-008**: Job entity contains all required fields: job_id, original_filename, file_type, created_at, status = DRAFT
- **SC-009**: System handles files up to 10MB without timeout or memory errors

## Assumptions and Constraints

### Assumptions

- Fast Track brand CSS system (spec 005) is implemented and available
- Boss is authenticated via existing auth system before accessing upload
- File storage service (local filesystem or cloud storage) is configured
- Factory workflow will be built separately to consume stored files

### Constraints

- Maximum file size: 10MB
- Supported file types: PDF, DOCX, TXT, MD only
- Single file upload only (no batch/multiple files)
- File content validation (corruption, malware) is out of scope for this spec
- Job entity created in DRAFT state; subsequent states handled by other specs

## Out of Scope

- File content parsing or text extraction (handled by Factory)
- Multi-file upload or batch processing
- File content validation (virus scanning, corruption detection)
- Job state transitions beyond DRAFT
- Factory webhook integration
- Progress bar for large file uploads (simple spinner only)
- File preview/thumbnail generation
- Duplicate file detection
