import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}天前`
  } else {
    return formatDate(date)
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function getPlatformIcon(platform: string): string {
  const platformIcons: Record<string, string> = {
    wechat: '💬',
    zhihu: '📚',
    baidu: '🔍',
    weibo: '📱',
    douyin: '🎵'
  }
  return platformIcons[platform] || '📄'
}

export function getPlatformName(platform: string): string {
  const platformNames: Record<string, string> = {
    wechat: '微信',
    zhihu: '知乎',
    baidu: '百度',
    weibo: '微博',
    douyin: '抖音'
  }
  return platformNames[platform] || '未知平台'
}

export function getPublishStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function getPublishStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    draft: '草稿',
    pending: '待发布',
    published: '已发布',
    failed: '发布失败'
  }
  return statusTexts[status] || '未知状态'
}

export function getRewriteStyleText(style: string): string {
  const styleTexts: Record<string, string> = {
    humorous: '幽默风格',
    formal: '正式风格',
    friendly: '亲和力强',
    professional: '专业风格',
    creative: '创意风格'
  }
  return styleTexts[style] || '未知风格'
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeHtml(html: string): string {
  // 简单的HTML清理，移除script标签和危险属性
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
} 