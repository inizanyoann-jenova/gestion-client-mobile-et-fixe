interface RelanceFactureProps {
  numeroFacture: string
  montantTtc: number
  dateEcheance: string
  clientNom: string
  joursRetard: number
}

export function relanceFactureEmailHtml({
  numeroFacture,
  montantTtc,
  dateEcheance,
  clientNom,
  joursRetard,
}: RelanceFactureProps): string {
  const isFerme = joursRetard >= 30
  const sujet = isFerme ? 'Relance ferme — Facture impayée' : 'Relance — Facture en attente de règlement'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://atexia-crm.vercel.app'
  const color = isFerme ? '#ef4444' : '#f59e0b'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#1e293b;border-radius:16px;padding:28px;color:#e2e8f0;">
    <div style="margin-bottom:20px;">
      <span style="background:${color};color:white;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;">ATEXIA CRM — ${sujet}</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#f1f5f9;">Facture ${escapeHtml(numeroFacture)}</h1>
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#f1f5f9;">${escapeHtml(clientNom)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">💰 Montant TTC : <strong style="color:#f1f5f9;">${montantTtc.toFixed(2)} €</strong></p>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">📅 Échéance : ${escapeHtml(dateEcheance)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:${color};">⚠️ Retard : ${joursRetard} jours</p>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #334155;">
      <a href="${escapeHtml(appUrl)}/finances" style="display:inline-block;background:#0ea5e9;color:white;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Voir les finances →</a>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
