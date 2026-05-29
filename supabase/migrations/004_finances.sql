-- prestations (catalogue)
CREATE TABLE IF NOT EXISTS prestations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle       text NOT NULL,
  description   text,
  unite         text NOT NULL DEFAULT 'u',
  prix_unitaire numeric(10,2) NOT NULL DEFAULT 0,
  taux_tva      numeric(4,2)  NOT NULL DEFAULT 8.5,
  actif         boolean       NOT NULL DEFAULT true,
  created_at    timestamptz   NOT NULL DEFAULT now()
);
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON prestations FOR ALL USING (auth.uid() IS NOT NULL);

-- devis
CREATE TABLE IF NOT EXISTS devis (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero         text NOT NULL UNIQUE,
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  projet_id      uuid REFERENCES projets(id) ON DELETE SET NULL,
  statut         text NOT NULL DEFAULT 'brouillon',
  date_emission  date NOT NULL DEFAULT CURRENT_DATE,
  date_validite  date NOT NULL,
  montant_ht     numeric(10,2) NOT NULL DEFAULT 0,
  montant_tva    numeric(10,2) NOT NULL DEFAULT 0,
  montant_ttc    numeric(10,2) NOT NULL DEFAULT 0,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON devis FOR ALL USING (auth.uid() IS NOT NULL);

-- devis_lignes
CREATE TABLE IF NOT EXISTS devis_lignes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id       uuid NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
  prestation_id  uuid REFERENCES prestations(id) ON DELETE SET NULL,
  libelle        text NOT NULL,
  quantite       numeric(10,3) NOT NULL DEFAULT 1,
  unite          text NOT NULL DEFAULT 'u',
  prix_unitaire  numeric(10,2) NOT NULL,
  taux_tva       numeric(4,2)  NOT NULL DEFAULT 8.5,
  total_ht       numeric(10,2) NOT NULL,
  ordre          integer       NOT NULL DEFAULT 0
);
ALTER TABLE devis_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON devis_lignes FOR ALL USING (auth.uid() IS NOT NULL);

-- factures
CREATE TABLE IF NOT EXISTS factures (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero              text NOT NULL UNIQUE,
  devis_id            uuid REFERENCES devis(id) ON DELETE SET NULL,
  client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  projet_id           uuid REFERENCES projets(id) ON DELETE SET NULL,
  type                text NOT NULL DEFAULT 'facture',
  statut              text NOT NULL DEFAULT 'émise',
  date_emission       date NOT NULL DEFAULT CURRENT_DATE,
  date_echeance       date NOT NULL,
  pourcentage_acompte numeric(5,2),
  montant_ht          numeric(10,2) NOT NULL DEFAULT 0,
  montant_tva         numeric(10,2) NOT NULL DEFAULT 0,
  montant_ttc         numeric(10,2) NOT NULL DEFAULT 0,
  date_paiement       date,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON factures FOR ALL USING (auth.uid() IS NOT NULL);

-- factures_lignes
CREATE TABLE IF NOT EXISTS factures_lignes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id     uuid NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  libelle        text NOT NULL,
  quantite       numeric(10,3) NOT NULL DEFAULT 1,
  unite          text NOT NULL DEFAULT 'u',
  prix_unitaire  numeric(10,2) NOT NULL,
  taux_tva       numeric(4,2)  NOT NULL DEFAULT 8.5,
  total_ht       numeric(10,2) NOT NULL,
  ordre          integer       NOT NULL DEFAULT 0
);
ALTER TABLE factures_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users only" ON factures_lignes FOR ALL USING (auth.uid() IS NOT NULL);

-- Nouvelles clés app_settings
INSERT INTO app_settings (cle, valeur) VALUES
  ('rib_iban', NULL),
  ('rib_bic', NULL),
  ('rib_banque', NULL),
  ('devis_validite_jours', '30'),
  ('facture_echeance_jours', '30'),
  ('facture_mentions', NULL)
ON CONFLICT (cle) DO NOTHING;
