-- ProAcademy – Supabase Schema
-- Ausführen im Supabase SQL Editor

-- ── 1. Eltern ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eltern (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vorname         TEXT        NOT NULL,
  nachname        TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,
  telefon         TEXT        NOT NULL DEFAULT '',
  stripe_abo_id   TEXT,
  status          TEXT        NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'inaktiv', 'gekuendigt')),
  erstellt_am     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Kinder ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kinder (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vorname         TEXT        NOT NULL,
  nachname        TEXT        NOT NULL,
  geburtsdatum    DATE        NOT NULL,
  gruppe          TEXT        NOT NULL DEFAULT '',
  eltern_id       UUID        NOT NULL REFERENCES eltern(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'neuzugang' CHECK (status IN ('aktiv', 'neuzugang', 'inaktiv')),
  notizen         TEXT        NOT NULL DEFAULT '',
  erstellt_am     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kinder_eltern_id_idx ON kinder(eltern_id);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE eltern ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinder ENABLE ROW LEVEL SECURITY;

-- Service Role Key (Netlify Functions) umgeht RLS automatisch.
-- Optional: Lesezugriff für eingeloggte Admins freischalten:
-- CREATE POLICY "Admin read eltern" ON eltern FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Admin read kinder" ON kinder FOR SELECT USING (auth.role() = 'authenticated');
