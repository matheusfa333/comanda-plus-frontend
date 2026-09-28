import { fetchWithAuth } from './config'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  pricePerGram: number | null
  minGrams: number | null
  category: string
  isMeat: boolean
  available: boolean
}

export async function listProducts(): Promise<Product[]> {
  return fetchWithAuth('/products', { method: 'GET' })
}
