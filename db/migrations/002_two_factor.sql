-- Optional TOTP two-factor login for the admin
alter table profiles
  add column if not exists totp_secret text,
  add column if not exists totp_enabled boolean not null default false,
  add column if not exists totp_last_step bigint not null default 0,
  add column if not exists recovery_codes text[] not null default '{}';
