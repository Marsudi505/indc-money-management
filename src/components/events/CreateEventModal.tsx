'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/lib/actions'
import { todayISO } from '@/lib/utils'

interface CreateEventModalProps {
  onClose: () => void
}

export default function CreateEventModal({ onClose }: CreateEventModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Judul event tidak boleh kosong'); return }
    if (!eventDate) { setError('Pilih tanggal event'); return }

    setLoading(true)
    setError('')
    const { error: err } = await createEvent({ title, description, event_date: eventDate })
    setLoading(false)

    if (err) { setError(err); return }
    router.refresh()
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-slide-in" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Buat Event Baru</h3>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, background: 'var(--card)',
            border: '1px solid var(--border)', color: 'var(--text-2)',
            cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Judul Event *</label>
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Bazar Ramadan 2025"
              required
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Deskripsi (Opsional)</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Keterangan tambahan tentang event..."
              rows={3}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Tanggal Event *</label>
            <input
              className="form-input"
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error" style={{ marginBottom: 14 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Membuat...' : 'Buat Event'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
