import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// DELETE /api/ai/rewrite/:id  删除单个改写任务及其改写结果
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const taskId = Number(params.id)
  if (!Number.isFinite(taskId) || taskId <= 0) {
    return NextResponse.json({ success: false, error: '无效的任务ID' }, { status: 400 })
  }

  try {
    // 先删除改写结果
    const { error: resErr } = await supabase
      .from('rewrite_results')
      .delete()
      .eq('task_id', taskId)

    if (resErr) throw resErr

    // 再删除任务本身
    const { error: taskErr } = await supabase
      .from('ai_rewrite_tasks')
      .delete()
      .eq('id', taskId)

    if (taskErr) throw taskErr

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除改写任务失败:', error)
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 })
  }
}


