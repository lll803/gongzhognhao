import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 获取改写结果
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const materialId = searchParams.get('materialId')

    let query = supabase
      .from('rewrite_results')
      .select('*')

    if (taskId) {
      query = query.eq('task_id', taskId)
    }

    if (materialId) {
      query = query.eq('material_id', materialId)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('获取改写结果失败:', error)
    return NextResponse.json(
      { success: false, error: '获取改写结果失败' },
      { status: 500 }
    )
  }
}
