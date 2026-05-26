-- supabase/migrations/001_initial_schema.sql

-- Clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  secteur text not null check (secteur in ('courants_forts','courants_faibles','photovoltaique','mixte')),
  adresse text,
  siret text,
  statut text not null default 'prospect' check (statut in ('prospect','actif','inactif')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contacts
create table contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  prenom text not null,
  nom text not null,
  poste text,
  telephone text,
  email text,
  est_principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projets
create table projets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  titre text not null,
  type text not null check (type in ('installation','etude','maintenance','sav')),
  secteur text not null check (secteur in ('courants_forts','courants_faibles','photovoltaique')),
  statut text not null default 'en_etude' check (statut in ('en_etude','en_cours','termine','sav')),
  avancement integer not null default 0 check (avancement >= 0 and avancement <= 100),
  montant_devis numeric(12,2),
  montant_facture numeric(12,2),
  date_debut_estimee date,
  date_fin_estimee date,
  date_fin_reelle date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  projet_id uuid references projets(id) on delete set null,
  type text not null check (type in ('devis','rapport','plan','photo','contrat','autre')),
  nom text not null,
  description text,
  storage_path text,
  taille_octets integer,
  genere_par_app boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tâches
create table taches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  projet_id uuid references projets(id) on delete set null,
  titre text not null,
  description text,
  date_echeance timestamptz,
  priorite text not null default 'normale' check (priorite in ('haute','normale','basse')),
  statut text not null default 'a_faire' check (statut in ('a_faire','fait')),
  notification_active boolean not null default false,
  notification_email boolean not null default false,
  notification_push boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Interactions
create table interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  projet_id uuid references projets(id) on delete set null,
  type text not null check (type in ('appel','email','visite','reunion','autre')),
  date timestamptz not null default now(),
  resume text not null,
  suite_a_donner text,
  created_at timestamptz not null default now()
);

-- Configuration modules (extensibilité)
create table modules_config (
  id uuid primary key default gen_random_uuid(),
  cle text not null unique,
  label text not null,
  icone text not null,
  ordre integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Données initiales
insert into modules_config (cle, label, icone, ordre, visible) values
  ('dashboard',     'Accueil',    '🏠', 1, true),
  ('clients',       'Clients',    '👥', 2, true),
  ('projets',       'Projets',    '🔨', 3, true),
  ('taches',        'Tâches',     '✅', 4, true),
  ('documents',     'Documents',  '📄', 5, true),
  ('interactions',  'Échanges',   '💬', 6, true);

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients for each row execute function update_updated_at();
create trigger contacts_updated_at before update on contacts for each row execute function update_updated_at();
create trigger projets_updated_at before update on projets for each row execute function update_updated_at();
create trigger taches_updated_at before update on taches for each row execute function update_updated_at();

-- RLS
alter table clients enable row level security;
alter table contacts enable row level security;
alter table projets enable row level security;
alter table documents enable row level security;
alter table taches enable row level security;
alter table interactions enable row level security;
alter table modules_config enable row level security;

create policy "auth_all" on clients for all using (auth.role() = 'authenticated');
create policy "auth_all" on contacts for all using (auth.role() = 'authenticated');
create policy "auth_all" on projets for all using (auth.role() = 'authenticated');
create policy "auth_all" on documents for all using (auth.role() = 'authenticated');
create policy "auth_all" on taches for all using (auth.role() = 'authenticated');
create policy "auth_all" on interactions for all using (auth.role() = 'authenticated');
create policy "auth_read" on modules_config for select using (auth.role() = 'authenticated');
