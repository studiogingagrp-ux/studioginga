import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMembers, getEventsByDate } from '@/lib/supabase/queries'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const events = await getEventsByDate(date)
    return NextResponse.json({ events })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
