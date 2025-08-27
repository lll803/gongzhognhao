-- 修复Supabase存储权限的SQL脚本（修复版）
-- 在Supabase控制台 → SQL Editor中运行

-- 1. 确保images存储桶存在并设置为public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 10485760, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/*'];

-- 2. 删除现有的存储策略（如果存在）
DROP POLICY IF EXISTS "Public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete images" ON storage.objects;

DROP POLICY IF EXISTS "Public read access to images bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Service role full access to images bucket" ON storage.buckets;

-- 3. 为storage.objects创建策略
-- 允许所有人读取images存储桶中的文件
CREATE POLICY "Public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 允许service_role完全访问images存储桶
CREATE POLICY "Service role full access to images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- 允许认证用户上传文件到images存储桶
CREATE POLICY "Authenticated upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 允许认证用户更新images存储桶中的文件
CREATE POLICY "Authenticated update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- 允许认证用户删除images存储桶中的文件
CREATE POLICY "Authenticated delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- 4. 为storage.buckets创建策略
-- 允许所有人读取images存储桶信息
CREATE POLICY "Public read access to images bucket"
ON storage.buckets FOR SELECT
TO public
USING (id = 'images');

-- 允许service_role完全访问images存储桶
CREATE POLICY "Service role full access to images bucket"
ON storage.buckets FOR ALL
TO service_role
USING (id = 'images')
WITH CHECK (id = 'images');

-- 5. 验证策略是否创建成功
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('objects', 'buckets')
ORDER BY tablename, policyname;

-- 6. 验证存储桶配置
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'images';
