-- Email + marketing columns on profiles.
-- welcome_email_sent_at: idempotency guard so the branded welcome fires once.
-- marketing_consent: drives Resend Audience subscribed/unsubscribed state.
-- resend_contact_id: id of the synced contact in the Resend Audience.

alter table profiles
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists marketing_consent boolean default true,
  add column if not exists marketing_consent_updated_at timestamptz default now(),
  add column if not exists resend_contact_id text;
