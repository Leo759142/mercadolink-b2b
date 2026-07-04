import React, { useState, useRef, useEffect } from 'react';
import { Product, AVAILABLE_TEMPLATES, UserLabelTemplate } from '../types';
import { Barcode } from './Barcode';
import { Printer, Eye, Settings2, Sliders, Check, Copy, CheckCircle } from 'lucide-react';

interface LabelPreviewProps {
  product: Product;
  customTemplates?: UserLabelTemplate[];
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({ product, customTemplates = [] }) => {
  const [showBrand, setShowBrand] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showStock, setShowStock] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const [fontSize, setFontSize] = useState<'xs' | 'sm' | 'base' | 'lg'>('sm');
  const [paddingSize, setPaddingSize] = useState<'p-3' | 'p-4' | 'p-6'>('p-4');
  const [barcodeHeight, setBarcodeHeight] = useState<number>(45);
  const [customColor, setCustomColor] = useState<string>('#000000');
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [printed, setPrinted] = useState(false);

  const labelRef = useRef<HTMLDivElement>(null);

  const customTemplate = customTemplates.find(t => t.id === product.templateId);
  const selectedTemplate = AVAILABLE_TEMPLATES.find(t => t.id === product.templateId) || AVAILABLE_TEMPLATES[0];

  // Auto-sync toggles with custom template settings when the product's templateId changes
  useEffect(() => {
    if (customTemplate) {
      setShowBrand(customTemplate.showBrand !== undefined ? customTemplate.showBrand : true);
      setShowPrice(customTemplate.showPrice !== undefined ? customTemplate.showPrice : true);
      setShowBarcodeText(customTemplate.showSku !== undefined ? customTemplate.showSku : true);
    } else {
      setShowBrand(true);
      setShowPrice(true);
      setShowBarcodeText(true);
    }
  }, [product.templateId, customTemplate]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build the label's HTML
    const labelHtml = labelRef.current?.outerHTML || '';
    const templateStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:wght@400;700&display=swap');
      @import "tailwindcss";
      body {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 20px;
        background-color: white;
      }
      .print-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
        justify-content: center;
      }
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
        .print-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
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
          <title>Imprimir Etiqueta - ${product.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>${templateStyles}</style>
        </head>
        <body>
          <div class="no-print mb-6 p-4 bg-slate-100 rounded-lg flex justify-between items-center border border-slate-200">
            <div>
              <h3 class="text-sm font-bold text-slate-800">Vista Previa de Impresión</h3>
              <p class="text-xs text-slate-500">Se generarán ${printCopies} copias de la etiqueta.</p>
            </div>
            <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-md shadow-md flex items-center gap-2">
              Confirmar Impresión
            </button>
          </div>
          <div class="print-grid">
            ${Array(printCopies).fill(labelHtml).join('')}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setPrinted(true);
    setTimeout(() => setPrinted(false), 3000);
  };

