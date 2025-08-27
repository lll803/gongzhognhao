"use client"
import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface ResultItem { url: string; ok: boolean; id?: number; error?: string }

function parseUrls(input: string): string[] {
  return Array.from(new Set(
    input.split(/\s+/).map(s => s.trim()).filter(s => /^https?:\/\/.+/.test(s))
  ))
}

export function UrlCollector() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ResultItem[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const { push } = useToast()

  function collect() {
    const urls = parseUrls(input)
    if (urls.length === 0) {
      push({ title: '提示', description: '请粘贴至少一个有效链接', type: 'warning' as any })
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/scraping/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls, category: '采集' }),
        })
        const json = await res.json()
        if (!json?.success) throw new Error(json?.error || '采集失败')
        setResults(json.data.results)
        const ok = json.data.results.filter((r: ResultItem) => r.ok).length
        push({ title: '完成', description: `成功 ${ok}/${urls.length}` })
      } catch (e: any) {
        push({ title: '错误', description: e?.message || '采集失败', type: 'error' as any })
      }
    })
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">粘贴一行一个或空格分隔的文章链接</label>
        <Textarea rows={4} value={input} onChange={e => setInput(e.target.value)} placeholder="https://mp.weixin.qq.com/s/...." />
      </div>
      <Button disabled={isPending} onClick={collect}>采集并加入素材</Button>
      {results && (
        <div className="text-sm border rounded-md divide-y">
          {results.map(r => (
            <div key={r.url} className="p-2 flex items-center justify-between">
              <div className="truncate mr-2 max-w-[70%]">{r.url}</div>
              <div className={r.ok ? 'text-emerald-600' : 'text-red-600'}>
                {r.ok ? `成功${r.id ? ` (#${r.id})` : ''}` : `失败：${r.error || ''}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}


