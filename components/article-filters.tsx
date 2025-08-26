'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function ArticleFilters() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="搜索文章标题或内容..."
              className="max-w-sm"
            />
          </div>
          <Select className="w-32">
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </Select>
          <Select className="w-32">
            <option value="">全部分类</option>
            <option value="hot-trending">热榜趋势</option>
            <option value="wechat">微信文章</option>
            <option value="other">其他</option>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
