import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { RapportData } from './pdf-data'

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
  value: { flex: 1, color: '#1e293b' },
  resumeBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 4, lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: '1pt solid #e2e8f0', paddingTop: 8 },
})

interface Props { data: RapportData }

export function RapportTemplate({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.entreprise.nom}</Text>
            <Text style={styles.subtitle}>Rapport d&apos;intervention</Text>
          </View>
          <View>
            <Text style={styles.ref}>Réf. {data.reference}</Text>
            <Text style={styles.ref}>Date : {data.date}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.row}><Text style={styles.label}>Nom</Text><Text style={styles.value}>{data.client.nom}</Text></View>
          {data.client.adresse != null && data.client.adresse !== '' && (
            <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text style={styles.value}>{data.client.adresse}</Text></View>
          )}
          {data.client.siret != null && data.client.siret !== '' && (
            <View style={styles.row}><Text style={styles.label}>SIRET</Text><Text style={styles.value}>{data.client.siret}</Text></View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chantier</Text>
          <View style={styles.row}><Text style={styles.label}>Projet</Text><Text style={styles.value}>{data.projet.titre}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Type</Text><Text style={styles.value}>{data.projet.type}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Domaine</Text><Text style={styles.value}>{data.projet.secteur.replace(/_/g, ' ')}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte-rendu</Text>
          <View style={styles.resumeBox}><Text>{data.resume}</Text></View>
        </View>
        <Text style={styles.footer}>
          {data.entreprise.nom}{data.entreprise.adresse ? ` — ${data.entreprise.adresse}` : ''}{data.entreprise.telephone ? ` — ${data.entreprise.telephone}` : ''}{data.entreprise.email ? ` — ${data.entreprise.email}` : ''}
        </Text>
      </Page>
    </Document>
  )
}
