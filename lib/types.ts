// 文章相关类型
export interface Article {
  id: string
  title: string
  content: string
  summary?: string
  sourceUrl: string
  sourcePlatform: Platform
  tags: string[]
  category: string
  publishStatus: PublishStatus
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  aiRewrittenContent?: string
  aiRewriteStyle?: RewriteStyle
  aiRewritePrompt?: string
}

// 平台枚举
export enum Platform {
  WECHAT = 'wechat',
  ZHIHU = 'zhihu',
  BAIDU = 'baidu',
  WEIBO = 'weibo',
  DOUYIN = 'douyin'
}

// 发布状态枚举
export enum PublishStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

// AI改写风格枚举
export enum RewriteStyle {
  HUMOROUS = 'humorous',
  FORMAL = 'formal',
  FRIENDLY = 'friendly',
  PROFESSIONAL = 'professional',
  CREATIVE = 'creative'
}

// 公众号账号类型
export interface WechatAccount {
  id: string
  name: string
  accountId: string
  apiKey: string
  isActive: boolean
  createdAt: Date
  lastLoginAt?: Date
}

// 采集配置类型
export interface ScrapingConfig {
  id: string
  platform: Platform
  apiKey?: string
  apiSecret?: string
  isEnabled: boolean
  updateInterval: number // 分钟
  lastUpdateAt?: Date
}

// AI配置类型
export interface AIConfig {
  id: string
  provider: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  isEnabled: boolean
}

// 发布日志类型
export interface PublishLog {
  id: string
  articleId: string
  accountId: string
  status: PublishStatus
  message?: string
  publishedAt?: Date
  createdAt: Date
}

// 标签类型
export interface Tag {
  id: string
  name: string
  color: string
  articleCount: number
}

// 分类类型
export interface Category {
  id: string
  name: string
  description?: string
  articleCount: number
  parentId?: string
}

// 热榜数据类型
export interface HotItem {
  id: string
  title: string
  description?: string
  url: string
  platform: Platform
  rank: number
  hotValue: number
  category?: string
  createdAt: Date
}

// 用户类型
export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: Date
  lastLoginAt?: Date
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页类型
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
} 