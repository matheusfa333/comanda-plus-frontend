'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { MOCK_PRODUCTS } from '@/lib/mockData'

interface CartItem {
  productId: string
  name: string
  quantity: number // gramas para carnes, unidades para outros
  unitPrice: number
  subtotal: number
  type: 'meat' | 'side' | 'drink'
}

interface AddItemsModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItems: (items: CartItem[], total: number) => void
}

export default function AddItemsModal({ isOpen, onClose, onAddItems }: AddItemsModalProps) {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.category.localeCompare(b.category))
  }, [search])

  const handleAddToCart = (product: any) => {
    if (product.type === 'meat') {
      // Abrir modal de quantidade para carnes
      const grams = prompt(
        `Digite a quantidade em gramas (mínimo ${product.minGrams}g):\n\nBananinha = R$ 0,05/g\nMaca = R$ 0,04/g\nPicanha = R$ 0,06/g\nFraldinha = R$ 0,05/g\nCupim = R$ 0,04/g`,
        '400'
      )
      if (!grams) return

      const parsedGrams = parseInt(grams)
      if (isNaN(parsedGrams) || parsedGrams < product.minGrams) {
        toast.error(`Mínimo ${product.minGrams}g`)
        return
      }

      const subtotal = parsedGrams * product.pricePerGram
      addItemToCart({
        productId: product.id,
        name: `${product.name} (${parsedGrams}g)`,
        quantity: parsedGrams,
        unitPrice: product.pricePerGram,
        subtotal,
        type: 'meat',
      })
    } else {
      // Acompanhamentos e bebidas
      const qty = prompt(`Quantidade de ${product.name}:`, '1')
      if (!qty) return

      const parsedQty = parseInt(qty)
      if (isNaN(parsedQty) || parsedQty <= 0) {
        toast.error('Quantidade inválida')
        return
      }

      const subtotal = parsedQty * product.price
      addItemToCart({
        productId: product.id,
        name: product.name,
        quantity: parsedQty,
        unitPrice: product.price,
        subtotal,
        type: product.type,
      })
    }
  }

  const addItemToCart = (item: CartItem) => {
    const existingIndex = cart.findIndex(c => c.productId === item.productId)
    if (existingIndex >= 0) {
      const updated = [...cart]
      updated[existingIndex].quantity += item.quantity
      updated[existingIndex].subtotal += item.subtotal
      setCart(updated)
      toast.success('Item adicionado ao carrinho')
    } else {
      setCart([...cart, item])
      toast.success('Item adicionado ao carrinho')
    }
    setSearch('')
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const gacomTax = Math.round(subtotal * 0.1) // 10% do garçom
  const total = subtotal + gacomTax

  const handleConfirm = () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho')
      return
    }
    onAddItems(cart, total)
    setCart([])
    setSearch('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4">
          <h2 className="text-2xl font-bold text-[#2a1f14] mb-3">Adicionar Itens</h2>
          <input
            type="text"
            placeholder="🔍 Buscar carnes, acompanhamentos, bebidas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[#d4c5b9] outline-none focus:border-[#c45c2a]"
          />
        </div>

        {/* Produtos */}
        <div className="p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-[#8a7060] py-6">Nenhum item encontrado</p>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="w-full text-left p-3 rounded-lg hover:bg-[#f5ede3] border border-[#e8ddd2] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[#2a1f14]">{product.name}</p>
                    <p className="text-xs text-[#8a7060]">{product.category}</p>
                  </div>
                  <div className="text-right">
                    {product.type === 'meat' ? (
                      <p className="font-semibold text-[#c45c2a]">
                        R$ {(product.pricePerGram * 0.01).toFixed(2)}/g
                      </p>
                    ) : (
                      <p className="font-semibold text-[#c45c2a]">
                        R$ {(product.price * 0.01).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Carrinho */}
        {cart.length > 0 && (
          <div className="border-t sticky bottom-0 bg-white">
            <div className="p-4 space-y-3">
              {/* Items no carrinho */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#f5ede3] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#2a1f14]">{item.name}</p>
                      <p className="text-xs text-[#8a7060]">
                        {item.type === 'meat'
                          ? `R$ ${(item.subtotal * 0.01).toFixed(2)}`
                          : `${item.quantity}x R$ ${(item.unitPrice * 0.01).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#c45c2a]">
                        R$ {(item.subtotal * 0.01).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-xs text-red-600 hover:text-red-800 mt-1"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="border-t pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7060]">Subtotal:</span>
                  <span className="font-semibold text-[#2a1f14]">
                    R$ {(subtotal * 0.01).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8a7060]">Taxa Garçom (10%):</span>
                  <span className="font-semibold text-[#c45c2a]">
                    R$ {(gacomTax * 0.01).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg border-t pt-1.5">
                  <span className="font-bold text-[#2a1f14]">Total:</span>
                  <span className="font-bold text-[#c45c2a]">
                    R$ {(total * 0.01).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg border border-[#d4c5b9] text-[#2a1f14] hover:bg-[#f5ede3] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-lg bg-[#c45c2a] text-white font-semibold hover:opacity-90 transition-colors"
                >
                  Confirmar Pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
