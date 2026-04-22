'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/lib/actions'
import { todayISO, validateFileSize } from '@/lib/utils'
import type { TransactionType } from '@/types'

interface AddTransactionFormProps {
  eventId: string
  onCancel: () => void
}

export default function AddTransactionForm({ eventId, onCancel }: AddTransactionFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<TransactionType>('income')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [txDate, setTxDate] = useState(todayISO())
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setFileError('')
    if (!file) return

    if (!validateFileSize(file)) {
      setFileError('Ukuran file melebihi 2MB. Pilih file yang lebih kecil.')
      setProofFile(null)
      setPreviewUrl(null)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setProofFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  function clearFile() {
    setProofFile(null)
    setPreviewUrl(null)
    setFileError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // Format amount as thousand separator
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    setAmount(raw)
  }

  function formatAmountDisplay(val: string): string {
    if (!val) return ''
    return parseInt(val, 10).toLocaleString('id-ID')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseInt(amount, 10)
    if (!amountNum || amountNum <= 0) { setError('Masukkan nominal yang valid'); return }
    if (!description.trim()) { setError('Keterangan tidak boleh kosong'); return }
    if (!txDate) { setError('Pilih tanggal transaksi'); return }

    setLoading(true)
    setError('')

    const { error: err } = await createTransaction(eventId, {
      type,
      amount,
      description,
      transaction_date: txDate,
      proof_file: proofFile,
    })

    setLoading(false)
    if (err) { setError(err); return }

    router.refresh()
    onCancel()
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <form onSubmit={handleSubmit}>
        {/* Type selector */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Tipe Transaksi</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['income', 'expense'] as TransactionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: `1px solid ${type === t
                    ? t === 'income' ? 'rgba(0,201,167,0.4)' : 'rgba(255,107,107,0.4)'
                    : 'var(--border)'}`,
                  background: type === t
                    ? t === 'income' ? 'rgba(0,201,167,0.1)' : 'rgba(255,107,107,0.1)'
                    : 'var(--card)',
                  color: type === t
                    ? t === 'income' ? 'var(--green)' : 'var(--red)'
                    : 'var(--text-2)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                {t === 'income' ? '↑ Income (Pemasukan)' : '↓ Expense (Pengeluaran)'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount + Date row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="form-label">Nominal (Rp)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-2)', fontSize: 13,
              }}>Rp</span>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                value={formatAmountDisplay(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                style={{ paddingLeft: 32 }}
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Tanggal</label>
            <input
              className="form-input"
              type="date"
              value={txDate}
              onChange={e => setTxDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Keterangan</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Deskripsi transaksi..."
            rows={2}
            required
          />
        </div>

        {/* Upload */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Bukti Transaksi (Opsional, maks. 2MB)</label>

          {!previewUrl ? (
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(233,69,96,0.04)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Klik untuk pilih gambar
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                JPEG, PNG, WebP — maksimal 2MB
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 12, background: 'var(--card)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="preview"
                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {proofFile?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {proofFile ? (proofFile.size / 1024).toFixed(1) : 0} KB
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFile}>
                Hapus
              </button>
            </div>
          )}

          {fileError && <p className="form-error">{fileError}</p>}
        </div>

        {error && <p className="form-error" style={{ marginBottom: 14 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
