'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Edit, Copy, ExternalLink } from 'lucide-react'

interface ArticleItem {
  id: number
  material_id: number
  status: string
  original_content: string
  rewritten_content?: string
  rewrite_style?: string
  created_at: string
  materials?: {
    id: number
    title: string
    source_platform?: string
  }
}

export function ArticleList() {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set())

  const loadArticles = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // 获取改写任务作为文章内容
      const res = await fetch('/api/ai/rewrite')
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const json = await res.json()
      
      if (json?.success) {
        // 过滤出已完成的改写任务
        const completedArticles = json.data.filter((item: ArticleItem) => 
          item.status === 'completed' && item.rewritten_content
        )
        setArticles(completedArticles)
      } else {
        throw new Error(json?.error || '获取文章失败')
      }
    } catch (err) {
      console.error('加载文章失败:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const toggleExpanded = useCallback((articleId: number) => {
    setExpandedArticles(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(articleId)) {
        newExpanded.delete(articleId)
      } else {
        newExpanded.add(articleId)
      }
      return newExpanded
    })
  }, [])

  const isExpanded = useCallback((articleId: number) => {
    return expandedArticles.has(articleId)
  }, [expandedArticles])

  const copyToClipboard = useCallback(async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // 可以添加toast提示
      console.log(`${type}已复制到剪贴板`)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }, [])

  const formatTime = useCallback((timeString: string) => {
    try {
      const date = new Date(timeString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return '刚刚'
      if (diffMins < 60) return `${diffMins}分钟前`
      if (diffHours < 24) return `${diffHours}小时前`
      return `${diffDays}天前`
    } catch {
      return '未知时间'
    }
  }, [])

  const getRewriteStyleLabel = useCallback((style?: string) => {
    const styleMap: Record<string, string> = {
      'professional': '专业正式',
      'friendly': '友好亲切',
      'humorous': '幽默风趣',
      'formal': '正式庄重',
      'creative': '创意新颖'
    }
    return styleMap[style || ''] || style || '未知风格'
  }, [])

  // 提取标题和内容的辅助函数
  const extractTitle = useCallback((content: string) => {
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.includes('标题:') || line.includes('Title:')) {
        return line.replace(/^.*?[标题Title]:\s*/, '').trim()
      }
    }
    return lines[0]?.trim() || '无标题'
  }, [])

  const extractContent = useCallback((content: string) => {
    const lines = content.split('\n')
    const contentLines: string[] = []
    let inContent = false
    
    for (const line of lines) {
      if (line.includes('正文内容:') || line.includes('Body:') || line.includes('内容:')) {
        inContent = true
        continue
      }
      if (inContent && line.trim()) {
        contentLines.push(line.trim())
      }
    }
    
    if (contentLines.length === 0) {
      const titleIndex = lines.findIndex(line => 
        line.includes('标题:') || line.includes('Title:')
      )
      if (titleIndex >= 0) {
        return lines.slice(titleIndex + 1).join('\n').trim()
      }
      return content.trim()
    }
    
    return contentLines.join('\n')
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">文章列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">文章列表</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">加载失败: {error}</div>
            <Button onClick={loadArticles} variant="outline">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">文章列表</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground">暂无文章</div>
            <div className="text-sm text-muted-foreground mt-2">
              从素材库发布文章后，将在这里显示
            </div>
            <Button 
              onClick={loadArticles} 
              variant="outline" 
              className="mt-4"
            >
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">文章列表</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {articles.map(article => (
          <div key={article.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">文章 #{article.id}</span>
                <Badge variant="outline" className="text-xs">
                  {getRewriteStyleLabel(article.rewrite_style)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTime(article.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(article.id)}
                  className="h-8 px-2"
                >
                  {isExpanded(article.id) ? '收起' : '展开'}
                </Button>
              </div>
            </div>
            
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted-foreground">素材ID:</span>
                <span className="font-medium">{article.material_id}</span>
                {article.materials?.title && (
                  <span className="text-muted-foreground">
                    ({article.materials.title})
                  </span>
                )}
              </div>
              
              {article.rewritten_content && (
                <div className="space-y-3">
                  {/* 改写后标题 */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">改写后标题:</div>
                    <div className="text-sm font-medium">
                      {extractTitle(article.rewritten_content)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(extractTitle(article.rewritten_content), '标题')}
                      className="mt-2 h-6 px-2 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      复制标题
                    </Button>
                  </div>
                  
                  {/* 改写后内容 */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">改写后内容:</div>
                    <div className={`text-sm ${isExpanded(article.id) ? '' : 'line-clamp-3'}`}>
                      {extractContent(article.rewritten_content)}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(extractContent(article.rewritten_content), '内容')}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        复制内容
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(article.rewritten_content, '完整内容')}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        复制完整内容
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
