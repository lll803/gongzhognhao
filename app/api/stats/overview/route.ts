import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // materials 总数
    const { count: materials_total } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })

    // 今日新增 materials
    const { count: materials_today } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString())

    // 改写任务统计
    const { count: ai_tasks_total } = await supabase
      .from('ai_rewrite_tasks')
      .select('*', { count: 'exact', head: true })

    const { count: ai_tasks_completed } = await supabase
      .from('ai_rewrite_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: ai_tasks_processing } = await supabase
      .from('ai_rewrite_tasks')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing'])

    const { count: ai_tasks_completed_24h } = await supabase
      .from('ai_rewrite_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', last24h.toISOString())

    // 改写结果
    const { count: rewrite_results_total } = await supabase
      .from('rewrite_results')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      data: {
        materials_total: materials_total || 0,
        materials_today: materials_today || 0,
        ai_tasks_total: ai_tasks_total || 0,
        ai_tasks_completed: ai_tasks_completed || 0,
        ai_tasks_processing: ai_tasks_processing || 0,
        ai_tasks_completed_24h: ai_tasks_completed_24h || 0,
        rewrite_results_total: rewrite_results_total || 0,
      }
    })
  } catch (error) {
    console.error('获取概览统计失败:', error)
    return NextResponse.json({ success: false, error: '获取概览统计失败' }, { status: 500 })
  }
}
