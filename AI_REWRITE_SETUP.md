# AI改写功能配置指南

## 问题描述

如果AI改写页面显示空白或无法正常工作，通常是由于环境变量配置缺失导致的。

## 解决方案

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件（注意：此文件不会被提交到Git）：

```bash
# Supabase 配置（必需）
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI 配置（必需）
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# 或者使用 OpenRouter API（替代方案）
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-3.5-turbo
OPENROUTER_MAX_TOKENS=2000
OPENROUTER_TEMPERATURE=0.7

# JWT 配置
JWT_SECRET=your_jwt_secret_key
```

### 2. 获取配置值

#### Supabase 配置
1. 访问 [Supabase](https://supabase.com) 并创建项目
2. 在项目设置中找到 `Project URL` 和 `service_role` 密钥
3. 复制到 `.env.local` 文件

#### OpenAI 配置
1. 访问 [OpenAI](https://platform.openai.com) 并创建API密钥
2. 复制API密钥到 `.env.local` 文件

#### OpenRouter 配置（替代方案）
1. 访问 [OpenRouter](https://openrouter.ai) 并创建API密钥
2. 复制API密钥到 `.env.local` 文件

### 3. 重启开发服务器

配置完成后，重启开发服务器：

```bash
npm run dev
```

### 4. 验证配置

访问AI改写页面，页面顶部的"系统状态"组件会显示各项配置的状态：
- 🟢 正常：配置正确
- 🔴 异常：配置有问题

## 常见问题

### Q: 页面显示"系统配置异常"
A: 检查环境变量是否正确设置，特别是 Supabase 和 OpenAI 的配置

### Q: 素材列表加载失败
A: 检查 Supabase 配置和数据库连接

### Q: AI改写启动失败
A: 检查 OpenAI 或 OpenRouter 配置

### Q: 环境变量文件在哪里？
A: 在项目根目录创建 `.env.local` 文件，参考 `env.example` 文件

## 数据库表结构

确保数据库中有以下表：

```sql
-- 素材表
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_platform TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI改写任务表
CREATE TABLE ai_rewrite_tasks (
  id SERIAL PRIMARY KEY,
  material_id INTEGER REFERENCES materials(id),
  status TEXT DEFAULT 'pending',
  original_content TEXT,
  rewritten_content TEXT,
  rewrite_style TEXT,
  rewrite_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 改写结果表
CREATE TABLE rewrite_results (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES ai_rewrite_tasks(id),
  material_id INTEGER REFERENCES materials(id),
  original_title TEXT,
  rewritten_title TEXT,
  original_description TEXT,
  rewritten_description TEXT,
  original_content TEXT,
  rewritten_content TEXT,
  rewrite_style TEXT,
  word_count INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 功能说明

AI改写功能包括：

1. **素材选择**：从左侧选择要改写的素材
2. **改写设置**：选择改写风格和自定义提示词
3. **任务管理**：查看改写任务的状态和结果
4. **实时更新**：自动刷新任务状态

## 支持的联系方式

如果仍有问题，请检查：
1. 浏览器控制台的错误信息
2. 网络请求的状态
3. 环境变量是否正确设置
