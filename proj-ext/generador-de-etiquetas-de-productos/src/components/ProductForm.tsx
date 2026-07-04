import React, { useState, useEffect } from 'react';
import { Product, CATEGORIES, AVAILABLE_TEMPLATES, RANDOM_PRODUCT_IMAGES, UserLabelTemplate } from '../types';
import { X, Save, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null; // If provided, we are in Edit mode
  onSave: (productData: Partial<Product>) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  customTemplates?: UserLabelTemplate[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSave,
  onClose,
  isSaving,
  customTemplates = []
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [templateId, setTemplateId] = useState(AVAILABLE_TEMPLATES[0].id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setPrice(product.price || 0);
      setStock(product.stock || 0);
      setCategory(product.category || CATEGORIES[0]);
      setBrand(product.brand || '');
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      setTemplateId(product.templateId || AVAILABLE_TEMPLATES[0].id);
    } else {
      // Set some initial random image
      const randomIdx = Math.floor(Math.random() * RANDOM_PRODUCT_IMAGES.length);
      setImageUrl(RANDOM_PRODUCT_IMAGES[randomIdx]);
      generateSku();
    }
  }, [product]);

  const generateSku = () => {
    // Generate a clean alphanumeric SKU, e.g. "PRD-XXXX-YYYY"
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segment1 = '';
    let segment2 = '';
    for (let i = 0; i < 4; i++) {
      segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
      segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSku(`PRD-${segment1}-${segment2}`);
  };

  const rollRandomImage = () => {
    const randomIdx = Math.floor(Math.random() * RANDOM_PRODUCT_IMAGES.length);
    setImageUrl(RANDOM_PRODUCT_IMAGES[randomIdx]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Manual Validation
    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    const sanitizedSku = sku.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '');
    if (sanitizedSku.length < 3) {
      setError('El código SKU / Barcode debe tener al menos 3 caracteres válidos (A-Z, 0-9 o guiones).');
      return;
    }

    if (price < 0) {
      setError('El precio no puede ser negativo.');
      return;
    }

    if (stock < 0) {
      setError('El stock no puede ser negativo.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        sku: sanitizedSku,
        price,
        stock,
        category,
        brand: brand.trim() || 'Genérico',
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        templateId
      });
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto. Por favor revisa los datos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" id="product-form-modal">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 w-full max-w-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {product ? 'Editar Producto' : 'Crear Nuevo Producto'}
            </h3>
            <p className="text-xs text-slate-500">
              {product ? 'Actualiza la información y su plantilla visual.' : 'Agrega un producto a tu catálogo con control de stock.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre del Producto</label>
              <input
                type="text"
                required
                placeholder="Ej. Audífonos Inalámbricos Bluetooth 5.3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* SKU / Barcode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                <span>SKU / Barcode (Code 39)</span>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 focus:outline-none"
                >
                  <RefreshCw className="h-3 w-3 animate-spin-hover" /> Generar
                </button>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. PRD-8392-A"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Marca / Fabricante</label>
              <input
                type="text"
                placeholder="Ej. SoundCore"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Precio Unitario ($)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={price === 0 ? '' : price}
                onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Stock Inicial</label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Label Template Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Plantilla Ergonómica</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium"
              >
                <optgroup label="Plantillas de Fábrica">
                  {AVAILABLE_TEMPLATES.map(temp => (
                    <option key={temp.id} value={temp.id}>{temp.name}</option>
                  ))}
                </optgroup>
                {customTemplates.length > 0 && (
                  <optgroup label="Tus Diseños Personalizados">
                    {customTemplates.map(temp => (
                      <option key={temp.id} value={temp.id}>{temp.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Product Image URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                <span>URL de la Imagen</span>
                <button
                  type="button"
                  onClick={rollRandomImage}
                  className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 focus:outline-none"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Cambiar Imagen Random
                </button>
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                {imageUrl && (
                  <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0">
                    <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Descripción Corta</label>
              <textarea
                placeholder="Breve descripción del producto para ser impresa en la etiqueta..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-500/10 flex items-center gap-1.5 transition"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
