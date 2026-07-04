import React from 'react';
import { Product } from '../types';
import { Edit2, Trash2, ShoppingBag, Eye, Layers } from 'lucide-react';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  providerName: string;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onOrder: (p: Product) => void;
}

export default function ProductCard({ product, providerName, onEdit, onDelete, onOrder }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="bg-rustic-surface border-2 border-rustic-border hover:border-rustic-accent rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg"
    >
      {/* Category Ribbon */}
      <div className="relative h-44 bg-rustic-bg/80">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute top-2.5 right-2.5 bg-rustic-wood/90 text-rustic-text border border-rustic-border text-xs px-2 py-0.5 rounded-full font-sans flex items-center gap-1">
          <Layers className="w-3 h-3 text-rustic-accent" /> {product.category}
        </span>
        {isOutOfStock ? (
          <span className="absolute top-2.5 left-2.5 bg-rustic-red text-rustic-text font-sans font-bold text-xs px-2.5 py-0.5 rounded border border-rustic-border shadow">
            Agotado
          </span>
        ) : product.stock < 100 ? (
          <span className="absolute top-2.5 left-2.5 bg-rustic-yellow text-rustic-bg font-sans font-bold text-[10px] px-2 py-0.5 rounded border border-rustic-border shadow animate-pulse">
            ¡Stock Bajo!
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h4 className="text-lg font-serif text-rustic-text tracking-wide">{product.name}</h4>
          <p className="text-xs font-sans text-rustic-accent mt-0.5 flex items-center gap-1">
            <span>🚜 Productor:</span> <strong>{providerName}</strong>
          </p>
          <p className="text-xs font-sans text-rustic-muted mt-2 line-clamp-2 leading-relaxed italic">
            {product.description || "Sin descripción rústica provista para este cultivo."}
          </p>
        </div>

        {/* Pricing and Stock */}
        <div className="mt-4 pt-3 border-t border-rustic-border/30 flex items-center justify-between">
          <div>
            <span className="text-2xl font-serif text-rustic-yellow">s/. {product.price.toFixed(2)}</span>
            <span className="text-xs text-rustic-muted font-sans ml-1">/ {product.unit}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-rustic-muted font-mono uppercase">Stock Disponible</div>
            <div className={`text-sm font-sans font-semibold ${isOutOfStock ? 'text-rustic-red' : 'text-rustic-text'}`}>
              {product.stock} {product.unit === 'unidad' ? 'unidades' : 'kg'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 bg-rustic-surface2/60 border-t border-rustic-border/20 flex gap-2">
        <button
          id={`btn-order-prod-${product.id}`}
          onClick={() => onOrder(product)}
          disabled={isOutOfStock}
          className={`flex-grow inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-sans font-bold rounded-md transition-all ${
            isOutOfStock
              ? 'bg-rustic-muted/20 text-rustic-muted border border-rustic-border/10 cursor-not-allowed'
              : 'bg-rustic-accent text-rustic-bg border border-rustic-wood hover:brightness-115 active:scale-95'
          }`}
          aria-label={`Comprar o hacer pedido de ${product.name}`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Comprar</span>
        </button>

        <button
          id={`btn-edit-prod-${product.id}`}
          onClick={() => onEdit(product)}
          className="p-2 bg-rustic-surface hover:bg-rustic-accent hover:text-rustic-bg text-rustic-muted border border-rustic-border rounded-md transition-all custom-focus"
          aria-label={`Editar producto ${product.name}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        <button
          id={`btn-delete-prod-${product.id}`}
          onClick={() => onDelete(product.id)}
          className="p-2 bg-rustic-surface hover:bg-rustic-red hover:text-white text-rustic-muted border border-rustic-border rounded-md transition-all custom-focus"
          aria-label={`Eliminar producto ${product.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
