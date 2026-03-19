# Certificate Distribution System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained web app where an admin uploads an Excel file, visually edits a certificate template, generates PDFs via Puppeteer, and schedules delivery via Outlook — replacing N8N entirely.

**Architecture:** Single Railway service — FastAPI (Python) serves the built React (Vite) frontend as static files. Supabase stores all data and files. APScheduler with SQLAlchemyJobStore handles email scheduling across restarts.

**Tech Stack:** Python 3.11, FastAPI, openpyxl, APScheduler, supabase-py, httpx | Node.js 20, Puppeteer | React 18, Vite, TypeScript, React Router v6 | Supabase (Postgres + Storage) | Railway

---

## File Map

```
cert-manager/
├── backend/
│   ├── main.py                      # FastAPI app — mounts API routers + serves React dist/
│   ├── requirements.txt
│   ├── render.js                    # Node.js Puppeteer script: renders HTML file → PDF
│   ├── package.json                 # { "dependencies": { "puppeteer": "^21" } }
│   ├── api/
│   │   ├── __init__.py
│   │   ├── workshops.py             # GET/PATCH /api/workshops, GET /api/workshops/{id}/progress
│   │   ├── participants.py          # GET/PATCH/DELETE /api/workshops/{id}/participants
│   │   ├── upload.py                # POST /api/upload
│   │   ├── generate.py              # POST /api/workshops/{id}/generate
│   │   ├── email.py                 # POST /api/workshops/{id}/schedule, /send, /retry/{pid}
│   │   └── auth.py                  # GET /auth/login, GET /auth/callback
│   ├── services/
│   │   ├── __init__.py
│   │   ├── excel_parser.py          # parse_excel(path) → list[dict]
│   │   ├── pdf_generator.py         # generate_workshop_pdfs(workshop_id) async
│   │   ├── email_sender.py          # send_workshop_emails(workshop_id) async
│   │   └── scheduler.py             # APScheduler singleton + job helpers
│   ├── db/
│   │   ├── __init__.py
│   │   ├── client.py                # Supabase client singleton
│   │   └── migrations/
│   │       └── 001_initial.sql      # All tables + enum types
│   ├── models/
│   │   ├── __init__.py
│   │   ├── workshop.py              # WorkshopCreate, WorkshopOut, WorkshopStatus enum
│   │   └── participant.py           # ParticipantOut, ParticipantUpdate
│   └── tests/
│       ├── conftest.py              # pytest fixtures (test client, mock supabase)
│       ├── test_excel_parser.py
│       ├── test_pdf_generator.py
│       ├── test_email_sender.py
│       └── test_api_upload.py
├── frontend/
│   ├── index.html
│   ├── vite.config.ts               # proxy /api → backend in dev
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                  # React Router v6 routes
│       ├── api/
│       │   └── client.ts            # Typed fetch wrappers for every endpoint
│       ├── pages/
│       │   ├── Upload.tsx           # Step 1 — drag + drop Excel
│       │   ├── Review.tsx           # Step 2 — participant table + inline edit
│       │   ├── Editor.tsx           # Step 3 — certificate template drag editor
│       │   ├── Generate.tsx         # Step 4 — progress bar + generate trigger
│       │   ├── Schedule.tsx         # Step 5 — date/time picker + send now
│       │   └── Status.tsx           # Step 6 — delivery status + retry
│       ├── components/
│       │   ├── StepNav.tsx          # Top step indicator bar
│       │   ├── ParticipantTable.tsx # Reusable table with inline edit + warning badges
│       │   ├── CertEditor.tsx       # Drag-to-reposition text blocks on certificate preview
│       │   └── ProgressBar.tsx      # Polls /progress, animated bar
│       └── types/
│           └── index.ts             # Workshop, Participant, LayoutJson TypeScript types
├── Dockerfile                       # Multi-stage: Node (Vite build + Puppeteer) + Python
├── railway.toml                     # Start command
└── .env.example
```

---

## Phase 1: Foundation

### Task 1: Scaffold project structure + dependencies

**Files:**
- Create: `cert-manager/backend/requirements.txt`
- Create: `cert-manager/backend/package.json`
- Create: `cert-manager/frontend/package.json`
- Create: `cert-manager/.env.example`
- Create: `cert-manager/backend/main.py`

- [ ] **Step 1: Create the top-level directory and backend requirements**

```
cert-manager/backend/requirements.txt
```
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
python-multipart==0.0.9
openpyxl==3.1.2
supabase==2.4.3
httpx==0.27.0
apscheduler==3.10.4
sqlalchemy==2.0.29
psycopg2-binary==2.9.9
python-dotenv==1.0.1
pytest==8.2.0
pytest-asyncio==0.23.6
httpx[asyncio]==0.27.0
```

- [ ] **Step 2: Create backend package.json for Puppeteer**

```
cert-manager/backend/package.json
```
```json
{
  "name": "cert-renderer",
  "version": "1.0.0",
  "dependencies": {
    "puppeteer": "^21.0.0"
  }
}
```

- [ ] **Step 3: Create frontend package.json**

```
cert-manager/frontend/package.json
```
```json
{
  "name": "cert-manager-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.5",
    "vite": "^5.2.11"
  }
}
```

- [ ] **Step 4: Create .env.example**

```
cert-manager/.env.example
```
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
MS_CLIENT_ID=your-azure-app-client-id
MS_CLIENT_SECRET=your-azure-app-client-secret
MS_TENANT_ID=your-azure-tenant-id
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

- [ ] **Step 5: Create FastAPI skeleton**

```
cert-manager/backend/main.py
```
```python
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from api import workshops, participants, upload, generate, email, auth
from services.scheduler import start_scheduler

app = FastAPI(title="Certificate Manager")

# API routers
app.include_router(upload.router, prefix="/api")
app.include_router(workshops.router, prefix="/api")
app.include_router(participants.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(email.router, prefix="/api")
app.include_router(auth.router)

# Serve React frontend (production)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(frontend_dist, "index.html"))


@app.on_event("startup")
async def on_startup():
    start_scheduler()
```

- [ ] **Step 6: Create stub files for all modules so imports don't fail**

Create empty `__init__.py` in `backend/api/`, `backend/services/`, `backend/db/`, `backend/models/`.

Create stub routers (just a `router = APIRouter()` in each api file — full implementation comes later).

- [ ] **Step 7: Install dependencies + verify the app starts**

```bash
cd cert-manager/backend
pip install -r requirements.txt
npm install
uvicorn main:app --reload
```
Expected: `Application startup complete.` with no import errors.

- [ ] **Step 8: Commit**

```bash
git add cert-manager/
git commit -m "feat: scaffold cert-manager project structure"
```

---

### Task 2: Supabase database schema

**Files:**
- Create: `cert-manager/backend/db/migrations/001_initial.sql`
- Create: `cert-manager/backend/db/client.py`

- [ ] **Step 1: Write the SQL migration**

```
cert-manager/backend/db/migrations/001_initial.sql
```
```sql
-- Enums
CREATE TYPE workshop_status AS ENUM ('draft', 'generating', 'ready', 'scheduled', 'sent');
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed');

-- Workshops
CREATE TABLE workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status workshop_status NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    template_path TEXT,
    layout_json JSONB,
    email_subject TEXT DEFAULT 'Your Fast Track Certificate, {{first_name}}',
    email_body_path TEXT DEFAULT 'templates/email_body.html'
);

-- Participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    company TEXT NOT NULL,
    position TEXT,
    certificate_url TEXT,
    email_status email_status NOT NULL DEFAULT 'pending',
    email_error TEXT,
    email_sent_at TIMESTAMPTZ
);

