import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 获取改写结果
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const materialId = searchParams.get('materialId')

    if (!taskId && !materialId) {
      return NextResponse.json(
        { success: false, error: '需要提供 taskId 或 materialId 参数' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('rewrite_results')
      .select('*')
      .order('created_at', { ascending: false })

    if (taskId) {
      query = query.eq('task_id', taskId)
    } else if (materialId) {
      query = query.eq('material_id', materialId)
    }

    const { data: results, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: results || [],
    })
  } catch (error) {
    console.error('获取改写结果失败:', error)
    return NextResponse.json(
      { success: false, error: '获取改写结果失败' },
      { status: 500 }
    )
  }
}
