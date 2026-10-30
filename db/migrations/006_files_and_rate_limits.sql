-- Uploaded files live in the database (works on hosts without a persistent disk)
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,                -- 'media' (public images) | 'request-files' (private, admin only)
  path text not null,
  content_type text not null,
  size int not null,
  data bytea not null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

-- Rate limiting that works across serverless instances
create table if not exists rate_limits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limits_key_at on rate_limits (key, at);