-- OAuth tokens (one row per provider, upserted on token refresh)
CREATE TABLE oauth_tokens (
    provider TEXT PRIMARY KEY,
    refresh_token TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- APScheduler job store table (created automatically by APScheduler on first run,
-- but listing here for documentation)
-- Table name: apscheduler_jobs
```

- [ ] **Step 2: Run migration in Supabase dashboard**

Go to your Supabase project → SQL Editor → paste and run `001_initial.sql`.

Verify: all 3 tables appear in the Table Editor.

- [ ] **Step 3: Create Supabase client**

```
cert-manager/backend/db/client.py
```
```python
import os
from supabase import create_client, Client

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        _client = create_client(url, key)
    return _client
```

- [ ] **Step 4: Commit**

```bash
git add cert-manager/backend/db/
git commit -m "feat: add supabase schema migration and client"
```

---

### Task 3: Dockerfile + Railway config

**Files:**
- Create: `cert-manager/Dockerfile`
- Create: `cert-manager/railway.toml`

- [ ] **Step 1: Write multi-stage Dockerfile**

```
cert-manager/Dockerfile
```
```dockerfile
# Stage 1: Build React frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final image — Python + Node.js + Puppeteer
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    # Puppeteer dependencies
    && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 libatk-bridge2.0-0 libcups2 libdrm2 \
    libgbm1 libgtk-3-0 libnss3 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Write railway.toml**

```
cert-manager/railway.toml
```
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port 8000"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

- [ ] **Step 3: Commit**

```bash
git add cert-manager/Dockerfile cert-manager/railway.toml
git commit -m "feat: add dockerfile and railway config"
```

---

## Phase 2: Excel Upload + Participant Review

### Task 4: Excel parser service (TDD)

**Files:**
- Create: `cert-manager/backend/services/excel_parser.py`
- Create: `cert-manager/backend/tests/test_excel_parser.py`
- Create: `cert-manager/backend/tests/fixtures/valid.xlsx` (hand-crafted test file)
- Create: `cert-manager/backend/tests/fixtures/missing_col.xlsx`

- [ ] **Step 1: Create test fixtures using openpyxl**

```
cert-manager/backend/tests/conftest.py
```
```python
import os
import pytest
import openpyxl

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)

def make_valid_xlsx():
    path = os.path.join(FIXTURES_DIR, "valid.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Full Name", "Email", "Company", "Position"])
    ws.append(["María García", "m.garcia@banco.com", "Banco Agrícola", "Director"])
    ws.append(["Carlos López", "c.lopez@siman.com", "Almacenes Siman", "CEO"])
    ws.append(["Ana Rodríguez", "", "Applaudo", ""])  # missing email — warning
    wb.save(path)
    return path

def make_missing_col_xlsx():
    path = os.path.join(FIXTURES_DIR, "missing_col.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Nombre", "Correo", "Empresa"])  # wrong column names
    ws.append(["María García", "m.garcia@banco.com", "Banco Agrícola"])
    wb.save(path)
    return path

# Generate fixtures at collection time
make_valid_xlsx()
make_missing_col_xlsx()
```

- [ ] **Step 2: Write failing tests**

```
cert-manager/backend/tests/test_excel_parser.py
```
```python
import pytest
import os
from services.excel_parser import parse_excel, ExcelParseError

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")

def test_parse_valid_file_returns_correct_rows():
    rows = parse_excel(os.path.join(FIXTURES, "valid.xlsx"))
    assert len(rows) == 3
    assert rows[0]["full_name"] == "María García"
    assert rows[0]["first_name"] == "María"
    assert rows[0]["email"] == "m.garcia@banco.com"
    assert rows[0]["company"] == "Banco Agrícola"
    assert rows[0]["position"] == "Director"

def test_parse_derives_first_name_from_full_name():
    rows = parse_excel(os.path.join(FIXTURES, "valid.xlsx"))
    assert rows[1]["first_name"] == "Carlos"

def test_parse_missing_email_sets_empty_string():
    rows = parse_excel(os.path.join(FIXTURES, "valid.xlsx"))
    assert rows[2]["email"] == ""

def test_parse_column_matching_is_case_insensitive(tmp_path):
    import openpyxl
    path = tmp_path / "case.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["FULL NAME", "EMAIL", "COMPANY"])
    ws.append(["Test Person", "test@example.com", "TestCo"])
    wb.save(path)
    rows = parse_excel(str(path))
    assert rows[0]["full_name"] == "Test Person"

def test_parse_raises_on_missing_required_column():
    with pytest.raises(ExcelParseError) as exc:
        parse_excel(os.path.join(FIXTURES, "missing_col.xlsx"))
    assert "full name" in str(exc.value).lower()
    assert "found columns" in str(exc.value).lower()

def test_parse_flags_duplicate_names(tmp_path):
    import openpyxl
    path = tmp_path / "dupes.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Full Name", "Email", "Company"])
    ws.append(["María García", "a@a.com", "CoA"])
    ws.append(["María García", "b@b.com", "CoB"])
    wb.save(path)
    rows = parse_excel(str(path))
    assert rows[0]["warning"] == "duplicate_name"
    assert rows[1]["warning"] == "duplicate_name"
```

- [ ] **Step 3: Run tests — verify they all fail**

```bash
cd cert-manager/backend
pytest tests/test_excel_parser.py -v
```
Expected: all tests FAIL with `ImportError: cannot import name 'parse_excel'`

- [ ] **Step 4: Implement excel_parser.py**

```
cert-manager/backend/services/excel_parser.py
```
```python
import re
from collections import Counter
import openpyxl

REQUIRED_COLS = ["full name", "email", "company"]
OPTIONAL_COLS = ["position"]
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ExcelParseError(Exception):
    pass


def parse_excel(path: str) -> list[dict]:
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active

    # Build header map: {normalised_name: col_index}
    raw_headers = [str(cell.value or "").strip() for cell in ws[1]]
    header_map = {h.lower(): i for i, h in enumerate(raw_headers)}

    # Validate required columns
    for col in REQUIRED_COLS:
        if col not in header_map:
            found = ", ".join(raw_headers) if raw_headers else "none"
            raise ExcelParseError(
                f"Column '{col}' not found. Found columns: {found} — "
                f"please rename to match expected headers."
            )

    def get(row, col_name):
        idx = header_map.get(col_name)
        if idx is None:
            return ""
        val = row[idx].value
        return str(val).strip() if val is not None else ""

    rows = []
    for row in ws.iter_rows(min_row=2):
        if all(cell.value is None for cell in row):
            continue  # skip blank rows
        full_name = get(row, "full name")
        email = get(row, "email")
        company = get(row, "company")
        position = get(row, "position")
        first_name = full_name.split()[0] if full_name else ""

        warning = None
        if not email:
            warning = "missing_email"
        elif not EMAIL_RE.match(email):
            warning = "invalid_email"

        rows.append({
            "full_name": full_name,
            "first_name": first_name,
            "email": email,
            "company": company,
            "position": position,
            "warning": warning,
        })

    # Flag duplicates (overrides previous warning)
    name_counts = Counter(r["full_name"] for r in rows)
    for row in rows:
        if name_counts[row["full_name"]] > 1:
            row["warning"] = "duplicate_name"

    return rows
```

- [ ] **Step 5: Run tests — verify they all pass**

```bash
pytest tests/test_excel_parser.py -v
```
Expected: all 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add cert-manager/backend/services/excel_parser.py cert-manager/backend/tests/
git commit -m "feat: add excel parser service with TDD"
```

---

### Task 5: Upload API endpoint

**Files:**
- Create: `cert-manager/backend/api/upload.py`
- Create: `cert-manager/backend/api/workshops.py`
- Create: `cert-manager/backend/models/workshop.py`
- Create: `cert-manager/backend/models/participant.py`
- Create: `cert-manager/backend/tests/test_api_upload.py`

- [ ] **Step 1: Define Pydantic models**

```
cert-manager/backend/models/workshop.py
```
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class WorkshopStatus(str, Enum):
    draft = "draft"
    generating = "generating"
    ready = "ready"
    scheduled = "scheduled"
    sent = "sent"

class WorkshopOut(BaseModel):
    id: str
    name: str
    status: WorkshopStatus
    created_at: datetime
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    template_path: Optional[str] = None
    layout_json: Optional[dict] = None
    email_subject: Optional[str] = None
```

```
cert-manager/backend/models/participant.py
```
```python
from pydantic import BaseModel
from typing import Optional
from enum import Enum

class EmailStatus(str, Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"

class ParticipantOut(BaseModel):
    id: str
    workshop_id: str
    first_name: str
    full_name: str
    email: Optional[str] = None
    company: str
    position: Optional[str] = None
    certificate_url: Optional[str] = None
    email_status: EmailStatus
    email_error: Optional[str] = None
    warning: Optional[str] = None  # computed on read, not stored

class ParticipantUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
```

- [ ] **Step 2: Write failing test for upload endpoint**

```
cert-manager/backend/tests/test_api_upload.py
```
```python
import os
import pytest
import openpyxl
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# We'll mock supabase so we don't need a live connection in tests
@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    mock.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "workshop-123", "name": "Test Workshop", "status": "draft", "created_at": "2026-01-01T00:00:00Z"}
    ]
    mock.table.return_value.upsert.return_value.execute.return_value.data = [{}]
    return mock

@pytest.fixture
def client(mock_supabase):
    with patch("db.client.get_supabase", return_value=mock_supabase):
        from main import app
        return TestClient(app)

def make_test_xlsx(tmp_path):
    path = tmp_path / "test.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Full Name", "Email", "Company"])
    ws.append(["María García", "m@banco.com", "Banco"])
    wb.save(path)
    return path

def test_upload_valid_excel_returns_workshop_id(client, tmp_path):
    path = make_test_xlsx(tmp_path)
    with open(path, "rb") as f:
        response = client.post("/api/upload", files={"file": ("test.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert response.status_code == 200
    data = response.json()
    assert "workshop_id" in data
    assert data["participant_count"] == 1

def test_upload_returns_warnings_for_bad_data(client, tmp_path):
    path = tmp_path / "bad.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Full Name", "Email", "Company"])
    ws.append(["Test Person", "", "Co"])  # missing email
    wb.save(path)
    with open(path, "rb") as f:
        response = client.post("/api/upload", files={"file": ("bad.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert response.status_code == 200
    data = response.json()
    assert data["warning_count"] == 1

def test_upload_rejects_missing_required_column(client, tmp_path):
    path = tmp_path / "bad_cols.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Nombre", "Correo"])
    ws.append(["Test", "test@test.com"])
    wb.save(path)
    with open(path, "rb") as f:
        response = client.post("/api/upload", files={"file": ("bad_cols.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert response.status_code == 422
    assert "found columns" in response.json()["detail"].lower()
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
pytest tests/test_api_upload.py -v
```
Expected: FAIL (router not implemented yet)

- [ ] **Step 4: Implement upload router**

```
cert-manager/backend/api/upload.py
```
```python
import os
import tempfile
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.excel_parser import parse_excel, ExcelParseError
from db.client import get_supabase

router = APIRouter()

@router.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    # Save to temp file
    suffix = ".xlsx" if file.filename.endswith(".xlsx") else ".xls"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        rows = parse_excel(tmp_path)
    except ExcelParseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        os.unlink(tmp_path)

    db = get_supabase()

    # Create workshop
    workshop_name = file.filename.replace(".xlsx", "").replace(".xls", "")
    workshop_res = db.table("workshops").insert({"name": workshop_name}).execute()
    workshop = workshop_res.data[0]
    workshop_id = workshop["id"]

    # Insert participants
    participant_rows = [
        {
            "workshop_id": workshop_id,
            "first_name": r["first_name"],
            "full_name": r["full_name"],
            "email": r["email"] or None,
            "company": r["company"],
            "position": r["position"] or None,
        }
        for r in rows
    ]
    db.table("participants").upsert(participant_rows).execute()

    warning_count = sum(1 for r in rows if r.get("warning"))

    return {
        "workshop_id": workshop_id,
        "participant_count": len(rows),
        "warning_count": warning_count,
    }
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
pytest tests/test_api_upload.py -v
```
Expected: all 3 tests PASS

- [ ] **Step 6: Implement workshops + participants read endpoints**

```
cert-manager/backend/api/workshops.py
```
```python
from fastapi import APIRouter, HTTPException
from db.client import get_supabase

router = APIRouter()

@router.get("/workshops/{workshop_id}")
async def get_workshop(workshop_id: str):
    db = get_supabase()
    res = db.table("workshops").select("*").eq("id", workshop_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Workshop not found")
    return res.data

@router.get("/workshops/{workshop_id}/progress")
async def get_progress(workshop_id: str):
    db = get_supabase()
    total = db.table("participants").select("id", count="exact").eq("workshop_id", workshop_id).execute().count
    done = db.table("participants").select("id", count="exact").eq("workshop_id", workshop_id).not_.is_("certificate_url", "null").execute().count
    return {"total": total, "done": done}
```

```
cert-manager/backend/api/participants.py
```
```python
from fastapi import APIRouter, HTTPException
from db.client import get_supabase
from models.participant import ParticipantUpdate
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
router = APIRouter()

@router.get("/workshops/{workshop_id}/participants")
async def list_participants(workshop_id: str):
    db = get_supabase()
    res = db.table("participants").select("*").eq("workshop_id", workshop_id).execute()
    rows = res.data or []
    # Compute warnings on read
    from collections import Counter
    name_counts = Counter(r["full_name"] for r in rows)
    for r in rows:
        if name_counts[r["full_name"]] > 1:
            r["warning"] = "duplicate_name"
        elif not r.get("email"):
            r["warning"] = "missing_email"
        elif not EMAIL_RE.match(r["email"]):
            r["warning"] = "invalid_email"
        else:
            r["warning"] = None
    return rows

@router.patch("/participants/{participant_id}")
async def update_participant(participant_id: str, body: ParticipantUpdate):
    db = get_supabase()
    updates = body.model_dump(exclude_none=True)
    if "full_name" in updates:
        updates["first_name"] = updates["full_name"].split()[0]
    res = db.table("participants").update(updates).eq("id", participant_id).execute()
    if not res.data:
        raise HTTPException(404, "Participant not found")
    return res.data[0]

@router.delete("/participants/{participant_id}")
async def delete_participant(participant_id: str):
    db = get_supabase()
    db.table("participants").delete().eq("id", participant_id).execute()
    return {"ok": True}
```

- [ ] **Step 7: Commit**

```bash
git add cert-manager/backend/api/ cert-manager/backend/models/ cert-manager/backend/tests/test_api_upload.py
git commit -m "feat: upload endpoint with excel parsing + participant CRUD"
```

---

### Task 6: Frontend — Upload + Review pages

**Files:**
- Create: `cert-manager/frontend/src/types/index.ts`
- Create: `cert-manager/frontend/src/api/client.ts`
- Create: `cert-manager/frontend/src/App.tsx`
- Create: `cert-manager/frontend/src/components/StepNav.tsx`
- Create: `cert-manager/frontend/src/pages/Upload.tsx`
- Create: `cert-manager/frontend/src/pages/Review.tsx`
- Create: `cert-manager/frontend/vite.config.ts`

- [ ] **Step 1: TypeScript types**

```
cert-manager/frontend/src/types/index.ts
```
```typescript
export type WorkshopStatus = 'draft' | 'generating' | 'ready' | 'scheduled' | 'sent';
export type EmailStatus = 'pending' | 'sent' | 'failed';
export type WarningType = 'missing_email' | 'invalid_email' | 'duplicate_name' | null;

export interface Workshop {
  id: string;
  name: string;
  status: WorkshopStatus;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  layout_json?: LayoutJson;
  email_subject?: string;
}

export interface Participant {
  id: string;
  workshop_id: string;
  first_name: string;
  full_name: string;
  email?: string;
  company: string;
  position?: string;
  certificate_url?: string;
  email_status: EmailStatus;
  email_error?: string;
  warning: WarningType;
}

export interface LayoutBlock {
  x: string;  // e.g. "42%"
  y: string;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface LayoutJson {
  full_name: LayoutBlock;
  company: LayoutBlock;
  date: LayoutBlock;
}
```

- [ ] **Step 2: API client**

```
cert-manager/frontend/src/api/client.ts
```
```typescript
const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  uploadExcel: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return req<{ workshop_id: string; participant_count: number; warning_count: number }>(
      '/upload', { method: 'POST', body: fd }
    );
  },
  getWorkshop: (id: string) => req<import('../types').Workshop>(`/workshops/${id}`),
  getParticipants: (workshopId: string) =>
    req<import('../types').Participant[]>(`/workshops/${workshopId}/participants`),
  updateParticipant: (id: string, data: Partial<import('../types').Participant>) =>
    req<import('../types').Participant>(`/participants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteParticipant: (id: string) =>
    req<{ ok: boolean }>(`/participants/${id}`, { method: 'DELETE' }),
  getProgress: (workshopId: string) =>
    req<{ total: number; done: number }>(`/workshops/${workshopId}/progress`),
  generatePdfs: (workshopId: string) =>
    req<{ ok: boolean }>(`/workshops/${workshopId}/generate`, { method: 'POST' }),
  saveLayout: (workshopId: string, layout: import('../types').LayoutJson) =>
    req<{ ok: boolean }>(`/workshops/${workshopId}/layout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_json: layout }),
    }),
  scheduleEmails: (workshopId: string, scheduledAt: string) =>
    req<{ ok: boolean }>(`/workshops/${workshopId}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    }),
  sendNow: (workshopId: string) =>
    req<{ ok: boolean }>(`/workshops/${workshopId}/send`, { method: 'POST' }),
  retryEmail: (participantId: string) =>
    req<{ ok: boolean }>(`/participants/${participantId}/retry`, { method: 'POST' }),
};
```

- [ ] **Step 3: Vite config with dev proxy**

```
cert-manager/frontend/vite.config.ts
```
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 4: App router**

```
cert-manager/frontend/src/App.tsx
```
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Upload from './pages/Upload';
import Review from './pages/Review';
import Editor from './pages/Editor';
import Generate from './pages/Generate';
import Schedule from './pages/Schedule';
import Status from './pages/Status';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/review/:workshopId" element={<Review />} />
        <Route path="/editor/:workshopId" element={<Editor />} />
        <Route path="/generate/:workshopId" element={<Generate />} />
        <Route path="/schedule/:workshopId" element={<Schedule />} />
        <Route path="/status/:workshopId" element={<Status />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: StepNav component**

```
cert-manager/frontend/src/components/StepNav.tsx
```
```typescript
const STEPS = ['Upload', 'Review', 'Editor', 'Generate', 'Schedule', 'Status'];
const ROUTES = ['/', '/review', '/editor', '/generate', '/schedule', '/status'];

