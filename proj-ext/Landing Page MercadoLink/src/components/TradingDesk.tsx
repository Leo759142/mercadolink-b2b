import React, { useState } from 'react';
import { Order, Seller, Provider, Product } from '../types';
import { Truck, Check, Hourglass, Calendar, User, ShoppingBag, PlusCircle, CircleDollarSign, Scale } from 'lucide-react';

interface TradingDeskProps {
  orders: Order[];
  sellers: Seller[];
  providers: Provider[];
  products: Product[];
  onUpdateStatus: (orderId: string, newStatus: 'pendiente' | 'coordinado' | 'entregado') => void;
  onOpenOrderModal: () => void;
}

export default function TradingDesk({
  orders,
  sellers,
  providers,
  products,
  onUpdateStatus,
  onOpenOrderModal
}: TradingDeskProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Helper selectors
  const getSellerName = (id: string) => sellers.find(s => s.id === id)?.name || 'Comerciante Anon';
  const getProviderName = (id: string) => providers.find(p => p.id === id)?.name || 'Productor Rural';
  const getProductImage = (id: string) => products.find(p => p.id === id)?.image || 'https://picsum.photos/seed/placeholder/80/80';

  // Statistics calculations
  const totalVolume = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalFinancial = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingCount = orders.filter(o => o.status === 'pendiente').length;

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <div id="trading-desk-container" className="space-y-6">
      
      {/* Dynamic Summary Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-rustic-surface border-2 border-rustic-border p-4 rounded-lg flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-rustic-accent/10 rounded border border-rustic-accent/30 text-rustic-accent shrink-0">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-rustic-muted">Valor de Intercambio</div>
            <div className="text-xl font-serif text-rustic-yellow">S/. {totalFinancial.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="text-[10px] text-rustic-muted font-sans mt-0.5">Dinero directo al productor</div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-rustic-surface border-2 border-rustic-border p-4 rounded-lg flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-rustic-green/10 rounded border border-rustic-green/30 text-rustic-green shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-rustic-muted">Acopio Total (Volumen)</div>
            <div className="text-xl font-serif text-rustic-text">{totalVolume.toLocaleString()} kg/unid.</div>
            <div className="text-[10px] text-rustic-muted font-sans mt-0.5">Alimentos del campo movilizados</div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-rustic-surface border-2 border-rustic-border p-4 rounded-lg flex items-center gap-4 shadow-lg">
          <div className="p-3 bg-rustic-yellow/10 rounded border border-rustic-yellow/30 text-rustic-yellow shrink-0">
            <Truck className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-rustic-muted">Despachos Pendientes</div>
            <div className="text-xl font-serif text-rustic-accent">{pendingCount} envíos</div>
            <div className="text-[10px] text-rustic-muted font-sans mt-0.5">Coordinación logística activa</div>
          </div>
        </div>
      </div>

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-rustic-surface2/30 border-2 border-rustic-border p-4 rounded-lg">
        <div>
          <h3 className="text-lg font-serif text-rustic-text">Mesa de Despachos y Logística Colectiva</h3>
          <p className="text-xs font-sans text-rustic-muted">Historial de órdenes B2B y estado de transporte directo</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filters */}
          <div className="inline-flex rounded-md border border-rustic-border overflow-hidden text-xs font-sans">
            <button
              id="filter-order-all"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 transition-all ${filterStatus === 'all' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'bg-rustic-surface text-rustic-muted hover:bg-rustic-surface2'}`}
            >
              Todos ({orders.length})
            </button>
            <button
              id="filter-order-pendiente"
              onClick={() => setFilterStatus('pendiente')}
              className={`px-3 py-1.5 transition-all ${filterStatus === 'pendiente' ? 'bg-rustic-yellow text-rustic-bg font-bold' : 'bg-rustic-surface text-rustic-muted hover:bg-rustic-surface2'}`}
            >
              Pendientes
            </button>
            <button
              id="filter-order-coordinado"
              onClick={() => setFilterStatus('coordinado')}
              className={`px-3 py-1.5 transition-all ${filterStatus === 'coordinado' ? 'bg-rustic-accent2 text-white font-bold' : 'bg-rustic-surface text-rustic-muted hover:bg-rustic-surface2'}`}
            >
              En Ruta
            </button>
            <button
              id="filter-order-entregado"
              onClick={() => setFilterStatus('entregado')}
              className={`px-3 py-1.5 transition-all ${filterStatus === 'entregado' ? 'bg-rustic-green text-rustic-bg font-bold' : 'bg-rustic-surface text-rustic-muted hover:bg-rustic-surface2'}`}
            >
              Entregados
            </button>
          </div>

          <button
            id="trading-desk-new-order-btn"
            onClick={onOpenOrderModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rustic-accent text-rustic-bg font-sans font-bold text-xs rounded-full border border-rustic-wood hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simular Compra</span>
          </button>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-rustic-surface border-2 border-rustic-border/50 rounded-lg">
            <Truck className="w-12 h-12 text-rustic-muted mx-auto mb-3 opacity-40" />
            <h4 className="text-lg font-serif text-rustic-text">No hay despachos con este estado</h4>
            <p className="text-sm font-sans text-rustic-muted mt-1">Intente cambiar el filtro o simule un pedido desde el catálogo de cultivos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
              const prodImg = getProductImage(order.productId);
              return (
                <div
                  id={`order-item-${order.id}`}
                  key={order.id}
                  className="bg-rustic-surface border-2 border-rustic-border/80 rounded-lg p-4 flex flex-col justify-between hover:border-rustic-accent transition-all shadow-md relative overflow-hidden"
                >
                  {/* Visual Left Status Border */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                    order.status === 'pendiente' ? 'bg-rustic-yellow' :
                    order.status === 'coordinado' ? 'bg-rustic-accent2' : 'bg-rustic-green'
                  }`} />

                  <div className="pl-2.5">
                    {/* Header */}
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-rustic-border overflow-hidden shrink-0">
                          <img src={prodImg} alt="Producto" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-base font-serif text-rustic-text leading-tight">{order.productName}</h4>
                          <span className="text-[10px] font-mono text-rustic-accent mt-0.5 block">Cód: {order.id}</span>
                        </div>
                      </div>

                      {/* Status pill */}
                      <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                        order.status === 'pendiente' ? 'bg-rustic-yellow/10 text-rustic-yellow border-rustic-yellow/30' :
                        order.status === 'coordinado' ? 'bg-rustic-accent2/10 text-rustic-accent2 border-rustic-accent2/30' :
                        'bg-rustic-green/10 text-rustic-green border-rustic-green/30'
                      }`}>
                        {order.status === 'pendiente' ? 'Esperando Aprobación' :
                         order.status === 'coordinado' ? 'En Transporte' : 'Entregado en Puesto'}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-sans text-rustic-muted border-t border-b border-rustic-border/10 py-2.5 my-3">
                      <div>
                        <span className="block text-[9px] font-mono uppercase text-rustic-muted/60">Vendedor Destino:</span>
                        <strong className="text-rustic-text">{getSellerName(order.sellerId)}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono uppercase text-rustic-muted/60">Productor Rural:</span>
                        <strong className="text-rustic-text">{getProviderName(order.providerId)}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono uppercase text-rustic-muted/60">Cantidad:</span>
                        <strong className="text-rustic-text">{order.quantity} unidades/kg</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono uppercase text-rustic-muted/60">Costo Liquidación:</span>
                        <strong className="text-rustic-yellow">S/. {order.totalPrice.toFixed(2)}</strong>
                      </div>
                    </div>

                    {/* Date / Delivery */}
                    <div className="flex justify-between items-center text-[11px] font-mono text-rustic-muted mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Fecha: {order.date}</span>
                      </div>
                      {order.status !== 'entregado' && (
                        <div className="text-right text-rustic-accent">
                          <span>Est. Entrega: {order.deliveryDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions to move order state forward */}
                  {order.status !== 'entregado' && (
                    <div className="mt-4 pt-3 border-t border-rustic-border/20 flex gap-2 justify-end pl-2.5">
                      {order.status === 'pendiente' && (
                        <button
                          id={`btn-route-order-${order.id}`}
                          onClick={() => onUpdateStatus(order.id, 'coordinado')}
                          className="px-3 py-1.5 bg-rustic-surface2 hover:bg-rustic-accent2 text-rustic-text hover:text-white border border-rustic-border/40 text-xs font-sans font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5"
                          aria-label="Aprobar despacho y poner en ruta"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Poner En Ruta</span>
                        </button>
                      )}

                      {order.status === 'coordinado' && (
                        <button
                          id={`btn-deliver-order-${order.id}`}
                          onClick={() => onUpdateStatus(order.id, 'entregado')}
                          className="px-3 py-1.5 bg-rustic-green text-white border border-rustic-border/40 text-xs font-sans font-bold uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5"
                          aria-label="Confirmar entrega de mercadería"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar Entrega</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
