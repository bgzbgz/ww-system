# WW Certificate Manager

Generates and distributes workshop completion certificates.

Upload a participant Excel file → review → generate PDFs → preview → send via n8n + Outlook.

## Stack

- **Backend** — FastAPI + Uvicorn (Python 3.11)
- **Frontend** — React 18 + TypeScript + Vite
- **Database / Storage** — Supabase (PostgreSQL + object storage)
- **PDF generation** — Puppeteer (Node 20, headless Chromium)
- **Email delivery** — n8n webhook → Outlook node

## Quick start (local)

**Requirements:** Python 3.11, Node 20, a Supabase project, an n8n instance.

```bash
# 1. Create cert-manager/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://your-n8n.cloud/webhook/cert-emails

# 2. Backend
cd backend
pip install -r requirements.txt
npm install            # installs Puppeteer for PDF rendering
uvicorn main:app --reload --port 8000

# 3. Frontend (dev server)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The frontend dev server proxies `/api/*` to the backend automatically.

## Deploy (Railway)

1. Push this repo to GitHub
2. New Railway project → Deploy from GitHub → select this repo
3. Add environment variables in Railway dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `N8N_WEBHOOK_URL`
4. Railway auto-detects the `Dockerfile` and deploys

The Dockerfile builds the React frontend and serves it through FastAPI — single service, single URL.

## Database

Run `backend/db/migrations/001_initial.sql` against your Supabase project once to create the schema.

## CI

GitHub Actions runs on every push to `main`:
- **Backend tests** — pytest (all services mocked, no external calls)
- **Frontend type check** — `tsc --noEmit`
- **Docker build** — verifies the production image compiles cleanly

## n8n workflow

Import `n8n-workflow.json` into your n8n instance. The workflow receives a webhook payload and sends the certificate via Outlook. Required fields in the payload: `email`, `full_name`, `first_name`, `certificate_url`.
