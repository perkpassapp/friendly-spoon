alter table public.business_applications
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.business_accounts
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.deals
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.business_applications
  drop constraint if exists business_applications_latitude_check;
alter table public.business_applications
  add constraint business_applications_latitude_check
  check (latitude is null or latitude between -90 and 90);

alter table public.business_applications
  drop constraint if exists business_applications_longitude_check;
alter table public.business_applications
  add constraint business_applications_longitude_check
  check (longitude is null or longitude between -180 and 180);

alter table public.business_accounts
  drop constraint if exists business_accounts_latitude_check;
alter table public.business_accounts
  add constraint business_accounts_latitude_check
  check (latitude is null or latitude between -90 and 90);

alter table public.business_accounts
  drop constraint if exists business_accounts_longitude_check;
alter table public.business_accounts
  add constraint business_accounts_longitude_check
  check (longitude is null or longitude between -180 and 180);

alter table public.deals
  drop constraint if exists deals_latitude_check;
alter table public.deals
  add constraint deals_latitude_check
  check (latitude is null or latitude between -90 and 90);

alter table public.deals
  drop constraint if exists deals_longitude_check;
alter table public.deals
  add constraint deals_longitude_check
  check (longitude is null or longitude between -180 and 180);

create index if not exists business_accounts_latitude_longitude_idx
  on public.business_accounts (latitude, longitude);

create index if not exists deals_latitude_longitude_idx
  on public.deals (latitude, longitude);
