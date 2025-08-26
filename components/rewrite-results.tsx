'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronUp, Trash2, CheckSquare, Square, Image as ImageIcon, Copy } from 'lucide-react'

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
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [illustratingTaskId, setIllustratingTaskId] = useState<number | null>(null)
  const [illustratedMarkdownByTask, setIllustratedMarkdownByTask] = useState<Record<number, string>>({})

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

  // 从 localStorage 恢复已生成的配图Markdown，避免切换页面后丢失
  useEffect(() => {
    try {
      const saved = localStorage.getItem('illustratedMarkdownByTask')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setIllustratedMarkdownByTask(parsed)
        }
      }
    } catch {}
  }, [])

  // 将配图Markdown持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('illustratedMarkdownByTask', JSON.stringify(illustratedMarkdownByTask))
    } catch {}
  }, [illustratedMarkdownByTask])

  // 当展开某个任务时，从 DB 拉取 materials.extra_data.illustrate.contentWithImages 作为持久化来源
  useEffect(() => {
    const controller = new AbortController()
    const loadForExpanded = async () => {
      const needLoad = tasks.filter(t => expandedTasks.has(t.id) && !illustratedMarkdownByTask[t.id])
      for (const t of needLoad) {
        try {
          const res = await fetch(`/api/materials?materialId=${t.material_id}`, { signal: controller.signal })
          if (!res.ok) continue
          const json = await res.json()
          const mat = json?.data?.materials?.[0]
          const md = mat?.extra_data?.illustrate?.contentWithImages
          if (typeof md === 'string' && md.length > 0) {
            setIllustratedMarkdownByTask(prev => ({ ...prev, [t.id]: md }))
          }
        } catch {}
      }
    }
    loadForExpanded()
    return () => controller.abort()
  }, [expandedTasks, tasks])

  // 选择/取消选择任务
  const toggleTaskSelection = useCallback((taskId: number) => {
    setSelectedTasks(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId)
      } else {
        newSelected.add(taskId)
      }
      return newSelected
    })
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)))
    }
  }, [tasks, selectedTasks.size])

  // 删除单个任务
  const deleteTask = useCallback(async (taskId: number) => {
    if (!confirm('确定要删除这个改写任务吗？此操作不可恢复。')) {
      return
    }

    try {
      setIsDeleting(true)
      const res = await fetch(`/api/ai/rewrite/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      
      // 从列表中移除
      setTasks(prev => prev.filter(task => task.id !== taskId))
      setSelectedTasks(prev => {
        const newSelected = new Set(prev)
        newSelected.delete(taskId)
        return newSelected
      })
      
      alert('任务删除成功！')
    } catch (error) {
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // 批量删除任务
  const deleteSelectedTasks = useCallback(async () => {
    if (selectedTasks.size === 0) {
      alert('请先选择要删除的任务')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedTasks.size} 个改写任务吗？此操作不可恢复。`)) {
      return
    }

    try {
      setIsDeleting(true)
      const ids = Array.from(selectedTasks)
      for (const id of ids) {
        try { await fetch(`/api/ai/rewrite/${id}`, { method: 'DELETE' }) } catch {}
      }
      
      // 从列表中移除
      setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)))
      setSelectedTasks(new Set())
      
      alert(`成功删除 ${selectedTasks.size} 个任务！`)
    } catch (error) {
      alert('批量删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }, [selectedTasks])

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
            <Button onClick={() => load()} variant="outline">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">暂无改写任务</p>
            <Button onClick={() => load()} variant="outline">
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
      {selectedTasks.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-700">
                  已选择 {selectedTasks.size} 个任务
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTasks(new Set())}
                  className="text-blue-600 hover:text-blue-800"
                >
                  取消选择
                </Button>
              </div>
              <Button
                onClick={deleteSelectedTasks}
                disabled={isDeleting}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? '删除中...' : `删除选中 (${selectedTasks.size})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 任务列表 */}
      {tasks.map((task) => (
        <Card key={task.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {/* 选择复选框 */}
                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskSelection(task.id)}
                    className="p-1 h-auto"
                  >
                    {selectedTasks.has(task.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {task.materials?.title || `任务 #${task.id}`}
                      </h3>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>ID: {task.id}</span>
                    <span>素材ID: {task.material_id}</span>
                    <span>{formatTime(task.created_at)}</span>
                    {task.materials?.source_platform && (
                      <span>来源: {task.materials.source_platform}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(task.id)}
                >
                  {isExpanded(task.id) ? '收起' : '展开'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {isExpanded(task.id) && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                {task.rewritten_content && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">改写后的内容</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="whitespace-pre-wrap text-sm">
                        {cleanContent(task.rewritten_content)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={illustratingTaskId === task.id}
                        onClick={async () => {
                          try {
                            setIllustratingTaskId(task.id)
                            const res = await fetch('/api/ai/illustrate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ materialId: task.material_id }),
                            })
                            const json = await res.json()
                            if (json?.success) {
                              setIllustratedMarkdownByTask(prev => ({ ...prev, [task.id]: json.data.contentWithImages }))
                            } else {
                              alert(json?.error || 'AI配图失败')
                            }
                          } catch (e) {
                            alert('AI配图失败')
                          } finally {
                            setIllustratingTaskId(null)
                          }
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-1" />
                        {illustratingTaskId === task.id ? '配图中...' : 'AI配图'}
                      </Button>
                      {illustratedMarkdownByTask[task.id] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await navigator.clipboard.writeText(illustratedMarkdownByTask[task.id])
                            alert('已复制带图Markdown')
                          }}
                        >
                          <Copy className="w-4 h-4 mr-1" />复制配图Markdown
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {task.materials?.source_url && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">原始链接</h4>
                    <a 
                      href={task.materials.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm break-all"
                    >
                      {task.materials.source_url}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
      
      {/* 全选操作 */}
      {tasks.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-sm"
            >
              {selectedTasks.size === tasks.length ? (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  取消全选
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  全选 ({tasks.length})
                </>
              )}
            </Button>
            {selectedTasks.size > 0 && (
              <span className="text-sm text-muted-foreground">
                已选择 {selectedTasks.size} / {tasks.length} 个
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


