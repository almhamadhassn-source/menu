-- Single-restaurant schema (no multi-branch). See supabase/seed.sql for how to bootstrap the
-- first (owner) staff PIN after running this.

create table public.restaurant (id uuid primary key default gen_random_uuid(), slug text unique not null, name jsonb not null, theme_color text not null default '#d9e85a', logo_url text, video_url text, created_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), parent_id uuid references public.categories(id) on delete set null, sort_order integer not null default 0, image_url text, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.items (id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id), image_url text, tags text[] not null default '{}', sort_order integer not null default 0, is_active boolean not null default true, is_available boolean not null default true, created_at timestamptz not null default now());
create table public.variants (id uuid primary key default gen_random_uuid(), item_id uuid not null references public.items(id) on delete cascade, label_key text not null default 'regular', sort_order integer not null default 0, price numeric(12, 0) not null default 0 check(price >= 0), currency text not null default 'IQD', unique(item_id, label_key));
create table public.item_translations (item_id uuid references public.items(id) on delete cascade, lang text check(lang in ('ar','ckb','en')), name text not null, description text, primary key(item_id, lang));
create table public.category_translations (category_id uuid references public.categories(id) on delete cascade, lang text check(lang in ('ar','ckb','en')), name text not null, primary key(category_id, lang));

-- Staff sign in with a short PIN, not Supabase Auth (see src/lib/dal.ts) — so there's no
-- auth.uid() to key this table off. code_hash is HMAC-SHA256(pin, STAFF_CODE_PEPPER); a plain
-- unique index gives O(1) login lookup without per-row salting (see src/lib/pin.ts for why that
-- trade-off is fine for a short operational PIN).
--
-- is_owner: the one account with unconditional access to everything, including granting/revoking
-- the two permissions below for the other staff rows. Never set from the app UI — bootstrap it by
-- hand (see seed.sql). The partial unique index below keeps it to exactly one row.
-- can_toggle_availability / can_manage_menu: independently grantable per staff row — see
-- src/lib/dal.ts for how a session's effective permissions are derived (owner implies both).
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  is_owner boolean not null default false,
  can_toggle_availability boolean not null default false,
  can_manage_menu boolean not null default false,
  display_name text not null,
  code_hash text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index staff_single_owner on public.staff (is_owner) where is_owner;

create table public.audit_log (id bigint generated always as identity primary key, actor_id uuid references public.staff(id), action text not null, entity text not null, entity_id uuid, payload jsonb, created_at timestamptz not null default now());

alter table public.restaurant enable row level security; alter table public.categories enable row level security; alter table public.items enable row level security; alter table public.variants enable row level security; alter table public.item_translations enable row level security; alter table public.category_translations enable row level security; alter table public.staff enable row level security; alter table public.audit_log enable row level security;

create policy "public reads restaurant" on public.restaurant for select using (true);
create policy "public reads active categories" on public.categories for select using (is_active = true);
create policy "public reads visible items" on public.items for select using (is_active = true and is_available = true);
create policy "public reads variants" on public.variants for select using (true);
create policy "public reads translations" on public.item_translations for select using (true);
create policy "public reads category translations" on public.category_translations for select using (true);

-- `staff` and `audit_log` have RLS enabled with NO policies below (default-deny): staff PIN
-- hashes and the change log are never read via the anon/authenticated key. Every admin
-- read/write (overview, settings, menu editor) goes through a service-role Supabase client from
-- a Server Action, only after src/lib/dal.ts has verified the caller's signed session cookie —
-- that check is the real authorization boundary, not RLS.
--
-- `categories`/`items`/`variants`/`item_translations`/`category_translations` only have SELECT
-- policies above, on purpose: there is no write policy, so writes through the anon/authenticated
-- key fail closed too. The app's only writer is the service-role client, which bypasses RLS
-- entirely and relies on src/lib/dal.ts + src/lib/actions.ts for authorization instead.

-- Lets the customer-facing menu react live to admin changes (see the Realtime subscription in
-- src/components/MenuExperience.tsx) instead of only updating on next page load.
alter publication supabase_realtime add table public.items, public.item_translations, public.variants;
