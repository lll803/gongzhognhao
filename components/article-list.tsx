'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Edit, Copy, ExternalLink, Trash2, CheckSquare, Square } from 'lucide-react'

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
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [illustratedMdByMaterial, setIllustratedMdByMaterial] = useState<Record<number, string>>({})

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

  // 如果带 materialId 查询参数，则高亮并自动展开对应文章
  useEffect(() => {
    const url = new URL(window.location.href)
    const mid = Number(url.searchParams.get('materialId'))
    if (!mid || !Array.isArray(articles) || articles.length === 0) return
    const target = articles.find(a => a.material_id === mid)
    if (target) {
      setExpandedArticles(new Set([target.id]))
    }
  }, [articles])

  // 当展开文章时，从 materials 读取带图Markdown
  useEffect(() => {
    const controller = new AbortController()
    const toLoad = articles.filter(a => expandedArticles.has(a.id) && !illustratedMdByMaterial[a.material_id])
    async function run() {
      for (const a of toLoad) {
        try {
          const res = await fetch(`/api/materials?materialId=${a.material_id}`, { signal: controller.signal })
          if (!res.ok) continue
          const json = await res.json()
          const mat = json?.data?.materials?.[0]
          const md = mat?.extra_data?.illustrate?.contentWithImages
          if (typeof md === 'string' && md.length > 0) {
            setIllustratedMdByMaterial(prev => ({ ...prev, [a.material_id]: md }))
          }
        } catch {}
      }
    }
    run()
    return () => controller.abort()
  }, [expandedArticles, articles])

  // 选择/取消选择文章
  const toggleArticleSelection = useCallback((articleId: number) => {
    setSelectedArticles(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(articleId)) {
        newSelected.delete(articleId)
      } else {
        newSelected.add(articleId)
      }
      return newSelected
    })
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(articles.map(article => article.id)))
    }
  }, [articles, selectedArticles.size])

  // 删除单篇文章
  const deleteArticle = useCallback(async (articleId: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    try {
      setIsDeleting(true)
      // 实际删除后端任务与结果
      const res = await fetch(`/api/ai/rewrite/${articleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      
      // 从列表中移除
      setArticles(prev => prev.filter(article => article.id !== articleId))
      setSelectedArticles(prev => {
        const newSelected = new Set(prev)
        newSelected.delete(articleId)
        return newSelected
      })
      
      alert('文章删除成功！')
    } catch (error) {
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // 批量删除文章
  const deleteSelectedArticles = useCallback(async () => {
    if (selectedArticles.size === 0) {
      alert('请先选择要删除的文章')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedArticles.size} 篇文章吗？此操作不可恢复。`)) {
      return
    }

    try {
      setIsDeleting(true)
      // 逐个删除后端任务
      const ids = Array.from(selectedArticles)
      for (const id of ids) {
        try { await fetch(`/api/ai/rewrite/${id}`, { method: 'DELETE' }) } catch {}
      }
      
      // 从列表中移除
      setArticles(prev => prev.filter(article => !selectedArticles.has(article.id)))
      setSelectedArticles(new Set())
      
      alert(`成功删除 ${selectedArticles.size} 篇文章！`)
    } catch (error) {
      alert('批量删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }, [selectedArticles])

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
      'professional': '专业',
      'casual': '轻松',
      'creative': '创意',
      'academic': '学术',
      'marketing': '营销',
      'storytelling': '故事化'
    }
    return styleMap[style || ''] || style || '默认'
  }, [])

  const extractTitle = useCallback((content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    return lines[0] || '无标题'
  }, [])

  const extractContent = useCallback((content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    return lines.slice(1).join('\n') || '无内容'
  }, [])

  // 清理内容，去掉标签
  const cleanContent = useCallback((content: string) => {
    if (!content) return ''
    
    // 去掉常见的标签前缀
    return content
      .replace(/^标题:\s*/gm, '')           // 去掉"标题:"
      .replace(/^Title:\s*/gm, '')          // 去掉"Title:"
      .replace(/^正文内容:\s*/gm, '')       // 去掉"正文内容:"
      .replace(/^Body:\s*/gm, '')           // 去掉"Body:"
      .replace(/^内容:\s*/gm, '')           // 去掉"内容:"
      .replace(/^Content:\s*/gm, '')        // 去掉"Content:"
      .trim()                               // 去掉首尾空白
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="mb-4">{error}</p>
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
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">暂无文章内容</p>
            <Button onClick={loadArticles} variant="outline">
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 批量操作栏 */}
      {selectedArticles.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">
                  已选择 {selectedArticles.size} 篇文章
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedArticles(new Set())}
                  className="text-blue-600 hover:text-blue-800"
                >
                  取消选择
                </Button>
              </div>
              <Button
                onClick={deleteSelectedArticles}
                disabled={isDeleting}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? '删除中...' : `删除选中 (${selectedArticles.size})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 文章列表 */}
      {articles.map((article) => {
        const md = illustratedMdByMaterial[article.material_id]
        return (
          <Card key={article.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* 选择复选框 */}
                  <div className="pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleArticleSelection(article.id)}
                      className="p-1 h-auto"
                    >
                      {selectedArticles.has(article.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg truncate">
                        {extractTitle(article.rewritten_content || '')}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {getRewriteStyleLabel(article.rewrite_style)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>ID: {article.id}</span>
                      <span>素材ID: {article.material_id}</span>
                      <span>{formatTime(article.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(article.id)}
                  >
                    {isExpanded(article.id) ? '收起' : '展开'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(extractTitle(article.rewritten_content || ''), '标题')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteArticle(article.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {isExpanded(article.id) && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">改写后的内容</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="whitespace-pre-wrap text-sm">
                        {cleanContent(article.rewritten_content || '')}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(article.rewritten_content || '', '内容')}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        复制内容
                      </Button>
                      {md && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(md, '配图Markdown')}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          复制配图Markdown
                        </Button>
                      )}
                    </div>
                  </div>
                  {md && (
                    <div className="border rounded-md">
                      <div className="flex items-center justify-between p-2">
                        <span className="text-sm text-muted-foreground">配图后的Markdown</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(md, '配图Markdown')}>复制</Button>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-b-md">
                        <pre className="whitespace-pre-wrap text-sm">{md}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
      
      {/* 全选操作 */}
      {articles.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-sm"
            >
              {selectedArticles.size === articles.length ? (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  取消全选
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  全选 ({articles.length})
                </>
              )}
            </Button>
            {selectedArticles.size > 0 && (
              <span className="text-sm text-muted-foreground">
                已选择 {selectedArticles.size} / {articles.length} 篇
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
