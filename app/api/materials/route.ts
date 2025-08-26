import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Material, MaterialStatus } from '@/lib/types'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 获取素材列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'active'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const materialId = searchParams.get('materialId')

    let query = supabase
      .from('materials')
      .select('*', { count: 'exact' })

    // 状态过滤
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 分类过滤
    if (category) {
      query = query.eq('category', category)
    }

    // 指定ID
    if (materialId) {
      query = query.eq('id', materialId)
    }

    // 搜索过滤
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 分页
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        materials: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
    })
  } catch (error) {
    console.error('获取素材列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取素材列表失败' },
      { status: 500 }
    )
  }
}

// 创建新素材
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      sourceUrl,
      sourcePlatform,
      sourceHashid,
      sourceRank,
      sourceHotValue,
      thumbnail,
      extraData,
      tags,
      category,
      userId,
    } = body

    // 验证必填字段
    if (!title || !sourceUrl || !sourcePlatform) {
      return NextResponse.json(
        { success: false, error: '标题、来源链接和平台为必填字段' },
        { status: 400 }
      )
    }

    // 检查是否已存在相同来源的素材
    const { data: existingMaterial } = await supabase
      .from('materials')
      .select('id')
      .eq('source_url', sourceUrl)
      .eq('status', 'active')
      .single()

    if (existingMaterial) {
      return NextResponse.json(
        { success: false, error: '该素材已存在于素材库中' },
        { status: 409 }
      )
    }

    // 创建新素材
    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        title,
        description,
        source_url: sourceUrl,
        source_platform: sourcePlatform,
        source_hashid: sourceHashid,
        source_rank: sourceRank,
        source_hot_value: sourceHotValue,
        thumbnail,
        extra_data: extraData,
        tags: tags || [],
        category,
        user_id: userId,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: material,
      message: '素材添加成功',
    })
  } catch (error) {
    console.error('创建素材失败:', error)
    return NextResponse.json(
      { success: false, error: '创建素材失败' },
      { status: 500 }
    )
  }
}
