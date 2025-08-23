import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  try {
    // 获取榜单统计
    const { data: boardStats, error: boardError } = await supabaseAdmin
      .from('hotboards')
      .select('hashid, name, updated_at')

    if (boardError) {
      return NextResponse.json({ success: false, error: boardError.message }, { status: 500 })
    }

    // 获取项目统计
    const { data: itemStats, error: itemError } = await supabaseAdmin
      .from('hotitems')
      .select('hashid, collected_at')

    if (itemError) {
      return NextResponse.json({ success: false, error: itemError.message }, { status: 500 })
    }

    // 计算统计信息
    const totalBoards = boardStats?.length || 0
    const totalItems = itemStats?.length || 0
    
    // 按榜单分组统计
    const itemsByBoard = itemStats?.reduce((acc, item) => {
      acc[item.hashid] = (acc[item.hashid] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // 最新更新时间
    const latestUpdate = boardStats?.reduce((latest, board) => {
      const updateTime = new Date(board.updated_at)
      return updateTime > latest ? updateTime : latest
    }, new Date(0))

    const stats = {
      totalBoards,
      totalItems,
      itemsByBoard,
      latestUpdate: latestUpdate?.toISOString(),
      boardDetails: boardStats?.map(board => ({
        hashid: board.hashid,
        name: board.name,
        itemCount: itemsByBoard[board.hashid] || 0,
        lastUpdated: board.updated_at
      }))
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch stats' }, 
      { status: 500 }
    )
  }
}
