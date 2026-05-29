CREATE TABLE IF NOT EXISTS app_settings (
  cle TEXT PRIMARY KEY,
  valeur TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access" ON app_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO app_settings (cle, valeur) VALUES
  ('entreprise_nom', 'ATEXIA'),
  ('entreprise_adresse', NULL),
  ('entreprise_siret', NULL),
  ('entreprise_telephone', NULL),
  ('entreprise_email', NULL)
ON CONFLICT (cle) DO NOTHING;
