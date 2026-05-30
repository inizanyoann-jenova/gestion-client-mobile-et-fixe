export default async function ConfirmePage({ params }: { params: Promise<{ token: string }> }) {
  await params // consume params to avoid Next.js warning
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-6">✅</div>
      <h1 className="text-2xl font-bold text-white mb-3">Devis accepté</h1>
      <p className="text-slate-400 mb-8">
        Votre acceptation a bien été enregistrée.<br />
        Nous vous recontacterons prochainement.
      </p>
      <p className="text-slate-600 text-sm">Vous pouvez fermer cette page.</p>
    </div>
  )
}
