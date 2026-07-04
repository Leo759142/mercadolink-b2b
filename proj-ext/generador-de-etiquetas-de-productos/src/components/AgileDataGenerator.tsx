import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Product, UserLabelTemplate, CATEGORIES, RANDOM_PRODUCT_IMAGES } from '../types';
import { 
  Sparkles, 
  Check, 
  Shuffle, 
  Plus, 
  RotateCcw, 
  Package, 
  Palette, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  Trash2,
  ListPlus,
  Compass,
  LayoutGrid
} from 'lucide-react';

interface AgileDataGeneratorProps {
  currentUser: any;
  products: Product[];
  customTemplates: UserLabelTemplate[];
}

const DEFAULT_TERMS = [
  'Premium', 'Gamer', 'Eco', 'Pro', 'Smart', 'Ultra', 'Artesanal', 'Deluxe',
  'Gourmet', 'Vintage', 'Cyber', 'Minimal', 'Organic', 'Compact', 'Aura', 'Sport',
  'Titan', 'Carbon', 'Turbo', 'Bio', 'Nordic', 'Pocket', 'Active', 'Infinite',
  'Pure', 'Solar', 'Sonic', 'Thermal', 'Neon', 'Studio', 'Flex', 'Zen'
];

const PRODUCT_NOUNS = [
  'Teclado', 'Audífonos', 'Café', 'Mochila', 'Reloj', 'Botella', 'Zapatillas', 'Cargador',
  'Silla', 'Monitor', 'Mouse', 'Lámpara', 'Altavoz', 'Cámara', 'Lentes', 'Billetera',
  'Soporte', 'Organizador', 'Báscula', 'Termómetro', 'Enfriador', 'Proyector', 'Adaptador', 'Maceta'
];

const BRANDS = [
  'AuraTech', 'Krypton', 'Veloce', 'Acoustics', 'EcoLife', 'Andes', 'Titan Tools', 'NeoVibe',
  'Element', 'Solfeggio', 'Zenith', 'Volta', 'Lumen', 'Gravity', 'Terra', 'Summit'
];

const TEMPLATE_PRESETS = [
  { name: 'Eco Kraft Orgánico', bg: '#F5E6CA', text: '#3E2723', border: '#8D6E63', style: 'dashed', radius: 12, icon: 'leaf', font: 'serif' },
  { name: 'Moda Soft Minimal', bg: '#FAF3F0', text: '#4A3F35', border: '#D4C5B9', style: 'solid', radius: 16, icon: 'none', font: 'sans' },
  { name: 'Gamer Cyber Neon', bg: '#090D16', text: '#00FFCC', border: '#00FFCC', style: 'solid', radius: 8, icon: 'premium', font: 'mono' },
  { name: 'Industrial Robusto', bg: '#F9D923', text: '#1E1E1E', border: '#1E1E1E', style: 'double', radius: 0, icon: 'star', font: 'mono' },
  { name: 'VIP Golden Crown', bg: '#111827', text: '#FBBF24', border: '#FBBF24', style: 'solid', radius: 16, icon: 'crown', font: 'serif' },
  { name: 'Verificado Escandinavo', bg: '#F3F4F6', text: '#1F2937', border: '#4B5563', style: 'dotted', radius: 24, icon: 'check', font: 'sans' }
];

