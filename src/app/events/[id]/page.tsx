import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRupiah, formatDate } from '@/lib/utils'
import Header from '@/components/layout/Header'
import EventDetailClient from './EventDetailClient'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch event (RLS handles authorization)
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

  // Fetch global balance
  const { data: globalBalance } = await supabase
    .from('global_balance')
    .select('*')
    .eq('id', 1)
    .single()

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('event_id', id)
    .order('transaction_date', { ascending: false })

  const txList = transactions || []
  const totalIncome = txList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netProfit = totalIncome - totalExpense

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header profile={profile} globalBalance={globalBalance || { id: 1, total_balance: 0, updated_at: '' }} />

      <main style={{ flex: 1, padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 20, fontSize: 13,
        }}>
          <Link href="/dashboard" style={{ color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--accent)'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--text-2)'}
          >
            Dashboard
          </Link>
          <span style={{ color: 'var(--text-3)' }}>›</span>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{event.title}</span>
        </div>

        {/* Event Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 14,
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              {event.title}
            </h1>
            {event.description && (
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>{event.description}</p>
            )}
            <div style={{
              fontSize: 12, color: 'var(--text-3)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {formatDate(event.event_date)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className={`badge ${event.is_locked ? 'badge-locked' : 'badge-active'}`}
              style={{ fontSize: 12, padding: '5px 12px' }}>
              {event.is_locked ? '🔒 Locked' : '● Active'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 28,
        }}>
          <div className="stat-card">
            <div className="stat-label">Pemasukan</div>
            <div className="stat-value" style={{ color: 'var(--green)', fontSize: '1rem' }}>
              {formatRupiah(totalIncome)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pengeluaran</div>
            <div className="stat-value" style={{ color: 'var(--red)', fontSize: '1rem' }}>
              {formatRupiah(totalExpense)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Net Profit</div>
            <div className="stat-value" style={{
              color: netProfit >= 0 ? 'var(--green)' : 'var(--red)',
              fontSize: '1rem',
            }}>
              {netProfit < 0 ? '- ' : ''}{formatRupiah(netProfit)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Transaksi</div>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>
              {txList.length}
            </div>
          </div>
        </div>

        {/* Client Part */}
        <EventDetailClient
          event={event}
          transactions={txList}
          isAdmin={profile.role === 'admin'}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
