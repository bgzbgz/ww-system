# Certificate Distribution System — Design Spec
**Date:** 2026-03-19
**Project:** Fast Track Workshop Certificate Manager
**Status:** Approved

---

## Overview

A self-contained web application that replaces the existing N8N + Google Drive + manual workflow. An admin uploads an Excel file, edits an HTML/CSS certificate template visually, generates PDFs for all participants, and schedules delivery via Outlook. No external automation tools, no designer dependency.

---

## Architecture

**Single Railway service** — FastAPI (Python) backend serves the built React (Vite) frontend as static files. One deployment, one URL, one service to manage.

```
React (Vite) → FastAPI → Supabase (DB + Storage)
                       → Node.js/Puppeteer script (PDF generation, subprocess)
                       → Microsoft Graph API (Outlook email)
                       → APScheduler + SQLAlchemy job store (scheduling)
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React + Vite | Admin UI — upload, review, edit, schedule |
| Backend | Python FastAPI | API, orchestration, scheduling |
| Database | Supabase (PostgreSQL) | Participants, workshops, delivery status |
| File Storage | Supabase Storage | Certificate PDFs, HTML templates, Excel uploads |
| PDF Generation | Puppeteer (Node.js subprocess) | Renders HTML/CSS template to PDF |
| Email Delivery | Microsoft Graph API (OAuth 2.0) | Sends personalized Outlook emails with PDF attached |
| Scheduling | APScheduler + SQLAlchemyJobStore | Persists scheduled jobs across restarts in Supabase DB |
| Hosting | Railway | Always-on cloud deployment (~$5/mo) |

---

## Data Model

### Table: `workshops`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | e.g. "El Salvador Workshop March 2026" |
| created_at | timestamp | |
| status | enum | `draft → generating → ready → scheduled → sent` |
| scheduled_at | timestamptz | Stored as UTC. Admin input converted from UTC-6 (El Salvador). |
| sent_at | timestamptz | |
| template_path | text | Supabase Storage path to base HTML certificate template |
| layout_json | jsonb | Stores text block positions and styles (see Template Editor section) |
| email_subject | text | Subject line template, e.g. `"Your Fast Track Certificate, {{first_name}}"` |
| email_body_path | text | Supabase Storage path to HTML email body template |

**Status transition rules:**
- `draft → generating`: triggered when admin clicks "Generate All Certificates"
- `generating → ready`: set by backend when all PDFs are complete
- `ready → scheduled`: set when admin saves a scheduled time
- `ready → sent`: set when admin clicks "Send Now" (bypasses scheduling)
- `scheduled → sent`: set by APScheduler after emails fire
- Re-generation is allowed: admin can return to the editor, fix names, and re-run generation. Status reverts to `generating` then `ready`. Any existing `scheduled` job is cancelled and must be rescheduled.

### Table: `participants`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| workshop_id | uuid FK | → workshops.id |
| first_name | text | Parsed from `full_name` (first token) |
| full_name | text | |
| email | text | |
| company | text | |
| certificate_url | text | Supabase Storage public URL of generated PDF |
| email_status | enum | `pending → sent → failed` |
| email_error | text | Error message if `email_status = failed` |
| email_sent_at | timestamptz | |
| position | text | Optional — parsed from Excel, not used in certificates/emails |

### Table: `oauth_tokens`

| Column | Type | Notes |
|--------|------|-------|
| provider | text PK | e.g. `"microsoft"` |
| refresh_token | text | Rotated after each use |
| updated_at | timestamptz | |

### Supabase Storage Buckets

| Bucket | Contents |
|--------|----------|
| `templates/` | HTML certificate templates and HTML email body templates |
| `certificates/` | Generated PDFs — `{workshop_id}/{participant_id}.pdf` |
| `uploads/` | Temporary Excel files, deleted after parsing |

### Security: Supabase Key Strategy
- All Supabase access goes through FastAPI (backend only)
- Backend uses the **service role key** stored as a Railway environment variable
- Frontend never holds a Supabase key — it talks to FastAPI endpoints only
- The Supabase anon key is not used anywhere

---

## Environment Variables (Railway)

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_TENANT_ID=
MS_REFRESH_TOKEN=        # stored here initially; see OAuth section
DATABASE_URL=            # Supabase Postgres connection string for APScheduler
```

