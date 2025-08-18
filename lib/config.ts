export const config = {
  // 数据库配置
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gongzhonghao-cms',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // AI配置
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      apiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    },
    timeout: 30000, // 30秒超时
  },

  // 采集配置
  scraping: {
    // 各平台的采集间隔（分钟）
    intervals: {
      wechat: 30,
      zhihu: 15,
      baidu: 10,
      weibo: 20,
      douyin: 25,
    },
    // 每次采集的最大数量
    maxItemsPerBatch: 100,
    // 请求超时时间
    timeout: 10000,
  },

  // 发布配置
  publish: {
    // 发布队列最大长度
    maxQueueSize: 1000,
    // 发布重试次数
    maxRetries: 3,
    // 发布间隔（秒）
    publishInterval: 5,
  },

  // 系统配置
  system: {
    // 分页默认大小
    defaultPageSize: 20,
    // 最大分页大小
    maxPageSize: 100,
    // 文件上传大小限制（MB）
    maxFileSize: 10,
    // 支持的文件类型
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },

  // 安全配置
  security: {
    // JWT密钥
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    // 密码最小长度
    minPasswordLength: 8,
    // 登录失败最大次数
    maxLoginAttempts: 5,
    // 账户锁定时间（分钟）
    lockoutDuration: 30,
  }
}

// 环境检查
export function validateConfig() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'OPENAI_API_KEY',
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.warn('警告: 以下环境变量未设置:', missingVars.join(', '))
    console.warn('某些功能可能无法正常工作')
  }

  return missingVars.length === 0
} 