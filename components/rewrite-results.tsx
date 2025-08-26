'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TaskItem {
  id: number
  material_id: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  rewritten_content?: string
  created_at: string
  materials?: {
    id: number
    title: string
    source_url?: string
    source_platform?: string
  }
}

const statusConfig = {
  pending: { label: '等待中', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  failed: { label: '失败', color: 'bg-red-100 text-red-800' },
}

export function RewriteResults() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())

  // 使用useCallback优化load函数，避免无限循环
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/ai/rewrite', { signal })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const json = await res.json()
      
      if (json?.success) {
        setTasks(json.data || [])
      } else {
        throw new Error(json?.error || '获取改写任务失败')
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('加载改写任务失败:', err)
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    
    // 初始加载
    load(controller.signal)
    
    // 设置定时刷新，但间隔更长一些
    const timer = setInterval(() => {
      load(controller.signal)
    }, 10000) // 改为10秒刷新一次，减少频繁更新
    
    return () => { 
      controller.abort()
      clearInterval(timer)
    }
  }, [load]) // 只依赖load函数

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

  const getStatusBadge = useCallback((status: TaskItem['status']) => {
    const config = statusConfig[status]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }, [])

  const toggleExpanded = useCallback((taskId: number) => {
    setExpandedTasks(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId)
      } else {
        newExpanded.add(taskId)
      }
      return newExpanded
    })
  }, [])

  const isExpanded = useCallback((taskId: number) => {
    return expandedTasks.has(taskId)
  }, [expandedTasks])

  // 如果正在加载且没有任务，显示骨架屏
  if (isLoading && tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">改写任务</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">改写任务</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-red-600 p-4 text-center">
            <p>加载失败: {error}</p>
            <Button 
              onClick={() => load()} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">改写任务</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">任务 #{task.id}</span>
                {getStatusBadge(task.status)}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(task.created_at)}
              </span>
            </div>
            
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted-foreground">素材ID:</span>
                <span className="font-medium">{task.material_id}</span>
                {task.materials?.title && (
                  <span className="text-muted-foreground">
                    ({task.materials.title})
                  </span>
                )}
              </div>
              
              {task.rewritten_content && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground">改写结果:</div>
                  
                  {/* 标题部分 */}
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">标题:</div>
                    <div className="text-sm font-medium">
                      {extractTitle(task.rewritten_content)}
                    </div>
                  </div>
                  
                  {/* 正文部分 */}
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">正文内容:</div>
                    <div className={`text-sm ${isExpanded(task.id) ? '' : 'line-clamp-3'}`}>
                      {extractContent(task.rewritten_content)}
                    </div>
                    
                    {/* 展开/收起按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(task.id)}
                      className="mt-2 h-6 px-2 text-xs"
                    >
                      {isExpanded(task.id) ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          收起
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          展开
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground py-8 text-center">
            <p>暂无改写任务</p>
            <p className="text-xs mt-1">在左侧启动AI改写后，任务将显示在这里</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 提取标题的辅助函数
function extractTitle(content: string): string {
  const lines = content.split('\n')
  for (const line of lines) {
    if (line.includes('标题:') || line.includes('Title:')) {
      return line.replace(/^.*?[标题Title]:\s*/, '').trim()
    }
  }
  // 如果没有找到标题标记，返回第一行
  return lines[0]?.trim() || '无标题'
}

// 提取正文内容的辅助函数
function extractContent(content: string): string {
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
  
  // 如果没有找到内容标记，返回除标题外的所有内容
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
}


