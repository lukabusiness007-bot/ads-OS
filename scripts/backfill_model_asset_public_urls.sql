-- Backfill model_assets rows whose public_*_url columns still point at the
-- private R2 S3 API endpoint (<account>.r2.cloudflarestorage.com).  Replace
-- only the host+scheme portion with the correct public R2 base URL, preserving
-- the object-key path that follows.
--
-- HOW TO RUN (Supabase SQL editor):
--   1. Replace 'REPLACE_WITH_YOUR_PUB_R2_DEV_URL' below with your actual
--      pub-<hash>.r2.dev URL (no trailing slash), e.g. https://pub-abc123.r2.dev
--   2. Paste the whole script into the Supabase SQL editor and click Run.
--
-- This is a one-time MANUAL operation. Do NOT add it to supabase/migrations/ —
-- it requires your specific r2.dev URL and must not auto-run on db push.
-- The app already derives URLs from glb_r2_key at read time so models display
-- correctly without this script. Running it only cleans the persisted columns.

DO $$
DECLARE
  v_public_base text := 'REPLACE_WITH_YOUR_PUB_R2_DEV_URL'; -- e.g. https://pub-abc123.r2.dev
  v_bad_pattern text := '%r2.cloudflarestorage.com%';
BEGIN
  IF v_public_base = 'REPLACE_WITH_YOUR_PUB_R2_DEV_URL' THEN
    RAISE NOTICE 'Skipping backfill: replace v_public_base with your actual r2.dev URL and run again.';
    RETURN;
  END IF;

  UPDATE model_assets
  SET
    public_glb_url = CASE
      WHEN public_glb_url LIKE v_bad_pattern
        THEN v_public_base || regexp_replace(public_glb_url, '^https?://[^/]+', '')
      ELSE public_glb_url
    END,
    public_usdz_url = CASE
      WHEN public_usdz_url LIKE v_bad_pattern
        THEN v_public_base || regexp_replace(public_usdz_url, '^https?://[^/]+', '')
      ELSE public_usdz_url
    END,
    public_poster_url = CASE
      WHEN public_poster_url LIKE v_bad_pattern
        THEN v_public_base || regexp_replace(public_poster_url, '^https?://[^/]+', '')
      ELSE public_poster_url
    END
  WHERE
    public_glb_url   LIKE v_bad_pattern OR
    public_usdz_url  LIKE v_bad_pattern OR
    public_poster_url LIKE v_bad_pattern;

  RAISE NOTICE 'Backfill complete. Rows updated: %', ROW_COUNT;
END $$;
