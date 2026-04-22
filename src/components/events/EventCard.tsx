import Link from 'next/link'
import { formatRupiah, formatDate } from '@/lib/utils'
import type { EventSummary } from '@/types'

interface EventCardProps {
  event: EventSummary
}

export default function EventCard({ event }: EventCardProps) {
  const isLoss = event.net_profit < 0

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          padding: 18,
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden',
          display: 'block',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'rgba(233,69,96,0.4)'
          el.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'var(--border)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: event.is_locked ? 'var(--text-3)' : 'var(--accent)',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', marginBottom: 12, paddingTop: 4,
        }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
            <h3 style={{
              fontSize: 15, fontWeight: 600, color: 'var(--text)',
              lineHeight: 1.3, marginBottom: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {event.title}
            </h3>
            <div style={{
              fontSize: 11, color: 'var(--text-2)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {formatDate(event.event_date)}
            </div>
          </div>

          <div className={`badge ${event.is_locked ? 'badge-locked' : 'badge-active'}`}>
            {event.is_locked ? '🔒' : '●'} {event.is_locked ? 'Locked' : 'Active'}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 8, marginBottom: 12,
        }}>
          <div style={{
            background: 'rgba(0,201,167,0.06)', borderRadius: 6,
            padding: '6px 10px', border: '1px solid rgba(0,201,167,0.12)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 2 }}>Pemasukan</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatRupiah(event.total_income)}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,107,107,0.06)', borderRadius: 6,
            padding: '6px 10px', border: '1px solid rgba(255,107,107,0.12)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 2 }}>Pengeluaran</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatRupiah(event.total_expense)}
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          paddingTop: 12, borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>
            Net Profit
          </span>
          <span style={{
            fontSize: 20, fontWeight: 700,
            color: isLoss ? 'var(--red)' : 'var(--green)',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {isLoss ? '- ' : '+ '}
            {formatRupiah(event.net_profit)}
          </span>
        </div>

        {/* Transaction count */}
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>
          {event.transaction_count} transaksi
        </div>
      </div>
    </Link>
  )
}
