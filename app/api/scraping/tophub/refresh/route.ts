import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface TopHubItem {
  title: string
  description?: string
  url: string
  thumbnail?: string
  extra?: unknown
}

interface TopHubBoardResponse {
  error: boolean
  status: number
  data: {
    hashid: string
    name: string
    display: string
    domain: string
    logo?: string
    items: TopHubItem[]
  }
}

const TOPHUB_BASE_URL = process.env.TOPHUB_BASE_URL || 'https://api.tophubdata.com'
const TOPHUB_API_KEY = process.env.TOPHUB_API_KEY

if (!TOPHUB_API_KEY) {
  console.warn('TOPHUB_API_KEY is not set. Refresh endpoint will fail until it is configured.')
}

const TARGET_BOARDS: Array<{ hashid: string; label: string }> = [
  { hashid: 'WnBe01o371', label: '微信24小时热文榜' },
  { hashid: 'nBe0xxje37', label: '微信生活24小时热文榜' },
  { hashid: 'proPGGOeq6', label: '微信文化24小时热文榜' },
  { hashid: 'Q0orrr0o8B', label: '微信健康24小时热文榜' },
  { hashid: 'm4ejxxyvxE', label: '微信美食24小时热文榜' },
  { hashid: '1VdJ77keLQ', label: '微信情感24小时热文榜' },
]

function parseHotValue(extra: unknown): number {
  if (typeof extra !== 'string') return 0
  // e.g. "455 万热度" -> 4550000
  const match = extra.match(/([\d\.]+)\s*(万)?/)
  if (!match) return 0
  const value = parseFloat(match[1])
  return match[2] ? Math.round(value * 10000) : Math.round(value)
}

export async function POST(req: NextRequest) {
  if (!TOPHUB_API_KEY) {
    return NextResponse.json({ success: false, error: 'TOPHUB_API_KEY not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const onlyHashid = searchParams.get('hashid') || undefined

  const results: Array<{ hashid: string; ok: boolean; count: number; error?: string }> = []

  const boards = onlyHashid
    ? TARGET_BOARDS.filter((b) => b.hashid === onlyHashid)
    : TARGET_BOARDS

  console.log(`Starting refresh for ${boards.length} boards...`)

  for (const { hashid } of boards) {
    try {
      console.log(`Fetching board: ${hashid}`)
      
      const res = await fetch(`${TOPHUB_BASE_URL}/nodes/${hashid}`, {
        method: 'GET',
        headers: { Authorization: TOPHUB_API_KEY },
        // Avoid Next caching
        cache: 'no-store',
      })

      if (!res.ok) {
        const errorMsg = `HTTP ${res.status}`
        console.error(`Failed to fetch ${hashid}: ${errorMsg}`)
        results.push({ hashid, ok: false, count: 0, error: errorMsg })
        continue
      }

      const json = (await res.json()) as TopHubBoardResponse
      console.log(`Board ${hashid} response:`, { 
        error: json.error, 
        status: json.status, 
        hasData: !!json.data,
        itemCount: json.data?.items?.length || 0
      })
      
      if (json.error || !json.data) {
        const errorMsg = 'Invalid response'
        console.error(`Invalid response for ${hashid}:`, json)
        results.push({ hashid, ok: false, count: 0, error: errorMsg })
        continue
      }

      const board = json.data
      console.log(`Processing board: ${board.name} (${board.hashid}) with ${board.items?.length || 0} items`)

      // Upsert board metadata
      const { error: boardErr } = await supabaseAdmin
        .from('hotboards')
        .upsert(
          [
            {
              hashid: board.hashid,
              name: board.name,
              display: board.display,
              domain: board.domain,
              logo: board.logo || null,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'hashid' }
        )

      if (boardErr) {
        console.error(`Failed to upsert board ${hashid}:`, boardErr)
        results.push({ hashid, ok: false, count: 0, error: boardErr.message })
        continue
      }

      console.log(`Board ${hashid} metadata saved successfully`)

      // Prepare items with rank
      const items = (board.items || []).map((it, idx) => ({
        hashid: board.hashid,
        rank: idx + 1,
        title: it.title,
        description: it.description || null,
        url: it.url,
        thumbnail: it.thumbnail || null,
        extra: typeof it.extra === 'string' ? it.extra : it.extra ? JSON.stringify(it.extra) : null,
        hot_value: parseHotValue(it.extra),
        collected_at: new Date().toISOString(),
      }))

      console.log(`Prepared ${items.length} items for board ${hashid}`)

      // Upsert items, dedupe by (hashid, url)
      const { error: itemsErr, data: insertedItems } = await supabaseAdmin
        .from('hotitems')
        .upsert(items, { onConflict: 'hashid,url' })

      if (itemsErr) {
        console.error(`Failed to upsert items for ${hashid}:`, itemsErr)
        results.push({ hashid, ok: false, count: 0, error: itemsErr.message })
        continue
      }

      console.log(`Successfully saved ${items.length} items for board ${hashid}`)
      results.push({ hashid, ok: true, count: items.length })
      
      // Small delay to be polite and avoid backend timeout
      if (boards.indexOf({ hashid, label: '' }) < boards.length - 1) {
        await new Promise((r) => setTimeout(r, 250))
      }
    } catch (e: any) {
      console.error(`Unexpected error for board ${hashid}:`, e)
      results.push({ hashid, ok: false, count: 0, error: e?.message || 'Unknown error' })
    }
  }

  const total = results.reduce((sum, r) => sum + r.count, 0)
  const ok = results.every((r) => r.ok)
  
  console.log(`Refresh completed. Total items: ${total}, All successful: ${ok}`)
  console.log('Results:', results)
  
  return NextResponse.json({ success: ok, total, results })
}


