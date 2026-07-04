import React from 'react';
import { Seller } from '../types';
import { Edit2, Trash2, Phone, Store, DollarSign } from 'lucide-react';

interface SellerCardProps {
  key?: React.Key;
  seller: Seller;
  orderCount: number;
  onEdit: (s: Seller) => void;
  onDelete: (id: string) => void;
}

export default function SellerCard({ seller, orderCount, onEdit, onDelete }: SellerCardProps) {
  return (
    <div 
      id={`seller-card-${seller.id}`}
      className="bg-rustic-surface border-2 border-rustic-border hover:border-rustic-accent rounded-lg p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg"
    >
      <div>
        {/* Header: Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-rustic-border shrink-0">
            <img 
              src={seller.avatar} 
              alt={seller.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="text-lg font-serif text-rustic-text">{seller.name}</h4>
            <span className="text-[10px] font-mono uppercase bg-rustic-accent/15 text-rustic-accent px-2 py-0.5 rounded border border-rustic-accent/20">
              Vendedor Minorista
            </span>
          </div>
        </div>

        {/* Stall Info */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2 text-xs font-sans text-rustic-muted">
            <Store className="w-3.5 h-3.5 text-rustic-accent mt-0.5 shrink-0" />
            <span>Mercado: <strong>{seller.marketName}</strong></span>
          </div>
          <div className="flex items-start gap-2 text-xs font-sans text-rustic-muted">
            <Store className="w-3.5 h-3.5 text-rustic-accent mt-0.5 shrink-0" opacity={0.6} />
            <span>Puesto: <strong>{seller.stallNumber}</strong></span>
          </div>
          <div className="flex items-start gap-2 text-xs font-sans text-rustic-muted">
            <Phone className="w-3.5 h-3.5 text-rustic-accent mt-0.5 shrink-0" />
            <a 
              href={`tel:${seller.phone}`}
              className="hover:text-rustic-accent transition-colors"
              aria-label={`Llamar a ${seller.name}`}
            >
              Llamar: {seller.phone}
            </a>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-4 p-3 bg-rustic-bg/40 border border-rustic-border/20 rounded">
          <div className="text-[10px] uppercase font-mono text-rustic-muted">Línea de Crédito/Saldo</div>
          <div className="flex items-center text-xl font-serif text-rustic-yellow mt-0.5">
            <DollarSign className="w-4 h-4 text-rustic-accent shrink-0" />
            <span>s/. {seller.balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="mt-5 pt-3 border-t border-rustic-border/30 flex items-center justify-between">
        <div className="text-xs font-sans text-rustic-muted">
          Pedidos realizados: <strong className="text-rustic-accent">{orderCount}</strong>
        </div>
        <div className="flex gap-2">
          <button
            id={`btn-edit-sel-${seller.id}`}
            onClick={() => onEdit(seller)}
            className="p-1.5 bg-rustic-surface2 hover:bg-rustic-accent hover:text-rustic-bg text-rustic-muted border border-rustic-border rounded-md transition-all custom-focus"
            aria-label={`Editar vendedor ${seller.name}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-delete-sel-${seller.id}`}
            onClick={() => onDelete(seller.id)}
            className="p-1.5 bg-rustic-surface2 hover:bg-rustic-red hover:text-white text-rustic-muted border border-rustic-border rounded-md transition-all custom-focus"
            aria-label={`Eliminar vendedor ${seller.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
