import { NextRequest, NextResponse } from 'next/server'
import { HotItem, Platform } from '@/lib/types'

// 模拟热榜数据
const mockHotItems: HotItem[] = [
  {
    id: '1',
    title: 'OpenAI发布GPT-5，性能大幅提升',
    description: '最新版本在多个基准测试中表现优异',
    url: 'https://example.com/hot1',
    platform: Platform.ZHIHU,
    rank: 1,
    hotValue: 9856,
    category: '科技',
    createdAt: new Date('2024-01-15T12:00:00Z')
  },
  {
    id: '2',
    title: '新能源汽车销量创新高',
    description: '政策支持和技术进步推动市场增长',
    url: 'https://example.com/hot2',
    platform: Platform.WECHAT,
    rank: 2,
    hotValue: 8765,
    category: '汽车',
    createdAt: new Date('2024-01-15T11:45:00Z')
  },
  {
    id: '3',
    title: '2024年春节旅游预订火爆',
    description: '出境游和国内游都呈现强劲复苏',
    url: 'https://example.com/hot3',
    platform: Platform.BAIDU,
    rank: 3,
    hotValue: 7654,
    category: '旅游',
    createdAt: new Date('2024-01-15T11:30:00Z')
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let filteredItems = [...mockHotItems]
    
    // 按平台筛选
    if (platform) {
      filteredItems = filteredItems.filter(item => item.platform === platform)
    }
    
    // 限制数量
    const limitedItems = filteredItems.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      data: {
        items: limitedItems,
        total: limitedItems.length,
        platform: platform || 'all',
        collectedAt: new Date()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取热榜数据失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 这里应该实现实际的数据采集逻辑
    // 调用各平台的API或使用爬虫技术
    
    const newItems: HotItem[] = body.items || []
    
    // 模拟添加到数据库
    newItems.forEach(item => {
      mockHotItems.push({
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        createdAt: new Date()
      })
    })
    
    return NextResponse.json({
      success: true,
      data: {
        collected: newItems.length,
        message: `成功采集 ${newItems.length} 条热榜数据`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '采集热榜数据失败' },
      { status: 500 }
    )
  }
} 