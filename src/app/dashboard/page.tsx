import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatRupiah } from '@/lib/utils'
import Header from '@/components/layout/Header'
import DashboardClient from './DashboardClient'
import type { EventSummary, BalanceAudit } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch global balance
  const { data: globalBalance } = await supabase
    .from('global_balance')
    .select('*')
    .eq('id', 1)
    .single()

  // Fetch events dengan aggregasi
  let eventsQuery = supabase
    .from('event_summary')
    .select('*')
    .order('event_date', { ascending: false })

  // Admin melihat semua, team hanya miliknya
  if (profile.role !== 'admin') {
    eventsQuery = eventsQuery.eq('user_id', user.id)
  }

  const { data: events } = await eventsQuery

  // Fetch audit (admin only)
  let audits: BalanceAudit[] = []
  if (profile.role === 'admin') {
    const { data } = await supabase
      .from('balance_audit')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10)
    audits = data || []
  }

  // Statistik global
  const allTx = events as EventSummary[] || []
  const totalIncome = allTx.reduce((s, e) => s + e.total_income, 0)
  const totalExpense = allTx.reduce((s, e) => s + e.total_expense, 0)
  const netAll = totalIncome - totalExpense

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header profile={profile} globalBalance={globalBalance || { id: 1, total_balance: 0, updated_at: '' }} />

      <main style={{ flex: 1, padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Page Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Selamat datang, {profile.full_name || user.email}
          </p>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12, marginBottom: 28,
        }}>
          <div className="stat-card">
            <div className="stat-label">Total Event</div>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>
              {(events || []).length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Pemasukan</div>
            <div className="stat-value" style={{ color: 'var(--green)', fontSize: '1.1rem' }}>
              {formatRupiah(totalIncome)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Pengeluaran</div>
            <div className="stat-value" style={{ color: 'var(--red)', fontSize: '1.1rem' }}>
              {formatRupiah(totalExpense)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Net Profit</div>
            <div className="stat-value" style={{ color: netAll >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '1.1rem' }}>
              {netAll < 0 ? '- ' : ''}{formatRupiah(netAll)}
            </div>
          </div>
        </div>

        {/* Client part (for interactivity) */}
        <DashboardClient
          events={(events || []) as EventSummary[]}
          audits={audits}
          isAdmin={profile.role === 'admin'}
        />
      </main>
    </div>
  )
}
