-- Twilio inbound SMS logging
create table if not exists public.twilio_inbound_messages (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  message_sid text unique,
  from_number text,
  to_number text,
  body text,
  raw_payload jsonb
);
