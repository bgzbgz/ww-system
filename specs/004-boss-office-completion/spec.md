# Feature Specification: Boss Office Phase Completion

**Feature Branch**: `004-boss-office-completion`
**Created**: 2026-01-22
**Status**: Draft
**Input**: User description: "Boss Office Phase Completion - Complete file upload, preview, review actions, webhook receiver, and Fast Track styling"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Document and Trigger Tool Generation (Priority: P1)

As the Boss, I want to upload a document (.txt, .md, .pdf, or .docx) with a tool purpose and client name, so that the n8n workflow automatically generates an interactive HTML tool and presents it to me for review after QA approval.

**Why this priority**: This is the primary entry point for the entire tool generation pipeline. Without document upload, the Boss cannot initiate tool creation, making this the most critical feature for system functionality.

**Independent Test**: Can be fully tested by uploading a .txt file with tool_purpose "Test Calculator" and client_name "Test Client", then verifying the tool appears in the dashboard with status "pending_review" after QA workflow completes (approximately 30-60 seconds).

**Acceptance Scenarios**:

1. **Given** Boss is on the upload page, **When** Boss drags a .txt file into the dropzone, **Then** the file is accepted and shows a preview of the filename
2. **Given** Boss has selected a valid file, **When** Boss enters tool_purpose "Budget Calculator" and client_name "Acme Corp" and clicks Upload, **Then** the system shows upload progress and calls the n8n Worker webhook with the document content
3. **Given** The Worker and QA workflows have completed, **When** Boss refreshes the dashboard, **Then** the newly generated tool appears with status "pending_review" and the correct tool_purpose and client_name
4. **Given** Boss uploads an invalid file type (.exe), **When** Boss attempts to submit, **Then** the system shows an error message "Only .txt, .md, .pdf, and .docx files are supported"
5. **Given** Boss uploads a .pdf file, **When** the system parses it, **Then** the text content is correctly extracted and sent to the Worker webhook
6. **Given** Boss uploads a .docx file, **When** the system parses it, **Then** the text content (including formatting) is correctly extracted and sent to the Worker webhook

---

### User Story 2 - Preview Generated Tool in Multiple Responsive Modes (Priority: P2)

As the Boss, I want to preview the generated HTML tool in desktop, tablet, and mobile views within a secure iframe, so that I can verify the tool works correctly across different screen sizes before approving deployment.

**Why this priority**: Previewing the tool is essential for quality review but depends on having tools available (from P1). It's the second most critical feature as it enables informed approval decisions.

**Independent Test**: Can be fully tested by navigating to a tool detail page and toggling between Desktop (full width), Tablet (768px), and Mobile (375px) preview modes, verifying the iframe content resizes correctly and remains sandboxed.

**Acceptance Scenarios**:

1. **Given** Boss is viewing a tool detail page, **When** Boss clicks the "Preview" button, **Then** a modal opens displaying the generated HTML in an iframe at desktop width
2. **Given** The preview modal is open in Desktop mode, **When** Boss clicks the "Tablet" button, **Then** the iframe width changes to 768px and the content adjusts responsively
3. **Given** The preview modal is open, **When** Boss clicks the "Mobile" button, **Then** the iframe width changes to 375px simulating mobile view
4. **Given** The preview iframe contains the tool HTML, **When** the HTML attempts to access parent window or make external requests, **Then** the sandbox attribute blocks these actions for security
5. **Given** Boss is viewing the preview, **When** Boss clicks outside the modal or clicks the close button, **Then** the preview modal closes and returns to the tool detail page

---

### User Story 3 - Approve Tool for Deployment (Priority: P2)

As the Boss, I want to approve a reviewed tool and trigger automatic deployment to Vercel/GitHub, so that the tool becomes publicly accessible with a live URL without manual intervention.

**Why this priority**: Tool approval and deployment is the final step in the pipeline and delivers the end value (live tool). It's equally critical as preview for completing the review workflow.

**Independent Test**: Can be fully tested by clicking "Approve & Deploy" on a pending_review tool, verifying the tool status changes to "deployed", the deployed_url is returned, and the tool is accessible at that URL.

**Acceptance Scenarios**:

