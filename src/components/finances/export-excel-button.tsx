'use client'
import { useState } from 'react'

export function ExportExcelButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const annee = new Date().getFullYear()
    const res = await fetch(`/api/finances/export?annee=${annee}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `atexia-factures-${annee}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : '↓ Excel'}
    </button>
  )
}
