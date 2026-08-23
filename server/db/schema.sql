-- The Judgment Ledger — schema
-- Run this in the Supabase SQL editor (or `supabase db push`) before starting the server.

create extension if not exists pgcrypto;

create table if not exists service_dependencies (
  service    text primary key,
  downstream text[] not null default '{}'
);

create table if not exists trust_boundaries (
  category               text primary key,
  status                 text not null check (status in ('auto-approve trusted', 'escalation required')),
  min_sample_required    int not null,
  current_sample_size    int not null default 0,
  confidence_floor       numeric not null,
  corrections            int not null default 0,
  correction_severity    text not null default 'none' check (correction_severity in ('none', 'minor', 'severe')),
  recommendation         text not null default 'hold as-is' check (recommendation in ('expand trust', 'restore trust', 'hold as-is')),
  reasoning              text,
  updated_at             timestamptz not null default now()
);

create table if not exists submissions (
  id                    text primary key,
  author                text not null,
  author_initials       text,
  service               text not null references service_dependencies(service),
  branch                text,
  commit_ref            text,
  category              text references trust_boundaries(category),
  tests_passed          int,
  tests_total           int,
  blast_radius          int,
  affected_services     text[] not null default '{}',
  confidence            numeric,
  matched_history_count int,
  status                text not null default 'submitted'
                        check (status in ('submitted', 'auto-approved', 'escalated', 'approved', 'blocked', 'more_signal', 'shipped')),
  decision_reason       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists judgment_ledger (
  submission_id       text primary key references submissions(id),
  category            text not null,
  blast_radius         int,
  decision            text,
  confidence           numeric,
  evidence_sample_size int,
  human_corrected      boolean not null default false,
  observation_status   text not null default 'pending' check (observation_status in ('pending', 'incomplete', 'complete')),
  outcome              text,
  verdict              text,
  outcome_pdf_url       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists policy_proposals (
  id              uuid primary key default gen_random_uuid(),
  category        text not null references trust_boundaries(category),
  recommendation  text not null check (recommendation in ('expand trust', 'restore trust')),
  reasoning       text,
  proposal_pdf_url text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by      text,
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists deployment_observations (
  submission_id       text primary key references submissions(id),
  fast_window_status  text not null default 'pending' check (fast_window_status in ('pending', 'incomplete', 'complete')),
  fast_window_summary text,
  slow_window_status  text not null default 'pending' check (slow_window_status in ('pending', 'incomplete', 'complete')),
  slow_window_summary text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Storage buckets for the two generated-output (PDF) tools. Private — the
-- server signs URLs on demand rather than serving these publicly.
insert into storage.buckets (id, name, public)
values ('policy-proposals', 'policy-proposals', false), ('ledger-outcomes', 'ledger-outcomes', false)
on conflict (id) do nothing;