export const AgileDataGenerator: React.FC<AgileDataGeneratorProps> = ({ currentUser, products, customTemplates }) => {
  const [terms, setTerms] = useState<string[]>(DEFAULT_TERMS);
  const [selectedTerms, setSelectedTerms] = useState<Record<string, boolean>>(
    DEFAULT_TERMS.reduce((acc, term) => ({ ...acc, [term]: true }), {})
  );
  const [newTerm, setNewTerm] = useState('');
  const [quantityToGenerate, setQuantityToGenerate] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Single Playground Sandbox Live Product Preview
  const [sandboxProduct, setSandboxProduct] = useState<{
    name: string;
    sku: string;
    brand: string;
    category: string;
    price: number;
    stock: number;
    templateId: string;
  } | null>(null);

  const handleToggleTerm = (term: string) => {
    setSelectedTerms(prev => ({ ...prev, [term]: !prev[term] }));
  };

  const handleAddCustomTerm = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTerm.trim();
    if (!clean) return;
    if (terms.includes(clean)) {
      setErrorMessage("El término comercial ya existe en la lista.");
      return;
    }
    if (terms.length >= 48) {
      setErrorMessage("Has alcanzado el límite máximo de términos para mantener agilidad.");
      return;
    }
    setTerms(prev => [...prev, clean]);
    setSelectedTerms(prev => ({ ...prev, [clean]: true }));
    setNewTerm('');
    setErrorMessage(null);
  };

  const handleResetTerms = () => {
    setTerms(DEFAULT_TERMS);
    setSelectedTerms(DEFAULT_TERMS.reduce((acc, term) => ({ ...acc, [term]: true }), {}));
    setErrorMessage(null);
  };

  const handleSelectAllTerms = (val: boolean) => {
    const next: Record<string, boolean> = {};
    terms.forEach(t => {
      next[t] = val;
    });
    setSelectedTerms(next);
  };

  const handleShuffleTerms = () => {
    // Randomly select about 50% of the terms
    const next: Record<string, boolean> = {};
    terms.forEach(t => {
      next[t] = Math.random() > 0.5;
    });
    setSelectedTerms(next);
  };

  const getRandomActiveTerms = (count: number = 2): string[] => {
    const active = terms.filter(t => selectedTerms[t]);
    if (active.length === 0) return ['Premium', 'Pro'];
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  const generateSingleProductData = (): Partial<Product> => {
    const selectedWords = getRandomActiveTerms(2);
    const noun = PRODUCT_NOUNS[Math.floor(Math.random() * PRODUCT_NOUNS.length)];
    
    // Formulate a beautiful product name like "Audífonos Ultra Pro"
    const name = `${noun} ${selectedWords.join(' ')}`;
    
    // Generate valid random SKU
    const randSku = `SKU-${selectedWords[0].substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    
    const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
    const category = CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1))]; // avoid 'Others' if possible
    
    // Price range: 9.99 to 299.99
    const price = Number((9.99 + Math.random() * 290).toFixed(2));
    
    // Stock/Lote level: 5 to 150
    const stock = Math.floor(5 + Math.random() * 145);
    
    // Assign random default template
    const templateIds = ['classic', 'modern', 'minimal', 'neon', 'industrial', 'badge'];
    const templateId = templateIds[Math.floor(Math.random() * templateIds.length)];

    return {
      name,
      sku: randSku,
      brand,
      category,
      price,
      stock,
      imageUrl: RANDOM_PRODUCT_IMAGES[Math.floor(Math.random() * RANDOM_PRODUCT_IMAGES.length)],
      description: `Dispositivo de diseño ${selectedWords.join(' y ')} de alto rendimiento comercial. Empacado y verificado en lote industrial.`,
      templateId
    };
  };

  // Generate sandbox single live preview item
  const handleRandomizeSandbox = () => {
    const data = generateSingleProductData();
    setSandboxProduct({
      name: data.name!,
      sku: data.sku!,
      brand: data.brand!,
      category: data.category!,
      price: data.price!,
      stock: data.stock!,
      templateId: data.templateId!
    });
  };

  // Save Sandbox item to Firestore catalog
  const handleSaveSandbox = async () => {
    if (!currentUser || !sandboxProduct) return;
    setIsGenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const path = 'products';
    try {
      const docRef = doc(collection(db, path));
      await setDoc(docRef, {
        ...sandboxProduct,
        id: docRef.id,
        imageUrl: RANDOM_PRODUCT_IMAGES[Math.floor(Math.random() * RANDOM_PRODUCT_IMAGES.length)],
        description: `Artículo único de prueba generado con el simulador ágil de catálogo.`,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccessMessage(`¡Producto "${sandboxProduct.name}" agregado con éxito al catálogo real!`);
      setSandboxProduct(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("No se pudo guardar el producto del Sandbox.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk Generator for Products & Lot Stock Levels
  const handleBulkGenerateProducts = async () => {
    if (!currentUser) return;
    setIsGenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const path = 'products';
    let count = 0;

    try {
      for (let i = 0; i < quantityToGenerate; i++) {
        const prodData = generateSingleProductData();
        const docRef = doc(collection(db, path));
        await setDoc(docRef, {
          ...prodData,
          id: docRef.id,
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      }
      setSuccessMessage(`¡Se han inyectado con éxito ${count} nuevos productos y lotes de inventario de manera ágil!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error bulk generating products:", err);
      setErrorMessage("Error de permisos o base de datos al inyectar lote.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk Generator for beautiful Custom Templates
  const handleBulkGenerateTemplates = async () => {
    if (!currentUser) return;
    setIsGenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const path = 'templates';
    let count = 0;

    try {
      // Pick 3 random presets and upload them as custom user templates
      const selectedPresets = [...TEMPLATE_PRESETS].sort(() => Math.random() - 0.5).slice(0, 3);

      for (const preset of selectedPresets) {
        const docRef = doc(collection(db, path));
        const payload: Partial<UserLabelTemplate> = {
          name: `${preset.name} (Simulado)`,
          description: `Plantilla comercial de etiquetado creada ágilmente mediante simulación de marcas.`,
          backgroundColor: preset.bg,
          textColor: preset.text,
          borderColor: preset.border,
          borderStyle: preset.style as any,
          borderWidth: 2,
          borderRadius: preset.radius,
          paddingStyle: 'normal',
          fontSizeStyle: 'standard',
          badgeIcon: preset.icon as any,
          fontFamily: preset.font as any,
          showName: true,
          showPrice: true,
          showSku: true,
          showBrand: true,
          showCategory: true,
          showBarcode: true,
          customNote: 'Calidad Premium Lote 2026',
          ownerId: currentUser.uid,
        };

        await setDoc(docRef, {
          ...payload,
          id: docRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      }
      setSuccessMessage(`¡Se han creado con éxito ${count} nuevas plantillas de etiquetado de alta fidelidad!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error generating templates:", err);
      setErrorMessage("No se pudieron inyectar las plantillas simuladas.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8" id="agile-data-workspace">
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" /> Simulador de Catálogo y Carga Ágil
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Generador de Datos de Prueba
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Aumenta el volumen de tu catálogo de productos, lotes de inventario y diseños de plantillas de forma ágil utilizando algoritmos de combinación sobre un diccionario de términos comerciales reales.
          </p>
        </div>
        <LayoutGrid className="hidden lg:block absolute right-12 top-4 h-32 w-32 text-indigo-800/20 stroke-[1.5]" />
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <span className="shrink-0 font-bold text-lg">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Term Board */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Compass className="h-4 w-4 text-indigo-600" />
                  Diccionario de Términos Comerciales ({terms.length})
                </h3>
                <p className="text-[10px] text-slate-400">Los términos seleccionados (verde) se usarán para generar nombres de productos de forma aleatoria.</p>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleShuffleTerms}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition"
                  title="Mezclar selección"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetTerms}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition"
                  title="Restablecer diccionario por defecto"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Terms List Grid */}
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                {terms.map((term) => {
                  const active = selectedTerms[term];
                  return (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleToggleTerm(term)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5 select-none ${
                        active
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-xs font-bold'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {term}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons for Terms */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllTerms(true)}
                    className="text-[10px] text-indigo-600 font-bold uppercase hover:underline"
                  >
                    Activar Todos
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllTerms(false)}
                    className="text-[10px] text-slate-500 font-bold uppercase hover:underline"
                  >
                    Desactivar Todos
                  </button>
                </div>

                {/* Add Custom Term */}
                <form onSubmit={handleAddCustomTerm} className="flex gap-2 w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="Nuevo término comercial..."
                    maxLength={15}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Interactive Automation Seeders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Products & Stock Lot Seeder */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">Inyección de Productos y Lotes</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Genera múltiples artículos comerciales aleatorios con stock de lotes fluctuante y SKUs únicos válidos.</p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cantidad de productos a generar</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantityToGenerate(num)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          quantityToGenerate === num
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleBulkGenerateProducts}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:bg-indigo-300"
                >
                  <ListPlus className="h-4 w-4" /> Inyectar Catálogo
                </button>
              </div>
            </div>

            {/* Templates Custom Seeder */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Palette className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">Creador Ágil de Plantillas</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Inyecta un trío de plantillas prediseñadas con combinaciones estéticas sofisticadas (fondos, fuentes, bordes y sellos premium).</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleBulkGenerateTemplates}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:bg-amber-300"
                >
                  <Sparkles className="h-4 w-4" /> Generar Diseños
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Playground Sandbox Live Generator Preview */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 animate-spin" />
                Playground Sandbox Aleatorio
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Fórmula Única</span>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-slate-500 leading-relaxed">
                ¿Prefieres ver el resultado paso a paso? Haz clic en "Mezclar" para formular un único artículo comercial con stock e información de prueba antes de guardarlo en tu catálogo.
              </p>

              {sandboxProduct ? (
                <div className="space-y-4 animate-scaleUp">
                  {/* Visual mockup card of simulated result */}
                  <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 uppercase tracking-widest border border-indigo-500/10">
                        {sandboxProduct.category}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">{sandboxProduct.sku}</span>
                    </div>

                    <h4 className="text-base font-extrabold tracking-tight leading-tight">
                      {sandboxProduct.name}
                    </h4>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Precio Propuesto</span>
                        <span className="font-mono text-lg font-bold text-emerald-400">${sandboxProduct.price.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block uppercase">Stock de Lote</span>
                        <span className="font-mono text-sm font-bold text-slate-200">{sandboxProduct.stock} unidades</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">Marca: {sandboxProduct.brand}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRandomizeSandbox}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <Shuffle className="h-3.5 w-3.5" /> Volver a Mezclar
                    </button>
                    <button
                      onClick={handleSaveSandbox}
                      disabled={isGenerating}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1 uppercase tracking-wider"
                    >
                      <Check className="h-3.5 w-3.5" /> Guardar Producto
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRandomizeSandbox}
                  className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 transition group space-y-2 bg-slate-50/50"
                >
                  <Shuffle className="h-8 w-8 text-slate-300 group-hover:rotate-45 transition duration-300" />
                  <span className="text-xs font-bold uppercase tracking-wider">Mezclar un artículo de prueba</span>
                  <p className="text-[10px] text-slate-400 text-center max-w-[200px]">Combina dinámicamente términos activos y genera un SKU y un precio ficticio.</p>
                </button>
              )}

              {/* Status information of catalog */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado Comercial de la Aplicación</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-xl font-mono font-black text-slate-800">{products.length}</span>
                    <span className="text-[9px] text-slate-400 font-medium uppercase">Productos en Catálogo</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="block text-xl font-mono font-black text-slate-800">{customTemplates.length}</span>
                    <span className="text-[9px] text-slate-400 font-medium uppercase">Plantillas Personalizadas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
