// ============================================================
// INDC Money Management — Utility Functions
// ============================================================

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format datetime ke format Indonesia
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Tanggal hari ini dalam format YYYY-MM-DD
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Validasi ukuran file (max 2MB)
 */
export function validateFileSize(file: File, maxMB = 2): boolean {
  return file.size <= maxMB * 1024 * 1024
}

/**
 * Generate nama file unik untuk storage
 */
export function generateFileName(userId: string, file: File): string {
  const ext = file.name.split('.').pop()
  const timestamp = Date.now()
  return `${userId}/${timestamp}.${ext}`
}

/**
 * Classnames utility
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
