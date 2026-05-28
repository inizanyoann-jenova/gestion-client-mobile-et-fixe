'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteProjetButtonProps {
  projetId: string
}

export function DeleteProjetButton({ projetId }: DeleteProjetButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Supprimer ce projet ? Cette action est irréversible.')) return

    setIsPending(true)
    try {
      const res = await fetch(`/api/projets/${projetId}`, { method: 'DELETE' })
      if (res.ok) router.push('/projets')
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
      {isPending ? 'Suppression…' : 'Supprimer le projet'}
    </button>
  )
}
