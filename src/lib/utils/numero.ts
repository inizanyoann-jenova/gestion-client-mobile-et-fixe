export function nextNumero(prefix: string, lastNumero: string | null | undefined): string {
  if (!lastNumero) return `${prefix}001`
  const parts = lastNumero.split('-')
  const lastN = parseInt(parts[parts.length - 1] ?? '0', 10)
  return `${prefix}${String(lastN + 1).padStart(3, '0')}`
}

export function devisPrefix(year: number): string {
  return `DEV-${year}-`
}

export function facturePrefix(year: number): string {
  return `FACT-${year}-`
}
