'use client'

import { useState } from 'react'
import { EntrepriseSchema, type EntrepriseData } from '@/lib/validations/parametres'

interface EntrepriseFormProps {
  initial: Partial<EntrepriseData>
}

export function EntrepriseForm({ initial }: EntrepriseFormProps) {
  const [nom, setNom] = useState(initial.entreprise_nom ?? '')
  const [adresse, setAdresse] = useState(initial.entreprise_adresse ?? '')
  const [siret, setSiret] = useState(initial.entreprise_siret ?? '')
  const [telephone, setTelephone] = useState(initial.entreprise_telephone ?? '')
  const [email, setEmail] = useState(initial.entreprise_email ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const parsed = EntrepriseSchema.safeParse({
      entreprise_nom: nom,
      entreprise_adresse: adresse || undefined,
      entreprise_siret: siret || undefined,
      entreprise_telephone: telephone || undefined,
      entreprise_email: email || undefined,
    })

    if (!parsed.success) {
      const msgs = Object.values(parsed.error.flatten().fieldErrors).flat()
      setError(msgs[0] ?? 'Données invalides')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Erreur serveur')
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-300 mb-1">Nom de l&apos;entreprise *</label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="ATEXIA"
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Adresse</label>
        <input
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="12 rue des Flamboyants, Saint-Denis"
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">SIRET</label>
        <input
          value={siret}
          onChange={(e) => setSiret(e.target.value)}
          placeholder="14 chiffres"
          maxLength={14}
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Téléphone</label>
        <input
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder="0262 XX XX XX"
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@atexia.re"
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
      {success && <p className="text-emerald-400 text-sm">Enregistré ✓</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
