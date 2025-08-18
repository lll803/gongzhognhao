import { z } from 'zod'

// 文章验证模式
export const articleSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(200, '标题长度不能超过200个字符'),
  content: z.string()
    .min(10, '内容不能少于10个字符'),
  summary: z.string()
    .max(500, '摘要长度不能超过500个字符')
    .optional(),
  sourceUrl: z.string()
    .url('请输入有效的URL'),
  sourcePlatform: z.enum(['wechat', 'zhihu', 'baidu', 'weibo', 'douyin']),
  tags: z.array(z.string())
    .max(10, '标签数量不能超过10个')
    .optional(),
  category: z.string()
    .min(1, '分类不能为空'),
  aiRewriteStyle: z.enum(['humorous', 'formal', 'friendly', 'professional', 'creative'])
    .optional(),
  aiRewritePrompt: z.string()
    .max(200, '提示词长度不能超过200个字符')
    .optional()
})

// 热榜项目验证模式
export const hotItemSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(200, '标题长度不能超过200个字符'),
  description: z.string()
    .max(500, '描述长度不能超过500个字符')
    .optional(),
  url: z.string()
    .url('请输入有效的URL'),
  platform: z.enum(['wechat', 'zhihu', 'baidu', 'weibo', 'douyin']),
  rank: z.number()
    .int('排名必须是整数')
    .min(1, '排名必须大于0'),
  hotValue: z.number()
    .min(0, '热度值不能为负数'),
  category: z.string()
    .optional()
})

// 公众号账号验证模式
export const wechatAccountSchema = z.object({
  name: z.string()
    .min(1, '账号名称不能为空')
    .max(100, '账号名称长度不能超过100个字符'),
  accountId: z.string()
    .min(1, '公众号ID不能为空'),
  apiKey: z.string()
    .min(1, 'API密钥不能为空'),
  isActive: z.boolean()
    .optional()
})

// AI配置验证模式
export const aiConfigSchema = z.object({
  provider: z.string()
    .min(1, '提供商不能为空'),
  apiKey: z.string()
    .min(1, 'API密钥不能为空'),
  model: z.string()
    .min(1, '模型名称不能为空'),
  maxTokens: z.number()
    .int('最大令牌数必须是整数')
    .min(100, '最大令牌数不能少于100')
    .max(8000, '最大令牌数不能超过8000'),
  temperature: z.number()
    .min(0, '温度值不能为负数')
    .max(2, '温度值不能超过2'),
  isEnabled: z.boolean()
    .optional()
})

// 采集配置验证模式
export const scrapingConfigSchema = z.object({
  platform: z.enum(['wechat', 'zhihu', 'baidu', 'weibo', 'douyin']),
  apiKey: z.string()
    .optional(),
  apiSecret: z.string()
    .optional(),
  isEnabled: z.boolean(),
  updateInterval: z.number()
    .int('更新间隔必须是整数')
    .min(1, '更新间隔不能少于1分钟')
    .max(1440, '更新间隔不能超过24小时')
})

// 发布请求验证模式
export const publishRequestSchema = z.object({
  articleId: z.string()
    .min(1, '文章ID不能为空'),
  accountId: z.string()
    .min(1, '账号ID不能为空'),
  scheduledTime: z.string()
    .datetime('请输入有效的日期时间')
    .optional()
})

// 通用验证函数
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      throw new Error(`数据验证失败: ${JSON.stringify(errors)}`)
    }
    throw error
  }
}

// 部分验证函数（允许部分字段）
export function validatePartialData<T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> {
  try {
    return schema.partial().parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      throw new Error(`数据验证失败: ${JSON.stringify(errors)}`)
    }
    throw error
  }
}

// 导出所有验证模式
export const schemas = {
  article: articleSchema,
  hotItem: hotItemSchema,
  wechatAccount: wechatAccountSchema,
  aiConfig: aiConfigSchema,
  scrapingConfig: scrapingConfigSchema,
  publishRequest: publishRequestSchema
} 