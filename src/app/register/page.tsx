'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Mendaftarkan user ke Supabase Auth
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--primary)', padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)',
            borderRadius: 14, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
            fontSize: 18, fontWeight: 700, color: '#fff',
          }}>IMM</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Daftar Akun Baru
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Mulai kelola keuangan event kamu
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
              <h3 style={{ color: 'var(--text)', marginBottom: '8px' }}>Pendaftaran Berhasil!</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                Mengalihkan ke halaman login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Nama Lengkap</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)', borderRadius: 8,
                  padding: '10px 14px', color: 'var(--red)', fontSize: 13, marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                disabled={loading}
              >
                {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/login" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
            Sudah punya akun? Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  )
}
