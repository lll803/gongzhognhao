"use client"

import * as React from 'react'
import { Article, PublishStatus } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArticlesTableProps {
  data: Article[]
}

export function ArticlesTable({ data }: ArticlesTableProps) {
  const { push } = useToast()
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState<string>('all')
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortKey, setSortKey] = React.useState<keyof Article>('createdAt')
  const [sortAsc, setSortAsc] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = data.filter(a => {
      const okQ = !q || a.title.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q)
      const okS = status === 'all' || a.publishStatus === status
      return okQ && okS
    })
    rows.sort((a: any, b: any) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va === vb) return 0
      if (va > vb) return sortAsc ? 1 : -1
      return sortAsc ? -1 : 1
    })
    return rows
  }, [data, query, status, sortKey, sortAsc])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize)

  function onSort(key: keyof Article) {
    if (key === sortKey) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function onPublish(article: Article) {
    push({ type: 'info', title: '提交发布', description: `已提交发布：${article.title}` })
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <Input placeholder="搜索标题或摘要..." value={query} onChange={e => setQuery(e.target.value)} />
        <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">全部状态</option>
          <option value={PublishStatus.DRAFT}>草稿</option>
          <option value={PublishStatus.PENDING}>待发布</option>
          <option value={PublishStatus.PUBLISHED}>已发布</option>
          <option value={PublishStatus.FAILED}>发布失败</option>
        </Select>
        <Select value={String(pageSize)} onChange={e => setPageSize(Number(e.target.value))}>
          <option value="10">每页 10 条</option>
          <option value="20">每页 20 条</option>
          <option value="50">每页 50 条</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th onClick={() => onSort('title')} active={sortKey === 'title'} asc={sortAsc}>标题</Th>
              <Th onClick={() => onSort('category')} active={sortKey === 'category'} asc={sortAsc}>分类</Th>
              <Th onClick={() => onSort('createdAt')} active={sortKey === 'createdAt'} asc={sortAsc}>创建时间</Th>
              <Th onClick={() => onSort('publishStatus')} active={sortKey === 'publishStatus'} asc={sortAsc}>状态</Th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map(row => (
              <tr key={row.id} className="border-t hover:bg-accent/5">
                <td className="px-4 py-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-left font-medium text-foreground hover:text-primary">
                        {row.title}
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{row.title}</DialogTitle>
                      </DialogHeader>
                      <div className="prose max-h-[60vh] overflow-auto text-sm">
                        {row.content || row.summary}
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{row.category}</td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3">
                  <StatusPill status={row.publishStatus} />
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => onPublish(row)}>发布</DropdownMenuItem>
                      <DropdownMenuItem>编辑</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">删除</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <Skeleton className="h-8 w-full" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="text-xs text-muted-foreground">
          共 {total} 条 · 第 {page} / {totalPages} 页
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>下一页</Button>
        </div>
      </div>
    </div>
  )
}

function Th({ children, onClick, active, asc }: { children: React.ReactNode; onClick: () => void; active: boolean; asc: boolean }) {
  return (
    <th className="px-4 py-3 text-left">
      <button onClick={onClick} className={"group inline-flex items-center gap-1 font-medium"}>
        {children}
        <span className={cn("h-3 w-2", active ? "text-primary" : "text-muted-foreground")}>{asc ? '▲' : '▼'}</span>
      </button>
    </th>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    [PublishStatus.DRAFT]: 'bg-gray-100 text-gray-700',
    [PublishStatus.PENDING]: 'bg-amber-100 text-amber-700',
    [PublishStatus.PUBLISHED]: 'bg-emerald-100 text-emerald-700',
    [PublishStatus.FAILED]: 'bg-red-100 text-red-700'
  }
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs', map[status] || 'bg-gray-100 text-gray-700')}>{status}</span>
} 