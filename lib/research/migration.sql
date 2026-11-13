-- Run explicitly with a restricted database operator account. No runtime auto-migration.
BEGIN;
CREATE TABLE IF NOT EXISTS private_research_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state JSONB NOT NULL CHECK (state->>'version' = '1' AND jsonb_typeof(state->'participants') = 'array'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO private_research_state(id,state) VALUES(1,'{"version":1,"participants":[]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
REVOKE ALL ON private_research_state FROM PUBLIC;
COMMIT;