---

## Admin Workflow

### Step 1 — Upload Excel (`/`)
- Admin drops `.xlsx` or `.xls` file
- Backend parses with `openpyxl`:
  - Scans row 1 for headers (case-insensitive match): `full name`, `email`, `company`, `position` (optional, stored but unused)
  - `first_name` derived by splitting `full_name` on first space
  - Flags: missing email, malformed email format (regex), duplicate `full_name` within same upload
- Participants saved to Supabase, workshop record created with status `draft`
- Admin redirected to `/review`

### Step 2 — Review Participants (`/review`)
- Table view of all participants with inline edit on each row (name, email, company)
- Warning badge per row for: missing email, malformed email, duplicate name
- "Proceed" button disabled until zero warnings remain
- Deleting a duplicate row counts as resolving that warning
- On proceed → admin goes to `/editor`

### Step 3 — Edit Certificate Template (`/editor`)
- HTML/CSS certificate base template loaded from Supabase Storage
- Template tokens: `{{full_name}}`, `{{first_name}}`, `{{company}}`, `{{date}}`
- Admin interactions:
  - Drag text blocks to reposition
  - Click a block to edit: font family, font size (px), color (hex), bold, italic
  - Dropdown: "Preview as participant" — swaps in a real name from the list
  - "Apply to All" — saves current `layout_json` to the workshop record
- Layout stored as `workshops.layout_json` with this schema:
  ```json
  {
    "full_name": { "x": "42%", "y": "38%", "font": "Playfair Display", "size": 36, "color": "#1a1a1a", "bold": true, "italic": false },
    "company":   { "x": "42%", "y": "48%", "font": "Montserrat", "size": 18, "color": "#555555", "bold": false, "italic": false },
    "date":      { "x": "42%", "y": "58%", "font": "Montserrat", "size": 14, "color": "#888888", "bold": false, "italic": false }
  }
  ```
- Positions are **percentage-based** (relative to certificate dimensions) to stay consistent between browser viewport and Puppeteer render
- Backend applies layout by injecting inline styles into the HTML before passing to Puppeteer

### Step 4 — Generate PDFs (`/generate`)
- Admin clicks "Generate All Certificates"
- Backend sets workshop status → `generating`
- For each participant, backend:
  1. Loads base HTML template from Supabase Storage
  2. Substitutes `{{tokens}}` with participant data
  3. Applies `layout_json` as inline styles on text blocks
  4. Writes hydrated HTML to a temp file
  5. Calls `node render.js <tempfile> <outputpath>` as subprocess
  6. Uploads resulting PDF to Supabase Storage `certificates/{workshop_id}/{participant_id}.pdf`
  7. Sets `participants.certificate_url`
- Frontend polls `/api/workshops/{id}/progress` every 2 seconds — shows progress bar (e.g. "34 / 82")
- Max concurrency: 5 Puppeteer renders at a time (to stay within Railway 512MB RAM limit)
- On completion: workshop status → `ready`, admin redirected to `/schedule`

### Step 5 — Schedule Send (`/schedule`)
- Shows "X certificates generated — ready to send"
- Admin picks date + time; timezone selector defaults to **UTC-6 (El Salvador, no DST)**
- Input converted to UTC before storing in `workshops.scheduled_at`
- "Schedule Send" → APScheduler registers job, workshop status → `scheduled`
- "Send Now" → triggers send immediately, skips scheduling
- Once scheduled, a summary card shows the scheduled time and a "Cancel Schedule" option

### Step 6 — Monitor Delivery (`/status`)
- Summary cards: Sent / Failed / Skipped (no email)
- Per-participant table with status badge
- Failed rows show error reason (from `participants.email_error`)
- "Retry" button per failed participant — re-triggers Graph API send for that person only
- Page auto-refreshes via polling while sends are in progress

