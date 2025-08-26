-- Create public bucket for article images
-- Run this once in Supabase SQL editor or psql

-- 1) Create bucket `images` if not exists and set public
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'images') then
    perform storage.create_bucket(
      bucket_id => 'images',
      name => 'images',
      public => true
    );
  else
    update storage.buckets set public = true where id = 'images' and public is distinct from true;
  end if;
end $$;

-- 2) Policies: allow public read; service_role full access
-- Remove existing policies with same names (idempotent)
do $$ begin
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public read access to images') then
    drop policy "Public read access to images" on storage.objects;
  end if;
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Service role full access to images') then
    drop policy "Service role full access to images" on storage.objects;
  end if;
end $$;

create policy "Public read access to images"
on storage.objects for select
to public
using (bucket_id = 'images');

create policy "Service role full access to images"
on storage.objects for all
to service_role
using (bucket_id = 'images')
with check (bucket_id = 'images');

-- 3) (Optional) Allow authenticated users to upload to images bucket
-- Uncomment if needed
-- create policy "Authenticated upload images"
-- on storage.objects for insert
-- to authenticated
-- with check (bucket_id = 'images');


