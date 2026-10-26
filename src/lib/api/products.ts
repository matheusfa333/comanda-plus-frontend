import { fetchWithAuth } from './config'

export type ProductCategory = 'CARNE' | 'ACOMPANHAMENTO' | 'CALDO' | 'BEBIDA'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number // centavos por unidade (não carne)
  pricePerKg: number | null // centavos por kg (carne)
  minGrams: number | null // pedido mínimo em gramas (carne)
  category: ProductCategory
  isMeat: boolean
  available: boolean
  stock: number // gramas (carne) ou unidades
  minStock: number
  lowStock: boolean
}

export async function listProducts(): Promise<Product[]> {
  return fetchWithAuth('/products', { method: 'GET' })
}

export async function createProduct(data: {
  name: string
  description?: string
  category: ProductCategory
  price?: number
  pricePerKg?: number
  minGrams?: number
  stock?: number
}): Promise<{ id: string }> {
  return fetchWithAuth('/products', { method: 'POST', body: JSON.stringify(data) })
}

export async function removeProduct(id: string): Promise<{ success: boolean }> {
  return fetchWithAuth(`/products/${id}`, { method: 'DELETE' })
}

export async function adjustStock(id: string, stock: number, reason: string): Promise<{ stock: number }> {
  return fetchWithAuth(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock, reason }) })
}
