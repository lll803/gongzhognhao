import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const DEFAULT_LIMIT = 50

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching hot items...')
    
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`), 200)
    const hashidsParam = searchParams.get('hashids')
    const hashids = hashidsParam ? hashidsParam.split(',').map((s) => s.trim()) : undefined

    console.log('Query params:', { limit, hashids })

    let query = supabaseAdmin
      .from('hotitems')
      .select('*')
      .order('hashid', { ascending: true })
      .order('rank', { ascending: true })
      .limit(limit)

    if (hashids && hashids.length > 0) {
      query = query.in('hashid', hashids)
    }

    console.log('Executing Supabase query...')
    const { data, error } = await query

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`Successfully fetched ${data?.length || 0} items`)
    return NextResponse.json({ success: true, data: { items: data || [] } })
    
  } catch (error: any) {
    console.error('Unexpected error in items API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch items',
      stack: error?.stack 
    }, { status: 500 })
  }
}


