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
  CAIXA: 'Caixa',
}

export const CATEGORY_LABEL: Record<string, string> = {
  CARNE: '🥩 Carnes',
  ACOMPANHAMENTO: '🍟 Acompanhamentos',
  CALDO: '🍲 Caldos',
  BEBIDA: '🍺 Bebidas',
}

export const CATEGORY_ORDER = ['CARNE', 'ACOMPANHAMENTO', 'CALDO', 'BEBIDA']

export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
