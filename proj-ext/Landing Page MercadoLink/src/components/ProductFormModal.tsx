import React, { useState, useEffect } from 'react';
import { Product, Provider } from '../types';
import { X, Save, Image, Tag, Layers, User } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> & { id?: string }) => void;
  product?: Product | null;
  providers: Provider[];
}

const CATEGORIES = ['Tubérculos', 'Frutas', 'Verduras', 'Granos y Abarrotes'];
const IMAGE_PLACEHOLDERS = [
  { name: 'Papas/Tubérculos', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60' },
  { name: 'Café/Granos', url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60' },
  { name: 'Naranjas/Frutas', url: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&auto=format&fit=crop&q=60' },
  { name: 'Hortalizas/Verduras', url: 'https://images.unsplash.com/photo-1622484211148-7174984f23e0?w=500&auto=format&fit=crop&q=60' }
];

export default function ProductFormModal({ isOpen, onClose, onSave, product, providers }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState(0.00);
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState(100);
  const [providerId, setProviderId] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setPrice(product.price);
      setUnit(product.unit);
      setStock(product.stock);
      setProviderId(product.providerId);
      setImage(product.image);
      setDescription(product.description);
    } else {
      setName('');
      setCategory(CATEGORIES[0]);
      setPrice(1.50);
      setUnit('kg');
      setStock(500);
      setProviderId(providers[0]?.id || '');
      setImage(IMAGE_PLACEHOLDERS[0].url);
      setDescription('');
    }
  }, [product, isOpen, providers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!providerId) return;

    onSave({
      id: product?.id,
      name,
      category,
      price: Number(price),
      unit,
      stock: Number(stock),
      providerId,
      image: image || IMAGE_PLACEHOLDERS[0].url,
      description
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
      <div className="w-full max-w-lg bg-rustic-surface border-4 border-rustic-border rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-rustic-wood flex items-center justify-between border-b-2 border-rustic-border">
          <h3 id="product-form-title" className="text-xl font-serif text-rustic-accent flex items-center gap-2">
            <span>🌾</span> {product ? 'Editar Cultivo' : 'Cargar Nuevo Cultivo'}
          </h3>
          <button 
            id="close-product-modal"
            onClick={onClose} 
            className="p-1 text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2 rounded-full transition-all"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
          {/* Cultivo Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-name">Nombre del Producto / Cultivo</label>
            <div className="relative">
              <input
                id="prod-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. Papa Nativa Huayro"
                className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Category & Provider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-category">Categoría</label>
              <select
                id="prod-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-rustic-surface">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-provider">Productor / Proveedor</label>
              <select
                id="prod-provider"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                required
                className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              >
                <option value="" disabled className="bg-rustic-surface text-rustic-muted">Seleccionar Productor</option>
                {providers.map((prov) => (
                  <option key={prov.id} value={prov.id} className="bg-rustic-surface">
                    {prov.name} ({prov.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Unit & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-price">Precio (S/.)</label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                min="0.1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-unit">Unidad de Venta</label>
              <select
                id="prod-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              >
                <option value="kg" className="bg-rustic-surface">kg</option>
                <option value="unidad" className="bg-rustic-surface">unidad</option>
                <option value="saco 1kg" className="bg-rustic-surface">saco 1kg</option>
                <option value="saco 50kg" className="bg-rustic-surface">saco 50kg</option>
                <option value="caja" className="bg-rustic-surface">caja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-stock">Stock Inicial</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
                className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Image Select / Paste */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-image">URL de la Imagen</label>
            <input
              id="prod-image"
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Pegar enlace o elegir un preajuste rústico abajo"
              className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all mb-2"
            />
            {/* Quick Presets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {IMAGE_PLACEHOLDERS.map((img) => (
                <button
                  id={`img-preset-${img.name.replace(/\//g, '-')}`}
                  key={img.name}
                  type="button"
                  onClick={() => setImage(img.url)}
                  className={`text-[10px] font-sans p-1.5 border rounded truncate transition-all ${
                    image === img.url 
                      ? 'bg-rustic-accent text-rustic-bg border-rustic-wood' 
                      : 'bg-rustic-surface2 text-rustic-text border-rustic-border/40 hover:bg-rustic-surface'
                  }`}
                >
                  {img.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prod-description">Descripción del Cultivo</label>
            <textarea
              id="prod-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica las propiedades rústicas, origen, frescura o métodos de riego..."
              className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-rustic-surface2/60 border-t-2 border-rustic-border/40 flex gap-3 justify-end">
          <button
            id="cancel-product-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-rustic-surface hover:bg-rustic-bg border border-rustic-border text-xs font-sans font-bold uppercase tracking-wide text-rustic-text rounded transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            id="submit-product-btn"
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim() || !providerId}
            className="px-5 py-2 bg-gradient-to-r from-rustic-accent to-rustic-accent2 text-rustic-bg font-sans font-bold text-xs uppercase tracking-wide rounded border border-rustic-wood flex items-center gap-1.5 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cultivo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
