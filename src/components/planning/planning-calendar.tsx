'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CalendarEvent } from '@/lib/planning/types'

const JOURS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

const COLOR_DOT: Record<CalendarEvent['color'], string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

function getMonthCells(year: number, month: number): Array<{ date: string | null; day: number | null }> {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // Lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ date: string | null; day: number | null }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ date: null, day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date: dateStr, day: d })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null })
  return cells
}

function todayStr(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

interface Props {
  initialMonth: string  // YYYY-MM-DD (1er du mois)
  events: CalendarEvent[]
}

export function PlanningCalendar({ initialMonth, events }: Props) {
  const router = useRouter()
  const parsed = new Date(initialMonth)
  const [year, setYear] = useState(parsed.getFullYear())
  const [month, setMonth] = useState(parsed.getMonth())

  const today = todayStr()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const cells = getMonthCells(year, month)

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const existing = acc[ev.date]
    if (!existing) acc[ev.date] = [ev]
    else existing.push(ev)
    return acc
  }, {})

  const goNext = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const goPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const goToday = () => { setYear(parsed.getFullYear()); setMonth(parsed.getMonth()) }

  return (
    <div className="bg-slate-900 rounded-2xl p-3 md:p-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button aria-label="Mois précédent" onClick={goPrev} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-lg">
          ‹
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold capitalize text-sm md:text-base">{monthLabel}</span>
          <button onClick={goToday} className="text-xs text-sky-400 hover:text-sky-300 transition-colors px-2 py-0.5 rounded border border-sky-800 hover:border-sky-600">
            Aujourd&apos;hui
          </button>
        </div>
        <button aria-label="Mois suivant" onClick={goNext} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-lg">
          ›
        </button>
      </div>

      {/* En-têtes */}
      <div className="grid grid-cols-7 mb-1">
        {JOURS.map(j => (
          <div key={j} className="text-center text-slate-500 text-xs font-medium py-1">{j}</div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((cell, idx) => {
          const dayEvents = cell.date ? (eventsByDate[cell.date] ?? []) : []
          const isToday = cell.date === today
          return (
            <div key={idx} className={`min-h-[56px] md:min-h-[72px] p-1 rounded ${cell.day ? 'bg-slate-800' : 'bg-transparent'}`}>
              {cell.day !== null && (
                <>
                  <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-0.5 ${
                    isToday ? 'bg-sky-500 text-white' : 'text-slate-400'
                  }`}>
                    {cell.day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => router.push(ev.href)}
                        className="w-full flex items-center gap-1 rounded hover:bg-slate-700 px-0.5 transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${COLOR_DOT[ev.color]}`} />
                        <span className="text-[10px] text-slate-300 truncate hidden md:block">{ev.label}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-slate-500 pl-0.5">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-800">
        {([['sky', 'Tâche'], ['emerald', 'Visite'], ['amber', 'Devis'], ['red', 'Facture']] as const).map(([c, l]) => (
          <div key={c} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${COLOR_DOT[c]}`} />
            <span className="text-xs text-slate-500">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
