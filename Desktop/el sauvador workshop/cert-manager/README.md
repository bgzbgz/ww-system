# Workshop Certificate System

A full-stack web app that generates and distributes personalised PDF certificates for workshop participants.

Upload a participant spreadsheet → review and edit → generate PDFs → preview → send via email.

---

## Features

- **Excel upload** — accepts `.xlsx`/`.xls` with automatic validation and warning detection (missing emails, duplicates, bad formats)
- **Review & edit** — inspect all participants in an editable table before proceeding
- **PDF generation** — headless Chromium renders each certificate from an HTML template; up to 5 generated concurrently
- **Layout editor** — drag and reposition text blocks (name, company, date) directly in the browser
- **Email delivery** — sends via an n8n webhook → Microsoft Outlook; failed emails can be retried individually
- **Status dashboard** — real-time delivery tracking with success/failure counts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.111 + Uvicorn (Python 3.11) |
| Frontend | React 18 + TypeScript + Vite |
| PDF rendering | Puppeteer 21 (Node 20, headless Chromium) |
| Database & storage | Supabase (PostgreSQL + S3-compatible object storage) |
| Email delivery | n8n webhook → Microsoft Outlook |
| Deployment | Docker → Railway |

---

## Project Structure

```
cert-manager/
├── backend/
│   ├── api/               # FastAPI route handlers (upload, generate, email, workshops, participants, auth)
│   ├── db/
│   │   ├── client.py      # Supabase client singleton
│   │   └── migrations/    # SQL schema (run once against Supabase)
│   ├── models/            # Pydantic request/response models
│   ├── services/
│   │   ├── excel_parser.py    # Parses .xlsx, validates columns, detects warnings
│   │   ├── pdf_generator.py   # Async PDF generation with layout injection
│   │   └── webhook_sender.py  # POSTs to n8n webhook for each participant
│   ├── templates/
│   │   └── certificate_base.html  # Certificate HTML template with {{placeholders}}
│   ├── render.js          # Puppeteer script: HTML file → PDF
│   ├── main.py            # FastAPI app entry point + SPA fallback
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts       # API wrapper functions
│   │   ├── components/         # StepNav, ProgressBar, ParticipantTable, CertEditor
│   │   ├── pages/              # Upload, Review, Generate, PreviewCerts, Send, Status
│   │   ├── types/index.ts      # TypeScript interfaces and enums
│   │   └── App.tsx             # React Router setup (6 routes)
│   └── vite.config.ts          # Proxies /api/* and /auth/* to backend in dev
├── Dockerfile             # Multi-stage build: React build → Python + Node + Chromium
└── n8n-workflow.json      # Import this into your n8n instance
```

---

## Local Development

**Requirements:** Python 3.11, Node 20, a Supabase project, an n8n instance.

### 1. Environment variables

Create `cert-manager/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://your-n8n.cloud/webhook/cert-emails

# Microsoft OAuth (optional — only needed for /auth routes)
MS_CLIENT_ID=your-azure-app-client-id
MS_CLIENT_SECRET=your-azure-app-client-secret
MS_TENANT_ID=your-azure-tenant-id
MS_REDIRECT_URI=http://localhost:8000/auth/callback
```

### 2. Database

Run the migration once against your Supabase project:

```bash
# Paste backend/db/migrations/001_initial.sql into the Supabase SQL editor
```

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
npm install          # installs Puppeteer (headless Chromium for PDF rendering)
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api/*` and `/auth/*` to `http://localhost:8000` automatically.

---

## Deployment (Railway)

The app ships as a single Docker container — FastAPI serves the compiled React frontend alongside the API.

1. Push this repo to GitHub
2. Create a new Railway project → **Deploy from GitHub** → select this repo
3. Add environment variables in the Railway dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `N8N_WEBHOOK_URL`
   - `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_TENANT_ID`, `MS_REDIRECT_URI`
4. Railway auto-detects the `Dockerfile` and deploys — one service, one URL

The Dockerfile uses a multi-stage build: Node 20 compiles the React app, then Python 3.11 + Node + Chromium runs the server.

---

## n8n Workflow

Import `n8n-workflow.json` into your n8n instance. The workflow listens on a webhook and sends each certificate via Microsoft Outlook.

Expected webhook payload:

```json
{
  "email": "participant@example.com",
  "full_name": "Jane Smith",
  "first_name": "Jane",
  "certificate_url": "https://your-storage.supabase.co/...",
  "workshop_name": "El Salvador Workshop"
}
```

---

## API Reference

### Upload

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload `.xlsx` file; returns `workshop_id`, `participant_count`, `warning_count` |

### Workshops

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workshops/{id}` | Workshop details and status |
| `POST` | `/api/workshops/{id}/generate` | Start background PDF generation |
| `GET` | `/api/workshops/{id}/progress` | `{ total, done }` — poll during generation |
| `PATCH` | `/api/workshops/{id}/layout` | Save certificate layout JSON |
| `GET` | `/api/workshops/{id}/cert-preview` | HTML preview of the certificate |
| `POST` | `/api/workshops/{id}/send` | Send all certificates via n8n webhook |

### Participants

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workshops/{id}/participants` | List all participants (includes warning flags) |
| `PATCH` | `/api/participants/{id}` | Edit name, email, or company |
| `DELETE` | `/api/participants/{id}` | Remove a participant |
| `POST` | `/api/participants/{id}/retry` | Resend certificate to a single participant |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/login` | Redirect to Microsoft OAuth2 login |
| `GET` | `/auth/callback` | Exchange OAuth code for refresh token |

### Debug

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/debug/env` | Check which environment variables are set |

---

## Database Schema

Three tables in Supabase (PostgreSQL):

**`workshops`** — one row per uploaded spreadsheet
Fields: `id`, `name`, `status` (`draft → generating → ready → sent`), `layout_json`, `template_path`, `email_subject`, `scheduled_at`, `sent_at`

**`participants`** — one row per person
Fields: `id`, `workshop_id`, `full_name`, `first_name`, `email`, `company`, `position`, `certificate_url`, `email_status` (`pending / sent / failed`), `email_error`, `email_sent_at`

**`oauth_tokens`** — stores Microsoft refresh tokens
Fields: `provider`, `refresh_token`, `updated_at`

---

## CI

GitHub Actions runs on every push to `main`:

- **Backend tests** — pytest (all external services mocked)
- **Frontend type check** — `tsc --noEmit`
- **Docker build** — verifies the production image compiles cleanly
