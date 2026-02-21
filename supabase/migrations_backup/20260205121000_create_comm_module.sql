-- Communications module (SMS + Voice) core tables

create table if not exists public.comm_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  channel text not null check (channel in ('sms','voice')),
  customer_phone_e164 text not null,
  twilio_number_e164 text not null,

  status text not null default 'open' check (status in ('open','closed')),
  assigned_to_user_id uuid null,

  last_activity_at timestamptz null,
  last_message_preview text null
);

create index if not exists comm_conversations_lookup
  on public.comm_conversations (channel, customer_phone_e164, twilio_number_e164);
create index if not exists comm_conversations_status
  on public.comm_conversations (status, last_activity_at desc nulls last);

create table if not exists public.comm_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  conversation_id uuid not null references public.comm_conversations(id) on delete cascade,

  direction text not null check (direction in ('inbound','outbound')),
  from_number_e164 text,
  to_number_e164 text,

  body text,
  media_urls jsonb,

  twilio_message_sid text unique,
  twilio_status text,
  twilio_error_code text,
  twilio_error_message text,

  raw_payload jsonb
);

create index if not exists comm_messages_conversation_time
  on public.comm_messages (conversation_id, created_at desc);

create table if not exists public.comm_calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  direction text not null check (direction in ('inbound','outbound')),
  from_number_e164 text,
  to_number_e164 text,

  twilio_call_sid text unique,
  twilio_parent_call_sid text,
  twilio_status text,
  duration_seconds int,
  twilio_error_code text,
  twilio_error_message text,

  recording_sid text,
  recording_url text,

  raw_payload jsonb
);

create index if not exists comm_calls_time
  on public.comm_calls (created_at desc);

-- updated_at trigger for comm_conversations
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_comm_conversations_updated_at'
  ) then
    create trigger trg_comm_conversations_updated_at
      before update on public.comm_conversations
      for each row execute function public.set_updated_at();
  end if;
end $$;
