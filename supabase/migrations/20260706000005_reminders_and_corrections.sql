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
