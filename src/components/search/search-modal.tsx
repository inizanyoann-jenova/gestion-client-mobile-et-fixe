'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchResult } from '@/lib/search/types'

const EMPTY: SearchResult = { clients: [], projets: [], contacts: [], devis: [] }

const STATUT_LABELS: Record<string, string> = {
  brouillon: 'Brouillon', envoyé: 'Envoyé', accepté: 'Accepté',
  refusé: 'Refusé', expiré: 'Expiré', en_cours: 'En cours',
  termine: 'Terminé', planifie: 'Planifié',
}

export function SearchModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>(EMPTY)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults(EMPTY)
  }, [])

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  // Focus auto
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults(EMPTY); setLoading(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const navigate = (href: string) => {
    router.push(href)
    close()
  }

  const hasResults =
    results.clients.length + results.projets.length +
    results.contacts.length + results.devis.length > 0

  return (
    <>
      {/* Trigger button */}
      <button
        aria-label="Ouvrir la recherche"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4"
          onClick={close}
        >
          <div
            className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                placeholder="Rechercher un client, projet, contact, devis…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
                className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
              />
              {loading && <span className="text-slate-500 text-xs">…</span>}
              <kbd className="hidden md:inline-block text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Échap</kbd>
            </div>

            {/* Résultats */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.length >= 2 && !loading && !hasResults && (
                <p className="text-slate-500 text-sm text-center py-8">Aucun résultat pour «{query}»</p>
              )}

              {results.clients.length > 0 && (
                <Section label="Clients">
                  {results.clients.map((c) => (
                    <ResultRow key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
                      <span className="text-white text-sm">{c.nom}</span>
                      {c.adresse && <span className="text-slate-400 text-xs">{c.adresse}</span>}
                    </ResultRow>
                  ))}
                </Section>
              )}

              {results.projets.length > 0 && (
                <Section label="Projets">
                  {results.projets.map((p) => (
                    <ResultRow key={p.id} onClick={() => navigate(`/projets/${p.id}`)}>
                      <span className="text-white text-sm">{p.titre}</span>
                      <span className="text-slate-400 text-xs">{STATUT_LABELS[p.statut] ?? p.statut}</span>
                    </ResultRow>
                  ))}
                </Section>
              )}

              {results.contacts.length > 0 && (
                <Section label="Contacts">
                  {results.contacts.map((c) => (
                    <ResultRow key={c.id} onClick={() => navigate(`/clients/${c.client_id}`)}>
                      <span className="text-white text-sm">{c.prenom} {c.nom}</span>
                      {c.email && <span className="text-slate-400 text-xs">{c.email}</span>}
                    </ResultRow>
                  ))}
                </Section>
              )}

              {results.devis.length > 0 && (
                <Section label="Devis">
                  {results.devis.map((d) => (
                    <ResultRow key={d.id} onClick={() => navigate(`/finances/devis/${d.id}`)}>
                      <span className="text-white text-sm font-mono">{d.numero}</span>
                      <span className="text-slate-400 text-xs">{STATUT_LABELS[d.statut] ?? d.statut}</span>
                    </ResultRow>
                  ))}
                </Section>
              )}

              {query.length === 0 && (
                <p className="text-slate-600 text-xs text-center py-6">Tapez au moins 2 caractères pour chercher</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      {children}
    </div>
  )
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left"
    >
      {children}
    </button>
  )
}
