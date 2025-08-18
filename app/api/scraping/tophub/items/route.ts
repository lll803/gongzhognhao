import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const DEFAULT_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`), 200)
    const hashidsParam = searchParams.get('hashids')
    const hashids = hashidsParam ? hashidsParam.split(',').map((s) => s.trim()) : undefined

    let query = supabaseAdmin
      .from('hotitems')
      .select('*')
      .order('hashid', { ascending: true })
      .order('rank', { ascending: true })
      .limit(limit)

    if (hashids && hashids.length > 0) {
      query = query.in('hashid', hashids)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { items: data || [] } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch items' }, { status: 500 })
  }
}


