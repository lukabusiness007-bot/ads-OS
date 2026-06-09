-- Bulletproof the Stripe top-up idempotency guard (security review #1).
--
-- recordTopupPurchase() already checks-then-inserts on the Stripe checkout
-- session id, which closes normal webhook retries (seconds-to-minutes apart). This
-- partial unique index closes the remaining race: two *simultaneous* duplicate
-- deliveries can both pass the existence check, but only one INSERT can win — the
-- second fails with a unique violation, so a session is credited at most once.
--
-- The application ignores the insert error path, so the losing insert silently
-- no-ops (the credit already exists). Scoped to top-up events that carry a
-- sessionId, so unrelated usage_events are unaffected.
create unique index if not exists usage_events_topup_session_idx
  on usage_events ((metadata->>'sessionId'))
  where event_type = 'generation_topup' and (metadata->>'sessionId') is not null;

notify pgrst, 'reload schema';
