import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { Product, PricingSettings, Bundle, AVAILABLE_TEMPLATES } from '../types';
import { 
  Brain, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  HelpCircle,
  Activity,
  CheckCircle,
  Package,
  Sliders,
  Award,
  ChevronRight,
  TrendingUp as TrendUpIcon,
  PieChart,
  BarChart4,
  RefreshCw
} from 'lucide-react';

interface PricingIntelligenceProps {
  currentUser: any;
  products: Product[];
}

// Custom Category thresholds for economic clustering
// Category sensitivity mapping based on standard retail elasticity
const CATEGORY_ELASTICITY: Record<string, 'high' | 'medium' | 'low'> = {
  'Tecnología': 'medium',
  'Alimentos y Bebidas': 'high',
  'Ropa y Moda': 'high',
  'Hogar y Jardín': 'medium',
  'Salud y Belleza': 'low',
  'Herramientas': 'medium',
  'Juguetes y Hobbies': 'low',
  'Libros y Oficina': 'low',
  'Otros': 'medium'
};

export const PricingIntelligence: React.FC<PricingIntelligenceProps> = ({ currentUser, products }) => {
  // Settings State
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [markupFactor, setMarkupFactor] = useState(1.5);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [scarcityMarkup, setScarcityMarkup] = useState(0.15); // +15%
  const [highStockDiscount, setHighStockDiscount] = useState(0.20); // -20%
  const [bundleDiscount, setBundleDiscount] = useState(0.10); // -10%
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Bundles State
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [primaryProductId, setPrimaryProductId] = useState('');
  const [secondaryProductId, setSecondaryProductId] = useState('');
  const [bundleCustomTitle, setBundleCustomTitle] = useState('');
  const [customBundleDiscount, setCustomBundleDiscount] = useState(0.10);
  const [bundlesLoading, setBundlesLoading] = useState(true);
  const [bundleSaving, setBundleSaving] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [bundleSuccess, setBundleSuccess] = useState<string | null>(null);

  // Simulation State
  const [simulatedProductId, setSimulatedProductId] = useState('');
  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);
  const [elasticityFactor, setElasticityFactor] = useState(1.5); // Default elasticity multiplier
  const [simulatedPriceAdjustment, setSimulatedPriceAdjustment] = useState(0); // overall markup adjustment in %

  // Load Settings
  useEffect(() => {
    if (!currentUser) return;

    const settingsRef = doc(db, 'pricingSettings', currentUser.uid);
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PricingSettings;
        setSettings(data);
        setMarkupFactor(data.markupFactor ?? 1.5);
        setLowStockThreshold(data.lowStockThreshold ?? 5);
        setScarcityMarkup(data.scarcityMarkup ?? 0.15);
        setHighStockDiscount(data.highStockDiscount ?? 0.20);
        setBundleDiscount(data.bundleDiscount ?? 0.10);
      } else {
        setSettings({
          id: currentUser.uid,
          ownerId: currentUser.uid,
          markupFactor: 1.5,
          lowStockThreshold: 5,
          scarcityMarkup: 0.15,
          highStockDiscount: 0.20,
          bundleDiscount: 0.10,
          updatedAt: null
        });
      }
      setSettingsLoading(false);
    }, (error) => {
      console.error(error);
      setSettingsError("No se pudieron cargar las variables maestras.");
      setSettingsLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Load Bundles
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'bundles'),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Bundle[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Bundle);
      });
      setBundles(list);
      setBundlesLoading(false);
    }, (error) => {
      console.error(error);
      setBundlesLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Save general master variables
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    const data = {
      ownerId: currentUser.uid,
      markupFactor: Number(markupFactor),
      lowStockThreshold: Number(lowStockThreshold),
      scarcityMarkup: Number(scarcityMarkup),
      highStockDiscount: Number(highStockDiscount),
      bundleDiscount: Number(bundleDiscount),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'pricingSettings', currentUser.uid), data);
      setSettingsSuccess("¡Variables de inteligencia comercial actualizadas!");
      setTimeout(() => setSettingsSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      setSettingsError("Error de permisos al intentar guardar.");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Create Bundle
  const handleCreateBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !primaryProductId || !secondaryProductId) return;

    if (primaryProductId === secondaryProductId) {
      setBundleError("Selecciona dos productos diferentes para el combo.");
      return;
    }

    setBundleSaving(true);
    setBundleError(null);
    setBundleSuccess(null);

    const p1 = products.find(p => p.id === primaryProductId);
    const p2 = products.find(p => p.id === secondaryProductId);
    const calculatedTitle = `Dúo: ${p1?.name.split(' ')[0]} + ${p2?.name.split(' ')[0]}`;

    const data = {
      ownerId: currentUser.uid,
      primaryProductId,
      secondaryProductId,
      discount: Number(customBundleDiscount),
      isActive: true,
      customTitle: bundleCustomTitle.trim() || calculatedTitle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'bundles'), data);
      setBundleSuccess(`Combo "${data.customTitle}" publicado con éxito.`);
      setPrimaryProductId('');
      setSecondaryProductId('');
      setBundleCustomTitle('');
      setTimeout(() => setBundleSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setBundleError("Permiso denegado al guardar el combo.");
    } finally {
      setBundleSaving(false);
    }
  };

  // Delete Bundle
  const handleDeleteBundle = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta oferta conjunta?")) return;
    try {
      await deleteDoc(doc(db, 'bundles', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle active combo
  const handleToggleBundle = async (bundle: Bundle) => {
    try {
      await updateDoc(doc(db, 'bundles', bundle.id), {
        isActive: !bundle.isActive,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Business Intelligence: Dynamic Product Clustering based on PDF
  // We classify all products into 4 quadrants:
  // 1. Reference/Ancla: High sensitivity (defined as Category elasticity = high), price <= $80, high stock.
  // 2. Promotional: High/Medium sensitivity, and stock is moderate, or is part of a bundle.
  // 3. Margin Capturer: Low sensitivity, or premium price (>=$120).
  // 4. Strategic Review: Low stock <= 2, low rotation, or very cheap price with zero stock.
  const classifyProducts = (): {
    reference: Product[];
    promotional: Product[];
    capturer: Product[];
    review: Product[];
  } => {
    const reference: Product[] = [];
    const promotional: Product[] = [];
    const capturer: Product[] = [];
    const review: Product[] = [];

    products.forEach(p => {
      const elasticity = CATEGORY_ELASTICITY[p.category] || 'medium';
      
      if (p.stock <= 2 || (p.stock === 0 && p.price < 20)) {
        review.push(p);
      } else if (p.price >= 130 || elasticity === 'low') {
        capturer.push(p);
      } else if (elasticity === 'high' && p.price <= 80 && p.stock >= 20) {
        reference.push(p);
      } else {
        promotional.push(p);
      }
    });

    return { reference, promotional, capturer, review };
  };

  const clusters = classifyProducts();

  // Selected Simulation Analysis
  const simulatedProduct = products.find(p => p.id === simulatedProductId);

  const getDynamicPricingRecommendation = (p: Product) => {
    const elasticity = CATEGORY_ELASTICITY[p.category] || 'medium';
    let basePrice = p.price;
    let recPrice = basePrice;
    let strategyName = "Precio de Sostenibilidad";
    let marginStatus = "Estable";
    let suggestedTemplate = "classic";
    let rationale = "";

    if (p.stock <= lowStockThreshold) {
      recPrice = basePrice * (1 + scarcityMarkup);
      strategyName = "Aumento por Escasez Crítica (Resiliencia)";
      marginStatus = "Exclusivo (+Markup)";
      suggestedTemplate = "modern";
      rationale = `El stock actual (${p.stock} uds) es inferior al umbral de ${lowStockThreshold} unidades. El modelo autoriza un recargo del ${(scarcityMarkup*100).toFixed(0)}% por escasez de suministro.`;
    } else if (p.stock >= 40) {
      recPrice = basePrice * (1 - highStockDiscount);
      strategyName = "Fórmula de Rotación por Sobre-Stock (Adaptabilidad)";
      marginStatus = "Liquidación";
      suggestedTemplate = "industrial";
      rationale = `Exceso de stock detectado (${p.stock} uds). Aplicamos un descuento del ${(highStockDiscount*100).toFixed(0)}% para liberar capital de trabajo y traccionar clientes.`;
    } else if (elasticity === 'high') {
      recPrice = basePrice * 0.95; // 5% promo discount to gain basket share
      strategyName = "Precio Competitivo Referencial (Producto Gancho)";
      marginStatus = "Tracción / Volumen";
      suggestedTemplate = "badge";
      rationale = `Categoría con alta sensibilidad al precio. Un descuento controlado de 5% actúa como disparador de ticket total de compra (efecto canasta).`;
    } else if (p.price >= 140) {
      recPrice = basePrice * 1.05; // 5% brand markup
      strategyName = "Anclaje de Valor Premium (Capturador)";
      marginStatus = "Margen Máximo";
      suggestedTemplate = "neon";
      rationale = `Artículo premium en categoría de baja elasticidad. Los clientes toleran un ajuste adicional de margen del 5% debido a la diferenciación visual.`;
    } else {
      rationale = "El producto presenta rangos de venta estables. Mantener precio y monitorear elasticidad competitiva.";
    }

    return {
      recPrice,
      strategyName,
      marginStatus,
      suggestedTemplate,
      rationale
    };
  };

  const recResult = simulatedProduct ? getDynamicPricingRecommendation(simulatedProduct) : null;

  const handleApplyPricing = async () => {
    if (!simulatedProduct || !recResult) return;
    try {
      const ref = doc(db, 'products', simulatedProduct.id);
      await updateDoc(ref, {
        price: Number(recResult.recPrice.toFixed(2)),
        templateId: recResult.suggestedTemplate,
        updatedAt: serverTimestamp()
      });
      setSimulationSuccess(`Estrategia aplicada con éxito: nuevo precio de $${recResult.recPrice.toFixed(2)}.`);
      setTimeout(() => setSimulationSuccess(null), 4000);
    } catch (err) {
      console.error(err);
      setSimulationSuccess("Error de red al actualizar precio.");
    }
  };

  // BI Interactive Analytics Calculator
  // Estimate Revenue based on overall Price Adjustment and Elasticity
  const calculateSimulatedProfits = () => {
    let currentTotalRevenue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    
    // Revenue is calculated using price change:
    // Change in Quantity = - Elasticity * Change in Price
    const priceChangePct = simulatedPriceAdjustment / 100;
    const qtyChangePct = - elasticityFactor * priceChangePct;
    
    const simulatedRevenue = products.reduce((acc, p) => {
      const adjustedPrice = p.price * (1 + priceChangePct);
      const adjustedQty = p.stock * (1 + qtyChangePct);
      return acc + (adjustedPrice * adjustedQty);
    }, 0);

    const simulatedUnits = products.reduce((acc, p) => acc + Math.max(0, p.stock * (1 + qtyChangePct)), 0);
    const originalUnits = products.reduce((acc, p) => acc + p.stock, 0);

    return {
      originalRevenue: currentTotalRevenue,
      simulatedRevenue,
      revenueDiff: simulatedRevenue - currentTotalRevenue,
      originalUnits,
      simulatedUnits
    };
  };

  const profits = calculateSimulatedProfits();

  return (
    <div className="space-y-8" id="pricing-bi-workspace">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Brain className="h-3.5 w-3.5 text-indigo-400" /> Inteligencia de Negocios & Elasticidad de Precios
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Análisis de Elasticidad & Márgenes
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Clasifica dinámicamente tu catálogo según sensibilidad, simula impactos en la rentabilidad general utilizando coeficientes de elasticidad reales y publica combos de alta tracción.
          </p>
        </div>
        <TrendingUp className="hidden lg:block absolute right-12 top-4 h-32 w-32 text-indigo-800/20 stroke-[1.5]" />
      </div>

      {/* BI Bento Grid: The 4 Strategic Quadrants (Based on PDF Page 3) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-600" />
              Matriz Operativa de Clústeres Económicos
            </h3>
            <p className="text-[10px] text-slate-400">Distribución científica de artículos según elasticidad y tasa de rotación real de tu inventario.</p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 border border-slate-200 bg-slate-50 px-2 py-1 rounded-lg">Estadísticas Automáticas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Reference Products */}
          <div className="bg-white rounded-2xl border-t-4 border-t-emerald-500 border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px]">
            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase border border-emerald-100">
                  Referencia de Precio
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">({clusters.reference.length} uds)</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800">Alta Sensibilidad, Gran Volumen</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">Productos gancho con alta visibilidad. Requieren precios competitivos para traccionar tráfico general a tu negocio.</p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              {clusters.reference.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Ejemplos Clave:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                    {clusters.reference.slice(0, 2).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSimulatedProductId(p.id)}
                        className="text-[9px] bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2 py-0.5 rounded-md font-medium truncate"
                        title="Simular en panel"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No hay productos en esta banda.</p>
              )}
            </div>
          </div>

          {/* 2. Promotional Products */}
          <div className="bg-white rounded-2xl border-t-4 border-t-indigo-500 border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px]">
            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase border border-indigo-100">
                  Promocionables
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">({clusters.promotional.length} uds)</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800">Afinidad Promocional Activa</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">Sensibilidad suficiente para activar la canasta total sin destruir rentabilidad. Ideales para armar combos cruzados.</p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              {clusters.promotional.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Ejemplos Clave:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                    {clusters.promotional.slice(0, 2).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSimulatedProductId(p.id)}
                        className="text-[9px] bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2 py-0.5 rounded-md font-medium truncate"
                        title="Simular en panel"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No hay productos en esta banda.</p>
              )}
            </div>
          </div>

          {/* 3. Margin Capturers */}
          <div className="bg-white rounded-2xl border-t-4 border-t-amber-500 border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px]">
            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 uppercase border border-amber-100">
                  Capturadores de Margen
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">({clusters.capturer.length} uds)</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800">Baja Sensibilidad, Alto Ticket</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">Artículos diferenciados que subsidian la inversión en precios competitivos para productos clave. Toleran márgenes altos.</p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              {clusters.capturer.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Ejemplos Clave:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                    {clusters.capturer.slice(0, 2).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSimulatedProductId(p.id)}
                        className="text-[9px] bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2 py-0.5 rounded-md font-medium truncate"
                        title="Simular en panel"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No hay productos en esta banda.</p>
              )}
            </div>
          </div>

          {/* 4. Strategic Review */}
          <div className="bg-white rounded-2xl border-t-4 border-t-rose-500 border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-[230px]">
            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 uppercase border border-rose-100">
                  Revisión Estratégica
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">({clusters.review.length} uds)</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800">Baja Rotación o Quiebre</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">Bajo aporte incremental al portafolio o riesgo latente de canibalización. Requieren rediseño o ajuste de stock.</p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              {clusters.review.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Ejemplos Clave:</span>
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                    {clusters.review.slice(0, 2).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSimulatedProductId(p.id)}
                        className="text-[9px] bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2 py-0.5 rounded-md font-medium truncate"
                        title="Simular en panel"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No hay productos en esta banda.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
        {/* Left column: Variable setup and Combo creator */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Elasticity Interactive Simulator Graph */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600 animate-pulse" />
                  Simulador de Impacto Financiero Global
                </h3>
                <p className="text-[10px] text-slate-400">Analiza en tiempo real el impacto de cambios generales de precios utilizando elasticidades estimadas.</p>
              </div>
              <RefreshCw 
                onClick={() => { setElasticityFactor(1.5); setSimulatedPriceAdjustment(0); }} 
                className="h-3.5 w-3.5 text-slate-400 hover:text-slate-800 cursor-pointer transition rotate-hover" 
                title="Restablecer simulador" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {/* Coefficient of Elasticity Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <span>Coeficiente Elasticidad (E)</span>
                  <span className="text-indigo-600 font-mono">{elasticityFactor.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={elasticityFactor}
                  onChange={(e) => setElasticityFactor(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                  <span>0.5 (Inelástico/Premium)</span>
                  <span>3.0 (Altamente Elástico)</span>
                </div>
              </div>

              {/* Price adjustment Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <span>Ajuste de Precios General</span>
                  <span className={`font-mono font-bold ${simulatedPriceAdjustment >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simulatedPriceAdjustment > 0 ? `+${simulatedPriceAdjustment}%` : `${simulatedPriceAdjustment}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="2"
                  value={simulatedPriceAdjustment}
                  onChange={(e) => setSimulatedPriceAdjustment(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                  <span>-20% Rebaja Colectiva</span>
                  <span>+20% Margen Máximo</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Bar chart rendering the simulation comparison */}
            <div className="space-y-4">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Resultado Proyectado del Catálogo</span>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Revenue card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ingreso Total Estimado</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-black font-mono text-slate-800">${profits.simulatedRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                    <span className={`text-[10px] font-bold font-mono ${profits.revenueDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {profits.revenueDiff >= 0 ? `+$${profits.revenueDiff.toLocaleString('es-ES', { maximumFractionDigits: 0 })}` : `-$${Math.abs(profits.revenueDiff).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`}
                    </span>
                  </div>
                </div>

                {/* Units Volume card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volumen de Unidades Estimadas</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-black font-mono text-slate-800">{Math.round(profits.simulatedUnits)} uds</span>
                    <span className="text-[10px] text-slate-400 font-mono">Original: {profits.originalUnits} uds</span>
                  </div>
                </div>
              </div>

              {/* Graphic container */}
              <div className="pt-2">
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(10, (profits.simulatedRevenue / (profits.originalRevenue || 1)) * 50))}%` }}
                    title="Simulado"
                  />
                  <div 
                    className="bg-slate-300 h-full transition-all duration-300 border-l border-white"
                    style={{ width: `${Math.min(100, Math.max(10, 50))}%` }}
                    title="Línea de Base Original"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 font-bold">
                  <span>Escenario Simulado</span>
                  <span>Escenario Línea de Base Original</span>
                </div>
              </div>
            </div>
          </div>

          {/* Master variables controller */}
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                Reglas de Negocio de Precios Automatizados
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {settingsError && <p className="text-xs text-rose-600 font-bold">{settingsError}</p>}
              {settingsSuccess && <p className="text-xs text-emerald-700 font-bold">{settingsSuccess}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Base markup */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Markup Multiplicador Base</label>
                    <span className="text-xs font-mono font-bold text-indigo-600">{markupFactor}x coste</span>
                  </div>
                  <input
                    type="range"
                    min="1.1"
                    max="2.5"
                    step="0.1"
                    value={markupFactor}
                    onChange={(e) => setMarkupFactor(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Factor base sugerido para calificar el precio de catálogo de nuevos productos.</p>
                </div>

                {/* Scarcity Limit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Margen Adicional por Escasez</label>
                    <span className="text-xs font-mono font-bold text-emerald-600">+{scarcityMarkup * 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.30"
                    step="0.05"
                    value={scarcityMarkup}
                    onChange={(e) => setScarcityMarkup(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Recargo extra para capitalizar artículos exclusivos de bajo stock.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={settingsSaving}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 disabled:bg-slate-200 shadow-md flex items-center gap-1.5 transition uppercase tracking-wider"
              >
                <Save className="h-3.5 w-3.5" />
                {settingsSaving ? 'Actualizando...' : 'Guardar Variables de Control'}
              </button>
            </div>
          </form>

          {/* Combos list & creation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                Estrategia Cruzada: Publicador de Combos (Bundles)
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <form onSubmit={handleCreateBundle} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-indigo-500 animate-spin" /> Crear Promoción Cruzada
                </span>

                {bundleError && <p className="text-xs text-rose-600 font-bold">{bundleError}</p>}
                {bundleSuccess && <p className="text-xs text-emerald-700 font-bold">{bundleSuccess}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Producto Líder (Ancla)</label>
                    <select
                      value={primaryProductId}
                      onChange={(e) => setPrimaryProductId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white outline-none"
                    >
                      <option value="">-- Elige Producto --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Producto Cruzado (Financiador)</label>
                    <select
                      value={secondaryProductId}
                      onChange={(e) => setSecondaryProductId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white outline-none"
                    >
                      <option value="">-- Elige Producto --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título de la Oferta</label>
                    <input
                      type="text"
                      value={bundleCustomTitle}
                      onChange={(e) => setBundleCustomTitle(e.target.value)}
                      placeholder="Ej. Kit Súper Gamer"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descuento (%)</label>
                    <select
                      value={customBundleDiscount}
                      onChange={(e) => setCustomBundleDiscount(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white outline-none"
                    >
                      <option value="0.05">5% OFF</option>
                      <option value="0.10">10% OFF</option>
                      <option value="0.15">15% OFF</option>
                      <option value="0.20">20% OFF</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition uppercase tracking-wider"
                  >
                    Publicar Combo
                  </button>
                </div>
              </form>

              {/* Combos list */}
              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Combos Activos</span>
                {bundles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No hay combos en oferta creados.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bundles.map(b => {
                      const p1 = products.find(p => p.id === b.primaryProductId);
                      const p2 = products.find(p => p.id === b.secondaryProductId);
                      const originalPrice = (p1?.price ?? 0) + (p2?.price ?? 0);
                      const promoPrice = originalPrice * (1 - b.discount);
                      return (
                        <div key={b.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-slate-800 text-xs truncate leading-snug">{b.customTitle}</span>
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100 whitespace-nowrap">
                                -{(b.discount * 100).toFixed(0)}% OFF
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 truncate">⭐ {p1?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">📦 {p2?.name}</p>
                          </div>

                          <div className="border-t border-slate-100 mt-2.5 pt-2 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-mono font-bold text-slate-900">${promoPrice.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 line-through ml-1 font-mono">${originalPrice.toFixed(2)}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteBundle(b.id)}
                              className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Dynamic recommender simulator */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Optimizador & Recomendador de Precios
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Selecciona un producto para analizar</label>
                <select
                  value={simulatedProductId}
                  onChange={(e) => setSimulatedProductId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="">-- Elige un artículo --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} u. | ${p.price})</option>
                  ))}
                </select>
              </div>

              {simulationSuccess && (
                <p className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">{simulationSuccess}</p>
              )}

              {simulatedProduct && recResult ? (
                <div className="space-y-6">
                  {/* Analysis card layout */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Estrategia Propuesta</span>
                        <h4 className="text-sm font-extrabold text-amber-400 mt-0.5">{recResult.strategyName}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 uppercase">
                        {recResult.marginStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{recResult.rationale}"
                    </p>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Precio Actual</span>
                        <p className="text-sm font-mono text-slate-400 line-through mt-0.5">${simulatedProduct.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-emerald-400 text-[10px] uppercase font-bold block">Precio Optimizado</span>
                        <p className="text-lg font-mono font-black text-emerald-400 mt-0.5">${recResult.recPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Suggestion labeled template card */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 text-xs">Plantilla Comercial Sugerida</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">La plantilla "{AVAILABLE_TEMPLATES.find(t => t.id === recResult.suggestedTemplate)?.name}" eleva la percepción de valor de este artículo.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyPricing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition uppercase tracking-wider"
                  >
                    Aprobar & Aplicar Precio Dinámico
                  </button>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Brain className="h-10 w-10 text-slate-200" />
                  <p className="text-xs italic">Elige un producto arriba para recibir recomendaciones del motor de Inteligencia de Negocios.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
