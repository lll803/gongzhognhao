'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Material, RewriteStyle, AIRewriteStatus } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, RefreshCw, Copy, Check, Image as ImageIcon } from 'lucide-react'

interface RewriteResult {
  id: number
  taskId: number
  materialId: number
  originalTitle: string
  rewrittenTitle?: string
  originalDescription?: string
  rewrittenDescription?: string
  originalContent: string
  rewrittenContent?: string
  rewriteStyle: RewriteStyle
  qualityScore?: number
  wordCount?: number
  processingTimeMs?: number
  createdAt: Date
}

interface AIRewriteTask {
  id: number
  materialId: number
  status: AIRewriteStatus
  originalContent: string
  rewrittenContent?: string
  rewriteStyle: RewriteStyle
  rewritePrompt?: string
  errorMessage?: string
  processingStartedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export default function RewriteResultPage() {
  const params = useParams()
  const router = useRouter()
  const materialId = parseInt(params.id as string)
  const [material, setMaterial] = useState<Material | null>(null)
  const [rewriteTask, setRewriteTask] = useState<AIRewriteTask | null>(null)
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const { push: pushToast } = useToast()
  const [isIllustrating, setIsIllustrating] = useState(false)
  const [illustratedContent, setIllustratedContent] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null)

  // 加载素材信息
  const loadMaterial = useCallback(async () => {
    try {
      console.log('开始加载素材，素材ID:', materialId) // 调试日志
      
      const response = await fetch(`/api/materials?materialId=${materialId}`)
      const result = await response.json()
      
      console.log('素材API响应:', result) // 调试日志

      if (result.success && result.data.materials.length > 0) {
        const materialData = result.data.materials[0]
        console.log('素材数据:', materialData) // 调试日志
        
        // 修复日期字段
        const fixedMaterial = {
          ...materialData,
          createdAt: materialData.created_at ? new Date(materialData.created_at) : new Date(),
          updatedAt: materialData.updated_at ? new Date(materialData.updated_at) : new Date(),
        }
        setMaterial(fixedMaterial)
        console.log('素材设置完成') // 调试日志
      } else {
        console.log('素材不存在，跳转到素材库') // 调试日志
        pushToast({
          type: 'error',
          title: '加载失败',
          description: '素材不存在',
        })
        router.push('/materials')
        return
      }
    } catch (error) {
      console.error('加载素材失败:', error)
      pushToast({
        type: 'error',
        title: '加载失败',
        description: '网络错误，请重试',
      })
    }
  }, [materialId, pushToast, router])