export default function StepNav({ current }: { current: number }) {
  return (
    <nav style={{ display: 'flex', gap: 8, padding: '12px 20px', background: '#0f172a', alignItems: 'center' }}>
      <span style={{ color: '#f8fafc', fontWeight: 700, marginRight: 16 }}>🏆 Fast Track</span>
      {STEPS.map((label, i) => (
        <span key={i} style={{
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          background: i < current ? '#059669' : i === current ? '#1d4ed8' : '#1e293b',
          color: i <= current ? '#fff' : '#64748b',
        }}>
          {i < current ? `✓ ${label}` : `${i + 1} ${label}`}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 6: Upload page**

```
cert-manager/frontend/src/pages/Upload.tsx
```
```typescript
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';

export default function Upload() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.uploadExcel(file);
      navigate(`/review/${result.workshop_id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={0} />
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Upload Participant Excel</h1>
        <p style={{ color: '#64748b', marginBottom: 32 }}>Drop your .xlsx file to get started</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#3b82f6' : '#334155'}`,
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? '#1e3a5f' : '#1e293b',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 600 }}>{loading ? 'Processing...' : 'Drop Excel file here'}</div>
          <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>or click to browse — .xlsx and .xls</div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {error && <div style={{ marginTop: 16, color: '#f87171', background: '#450a0a', padding: '12px 16px', borderRadius: 8 }}>{error}</div>}
        <div style={{ marginTop: 24, background: '#1e293b', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>EXPECTED COLUMNS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Full Name', 'Email', 'Company'].map(c => (
              <code key={c} style={{ background: '#0f172a', color: '#34d399', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>{c}</code>
            ))}
            <code style={{ background: '#0f172a', color: '#64748b', padding: '3px 8px', borderRadius: 4, fontSize: 12 }}>Position (optional)</code>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Review page with ParticipantTable**

```
cert-manager/frontend/src/components/ParticipantTable.tsx
```
```typescript
import { useState } from 'react';
import { Participant } from '../types';
import { api } from '../api/client';

const WARNING_LABELS: Record<string, string> = {
  missing_email: '⚠ missing email',
  invalid_email: '⚠ invalid email',
  duplicate_name: '⚠ duplicate name',
};

export default function ParticipantTable({
  participants,
  onUpdate,
}: {
  participants: Participant[];
  onUpdate: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Participant>>({});

  async function save(id: string) {
    await api.updateParticipant(id, editData);
    setEditingId(null);
    onUpdate();
  }

  async function remove(id: string) {
    await api.deleteParticipant(id);
    onUpdate();
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#0f172a' }}>
          {['#', 'Full Name', 'Email', 'Company', 'Status', ''].map((h) => (
            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {participants.map((p, i) => (
          <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
            <td style={{ padding: '8px 12px', color: '#64748b' }}>{i + 1}</td>
            {editingId === p.id ? (
              <>
                <td style={{ padding: '4px 8px' }}>
                  <input defaultValue={p.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#e2e8f0', padding: '4px 8px', borderRadius: 4, width: '100%' }} />
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <input defaultValue={p.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#e2e8f0', padding: '4px 8px', borderRadius: 4, width: '100%' }} />
                </td>
                <td style={{ padding: '4px 8px' }}>
                  <input defaultValue={p.company} onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                    style={{ background: '#1e293b', border: '1px solid #3b82f6', color: '#e2e8f0', padding: '4px 8px', borderRadius: 4, width: '100%' }} />
                </td>
                <td />
                <td style={{ padding: '4px 8px', display: 'flex', gap: 4 }}>
                  <button onClick={() => save(p.id)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
                </td>
              </>
            ) : (
              <>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{p.full_name}</td>
                <td style={{ padding: '8px 12px', color: p.warning?.includes('email') ? '#fbbf24' : '#94a3b8' }}>
                  {p.warning?.includes('email') ? WARNING_LABELS[p.warning!] : p.email || '—'}
                </td>
                <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{p.company}</td>
                <td style={{ padding: '8px 12px' }}>
                  {p.warning ? (
                    <span style={{ background: '#451a03', color: '#fbbf24', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{WARNING_LABELS[p.warning]}</span>
                  ) : (
                    <span style={{ background: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Ready</span>
                  )}
                </td>
                <td style={{ padding: '8px 12px', display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditingId(p.id); setEditData({}); }} style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => remove(p.id)} style={{ background: '#450a0a', color: '#f87171', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```
cert-manager/frontend/src/pages/Review.tsx
```
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import ParticipantTable from '../components/ParticipantTable';
import { api } from '../api/client';
import { Participant } from '../types';

export default function Review() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const navigate = useNavigate();

  async function load() {
    if (!workshopId) return;
    const data = await api.getParticipants(workshopId);
    setParticipants(data);
  }

  useEffect(() => { load(); }, [workshopId]);

  const warningCount = participants.filter((p) => p.warning).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={1} />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: 0 }}>Review Participants</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>{participants.length} participants found</p>
          </div>
          <button
            disabled={warningCount > 0}
            onClick={() => navigate(`/editor/${workshopId}`)}
            style={{ padding: '10px 24px', background: warningCount > 0 ? '#1e293b' : '#1d4ed8', color: warningCount > 0 ? '#475569' : '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: warningCount > 0 ? 'not-allowed' : 'pointer' }}
          >
            {warningCount > 0 ? `Fix ${warningCount} warning${warningCount > 1 ? 's' : ''} first` : 'Proceed to Editor →'}
          </button>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden' }}>
          <ParticipantTable participants={participants} onUpdate={load} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Start both dev servers and smoke test upload → review flow**

```bash
# Terminal 1
cd cert-manager/backend && uvicorn main:app --reload

# Terminal 2
cd cert-manager/frontend && npm run dev
```
Open http://localhost:5173, upload a real Excel file, verify you land on the Review page with correct data.

- [ ] **Step 9: Commit**

```bash
git add cert-manager/frontend/
git commit -m "feat: upload and review pages with participant table"
```

---

## Phase 3: Certificate Editor + PDF Generation

### Task 7: Puppeteer render.js + PDF generator service (TDD)

**Files:**
- Create: `cert-manager/backend/render.js`
- Create: `cert-manager/backend/services/pdf_generator.py`
- Create: `cert-manager/backend/tests/test_pdf_generator.py`

- [ ] **Step 1: Write render.js**

```
cert-manager/backend/render.js
```
```javascript
const puppeteer = require('puppeteer');
const path = require('path');

async function render(inputPath, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(inputPath)}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node render.js <input.html> <output.pdf>');
  process.exit(1);
}

render(inputPath, outputPath)
  .then(() => process.exit(0))
  .catch((err) => { console.error(err.message); process.exit(1); });
```

- [ ] **Step 2: Test render.js works standalone**

```bash
cd cert-manager/backend
echo "<html><body style='background:red;'><h1>Test</h1></body></html>" > /tmp/test_cert.html
node render.js /tmp/test_cert.html /tmp/test_cert.pdf
```
Expected: `/tmp/test_cert.pdf` created, opens as a red-background A4 landscape PDF.

- [ ] **Step 3: Write failing tests for pdf_generator**

```
cert-manager/backend/tests/test_pdf_generator.py
```
```python
import pytest
import os
from unittest.mock import patch, MagicMock, AsyncMock
from services.pdf_generator import hydrate_template, apply_layout

SAMPLE_TEMPLATE = """
<html><body>
<span id="full_name">{{full_name}}</span>
<span id="company">{{company}}</span>
<span id="date">{{date}}</span>
</body></html>
"""

SAMPLE_LAYOUT = {
    "full_name": {"x": "42%", "y": "38%", "font": "Montserrat", "size": 36, "color": "#1a1a1a", "bold": True, "italic": False},
    "company":   {"x": "42%", "y": "48%", "font": "Montserrat", "size": 18, "color": "#555555", "bold": False, "italic": False},
    "date":      {"x": "42%", "y": "58%", "font": "Montserrat", "size": 14, "color": "#888888", "bold": False, "italic": False},
}

def test_hydrate_replaces_tokens():
    result = hydrate_template(SAMPLE_TEMPLATE, full_name="María García", company="Banco Agrícola", date="March 2026")
    assert "María García" in result
    assert "Banco Agrícola" in result
    assert "March 2026" in result
    assert "{{full_name}}" not in result

def test_apply_layout_injects_inline_styles():
    html = hydrate_template(SAMPLE_TEMPLATE, full_name="Test", company="Co", date="2026")
    result = apply_layout(html, SAMPLE_LAYOUT)
    assert "position: absolute" in result
    assert "left: 42%" in result
    assert "top: 38%" in result
    assert "font-size: 36px" in result
    assert "font-weight: bold" in result
    assert "color: #1a1a1a" in result
```

- [ ] **Step 4: Run tests — verify they fail**

```bash
pytest tests/test_pdf_generator.py -v
```
Expected: FAIL with ImportError

- [ ] **Step 5: Implement pdf_generator.py**

```
cert-manager/backend/services/pdf_generator.py
```
```python
import os
import re
import subprocess
import tempfile
import asyncio
from datetime import datetime
from db.client import get_supabase


def hydrate_template(html: str, **kwargs) -> str:
    """Replace {{token}} placeholders with actual values."""
    for key, value in kwargs.items():
        html = html.replace(f"{{{{{key}}}}}", str(value))
    return html


def apply_layout(html: str, layout: dict) -> str:
    """Inject inline styles onto each text block based on layout_json."""
    for field, props in layout.items():
        weight = "bold" if props.get("bold") else "normal"
        style = (
            f"position: absolute; "
            f"left: {props['x']}; "
            f"top: {props['y']}; "
            f"font-family: {props['font']}; "
            f"font-size: {props['size']}px; "
            f"color: {props['color']}; "
            f"font-weight: {weight}; "
            f"font-style: {'italic' if props.get('italic') else 'normal'};"
        )
        html = re.sub(
            rf'<span id="{field}"([^>]*)>',
            f'<span id="{field}" style="{style}"\\1>',
            html,
        )
    return html


def render_to_pdf(html_content: str, output_path: str) -> None:
    """Write HTML to a temp file and call render.js via subprocess."""
    render_js = os.path.join(os.path.dirname(__file__), "..", "render.js")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html_content)
        tmp_html = f.name
    try:
        result = subprocess.run(
            ["node", render_js, tmp_html, output_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            raise RuntimeError(f"Puppeteer failed: {result.stderr}")
    finally:
        os.unlink(tmp_html)


async def generate_workshop_pdfs(workshop_id: str) -> None:
    """Generate PDFs for all participants in a workshop (max 5 concurrent)."""
    db = get_supabase()

    # Load workshop + template
    workshop = db.table("workshops").select("*").eq("id", workshop_id).single().execute().data
    template_bytes = db.storage.from_("templates").download(workshop["template_path"])
    template_html = template_bytes.decode("utf-8")
    layout = workshop.get("layout_json") or {}

    participants = db.table("participants").select("*").eq("workshop_id", workshop_id).execute().data
    date_str = datetime.now().strftime("%B %Y")

    semaphore = asyncio.Semaphore(5)

    async def process_one(p: dict):
        async with semaphore:
            html = hydrate_template(template_html, full_name=p["full_name"],
                                    first_name=p["first_name"], company=p["company"], date=date_str)
            html = apply_layout(html, layout)
            storage_path = f"certificates/{workshop_id}/{p['id']}.pdf"
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
                pdf_path = f.name
            try:
                await asyncio.get_event_loop().run_in_executor(None, render_to_pdf, html, pdf_path)
                with open(pdf_path, "rb") as f:
                    pdf_bytes = f.read()
                db.storage.from_("certificates").upload(storage_path, pdf_bytes, {"content-type": "application/pdf", "upsert": "true"})
                public_url = db.storage.from_("certificates").get_public_url(storage_path)
                db.table("participants").update({"certificate_url": public_url}).eq("id", p["id"]).execute()
            finally:
                os.unlink(pdf_path)

    await asyncio.gather(*[process_one(p) for p in participants])
    db.table("workshops").update({"status": "ready"}).eq("id", workshop_id).execute()
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
pytest tests/test_pdf_generator.py -v
```
Expected: both tests PASS

- [ ] **Step 7: Commit**

```bash
git add cert-manager/backend/render.js cert-manager/backend/services/pdf_generator.py cert-manager/backend/tests/test_pdf_generator.py
git commit -m "feat: puppeteer render script and pdf generator service"
```

---

### Task 8: Generate API endpoint + default certificate template

**Files:**
- Create: `cert-manager/backend/api/generate.py`
- Create: `cert-manager/backend/templates/certificate_base.html`

- [ ] **Step 1: Create default certificate HTML template**

```
cert-manager/backend/templates/certificate_base.html
```
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 297mm; height: 210mm;
      background: #0a0a0a;
      font-family: 'Montserrat', sans-serif;
      overflow: hidden;
      position: relative;
    }
    .border {
      position: absolute; inset: 10mm;
      border: 2px solid #c9a84c;
    }
    .logo {
      position: absolute; top: 20mm; left: 50%;
      transform: translateX(-50%);
      color: #c9a84c; font-size: 11px; letter-spacing: 4px; text-transform: uppercase;
    }
    .title {
      position: absolute; top: 40mm; left: 50%;
      transform: translateX(-50%);
      color: #ffffff; font-size: 13px; letter-spacing: 3px; text-transform: uppercase;
      white-space: nowrap;
    }
    .subtitle {
      position: absolute; top: 52mm; left: 50%;
      transform: translateX(-50%);
      color: #888; font-size: 9px; letter-spacing: 2px; white-space: nowrap;
    }
    #full_name {
      position: absolute;
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #ffffff;
      font-weight: 700;
      left: 50%; top: 68mm;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    #company {
      position: absolute;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      color: #c9a84c;
      left: 50%; top: 90mm;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    #date {
      position: absolute;
      font-family: 'Montserrat', sans-serif;
      font-size: 11px;
      color: #666;
      left: 50%; top: 102mm;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    .footer {
      position: absolute; bottom: 18mm; left: 50%;
      transform: translateX(-50%);
      color: #444; font-size: 8px; letter-spacing: 2px; text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="border"></div>
  <div class="logo">Fast Track</div>
  <div class="title">Certificate of Completion</div>
  <div class="subtitle">has successfully completed</div>
  <span id="full_name">{{full_name}}</span>
  <span id="company">{{company}}</span>
  <span id="date">{{date}}</span>
  <div class="footer">Fast Track Executive Program · AI & Business Strategy</div>
</body>
</html>
```

- [ ] **Step 2: Upload default template to Supabase Storage on startup**

Add to `cert-manager/backend/main.py` startup.

**Important:** In the Supabase Python SDK, `storage.from_("bucket_name").download("path")` — the path is relative to the bucket root. So for bucket `templates` and file `certificate_base.html`, the path is just `"certificate_base.html"` (not `"templates/certificate_base.html"`). The `generate.py` sets `template_path = "certificate_base.html"` and `pdf_generator.py` downloads from `db.storage.from_("templates").download(workshop["template_path"])` — these must stay consistent.

```python
@app.on_event("startup")
async def on_startup():
    start_scheduler()
    _seed_default_template()

def _seed_default_template():
    """Upload default certificate template if not already present."""
    import os
    db = get_supabase()
    template_path = os.path.join(os.path.dirname(__file__), "templates", "certificate_base.html")
    try:
        db.storage.from_("templates").download("certificate_base.html")
    except Exception:
        with open(template_path, "rb") as f:
            db.storage.from_("templates").upload(
                "certificate_base.html", f.read(),
                {"content-type": "text/html", "upsert": "true"}
            )
```

Also update `generate.py` to set `template_path = "certificate_base.html"` (bucket-relative path).
Also update `email.py` to download email body as `db.storage.from_("templates").download("email_body.html")`.

- [ ] **Step 3: Implement generate endpoint**

```
cert-manager/backend/api/generate.py
```
```python
import asyncio
from fastapi import APIRouter, BackgroundTasks, HTTPException
from db.client import get_supabase
from services.pdf_generator import generate_workshop_pdfs

router = APIRouter()

@router.post("/workshops/{workshop_id}/generate")
async def trigger_generate(workshop_id: str, background_tasks: BackgroundTasks):
    db = get_supabase()
    workshop = db.table("workshops").select("status, template_path").eq("id", workshop_id).single().execute().data
    if not workshop:
        raise HTTPException(404, "Workshop not found")

    # Set default template if none chosen
    if not workshop.get("template_path"):
        db.table("workshops").update({"template_path": "templates/certificate_base.html"}).eq("id", workshop_id).execute()

    # Mark as generating
    db.table("workshops").update({"status": "generating"}).eq("id", workshop_id).execute()

    background_tasks.add_task(generate_workshop_pdfs, workshop_id)
    return {"ok": True, "message": "Generation started"}

@router.patch("/workshops/{workshop_id}/layout")
async def save_layout(workshop_id: str, body: dict):
    db = get_supabase()
    db.table("workshops").update({"layout_json": body.get("layout_json")}).eq("id", workshop_id).execute()
    return {"ok": True}
```

- [ ] **Step 4: Commit**

```bash
git add cert-manager/backend/api/generate.py cert-manager/backend/templates/
git commit -m "feat: generate endpoint + default certificate template"
```

---

### Task 9: Frontend — Certificate Editor + Generate pages

**Files:**
- Create: `cert-manager/frontend/src/components/CertEditor.tsx`
- Create: `cert-manager/frontend/src/components/ProgressBar.tsx`
- Create: `cert-manager/frontend/src/pages/Editor.tsx`
- Create: `cert-manager/frontend/src/pages/Generate.tsx`

- [ ] **Step 1: ProgressBar component (polls /progress)**

```
cert-manager/frontend/src/components/ProgressBar.tsx
```
```typescript
import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function ProgressBar({ workshopId, onComplete }: { workshopId: string; onComplete: () => void }) {
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    const interval = setInterval(async () => {
      const p = await api.getProgress(workshopId);
      setProgress(p);
      if (p.total > 0 && p.done >= p.total) {
        clearInterval(interval);
        onComplete();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [workshopId]);

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
        <span>Generating certificates...</span>
        <span>{progress.done} / {progress.total}</span>
      </div>
      <div style={{ background: '#1e293b', borderRadius: 4, height: 8 }}>
        <div style={{ background: '#1d4ed8', height: '100%', borderRadius: 4, width: `${pct}%`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CertEditor — drag-to-reposition text blocks**

```
cert-manager/frontend/src/components/CertEditor.tsx
```
```typescript
import { useState, useRef } from 'react';
import { LayoutJson, LayoutBlock, Participant } from '../types';

const DEFAULT_LAYOUT: LayoutJson = {
  full_name: { x: '50%', y: '68mm', font: 'Playfair Display', size: 36, color: '#ffffff', bold: true, italic: false },
  company:   { x: '50%', y: '90mm', font: 'Montserrat', size: 14, color: '#c9a84c', bold: false, italic: false },
  date:      { x: '50%', y: '102mm', font: 'Montserrat', size: 11, color: '#666666', bold: false, italic: false },
};

const FONTS = ['Playfair Display', 'Montserrat', 'Georgia', 'Arial', 'Times New Roman'];

export default function CertEditor({
  layout: initialLayout,
  previewParticipant,
  participants,
  onSave,
}: {
  layout?: LayoutJson | null;
  previewParticipant?: Participant;
  participants: Participant[];
  onSave: (layout: LayoutJson) => void;
}) {
  const [layout, setLayout] = useState<LayoutJson>(initialLayout || DEFAULT_LAYOUT);
  const [selected, setSelected] = useState<keyof LayoutJson | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const preview = previewParticipant || participants[previewIdx];

  function updateBlock(field: keyof LayoutJson, updates: Partial<LayoutBlock>) {
    setLayout(l => ({ ...l, [field]: { ...l[field], ...updates } }));
  }

  function startDrag(field: keyof LayoutJson, e: React.MouseEvent) {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    function onMove(ev: MouseEvent) {
      const x = ((ev.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
      const y = ((ev.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
      updateBlock(field, { x, y });
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const sel = selected ? layout[selected] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
      {/* Certificate preview */}
      <div>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Preview as:</span>
          <select
            value={previewIdx}
            onChange={e => setPreviewIdx(Number(e.target.value))}
            style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}
          >
            {participants.map((p, i) => (
              <option key={p.id} value={i}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div
          ref={containerRef}
          style={{ position: 'relative', background: '#0a0a0a', border: '2px solid #c9a84c', aspectRatio: '297/210', userSelect: 'none' }}
        >
          {(Object.keys(layout) as (keyof LayoutJson)[]).map(field => {
            const b = layout[field];
            const value = field === 'full_name' ? (preview?.full_name || 'Full Name') :
                          field === 'company'   ? (preview?.company || 'Company') : 'March 2026';
            return (
              <span
                key={field}
                onMouseDown={e => { setSelected(field); startDrag(field, e); }}
                style={{
                  position: 'absolute',
                  left: b.x, top: b.y,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: b.font,
                  fontSize: b.size,
                  color: b.color,
                  fontWeight: b.bold ? 'bold' : 'normal',
                  fontStyle: b.italic ? 'italic' : 'normal',
                  cursor: 'move',
                  outline: selected === field ? '2px dashed #3b82f6' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {value}
              </span>
            );
          })}
        </div>
        <div style={{ marginTop: 8, color: '#64748b', fontSize: 11 }}>Click and drag text blocks to reposition</div>
      </div>

      {/* Controls sidebar */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 16 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
          {selected ? `Editing: ${selected.replace('_', ' ')}` : 'Select a text block to edit'}
        </div>
        {sel && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 11, color: '#64748b' }}>Font Family
              <select value={sel.font} onChange={e => updateBlock(selected, { font: e.target.value })}
                style={{ display: 'block', width: '100%', marginTop: 4, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '5px 8px' }}>
                {FONTS.map(f => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, color: '#64748b' }}>Font Size (px)
              <input type="number" value={sel.size} onChange={e => updateBlock(selected, { size: Number(e.target.value) })}
                style={{ display: 'block', width: '100%', marginTop: 4, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '5px 8px' }} />
            </label>
            <label style={{ fontSize: 11, color: '#64748b' }}>Color
              <input type="color" value={sel.color} onChange={e => updateBlock(selected, { color: e.target.value })}
                style={{ display: 'block', width: '100%', marginTop: 4, height: 36, background: '#0f172a', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer' }} />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => updateBlock(selected, { bold: !sel.bold })}
                style={{ flex: 1, padding: '6px 0', background: sel.bold ? '#1d4ed8' : '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>B</button>
              <button onClick={() => updateBlock(selected, { italic: !sel.italic })}
                style={{ flex: 1, padding: '6px 0', background: sel.italic ? '#1d4ed8' : '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: 4, fontStyle: 'italic', cursor: 'pointer' }}>I</button>
            </div>
          </div>
        )}
        <button onClick={() => onSave(layout)}
          style={{ width: '100%', marginTop: 20, padding: '10px 0', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Apply to All →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Editor page**

```
cert-manager/frontend/src/pages/Editor.tsx
```
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import CertEditor from '../components/CertEditor';
import { api } from '../api/client';
import { Workshop, Participant } from '../types';

export default function Editor() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!workshopId) return;
    Promise.all([api.getWorkshop(workshopId), api.getParticipants(workshopId)])
      .then(([w, p]) => { setWorkshop(w); setParticipants(p); });
  }, [workshopId]);

  async function handleSave(layout: any) {
    if (!workshopId) return;
    await api.saveLayout(workshopId, layout);
    navigate(`/generate/${workshopId}`);
  }

  if (!workshop) return <div style={{ background: '#0f172a', minHeight: '100vh' }} />;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={2} />
      <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Certificate Editor</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Drag text blocks to position. Click "Apply to All" when done.</p>
        <CertEditor layout={workshop.layout_json} participants={participants} onSave={handleSave} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Generate page**

```
cert-manager/frontend/src/pages/Generate.tsx
```
```typescript
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import ProgressBar from '../components/ProgressBar';
import { api } from '../api/client';

export default function Generate() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function start() {
    if (!workshopId) return;
    await api.generatePdfs(workshopId);
    setStarted(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={3} />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        {!started ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>Ready to Generate</h1>
            <p style={{ color: '#64748b', marginBottom: 32 }}>Puppeteer will render a personalized PDF for each participant.</p>
            <button onClick={start} style={{ padding: '12px 32px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Generate All Certificates
            </button>
          </>
        ) : done ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ fontSize: 22, marginBottom: 8, color: '#34d399' }}>All certificates generated!</h1>
            <button onClick={() => navigate(`/schedule/${workshopId}`)} style={{ padding: '12px 32px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 24 }}>
              Schedule Emails →
            </button>
          </>
        ) : (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 32 }}>
            <ProgressBar workshopId={workshopId!} onComplete={() => setDone(true)} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Smoke test end-to-end: upload → review → editor → generate**

Start both servers. Upload the real El Salvador Excel, fix any warnings, drag editor, apply layout, click generate. Verify PDFs appear in Supabase Storage.

- [ ] **Step 6: Commit**

```bash
git add cert-manager/frontend/src/
git commit -m "feat: certificate editor and generate pages"
```

---

## Phase 4: Microsoft OAuth + Email Delivery

### Task 10: Microsoft Graph OAuth flow

**Files:**
- Create: `cert-manager/backend/api/auth.py`

- [ ] **Step 1: Register Azure app (one-time manual step)**

In Azure Portal → App registrations → New registration:
- Redirect URI: `http://localhost:8000/auth/callback` (add Railway URL too after deploy)
- API permissions: `Mail.Send` (delegated)
- Note: `client_id`, `client_secret`, `tenant_id`

- [ ] **Step 2: Implement auth router**

```
cert-manager/backend/api/auth.py
```
```python
import os
import httpx
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from db.client import get_supabase
from datetime import datetime, timezone

router = APIRouter(prefix="/auth")

SCOPES = "https://graph.microsoft.com/Mail.Send offline_access"

def _auth_params():
    return {
        "client_id": os.environ["MS_CLIENT_ID"],
        "client_secret": os.environ["MS_CLIENT_SECRET"],
        "tenant_id": os.environ["MS_TENANT_ID"],
    }

@router.get("/login")
async def login():
    p = _auth_params()
    redirect_uri = os.environ.get("MS_REDIRECT_URI", "http://localhost:8000/auth/callback")
    url = (
        f"https://login.microsoftonline.com/{p['tenant_id']}/oauth2/v2.0/authorize"
        f"?client_id={p['client_id']}"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
        f"&scope={SCOPES.replace(' ', '%20')}"
        f"&response_mode=query"
    )
    return RedirectResponse(url)

@router.get("/callback")
async def callback(code: str):
    p = _auth_params()
    redirect_uri = os.environ.get("MS_REDIRECT_URI", "http://localhost:8000/auth/callback")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{p['tenant_id']}/oauth2/v2.0/token",
            data={
                "client_id": p["client_id"],
                "client_secret": p["client_secret"],
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "scope": SCOPES,
            }
        )
        tokens = resp.json()

    db = get_supabase()
    db.table("oauth_tokens").upsert({
        "provider": "microsoft",
        "refresh_token": tokens["refresh_token"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"message": "Microsoft account connected. You can close this tab."}
```

- [ ] **Step 3: Test OAuth flow manually**

```bash
uvicorn main:app --reload
```
Open http://localhost:8000/auth/login, complete Microsoft sign-in.
Expected: "Microsoft account connected." message. Verify `oauth_tokens` table has one row.

- [ ] **Step 4: Commit**

```bash
git add cert-manager/backend/api/auth.py
git commit -m "feat: microsoft graph oauth flow"
```

---

### Task 11: Email sender service + scheduling (TDD)

**Files:**
- Create: `cert-manager/backend/services/email_sender.py`
- Create: `cert-manager/backend/services/scheduler.py`
- Create: `cert-manager/backend/api/email.py`
- Create: `cert-manager/backend/tests/test_email_sender.py`

- [ ] **Step 1: Write failing tests**

```
cert-manager/backend/tests/test_email_sender.py
```
```python
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from services.email_sender import hydrate_email_subject, hydrate_email_body

def test_hydrate_subject_replaces_first_name():
    result = hydrate_email_subject("Your Fast Track Certificate, {{first_name}}", "María")
    assert result == "Your Fast Track Certificate, María"

def test_hydrate_body_replaces_all_tokens():
    template = "Hello {{first_name}}, from {{company}}. View: {{certificate_url}}"
    result = hydrate_email_body(template, first_name="María", full_name="María García",
                                company="Banco Agrícola", certificate_url="https://example.com/cert.pdf")
    assert "María" in result
    assert "Banco Agrícola" in result
    assert "https://example.com/cert.pdf" in result
    assert "{{" not in result
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_email_sender.py -v
```

- [ ] **Step 3: Implement email_sender.py**

```
cert-manager/backend/services/email_sender.py
```
```python
import os
import asyncio
import base64
import httpx
from datetime import datetime, timezone
from db.client import get_supabase


def hydrate_email_subject(template: str, first_name: str) -> str:
    return template.replace("{{first_name}}", first_name)


def hydrate_email_body(template: str, **kwargs) -> str:
    for key, value in kwargs.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    return template


async def _get_access_token() -> str:
    db = get_supabase()
    row = db.table("oauth_tokens").select("refresh_token").eq("provider", "microsoft").single().execute().data
    if not row:
        raise RuntimeError("Microsoft account not connected. Visit /auth/login first.")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://login.microsoftonline.com/{os.environ['MS_TENANT_ID']}/oauth2/v2.0/token",
            data={
                "client_id": os.environ["MS_CLIENT_ID"],
                "client_secret": os.environ["MS_CLIENT_SECRET"],
                "grant_type": "refresh_token",
                "refresh_token": row["refresh_token"],
                "scope": "https://graph.microsoft.com/Mail.Send offline_access",
            }
        )
        tokens = resp.json()
        if "error" in tokens:
            raise RuntimeError(f"Token refresh failed: {tokens.get('error_description')}")

    # Rotate refresh token
    db.table("oauth_tokens").update({
        "refresh_token": tokens["refresh_token"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("provider", "microsoft").execute()

    return tokens["access_token"]


async def send_workshop_emails(workshop_id: str) -> None:
    db = get_supabase()
    workshop = db.table("workshops").select("*").eq("id", workshop_id).single().execute().data
    participants = (
        db.table("participants").select("*")
        .eq("workshop_id", workshop_id)
        .neq("email_status", "sent")
        .not_.is_("email", "null")
        .execute().data
    )

    email_body_template = db.storage.from_("templates").download(
        workshop.get("email_body_path") or "templates/email_body.html"
    ).decode("utf-8")

    access_token = await _get_access_token()

    async with httpx.AsyncClient(timeout=30) as client:
        for p in participants:
            if not p.get("certificate_url"):
                continue
            subject = hydrate_email_subject(workshop.get("email_subject") or "Your Fast Track Certificate, {{first_name}}", p["first_name"])
            body = hydrate_email_body(email_body_template, first_name=p["first_name"],
                                      full_name=p["full_name"], company=p["company"],
                                      certificate_url=p["certificate_url"])

            # Download PDF for attachment
            pdf_bytes = db.storage.from_("certificates").download(
                f"certificates/{workshop_id}/{p['id']}.pdf"
            )
            pdf_b64 = base64.b64encode(pdf_bytes).decode()

            message = {
                "message": {
                    "subject": subject,
                    "body": {"contentType": "HTML", "content": body},
                    "toRecipients": [{"emailAddress": {"address": p["email"]}}],
                    "attachments": [{
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": f"{p['full_name'].replace(' ', '_')}_Certificate.pdf",
                        "contentType": "application/pdf",
                        "contentBytes": pdf_b64,
                    }],
                }
            }

            # Send with retry on 429
            for attempt in range(3):
                resp = await client.post(
                    "https://graph.microsoft.com/v1.0/me/sendMail",
                    json=message,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if resp.status_code == 202:
                    db.table("participants").update({
                        "email_status": "sent",
                        "email_sent_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", p["id"]).execute()
                    break
                elif resp.status_code == 429:
                    retry_after = int(resp.headers.get("Retry-After", 10))
                    await asyncio.sleep(min(retry_after * (2 ** attempt), 60))
                else:
                    db.table("participants").update({
                        "email_status": "failed",
                        "email_error": f"HTTP {resp.status_code}: {resp.text[:200]}",
                    }).eq("id", p["id"]).execute()
                    break
            else:
                db.table("participants").update({
                    "email_status": "failed",
                    "email_error": "Rate limited — max retries exceeded",
                }).eq("id", p["id"]).execute()

            await asyncio.sleep(2)  # Rate limit buffer

    db.table("workshops").update({
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", workshop_id).execute()


async def send_single_email(participant_id: str, workshop_id: str) -> None:
    """Re-send email for one specific participant only."""
    db = get_supabase()
    workshop = db.table("workshops").select("*").eq("id", workshop_id).single().execute().data
    p = db.table("participants").select("*").eq("id", participant_id).single().execute().data
    if not p or not p.get("certificate_url"):
        return

    email_body_template = db.storage.from_("templates").download(
        workshop.get("email_body_path") or "email_body.html"
    ).decode("utf-8")
    access_token = await _get_access_token()

    subject = hydrate_email_subject(
        workshop.get("email_subject") or "Your Fast Track Certificate, {{first_name}}",
        p["first_name"]
    )
    body = hydrate_email_body(email_body_template, first_name=p["first_name"],
                              full_name=p["full_name"], company=p["company"],
                              certificate_url=p["certificate_url"])
    pdf_bytes = db.storage.from_("certificates").download(
        f"{workshop_id}/{p['id']}.pdf"
    )
    pdf_b64 = base64.b64encode(pdf_bytes).decode()

    message = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": body},
            "toRecipients": [{"emailAddress": {"address": p["email"]}}],
            "attachments": [{
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": f"{p['full_name'].replace(' ', '_')}_Certificate.pdf",
                "contentType": "application/pdf",
                "contentBytes": pdf_b64,
            }],
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            json=message,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code == 202:
            db.table("participants").update({
                "email_status": "sent",
                "email_sent_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", participant_id).execute()
        else:
            db.table("participants").update({
                "email_status": "failed",
                "email_error": f"HTTP {resp.status_code}: {resp.text[:200]}",
            }).eq("id", participant_id).execute()
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_email_sender.py -v
```

- [ ] **Step 5: Implement scheduler.py**

```
cert-manager/backend/services/scheduler.py
```
```python
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        jobstores = {
            "default": SQLAlchemyJobStore(url=os.environ["DATABASE_URL"])
        }
        _scheduler = AsyncIOScheduler(jobstores=jobstores)
    return _scheduler


def start_scheduler():
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()


def schedule_send(workshop_id: str, run_date) -> str:
    from services.email_sender import send_workshop_emails
    scheduler = get_scheduler()
    job = scheduler.add_job(
        send_workshop_emails,
        trigger="date",
        run_date=run_date,
        args=[workshop_id],
        id=f"send_{workshop_id}",
        replace_existing=True,
    )
    return job.id


def cancel_send(workshop_id: str):
    scheduler = get_scheduler()
    try:
        scheduler.remove_job(f"send_{workshop_id}")
    except Exception:
        pass
```

- [ ] **Step 6: Implement email + schedule API endpoints**

```
cert-manager/backend/api/email.py
```
```python
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from db.client import get_supabase
from services.scheduler import schedule_send, cancel_send
from services.email_sender import send_workshop_emails
from pydantic import BaseModel

router = APIRouter()

class ScheduleRequest(BaseModel):
    scheduled_at: str  # ISO 8601 UTC string

@router.post("/workshops/{workshop_id}/schedule")
async def schedule_emails(workshop_id: str, body: ScheduleRequest):
    db = get_supabase()
    run_date = datetime.fromisoformat(body.scheduled_at.replace("Z", "+00:00"))
    cancel_send(workshop_id)  # cancel any existing job
    schedule_send(workshop_id, run_date)
    db.table("workshops").update({
        "status": "scheduled",
        "scheduled_at": body.scheduled_at,
    }).eq("id", workshop_id).execute()
    return {"ok": True}

@router.delete("/workshops/{workshop_id}/schedule")
async def cancel_schedule(workshop_id: str):
    db = get_supabase()
    cancel_send(workshop_id)
    db.table("workshops").update({"status": "ready", "scheduled_at": None}).eq("id", workshop_id).execute()
    return {"ok": True}

@router.post("/workshops/{workshop_id}/send")
async def send_now(workshop_id: str, background_tasks: BackgroundTasks):
    db = get_supabase()
    workshop = db.table("workshops").select("status").eq("id", workshop_id).single().execute().data
    if workshop["status"] not in ("ready", "scheduled"):
        raise HTTPException(400, "Certificates must be generated before sending")
    cancel_send(workshop_id)
    db.table("workshops").update({"status": "scheduled"}).eq("id", workshop_id).execute()
    background_tasks.add_task(send_workshop_emails, workshop_id)
    return {"ok": True}

@router.post("/participants/{participant_id}/retry")
async def retry_email(participant_id: str, background_tasks: BackgroundTasks):
    db = get_supabase()
    p = db.table("participants").select("workshop_id").eq("id", participant_id).single().execute().data
    if not p:
        raise HTTPException(404, "Participant not found")
    db.table("participants").update({"email_status": "pending", "email_error": None}).eq("id", participant_id).execute()
    # Re-send just this participant by calling email sender with single-item override
    background_tasks.add_task(_retry_single, participant_id, p["workshop_id"])
    return {"ok": True}

async def _retry_single(participant_id: str, workshop_id: str):
    """Send email for a single participant only — does not touch other participants."""
    from services.email_sender import send_single_email
    await send_single_email(participant_id, workshop_id)
```

- [ ] **Step 7: Upload default email body template to Supabase Storage**

Copy the existing `email-body.html` from the root of this repo to Supabase Storage as `templates/email_body.html`.

You can do this once via the Supabase dashboard: Storage → templates bucket → upload file.

- [ ] **Step 8: Run all tests**

```bash
pytest tests/ -v
```
Expected: all tests PASS

- [ ] **Step 9: Commit**

```bash
git add cert-manager/backend/services/ cert-manager/backend/api/email.py cert-manager/backend/api/auth.py
git commit -m "feat: email sender, scheduler, and send/schedule endpoints"
```

---

## Phase 5: Schedule + Status Frontend + Final Wiring

### Task 12: Schedule + Status pages

**Files:**
- Create: `cert-manager/frontend/src/pages/Schedule.tsx`
- Create: `cert-manager/frontend/src/pages/Status.tsx`

- [ ] **Step 1: Schedule page**

```
cert-manager/frontend/src/pages/Schedule.tsx
```
```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';
import { Workshop } from '../types';

export default function Schedule() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (workshopId) api.getWorkshop(workshopId).then(setWorkshop);
  }, [workshopId]);

  async function handleSchedule() {
    if (!workshopId || !date) return;
    setSaving(true);
    // Combine date + time, treat as UTC-6 (El Salvador)
    const localIso = `${date}T${time}:00`;
    const utcDate = new Date(new Date(localIso).getTime() + 6 * 60 * 60 * 1000).toISOString();
    await api.scheduleEmails(workshopId, utcDate);
    navigate(`/status/${workshopId}`);
  }

  async function handleSendNow() {
    if (!workshopId) return;
    await api.sendNow(workshopId);
    navigate(`/status/${workshopId}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={4} />
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <h1 style={{ fontSize: 22, color: '#34d399', marginTop: 8 }}>Certificates Ready</h1>
          <p style={{ color: '#64748b' }}>Schedule or send emails now</p>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>SCHEDULE EMAIL DELIVERY</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>DATE</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>TIME (UTC-6)</div>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }} />
            </div>
          </div>
          <button onClick={handleSchedule} disabled={!date || saving}
            style={{ width: '100%', padding: '12px 0', background: date ? '#1d4ed8' : '#1e293b', color: date ? '#fff' : '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: date ? 'pointer' : 'not-allowed', marginBottom: 10 }}>
            {saving ? 'Scheduling...' : 'Schedule Send →'}
          </button>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            or <button onClick={handleSendNow} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Send Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Status page**

```
cert-manager/frontend/src/pages/Status.tsx
```
```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StepNav from '../components/StepNav';
import { api } from '../api/client';
import { Participant } from '../types';

export default function Status() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);

  async function load() {
    if (workshopId) setParticipants(await api.getParticipants(workshopId));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [workshopId]);

  const sent = participants.filter(p => p.email_status === 'sent').length;
  const failed = participants.filter(p => p.email_status === 'failed').length;
  const pending = participants.filter(p => p.email_status === 'pending').length;

  async function retry(id: string) {
    await api.retryEmail(id);
    load();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <StepNav current={5} />
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: 22, marginBottom: 20 }}>Delivery Status</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Sent ✓', count: sent, bg: '#064e3b', color: '#34d399' },
            { label: 'Failed ✗', count: failed, bg: '#450a0a', color: '#f87171' },
            { label: 'Pending', count: pending, bg: '#0f172a', color: '#94a3b8' },
          ].map(({ label, count, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ color, fontSize: 28, fontWeight: 700 }}>{count}</div>
              <div style={{ color, fontSize: 13, opacity: 0.8 }}>{label}</div>
            </div>
          ))}
        </div>
        {failed > 0 && (
          <div style={{ background: '#1e293b', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>FAILED — click to retry</div>
            {participants.filter(p => p.email_status === 'failed').map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
                <div>
                  <span style={{ color: '#e2e8f0' }}>{p.full_name}</span>
                  <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>— {p.email_error}</span>
                </div>
                <button onClick={() => retry(p.id)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>Retry</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ background: '#1e293b', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Name', 'Email', 'Company', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{p.full_name}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{p.email || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{p.company}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      background: p.email_status === 'sent' ? '#064e3b' : p.email_status === 'failed' ? '#450a0a' : '#1e293b',
                      color: p.email_status === 'sent' ? '#34d399' : p.email_status === 'failed' ? '#f87171' : '#94a3b8',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11,
                    }}>
                      {p.email_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add tsconfig.json**

```
cert-manager/frontend/tsconfig.json
```
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Add main.tsx + index.html**

```
cert-manager/frontend/src/main.tsx
```
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

```
cert-manager/frontend/index.html
```
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fast Track — Certificate Manager</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Full end-to-end smoke test**

1. Start backend: `cd cert-manager/backend && uvicorn main:app --reload`
2. Start frontend: `cd cert-manager/frontend && npm run dev`
3. Complete full flow: upload Excel → review → editor → generate → schedule (set 1 minute from now) → watch status page update

- [ ] **Step 5: Commit**

```bash
git add cert-manager/frontend/
git commit -m "feat: schedule and status pages — complete frontend"
```

---

### Task 13: Production build + Railway deploy

**Files:**
- Modify: `cert-manager/Dockerfile` (verify build works end-to-end)

- [ ] **Step 1: Build the Docker image locally**

```bash
cd cert-manager
docker build -t cert-manager .
```
Expected: Build completes. Note: Puppeteer Chromium download may take a few minutes first time.

- [ ] **Step 2: Run locally with Docker**

```bash
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_KEY=your_key \
  -e MS_CLIENT_ID=your_id \
  -e MS_CLIENT_SECRET=your_secret \
  -e MS_TENANT_ID=your_tenant \
  -e DATABASE_URL=your_pg_url \
  cert-manager
```
Open http://localhost:8000 — React app should load, served by FastAPI.

- [ ] **Step 3: Deploy to Railway**

```bash
# In Railway dashboard:
# 1. New project → Deploy from GitHub
# 2. Select cert-manager/ directory as root
# 3. Add all environment variables from .env.example
# 4. Add MS_REDIRECT_URI=https://your-app.railway.app/auth/callback
# 5. Deploy
```

- [ ] **Step 4: Complete OAuth on Railway URL**

Visit `https://your-app.railway.app/auth/login` to complete Microsoft OAuth with the production redirect URI.

Update Azure app registration to allow the Railway redirect URI.

- [ ] **Step 5: Commit + tag**

```bash
git add .
git commit -m "feat: complete certificate distribution system"
git tag v1.0.0
```

---

## Summary Checklist

- [ ] Phase 1: Foundation (scaffold, DB schema, Dockerfile)
- [ ] Phase 2: Excel upload + participant review
- [ ] Phase 3: Certificate editor + PDF generation
- [ ] Phase 4: Microsoft OAuth + email delivery + scheduling
- [ ] Phase 5: Schedule + status frontend + Railway deploy

**Test command (run after each phase):**
```bash
cd cert-manager/backend && pytest tests/ -v
```
