create table if not exists public.creator_affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text,
  referral_code text not null unique,
  payout_email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_affiliates_status_check
    check (status in ('active', 'paused'))
);

create table if not exists public.creator_referrals (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_affiliates(id) on delete restrict,
  referral_code text not null,
  member_email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text unique,
  plan text not null default 'annual',
  amount_paid integer not null default 3000,
  commission_amount integer not null default 500,
  payout_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_referrals_plan_check
    check (plan in ('annual')),
  constraint creator_referrals_payout_status_check
    check (payout_status in ('pending', 'approved', 'paid', 'rejected'))
);

create index if not exists creator_affiliates_referral_code_idx
  on public.creator_affiliates (lower(referral_code));

create index if not exists creator_referrals_creator_id_idx
  on public.creator_referrals (creator_id);

create index if not exists creator_referrals_payout_status_idx
  on public.creator_referrals (payout_status);
