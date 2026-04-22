'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleEventLock } from '@/lib/actions'
import TransactionTable from '@/components/transactions/TransactionTable'
import AddTransactionForm from '@/components/transactions/AddTransactionForm'
import type { Event, Transaction } from '@/types'

interface EventDetailClientProps {
  event: Event
  transactions: Transaction[]
  isAdmin: boolean
  currentUserId: string
}

export default function EventDetailClient({
  event,
  transactions,
  isAdmin,
  currentUserId,
}: EventDetailClientProps) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [locking, setLocking] = useState(false)

  const isOwnerOrAdmin = isAdmin || event.user_id === currentUserId
  const canModify = !event.is_locked && isOwnerOrAdmin
  const canDelete = isAdmin || event.user_id === currentUserId

  async function handleToggleLock() {
    setLocking(true)
    await toggleEventLock(event.id, !event.is_locked)
    router.refresh()
    setLocking(false)
  }

  return (
    <div>
      {/* Lock Banner */}
      {event.is_locked && (
        <div style={{
          background: 'rgba(92,107,192,0.08)',
          border: '1px solid rgba(92,107,192,0.2)',
          borderRadius: 8, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 20, color: 'var(--text-3)', fontSize: 13,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <span>Event ini dikunci. Transaksi tidak dapat ditambahkan atau diubah.</span>
          {isAdmin && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={handleToggleLock}
              disabled={locking}
            >
              {locking ? '...' : 'Buka Kunci'}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 10,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          Daftar Transaksi
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {canModify && !showAddForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
              + Tambah Transaksi
            </button>
          )}
          {isAdmin && !event.is_locked && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleToggleLock}
              disabled={locking}
            >
              {locking ? '...' : '🔒 Kunci Event'}
            </button>
          )}
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && !event.is_locked && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 18,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Tambah Transaksi Baru</h3>
            <button
              style={{
                background: 'none', border: 'none', color: 'var(--text-2)',
                cursor: 'pointer', fontSize: 18, lineHeight: 1,
              }}
              onClick={() => setShowAddForm(false)}
            >✕</button>
          </div>
          <AddTransactionForm
            eventId={event.id}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Transactions Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <TransactionTable
          transactions={transactions}
          eventId={event.id}
          canDelete={canDelete && !event.is_locked}
        />
      </div>
    </div>
  )
}
