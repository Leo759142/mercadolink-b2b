import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  Tag, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Printer, 
  Download, 
  RefreshCw, 
  Layers, 
  Check, 
  ChevronRight, 
  X,
  Code,
  Eye,
  Info,
  User,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { Provider, Product, Order, ThymeleafTemplate } from '../types';

interface ThymeleafManagerProps {
  providers: Provider[];
  products: Product[];
  orders: Order[];
  onShowToast: (msg: string) => void;
}

const DEFAULT_TEMPLATES: ThymeleafTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Etiqueta de Trazabilidad Rústica (Sacos)',
    target: 'productores',
    description: 'Etiqueta oficial de trazabilidad para fijar en sacos de papas y hortalizas, permitiendo a los compradores escanear y verificar el origen.',
    code: `<div class="p-6 bg-[#3a281a] border-4 border-dashed border-[#8b6d47] rounded-lg text-[#f0e6d2] font-serif max-w-md mx-auto shadow-inner relative overflow-hidden">
  <!-- Fondo con textura de grano rústico simulado -->
  <div class="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d4a35e_1px,transparent_1px)] [background-size:12px_12px]"></div>

  <div class="text-center border-b border-[#8b6d47]/60 pb-3 mb-4">
    <span class="text-xs font-mono text-[#d4a35e] uppercase tracking-widest block mb-1">MERCADOLINK B2B COOPERATIVO</span>
    <h2 class="text-xl font-bold uppercase tracking-wider text-[#d4a35e]">Etiqueta de Origen</h2>
    <p class="text-[9px] font-mono text-[#c9b494]">SISTEMA DE ASIGNACIÓN DIRECTA DE CHACRA</p>
  </div>

  <div class="grid grid-cols-2 gap-3 text-xs font-sans mb-4">
    <div>
      <span class="block text-[10px] uppercase font-mono text-[#c9b494]">Productor Rural:</span>
      <strong class="text-sm text-[#f0e6d2]" th:text="\${producer.name}">María Huayhua</strong>
    </div>
    <div>
      <span class="block text-[10px] uppercase font-mono text-[#c9b494]">Zona / Origen:</span>
      <span class="text-[#f0e6d2] font-medium" th:text="\${producer.location}">Valle de Jauja, Junín</span>
    </div>
    <div>
      <span class="block text-[10px] uppercase font-mono text-[#c9b494]">Sección de Abasto:</span>
      <span class="text-[#f0e6d2]" th:text="\${producer.section}">Pabellón A - Puesto 12</span>
    </div>
    <div>
      <span class="block text-[10px] uppercase font-mono text-[#c9b494]">Estado Suministro:</span>
      <span class="text-[#7cae5f] font-mono font-bold" th:text="\${producer.status}">ACTIVO</span>
    </div>
  </div>

  <div class="border-t border-[#8b6d47]/40 pt-3">
    <span class="block text-[10px] uppercase font-mono text-[#c9b494] mb-2">Cultivos Certificados de Temporada:</span>
    <ul class="list-disc pl-4 font-sans text-xs space-y-1 text-[#f0e6d2]/90">
      <li th:each="crop : \${producer.crops}" th:text="\${crop}">Papa Amarilla</li>
    </ul>
  </div>

  <div class="text-center mt-5 pt-3 border-t border-dashed border-[#8b6d47]/40 text-[9px] font-mono text-[#c9b494]">
    DESPACHADO EN FLETE DIRECTO SIN INTERMEDIARIOS
  </div>
</div>`,
    tags: ['Trazabilidad', 'Impresión', 'Sacos', 'Andino'],
    lastModified: '2026-07-04'
  },
  {
    id: 'tpl-2',
    name: 'Ficha Técnica del Proveedor Frutícola',
    target: 'proveedores',
    description: 'Ficha con especificación de contacto, cultivos perennes e información logística para la cartelera de despacho de transportistas.',
    code: `<div class="p-6 bg-[#3a281a] border-2 border-[#8b6d47] rounded-md text-[#f0e6d2] max-w-md mx-auto">
  <div class="flex justify-between items-start border-b border-[#8b6d47]/80 pb-3 mb-4">
    <div>
      <h3 class="text-lg font-bold text-[#e8c15e] font-serif" th:text="\${provider.name}">Rómulo Quispe</h3>
      <p class="text-[10px] font-mono text-[#c9b494]">Productor Líder de Selva Central</p>
    </div>
    <span class="text-[9px] font-mono text-[#d4a35e] uppercase tracking-wider border border-[#d4a35e] px-1.5 py-0.5 rounded" th:text="\${provider.status}">ACTIVO</span>
  </div>

  <div class="space-y-3 font-sans text-xs">
    <div>
      <span class="text-[#c9b494] block text-[9px] uppercase font-mono">Ubicación y Fundo:</span>
      <p class="text-sm font-semibold" th:text="\${provider.location}">Chanchamayo, Junín</p>
    </div>
    <div>
      <span class="text-[#c9b494] block text-[9px] uppercase font-mono">Contacto Telefónico:</span>
      <p class="text-sm font-semibold text-[#d4a35e]" th:text="\${provider.phone}">+51 912 345 678</p>
    </div>
    <div>
      <span class="text-[#c9b494] block text-[9px] uppercase font-mono">Puesto de Acopio:</span>
      <p class="text-sm text-[#f0e6d2]" th:text="\${provider.section}">Pabellón C - Puesto 04</p>
    </div>
  </div>

  <div class="mt-4 pt-3 border-t border-[#8b6d47]/40 bg-black/10 p-2.5 rounded">
    <p class="text-[10px] font-sans text-[#c9b494] leading-normal italic">
      "Socio estratégico registrado bajo la plataforma de Comercio Justo B2B para abastecimiento de mercados populares."
    </p>
  </div>
</div>`,
    tags: ['Logística', 'Contacto', 'Selva Central'],
    lastModified: '2026-07-04'
  },
  {
    id: 'tpl-3',
    name: 'Cartilla de Precios de Puesto',
    target: 'productos',
    description: 'Cartelera de precios para exhibir en el pabellón de venta mayorista. Renders automáticos con stock y unidad de venta.',
    code: `<div class="p-6 bg-[#3a281a] border-4 border-[#5d462d] rounded-lg text-[#f0e6d2] max-w-md mx-auto shadow-lg">
  <div class="text-center mb-5">
    <span class="text-xs font-mono text-[#e8c15e] uppercase tracking-widest block">CATÁLOGO DE PRODUCTO</span>
    <h3 class="text-2xl font-serif font-extrabold text-[#d4a35e]" th:text="\${product.name}">Papa Amarilla Tumbay</h3>
    <p class="text-[10px] font-sans text-[#c9b494] uppercase" th:text="\${product.category}">Tubérculos</p>
  </div>

  <div class="grid grid-cols-2 gap-3 font-sans text-xs mb-4">
    <div class="bg-black/15 p-2 rounded border border-[#8b6d47]/30 text-center">
      <span class="text-[9px] block uppercase font-mono text-[#c9b494]">Precio Unitario:</span>
      <strong class="text-base text-[#7cae5f]" th:text="\${'S/ ' + product.price + ' por ' + product.unit}">S/ 3.80 por kg</strong>
    </div>
    <div class="bg-black/15 p-2 rounded border border-[#8b6d47]/30 text-center">
      <span class="text-[9px] block uppercase font-mono text-[#c9b494]">Stock Disponible:</span>
      <strong class="text-base text-[#e8c15e]" th:text="\${product.stock + ' ' + product.unit}">1200 kg</strong>
    </div>
  </div>

  <div class="border-t border-[#8b6d47]/40 pt-3">
    <span class="text-[9px] block uppercase font-mono text-[#c9b494] mb-1">Descripción y Origen del Lote:</span>
    <p class="text-xs font-serif italic text-[#f0e6d2]/90 leading-relaxed" th:text="\${product.description}">
      Papa de textura arenosa perfecta para puré, causa limeña y frituras. Cultivada a más de 3,200 msnm.
    </p>
  </div>
</div>`,
    tags: ['Precios', 'Exhibición', 'Ventas'],
    lastModified: '2026-07-04'
  },
  {
    id: 'tpl-4',
    name: 'Guía de Flete y Despacho Rural',
    target: 'pedidos',
    description: 'Documento impreso que viaja con el camionero. Lista el producto, cantidad, precio pactado y estado de la coordinación.',
    code: `<div class="p-5 bg-[#342417] border-2 border-dashed border-[#8b6d47] rounded-lg text-[#f0e6d2] font-serif max-w-md mx-auto">
  <div class="flex justify-between items-center border-b-2 border-[#8b6d47]/60 pb-3 mb-3">
    <div>
      <h4 class="text-base font-bold text-[#d4a35e] tracking-wide">GUÍA DE DESPACHO RÚSTICA</h4>
      <p class="text-[10px] font-mono text-[#c9b494]">Guía ID: <span th:text="\${order.id}">#ord-101</span></p>
    </div>
    <span class="text-[9px] bg-[#d4a35e]/15 text-[#e8c15e] border border-[#d4a35e]/40 px-1.5 py-0.5 rounded font-mono font-bold uppercase" th:text="\${order.status}">PENDIENTE</span>
  </div>

  <div class="grid grid-cols-2 gap-3 font-sans text-xs mb-3">
    <div>
      <span class="text-[#c9b494] block text-[9px] uppercase font-mono">Producto Transportado:</span>
      <p class="text-sm font-semibold text-[#f0e6d2]" th:text="\${order.productName}">Papa Amarilla Tumbay</p>
    </div>
    <div>
      <span class="text-[#c9b494] block text-[9px] uppercase font-mono">Cantidad Cargada:</span>
      <p class="text-sm font-semibold text-[#f0e6d2]" th:text="\${order.quantity}">300 kg</p>
    </div>
    <div>
      <span class="text-[#c9b494] block text-[9px] uppercase font-mono">Total a Liquidar:</span>
      <p class="text-sm font-bold text-[#7cae5f]" th:text="\${'S/ ' + order.totalPrice}">S/ 1,140.00</p>
    </div>
    <div>
      <span class="text-[#c9b494] block text-[9px] uppercase font-mono">Fecha de Registro:</span>
      <p class="text-sm text-[#f0e6d2]" th:text="\${order.date}">2026-07-04</p>
    </div>
  </div>

  <div class="bg-black/20 p-2 border border-[#8b6d47]/20 rounded text-center text-[9px] font-mono text-[#c9b494] mt-3">
    MERCADOLINK TRASLADO DIRECTO DEL PRODUCTOR AL PUESTO DE MERCADO
  </div>
</div>`,
    tags: ['Camión', 'Logística', 'Guía'],
    lastModified: '2026-07-04'
  }
];

