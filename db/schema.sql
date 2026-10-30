-- eazy — local database schema (PostgreSQL). Access control lives in the app server, not in RLS.

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

-- ---------- catalogue ----------
create table public.project_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null, name_ar text not null default '', name_en text not null default '',
  description_fr text, description_ar text, description_en text,
  icon text, is_active boolean not null default true, sort_order int not null default 0
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null, name_ar text not null default '', name_en text not null default '',
  description_fr text, description_ar text, description_en text,
  icon text, image_url text,
  is_active boolean not null default true, sort_order int not null default 0
);

create table public.category_project_types (
  category_id uuid references public.categories(id) on delete cascade,
  project_type_id uuid references public.project_types(id) on delete cascade,
  primary key (category_id, project_type_id)
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  name_fr text not null, name_ar text not null default '', name_en text not null default '',
  short_desc_fr text, short_desc_ar text, short_desc_en text,
  long_desc_fr text, long_desc_ar text, long_desc_en text,
  included_features text[] not null default '{}',
  thumbnail_url text, demo_url text,
  price_min numeric(12,2) not null default 0, price_max numeric(12,2) not null default 0,
  delivery_days int not null default 14,
  technologies text[] not null default '{}',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (price_max >= price_min)
);
create index on public.templates (category_id);

create table public.template_project_types (
  template_id uuid references public.templates(id) on delete cascade,
  project_type_id uuid references public.project_types(id) on delete cascade,
  primary key (template_id, project_type_id)
);

create table public.template_images (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  image_url text not null,
  device text not null default 'desktop' check (device in ('desktop','mobile')),
  sort_order int not null default 0
);

create table public.feature_groups (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null, name_ar text not null default '', name_en text not null default '',
  sort_order int not null default 0
);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.feature_groups(id) on delete restrict,
  name_fr text not null, name_ar text not null default '', name_en text not null default '',
  description_fr text, description_ar text, description_en text,
  price_min numeric(12,2) not null default 0, price_max numeric(12,2) not null default 0,
  extra_days int not null default 0,
  is_active boolean not null default true, sort_order int not null default 0,
  check (price_max >= price_min)
);

-- empty link set = feature available for every category
create table public.feature_categories (
  feature_id uuid references public.features(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (feature_id, category_id)
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null, name_ar text not null default '', name_en text not null default '',
  description_fr text, description_ar text, description_en text,
  price numeric(12,2) not null default 0,
  billing_type text not null default 'one_time' check (billing_type in ('one_time','monthly','yearly')),
  kind text not null default 'project' check (kind in ('project','maintenance')),
  items_fr jsonb not null default '[]', items_ar jsonb not null default '[]', items_en jsonb not null default '[]',
  is_highlighted boolean not null default false,
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true, sort_order int not null default 0
);

-- ---------- requests ----------
create table public.project_requests (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null default '',
  project_type_id uuid references public.project_types(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  custom_design boolean not null default false,
  package_id uuid references public.packages(id) on delete set null,
  client_name text not null, business_name text, sector text, city text, country text,
  email text not null, phone text, whatsapp text,
  language text not null default 'fr' check (language in ('fr','ar','en')),
  description text, deadline date, budget_range text,
  estimated_min numeric(12,2) not null default 0, estimated_max numeric(12,2) not null default 0,
  estimated_days int not null default 0,
  final_price numeric(12,2), deposit_amount numeric(12,2),
  deposit_paid boolean not null default false, final_paid boolean not null default false,
  status text not null default 'new' check (status in
    ('new','contacted','meeting_done','quote_sent','won','in_progress','delivered','lost','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.project_requests (status);
create index on public.project_requests (created_at desc);
create trigger trg_requests_updated before update on public.project_requests
  for each row execute function public.set_updated_at();

-- PRJ-YYYY-#### (counter restarts each year)
-- security definer: the inserting visitor can't SELECT existing rows through RLS
create or replace function public.set_request_reference() returns trigger
language plpgsql security definer set search_path = public as $$
declare yr text := to_char(now(), 'YYYY'); n int;
begin
  if new.reference is null or new.reference = '' then
    perform pg_advisory_xact_lock(hashtext('project_requests_reference'));
    select coalesce(max(substring(reference from '\d+$')::int), 0) + 1 into n
      from public.project_requests where reference like 'PRJ-' || yr || '-%';
    new.reference := 'PRJ-' || yr || '-' || lpad(n::text, 4, '0');
  end if;
  return new;
end $$;
create trigger trg_requests_ref before insert on public.project_requests
  for each row execute function public.set_request_reference();

create table public.request_features (
  request_id uuid references public.project_requests(id) on delete cascade,
  feature_id uuid references public.features(id) on delete set null,
  price_min numeric(12,2) not null default 0, price_max numeric(12,2) not null default 0,
  primary key (request_id, feature_id)
);

create table public.request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.project_requests(id) on delete cascade,
  file_url text not null, file_name text not null
);

create table public.request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.project_requests(id) on delete cascade,
  note text not null, created_at timestamptz not null default now()
);

-- ---------- booking ----------
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null, end_time time not null,
  slot_minutes int not null default 60 check (slot_minutes between 15 and 240),
  break_start time, break_end time,
  max_per_day int,
  is_active boolean not null default true
);

create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date unique not null, reason text
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.project_requests(id) on delete cascade,
  date date not null, start_time time not null, end_time time not null,
  meeting_type text not null default 'video' check (meeting_type in ('in_person','video','phone')),
  status text not null default 'pending' check (status in ('pending','confirmed','done','cancelled','rescheduled')),
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);
-- a slot can't be booked twice (cancelled / rescheduled ones free the slot)
create unique index appointments_unique_slot on public.appointments (date, start_time)
  where status in ('pending','confirmed');

-- ---------- content ----------
create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_fr text not null, title_ar text not null default '', title_en text not null default '',
  client_name text, category_id uuid references public.categories(id) on delete set null,
  description_fr text, description_ar text, description_en text,
  result_fr text, result_ar text, result_en text,
  images text[] not null default '{}', technologies text[] not null default '{}',
  link text, is_featured boolean not null default false, is_published boolean not null default false,
  sort_order int not null default 0, created_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null, business text, photo_url text,
  text_fr text not null, text_ar text, text_en text,
  rating int not null default 5 check (rating between 1 and 5),
  is_published boolean not null default true, sort_order int not null default 0
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question_fr text not null, question_ar text, question_en text,
  answer_fr text not null, answer_ar text, answer_en text,
  is_active boolean not null default true, sort_order int not null default 0
);

create table public.site_settings (
  key text primary key, value jsonb not null default '{}'
);

create table public.seo_settings (
  page text primary key,
  title_fr text, title_ar text, title_en text,
  description_fr text, description_ar text, description_en text,
  og_image_url text
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action text not null, entity text not null, entity_id text, details jsonb,
  created_at timestamptz not null default now()
);

-- contact form messages (inserted server-side with the service role; admin reads)
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, phone text, message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
