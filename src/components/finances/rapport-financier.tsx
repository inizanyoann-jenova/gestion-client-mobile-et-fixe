'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { RapportFinancierData } from '@/lib/validations/rapport'

const STATUT_COLORS: Record<string, string> = {
  brouillon: '#64748b',
  envoyé: '#0ea5e9',
  accepté: '#10b981',
  refusé: '#ef4444',
  expiré: '#f59e0b',
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function tauxColor(taux: number): string {
  if (taux >= 70) return 'text-emerald-400'
  if (taux >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function RapportFinancier({ data }: { data: RapportFinancierData }) {
  return (
    <div className="space-y-6 mt-4">
      {/* CA mensuel */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">CA mensuel (12 mois)</h2>
        <div className="bg-slate-800/60 rounded-xl p-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.caMensuel} margin={{ top: 4, right: 4, left: -16, bottom: 4 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={1}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip
                formatter={(v: number) => [eur(v), 'CA']}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Bar dataKey="ca" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Pipeline devis */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Pipeline devis</h2>
        <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-4">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={data.pipelineDevis}
                  dataKey="count"
                  nameKey="statut"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {data.pipelineDevis.map((entry) => (
                    <Cell
                      key={entry.statut}
                      fill={STATUT_COLORS[entry.statut] ?? '#64748b'}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.pipelineDevis.map((item) => (
              <div key={item.statut} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                    style={{ background: STATUT_COLORS[item.statut] ?? '#64748b' }}
                  />
                  <span className="text-slate-400 capitalize">{item.statut}</span>
                </span>
                <span className="text-white font-semibold">{item.count}</span>
              </div>
            ))}
            {data.pipelineDevis.length === 0 && (
              <p className="text-slate-500 text-xs">Aucun devis</p>
            )}
          </div>
        </div>
      </section>

      {/* Top 5 clients */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Top 5 clients (CA facturé)</h2>
        {data.topClients.length === 0 ? (
          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-slate-500 text-xs text-center">Aucune facture payée</p>
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-xl p-3">
            <ResponsiveContainer width="100%" height={data.topClients.length * 40 + 16}>
              <BarChart
                data={data.topClients}
                layout="vertical"
                margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  width={100}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(v: number) => [eur(v), 'CA']}
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Bar dataKey="ca" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Taux d'acceptation */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          Taux d&apos;acceptation des devis
        </h2>
        <div className="bg-slate-800/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Devis acceptés / clôturés</p>
            <p className="text-slate-500 text-xs mt-0.5">
              (acceptés parmi acceptés + refusés + expirés)
            </p>
          </div>
          <span className={`text-3xl font-bold tabular-nums ${tauxColor(data.tauxAcceptation)}`}>
            {data.tauxAcceptation}%
          </span>
        </div>
      </section>
    </div>
  )
}
