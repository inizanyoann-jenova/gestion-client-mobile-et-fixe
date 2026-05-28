import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ projet?: string }>
}

export default async function NouvelEchangePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const projetId = sp.projet

  return (
    <div className="p-4 pt-8 text-center">
      <p className="text-4xl mb-4">🔧</p>
      <h1 className="text-white text-xl font-bold mb-2">Module en cours de développement</h1>
      <p className="text-slate-400 text-sm mb-6">
        Le module Échanges sera disponible dans le Plan 5.
      </p>
      {projetId ? (
        <Link href={`/projets/${projetId}`} className="text-sky-400 text-sm">
          ← Retour au projet
        </Link>
      ) : (
        <Link href="/" className="text-sky-400 text-sm">
          ← Retour à l&apos;accueil
        </Link>
      )}
    </div>
  )
}
