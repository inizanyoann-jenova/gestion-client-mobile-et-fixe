'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteClientButtonProps {
  clientId: string
}

export function DeleteClientButton({ clientId }: DeleteClientButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        'Supprimer ce client et tous ses contacts ? Cette action est irréversible.'
      )
    )
      return

    setIsPending(true)
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
      if (res.ok) router.push('/clients')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Suppression…' : 'Supprimer le client'}
    </button>
  )
}
