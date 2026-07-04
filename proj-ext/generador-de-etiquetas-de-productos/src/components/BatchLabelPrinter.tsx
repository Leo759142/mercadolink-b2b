import React, { useState } from 'react';
import { Product, AVAILABLE_TEMPLATES, UserLabelTemplate } from '../types';
import { Barcode } from './Barcode';
import { Printer, CheckSquare, Square, RefreshCw, Layers, Plus, Minus, Search, Trash2, ListFilter } from 'lucide-react';

interface BatchLabelPrinterProps {
  products: Product[];
  customTemplates?: UserLabelTemplate[];
}

export const BatchLabelPrinter: React.FC<BatchLabelPrinterProps> = ({ products, customTemplates = [] }) => {
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, boolean>>({});
  const [copies, setCopies] = useState<Record<string, number>>({});
  const [globalTemplateId, setGlobalTemplateId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    if (!copies[id]) {
      setCopies(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const handleSetCopies = (id: string, count: number) => {
    setCopies(prev => ({
      ...prev,
      [id]: Math.max(1, count)
    }));
  };

  const handleSelectAll = () => {
    const nextSelected: Record<string, boolean> = {};
    const nextCopies: Record<string, number> = { ...copies };
    
    filteredProducts.forEach(p => {
      nextSelected[p.id] = true;
      if (!nextCopies[p.id]) {
        nextCopies[p.id] = 1;
      }
    });

    setSelectedProductIds(nextSelected);
    setCopies(nextCopies);
  };

  const handleClearAll = () => {
    setSelectedProductIds({});
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCount = Object.keys(selectedProductIds).filter(id => selectedProductIds[id]).length;

  const handlePrintBatch = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate label HTML blocks
    let labelBlocksHtml = '';
    products.forEach(product => {
      if (selectedProductIds[product.id]) {
        const count = copies[product.id] || 1;
        const templateId = globalTemplateId === 'all' ? product.templateId : globalTemplateId;
        
        const customTemplate = customTemplates.find(t => t.id === templateId);
        const template = !customTemplate ? (AVAILABLE_TEMPLATES.find(t => t.id === templateId) || AVAILABLE_TEMPLATES[0]) : null;

        let labelHtml = '';

        if (customTemplate) {
          const fontStyle = customTemplate.fontFamily === 'serif' 
            ? 'font-family: Georgia, serif;' 
            : customTemplate.fontFamily === 'mono' 
              ? 'font-family: "Courier New", Courier, monospace;' 
              : 'font-family: system-ui, -apple-system, sans-serif;';

          const inlineStyles = `
            background-color: ${customTemplate.backgroundColor};
            color: ${customTemplate.textColor};
            border-color: ${customTemplate.borderColor};
            border-style: ${customTemplate.borderStyle};
            border-width: ${customTemplate.borderWidth}px;
            box-sizing: border-box;
            ${fontStyle}
          `;

          labelHtml = `
            <div class="label-card w-[290px] h-[190px] p-4 rounded-lg flex flex-col justify-between shadow-sm overflow-hidden" style="${inlineStyles}">
              <div class="flex justify-between items-start w-full gap-1" style="border-bottom: 1px dashed ${customTemplate.textColor}33; padding-bottom: 4px; margin-bottom: 4px;">
                <div class="flex flex-col">
                  ${customTemplate.showBrand ? `<span class="text-[9px] uppercase tracking-widest font-bold opacity-80">${product.brand || ''}</span>` : ''}
                  ${customTemplate.showName ? `<span class="font-bold text-xs leading-tight line-clamp-2">${product.name}</span>` : `<span class="font-bold text-xs opacity-50">(Nombre Oculto)</span>`}
                </div>
                ${customTemplate.showCategory ? `
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-black/10 whitespace-nowrap uppercase tracking-wider">
                    ${product.category}
                  </span>
                ` : ''}
              </div>
              
              ${customTemplate.showBarcode ? `
                <div class="bg-white p-1.5 rounded border border-slate-200/40 my-1 flex items-center justify-center">
                  <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                    <svg width="100%" height="32" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <g fill="#000000">
                        <rect x="0" y="0" width="2" height="40"/>
                        <rect x="5" y="0" width="1" height="40"/>
                        <rect x="8" y="0" width="4" height="40"/>
                        <rect x="15" y="0" width="2" height="40"/>
                        <rect x="20" y="0" width="1" height="40"/>
                        <rect x="25" y="0" width="3" height="40"/>
                        <rect x="30" y="0" width="1" height="40"/>
                        <rect x="33" y="0" width="4" height="40"/>
                        <rect x="40" y="0" width="2" height="40"/>
                        <rect x="45" y="0" width="1" height="40"/>
                        <rect x="48" y="0" width="3" height="40"/>
                        <rect x="55" y="0" width="2" height="40"/>
                        <rect x="60" y="0" width="1" height="40"/>
                        <rect x="65" y="0" width="4" height="40"/>
                        <rect x="72" y="0" width="1" height="40"/>
                        <rect x="75" y="0" width="3" height="40"/>
                        <rect x="82" y="0" width="2" height="40"/>
                        <rect x="87" y="0" width="1" height="40"/>
                        <rect x="90" y="0" width="4" height="40"/>
                        <rect x="96" y="0" width="2" height="40"/>
                      </g>
                    </svg>
                    ${customTemplate.showSku ? `<span style="font-family: monospace; font-size: 8px; font-weight: bold; margin-top: 2px; tracking-wider; color: #000000;">${product.sku.toUpperCase()}</span>` : ''}
                  </div>
                </div>
              ` : '<div class="h-6"></div>'}

              <div class="flex justify-between items-center pt-1.5" style="border-top: 1px dashed ${customTemplate.textColor}33;">
                <div class="flex flex-col">
                  <span class="text-[7px] uppercase opacity-75">Stock</span>
                  <span class="font-mono font-bold text-[10px]">${product.stock} u.</span>
                </div>
                <div class="flex flex-col items-end">
                  ${customTemplate.showPrice ? `
                    <span class="text-[7px] uppercase opacity-75">Precio</span>
                    <span class="font-bold text-sm font-mono">$${product.price.toFixed(2)}</span>
                  ` : ''}
                </div>
              </div>

              ${customTemplate.customNote ? `
                <div style="font-size: 7px; text-align: center; font-weight: bold; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">
                  ${customTemplate.customNote}
                </div>
              ` : ''}
            </div>
          `;
        } else if (template) {
          // Standard system template HTML generator
          labelHtml = `
            <div class="label-card w-[290px] h-[190px] p-4 rounded-lg flex flex-col justify-between shadow-sm border border-slate-300 overflow-hidden ${template.themeClass}" style="box-sizing: border-box;">
              <div class="flex justify-between items-start w-full gap-1">
                <div class="flex flex-col">
                  <span class="text-[9px] uppercase tracking-widest font-bold opacity-80">${product.brand || ''}</span>
                  <span class="font-bold text-xs leading-tight line-clamp-2">${product.name}</span>
                </div>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-black/10 whitespace-nowrap uppercase tracking-wider">
                  ${product.category}
                </span>
              </div>
              
              <div class="bg-white p-1.5 rounded border border-slate-200/40 my-1 flex items-center justify-center">
                <!-- Dynamically render simplified barcode via pure html lines inside iframe window -->
                <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                  <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <g fill="#000000">
                      <!-- Simplified bar pattern simulating Code39 -->
                      <rect x="0" y="0" width="2" height="40"/>
                      <rect x="5" y="0" width="1" height="40"/>
                      <rect x="8" y="0" width="4" height="40"/>
                      <rect x="15" y="0" width="2" height="40"/>
                      <rect x="20" y="0" width="1" height="40"/>
                      <rect x="25" y="0" width="3" height="40"/>
                      <rect x="30" y="0" width="1" height="40"/>
                      <rect x="33" y="0" width="4" height="40"/>
                      <rect x="40" y="0" width="2" height="40"/>
                      <rect x="45" y="0" width="1" height="40"/>
                      <rect x="48" y="0" width="3" height="40"/>
                      <rect x="55" y="0" width="2" height="40"/>
                      <rect x="60" y="0" width="1" height="40"/>
                      <rect x="65" y="0" width="4" height="40"/>
                      <rect x="72" y="0" width="1" height="40"/>
                      <rect x="75" y="0" width="3" height="40"/>
                      <rect x="82" y="0" width="2" height="40"/>
                      <rect x="87" y="0" width="1" height="40"/>
                      <rect x="90" y="0" width="4" height="40"/>
                      <rect x="96" y="0" width="2" height="40"/>
                    </g>
                  </svg>
                  <span style="font-family: monospace; font-size: 8px; font-weight: bold; margin-top: 2px; tracking-wider; color: #000000;">${product.sku.toUpperCase()}</span>
                </div>
              </div>

              <div class="flex justify-between items-center pt-1.5 border-t border-current/10">
                <div class="flex flex-col">
                  <span class="text-[7px] uppercase opacity-75">Stock</span>
                  <span class="font-mono font-bold text-[10px]">${product.stock} u.</span>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-[7px] uppercase opacity-75">Precio</span>
                  <span class="font-bold text-sm font-mono">$${product.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          `;
        }
        
        for (let i = 0; i < count; i++) {
          labelBlocksHtml += labelHtml;
        }
      }
    });

    const printStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:wght@400;700&display=swap');
      @import "tailwindcss";
      body {
        margin: 0;
        padding: 20px;
        background-color: white;
      }
      .print-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 290px);
        gap: 15px;
        justify-content: center;
      }
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
        .print-grid {
          display: grid;
          grid-template-columns: repeat(2, 290px);
          gap: 15px;
          justify-content: center;
        }
        .label-card {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Impresión de Lote de Etiquetas - TagCraft Pro</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="no-print mb-6 p-4 bg-slate-900 text-white rounded-lg flex justify-between items-center border border-slate-800 shadow-lg">
            <div>
              <h3 class="text-sm font-bold text-white">Consola de Impresión Masiva</h3>
              <p class="text-xs text-slate-400">Se generarán las etiquetas seleccionadas listas para papel de formato estándar adhesivo.</p>
            </div>
            <button onclick="window.print()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md flex items-center gap-2">
              Lanzar Impresora
            </button>
          </div>
          <div class="print-grid">
            ${labelBlocksHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="batch-printer-view">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Impresión en Lotes</h2>
        <p className="text-sm text-slate-500 mb-6">
          Selecciona múltiples productos para generar una plantilla de impresión unificada en formato de grilla. Ideal para etiquetado masivo.
        </p>

        {/* Global Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Buscar Producto</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre, SKU o marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filtrar Categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Diseño Global</label>
            <select
              value={globalTemplateId}
              onChange={(e) => setGlobalTemplateId(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="all">Usar plantilla de cada producto</option>
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

          <div className="flex items-end justify-end space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 transition"
            >
              Seleccionar Todos
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-rose-50 text-rose-600 transition"
            >
              Limpiar Selección
            </button>
          </div>
        </div>

        {/* Product selection table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="p-4 w-12 text-center">Selección</th>
                <th className="p-4">Producto / Marca</th>
                <th className="p-4">SKU / Código</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Precio</th>
                <th className="p-4 text-center">Cantidad de Etiquetas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isChecked = !!selectedProductIds[p.id];
                  const count = copies[p.id] || 1;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleToggleProduct(p.id)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50/50 ${
                        isChecked ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(p.id)}
                          className={`flex items-center justify-center mx-auto h-5 w-5 rounded border transition-colors ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 text-transparent hover:border-slate-400'
                          }`}
                        >
                          {isChecked ? (
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                          ) : null}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 text-slate-400 font-bold text-xs uppercase">
                              {p.name.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-800 block text-sm">{p.name}</span>
                            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                              {p.brand || 'Sin Marca'} • {p.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-semibold text-slate-600">
                        {p.sku}
                      </td>
                      <td className="p-4 text-sm font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.stock <= 5
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {p.stock} u.
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold font-mono text-slate-800">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleSetCopies(p.id, count - 1)}
                            disabled={!isChecked}
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            disabled={!isChecked}
                            onChange={(e) => handleSetCopies(p.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center border-slate-200 rounded-md py-0.5 text-xs font-mono font-bold disabled:bg-slate-50 disabled:text-slate-400"
                          />
                          <button
                            onClick={() => handleSetCopies(p.id, count + 1)}
                            disabled={!isChecked}
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Panel */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
          <div className="flex flex-col text-center md:text-left">
            <span className="text-sm font-bold text-slate-800">
              {selectedCount} de {products.length} productos seleccionados
            </span>
            <span className="text-xs text-slate-500">
              Total de etiquetas a imprimir: {Object.keys(selectedProductIds)
                .filter(id => selectedProductIds[id])
                .reduce((total, id) => total + (copies[id] || 1), 0)}
            </span>
          </div>

          <button
            onClick={handlePrintBatch}
            disabled={selectedCount === 0}
            className="w-full md:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 flex items-center justify-center space-x-2 transition duration-200"
            id="print-batch-action"
          >
            <Printer className="h-5 w-5" />
            <span>Generar y Previsualizar Lote</span>
          </button>
        </div>
      </div>
    </div>
  );
};
