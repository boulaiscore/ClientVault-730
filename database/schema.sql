create extension if not exists "pgcrypto";
create type public.organization_role as enum ('owner', 'admin', 'member');
create type public.client_status as enum ('active', 'archived');
create type public.request_status as enum ('draft', 'sent', 'in_progress', 'completed', 'archived');
create type public.practice_status as enum ('draft', 'sent', 'in_progress', 'needs_review', 'complete', 'archived');
create type public.practice_item_status as enum ('requested', 'uploaded', 'needs_correction', 'approved', 'not_needed');
create type public.document_uploaded_by_type as enum ('client', 'studio');
create type public.document_status as enum ('active', 'deleted');
create type public.activity_event_type as enum ('public_link_opened', 'document_uploaded', 'document_deleted', 'public_link_disabled', 'public_link_enabled');
create type public.activity_actor_type as enum ('client', 'studio', 'system');
create or replace function public.generate_public_token() returns text language sql as $$ select replace(replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_'), '=', ''); $$;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, email text not null, full_name text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.organizations (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, owner_id uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.organization_members (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, role public.organization_role not null default 'member', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organization_id, user_id));
create table public.client_profiles (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, first_name text not null, last_name text not null, email text, phone text, tax_code text, status public.client_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.checklist_templates (id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade, key text not null, name text not null, description text, is_default boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organization_id, key));
create unique index checklist_templates_global_key_idx on public.checklist_templates(key) where organization_id is null;
create table public.checklist_template_categories (id uuid primary key default gen_random_uuid(), template_id uuid not null references public.checklist_templates(id) on delete cascade, name text not null, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.checklist_template_items (id uuid primary key default gen_random_uuid(), template_id uuid not null references public.checklist_templates(id) on delete cascade, category_id uuid not null references public.checklist_template_categories(id) on delete cascade, label text not null, required boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.practices (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_id uuid not null references public.client_profiles(id) on delete cascade, template_id uuid not null references public.checklist_templates(id) on delete restrict, fiscal_year integer not null, status public.practice_status not null default 'draft', public_token text not null default public.generate_public_token(), public_link_enabled boolean not null default true, archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.practice_items (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, practice_id uuid not null references public.practices(id) on delete cascade, template_item_id uuid not null references public.checklist_template_items(id) on delete restrict, category_name text not null, label text not null, required boolean not null default true, status public.practice_item_status not null default 'requested', note text, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.client_requests (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_id uuid not null references public.client_profiles(id) on delete cascade, title text not null, description text, status public.request_status not null default 'draft', due_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.document_records (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, client_id uuid not null references public.client_profiles(id) on delete cascade, practice_id uuid references public.practices(id) on delete cascade, practice_item_id uuid references public.practice_items(id) on delete cascade, request_id uuid references public.client_requests(id) on delete set null, storage_path text not null, file_name text not null, content_type text, size_bytes bigint, original_file_name text not null default '', stored_file_name text not null default '', mime_type text not null default 'application/octet-stream', file_size_bytes bigint not null default 0, uploaded_by_type public.document_uploaded_by_type not null default 'client', status public.document_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.activity_log_events (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, practice_id uuid references public.practices(id) on delete cascade, practice_item_id uuid references public.practice_items(id) on delete cascade, document_id uuid references public.document_records(id) on delete set null, event_type public.activity_event_type not null, actor_type public.activity_actor_type not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index practices_organization_id_idx on public.practices(organization_id); create unique index practices_public_token_idx on public.practices(public_token); create index practice_items_organization_id_idx on public.practice_items(organization_id); create index practice_items_practice_id_idx on public.practice_items(practice_id); create index document_records_practice_item_id_idx on public.document_records(practice_item_id); create index activity_log_events_practice_id_idx on public.activity_log_events(practice_id);
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at(); create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at(); create trigger client_profiles_set_updated_at before update on public.client_profiles for each row execute function public.set_updated_at(); create trigger practices_set_updated_at before update on public.practices for each row execute function public.set_updated_at(); create trigger practice_items_set_updated_at before update on public.practice_items for each row execute function public.set_updated_at(); create trigger document_records_set_updated_at before update on public.document_records for each row execute function public.set_updated_at(); create trigger activity_log_events_set_updated_at before update on public.activity_log_events for each row execute function public.set_updated_at();
alter table public.profiles enable row level security; alter table public.organizations enable row level security; alter table public.organization_members enable row level security; alter table public.client_profiles enable row level security; alter table public.checklist_templates enable row level security; alter table public.checklist_template_categories enable row level security; alter table public.checklist_template_items enable row level security; alter table public.practices enable row level security; alter table public.practice_items enable row level security; alter table public.client_requests enable row level security; alter table public.document_records enable row level security; alter table public.activity_log_events enable row level security;
create or replace function public.is_org_member(target_organization_id uuid) returns boolean language sql security definer set search_path = public as $$ select exists (select 1 from public.organization_members where organization_id = target_organization_id and user_id = auth.uid()); $$;
create or replace function public.check_required_public_tables(table_names text[]) returns text[] language sql security definer set search_path = public as $$ select coalesce(array_agg(required_table), '{}'::text[]) from unnest(table_names) as required_table where not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = required_table); $$;
create policy "Users can read own profile" on public.profiles for select using (id = auth.uid()); create policy "Members can read organizations" on public.organizations for select using (public.is_org_member(id)); create policy "Members can read clients" on public.client_profiles for select using (public.is_org_member(organization_id)); create policy "Members can read practices" on public.practices for select using (public.is_org_member(organization_id)); create policy "Members can read practice items" on public.practice_items for select using (public.is_org_member(organization_id)); create policy "Members can read documents" on public.document_records for select using (public.is_org_member(organization_id)); create policy "Members can read activity log events" on public.activity_log_events for select using (public.is_org_member(organization_id));
grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on all routines in schema public to authenticated;

-- Storage bucket setup is managed by supabase/migrations/20260706000004_private_storage_bucket.sql and mirrored in database/migrations/0004_private_storage_bucket.sql.

insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do update set public = false;

-- Reminder email system and correction loop.
alter type public.activity_event_type add value if not exists 'reminder_sent';
alter type public.activity_event_type add value if not exists 'reminder_failed';
alter type public.activity_event_type add value if not exists 'correction_notification_sent';
alter type public.activity_event_type add value if not exists 'correction_notification_failed';
alter type public.activity_event_type add value if not exists 'item_marked_needs_correction';
alter type public.activity_event_type add value if not exists 'item_approved';
alter type public.activity_event_type add value if not exists 'item_marked_not_needed';

do $$ begin create type public.reminder_channel as enum ('email'); exception when duplicate_object then null; end $$;
do $$ begin create type public.reminder_type as enum ('missing_documents', 'correction'); exception when duplicate_object then null; end $$;
do $$ begin create type public.reminder_status as enum ('sent', 'failed'); exception when duplicate_object then null; end $$;

alter table public.practices add column if not exists reminder_enabled boolean not null default true;
alter table public.practices add column if not exists last_reminder_sent_at timestamptz;
alter table public.practices add column if not exists reminder_count integer not null default 0;
alter table public.practice_items add column if not exists note_to_client text;
update public.practice_items set note_to_client = note where note_to_client is null and note is not null;

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  channel public.reminder_channel not null default 'email',
  reminder_type public.reminder_type not null,
  target_item_id uuid references public.practice_items(id) on delete set null,
  status public.reminder_status not null,
  sent_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_organization_id_idx on public.reminders(organization_id);
create index if not exists reminders_practice_id_idx on public.reminders(practice_id);
create index if not exists reminders_target_item_id_idx on public.reminders(target_item_id);
create index if not exists practices_reminder_due_idx on public.practices(public_link_enabled, reminder_enabled, last_reminder_sent_at) where archived_at is null;

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at before update on public.reminders for each row execute function public.set_updated_at();
alter table public.reminders enable row level security;
drop policy if exists "Members can read reminders" on public.reminders;
create policy "Members can read reminders" on public.reminders for select using (public.is_org_member(organization_id));
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;
