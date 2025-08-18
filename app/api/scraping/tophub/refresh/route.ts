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

  for (const { hashid } of boards) {
    try {
      const res = await fetch(`${TOPHUB_BASE_URL}/nodes/${hashid}`, {
        method: 'GET',
        headers: { Authorization: TOPHUB_API_KEY },
        // Avoid Next caching
        cache: 'no-store',
      })

      if (!res.ok) {
        results.push({ hashid, ok: false, count: 0, error: `HTTP ${res.status}` })
        continue
      }

      const json = (await res.json()) as TopHubBoardResponse
      if (json.error || !json.data) {
        results.push({ hashid, ok: false, count: 0, error: 'Invalid response' })
        continue
      }

      const board = json.data

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
        results.push({ hashid, ok: false, count: 0, error: boardErr.message })
        continue
      }

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

      // Upsert items, dedupe by (hashid, url)
      const { error: itemsErr } = await supabaseAdmin
        .from('hotitems')
        .upsert(items, { onConflict: 'hashid,url' })

      if (itemsErr) {
        results.push({ hashid, ok: false, count: 0, error: itemsErr.message })
        continue
      }

      results.push({ hashid, ok: true, count: items.length })
      // Small delay to be polite and avoid backend timeout
      await new Promise((r) => setTimeout(r, 250))
    } catch (e: any) {
      results.push({ hashid, ok: false, count: 0, error: e?.message || 'Unknown error' })
    }
  }

  const total = results.reduce((sum, r) => sum + r.count, 0)
  const ok = results.every((r) => r.ok)
  return NextResponse.json({ success: ok, total, results })
}