---

## Certificate Generation Detail

### Puppeteer Subprocess Interface

Railway build installs both Python and Node.js runtimes. The `render.js` script:
- Accepts two CLI args: `input_html_path` and `output_pdf_path`
- Launches Puppeteer headless, loads the HTML file, prints to PDF at A4 size
- Exits with code 0 on success, 1 on error (stderr contains error message)

FastAPI calls it as:
```python
result = subprocess.run(
    ["node", "render.js", input_path, output_path],
    capture_output=True, text=True, timeout=30
)
if result.returncode != 0:
    raise RuntimeError(result.stderr)
```

### Railway Build Configuration (`railway.toml` or `Dockerfile`)
```
# Install Node.js alongside Python
# npm install puppeteer
# pip install -r requirements.txt
# npm run build (Vite)
```

---

## Email Delivery Detail

### Microsoft Graph API — OAuth Token Management
- Uses **Authorization Code flow** (not client credentials) — sends mail as the admin user
- Initial setup: admin completes OAuth consent flow once via a `/auth/login` route, which stores the resulting `refresh_token` in Supabase (table: `oauth_tokens`, one row per provider)
- At send time, backend exchanges `refresh_token` for an `access_token`
- New `refresh_token` returned by Graph is immediately written back to Supabase — this handles token rotation correctly
- `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_TENANT_ID` remain as Railway env vars (they don't rotate)

### Table: `oauth_tokens`
| Column | Type |
|--------|------|
| provider | text PK | e.g. `"microsoft"` |
| refresh_token | text | |
| updated_at | timestamptz | |

### Send Logic
- Emails sent sequentially with a **2-second delay** between each to stay under Graph API throttle limits (~30/min)
- On HTTP 429 (rate limited): exponential back-off (wait `Retry-After` header value, max 60s, retry up to 3 times)
- On any other failure: mark `participants.email_status = failed`, store error in `email_error`, continue to next participant
- If the send job is interrupted mid-batch (process crash): on next startup, APScheduler re-fires the job; backend skips participants already marked `sent`

### Email Body Template
- Stored in Supabase Storage `templates/email_body.html`
- Tokens: `{{first_name}}`, `{{full_name}}`, `{{company}}`, `{{certificate_url}}`
- Email subject: stored in `workshops.email_subject`, also supports `{{first_name}}` token
- The default template mirrors the existing `email-body.html` in this project (Fast Track branding, CTA button, LinkedIn instructions, recommended skills)

---

## Scheduling Detail

- APScheduler configured with `SQLAlchemyJobStore` pointing to Supabase PostgreSQL via `DATABASE_URL`
- Jobs persist across Railway restarts and redeploys
- On FastAPI startup: APScheduler starts and resumes any registered jobs automatically
- Job registered as: `send_workshop_emails(workshop_id=<id>)` at `trigger='date', run_date=workshops.scheduled_at`

---

## Frontend Routes

| Route | Screen | Unlocks when |
|-------|--------|-------------|
| `/` | Upload Excel | Always |
| `/review` | Participants table | After successful upload |
| `/editor` | Certificate template editor | After zero warnings in review |
| `/generate` | PDF generation + progress | After editor save |
| `/schedule` | Schedule date/time | After all PDFs generated |
| `/status` | Delivery status | After scheduled or sent |

---

## Excel Column Contract

- Header row is always **row 1**
- Column name matching is **case-insensitive** and **trims whitespace**
- Required columns: `full name`, `email`, `company`
- Optional column: `position` (parsed and stored as `participants.position` but not used in certificates or emails)
- Unknown columns are ignored
- If any required column is missing, upload is rejected with a clear error: `"Column 'email' not found. Found columns: Name, Empresa, Correo — please rename to match expected headers."`

---

## Out of Scope

- Multi-user authentication (single admin, no login UI beyond OAuth setup)
- LinkedIn integration
- Email open/click tracking
- Google Drive dependency
- N8N dependency
- Batch ZIP download of all certificates
- White-labelling / multi-tenant
