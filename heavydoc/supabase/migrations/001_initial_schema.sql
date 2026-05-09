-- ============================================================
-- HeavyDoc — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  role         TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'reader')),
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- MACHINES
-- ============================================================
CREATE TABLE machines (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT NOT NULL UNIQUE,
  image_url    TEXT,
  translations JSONB NOT NULL DEFAULT '{"es":{"name":"","description":""},"en":{"name":"","description":""},"pt":{"name":"","description":""}}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_machines_slug ON machines(slug);

-- ============================================================
-- SYSTEMS (independent, reusable across machines)
-- ============================================================
CREATE TABLE systems (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT NOT NULL UNIQUE,
  icon_url     TEXT,
  translations JSONB NOT NULL DEFAULT '{"es":{"name":"","description":""},"en":{"name":"","description":""},"pt":{"name":"","description":""}}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_systems_slug ON systems(slug);

-- ============================================================
-- MACHINE_SYSTEMS (many-to-many)
-- ============================================================
CREATE TABLE machine_systems (
  machine_id    UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  system_id     UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  display_order INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (machine_id, system_id)
);

-- ============================================================
-- SUBSYSTEMS (belong to a system)
-- ============================================================
CREATE TABLE subsystems (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id     UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  display_order INT  NOT NULL DEFAULT 0,
  translations  JSONB NOT NULL DEFAULT '{"es":{"name":"","description":""},"en":{"name":"","description":""},"pt":{"name":"","description":""}}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (system_id, slug)
);

CREATE INDEX idx_subsystems_system_id ON subsystems(system_id);

-- ============================================================
-- ERROR CODES (belong to a subsystem)
-- ============================================================
CREATE TABLE error_codes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subsystem_id UUID NOT NULL REFERENCES subsystems(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  translations JSONB NOT NULL DEFAULT '{"es":{"title":"","description":""},"en":{"title":"","description":""},"pt":{"title":"","description":""}}',
  search_vector TSVECTOR,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_codes_subsystem_id ON error_codes(subsystem_id);
CREATE INDEX idx_error_codes_code ON error_codes(code);
CREATE INDEX idx_error_codes_search ON error_codes USING GIN(search_vector);

-- ============================================================
-- DIAGNOSTIC STEPS (ordered, rich content per error code)
-- ============================================================
CREATE TABLE diagnostic_steps (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code_id  UUID NOT NULL REFERENCES error_codes(id) ON DELETE CASCADE,
  step_order     INT  NOT NULL DEFAULT 0,
  content_json   JSONB NOT NULL DEFAULT '{}',
  translations   JSONB
);

CREATE INDEX idx_diagnostic_steps_error_code ON diagnostic_steps(error_code_id, step_order);

-- ============================================================
-- REPAIR STEPS (ordered, rich content per error code)
-- ============================================================
CREATE TABLE repair_steps (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code_id  UUID NOT NULL REFERENCES error_codes(id) ON DELETE CASCADE,
  step_order     INT  NOT NULL DEFAULT 0,
  content_json   JSONB NOT NULL DEFAULT '{}',
  translations   JSONB
);

CREATE INDEX idx_repair_steps_error_code ON repair_steps(error_code_id, step_order);

-- ============================================================
-- TOOLS (global reusable catalog)
-- ============================================================
CREATE TABLE tools (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url    TEXT,
  part_number  TEXT,
  translations JSONB NOT NULL DEFAULT '{"es":{"name":"","description":""},"en":{"name":"","description":""},"pt":{"name":"","description":""}}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ERROR_CODE_TOOLS (many-to-many)
-- ============================================================
CREATE TABLE error_code_tools (
  error_code_id  UUID    NOT NULL REFERENCES error_codes(id) ON DELETE CASCADE,
  tool_id        UUID    NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  quantity       INT,
  notes          TEXT,
  PRIMARY KEY (error_code_id, tool_id)
);

-- ============================================================
-- HAZARDS (dangers per error code)
-- ============================================================
CREATE TABLE hazards (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code_id  UUID NOT NULL REFERENCES error_codes(id) ON DELETE CASCADE,
  severity       TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'caution', 'danger')),
  icon           TEXT NOT NULL DEFAULT 'generic' CHECK (icon IN ('electric', 'pressure', 'burn', 'crush', 'chemical', 'generic')),
  display_order  INT  NOT NULL DEFAULT 0,
  translations   JSONB NOT NULL DEFAULT '{"es":{"title":"","description":""},"en":{"title":"","description":""},"pt":{"title":"","description":""}}'
);

CREATE INDEX idx_hazards_error_code ON hazards(error_code_id);

-- ============================================================
-- FULL-TEXT SEARCH: update_search_vector trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_error_code_search_vector()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.code, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.translations->'es'->>'title', '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.translations->'es'->>'description', '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER error_codes_search_update
  BEFORE INSERT OR UPDATE ON error_codes
  FOR EACH ROW EXECUTE FUNCTION update_error_code_search_vector();

-- ============================================================
-- SEARCH RPC: search_global(query, locale)
-- ============================================================
CREATE OR REPLACE FUNCTION search_global(query TEXT, locale TEXT DEFAULT 'es')
RETURNS TABLE (
  type        TEXT,
  id          UUID,
  code        TEXT,
  name        TEXT,
  description TEXT,
  severity    TEXT,
  slug        TEXT,
  rank        REAL
) LANGUAGE sql STABLE AS $$
  -- Error codes
  SELECT
    'error_code'::TEXT        AS type,
    ec.id,
    ec.code,
    COALESCE(ec.translations->locale->>'title', ec.translations->'es'->>'title', '') AS name,
    COALESCE(ec.translations->locale->>'description', ec.translations->'es'->>'description', '') AS description,
    ec.severity,
    NULL::TEXT                AS slug,
    ts_rank(ec.search_vector, plainto_tsquery('spanish', query)) AS rank
  FROM error_codes ec
  WHERE
    ec.search_vector @@ plainto_tsquery('spanish', query)
    OR ec.code ILIKE '%' || query || '%'

  UNION ALL

  -- Systems
  SELECT
    'system'::TEXT AS type,
    s.id,
    NULL::TEXT     AS code,
    COALESCE(s.translations->locale->>'name', s.translations->'es'->>'name', '') AS name,
    COALESCE(s.translations->locale->>'description', s.translations->'es'->>'description', '') AS description,
    NULL::TEXT     AS severity,
    s.slug,
    0.5::REAL      AS rank
  FROM systems s
  WHERE
    s.translations->'es'->>'name' ILIKE '%' || query || '%'
    OR s.translations->locale->>'name' ILIKE '%' || query || '%'

  UNION ALL

  -- Subsystems
  SELECT
    'subsystem'::TEXT AS type,
    ss.id,
    NULL::TEXT        AS code,
    COALESCE(ss.translations->locale->>'name', ss.translations->'es'->>'name', '') AS name,
    COALESCE(ss.translations->locale->>'description', ss.translations->'es'->>'description', '') AS description,
    NULL::TEXT        AS severity,
    ss.slug,
    0.3::REAL         AS rank
  FROM subsystems ss
  WHERE
    ss.translations->'es'->>'name' ILIKE '%' || query || '%'
    OR ss.translations->locale->>'name' ILIKE '%' || query || '%'

  ORDER BY rank DESC
  LIMIT 30;
$$;

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER systems_updated_at  BEFORE UPDATE ON systems  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER error_codes_updated_at BEFORE UPDATE ON error_codes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems         ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsystems      ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_codes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_steps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_code_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazards         ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles: users see only their own profile; admins see all
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid() OR is_admin());

-- Read policies: all authenticated users
CREATE POLICY "machines_select"         ON machines         FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "systems_select"          ON systems          FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "machine_systems_select"  ON machine_systems  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subsystems_select"       ON subsystems       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "error_codes_select"      ON error_codes      FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "diagnostic_steps_select" ON diagnostic_steps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "repair_steps_select"     ON repair_steps     FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tools_select"            ON tools            FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "error_code_tools_select" ON error_code_tools FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hazards_select"          ON hazards          FOR SELECT USING (auth.uid() IS NOT NULL);

-- Write policies: only admins
CREATE POLICY "machines_write"         ON machines         FOR ALL USING (is_admin());
CREATE POLICY "systems_write"          ON systems          FOR ALL USING (is_admin());
CREATE POLICY "machine_systems_write"  ON machine_systems  FOR ALL USING (is_admin());
CREATE POLICY "subsystems_write"       ON subsystems       FOR ALL USING (is_admin());
CREATE POLICY "error_codes_write"      ON error_codes      FOR ALL USING (is_admin());
CREATE POLICY "diagnostic_steps_write" ON diagnostic_steps FOR ALL USING (is_admin());
CREATE POLICY "repair_steps_write"     ON repair_steps     FOR ALL USING (is_admin());
CREATE POLICY "tools_write"            ON tools            FOR ALL USING (is_admin());
CREATE POLICY "error_code_tools_write" ON error_code_tools FOR ALL USING (is_admin());
CREATE POLICY "hazards_write"          ON hazards          FOR ALL USING (is_admin());

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via CLI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('machine-images',    'machine-images',    true),
--   ('system-images',     'system-images',     true),
--   ('diagnostic-media',  'diagnostic-media',  true),
--   ('repair-media',      'repair-media',      true),
--   ('tool-images',       'tool-images',       true);
