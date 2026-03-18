# Quickstart Guide: Boss Office Phase Completion

**Date**: 2026-01-22
**Feature**: Boss Office Phase Completion
**Purpose**: Developer setup instructions for implementing file upload, preview, and review workflow

---

## Prerequisites

Before starting implementation, ensure you have:

- **Node.js** 20 LTS installed ([https://nodejs.org](https://nodejs.org))
- **MongoDB Atlas** account with connection string
- **Clerk** authentication configured (publishable key)
- **n8n** instance with webhook URLs for:
  - Worker Department (tool generation)
  - QA Department (compliance scoring)
  - Boss Office Storage (stores QA-approved tools)
  - Deployment (deploys approved tools to Vercel/GitHub)
  - Revision (regenerates tools with Boss feedback)
- **Git** installed and configured
- **Code editor** (VS Code, Cursor, etc.)

---

## Project Structure

```
fast-track-tool-factory/
├── backend/               # Express.js API
├── boss-office-app/       # React frontend
└── specs/                 # Specifications
    └── 004-boss-office-completion/
        ├── spec.md
        ├── plan.md
        ├── research.md
        ├── data-model.md
        ├── contracts/
        └── quickstart.md  # This file
```

---

## Backend Setup

### Step 1: Install Dependencies

```bash
cd backend

# Install file parsing libraries
npm install pdf-parse mammoth

# Install file upload middleware
npm install multer

# Install TypeScript type definitions
npm install --save-dev @types/pdf-parse @types/mammoth @types/multer
```

### Step 2: Create Uploads Directory

```bash
# Create temporary file storage directory
mkdir -p uploads

# Add to .gitignore (don't commit uploaded files)
echo "uploads/" >> .gitignore
```

### Step 3: Configure Environment Variables

Edit `backend/.env` to add new environment variables:

```env
# Existing variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fast_track_tools?retryWrites=true&w=majority
CLERK_PUBLISHABLE_KEY=pk_test_...
BOSS_EMAIL_WHITELIST=boss@fasttrack.com,ivan.h@fasttrack-europe.com
JWT_SECRET=your-jwt-secret-here

# NEW: n8n Webhook URLs
N8N_WORKER_WEBHOOK_URL=https://n8n.fasttrack.com/webhook/worker-generate-tool
N8N_DEPLOY_WEBHOOK_URL=https://n8n.fasttrack.com/webhook/deploy-tool
N8N_REVISION_WEBHOOK_URL=https://n8n.fasttrack.com/webhook/request-revision

# NEW: Webhook Security
WEBHOOK_SECRET=your-shared-secret-with-n8n
```

**Important**: Replace placeholder URLs with your actual n8n webhook URLs.

### Step 4: Create MongoDB Indexes

Run the index creation script to optimize query performance:

```bash
node backend/scripts/create-indexes.js
```

This creates:
- Unique index on `tool_id`
- Compound index on `status` + `generated_timestamp` (for "Pending Review" filter)
- Index on `deployed_at` (for recent deployments)

### Step 5: Start Backend Development Server

```bash
cd backend
npm run dev
```

Backend should now be running at `http://localhost:3000`.

**Test Backend Health**:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd boss-office-app

# Install React Query v5 (if not already installed)
npm install @tanstack/react-query@5

# Install file upload UI library (optional but recommended)
npm install react-dropzone

# Verify Tailwind CSS v3 is installed (should already be)
npm list tailwindcss
# Expected: tailwindcss@3.x.x
```

### Step 2: Configure Fast Track Fonts

**Option A: If you have Fast Track font files:**

1. Copy font files to `boss-office-app/public/fonts/`:
   - `plaak-ex-condensed-bold.woff2`
   - `plaak-ex-condensed-bold.woff`
   - `riforma-ll-regular.woff2`
   - `riforma-ll-regular.woff`

2. Font loading is already configured in `index.css` (see research.md for details)

**Option B: If you don't have font files yet:**

The application will fall back to system fonts until you add the custom fonts.

### Step 3: Verify Tailwind Configuration

Check that `tailwind.config.js` includes Fast Track colors and fonts:

```javascript
// boss-office-app/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'fasttrack-black': '#000000',
        'fasttrack-white': '#FFFFFF',
        'fasttrack-yellow': '#FFF469',
        'fasttrack-grey': '#B2B2B2',
      },
      fontFamily: {
        'plaak': ['"Plaak Ex Condensed"', 'sans-serif'],
        'riforma': ['"Riforma LL"', 'sans-serif'],
        'sans': ['"Riforma LL"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Step 4: Start Frontend Development Server

```bash
cd boss-office-app
npm run dev
```

Frontend should now be running at `http://localhost:5173`.

---

## Verify Setup

### Test 1: Backend API

**Test Upload Endpoint (without file, to check validation)**:

```bash
curl -X POST http://localhost:3000/api/boss/upload \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -F "tool_purpose=Test Calculator" \
  -F "client_name=Test Client"
```

Expected response (400 error):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "No file uploaded"
}
```

**Test Webhook Receiver**:

```bash
curl -X POST http://localhost:3000/api/boss/webhooks/tool-ready \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-shared-secret-with-n8n" \
  -d '{
    "tool_id": "tool_test_001",
    "tool_purpose": "Test Tool",
    "client_name": "Test Client",
    "document_type": "txt",
    "source_document": "Test document content",
    "generated_html": "<!DOCTYPE html><html><body><h1>Test Tool</h1></body></html>",
    "qa_score": 85,
    "qa_feedback": "Good quality"
  }'
```

Expected response (200 success):
```json
{
  "success": true,
  "tool_id": "tool_test_001",
  "status": "pending_review",
  "stored_at": "2026-01-22T10:35:12.456Z"
}
```

### Test 2: Frontend Authentication

1. Open `http://localhost:5173` in browser
2. Sign in with Clerk using Boss email (`ivan.h@fasttrack-europe.com`)
3. Verify you see the Boss Office dashboard (not "Access Denied" screen)

### Test 3: End-to-End Flow

**Step 1: Upload a .txt document**

1. Navigate to `http://localhost:5173/upload`
2. Create a test file `test-tool.txt`:
   ```
   This is a test tool for budget calculation.
   It helps users track income and expenses.
   ```
3. Drag the file into the upload dropzone
4. Enter tool_purpose: "Budget Calculator"
5. Enter client_name: "Test Client"
6. Click "Upload"
7. Verify upload success message appears

**Step 2: Wait for Worker + QA workflow**

The n8n Worker workflow should:
1. Receive the uploaded text (via webhook)
2. Generate HTML tool using Google Gemini
3. Send to QA Department for compliance scoring
4. Send to Boss Office Storage (webhook receiver)

This typically takes 30-60 seconds.

**Step 3: Verify tool appears in dashboard**

1. Navigate to `http://localhost:5173/dashboard`
2. Wait up to 7 seconds for React Query polling to update
3. Verify new tool appears with status "Pending Review"
4. Click "View Details" to see tool detail page

**Step 4: Preview and approve**

1. On tool detail page, click "Preview" button
2. Verify preview modal opens with generated HTML
3. Test responsive modes (Desktop/Tablet/Mobile)
4. Close preview modal
5. Click "Approve & Deploy" button
6. Wait for deployment (60-90 seconds)
7. Verify deployed_url appears
8. Click deployed_url to open live tool in new tab

---

## Common Issues & Solutions

### Issue 1: File Upload Fails with "File too large"

**Symptom**: Upload fails with 413 Payload Too Large error

**Solution**: Check that file is under 10MB. If you need larger files, update multer config:

```typescript
// backend/src/api/middleware/fileUpload.ts
limits: {
  fileSize: 20 * 1024 * 1024, // Increase to 20MB
  files: 1
}
```

### Issue 2: PDF Parsing Returns Empty Text

**Symptom**: PDF upload succeeds but extracted_text is empty

**Solution**: This usually happens with scanned PDFs (images, no text). Use text-based PDFs only. Boss can use OCR tool before uploading.

### Issue 3: Webhook Receiver Returns 409 Conflict

**Symptom**: n8n Boss Office Storage workflow fails with "tool_id already exists"

**Solution**: This is expected if webhook is called twice with same tool_id (idempotency protection). Either:
- Use a different tool_id for new tools
- Delete the existing tool from MongoDB first: `db.tools.deleteOne({ tool_id: "tool_xxx" })`

### Issue 4: Worker Webhook Timeout

**Symptom**: Upload completes but tool never appears in dashboard

**Solution**: Worker webhook may have timed out (60s limit). Check n8n Worker logs. For large documents, consider:
- Compressing PDF files before upload
- Splitting very long documents into smaller sections

### Issue 5: Custom Fonts Not Loading

**Symptom**: UI shows system fonts instead of Plaak/Riforma

**Solution**:
1. Verify font files are in `boss-office-app/public/fonts/`
2. Check browser Network tab for 404 errors on font files
3. Verify font file names match exactly (case-sensitive)
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue 6: Approve Button Doesn't Work

**Symptom**: Clicking "Approve & Deploy" shows loading state but never completes

**Solution**: Check backend logs for deployment webhook errors. Verify:
- `N8N_DEPLOY_WEBHOOK_URL` is correct in `.env`
- n8n Deployment workflow is running
- n8n webhook returns valid JSON with `deployed_url`, `github_commit_sha`, `deployed_at`

---

## Development Workflow

### Recommended Development Order

1. **Backend File Upload** (1-2 hours)
   - Multer middleware
   - File parsers (txt, md, pdf, docx)
   - Upload endpoint
   - Worker webhook client

2. **Backend Webhook Receiver** (30 min)
   - Webhook receiver endpoint
   - MongoDB tool storage
   - Validation and error handling

3. **Backend Review Endpoints** (1 hour)
   - Approve endpoint + deployment webhook client
   - Reject endpoint
   - Revision endpoint + revision webhook client

4. **Frontend Upload Page** (1-2 hours)
   - File dropzone component
   - Upload form (tool_purpose, client_name)
   - Upload mutation hook
   - Progress UI and error handling

5. **Frontend Preview Modal** (1 hour)
   - Preview modal component
   - Responsive mode toggle (Desktop/Tablet/Mobile)
   - Iframe with sandbox

6. **Frontend Review Actions** (1-2 hours)
   - Approve button + mutation
   - Reject modal + mutation
   - Revision modal + mutation
   - Success/error toasts

7. **Fast Track Styling** (2-3 hours)
   - Apply black/white/yellow colors
   - Add Plaak/Riforma fonts
   - Bold minimalist brutalist design
   - Polish all components

8. **End-to-End Testing** (1 hour)
   - Test upload → Worker → QA → dashboard → preview → approve → deploy
   - Test reject workflow
   - Test revision workflow
   - Test edge cases (large files, invalid formats, webhook failures)

---

## Useful Commands

### Backend

```bash
# Start development server
npm run dev

# Run TypeScript compiler
npm run build

# Create MongoDB indexes
node scripts/create-indexes.js

# Insert test tool
node scripts/insert-test-tool.js

# Check MongoDB connection
node scripts/test-mongodb-connection.js
```

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run TypeScript type check
npm run type-check
```

### Database

```bash
# Connect to MongoDB Atlas (replace with your connection string)
mongosh "mongodb+srv://cluster.mongodb.net/fast_track_tools"

# View all tools
db.tools.find().pretty()

# View pending review tools only
db.tools.find({ status: "pending_review" }).pretty()

# Count tools by status
db.tools.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

# Delete test tools
db.tools.deleteMany({ tool_id: { $regex: /^tool_test_/ } })

# View recent webhook logs
db.webhook_logs.find().sort({ received_at: -1 }).limit(10).pretty()
```

---

## Next Steps

After completing quickstart setup:

1. **Review the plan** (`plan.md`) for full implementation details
2. **Generate tasks** using `/speckit.tasks` command
3. **Implement features** following task breakdown
4. **Test thoroughly** with real Fast Track sprint documents
5. **Deploy to production** after Boss approves first 3 tools

---

## Support

For questions or issues:
- **Specification**: See `spec.md` for requirements
- **Planning**: See `plan.md` for architecture decisions
- **Research**: See `research.md` for technical details
- **Data Model**: See `data-model.md` for entity definitions
- **API Contracts**: See `contracts/` for endpoint specifications

---

**Quickstart Status**: ✅ Ready for Development
**Estimated Setup Time**: 30-45 minutes
**Next Command**: `/speckit.tasks` (generate implementation tasks)