  const getFontSizeClass = () => {
    if (customTemplate && customTemplate.fontSizeStyle) {
      switch (customTemplate.fontSizeStyle) {
        case 'compact': return 'text-xs';
        case 'large': return 'text-base';
        default: return 'text-sm';
      }
    }
    switch (fontSize) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
    }
  };

  const getPaddingClass = () => {
    if (customTemplate && customTemplate.paddingStyle) {
      switch (customTemplate.paddingStyle) {
        case 'tight': return 'p-3';
        case 'loose': return 'p-6';
        default: return 'p-4';
      }
    }
    return paddingSize;
  };

  const getFontClass = () => {
    if (customTemplate) {
      switch (customTemplate.fontFamily) {
        case 'serif': return 'font-serif';
        case 'mono': return 'font-mono';
        default: return 'font-sans';
      }
    }
    return '';
  };

  const cardStyle: React.CSSProperties = customTemplate ? {
    backgroundColor: customTemplate.backgroundColor,
    color: customTemplate.textColor,
    borderColor: customTemplate.borderColor,
    borderStyle: customTemplate.borderStyle as any,
    borderWidth: `${customTemplate.borderWidth}px`,
    borderRadius: customTemplate.borderRadius !== undefined ? `${customTemplate.borderRadius}px` : '8px',
    width: '100%'
  } : { width: '100%' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="label-preview-container">
      {/* Configuration Controls */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col space-y-6" id="preview-controls">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
          <Sliders className="h-5 w-5 text-indigo-600" />
          <h3 className="text-md font-bold text-slate-900">Personalizar Plantilla</h3>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Elementos Visibles</h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showBrand}
                onChange={(e) => setShowBrand(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Marca / Fabricante</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Precio</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showStock}
                onChange={(e) => setShowStock(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Stock Actual</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showDescription}
                onChange={(e) => setShowDescription(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Descripción</span>
            </label>

            <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer text-xs font-medium text-slate-700 col-span-2 select-none">
              <input
                type="checkbox"
                checked={showBarcodeText}
                onChange={(e) => setShowBarcodeText(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Mostrar Texto del Código de Barras (SKU)</span>
            </label>
          </div>
        </div>

        {/* Layout/Size adjustments */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Dimensiones y Estilo</h4>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tamaño de Texto</label>
            <div className="grid grid-cols-4 gap-2">
              {(['xs', 'sm', 'base', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`py-1.5 text-xs font-semibold rounded-md border capitalize transition-all duration-150 ${
                    fontSize === size
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Márgenes Internos (Padding)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Compacto', value: 'p-3' },
                { label: 'Estándar', value: 'p-4' },
                { label: 'Espacioso', value: 'p-6' }
              ].map((pad) => (
                <button
                  key={pad.value}
                  onClick={() => setPaddingSize(pad.value as any)}
                  className={`py-1.5 text-xs font-semibold rounded-md border transition-all duration-150 ${
                    paddingSize === pad.value
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pad.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-600">Altura del Código</label>
              <span className="text-xs font-mono text-slate-500">{barcodeHeight}px</span>
            </div>
            <input
              type="range"
              min="25"
              max="100"
              value={barcodeHeight}
              onChange={(e) => setBarcodeHeight(parseInt(e.target.value))}
              className="w-full accent-indigo-600 bg-slate-100 rounded-lg h-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Color del Código de Barras</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-slate-500 uppercase">{customColor}</span>
            </div>
          </div>
        </div>

        {/* Copies to print */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad de Copias a Imprimir</label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPrintCopies(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="100"
                value={printCopies}
                onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-slate-200 rounded-md py-1 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setPrintCopies(prev => prev + 1)}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 text-white shadow-lg transition-all duration-200 ${
              printed
                ? 'bg-emerald-600 shadow-emerald-500/15'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/15'
            }`}
            id="print-action-button"
          >
            {printed ? (
              <>
                <CheckCircle className="h-5 w-5 animate-bounce" />
                <span>¡Abriendo Ventana de Impresión!</span>
              </>
            ) : (
              <>
                <Printer className="h-5 w-5" />
                <span>Imprimir Etiqueta</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Live Label Canvas */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100 min-h-[400px]">
        <span className="text-xs font-mono font-bold text-slate-400 mb-4 tracking-wider flex items-center gap-1.5">
          <Eye className="h-4 w-4" /> VISTA PREVIA EN TIEMPO REAL
        </span>

        {/* Ergonomic label container */}
        <div className="relative group max-w-sm w-full bg-white p-2 rounded-xl shadow-md border border-slate-200/50">
          <div
            ref={labelRef}
            className={`label-card w-full min-w-[280px] rounded-lg transition-all duration-300 flex flex-col justify-between shadow-sm overflow-hidden relative ${
              customTemplate ? getFontClass() : selectedTemplate.themeClass
            } ${getPaddingClass()} ${getFontSizeClass()}`}
            style={cardStyle}
            id={`label-preview-card-${product.id}`}
          >
            {/* Stamp Badge Icon */}
            {customTemplate && customTemplate.badgeIcon && customTemplate.badgeIcon !== 'none' && (
              <div 
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center bg-white/95 backdrop-blur-xs w-7 h-7 rounded-full border shadow-sm font-bold text-base select-none hover:scale-110 transition cursor-help z-10"
                style={{ borderColor: customTemplate.borderColor }}
                title="Sello de distinción de plantilla"
              >
                {customTemplate.badgeIcon === 'star' && '⭐'}
                {customTemplate.badgeIcon === 'crown' && '👑'}
                {customTemplate.badgeIcon === 'leaf' && '🍃'}
                {customTemplate.badgeIcon === 'check' && '✅'}
                {customTemplate.badgeIcon === 'premium' && '✨'}
              </div>
            )}

            {/* Header: Brand & Category */}
            <div className="flex justify-between items-start w-full mb-3 gap-2">
              <div className="flex flex-col">
                {showBrand && (
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-85">
                    {product.brand || 'Marca Sencilla'}
                  </span>
                )}
                <span className="font-bold leading-tight line-clamp-2 tracking-tight">
                  {product.name}
                </span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-black/10 text-inherit uppercase tracking-wider whitespace-nowrap">
                {product.category}
              </span>
            </div>

            {/* Description if enabled */}
            {showDescription && product.description && (
              <p className="text-[11px] mb-4 opacity-75 line-clamp-2 leading-relaxed border-t border-current/10 pt-1.5">
                {product.description}
              </p>
            )}

            {/* Barcode representation */}
            <div className="bg-white p-2 rounded-md border border-slate-200/40 my-3 flex items-center justify-center">
              <Barcode
                value={product.sku}
                height={barcodeHeight}
                displayValue={showBarcodeText}
                color={customColor}
              />
            </div>

            {/* Footer: Price & Stock */}
            <div className="flex justify-between items-center border-t border-current/10 pt-2.5 mt-2">
              {showStock && (
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider opacity-60">Stock Disponible</span>
                  <span className={`font-mono font-bold text-xs ${product.stock <= 5 ? 'text-red-600 animate-pulse' : 'text-inherit'}`}>
                    {product.stock} u.
                  </span>
                </div>
              )}

              {showPrice && (
                <div className="flex flex-col items-end">
                  <span className="text-[8px] uppercase tracking-wider opacity-60">Precio Unitario</span>
                  <span className="font-extrabold text-base tracking-tight font-mono">
                    ${product.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Custom Note or Seal if custom template and present */}
            {customTemplate && customTemplate.customNote && (
              <div 
                className="mt-3 pt-1.5 border-t border-dashed text-center text-[9px] font-semibold tracking-wider uppercase opacity-85"
                style={{ borderColor: customTemplate.textColor }}
              >
                {customTemplate.customNote}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center max-w-sm">
          Esta etiqueta utiliza la plantilla <strong>{customTemplate ? customTemplate.name : selectedTemplate.name}</strong>, diseñada para ser perfectamente legible y ergonómica.
        </p>
      </div>
    </div>
  );
};
