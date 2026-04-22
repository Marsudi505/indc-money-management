'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah, formatDate } from '@/lib/utils'
import { deleteTransaction } from '@/lib/actions'
import type { Transaction } from '@/types'

interface TransactionTableProps {
  transactions: Transaction[]
  eventId: string
  canDelete: boolean
}

export default function TransactionTable({ transactions, eventId, canDelete }: TransactionTableProps) {
  const router = useRouter()
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    setDeleting(id)
    await deleteTransaction(id, eventId)
    router.refresh()
    setDeleting(null)
  }

  if (transactions.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: 'var(--text-2)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>💳</div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Belum ada transaksi</div>
        <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-3)' }}>
          Tambahkan transaksi pertama untuk event ini
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Tanggal', 'Tipe', 'Nominal', 'Keterangan', 'Bukti', ...(canDelete ? [''] : [])].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 12px',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr
                key={tx.id}
                style={{ transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Date */}
                <td style={{
                  padding: '12px', color: 'var(--text-2)', fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  whiteSpace: 'nowrap',
                }}>
                  {formatDate(tx.transaction_date)}
                </td>

                {/* Type */}
                <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span className={tx.type === 'income' ? 'badge-income' : 'badge-expense'}>
                    {tx.type === 'income' ? '↑ Income' : '↓ Expense'}
                  </span>
                </td>

                {/* Amount */}
                <td style={{
                  padding: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                    color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </span>
                </td>

                {/* Description */}
                <td style={{
                  padding: '12px', color: 'var(--text)', maxWidth: 240,
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <div style={{
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {tx.description}
                  </div>
                </td>

                {/* Proof */}
                <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {tx.proof_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tx.proof_url}
                      alt="bukti"
                      style={{
                        width: 40, height: 40, objectFit: 'cover',
                        borderRadius: 6, cursor: 'pointer',
                        border: '1px solid var(--border)',
                        transition: 'transform 0.2s, border-color 0.2s',
                      }}
                      onClick={() => setLightboxUrl(tx.proof_url!)}
                      onMouseEnter={e => {
                        (e.target as HTMLElement).style.transform = 'scale(1.08)'
                        ;(e.target as HTMLElement).style.borderColor = 'var(--accent)'
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLElement).style.transform = 'scale(1)'
                        ;(e.target as HTMLElement).style.borderColor = 'var(--border)'
                      }}
                    />
                  ) : (
                    <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                  )}
                </td>

                {/* Delete (if allowed) */}
                {canDelete && (
                  <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(tx.id)}
                      disabled={deleting === tx.id}
                      style={{ opacity: deleting === tx.id ? 0.5 : 1 }}
                    >
                      {deleting === tx.id ? '...' : 'Hapus'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40,
              background: 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '50%',
              color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Bukti transaksi"
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain', borderRadius: 8,
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
