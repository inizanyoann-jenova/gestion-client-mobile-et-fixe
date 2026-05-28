'use client'

import { useState } from 'react'

const STEPS = [0, 25, 50, 75, 100]

interface ProjetAvancementProps {
  projetId: string
  avancement: number
}

export function ProjetAvancement({ projetId, avancement: initialAvancement }: ProjetAvancementProps) {
  const [current, setCurrent] = useState(initialAvancement)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStep = async (step: number) => {
    if (step === current || isUpdating) return

    const previous = current
    setCurrent(step)
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/projets/${projetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avancement: step }),
      })
      if (!res.ok) setCurrent(previous)
    } catch {
      setCurrent(previous)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-white font-semibold text-sm">Avancement</h2>
      <div className="flex gap-2">
        {STEPS.map((step) => (
          <button
            key={step}
            onClick={() => handleStep(step)}
            disabled={isUpdating}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              current === step
                ? 'bg-sky-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {step}%
          </button>
        ))}
      </div>
    </div>
  )
}
