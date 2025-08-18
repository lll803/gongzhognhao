'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Users,
  Zap,
  Eye,
  Share2
} from 'lucide-react'

const stats = [
  {
    title: '总文章数',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: FileText,
    description: '较上月增长'
  },
  {
    title: '今日采集',
    value: '89',
    change: '+5%',
    changeType: 'positive',
    icon: TrendingUp,
    description: '较昨日增长'
  },
  {
    title: '待发布',
    value: '23',
    change: '-3',
    changeType: 'neutral',
    icon: Clock,
    description: '等待发布'
  },
  {
    title: '已发布',
    value: '1,156',
    change: '+8%',
    changeType: 'positive',
    icon: CheckCircle,
    description: '发布成功'
  },
  {
    title: '活跃账号',
    value: '5',
    change: '+1',
    changeType: 'positive',
    icon: Users,
    description: '公众号账号'
  },
  {
    title: 'AI改写',
    value: '456',
    change: '+15%',
    changeType: 'positive',
    icon: Zap,
    description: '改写完成'
  },
  {
    title: '阅读量',
    value: '89.2K',
    change: '+22%',
    changeType: 'positive',
    icon: Eye,
    description: '总阅读量'
  },
  {
    title: '分享数',
    value: '2.3K',
    change: '+18%',
    changeType: 'positive',
    icon: Share2,
    description: '总分享数'
  }
]

export function DashboardStats() {
  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stat.value}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <span className={`
                ${stat.changeType === 'positive' ? 'text-emerald-600' : ''}
                ${stat.changeType === 'negative' ? 'text-red-600' : ''}
                ${stat.changeType === 'neutral' ? 'text-gray-600' : ''}
              `}>
                {stat.change}
              </span>
              <span>{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
} 