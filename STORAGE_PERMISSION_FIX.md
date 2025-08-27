# 解决Supabase存储权限问题

## 问题描述

图片重新托管失败，出现以下错误：
```
StorageApiError: new row violates row-level security policy
status: 400
statusCode: '403'
```

## 问题原因

这是**Supabase行级安全策略(RLS)**的问题，具体原因：

1. **存储桶启用了RLS**：Supabase默认启用行级安全策略
2. **策略配置不当**：缺少正确的上传权限策略
3. **service_role权限不足**：即使使用管理员密钥，仍被RLS策略阻止

## 解决方案

### 方法1：运行SQL修复脚本（推荐）

1. **登录Supabase控制台**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **打开SQL编辑器**
   - 左侧菜单 → SQL Editor
   - 点击 "New query"

3. **运行修复脚本**
   - 复制 `db/fix-storage-policies.sql` 的内容
   - 粘贴到SQL编辑器
   - 点击 "Run" 执行

4. **验证结果**
   - 脚本会显示创建的策略列表
   - 检查images存储桶配置

### 方法2：手动配置存储策略

如果SQL脚本不工作，可以手动配置：

#### 步骤1：创建存储桶
```sql
-- 在SQL编辑器中运行
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

#### 步骤2：创建访问策略
```sql
-- 允许所有人读取
CREATE POLICY "Public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 允许service_role完全访问
CREATE POLICY "Service role full access to images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- 允许认证用户上传
CREATE POLICY "Authenticated upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');
```

### 方法3：临时禁用RLS（不推荐）

⚠️ **警告**：这会降低安全性，仅用于测试

```sql
-- 临时禁用RLS进行测试
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- 测试完成后重新启用
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
```

## 验证修复

### 1. 运行测试脚本
```bash
# 设置环境变量
export SUPABASE_URL="你的项目URL"
export SUPABASE_SERVICE_ROLE_KEY="你的服务角色密钥"

# 运行测试
node test-storage.js
```

### 2. 检查控制台输出
成功时应该看到：
```
✅ 上传测试文件成功
✅ 获取公共URL成功
✅ 删除测试文件成功
🎉 所有存储权限测试通过！
```

### 3. 测试图片重新托管
- 在AI改写页面点击"AI配图"
- 查看控制台是否还有权限错误
- 检查图片是否能正常重新托管

## 常见问题

### Q1: 仍然出现权限错误
**A**: 检查以下几点：
- 确认运行了正确的SQL脚本
- 验证环境变量是否正确
- 检查Supabase项目状态是否正常

### Q2: 存储桶不存在
**A**: 手动创建存储桶：
```sql
SELECT storage.create_bucket(
  'images',
  'images',
  public => true,
  file_size_limit => 10485760,
  allowed_mime_types => array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

### Q3: 策略创建失败
**A**: 检查错误信息：
- 策略名称是否重复
- 语法是否正确
- 权限是否足够

## 预防措施

1. **定期检查策略**：确保存储策略配置正确
2. **监控错误日志**：及时发现权限问题
3. **测试脚本**：定期运行测试脚本验证功能
4. **备份配置**：保存正确的策略配置

## 联系支持

如果问题仍然存在：
1. 检查Supabase项目状态页面
2. 查看Supabase社区论坛
3. 联系Supabase技术支持

## 相关文件

- `db/fix-storage-policies.sql` - 修复脚本
- `test-storage.js` - 测试脚本
- `app/api/images/rehost/route.ts` - 重新托管API
- `IMAGE_REHOSTING_README.md` - 功能说明
