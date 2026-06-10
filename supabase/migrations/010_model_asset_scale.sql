-- Track the uniform scale factor applied to a model's GLB/USDZ so it matches
-- the merchant's real-world product dimensions (width_m/height_m/depth_m).
-- Used to mark already-rescaled assets and to drive a one-time backfill for
-- assets generated before this fix existed.
alter table model_assets add column if not exists applied_scale numeric;

notify pgrst, 'reload schema';
