'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Material, MaterialStatus, AIRewriteStatus, RewriteStyle } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

interface MaterialWithRewrite extends Material {
  aiRewriteTask?: {
    id: number
    status: AIRewriteStatus
    rewriteStyle: RewriteStyle
    rewrittenContent?: string
    errorMessage?: string
    createdAt: Date
    completedAt?: Date
  }
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialWithRewrite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { push: pushToast } = useToast()

  // 加载素材列表
  async function loadMaterials() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        ...(categoryFilter && { category: categoryFilter }),
        ...(search && { search }),
      })

      const response = await fetch(`/api/materials?${params}`)
      const result = await response.json()

      if (result.success) {
        // 修复日期字段
        const materialsWithFixedDates = result.data.materials.map((material: any) => ({
          ...material,
          createdAt: material.created_at ? new Date(material.created_at) : new Date(),
          updatedAt: material.updated_at ? new Date(material.updated_at) : new Date(),
        }))
        
        setMaterials(materialsWithFixedDates)
        setTotalPages(result.data.pagination.totalPages)
      } else {
        pushToast({
          type: 'error',
          title: '加载失败',
          description: result.error || '未知错误',
        })
      }
    } catch (error) {
      console.error('加载素材失败:', error)
      pushToast({
        type: 'error',
        title: '加载失败',
        description: '网络错误，请重试',
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载AI改写任务状态
  async function loadRewriteTasks() {
    try {
      const materialIds = materials.map(m => m.id)
      if (materialIds.length === 0) return

      const response = await fetch(`/api/ai/rewrite?${materialIds.map(id => `materialId=${id}`).join('&')}`)
      const result = await response.json()

      if (result.success) {
        const taskMap = new Map(result.data.map((task: any) => [task.material_id, {
          id: task.id,
          materialId: task.material_id,
          status: task.status as AIRewriteStatus,
          originalContent: task.original_content,
          rewrittenContent: task.rewritten_content,
          rewriteStyle: task.rewrite_style as RewriteStyle,
          rewritePrompt: task.rewrite_prompt,
          errorMessage: task.error_message,
          processingStartedAt: task.processing_started_at ? new Date(task.processing_started_at) : undefined,
          completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
        }]))
        setMaterials(prev => prev.map(material => ({
          ...material,
          aiRewriteTask: taskMap.get(material.id),
        })))
      }
    } catch (error) {
      console.error('加载改写任务失败:', error)
    }
  }

  // 手动触发AI改写
  async function triggerRewrite(materialId: number, style: RewriteStyle = RewriteStyle.PROFESSIONAL) {
    try {
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId,
          rewriteStyle: style,
        }),
      })

      const result = await response.json()

      if (result.success) {
        pushToast({
          type: 'success',
          title: 'AI改写已启动',
          description: '正在处理中，请稍后查看结果',
        })
        
        // 重新加载改写任务状态
        setTimeout(loadRewriteTasks, 1000)
      } else {
        pushToast({
          type: 'error',
          title: '启动失败',
          description: result.error || '未知错误',
        })
      }
    } catch (error) {
      console.error('启动AI改写失败:', error)
      pushToast({
        type: 'error',
        title: '启动失败',
        description: '网络错误，请重试',
      })
    }
  }

  // 获取状态徽章
  function getStatusBadge(status: MaterialStatus) {
    switch (status) {
      case MaterialStatus.ACTIVE:
        return <Badge variant="default" className="bg-green-100 text-green-800">活跃</Badge>
      case MaterialStatus.ARCHIVED:
        return <Badge variant="secondary">已归档</Badge>
      case MaterialStatus.DELETED:
        return <Badge variant="destructive">已删除</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  // 获取改写状态徽章
  function getRewriteStatusBadge(task?: MaterialWithRewrite['aiRewriteTask']) {
    if (!task) {
      return <Badge variant="outline">未开始</Badge>
    }

    switch (task.status) {
      case 'pending':
        return <Badge variant="secondary">等待中</Badge>
      case 'processing':
        return <Badge variant="default">处理中</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">已完成</Badge>
      case 'failed':
        return <Badge variant="destructive" title={task.errorMessage}>失败</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  // 获取改写风格标签
  function getRewriteStyleLabel(style: RewriteStyle) {
    const styleLabels: Record<RewriteStyle, string> = {
      [RewriteStyle.PROFESSIONAL]: '专业正式',
      [RewriteStyle.FRIENDLY]: '友好亲切',
      [RewriteStyle.HUMOROUS]: '幽默风趣',
      [RewriteStyle.FORMAL]: '正式庄重',
      [RewriteStyle.CREATIVE]: '创意新颖',
    }
    return styleLabels[style] || style
  }

  useEffect(() => {
    loadMaterials()
  }, [page, statusFilter, categoryFilter, search])

  useEffect(() => {
    if (materials.length > 0) {
      loadRewriteTasks()
    }
  }, [materials])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">素材库</h1>
          <p className="text-muted-foreground mt-2">
            管理从热榜收集的素材内容和AI改写结果
          </p>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索标题或描述..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              className="w-32"
              value={statusFilter as any}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">全部状态</option>
              <option value={MaterialStatus.ACTIVE}>活跃</option>
              <option value={MaterialStatus.ARCHIVED}>已归档</option>
              <option value={MaterialStatus.DELETED}>已删除</option>
            </Select>
            <Select
              className="w-32"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">全部分类</option>
              <option value="hot-trending">热榜趋势</option>
              <option value="wechat">微信文章</option>
              <option value="other">其他</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 素材列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                {search || statusFilter !== 'all' || categoryFilter ? '没有找到匹配的素材' : '暂无素材'}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                去热榜页面添加一些素材吧
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* 左侧：素材信息 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold line-clamp-2">{material.title}</h3>
                          {material.description && (
                            <p className="text-muted-foreground mt-2 line-clamp-3">{material.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {getStatusBadge(material.status)}
                          {getRewriteStatusBadge(material.aiRewriteTask)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>来源: {material.sourcePlatform}</span>
                        {material.sourceRank && <span>排名: {material.sourceRank}</span>}
                        {material.sourceHotValue && <span>热度: {material.sourceHotValue.toLocaleString()}</span>}
                        <span>添加时间: {formatRelativeTime(material.createdAt)}</span>
                      </div>

                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {material.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <a
                          href={material.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          查看原文
                        </a>
                      </div>
                    </div>

                    {/* 右侧：AI改写状态和操作 */}
                    <div className="flex-shrink-0 space-y-3 min-w-48">
                      {material.aiRewriteTask ? (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">改写风格: </span>
                            <span>{getRewriteStyleLabel(material.aiRewriteTask.rewriteStyle)}</span>
                          </div>
                          {material.aiRewriteTask.status === 'completed' && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">完成时间: </span>
                              <span>{formatRelativeTime(material.aiRewriteTask.completedAt!)}</span>
                            </div>
                          )}
                          {material.aiRewriteTask.status === 'failed' && (
                            <div className="text-sm text-red-600">
                              错误: {material.aiRewriteTask.errorMessage}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">未开始AI改写</div>
                      )}

                      <div className="space-y-2">
                        {!material.aiRewriteTask || 
                         material.aiRewriteTask.status === 'failed' ? (
                          <Button
                            size="sm"
                            onClick={() => triggerRewrite(material.id)}
                            className="w-full"
                          >
                            开始AI改写
                          </Button>
                        ) : material.aiRewriteTask.status === 'completed' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerRewrite(material.id)}
                            className="w-full"
                          >
                            重新改写
                          </Button>
                        ) : null}

                        {material.aiRewriteTask?.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              window.open(`/materials/${material.id}/rewrite`, '_blank')
                            }}
                          >
                            查看改写结果
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} 页，共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
