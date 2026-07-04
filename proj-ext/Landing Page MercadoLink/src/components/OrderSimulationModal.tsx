import React, { useState, useEffect } from 'react';
import { Product, Provider, Seller, Order } from '../types';
import { X, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';

interface OrderSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  sellers: Seller[];
  providers: Provider[];
  onOrderPlaced: (order: Omit<Order, 'id'>) => void;
}

export default function OrderSimulationModal({
  isOpen,
  onClose,
  product,
  sellers,
  providers,
  onOrderPlaced
}: OrderSimulationModalProps) {
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [error, setError] = useState('');

  const activeProduct = product;
  const activeProvider = providers.find(p => p.id === activeProduct?.providerId) || null;
  const activeSeller = sellers.find(s => s.id === selectedSellerId) || null;

  useEffect(() => {
    if (sellers.length > 0) {
      setSelectedSellerId(sellers[0].id);
    }
    setQuantity(50);
    setError('');
  }, [product, isOpen, sellers]);

  if (!isOpen || !activeProduct) return null;

  const totalPrice = activeProduct.price * quantity;
  const isBalanceSufficient = activeSeller ? activeSeller.balance >= totalPrice : true;
  const isStockSufficient = activeProduct.stock >= quantity;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellerId) {
      setError('Por favor selecciona un comerciante.');
      return;
    }
    if (quantity <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      return;
    }
    if (!isStockSufficient) {
      setError('No hay suficiente stock disponible de este cultivo.');
      return;
    }
    if (!isBalanceSufficient) {
      setError('El comerciante no tiene suficiente saldo para esta compra.');
      return;
    }

    // Call callback
    onOrderPlaced({
      sellerId: selectedSellerId,
      providerId: activeProduct.providerId,
      productId: activeProduct.id,
      productName: activeProduct.name,
      quantity,
      totalPrice,
      status: 'pendiente',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0] // +2 days
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
      <div className="w-full max-w-md bg-rustic-surface border-4 border-rustic-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-rustic-wood flex items-center justify-between border-b-2 border-rustic-border">
          <h3 id="order-modal-title" className="text-lg font-serif text-rustic-accent flex items-center gap-2">
            <span>🛒</span> Transacción Directa B2B
          </h3>
          <button 
            id="close-order-modal"
            onClick={onClose} 
            className="p-1 text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2 rounded-full transition-all"
            aria-label="Cerrar modal de pedido"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 flex-grow">
          
          {/* Visual flow: Provider -> Product -> Seller */}
          <div className="p-3 bg-rustic-bg/50 border border-rustic-border/20 rounded-md text-xs space-y-2">
            <div className="flex justify-between items-center text-rustic-muted">
              <span>Productor (Origen):</span>
              <strong className="text-rustic-text">{activeProvider?.name || 'Desconocido'}</strong>
            </div>
            <div className="flex justify-between items-center text-rustic-muted">
              <span>Cultivo a transar:</span>
              <strong className="text-rustic-yellow">{activeProduct.name}</strong>
            </div>
            <div className="flex justify-between items-center text-rustic-muted">
              <span>Precio unitario:</span>
              <strong className="text-rustic-accent">S/. {activeProduct.price.toFixed(2)} / {activeProduct.unit}</strong>
            </div>
            <div className="flex justify-between items-center text-rustic-muted">
              <span>Stock en chacra:</span>
              <strong className="text-rustic-text">{activeProduct.stock} {activeProduct.unit}s disponibles</strong>
            </div>
          </div>

          {/* Selector of Buyer */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="order-buyer">Seleccione Comerciante (Comprador)</label>
            <select
              id="order-buyer"
              value={selectedSellerId}
              onChange={(e) => {
                setSelectedSellerId(e.target.value);
                setError('');
              }}
              required
              className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            >
              {sellers.map((sell) => (
                <option key={sell.id} value={sell.id} className="bg-rustic-surface">
                  {sell.name} ({sell.marketName}) — s/. {sell.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity to Purchase */}
          <div>
            <div className="flex justify-between text-xs font-mono uppercase text-rustic-muted mb-1">
              <label htmlFor="order-qty">Cantidad a Comprar ({activeProduct.unit})</label>
              <span className="text-rustic-accent">S/. {activeProduct.price.toFixed(2)} c/u</span>
            </div>
            <div className="flex gap-2">
              <input
                id="order-qty"
                type="number"
                min="1"
                max={activeProduct.stock}
                value={quantity}
                onChange={(e) => {
                  setQuantity(Math.max(1, Number(e.target.value)));
                  setError('');
                }}
                className="flex-grow bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              />
              {/* Quick selectors */}
              <button
                id="btn-qty-50"
                type="button"
                onClick={() => setQuantity(50)}
                className="px-2.5 py-1 bg-rustic-surface2 hover:bg-rustic-surface border border-rustic-border/50 rounded text-xs text-rustic-text"
              >
                50
              </button>
              <button
                id="btn-qty-100"
                type="button"
                onClick={() => setQuantity(100)}
                className="px-2.5 py-1 bg-rustic-surface2 hover:bg-rustic-surface border border-rustic-border/50 rounded text-xs text-rustic-text"
              >
                100
              </button>
              <button
                id="btn-qty-250"
                type="button"
                onClick={() => setQuantity(250)}
                className="px-2.5 py-1 bg-rustic-surface2 hover:bg-rustic-surface border border-rustic-border/50 rounded text-xs text-rustic-text"
              >
                250
              </button>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="p-4 bg-rustic-surface2/40 border border-rustic-border/30 rounded-md">
            <div className="flex justify-between items-center text-xs font-mono text-rustic-muted">
              <span>Subtotal:</span>
              <span>s/. {totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-rustic-muted mt-1">
              <span>Impuestos de acopio:</span>
              <span className="text-rustic-green">S/. 0.00 (Canal Directo)</span>
            </div>
            <div className="flex justify-between items-center border-t border-rustic-border/30 pt-2 mt-2">
              <span className="text-sm font-serif text-rustic-text">Total Liquidación:</span>
              <span className="text-xl font-serif text-rustic-yellow">s/. {totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Validation Warnings */}
          {!isStockSufficient && (
            <div className="flex gap-2 p-2.5 bg-rustic-red/10 border border-rustic-red/40 rounded text-xs text-rustic-red font-sans">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>No hay suficiente stock en chacra ({activeProduct.stock} disponibles).</span>
            </div>
          )}

          {!isBalanceSufficient && activeSeller && (
            <div className="flex gap-2 p-2.5 bg-rustic-red/10 border border-rustic-red/40 rounded text-xs text-rustic-red font-sans">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Saldo insuficiente. El comerciante posee s/. {activeSeller.balance.toFixed(2)}.</span>
            </div>
          )}

          {error && (
            <div className="p-2 bg-rustic-red text-white text-xs text-center font-sans rounded">
              {error}
            </div>
          )}

        </form>

        {/* Action Buttons */}
        <div className="p-4 bg-rustic-surface2/60 border-t border-rustic-border/40 flex gap-3 justify-end">
          <button
            id="cancel-order-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-rustic-surface hover:bg-rustic-bg border border-rustic-border text-xs font-sans font-bold uppercase tracking-wide text-rustic-text rounded transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            id="confirm-order-btn"
            type="submit"
            onClick={handlePlaceOrder}
            disabled={!isStockSufficient || !isBalanceSufficient || !selectedSellerId}
            className="px-5 py-2.5 bg-gradient-to-r from-rustic-green to-emerald-600 text-white font-sans font-bold text-xs uppercase tracking-wide rounded border border-rustic-border flex items-center gap-1.5 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Despacho</span>
          </button>
        </div>
      </div>
    </div>
  );
}