  // 加载改写任务和结果
  const loadRewriteData = useCallback(async (retryCount = 0) => {
    if (!material) return // 确保素材已加载
    
    console.log(`开始加载改写数据，素材ID: ${materialId}，重试次数: ${retryCount}`) // 调试日志
    
    try {
      // 尝试获取改写任务
      const taskUrl = `/api/ai/rewrite?materialId=${materialId}`
      console.log('查询改写任务:', taskUrl)
      
      const taskResponse = await fetch(taskUrl)
      const taskResult = await taskResponse.json()
      console.log('改写任务查询结果:', taskResult)
      
      if (taskResult.success && taskResult.data.length > 0) {
        const task = taskResult.data[0]
        console.log('找到改写任务:', task)
        
        // 修复字段映射
        const mappedTask = {
          id: task.id,
          materialId: task.material_id,
          status: task.status,
          originalContent: task.original_content,
          rewrittenContent: task.rewritten_content,
          rewriteStyle: task.rewrite_style,
          rewritePrompt: task.rewrite_prompt,
          errorMessage: task.error_message,
          processingStartedAt: task.processing_started_at ? new Date(task.processing_started_at) : undefined,
          completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
        }
        
        console.log('映射后的任务数据:', mappedTask)
        setRewriteTask(mappedTask)

        // 如果有改写结果，加载结果详情
        if (task.status === 'completed') {
          console.log('任务已完成，开始加载改写结果')
          
          try {
            // 从改写结果表获取详细数据
            const resultUrl = `/api/rewrite-results?taskId=${task.id}`
            console.log('调用改写结果API:', resultUrl)
            
            const resultResponse = await fetch(resultUrl)
            const resultData = await resultResponse.json()
            console.log('改写结果API响应:', resultData)
            
            if (resultData.success && resultData.data.length > 0) {
              const result = resultData.data[0]
              console.log('找到改写结果:', result)
              
              setRewriteResult({
                id: result.id,
                taskId: result.task_id,
                materialId: result.material_id,
                originalTitle: result.original_title || '',
                rewrittenTitle: result.rewritten_title || '',
                originalDescription: result.original_description || '',
                rewrittenDescription: result.rewritten_description || '',
                originalContent: result.original_content || '',
                rewrittenContent: result.rewritten_content || '',
                rewriteStyle: result.rewrite_style,
                qualityScore: result.quality_score,
                wordCount: result.word_count || 0,
                processingTimeMs: result.processing_time_ms,
                createdAt: new Date(result.created_at),
              })
            } else {
              console.log('未找到改写结果，使用任务数据作为后备')
              
              // 如果没有找到改写结果，使用任务数据作为后备
              setRewriteResult({
                id: task.id,
                taskId: task.id,
                materialId: task.material_id,
                originalTitle: material?.title || '',
                rewrittenTitle: material?.title || '',
                originalDescription: material?.description || '',
                rewrittenDescription: material?.description || '',
                originalContent: task.original_content || '',
                rewrittenContent: task.rewritten_content || '',
                rewriteStyle: task.rewrite_style,
                wordCount: task.rewritten_content?.length || 0,
                processingTimeMs: task.completed_at && task.processing_started_at 
                  ? new Date(task.completed_at).getTime() - new Date(task.processing_started_at).getTime()
                  : undefined,
                createdAt: new Date(task.created_at),
              })
            }
          } catch (resultError) {
            console.error('加载改写结果失败:', resultError)
            // 即使改写结果加载失败，也不影响任务显示
          }
        } else {
          console.log('任务状态不是completed:', task.status)
        }
      } else {
        console.log('未找到改写任务')
        
        // 只有在重试次数少于2次时才重试，避免无限循环
        if (retryCount < 2) {
          console.log(`重试获取改写任务，第${retryCount + 1}次重试`)
          setTimeout(() => {
            loadRewriteData(retryCount + 1)
          }, 3000) // 固定3秒延迟
        } else {
          console.log('重试次数已达上限，停止重试')
        }
      }
    } catch (error) {
      console.error('加载改写数据失败:', error)
      
      // 只有在重试次数少于2次时才重试
      if (retryCount < 2) {
        console.log(`重试获取改写任务，第${retryCount + 1}次重试`)
        setTimeout(() => {
          loadRewriteData(retryCount + 1)
        }, 3000) // 固定3秒延迟
      } else {
        console.log('重试次数已达上限，停止重试')
      }
    }
  }, [material, materialId])

