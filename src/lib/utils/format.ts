export const money = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Gramas → "350 g" ou "1,25 kg"
export const weight = (grams: number) =>
  grams >= 1000 ? `${(grams / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg` : `${grams} g`

// Subtotal de carne vendida por peso: gramas × preço por kg
export const meatSubtotal = (grams: number, pricePerKg: number) => Math.round((grams * pricePerKg) / 1000)

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerente',
  GARCOM: 'Garçom',
  COZINHA: 'Cozinha',
}

export const CATEGORY_LABEL: Record<string, string> = {
  CARNE: '🥩 Carnes',
  ACOMPANHAMENTO: '🍟 Acompanhamentos',
  CALDO: '🍲 Caldos',
  BEBIDA: '🍺 Bebidas',
}

export const CATEGORY_ORDER = ['CARNE', 'ACOMPANHAMENTO', 'CALDO', 'BEBIDA']

export const PAYMENT_LABEL: Record<string, { label: string; icon: string }> = {
  DINHEIRO: { label: 'Dinheiro', icon: '💵' },
  PIX: { label: 'Pix', icon: '⚡' },
  DEBITO: { label: 'Débito', icon: '💳' },
  CREDITO: { label: 'Crédito', icon: '💳' },
}

// "R$ 12,50" / "12,5" / "12.50" → centavos (NaN se inválido)
export const toCents = (value: string) => {
  const v = value.trim().replace(/[R$\s]/g, '')
  const normalized = v.includes(',') ? v.replace(/\./g, '').replace(',', '.') : v
  return Math.round(parseFloat(normalized) * 100)
}

// Centavos → "12,50" (para preencher inputs)
export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

// Data de hoje (fuso do navegador) no formato AAAA-MM-DD, para inputs type="date"
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const daysAgoISO = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
