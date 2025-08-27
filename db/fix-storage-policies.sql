-- 修复Supabase存储策略，解决图片重新托管的权限问题
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 确保images存储桶存在且为公开
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'images') then
    perform storage.create_bucket(
      bucket_id => 'images',
      name => 'images',
      public => true,
      file_size_limit => 10485760, -- 10MB
      allowed_mime_types => array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
  else
    update storage.buckets 
    set public = true,
        file_size_limit = 10485760,
        allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    where id = 'images';
  end if;
end $$;

-- 2. 删除所有现有的存储策略（清理旧策略）
do $$ 
begin
  -- 删除storage.objects的策略
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public read access to images') then
    drop policy "Public read access to images" on storage.objects;
  end if;
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Service role full access to images') then
    drop policy "Service role full access to images" on storage.objects;
  end if;
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated upload images') then
    drop policy "Authenticated upload images" on storage.objects;
  end if;
  
  -- 删除storage.buckets的策略
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='buckets' and policyname='Public read access to images bucket') then
    drop policy "Public read access to images bucket" on storage.buckets;
  end if;
  if exists(select 1 from pg_policies where schemaname='storage' and tablename='buckets' and policyname='Service role full access to images bucket') then
    drop policy "Service role full access to images bucket" on storage.buckets;
  end if;
end $$;

-- 3. 创建新的存储策略

-- 允许所有人读取images存储桶中的文件
create policy "Public read access to images"
on storage.objects for select
to public
using (bucket_id = 'images');

-- 允许service_role对images存储桶有完全访问权限
create policy "Service role full access to images"
on storage.objects for all
to service_role
using (bucket_id = 'images')
with check (bucket_id = 'images');

-- 允许认证用户上传到images存储桶
create policy "Authenticated upload images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'images');

-- 允许认证用户更新自己的文件
create policy "Authenticated update images"
on storage.objects for update
to authenticated
using (bucket_id = 'images')
with check (bucket_id = 'images');

-- 允许认证用户删除自己的文件
create policy "Authenticated delete images"
on storage.objects for delete
to authenticated
using (bucket_id = 'images');

-- 4. 为存储桶本身创建策略
create policy "Public read access to images bucket"
on storage.buckets for select
to public
using (id = 'images');

create policy "Service role full access to images bucket"
on storage.buckets for all
to service_role
using (id = 'images')
with check (id = 'images');

-- 5. 验证策略是否创建成功
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where schemaname = 'storage' 
  and (tablename = 'objects' or tablename = 'buckets')
  and tablename in (
    select table_name 
    from information_schema.tables 
    where table_schema = 'storage' 
      and table_name in ('objects', 'buckets')
  )
order by tablename, policyname;

-- 6. 检查存储桶配置
select 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets 
where id = 'images';
