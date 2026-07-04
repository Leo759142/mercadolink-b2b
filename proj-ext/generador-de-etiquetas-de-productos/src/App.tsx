import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { Product, CATEGORIES, AVAILABLE_TEMPLATES, RANDOM_PRODUCT_IMAGES, UserLabelTemplate } from './types';
import { AuthScreen } from './components/AuthScreen';
import { ProductForm } from './components/ProductForm';
import { LabelPreview } from './components/LabelPreview';
import { BatchLabelPrinter } from './components/BatchLabelPrinter';
import { TemplateManager } from './components/TemplateManager';
import { PricingIntelligence } from './components/PricingIntelligence';
import { AgileDataGenerator } from './components/AgileDataGenerator';
import { DispatchManager } from './components/DispatchManager';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  FolderHeart, 
  DollarSign, 
  Layers, 
  Edit2, 
  Trash2, 
  Eye, 
  Sparkles,
  Barcode as BarcodeIcon,
  Tag,
  LogOut,
  Tags,
  Palette,
  Brain,
  Truck,
  LayoutGrid,
  List
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<UserLabelTemplate[]>([]);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'batch' | 'templates' | 'pricing' | 'generator' | 'dispatch'>('dashboard');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Selected Product for visualizer/previewer
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Search/Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'priceAsc' | 'priceDesc'>('name');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Authentication State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Firestore Real-time Products Sync
  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      return;
    }

    setProductsLoading(true);
    const path = 'products';
    
    // We filter by ownerId, and do local sorting to avoid composite index requirements
    const q = query(
      collection(db, path),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          name: data.name,
          sku: data.sku,
          description: data.description || '',
          price: data.price || 0,
          stock: data.stock || 0,
          category: data.category || '',
          imageUrl: data.imageUrl || '',
          brand: data.brand || '',
          templateId: data.templateId || 'classic',
          ownerId: data.ownerId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setProducts(items);
      setProductsLoading(false);

      // Auto-select first product if none selected
      if (items.length > 0 && !selectedProductId) {
        setSelectedProductId(items[0].id);
      }
    }, (error) => {
      setProductsLoading(false);
      handleFirestoreError(error, OperationType.GET, path);
    });

    return unsubscribe;
  }, [currentUser]);

  // Firestore Real-time Custom Templates Sync
  useEffect(() => {
    if (!currentUser) {
      setCustomTemplates([]);
      return;
    }

    const q = query(
      collection(db, 'templates'),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: UserLabelTemplate[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          name: data.name || 'Sin nombre',
          description: data.description || '',
          backgroundColor: data.backgroundColor || '#ffffff',
          textColor: data.textColor || '#000000',
          borderColor: data.borderColor || '#cbd5e1',
          borderStyle: data.borderStyle || 'solid',
          borderWidth: data.borderWidth !== undefined ? data.borderWidth : 1,
          borderRadius: data.borderRadius !== undefined ? data.borderRadius : 8,
          paddingStyle: data.paddingStyle || 'normal',
          fontSizeStyle: data.fontSizeStyle || 'standard',
          badgeIcon: data.badgeIcon || 'none',
          fontFamily: data.fontFamily || 'sans',
          showBrand: data.showBrand !== undefined ? data.showBrand : true,
          showName: data.showName !== undefined ? data.showName : true,
          showPrice: data.showPrice !== undefined ? data.showPrice : true,
          showSku: data.showSku !== undefined ? data.showSku : true,
          showCategory: data.showCategory !== undefined ? data.showCategory : true,
          showBarcode: data.showBarcode !== undefined ? data.showBarcode : true,
          customNote: data.customNote || '',
          ownerId: data.ownerId || currentUser.uid,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || null
        });
      });
      setCustomTemplates(items);
    }, (error) => {
      console.error("Error fetching templates:", error);
    });

    return unsubscribe;
  }, [currentUser]);

  // CRUD Operations
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!currentUser) return;
    setIsSaving(true);
    const path = 'products';

    try {
      if (editingProduct) {
        // Update mode
        const docRef = doc(db, path, editingProduct.id);
        const updatePayload = {
          ...productData,
          updatedAt: serverTimestamp()
        };
        await updateDoc(docRef, updatePayload);
      } else {
        // Create mode
        const newDocRef = doc(collection(db, path));
        const createPayload = {
          ...productData,
          id: newDocRef.id,
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(newDocRef, createPayload);
        setSelectedProductId(newDocRef.id);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }
    const path = 'products';
    try {
      await deleteDoc(doc(db, path, id));
      if (selectedProductId === id) {
        setSelectedProductId(products.find(p => p.id !== id)?.id || null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleOpenEdit = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // Seed Initial Demo Products helper
  const handleSeedDemoProducts = async () => {
    if (!currentUser || products.length > 0) return;
    setIsSaving(true);
    const path = 'products';

    const demoProducts: Partial<Product>[] = [
      {
        name: 'Reloj Inteligente ChronoFit Pro',
        sku: 'SKU-CHR-551',
        brand: 'AuraTech',
        category: 'Tecnología',
        price: 189.99,
        stock: 14,
        description: 'Pantalla AMOLED de 1.43 pulgadas, sensor de ritmo cardíaco continuo y batería de 14 días.',
        imageUrl: RANDOM_PRODUCT_IMAGES[0],
        templateId: 'modern'
      },
      {
        name: 'Audífonos SoundBarrier Max ANC',
        sku: 'SKU-SND-902',
        brand: 'Acoustics',
        category: 'Tecnología',
        price: 249.50,
        stock: 3,
        description: 'Cancelación activa híbrida de ruido de hasta 45dB, soporte de audio Hi-Res y almohadillas viscoelásticas.',
        imageUrl: RANDOM_PRODUCT_IMAGES[1],
        templateId: 'neon'
      },
      {
        name: 'Café Orgánico de Altura (Granos)',
        sku: 'SKU-COF-120',
        brand: 'Andes Aroma',
        category: 'Alimentos y Bebidas',
        price: 18.00,
        stock: 45,
        description: 'Café tostado medio premium 100% Arábica de origen ético peruano.',
        imageUrl: RANDOM_PRODUCT_IMAGES[7],
        templateId: 'minimal'
      },
      {
        name: 'Zapatillas de Trail Carbon Runner',
        sku: 'SKU-ZPT-830',
        brand: 'Veloce',
        category: 'Ropa y Moda',
        price: 135.00,
        stock: 8,
        description: 'Zapatillas todoterreno ultra-ligeras con placa de fibra de carbono para máxima amortiguación y tracción.',
        imageUrl: RANDOM_PRODUCT_IMAGES[3],
        templateId: 'classic'
      },
      {
        name: 'Set de Desarmadores Industriales Titan',
        sku: 'SKU-TL-401',
        brand: 'Titan Tools',
        category: 'Herramientas',
        price: 34.90,
        stock: 22,
        description: 'Mango ergonómico bi-material antideslizante con puntas magnéticas tratadas térmicamente.',
        imageUrl: RANDOM_PRODUCT_IMAGES[5],
        templateId: 'industrial'
      }
    ];

    try {
      for (const p of demoProducts) {
        const docRef = doc(collection(db, path));
        await setDoc(docRef, {
          ...p,
          id: docRef.id,
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering, Searching & Sorting Logic
  const processedProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stockAsc':
          return a.stock - b.stock;
        case 'stockDesc':
          return b.stock - a.stock;
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Statistics Computations
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const categoriesCount = new Set(products.map(p => p.category)).size;
  const totalStockValue = products.reduce((total, p) => total + (p.price * p.stock), 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4" id="loading-screen">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          <Tag className="h-6 w-6 text-indigo-500 absolute animate-pulse" />
        </div>
        <p className="text-slate-400 font-mono text-xs tracking-widest uppercase">Inicializando TagCraft...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans" id="app-root">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col text-slate-300 border-r border-slate-800 shrink-0 hidden md:flex h-screen sticky top-0" id="app-sidebar">
        {/* Logo Branding */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">TagCraft Pro</span>
        </div>

        {/* Navigation Tab Links */}
        <nav className="flex-1 px-4 space-y-1 mt-4" id="sidebar-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarcodeIcon className="h-5 w-5 shrink-0" />
            <span className="text-sm">Panel de Control</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tags className="h-5 w-5 shrink-0" />
            <span className="text-sm">Impresión por Lote</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Palette className="h-5 w-5 shrink-0" />
            <span className="text-sm">Diseño de Plantillas</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Brain className="h-5 w-5 shrink-0 text-amber-400" />
            <span className="text-sm">Precios & Combos</span>
            <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
              Admin
            </span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left ${
              activeTab === 'generator'
                ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="h-5 w-5 shrink-0 text-indigo-400" />
            <span className="text-sm">Generador Ágil</span>
            <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90 animate-pulse">
              Demo
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left ${
              activeTab === 'dispatch'
                ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="text-sm font-medium">Despachos & Logística</span>
            <span className="ml-auto text-[9px] bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
              Pro
            </span>
          </button>
        </nav>

        {/* Profile Info & Logout */}
        <div className="p-6 mt-auto border-t border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 shrink-0">
                  <span className="text-xs font-bold text-white">
                    {(currentUser?.displayName || currentUser?.email || 'JD').substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Juan Delgado'}
                </p>
                <p className="text-xs text-slate-500 truncate">Admin - Firebase Auth</p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await auth.signOut();
                } catch (err) {
                  console.error('Error signing out:', err);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0" id="app-header">
          {/* Dynamic Search Box */}
          <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-64 sm:w-96">
            <span className="text-slate-400 mr-2">🔍</span>
            <input
              type="text"
              placeholder="Buscar productos o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-sm w-full text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            {/* Mobile Tab Swapper */}
            <div className="flex md:hidden bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  activeTab === 'dashboard' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-slate-500'
                }`}
              >
                Panel
              </button>
              <button
                onClick={() => setActiveTab('batch')}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  activeTab === 'batch' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-slate-500'
                }`}
              >
                Lotes
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  activeTab === 'templates' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-slate-500'
                }`}
              >
                Diseños
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  activeTab === 'pricing' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-slate-500'
                }`}
              >
                Precios
              </button>
              <button
                onClick={() => setActiveTab('generator')}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  activeTab === 'generator' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-slate-500'
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setActiveTab('dispatch')}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  activeTab === 'dispatch' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-slate-500'
                }`}
              >
                Despachos
              </button>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/10"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Producto</span>
            </button>

            {/* Logout on mobile */}
            <button
              onClick={async () => {
                try {
                  await auth.signOut();
                } catch (err) {
                  console.error('Error logging out:', err);
                }
              }}
              className="p-2 md:hidden text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-lg transition"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          
          {/* Welcome Banner with seed data button if no products */}
          {products.length === 0 && !productsLoading && (
            <div className="bg-indigo-600 text-white rounded-2xl p-8 mb-8 shadow-lg relative overflow-hidden" id="welcome-banner">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
                <BarcodeIcon className="h-48 w-48" />
              </div>
              <div className="relative z-10 max-w-xl">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">¡Bienvenido a TagCraft Pro!</h1>
                <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                  Parece que aún no tienes ningún producto registrado. Comienza a diseñar y organizar etiquetas ergonómicas agregando tu primer producto o carga una colección demostrativa para explorar la plataforma.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleOpenCreate}
                    className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-50 shadow-md transition"
                  >
                    Agregar Primer Producto
                  </button>
                  <button
                    onClick={handleSeedDemoProducts}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-sm border border-indigo-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isSaving ? 'Cargando...' : 'Cargar Productos Demo'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Tab view */}
          {activeTab === 'batch' ? (
            <BatchLabelPrinter products={products} customTemplates={customTemplates} />
          ) : activeTab === 'templates' ? (
            <TemplateManager currentUser={currentUser} products={products} />
          ) : activeTab === 'pricing' ? (
            <PricingIntelligence currentUser={currentUser} products={products} />
          ) : activeTab === 'generator' ? (
            <AgileDataGenerator currentUser={currentUser} products={products} customTemplates={customTemplates} />
          ) : activeTab === 'dispatch' ? (
            <DispatchManager currentUser={currentUser} products={products} />
          ) : (
            <div className="space-y-6" id="dashboard-view">
              
              {/* Stats Rows - Sleek Interface style */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Productos Totales</p>
                  <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">{totalProducts}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <p className="text-orange-600 text-xs font-semibold uppercase tracking-wider">Stock Bajo</p>
                  <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">{lowStockCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Categorías</p>
                  <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">{categoriesCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Valor Inventario</p>
                  <p className="text-2xl font-bold mt-1 text-slate-900 font-mono">${totalStockValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Main Section: CRUD Table & Template Preview */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start" id="main-workbench">
                
                {viewMode === 'grid' ? (
                  <div className="xl:col-span-12 space-y-6">
                    {/* High-Iconicity Grid View Header with filters */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                          <LayoutGrid className="h-4 w-4 text-indigo-600" /> Catalogación de Alta Iconicidad
                        </h3>
                        <p className="text-[10px] text-slate-400">Inspecciona imágenes de gran dimensión, bandas de inteligencia y estado directo de tus etiquetas.</p>
                      </div>
                      
                      <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="py-1.5 px-3 border border-slate-200 rounded-xl bg-white text-slate-600 font-medium text-xs focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="all">Todas Categorías</option>
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
                          <button
                            onClick={() => setViewMode('list')}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-indigo-600 transition"
                            title="Vista de Lista"
                          >
                            <List className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg bg-white shadow-xs text-indigo-600 transition font-bold"
                            title="Vista de Grilla"
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {processedProducts.length > 0 ? (
                        processedProducts.map((p) => {
                          const isLowStock = p.stock <= 5;

                          return (
                            <div 
                              key={p.id} 
                              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col group"
                            >
                              {/* Large Image Frame */}
                              <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 text-indigo-300 font-black text-xl uppercase">
                                    {p.name.substring(0, 2)}
                                  </div>
                                )}
                                
                                {/* Stock Badge */}
                                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-black font-mono shadow-xs ${
                                  isLowStock 
                                    ? 'bg-rose-500 text-white animate-pulse' 
                                    : 'bg-slate-900 text-white'
                                }`}>
                                  {p.stock} UDS
                                </span>

                                {/* Category Tag */}
                                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[9px] font-extrabold text-slate-800 uppercase tracking-wider border border-slate-200/50">
                                  {p.category}
                                </span>
                              </div>

                              {/* Card Content */}
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-1">
                                  <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{p.brand || 'Marca Genérica'}</span>
                                  <h4 className="font-extrabold text-slate-800 text-sm line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {p.name}
                                  </h4>
                                  <span className="block text-[10px] text-slate-400 font-mono mt-1">SKU: {p.sku}</span>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Precio</span>
                                    <span className="text-base font-black font-mono text-slate-900">${p.price.toFixed(2)}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setSelectedProductId(p.id);
                                        setViewMode('list');
                                      }}
                                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1"
                                      title="Imprimir Etiqueta"
                                    >
                                      <Eye className="h-3 w-3" /> Ver Diseño
                                    </button>

                                    <button
                                      onClick={(e) => handleOpenEdit(p, e)}
                                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                                      title="Editar"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    
                                    <button
                                      onClick={(e) => handleDeleteProduct(p.id, e)}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-16 text-center text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200">
                          No se encontraron productos coincidentes en esta categoría.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Product List Table / Left Column */}
                    <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px]" id="catalog-explorer">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-indigo-600" /> Gestión de Productos
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-indigo-600 font-semibold">{processedProducts.length} uds</span>
                          
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                            <button
                              className="p-1 rounded bg-white shadow-xs text-indigo-600"
                              title="Vista de Lista"
                            >
                              <List className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setViewMode('grid')}
                              className="p-1 rounded text-slate-400 hover:text-slate-700"
                              title="Vista de Grilla Icónica"
                            >
                              <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sorter & Category Badges scroll */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50/30 gap-2 flex items-center text-xs shrink-0">
                        <div className="flex-1">
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full py-1.5 px-2 border border-slate-200 rounded-lg bg-white text-slate-600 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="all">Todas Categorías</option>
                            {CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full py-1.5 px-2 border border-slate-200 rounded-lg bg-white text-slate-600 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="name">Ordenar: Nombre</option>
                            <option value="stockAsc">Stock: Bajo a Alto</option>
                            <option value="stockDesc">Stock: Alto a Bajo</option>
                            <option value="priceAsc">Precio: Bajo a Alto</option>
                            <option value="priceDesc">Precio: Alto a Bajo</option>
                          </select>
                        </div>
                      </div>

                      {/* Product items scroll area */}
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100" id="products-scroll-container">
                        {productsLoading ? (
                          <div className="p-12 text-center text-slate-400 space-y-2">
                            <div className="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs">Sincronizando catálogo...</p>
                          </div>
                        ) : processedProducts.length > 0 ? (
                          processedProducts.map((p) => {
                            const isSelected = p.id === selectedProductId;
                            const isLowStock = p.stock <= 5;
                            return (
                              <div
                                key={p.id}
                                onClick={() => setSelectedProductId(p.id)}
                                className={`p-4 flex items-center justify-between cursor-pointer transition-all duration-150 relative ${
                                  isSelected 
                                    ? 'bg-slate-50 border-l-4 border-indigo-600 pl-3' 
                                    : 'hover:bg-slate-50/50 border-l-4 border-transparent'
                                }`}
                              >
                                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                                  {p.imageUrl ? (
                                    <img
                                      src={p.imageUrl}
                                      alt={p.name}
                                      className="h-12 w-12 rounded-xl object-cover border border-slate-100 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm uppercase shrink-0">
                                      {p.name.substring(0, 2)}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                                      {p.brand || 'Genérico'}
                                    </span>
                                    <span className="block font-bold text-slate-800 text-sm truncate leading-snug">
                                      {p.name}
                                    </span>
                                    
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                        {p.category}
                                      </span>
                                      <span className="font-mono text-[10px] font-bold text-slate-500">
                                        {p.sku}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Stock & Actions column */}
                                <div className="flex flex-col items-end shrink-0 space-y-1.5">
                                  <span className="font-mono font-bold text-sm text-slate-900">${p.price.toFixed(2)}</span>
                                  
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                                      isLowStock 
                                        ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' 
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    }`}>
                                      {p.stock} u.
                                    </span>

                                    <div className="flex opacity-65 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={(e) => handleOpenEdit(p, e)}
                                        className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition"
                                        title="Editar"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => handleDeleteProduct(p.id, e)}
                                        className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-12 text-center text-slate-400 text-xs">
                            No se encontraron productos. Crea uno nuevo para comenzar.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Visual Label Generator & Printer */}
                    <div className="xl:col-span-7" id="design-panel">
                      {selectedProduct ? (
                        <LabelPreview product={selectedProduct} customTemplates={customTemplates} />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 min-h-[450px] shadow-sm text-center">
                          <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                            <BarcodeIcon className="h-8 w-8" />
                          </div>
                          <h3 className="text-md font-bold text-slate-800">No hay producto seleccionado</h3>
                          <p className="text-slate-400 text-xs max-w-xs mt-2">
                            Selecciona un producto del catálogo izquierdo para ver, configurar e imprimir su etiqueta en tiempo real.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-slate-200 py-6 text-center mt-auto" id="app-footer">
          <div className="max-w-7xl mx-auto px-4 text-xs text-slate-400 font-mono tracking-wider">
            TAGCRAFT PRO © 2026 • INTEGRADO CON FIRESTORE ENTERPRISE Y AUTH
          </div>
        </footer>
      </main>

      {/* Product Create/Edit Modal */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => setIsFormOpen(false)}
          isSaving={isSaving}
          customTemplates={customTemplates}
        />
      )}
    </div>
  );
}
