'use client'

import { useState } from 'react'
import EventCard from '@/components/events/EventCard'
import CreateEventModal from '@/components/events/CreateEventModal'
import { formatRupiah, formatDateTime } from '@/lib/utils'
import type { EventSummary, BalanceAudit } from '@/types'

interface DashboardClientProps {
  events: EventSummary[]
  audits: BalanceAudit[]
  isAdmin: boolean
}

export default function DashboardClient({ events, audits, isAdmin }: DashboardClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'locked'>('all')

  const filtered = events.filter(e => {
    if (filter === 'active') return !e.is_locked
    if (filter === 'locked') return e.is_locked
    return true
  })

  return (
    <>
      {/* Events Section */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Daftar Event</h2>
            <span style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-2)', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px',
            }}>{events.length}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Filter buttons */}
            <div style={{
              display: 'flex', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
            }}>
              {([['all', 'Semua'], ['active', 'Aktif'], ['locked', 'Terkunci']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  style={{
                    padding: '6px 12px', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontFamily: 'Sora, sans-serif', fontWeight: 500,
                    background: filter === val ? 'var(--accent)' : 'transparent',
                    color: filter === val ? '#fff' : 'var(--text-2)',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              + Buat Event
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--card)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>
              {filter === 'all' ? 'Belum ada event' : `Tidak ada event ${filter === 'active' ? 'aktif' : 'terkunci'}`}
            </div>
            {filter === 'all' && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                Buat event pertama
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Audit Log — Admin Only */}
      {isAdmin && audits.length > 0 && (
        <div>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Riwayat Audit Saldo
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {audits.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: 14, background: 'var(--card)',
                borderRadius: 10, border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--gold)', marginTop: 5, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>
                    <span style={{ color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {formatRupiah(a.old_balance)}
                    </span>
                    <span style={{ color: 'var(--text-3)', margin: '0 8px' }}>→</span>
                    <span style={{ color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                      {formatRupiah(a.new_balance)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                    {a.reason}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-3)',
                    fontFamily: 'JetBrains Mono, monospace', marginTop: 2,
                  }}>
                    {(a.profiles as any)?.full_name || a.updated_by} • {formatDateTime(a.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
