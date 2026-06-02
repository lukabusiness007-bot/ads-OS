insert into organizations (id, name, slug, website, plan_key)
values (
  '00000000-0000-4000-8000-000000000001',
  'Northline Home',
  'northline-home',
  'https://northline.example',
  'growth'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  website = excluded.website,
  plan_key = excluded.plan_key;

insert into products (
  id,
  organization_id,
  name,
  slug,
  category,
  status,
  description,
  customer_url,
  price,
  width_m,
  height_m,
  depth_m,
  photo_count,
  required_angles_complete
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    'Arc Oak Dining Chair',
    'arc-oak-dining-chair',
    'chair',
    'published',
    'Solid oak dining chair with curved back support.',
    'https://northline.example/products/arc-oak-chair',
    '89 EUR',
    0.48,
    0.82,
    0.52,
    16,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    'Mira Table Lamp',
    'mira-table-lamp',
    'lamp',
    'generating',
    'Compact ceramic lamp with woven linen shade.',
    'https://northline.example/products/mira-lamp',
    '54 EUR',
    0.24,
    0.46,
    0.24,
    12,
    true
  )
on conflict (organization_id, slug) do update set
  status = excluded.status,
  photo_count = excluded.photo_count,
  required_angles_complete = excluded.required_angles_complete;

insert into model_assets (
  organization_id,
  product_id,
  glb_r2_key,
  usdz_r2_key,
  poster_r2_key,
  public_glb_url,
  public_usdz_url,
  public_poster_url,
  file_size_mb,
  triangle_count,
  texture_max,
  dimensions_present
)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'seed/model.glb',
  'seed/model.usdz',
  'seed/poster.svg',
  '/models/sample-product.glb',
  '/models/sample-product.usdz',
  '/posters/sample-product.svg',
  0.01,
  72,
  4096,
  true
);

insert into hosted_pages (organization_id, product_id, slug, public_url, status, cta_label, published_at)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'arc-oak-dining-chair',
  '/p/northline-home/arc-oak-dining-chair',
  'published',
  'View on store',
  now()
)
on conflict (organization_id, slug) do update set
  status = excluded.status,
  public_url = excluded.public_url,
  published_at = excluded.published_at;

insert into analytics_events (organization_id, product_id, event_type, device_type, metadata)
select
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  event_type,
  device_type,
  '{}'::jsonb
from (
  values
    ('page_view', 'mobile'),
    ('page_view', 'desktop'),
    ('viewer_interaction', 'mobile'),
    ('ar_button_click', 'mobile'),
    ('cta_click', 'mobile')
) as seed_events(event_type, device_type);
