'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ArticleList() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground">暂无文章</div>
          <div className="text-sm text-muted-foreground mt-2">
            从素材库发布文章后，将在这里显示
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
