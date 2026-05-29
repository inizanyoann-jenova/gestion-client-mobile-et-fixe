import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DevisPdfData } from './finance-pdf-data'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0284c7' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 4 },
  metaRight: { alignItems: 'flex-end' },
  metaText: { fontSize: 9, color: '#64748b', marginBottom: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0284c7', borderBottom: '1pt solid #e2e8f0', paddingBottom: 4, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 120, color: '#64748b' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0284c7', padding: 6, borderRadius: 2, marginBottom: 2 },
  tableHeaderText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottom: '0.5pt solid #e2e8f0' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'right' },
  colPU: { flex: 1, textAlign: 'right' },
  colTVA: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { color: '#64748b' },
  totalTTCText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#0284c7' },
  notes: { marginTop: 16, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 },
  notesText: { fontSize: 9, color: '#64748b' },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 6 },
})

function eur(n: number): string { return `${n.toFixed(2)} €` }

export function DevisFinanceTemplate({ data }: { data: DevisPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.entreprise.nom}</Text>
            <Text style={styles.subtitle}>DEVIS</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.metaText}>N° {data.numero}</Text>
            <Text style={styles.metaText}>Émis le {data.date_emission}</Text>
            <Text style={styles.metaText}>Valable jusqu&apos;au {data.date_validite}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <View style={styles.row}><Text style={styles.label}>Client</Text><Text>{data.client.nom}</Text></View>
          {data.client.adresse ? <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text>{data.client.adresse}</Text></View> : null}
          {data.client.siret ? <View style={styles.row}><Text style={styles.label}>SIRET</Text><Text>{data.client.siret}</Text></View> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Désignation des prestations</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unité</Text>
            <Text style={[styles.tableHeaderText, styles.colPU]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTVA]}>TVA</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>
          {data.lignes.map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{l.libelle}</Text>
              <Text style={styles.colQty}>{l.quantite}</Text>
              <Text style={styles.colUnit}>{l.unite}</Text>
              <Text style={styles.colPU}>{eur(l.prix_unitaire)}</Text>
              <Text style={styles.colTVA}>{l.taux_tva}%</Text>
              <Text style={styles.colTotal}>{eur(l.total_ht)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total HT</Text><Text>{eur(data.montant_ht)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>TVA 8,5% (DOM)</Text><Text>{eur(data.montant_tva)}</Text></View>
          <View style={styles.totalRow}>
            <Text style={styles.totalTTCText}>Total TTC</Text>
            <Text style={styles.totalTTCText}>{eur(data.montant_ttc)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          {data.entreprise.nom}{data.entreprise.adresse ? ` — ${data.entreprise.adresse}` : ''}{data.entreprise.siret ? ` — SIRET ${data.entreprise.siret}` : ''}{data.entreprise.telephone ? ` — ${data.entreprise.telephone}` : ''}
          {'\n'}Devis valable 30 jours. Conditions de paiement selon accord contractuel.
        </Text>
      </Page>
    </Document>
  )
}