1. **Given** Boss is viewing a tool with status "pending_review", **When** Boss clicks "Approve & Deploy", **Then** the system calls the n8n deployment webhook with tool_id, generated_html, and tool_purpose
2. **Given** The deployment webhook returns success, **When** the deployment completes, **Then** the tool status updates to "deployed" and shows the deployed_url and github_commit_sha
3. **Given** Boss clicks "Approve & Deploy", **When** the deployment is in progress, **Then** the button shows a loading state and is disabled to prevent double-submission
4. **Given** The deployment webhook fails, **When** the error is returned, **Then** the system shows an error message with retry option and keeps the tool status as "pending_review"
5. **Given** Boss successfully deploys a tool, **When** Boss clicks the deployed_url link, **Then** the link opens the live tool in a new tab

---

### User Story 4 - Reject Tool with Feedback (Priority: P3)

As the Boss, I want to reject a tool and provide feedback explaining why it doesn't meet requirements, so that the tool is removed from my review queue and the rejection reason is recorded.

**Why this priority**: Tool rejection is less common than approval but necessary for managing low-quality tools. It's lower priority because the core value is delivered through approval workflow.

**Independent Test**: Can be fully tested by clicking "Reject" on a pending_review tool, entering feedback text "Does not match brand guidelines", and verifying the tool status changes to "rejected" and disappears from the pending review list.

**Acceptance Scenarios**:

1. **Given** Boss is viewing a tool with status "pending_review", **When** Boss clicks "Reject", **Then** a feedback textarea appears prompting for rejection reason
2. **Given** Boss has entered feedback "Incorrect functionality", **When** Boss confirms rejection, **Then** the tool status updates to "rejected" and boss_feedback is saved
3. **Given** Boss rejects a tool, **When** the rejection is saved, **Then** the tool no longer appears in the "Pending Review" filter
4. **Given** Boss clicks "Reject" but closes the modal, **When** no feedback is submitted, **Then** the tool status remains "pending_review"

---

### User Story 5 - Request Tool Revision with Change Instructions (Priority: P3)

As the Boss, I want to request a revision of a tool by providing specific change instructions, so that the n8n workflow regenerates the tool with my feedback incorporated and returns it to me for re-review.

**Why this priority**: Revision requests enable iterative improvement but are less critical than initial approval workflow. This is a future enhancement that improves quality but isn't required for MVP.

**Independent Test**: Can be fully tested by clicking "Request Revision" on a pending_review tool, entering change instructions "Make buttons larger and add yellow background", verifying the revision webhook is called, and the tool status changes to "revision_requested".

**Acceptance Scenarios**:

1. **Given** Boss is viewing a tool with status "pending_review", **When** Boss clicks "Request Revision", **Then** a modal appears with a textarea for change instructions
2. **Given** Boss has entered revision instructions "Add mobile responsiveness", **When** Boss submits the revision request, **Then** the system calls the n8n revision webhook with tool_id and boss_feedback
3. **Given** The revision webhook is triggered, **When** the AI regenerates the tool, **Then** the tool returns through QA workflow and appears again with status "pending_review" and revision count incremented
4. **Given** Boss requests revision, **When** the revision is in progress, **Then** the tool status shows "revision_requested" and a loading indicator appears
5. **Given** The revision workflow fails, **When** an error occurs, **Then** the system shows an error message and keeps the tool status as "pending_review"

---

### User Story 6 - Receive QA-Approved Tools via Webhook (Priority: P1)

As the backend system, I want to receive QA-approved tools from the n8n Boss Office Storage workflow via webhook, so that tools automatically appear in the Boss's review queue without manual intervention.

**Why this priority**: This is the critical integration point that connects the n8n pipeline to the Boss Office. Without this webhook receiver, the entire automated workflow breaks. It's P1 because it's required for the upload flow (P1) to complete.

**Independent Test**: Can be fully tested by sending a POST request to /api/boss/webhooks/tool-ready with a valid payload (tool_id, generated_html, qa_score, qa_feedback), verifying the tool is stored in MongoDB with status "pending_review", and returns 200 OK.

**Acceptance Scenarios**:

1. **Given** n8n Boss Office Storage workflow has a QA-approved tool, **When** it sends POST to /api/boss/webhooks/tool-ready with valid payload, **Then** the backend stores the tool in MongoDB and returns 200 OK
2. **Given** The webhook receives tool_id "tool_001", **When** the payload is valid, **Then** the tool is stored with generated_html, qa_score, qa_feedback, status "pending_review", and generated_timestamp
3. **Given** The webhook receives an invalid payload (missing tool_id), **When** validation runs, **Then** the backend returns 400 Bad Request with error details
4. **Given** The webhook receives a tool_id that already exists, **When** storing to MongoDB, **Then** the backend returns 409 Conflict to prevent duplicates
5. **Given** Boss is viewing the dashboard, **When** a new tool arrives via webhook, **Then** the tool appears in the dashboard within 7 seconds (due to polling)

---

### User Story 7 - Apply Fast Track Branding Throughout UI (Priority: P3)

As the Boss, I want the entire Boss Office interface to follow Fast Track's bold, minimalist, brutalist design with black/white/yellow colors, so that the tool reflects our brand identity and feels cohesive with our other products.

**Why this priority**: Branding is important for professional polish but doesn't affect core functionality. This can be implemented incrementally after the core workflows are proven.

**Independent Test**: Can be fully tested by visually inspecting the Dashboard, Tool Detail, Upload, and Preview components and verifying they use only #000000 (black), #FFFFFF (white), and #FFF469 (yellow) colors, Plaak font for headings, Riforma font for body text, and bold minimalist layouts.

**Acceptance Scenarios**:

