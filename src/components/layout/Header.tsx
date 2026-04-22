'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { updateGlobalBalance } from '@/lib/actions'
import type { Profile, GlobalBalance } from '@/types'

interface HeaderProps {
  profile: Profile
  globalBalance: GlobalBalance
}

export default function Header({ profile, globalBalance }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showBalModal, setShowBalModal] = useState(false)
  const [newBalance, setNewBalance] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [balError, setBalError] = useState('')
  const isAdmin = profile.role === 'admin'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSaveBalance() {
    if (!reason.trim()) { setBalError('Alasan wajib diisi'); return }
    const val = parseInt(newBalance.replace(/\D/g, ''), 10)
    if (isNaN(val) || val < 0) { setBalError('Masukkan saldo yang valid'); return }

    setSaving(true)
    setBalError('')
    const { error } = await updateGlobalBalance({ new_balance: String(val), reason })
    setSaving(false)

    if (error) { setBalError(error); return }
    setShowBalModal(false)
    setNewBalance('')
    setReason('')
    router.refresh()
  }

  function openBalModal() {
    if (!isAdmin) return
    setNewBalance(String(globalBalance.total_balance))
    setReason('')
    setBalError('')
    setShowBalModal(true)
  }

  return (
    <>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)',
            borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, fontWeight: 700,
            color: '#fff', letterSpacing: '-0.5px', flexShrink: 0,
          }}>IMM</div>
          <span style={{
            fontWeight: 700, fontSize: 14, letterSpacing: '0.3px',
            color: 'var(--text)', whiteSpace: 'nowrap',
          }}>
            INDC <span style={{ color: 'var(--accent)' }}>MONEY</span> MANAGEMENT
          </span>
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Global Balance Widget */}
          <button
            onClick={openBalModal}
            title={isAdmin ? 'Klik untuk edit saldo' : 'Saldo Global'}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: isAdmin ? 'pointer' : 'default',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { if (isAdmin) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.2 }}>
                Saldo Global
              </div>
              <div style={{
                fontSize: 16, fontWeight: 700,
                color: globalBalance.total_balance >= 0 ? 'var(--gold)' : 'var(--red)',
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: 1.3,
              }}>
                {globalBalance.total_balance < 0 ? '- ' : ''}
                {formatRupiah(globalBalance.total_balance)}
              </div>
            </div>
            {isAdmin && (
              <span style={{ color: 'var(--text-3)', fontSize: 14 }}>✎</span>
            )}
          </button>

          {/* User Badge */}
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 28, height: 28,
              background: isAdmin ? 'rgba(233,69,96,0.15)' : 'rgba(79,195,247,0.12)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: isAdmin ? 'var(--accent)' : 'var(--blue)',
            }}>
              {(profile.full_name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                {profile.full_name || 'User'}
              </div>
              <div style={{
                fontSize: 10, color: isAdmin ? 'var(--accent)' : 'var(--text-2)',
                textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2,
              }}>
                {profile.role}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
            Keluar
          </button>
        </div>
      </header>

      {/* Balance Modal */}
      {showBalModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 200, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowBalModal(false) }}
        >
          <div className="animate-slide-in" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 460,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', borderBottom: '1px solid var(--border)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Edit Saldo Global</h3>
              <button onClick={() => setShowBalModal(false)} style={{
                width: 30, height: 30, borderRadius: 8, background: 'var(--card)',
                border: '1px solid var(--border)', color: 'var(--text-2)',
                cursor: 'pointer', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Current */}
              <div style={{
                background: 'var(--card)', borderRadius: 10, padding: '12px 16px',
                border: '1px solid var(--border)', marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>
                  Saldo Saat Ini
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatRupiah(globalBalance.total_balance)}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Saldo Baru (Rp)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={newBalance}
                  onChange={e => setNewBalance(e.target.value)}
                  placeholder="Masukkan saldo baru..."
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Alasan Perubahan</label>
                <textarea
                  className="form-textarea"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Contoh: Penyesuaian saldo manual Q2 2025..."
                  rows={3}
                />
              </div>

              {balError && <p className="form-error" style={{ marginBottom: 14 }}>{balError}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleSaveBalance}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowBalModal(false)}>
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
