'use client'

import Link from 'next/link'

export type ParametresTabId = 'parametres' | 'catalogue' | 'guide'

interface ParametresTabsProps {
  activeTab: ParametresTabId
}

export function ParametresTabs({ activeTab }: ParametresTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Link
        href="/parametres"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'parametres'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Paramètres
      </Link>
      <Link
        href="/parametres?tab=catalogue"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'catalogue'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Catalogue
      </Link>
      <Link
        href="/parametres?tab=guide"
        className={`flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors ${
          activeTab === 'guide'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        Guide
      </Link>
    </div>
  )
}