1. **Given** Boss opens the Dashboard, **When** the page loads, **Then** headings use Plaak font with bold weight, body text uses Riforma font, and colors are black/white/yellow only
2. **Given** Boss views tool cards on Dashboard, **When** examining the design, **Then** cards have black borders (3px), white backgrounds, and yellow accent highlights
3. **Given** Boss views action buttons (Approve, Reject, etc.), **When** examining styles, **Then** primary CTAs use yellow background (#FFF469) with black text, and secondary buttons use black background with white text
4. **Given** Boss views the Upload page, **When** the dropzone appears, **Then** it has a bold black border, clear visual hierarchy, and yellow drag-over highlight state
5. **Given** Boss views the Preview modal, **When** examining the design, **Then** the modal has a minimalist black border, white background, and yellow close button

---

### Edge Cases

- What happens when the Boss uploads a 50MB PDF file? System validates file size and rejects files larger than 10MB with clear error message.
- What happens when the n8n Worker webhook is down during upload? System shows timeout error after 60 seconds with retry button and stores the file locally for retry.
- What happens when multiple tools arrive via webhook simultaneously? MongoDB handles concurrent writes with unique tool_id constraint; duplicates return 409.
- What happens when the Boss clicks "Approve" on a tool that was already deployed by another session? Backend checks current status and returns 409 Conflict if already deployed.
- What happens when the deployed_url from n8n is invalid or returns 404? System stores the URL but shows a warning icon next to the link with "Deployment may still be propagating".
- What happens when the Boss's internet connection drops during upload? Frontend shows network error and offers to retry upload when connection is restored.
- What happens when a .docx file contains only images and no text? System extracts empty string and returns validation error "Document must contain text content".
- What happens when the Boss opens the preview modal and the HTML contains infinite loops or heavy JavaScript? iframe sandbox with limited permissions prevents freezing; system adds 5-second load timeout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an upload endpoint (POST /api/boss/upload) that accepts multipart/form-data with file, tool_purpose, and client_name fields
- **FR-002**: System MUST parse uploaded files in .txt, .md, .pdf (using pdf-parse), and .docx (using mammoth) formats to extract plain text content
- **FR-003**: System MUST validate uploaded files are under 10MB and reject files that exceed this limit with error message
- **FR-004**: System MUST call n8n Worker Department webhook (POST to N8N_WORKER_WEBHOOK_URL) with tool_purpose, client_name, and source_document (extracted text)
- **FR-005**: System MUST provide a webhook receiver endpoint (POST /api/boss/webhooks/tool-ready) that accepts tool_id, generated_html, qa_score, qa_feedback, tool_purpose, client_name, document_type, source_document
- **FR-006**: Webhook receiver MUST validate required fields (tool_id, generated_html, qa_score) and return 400 Bad Request if missing
- **FR-007**: Webhook receiver MUST check for duplicate tool_id in MongoDB and return 409 Conflict if already exists
- **FR-008**: Webhook receiver MUST store tools in MongoDB fast_track_tools.tools collection with status "pending_review" and generated_timestamp set to current time
- **FR-009**: System MUST provide a preview endpoint (GET /api/boss/tools/:tool_id/preview) that returns the generated_html with proper Content-Type: text/html header
- **FR-010**: Frontend MUST display preview in a sandboxed iframe with sandbox="allow-scripts allow-same-origin" attributes
- **FR-011**: Frontend preview MUST offer three responsive modes: Desktop (100% width), Tablet (768px width), Mobile (375px width)
- **FR-012**: System MUST provide an approve endpoint (PUT /api/boss/tools/:tool_id/approve) that updates tool status to "approved" and boss_review_status to "approved"
- **FR-013**: Approve endpoint MUST call n8n deployment webhook (POST to N8N_DEPLOY_WEBHOOK_URL) with tool_id, generated_html, tool_purpose
- **FR-014**: Approve endpoint MUST update MongoDB with deployed_url, github_commit_sha, deployed_at timestamp after successful deployment
- **FR-015**: System MUST provide a reject endpoint (PUT /api/boss/tools/:tool_id/reject) that accepts boss_feedback and updates status to "rejected"
- **FR-016**: System MUST provide a revision endpoint (PUT /api/boss/tools/:tool_id/request-revision) that accepts boss_feedback and calls n8n revision webhook
- **FR-017**: All API endpoints MUST validate user authentication using Clerk JWT and check Boss email whitelist before processing
- **FR-018**: Upload UI MUST provide drag-and-drop functionality with visual feedback for drag-over state
- **FR-019**: Upload UI MUST show upload progress percentage and spinner during file processing
- **FR-020**: Dashboard MUST poll backend every 7 seconds using React Query to show newly arrived tools in real-time
- **FR-021**: Tool detail page MUST show tool metadata (tool_id, tool_purpose, client_name, qa_score, qa_feedback, status, timestamps)
- **FR-022**: Tool detail page MUST show action buttons (Approve & Deploy, Reject, Request Revision) based on current tool status
- **FR-023**: All UI components MUST follow Fast Track branding: colors (#000000, #FFFFFF, #FFF469), fonts (Plaak for headings, Riforma for body), bold minimalist brutalist style
- **FR-024**: System MUST show success toast notifications when actions (approve, reject, revision) complete successfully
- **FR-025**: System MUST show error messages with retry options when API calls fail or webhooks timeout

### Key Entities

- **Tool**: Represents an AI-generated HTML tool. Key attributes: tool_id (unique identifier with "tool_" prefix), source_document (original uploaded text), tool_purpose (what the tool does), client_name (who it's for), document_type (txt/md/pdf/docx), generated_html (the HTML code), generated_timestamp (when AI created it), status (pending_review/approved/rejected/deployed/revision_requested), qa_score (0-100 compliance score), qa_feedback (QA department comments), boss_review_status (approved/rejected/null), boss_feedback (Boss's comments), boss_reviewed_at (timestamp), deployed_url (live tool URL), deployed_at (deployment timestamp), github_commit_sha (Git commit hash), revision_history (array of previous versions). Relationships: belongs to one Client, has many Revisions.

- **User (Boss)**: Represents the authenticated Boss user. Key attributes: id (Clerk user ID), email (must be in whitelist), firstName, lastName. Relationships: reviews many Tools, creates many UploadRequests.

- **UploadRequest**: Represents a document upload action. Key attributes: request_id (unique identifier), file_name (original filename), file_size (bytes), file_type (txt/md/pdf/docx), tool_purpose (provided by Boss), client_name (provided by Boss), extracted_text (parsed content), upload_timestamp (when uploaded), worker_webhook_called_at (when Worker was triggered), status (uploading/processing/completed/failed). Relationships: belongs to one User (Boss), results in one Tool (after workflow completion).

- **WebhookPayload**: Represents data received from n8n workflows. Key attributes: webhook_id (unique identifier), webhook_type (tool-ready/deployment-result/revision-result), received_at (timestamp), payload_data (JSON), processing_status (pending/processed/failed). Relationships: creates or updates one Tool.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Boss can upload a .txt document, enter tool_purpose and client_name, and see the upload complete with success message in under 5 seconds (excluding n8n workflow time)
- **SC-002**: Generated tools appear in Boss's dashboard within 7 seconds of the n8n webhook call (due to React Query polling interval)
- **SC-003**: Boss can preview a tool in all three responsive modes (desktop/tablet/mobile) with preview loading in under 2 seconds
- **SC-004**: Boss can approve a tool and receive a deployed_url within 90 seconds (60s for Vercel deployment + 30s buffer)
- **SC-005**: Boss can reject a tool with feedback, and the tool immediately disappears from the "Pending Review" filter
- **SC-006**: System successfully parses and extracts text from .pdf files with 95% accuracy (tested with 20 sample documents)
- **SC-007**: System successfully parses and extracts text from .docx files preserving paragraph structure with 95% accuracy
- **SC-008**: File upload validates file size and rejects files over 10MB with error message displayed in under 1 second
- **SC-009**: Webhook receiver endpoint processes valid payloads and stores tools in MongoDB with average response time under 500ms
- **SC-010**: Webhook receiver returns 400 Bad Request for invalid payloads with descriptive error messages
- **SC-011**: All Fast Track branded components pass visual design review using only #000000, #FFFFFF, #FFF469 colors
- **SC-012**: Approve/reject/revision actions show immediate loading states and complete within 3 seconds (excluding external webhook time)
- **SC-013**: System handles concurrent tool arrivals via webhook without data corruption (tested with 10 simultaneous webhook calls)
- **SC-014**: Upload progress indicator accurately reflects file processing stages (uploading, parsing, calling Worker webhook)
- **SC-015**: Preview iframe sandbox prevents XSS attacks (tested with malicious HTML payloads)

## Assumptions and Constraints

### Assumptions
- n8n workflows (Worker, QA, Boss Office Storage) are already built and operational at their respective webhook URLs
- Boss has access to a Clerk account with email in the BOSS_EMAIL_WHITELIST environment variable
- MongoDB Atlas connection string (MONGODB_URI) is configured and database fast_track_tools exists
- n8n deployment webhook will be built separately and returns deployed_url and github_commit_sha in JSON response
- n8n revision webhook will be built separately (can be implemented after initial release)
- Uploaded documents are in English (no internationalization required in this phase)
- Boss reviews tools from a desktop browser (mobile Boss Office is out of scope)
- File uploads are initiated by Boss manually (no bulk upload or API upload)

### Constraints
- File upload size limited to 10MB due to Express.js default limits and reasonable processing time
- Preview iframe must use sandbox attribute for security, which may limit some advanced JavaScript features in generated tools
- React Query polling interval is 7 seconds, so there's a maximum 7-second delay before new tools appear in dashboard
- n8n Worker webhook timeout is 60 seconds; longer documents may fail to process
- PDF parsing accuracy depends on pdf-parse library limitations (scanned PDFs without OCR will fail)
- DOCX parsing accuracy depends on mammoth library limitations (complex formatting may be lost)
- Boss email whitelist is hardcoded in environment variable (no dynamic admin management)
- Deployed tools must be publicly accessible (no authentication on deployed tool URLs)
- Vercel deployment assumes Fast Track has Vercel account and GitHub repository configured in n8n workflow

## Out of Scope

- Analytics dashboard showing tool generation metrics (views, usage, performance)
- Multi-user Boss accounts with different permission levels (only single Boss email whitelist)
- Tool versioning UI showing revision history timeline
- Advanced search/filtering beyond basic status and text search (no date ranges, QA score filters, client filtering)
- Bulk operations (approve multiple tools at once, bulk reject, bulk download)
- Email notifications when tools are ready for review
- Integration with other file storage services (Google Drive, Dropbox) for document upload
- OCR processing for scanned PDFs
- Rich text editor for revision feedback (only plain textarea)
- Real-time collaboration (multiple Bosses reviewing same tool simultaneously)
- Tool preview with interactive testing (can't submit forms or test functionality in preview)
- Automated testing of generated HTML (no Playwright/Cypress integration)
- Custom branding per client (all tools use Fast Track branding)
- Tool expiration or archival policies
- Integration with project management tools (Jira, Linear, etc.)
- Public gallery of deployed tools
