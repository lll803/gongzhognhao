'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function RewriteForm() {
  const [materialIdsInput, setMaterialIdsInput] = useState('')
  const [style, setStyle] = useState('professional')
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const styleOptions = [
    { value: 'professional', label: '专业正式' },
    { value: 'friendly', label: '友好亲切' },
    { value: 'humorous', label: '幽默风趣' },
    { value: 'formal', label: '正式庄重' },
    { value: 'creative', label: '创意新颖' },
  ]

  function parseIds(raw: string): number[] {
    return raw
      .split(/[\n,\s]+/)
      .map(s => Number(s.trim()))
      .filter(n => Number.isFinite(n) && n > 0)
  }

  async function submit() {
    const ids = parseIds(materialIdsInput)
    if (ids.length === 0) {
      setMessage({ type: 'error', text: '请至少输入一个有效的素材ID' })
      return
    }

    try {
      setIsSubmitting(true)
      setMessage(null)

      const body = ids.length === 1
        ? { materialId: ids[0], rewriteStyle: style, customPrompt: prompt.trim() || undefined }
        : { materialIds: ids, rewriteStyle: style, customPrompt: prompt.trim() || undefined }

      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const json = await res.json()

      if (json?.success) {
        if (Array.isArray(json?.data?.results)) {
          const total = json.data.results.length
          const successCount = json.data.results.filter((r: any) => r.taskId).length
          const failed = json.data.results.filter((r: any) => r.error)
          setMessage({ type: 'success', text: `批量启动完成：成功 ${successCount}/${total}${failed.length ? `，失败 ${failed.length}` : ''}` })
        } else {
          setMessage({ type: 'success', text: 'AI改写任务已启动，请查看右侧结果' })
        }
        // 不清空输入，方便继续批量
      } else {
        throw new Error(json?.error || '启动AI改写失败')
      }
    } catch (err) {
      console.error('提交失败:', err)
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : '启动失败，请检查网络连接' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearMessage = () => setMessage(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">改写设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">素材ID（支持批量）</label>
          <Textarea
            className="w-full"
            placeholder="输入一个或多个素材ID，逗号/空格/换行分隔。例：12, 15 18\n或者每行一个：\n12\n15\n18"
            value={materialIdsInput}
            onChange={e => setMaterialIdsInput(e.target.value)}
            onFocus={clearMessage}
            rows={3}
          />
          <div className="text-xs text-muted-foreground">
            已识别ID：{parseIds(materialIdsInput).join(', ') || '无'}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">改写风格</label>
          <Select 
            className="w-full" 
            value={style} 
            onChange={(e) => setStyle(e.target.value)}
          >
            {styleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            自定义提示词
            <span className="text-xs text-muted-foreground ml-1">（可选）</span>
          </label>
          <Textarea 
            placeholder="输入特定的改写要求或风格指导..." 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)}
            onFocus={clearMessage}
            rows={3}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <Button 
          onClick={submit} 
          className="w-full" 
          disabled={isSubmitting || parseIds(materialIdsInput).length === 0}
        >
          {isSubmitting ? '启动中...' : '开始改写'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>使用说明：</p>
          <p>1. 在左侧选择素材并复制ID，或手动输入多个ID</p>
          <p>2. 选择改写风格和添加自定义提示词</p>
          <p>3. 点击"开始改写"，批量创建AI改写任务</p>
        </div>
      </CardContent>
    </Card>
  )
}