export default function ThymeleafManager({ providers, products, orders, onShowToast }: ThymeleafManagerProps) {
  const [templates, setTemplates] = useState<ThymeleafTemplate[]>(() => {
    const saved = localStorage.getItem('ml_thymeleaf_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_TEMPLATES;
      }
    }
    return DEFAULT_TEMPLATES;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'productores' | 'proveedores' | 'productos' | 'pedidos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ThymeleafTemplate>(templates[0] || DEFAULT_TEMPLATES[0]);
  const [editorMode, setEditorMode] = useState<'view' | 'edit' | 'create'>('view');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    target: 'productores' as 'productores' | 'proveedores' | 'productos' | 'pedidos',
    description: '',
    code: '',
    tagsString: ''
  });

  // Dynamic Context State for Live Rendering
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || 'prov-1');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'prod-1');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || 'ord-1');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ml_thymeleaf_templates', JSON.stringify(templates));
  }, [templates]);

  // All unique tags across all templates
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    const matchesTarget = activeFilter === 'all' || t.target === activeFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || t.tags.includes(selectedTag);
    return matchesTarget && matchesSearch && matchesTag;
  });

  // Reset selected template if filtered out
  useEffect(() => {
    if (filteredTemplates.length > 0 && !filteredTemplates.some(t => t.id === selectedTemplate.id)) {
      setSelectedTemplate(filteredTemplates[0]);
    }
  }, [activeFilter, searchQuery, selectedTag, templates]);

  // Set up editor form when opening edit
  const handleOpenEdit = () => {
    setFormData({
      name: selectedTemplate.name,
      target: selectedTemplate.target,
      description: selectedTemplate.description,
      code: selectedTemplate.code,
      tagsString: selectedTemplate.tags.join(', ')
    });
    setEditorMode('edit');
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      target: 'productores',
      description: '',
      code: DEFAULT_TEMPLATES[0].code,
      tagsString: 'Nuevo, Impresión'
    });
    setEditorMode('create');
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      alert('Debe mantener al menos una plantilla registrada.');
      return;
    }
    if (confirm('¿Está seguro de eliminar esta plantilla Thymeleaf?')) {
      const remaining = templates.filter(t => t.id !== id);
      setTemplates(remaining);
      setSelectedTemplate(remaining[0]);
      onShowToast('Plantilla eliminada con éxito.');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Complete los campos obligatorios.');
      return;
    }

    const cleanTags = formData.tagsString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (editorMode === 'edit') {
      const updated = templates.map(t => {
        if (t.id === selectedTemplate.id) {
          const u: ThymeleafTemplate = {
            ...t,
            name: formData.name,
            target: formData.target,
            description: formData.description,
            code: formData.code,
            tags: cleanTags,
            lastModified: new Date().toISOString().split('T')[0]
          };
          return u;
        }
        return t;
      });
      setTemplates(updated);
      const found = updated.find(u => u.id === selectedTemplate.id);
      if (found) setSelectedTemplate(found);
      setEditorMode('view');
      onShowToast('Plantilla actualizada.');
    } else if (editorMode === 'create') {
      const newTpl: ThymeleafTemplate = {
        id: `tpl-${Date.now()}`,
        name: formData.name,
        target: formData.target,
        description: formData.description,
        code: formData.code,
        tags: cleanTags,
        lastModified: new Date().toISOString().split('T')[0]
      };
      setTemplates([...templates, newTpl]);
      setSelectedTemplate(newTpl);
      setEditorMode('view');
      onShowToast('Nueva plantilla Thymeleaf creada.');
    }
  };

  // MINI THYMELEAF INTERPRETER
  const evaluateThymeleaf = (code: string): string => {
    try {
      let result = code;

      // 1. Determine active record context based on template target
      const currentProvider = providers.find(p => p.id === selectedProviderId) || providers[0] || {
        id: 'prov-1', name: 'María Huayhua', phone: '+51 987 654 321', location: 'Valle de Jauja, Junín', section: 'Pabellón A', crops: ['Papas Nativas'], status: 'active'
      };

      const currentProduct = products.find(p => p.id === selectedProductId) || products[0] || {
        id: 'prod-1', name: 'Papa Amarilla', category: 'Tubérculos', price: 3.5, unit: 'kg', stock: 100, description: 'Papa rústica'
      };

      const currentOrder = orders.find(o => o.id === selectedOrderId) || orders[0] || {
        id: 'ord-1', sellerId: 'sell-1', providerId: 'prov-1', productId: 'prod-1', productName: 'Papa Amarilla', quantity: 100, totalPrice: 350, status: 'pendiente', date: '2026-07-04', deliveryDate: '2026-07-05'
      };

      // 2. Mock rendering logic for th:each attributes
      // e.g., <li th:each="crop : ${producer.crops}" th:text="${crop}">crop</li>
      // Simple custom regex to locate elements with th:each
      const eachRegex = /<([a-zA-Z0-9]+)\s+[^>]*th:each="([^"]+)"\s*([^>]*)>([\s\S]*?)<\/\1>/gi;
      
      result = result.replace(eachRegex, (match, tagName, eachExpr, attributes, innerContent) => {
        // Parse "crop : ${producer.crops}"
        const parts = eachExpr.split(':').map((s: string) => s.trim());
        if (parts.length === 2) {
          const varName = parts[0];
          const collectionExpr = parts[1]; // e.g. "${producer.crops}"

          let listToIterate: string[] = [];
          if (collectionExpr.includes('producer.crops') || collectionExpr.includes('provider.crops')) {
            listToIterate = currentProvider.crops;
          } else {
            listToIterate = ['Oca de Oro', 'Papa Ccompis', 'Mashua Púrpura'];
          }

          // Generate tags for each item
          return listToIterate.map(item => {
            // Reconstruct element
            let elementAttr = attributes;
            // Remove any other th: attributes from the repeated element
            elementAttr = elementAttr.replace(/th:[a-zA-Z0-9_-]+="[^"]*"/g, '').trim();

            // Evaluate th:text if inside
            let evaluatedText = innerContent;
            if (elementAttr.includes('th:text')) {
              evaluatedText = item;
              elementAttr = elementAttr.replace(/th:text="[^"]*"/g, '').trim();
            } else if (match.includes('th:text')) {
              // The text is on the element itself
              evaluatedText = item;
            }

            const space = elementAttr ? ' ' : '';
            return `<${tagName}${space}${elementAttr}>${evaluatedText}</${tagName}>`;
          }).join('\n      ');
        }
        return match;
      });

      // 3. Process th:text properties: e.g. th:text="${producer.name}"
      // Match pattern like th:text="${...}" inside a tag, or th:text="${...}" as an attribute
      const textAttrRegex = /<([a-zA-Z0-9]+)(\s+[^>]*?)th:text="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/gi;
      result = result.replace(textAttrRegex, (match, tagName, leadingAttrs, expr, trailingAttrs, innerContent) => {
        let replacement = innerContent;
        const cleanExpr = expr.trim();

        // Evaluate expression
        if (cleanExpr.includes('producer.name') || cleanExpr.includes('provider.name')) {
          replacement = currentProvider.name;
        } else if (cleanExpr.includes('producer.location') || cleanExpr.includes('provider.location')) {
          replacement = currentProvider.location;
        } else if (cleanExpr.includes('producer.phone') || cleanExpr.includes('provider.phone')) {
          replacement = currentProvider.phone;
        } else if (cleanExpr.includes('producer.section') || cleanExpr.includes('provider.section')) {
          replacement = currentProvider.section;
        } else if (cleanExpr.includes('producer.status') || cleanExpr.includes('provider.status')) {
          replacement = currentProvider.status === 'active' ? 'ACTIVO' : 'INACTIVO';
        } else if (cleanExpr.includes('product.name')) {
          replacement = currentProduct.name;
        } else if (cleanExpr.includes('product.category')) {
          replacement = currentProduct.category;
        } else if (cleanExpr.includes('product.price')) {
          replacement = `S/ ${currentProduct.price.toFixed(2)}`;
        } else if (cleanExpr.includes('product.unit')) {
          replacement = currentProduct.unit;
        } else if (cleanExpr.includes('product.stock')) {
          replacement = currentProduct.stock.toString();
        } else if (cleanExpr.includes('product.description')) {
          replacement = currentProduct.description;
        } else if (cleanExpr.includes('order.id')) {
          replacement = currentOrder.id;
        } else if (cleanExpr.includes('order.productName')) {
          replacement = currentOrder.productName;
        } else if (cleanExpr.includes('order.quantity')) {
          replacement = `${currentOrder.quantity} unidades`;
        } else if (cleanExpr.includes('order.totalPrice')) {
          replacement = `S/ ${currentOrder.totalPrice.toFixed(2)}`;
        } else if (cleanExpr.includes('order.status')) {
          replacement = currentOrder.status.toUpperCase();
        } else if (cleanExpr.includes('order.date')) {
          replacement = currentOrder.date;
        } else if (cleanExpr.includes("'S/ ' + product.price + ' por ' + product.unit")) {
          replacement = `S/ ${currentProduct.price.toFixed(2)} por ${currentProduct.unit}`;
        } else if (cleanExpr.includes("product.stock + ' ' + product.unit")) {
          replacement = `${currentProduct.stock} ${currentProduct.unit}`;
        } else if (cleanExpr.includes("'S/ ' + order.totalPrice")) {
          replacement = `S/ ${currentOrder.totalPrice.toFixed(2)}`;
        }

        // Clean up th:text attribute
        const cleanAttrs = (leadingAttrs + trailingAttrs).replace(/\s+/g, ' ').trim();
        const space = cleanAttrs ? ' ' : '';
        return `<${tagName}${space}${cleanAttrs}>${replacement}</${tagName}>`;
      });

      // 4. Fallback: replace any nested th:text or th:utext matches in raw text blocks
      const spanReplaceRegex = /<span([^>]*)th:text="([^"]+)"[^>]*>.*?<\/span>/gi;
      result = result.replace(spanReplaceRegex, (match, attrs, expr) => {
        let val = '';
        if (expr.includes('order.id')) val = currentOrder.id;
        else if (expr.includes('order.status')) val = currentOrder.status;
        else if (expr.includes('producer.name')) val = currentProvider.name;
        else val = expr;
        return `<span${attrs}>${val}</span>`;
      });

      return result;
    } catch (err) {
      return `<div class="p-4 bg-red-950 text-red-200 border border-red-800 rounded">Error de parseo Thymeleaf: ${(err as Error).message}</div>`;
    }
  };

  const handlePrint = () => {
    // Elegant rustic print simulation alert
    alert(`[MERCADOLINK B2B - IMPRESIÓN RÚSTICA]
Generando archivo para ticketera o papel craft...
Imprimiendo plantilla: ${selectedTemplate.name}
Destinatario: ${selectedTemplate.target === 'productores' ? 'María Huayhua' : 'Flete de Carga'}
¡La plantilla Thymeleaf ha sido procesada de forma exitosa en el servidor!`);
  };

  return (
    <div className="bg-rustic-surface border-4 border-rustic-wood rounded-xl shadow-2xl p-4 sm:p-6 space-y-6">
      
      {/* Header and description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-rustic-border/50 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-6 h-6 text-rustic-accent" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-rustic-text">
              Espacio de Plantillas Thymeleaf
            </h3>
          </div>
          <p className="text-xs sm:text-sm font-sans text-rustic-muted mt-1 max-w-2xl">
            Gestión rústica de plantillas XML/HTML de Thymeleaf para autogenerar hojas de despacho, etiquetas de trazabilidad física y catálogos comerciales listos para imprimir en el campo o en el mercado.
          </p>
        </div>

        {editorMode === 'view' && (
          <button
            id="btn-create-template"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rustic-accent to-rustic-accent2 hover:brightness-110 text-rustic-bg font-sans font-bold text-xs rounded-lg transition-all cursor-pointer shadow border border-rustic-wood shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Plantilla</span>
          </button>
        )}
      </div>

      {/* Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Filter & list of templates (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* SEARCH & ACTIVE TARGET FILTERS */}
          <div className="bg-rustic-bg/40 p-3 rounded-lg border border-rustic-border/40 space-y-3">
            <div className="relative">
              <input
                id="search-templates-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar plantillas..."
                className="w-full bg-rustic-surface border border-rustic-border rounded-lg pl-9 pr-4 py-2 text-xs font-sans text-rustic-text focus:outline-none focus:border-rustic-accent placeholder-rustic-muted"
              />
              <Filter className="w-3.5 h-3.5 text-rustic-muted absolute left-3 top-3" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-rustic-muted hover:text-rustic-text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Target tabs */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded text-[10px] font-sans font-medium transition-all ${activeFilter === 'all' ? 'bg-rustic-accent text-rustic-bg' : 'bg-rustic-surface text-rustic-muted hover:text-rustic-text'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveFilter('productores')}
                className={`px-2.5 py-1 rounded text-[10px] font-sans font-medium transition-all ${activeFilter === 'productores' ? 'bg-rustic-accent text-rustic-bg' : 'bg-rustic-surface text-rustic-muted hover:text-rustic-text'}`}
              >
                Productores
              </button>
              <button
                onClick={() => setActiveFilter('proveedores')}
                className={`px-2.5 py-1 rounded text-[10px] font-sans font-medium transition-all ${activeFilter === 'proveedores' ? 'bg-rustic-accent text-rustic-bg' : 'bg-rustic-surface text-rustic-muted hover:text-rustic-text'}`}
              >
                Proveedores
              </button>
              <button
                onClick={() => setActiveFilter('productos')}
                className={`px-2.5 py-1 rounded text-[10px] font-sans font-medium transition-all ${activeFilter === 'productos' ? 'bg-rustic-accent text-rustic-bg' : 'bg-rustic-surface text-rustic-muted hover:text-rustic-text'}`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveFilter('pedidos')}
                className={`px-2.5 py-1 rounded text-[10px] font-sans font-medium transition-all ${activeFilter === 'pedidos' ? 'bg-rustic-accent text-rustic-bg' : 'bg-rustic-surface text-rustic-muted hover:text-rustic-text'}`}
              >
                Despachos
              </button>
            </div>
          </div>

          {/* TAG CLOUD (Requested filters and tags) */}
          <div className="bg-rustic-bg/25 p-3 rounded-lg border border-rustic-border/20">
            <span className="text-[10px] uppercase font-mono tracking-wider text-rustic-muted block mb-2">Filtrar por Etiqueta:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-sans transition-all flex items-center gap-1 border ${!selectedTag ? 'bg-rustic-accent2/35 text-rustic-text border-rustic-accent' : 'bg-transparent text-rustic-muted border-rustic-border/30 hover:border-rustic-muted'}`}
              >
                <Tag className="w-2.5 h-2.5" />
                <span>Todas</span>
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-sans transition-all flex items-center gap-1 border ${selectedTag === tag ? 'bg-rustic-accent text-rustic-bg font-bold border-rustic-accent' : 'bg-rustic-bg/40 text-rustic-muted border-rustic-border/20 hover:border-rustic-muted'}`}
                >
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TEMPLATES LIST */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 bg-rustic-bg/20 rounded-lg border border-rustic-border/10">
                <FileText className="w-8 h-8 text-rustic-border mx-auto opacity-40 mb-2" />
                <p className="text-xs text-rustic-muted font-sans">No hay plantillas con estos filtros.</p>
              </div>
            ) : (
              filteredTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => { setSelectedTemplate(tpl); setEditorMode('view'); }}
                  className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer text-left relative overflow-hidden group ${selectedTemplate.id === tpl.id ? 'bg-rustic-surface2/60 border-rustic-accent shadow-lg' : 'bg-rustic-bg/30 border-rustic-border/40 hover:border-rustic-border/80'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-rustic-text tracking-wide group-hover:text-rustic-accent transition-colors">
                      {tpl.name}
                    </h4>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-rustic-bg/60 text-rustic-muted border border-rustic-border/30 rounded">
                      {tpl.target}
                    </span>
                  </div>

                  <p className="text-[11px] text-rustic-muted line-clamp-2 font-sans mb-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.map(t => (
                      <span key={t} className="text-[9px] font-sans bg-rustic-surface/80 text-rustic-accent px-1.5 py-0.2 rounded border border-rustic-border/25">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Indicator lines */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rustic-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Code View, Interactive Live Preview or Editor Form (7 cols) */}
        <div className="lg:col-span-7">
          
          {editorMode === 'view' ? (
            <div className="bg-rustic-bg/40 border border-rustic-border/50 rounded-lg overflow-hidden flex flex-col h-full">
              
              {/* Header inside display pane */}
              <div className="bg-rustic-surface2/45 px-4 py-3 border-b border-rustic-border/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rustic-accent/15 text-rustic-accent text-[9px] font-mono border border-rustic-accent/30 rounded uppercase font-bold">
                    {selectedTemplate.target}
                  </span>
                  <span className="text-xs text-rustic-muted font-sans">
                    Modificado: {selectedTemplate.lastModified}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleOpenEdit}
                    className="p-1.5 bg-rustic-surface hover:bg-rustic-surface2 rounded text-rustic-muted hover:text-rustic-accent border border-rustic-border/40 transition-all cursor-pointer"
                    title="Editar Plantilla XML"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    className="p-1.5 bg-rustic-surface hover:bg-rustic-red/20 rounded text-rustic-muted hover:text-rustic-red border border-rustic-border/40 transition-all cursor-pointer"
                    title="Eliminar Plantilla"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* LIVE CONTEXT DATA SELECTOR - CRITICAL FEATURE */}
              <div className="p-3 bg-rustic-surface/30 border-b border-rustic-border/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-rustic-muted mb-1">
                    Cargar Contexto de Datos Reales:
                  </label>
                  {selectedTemplate.target === 'productores' || selectedTemplate.target === 'proveedores' ? (
                    <select
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                      className="w-full bg-rustic-surface border border-rustic-border rounded px-2 py-1 text-xs text-rustic-text focus:outline-none"
                    >
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                      ))}
                    </select>
                  ) : selectedTemplate.target === 'productos' ? (
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-rustic-surface border border-rustic-border rounded px-2 py-1 text-xs text-rustic-text focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - S/ {p.price}/ {p.unit}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      className="w-full bg-rustic-surface border border-rustic-border rounded px-2 py-1 text-xs text-rustic-text focus:outline-none"
                    >
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>Pedido #{o.id} ({o.productName})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-end justify-end gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rustic-surface hover:bg-rustic-surface2 border border-rustic-border rounded text-xs text-rustic-text font-bold transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir ticket</span>
                  </button>
                  <button
                    onClick={() => {
                      onShowToast('Simulando exportación de archivo HTML Thymeleaf para Spring Boot...');
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rustic-surface hover:bg-rustic-surface2 border border-rustic-border rounded text-xs text-rustic-text font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>

              {/* Tabs inside selector */}
              <div className="grid grid-cols-2 border-b border-rustic-border/30 text-xs font-sans">
                <div className="p-3 bg-rustic-surface text-center border-r border-rustic-border/30 text-rustic-accent font-bold">
                  <div className="inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Simulación Thymeleaf (HTML)</span>
                  </div>
                </div>
                <div className="p-3 bg-rustic-bg/70 text-center text-rustic-muted font-medium hover:text-rustic-text cursor-default">
                  <div className="inline-flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    <span>Sintaxis XML / Thymeleaf</span>
                  </div>
                </div>
              </div>

              {/* RENDER SPLIT PANEL */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-rustic-border/40 flex-grow max-h-[480px] overflow-y-auto">
                
                {/* Visual rendering output */}
                <div className="p-4 bg-[#23150c] flex flex-col justify-center min-h-[300px]">
                  <span className="text-[10px] uppercase font-mono text-rustic-muted block mb-3 text-center">
                    Vista Previa de Impresión Física:
                  </span>
                  
                  <div 
                    className="thymeleaf-preview-target"
                    dangerouslySetInnerHTML={{ __html: evaluateThymeleaf(selectedTemplate.code) }} 
                  />
                </div>

                {/* Plain Code view with line numbers */}
                <div className="p-4 bg-black/40 font-mono text-[10px] sm:text-xs text-rustic-muted overflow-x-auto leading-relaxed h-full select-all">
                  <span className="text-[10px] uppercase font-mono text-rustic-muted block mb-3">
                    Código de Plantilla (Edición de Atributos):
                  </span>
                  <pre className="text-[#a8a39a]">
                    {selectedTemplate.code.split('\n').map((line, i) => (
                      <div key={i} className="flex">
                        <span className="w-6 text-rustic-border/50 text-right select-none pr-2 font-sans">{i + 1}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>

              </div>
            </div>
          ) : (
            /* EDITOR FORM: CREATE OR EDIT TEMPLATE */
            <form onSubmit={handleSaveForm} className="bg-rustic-bg/40 border-2 border-rustic-accent rounded-lg p-4 sm:p-5 space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-rustic-border pb-2">
                <h4 className="text-sm font-bold text-rustic-yellow uppercase font-mono">
                  {editorMode === 'edit' ? 'Editar Plantilla Thymeleaf' : 'Registrar Nueva Plantilla'}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditorMode('view')}
                  className="p-1 hover:bg-rustic-surface2 text-rustic-muted hover:text-rustic-text rounded border border-rustic-border/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="block text-rustic-text font-bold">Nombre de la Plantilla *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Etiqueta de Caja de Frutas"
                    className="w-full bg-rustic-surface border border-rustic-border rounded px-2.5 py-1.5 text-rustic-text focus:outline-none focus:border-rustic-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-rustic-text font-bold">Entidad Destino (Target) *</label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                    className="w-full bg-rustic-surface border border-rustic-border rounded px-2.5 py-1.5 text-rustic-text focus:outline-none focus:border-rustic-accent"
                  >
                    <option value="productores">Productores Rurales (producer)</option>
                    <option value="proveedores">Proveedores / Agricultores (provider)</option>
                    <option value="productos">Catálogo de Productos (product)</option>
                    <option value="pedidos">Guias de Despacho (order)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs font-sans space-y-1">
                <label className="block text-rustic-text font-bold">Descripción del Formato</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explique el propósito de impresión de esta plantilla Thymeleaf."
                  rows={2}
                  className="w-full bg-rustic-surface border border-rustic-border rounded px-2.5 py-1.5 text-rustic-text focus:outline-none focus:border-rustic-accent"
                />
              </div>

              <div className="text-xs font-sans space-y-1">
                <label className="block text-rustic-text font-bold">Etiquetas / Filtros (separados por comas)</label>
                <input
                  type="text"
                  value={formData.tagsString}
                  onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                  placeholder="Impresión, Trazabilidad, Cusco, Camión"
                  className="w-full bg-rustic-surface border border-rustic-border rounded px-2.5 py-1.5 text-rustic-text focus:outline-none focus:border-rustic-accent"
                />
              </div>

              <div className="text-xs font-sans space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-rustic-text font-bold">Código HTML con Atributos Thymeleaf (th:text, th:each) *</label>
                  <span className="text-[9px] text-rustic-accent uppercase font-mono">Usa la sintaxis oficial</span>
                </div>
                <textarea
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  rows={10}
                  className="w-full bg-black/60 border border-rustic-border rounded p-3 text-xs text-[#a8a39a] font-mono focus:outline-none focus:border-rustic-accent leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditorMode('view')}
                  className="px-4 py-2 bg-rustic-surface hover:bg-rustic-surface2 text-rustic-text font-sans font-bold text-xs rounded border border-rustic-border transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rustic-green to-emerald-600 hover:brightness-110 text-white font-sans font-bold text-xs rounded shadow transition-all cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
