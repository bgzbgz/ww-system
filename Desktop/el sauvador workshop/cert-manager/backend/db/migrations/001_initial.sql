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
    email_body_path TEXT DEFAULT 'email_body.html'
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

-- APScheduler job store table (created automatically by APScheduler on first run)
-- Table name: apscheduler_jobs (documented here for reference only)
