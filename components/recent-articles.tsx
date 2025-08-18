'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPlatformIcon, getPlatformName, formatRelativeTime, truncateText } from '@/lib/utils'
import { Article, Platform, PublishStatus, RewriteStyle } from '@/lib/types'

// 模拟数据
const recentArticles: Article[] = [
  {
    id: '1',
    title: '人工智能在医疗领域的应用前景',
    content: '随着技术的不断发展，AI在医疗领域的应用越来越广泛...',
    summary: '探讨AI技术在医疗诊断、药物研发等方面的最新进展',
    sourceUrl: 'https://example.com/article1',
    sourcePlatform: Platform.ZHIHU,
    tags: ['AI', '医疗', '科技'],
    category: '科技',
    publishStatus: PublishStatus.PUBLISHED,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    publishedAt: new Date('2024-01-15T11:00:00Z'),
    aiRewrittenContent: 'AI改写后的内容...',
    aiRewriteStyle: RewriteStyle.PROFESSIONAL
  },
  {
    id: '2',
    title: '2024年最值得关注的创业趋势',
    content: '在新的一年里，创业环境发生了巨大变化...',
    summary: '分析当前创业市场的新机遇和挑战',
    sourceUrl: 'https://example.com/article2',
    sourcePlatform: Platform.WECHAT,
    tags: ['创业', '趋势', '商业'],
    category: '商业',
    publishStatus: PublishStatus.PENDING,
    createdAt: new Date('2024-01-15T09:15:00Z'),
    updatedAt: new Date('2024-01-15T09:15:00Z'),
    aiRewrittenContent: 'AI改写后的内容...',
    aiRewriteStyle: RewriteStyle.FRIENDLY
  },
  {
    id: '3',
    title: '如何提高工作效率的10个实用技巧',
    content: '工作效率是职场成功的关键因素...',
    summary: '分享提升工作效率的实用方法和工具',
    sourceUrl: 'https://example.com/article3',
    sourcePlatform: Platform.BAIDU,
    tags: ['效率', '职场', '技巧'],
    category: '职场',
    publishStatus: PublishStatus.DRAFT,
    createdAt: new Date('2024-01-15T08:45:00Z'),
    updatedAt: new Date('2024-01-15T08:45:00Z'),
    aiRewrittenContent: 'AI改写后的内容...',
    aiRewriteStyle: RewriteStyle.PROFESSIONAL
  }
]

export function RecentArticles() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>最近文章</CardTitle>
        <Button variant="accent" size="sm">
          查看全部
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentArticles.map((article) => (
          <div key={article.id} className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-accent/5 transition-colors">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm">
                {getPlatformIcon(article.sourcePlatform)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {truncateText(article.title, 50)}
                </h4>
                <Badge variant={article.publishStatus === PublishStatus.PUBLISHED ? 'default' : 'secondary'}>
                  {article.publishStatus === PublishStatus.PUBLISHED ? '已发布' : 
                   article.publishStatus === PublishStatus.PENDING ? '待发布' : '草稿'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {truncateText(article.summary || '', 80)}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{getPlatformName(article.sourcePlatform)}</span>
                <span>{formatRelativeTime(article.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 