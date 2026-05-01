import { type NextRequest, NextResponse } from 'next/server'
import { runDailyDigest } from '@/lib/cron'

// Never cache this route — it's a side-effect endpoint.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runDailyDigest()
  return NextResponse.json(result)
}
