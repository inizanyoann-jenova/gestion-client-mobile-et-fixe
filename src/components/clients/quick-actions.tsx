'use client'

import { useState } from 'react'

interface QuickActionsProps {
  phone: string | null
  email: string | null
  address: string | null
  clientId: string
}

export function QuickActions({ phone, email, address }: QuickActionsProps) {
  const [showPhonePopup, setShowPhonePopup] = useState(false)

  const handleCall = () => {
    if (!phone) return
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = `tel:${phone}`
    } else {
      setShowPhonePopup(true)
    }
  }

  const handleEmail = () => {
    if (!email) return
    window.location.href = `mailto:${email}`
  }

  const handleMaps = () => {
    if (!address) return
    window.open(
      `https://maps.google.com/maps?q=${encodeURIComponent(address)}`,
      '_blank'
    )
  }

  const handleNote = () => {
    const el = document.getElementById('client-notes')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-2">
        <ActionBtn icon="📞" label="Appeler" onClick={handleCall} disabled={!phone} />
        <ActionBtn icon="✉️" label="Email" onClick={handleEmail} disabled={!email} />
        <ActionBtn icon="📝" label="Note" onClick={handleNote} />
        <ActionBtn icon="📍" label="Carte" onClick={handleMaps} disabled={!address} />
      </div>

      {showPhonePopup && phone && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-700 rounded-xl p-4 z-20 shadow-2xl">
          <p className="text-slate-400 text-xs mb-1">Numéro à appeler</p>
          <p className="text-white text-2xl font-mono tracking-wide">{phone}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(phone)
                setShowPhonePopup(false)
              }}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 rounded-lg font-medium"
            >
              Copier
            </button>
            <button
              onClick={() => setShowPhonePopup(false)}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-slate-300 text-sm py-2 rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 bg-slate-700 hover:bg-slate-600 rounded-xl py-3 disabled:opacity-40 active:bg-slate-600 transition-colors min-h-[64px]"
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </button>
  )
}
