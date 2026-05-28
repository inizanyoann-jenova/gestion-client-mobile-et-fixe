interface RappelEmailProps {
  titreTache: string
  dateEcheance: string
  clientNom: string | null
  projetTitre: string | null
  isToday: boolean
}

export function rappelEmailHtml({
  titreTache,
  dateEcheance,
  clientNom,
  projetTitre,
  isToday,
}: RappelEmailProps): string {
  const sujet = isToday ? "Tâche à faire aujourd'hui" : 'Rappel tâche demain'
  const contexte = [clientNom, projetTitre].filter(Boolean).join(' — ')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://atexia-crm.vercel.app'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#1e293b;border-radius:16px;padding:28px;color:#e2e8f0;">
    <div style="margin-bottom:20px;">
      <span style="background:#0ea5e9;color:white;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;">ATEXIA CRM</span>
    </div>
    <h1 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#f1f5f9;">${sujet}</h1>
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#f1f5f9;">${escapeHtml(titreTache)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">📅 Échéance : ${escapeHtml(dateEcheance)}</p>
    ${contexte ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b;">${escapeHtml(contexte)}</p>` : ''}
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #334155;">
      <a href="${appUrl}/taches" style="display:inline-block;background:#0ea5e9;color:white;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Ouvrir les tâches →</a>
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
