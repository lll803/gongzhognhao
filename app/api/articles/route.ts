import { NextRequest, NextResponse } from 'next/server'
import { Article, Platform, PublishStatus } from '@/lib/types'

// 模拟数据库
const mockArticles: Article[] = [
  {
    id: '1',
    title: '人工智能在医疗领域的应用前景',
    content: '随着技术的不断发展，AI在医疗领域的应用越来越广泛...',
    summary: '探讨AI技术在医疗诊断、药物研发等方面的最新进展',
    sourceUrl: 'https://example.com/article1',
    sourcePlatform: Platform.ZHIHU,
    tags: ['AI', '医疗', '科技'],
    category: '科技',
    publishStatus: PublishStatus.PUBLISHED,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    publishedAt: new Date('2024-01-15T11:00:00Z'),
    aiRewrittenContent: 'AI改写后的内容...',
    aiRewriteStyle: 'professional'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    
    let filteredArticles = [...mockArticles]
    
    // 按分类筛选
    if (category) {
      filteredArticles = filteredArticles.filter(article => article.category === category)
    }
    
    // 按状态筛选
    if (status) {
      filteredArticles = filteredArticles.filter(article => article.publishStatus === status)
    }
    
    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex)
    
    return NextResponse.json({
      success: true,
      data: {
        articles: paginatedArticles,
        total: filteredArticles.length,
        page,
        limit,
        totalPages: Math.ceil(filteredArticles.length / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取文章列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 这里应该添加数据验证
    const newArticle: Article = {
      id: Date.now().toString(),
      title: body.title,
      content: body.content,
      summary: body.summary,
      sourceUrl: body.sourceUrl,
      sourcePlatform: body.sourcePlatform,
      tags: body.tags || [],
      category: body.category,
      publishStatus: PublishStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 模拟添加到数据库
    mockArticles.push(newArticle)
    
    return NextResponse.json({
      success: true,
      data: newArticle,
      message: '文章创建成功'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '创建文章失败' },
      { status: 500 }
    )
  }
} 