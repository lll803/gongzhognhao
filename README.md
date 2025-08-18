# 公众号内容管理系统

一个现代化的公众号内容管理工具，支持内容采集、AI改写、内容管理和发布等功能。

## 功能特性

### 🚀 内容采集
- 支持微信、知乎、百度、微博、抖音等平台
- 实时采集热门榜单数据
- 智能去重和内容清洗
- 可配置的采集规则和频率

### 🤖 AI改写
- 集成多种AI模型（GPT系列等）
- 支持多种改写风格（幽默、正式、亲和力强等）
- 自定义提示词功能
- 批量改写支持

### 📝 内容管理
- 文章分类和标签管理
- 高级搜索和筛选
- 内容预览和编辑
- 版本控制和历史记录

### 📤 发布管理
- 多公众号账号管理
- 一键发布功能
- 发布状态跟踪
- 发布日志记录

### ⚙️ 系统配置
- AI接口配置管理
- 采集规则配置
- 用户权限管理
- 系统监控和日志

## 技术架构

### 前端技术栈
- **Next.js 14** - React框架，支持App Router
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Shadcn UI** - 基于Radix UI的组件库
- **React Hook Form** - 表单状态管理

### 后端技术栈
- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **MongoDB** - 文档数据库
- **Mongoose** - MongoDB对象建模工具

## 快速开始

### 环境要求
- Node.js 18.0+
- npm 或 yarn
- MongoDB 6.0+

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
gongzhonghao-cms/
├── app/                    # Next.js App Router页面
├── components/             # React组件
├── lib/                    # 工具函数和类型定义
└── package.json            # 项目配置
```

## 开发指南

- 使用TypeScript进行类型检查
- 优先使用服务器组件（RSC）
- 仅在必要时使用 `'use client'`
- 使用Suspense包装异步组件 