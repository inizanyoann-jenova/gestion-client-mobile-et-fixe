'use client'

import { useState, useRef } from 'react'

interface ProjetNotesProps {
  initialNotes: string
  projetId: string
}

export function ProjetNotes({ initialNotes, projetId }: ProjetNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleChange = (value: string) => {
    setNotes(value)
    setSaveState('idle')
    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSaveState('saving')
      try {
        const res = await fetch(`/api/projets/${projetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: value }),
        })
        if (res.ok) {
          setSaveState('saved')
          setTimeout(() => setSaveState('idle'), 2000)
        } else {
          setSaveState('error')
        }
      } catch {
        setSaveState('error')
      }
    }, 1000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Notes</h2>
        <span className="text-xs">
          {saveState === 'saving' && <span className="text-slate-400">Enregistrement…</span>}
          {saveState === 'saved' && <span className="text-emerald-400">Enregistré ✓</span>}
          {saveState === 'error' && <span className="text-red-400">Erreur</span>}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        placeholder="Notes sur ce projet…"
        className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>
  )
}
