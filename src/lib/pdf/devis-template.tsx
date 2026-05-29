import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { DevisData } from './pdf-data'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0284c7' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 4 },
  ref: { fontSize: 9, color: '#94a3b8', textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0284c7', borderBottom: '1pt solid #e2e8f0', paddingBottom: 4, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, color: '#64748b' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0284c7', padding: 6, borderRadius: 2, marginBottom: 4 },
  tableHeaderText: { color: '#ffffff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottom: '0.5pt solid #e2e8f0' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPU: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsBox: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: 180, justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { color: '#64748b' },
  totalTTCText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#0284c7' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 8 },
})

function eur(n: number): string {
  return `${n.toFixed(2)} €`
}

interface Props { data: DevisData }

export function DevisTemplate({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.entreprise.nom}</Text>
            <Text style={styles.subtitle}>Devis</Text>
          </View>
          <View>
            <Text style={styles.ref}>Réf. {data.reference}</Text>
            <Text style={styles.ref}>Date : {data.date}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.row}><Text style={styles.label}>Nom</Text><Text>{data.client.nom}</Text></View>
          {data.client.adresse != null && data.client.adresse !== '' && (
            <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text>{data.client.adresse}</Text></View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objet : {data.projet.titre}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Désignation</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colPU]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>
          {data.lignes.map((ligne, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{ligne.description}</Text>
              <Text style={styles.colQty}>{ligne.quantite}</Text>
              <Text style={styles.colPU}>{eur(ligne.prixUnitaire)}</Text>
              <Text style={styles.colTotal}>{eur(ligne.total)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total HT</Text><Text>{eur(data.totalHT)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>TVA 8,5% (DOM)</Text><Text>{eur(data.tva)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalTTCText}>Total TTC</Text><Text style={styles.totalTTCText}>{eur(data.totalTTC)}</Text></View>
        </View>
        <Text style={styles.footer}>
          {data.entreprise.nom}{data.entreprise.adresse ? ` — ${data.entreprise.adresse}` : ''}{data.entreprise.telephone ? ` — ${data.entreprise.telephone}` : ''}{data.entreprise.email ? ` — ${data.entreprise.email}` : ''}
        </Text>
      </Page>
    </Document>
  )
}