  // 重新触发AI改写
  async function retriggerRewrite() {
    if (!material) return

    try {
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: material.id,
          rewriteStyle: rewriteTask?.rewriteStyle || RewriteStyle.PROFESSIONAL,
        }),
      })

      const result = await response.json()

      if (result.success) {
        pushToast({
          type: 'success',
          title: 'AI改写已启动',
          description: '正在处理中，请稍后刷新页面查看结果',
        })
        
        // 重新加载数据
        setTimeout(() => {
          loadRewriteData()
        }, 2000)
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

  // 复制内容到剪贴板
  async function copyToClipboard(content: string, type: string) {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(type)
      pushToast({
        type: 'success',
        title: '复制成功',
        description: `${type}已复制到剪贴板`,
      })
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      pushToast({
        type: 'error',
        title: '复制失败',
        description: '请手动复制内容',
      })
    }
  }

  // 获取改写风格标签
  function getRewriteStyleLabel(style: RewriteStyle | string) {
    const styleLabels: Record<RewriteStyle, string> = {
      [RewriteStyle.PROFESSIONAL]: '专业正式',
      [RewriteStyle.FRIENDLY]: '友好亲切',
      [RewriteStyle.HUMOROUS]: '幽默风趣',
      [RewriteStyle.FORMAL]: '正式庄重',
      [RewriteStyle.CREATIVE]: '创意新颖',
    }
    return styleLabels[style as RewriteStyle] || style
  }

  // 获取状态徽章
  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">等待中</Badge>
      case 'processing':
        return <Badge variant="default">处理中</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">已完成</Badge>
      case 'failed':
        return <Badge variant="destructive">失败</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  // 监控状态变化
  useEffect(() => {
    console.log('状态变化监控 - rewriteTask:', rewriteTask)
  }, [rewriteTask])

  useEffect(() => {
    console.log('状态变化监控 - rewriteResult:', rewriteResult)
  }, [rewriteResult])

  useEffect(() => {
    if (materialId) {
      console.log('useEffect触发，素材ID:', materialId) // 调试日志
      loadMaterial().then(() => {
        console.log('素材加载完成，开始加载改写数据') // 调试日志
        // 素材加载完成后再加载改写数据，添加延迟确保数据一致性
        setTimeout(() => {
          loadRewriteData()
        }, 500)
      }).finally(() => {
        setLoading(false)
      })
    }
  }, [materialId]) // 只依赖 materialId

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  if (!material) {
    return null
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">改写结果详情</h1>
          <p className="text-muted-foreground mt-2">
            {material.title}
          </p>
        </div>
      </div>

      {/* 素材基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>素材信息</span>
            <div className="flex items-center gap-2">
              {getStatusBadge(rewriteTask?.status || 'pending')}
              {rewriteTask?.status === 'failed' && (
                <Button
                  size="sm"
                  onClick={retriggerRewrite}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新改写
                </Button>
              )}
              {rewriteResult?.rewrittenContent && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isIllustrating}
                  onClick={async () => {
                    try {
                      setIsIllustrating(true)
                      setIllustratedContent(null)
                      const res = await fetch('/api/ai/illustrate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ materialId }),
                      })
                      const json = await res.json()
                      if (json?.success) {
                        setIllustratedContent(json.data.contentWithImages)
                        setCoverImage(json.data.cover || null)
                        pushToast({ type: 'success', title: 'AI配图完成', description: '已生成插图并插入到正文预览' })
                      } else {
                        throw new Error(json?.error || 'AI配图失败')
                      }
                    } catch (e) {
                      pushToast({ type: 'error', title: 'AI配图失败', description: e instanceof Error ? e.message : '未知错误' })
                    } finally {
                      setIsIllustrating(false)
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isIllustrating ? '配图中...' : 'AI配图'}
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">来源平台</label>
              <p className="mt-1">{material.sourcePlatform}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">改写风格</label>
              <p className="mt-1">{getRewriteStyleLabel(rewriteTask?.rewriteStyle || RewriteStyle.PROFESSIONAL)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">添加时间</label>
              <p className="mt-1">{formatRelativeTime(material.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">处理状态</label>
              <div className="mt-1">
                {getStatusBadge(rewriteTask?.status || 'pending')}
              </div>
            </div>
          </div>
          
          {/* 调试信息 */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">
              <div>调试信息:</div>
              <div>改写任务状态: {rewriteTask?.status || '无'}</div>
              <div>改写结果: {rewriteResult ? '已加载' : '未加载'}</div>
              <div>素材ID: {materialId}</div>
            </div>
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  console.log('手动测试API调用...')
                  fetch(`/api/ai/rewrite?materialId=${materialId}`)
                    .then(res => res.json())
                    .then(data => {
                      console.log('手动API测试结果:', data)
                      if (data.success && data.data.length > 0) {
                        console.log('找到改写任务:', data.data[0])
                      } else {
                        console.log('没有找到改写任务，数据库可能为空')
                      }
                    })
                    .catch(err => console.error('手动API测试失败:', err))
                }}
              >
                测试API
              </Button>
            </div>
          </div>
          
          {rewriteTask?.rewritePrompt && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">改写提示词</label>
              <p className="mt-1 p-3 bg-muted rounded-md text-sm">{rewriteTask.rewritePrompt}</p>
            </div>
          )}

          {rewriteTask?.errorMessage && (
            <div>
              <label className="text-sm font-medium text-red-600">错误信息</label>
              <p className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {rewriteTask.errorMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 内容对比 */}
      {rewriteTask && (
        <Card>
          <CardHeader>
            <CardTitle>内容对比</CardTitle>
          </CardHeader>
          <CardContent>
            {rewriteResult ? (
              <>
                <Tabs defaultValue="title" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="title">标题对比</TabsTrigger>
                    <TabsTrigger value="description">描述对比</TabsTrigger>
                    <TabsTrigger value="content">内容对比</TabsTrigger>
                  </TabsList>

                  <TabsContent value="title" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center justify-between">
                          原标题
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(rewriteResult.originalTitle, '原标题')}
                            className="flex items-center gap-2"
                          >
                            {copied === '原标题' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            复制
                          </Button>
                        </h4>
                        <div className="p-4 bg-muted rounded-md">
                          {rewriteResult.originalTitle}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 flex items-center justify-between">
                          改写后标题
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(rewriteResult.rewrittenTitle || '', '改写后标题')}
                            className="flex items-center gap-2"
                          >
                            {copied === '改写后标题' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            复制
                          </Button>
                        </h4>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                          {rewriteResult.rewrittenTitle || '暂无改写结果'}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="description" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center justify-between">
                          原描述
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(rewriteResult.originalDescription || '', '原描述')}
                            className="flex items-center gap-2"
                          >
                            {copied === '原描述' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            复制
                          </Button>
                        </h4>
                        <div className="p-4 bg-muted rounded-md min-h-[100px]">
                          {rewriteResult.originalDescription || '暂无描述'}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 flex items-center justify-between">
                          改写后描述
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(rewriteResult.rewrittenDescription || '', '改写后描述')}
                            className="flex items-center gap-2"
                          >
                            {copied === '改写后描述' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            复制
                          </Button>
                        </h4>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md min-h-[100px]">
                          {rewriteResult.rewrittenDescription || '暂无改写结果'}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center justify-between">
                          原内容
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(rewriteResult.originalContent, '原内容')}
                            className="flex items-center gap-2"
                          >
                            {copied === '原内容' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            复制
                          </Button>
                        </h4>
                        <div className="p-4 bg-muted rounded-md min-h-[200px] max-h-[400px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{rewriteResult.originalContent}</pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3 flex items-center justify-between">
                          改写后内容{illustratedContent ? '（含配图的Markdown预览）' : ''}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(rewriteResult.rewrittenContent || '', '改写后内容')}
                              className="flex items-center gap-2"
                            >
                              {copied === '改写后内容' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              复制
                            </Button>
                           {illustratedContent && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => copyToClipboard(illustratedContent, '配图Markdown')}
                               className="flex items-center gap-2"
                             >
                               {copied === '配图Markdown' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                               复制配图Markdown
                             </Button>
                           )}
                          </div>
                        </h4>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md min-h-[200px] max-h-[400px] overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{illustratedContent || rewriteResult.rewrittenContent || '暂无改写结果'}</pre>
                        </div>
                       {coverImage && (
                         <div className="mt-3 text-xs text-muted-foreground">封面：{coverImage}</div>
                       )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* 统计信息 */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{rewriteResult.wordCount || 0}</div>
                    <div className="text-sm text-muted-foreground">字数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {rewriteResult.processingTimeMs ? `${Math.round(rewriteResult.processingTimeMs / 1000)}s` : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">处理时间</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {rewriteResult.qualityScore ? `${(rewriteResult.qualityScore * 100).toFixed(0)}%` : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">质量评分</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {rewriteTask.status === 'completed' ? '正在加载改写结果...' : '改写任务状态: ' + rewriteTask.status}
                </div>
                {rewriteTask.status === 'completed' && (
                  <div className="mt-4">
                    <Button onClick={() => loadRewriteData()} variant="outline">
                      重新加载
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/materials')}
        >
          返回素材库
        </Button>
        {rewriteTask?.status === 'completed' && (
          <Button
            onClick={() => {
              // TODO: 实现发布到公众号功能
              pushToast({
                type: 'info',
                title: '功能开发中',
                description: '发布到公众号功能正在开发中',
              })
            }}
          >
            发布到公众号
          </Button>
        )}
      </div>
    </div>
  )
}
