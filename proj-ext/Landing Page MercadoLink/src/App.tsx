import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  Search, 
  Plus, 
  Sparkles, 
  ShoppingBag, 
  Wheat, 
  Users, 
  Store, 
  Truck, 
  ChevronRight, 
  Heart,
  Grid,
  Filter,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  UserCircle2,
  IdCard,
  FileCode,
  Lock
} from 'lucide-react';

// Data and Types
import { Product, Provider, Seller, Order, UserSession } from './types';
import { 
  INITIAL_PROVIDERS, 
  INITIAL_SELLERS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS,
  TESTIMONIALS,
  CAROUSEL_TEMPLATES
} from './data';

// Components
import Carousel from './components/Carousel';
import ProductCard from './components/ProductCard';
import ProviderCard from './components/ProviderCard';
import SellerCard from './components/SellerCard';
import ProductFormModal from './components/ProductFormModal';
import ProviderFormModal from './components/ProviderFormModal';
import SellerFormModal from './components/SellerFormModal';
import OrderSimulationModal from './components/OrderSimulationModal';
import TradingDesk from './components/TradingDesk';
import ThymeleafManager from './components/ThymeleafManager';
import LoginStation from './components/LoginStation';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'inicio' | 'productos' | 'proveedores' | 'vendedores' | 'actores' | 'app' | 'templates' | 'login'>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Session state
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    username: '',
    role: 'admin'
  });

  // Persistence State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);


  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [actorRoleFilter, setActorRoleFilter] = useState<'all' | 'producer' | 'seller'>('all');

  // Modals Open State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Selected Items for Edit
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Initialize states from LocalStorage or Data
  useEffect(() => {
    const savedProviders = localStorage.getItem('ml_providers');
    const savedSellers = localStorage.getItem('ml_sellers');
    const savedProducts = localStorage.getItem('ml_products');
    const savedOrders = localStorage.getItem('ml_orders');
    const savedSession = localStorage.getItem('ml_session');

    if (savedProviders) setProviders(JSON.parse(savedProviders));
    else {
      setProviders(INITIAL_PROVIDERS);
      localStorage.setItem('ml_providers', JSON.stringify(INITIAL_PROVIDERS));
    }

    if (savedSellers) setSellers(JSON.parse(savedSellers));
    else {
      setSellers(INITIAL_SELLERS);
      localStorage.setItem('ml_sellers', JSON.stringify(INITIAL_SELLERS));
    }

    if (savedProducts) setProducts(JSON.parse(savedProducts));
    else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('ml_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    if (savedOrders) setOrders(JSON.parse(savedOrders));
    else {
      setOrders(INITIAL_ORDERS);
      localStorage.setItem('ml_orders', JSON.stringify(INITIAL_ORDERS));
    }

    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('ml_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    const closedSession: UserSession = { isLoggedIn: false, username: '', role: 'admin' };
    setSession(closedSession);
    localStorage.setItem('ml_session', JSON.stringify(closedSession));
  };


  // 2. State Sync Helpers
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const updateProvidersState = (newProviders: Provider[]) => {
    setProviders(newProviders);
    localStorage.setItem('ml_providers', JSON.stringify(newProviders));
  };

  const updateSellersState = (newSellers: Seller[]) => {
    setSellers(newSellers);
    localStorage.setItem('ml_sellers', JSON.stringify(newSellers));
  };

  const updateProductsState = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('ml_products', JSON.stringify(newProducts));
  };

  const updateOrdersState = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('ml_orders', JSON.stringify(newOrders));
  };

  // 3. CRUD actions
  // Products
  const handleSaveProduct = (pData: Omit<Product, 'id'> & { id?: string }) => {
    if (pData.id) {
      // Edit
      const updated = products.map(p => p.id === pData.id ? { ...p, ...pData } : p) as Product[];
      updateProductsState(updated);
      showToast(`Cultivo "${pData.name}" actualizado con éxito.`);
    } else {
      // Create
      const newProduct: Product = {
        ...pData,
        id: `prod-${Date.now()}`
      };
      updateProductsState([...products, newProduct]);
      showToast(`Nuevo cultivo "${pData.name}" registrado en la mesa.`);
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (confirm(`¿Está seguro que desea eliminar el cultivo "${prod?.name}"?`)) {
      const filtered = products.filter(p => p.id !== id);
      updateProductsState(filtered);
      showToast(`Cultivo eliminado.`);
    }
  };

  // Providers
  const handleSaveProvider = (provData: Omit<Provider, 'id'> & { id?: string }) => {
    if (provData.id) {
      // Edit
      const updated = providers.map(p => p.id === provData.id ? { ...p, ...provData } : p) as Provider[];
      updateProvidersState(updated);
      showToast(`Proveedor "${provData.name}" actualizado.`);
    } else {
      // Create
      const newProvider: Provider = {
        ...provData,
        id: `prov-${Date.now()}`
      };
      updateProvidersState([...providers, newProvider]);
      showToast(`Nuevo agricultor "${provData.name}" integrado.`);
    }
    setEditingProvider(null);
  };

  const handleDeleteProvider = (id: string) => {
    const prov = providers.find(p => p.id === id);
    const linked = products.filter(p => p.providerId === id);
    if (linked.length > 0) {
      alert(`No se puede eliminar a "${prov?.name}" porque tiene ${linked.length} cultivos asociados en el catálogo. Primero elimine o reasigne esos cultivos.`);
      return;
    }
    if (confirm(`¿Desea dar de baja al proveedor rural "${prov?.name}"?`)) {
      const filtered = providers.filter(p => p.id !== id);
      updateProvidersState(filtered);
      showToast(`Proveedor dado de baja.`);
    }
  };

  // Sellers
  const handleSaveSeller = (sellData: Omit<Seller, 'id'> & { id?: string }) => {
    if (sellData.id) {
      // Edit
      const updated = sellers.map(s => s.id === sellData.id ? { ...s, ...sellData } : s) as Seller[];
      updateSellersState(updated);
      showToast(`Comerciante "${sellData.name}" actualizado.`);
    } else {
      // Create
      const newSeller: Seller = {
        ...sellData,
        id: `sell-${Date.now()}`
      };
      updateSellersState([...sellers, newSeller]);
      showToast(`Comerciante "${sellData.name}" registrado con éxito.`);
    }
    setEditingSeller(null);
  };

  const handleDeleteSeller = (id: string) => {
    const sell = sellers.find(s => s.id === id);
    if (confirm(`¿Desea eliminar al comerciante del puesto "${sell?.name}"?`)) {
      const filtered = sellers.filter(s => s.id !== id);
      updateSellersState(filtered);
      showToast(`Comerciante eliminado.`);
    }
  };

  // Order Simulation
  const handlePlaceOrder = (oData: Omit<Order, 'id'>) => {
    const newOrder: Order = {
      ...oData,
      id: `ord-${Date.now()}`
    };

    // Deduct money from Seller balance
    const updatedSellers = sellers.map(s => {
      if (s.id === oData.sellerId) {
        return { ...s, balance: Math.max(0, s.balance - oData.totalPrice) };
      }
      return s;
    });

    // Subtract stock from Product
    const updatedProducts = products.map(p => {
      if (p.id === oData.productId) {
        return { ...p, stock: Math.max(0, p.stock - oData.quantity) };
      }
      return p;
    });

    updateSellersState(updatedSellers);
    updateProductsState(updatedProducts);
    updateOrdersState([newOrder, ...orders]);

    showToast(`¡Liquidación B2B exitosa! Pedido #${newOrder.id} despachado.`);
    setActiveTab('app'); // Switch to order logistics desk
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: 'pendiente' | 'coordinado' | 'entregado') => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    updateOrdersState(updated);
    showToast(`Pedido #${orderId} actualizado a: ${newStatus === 'coordinado' ? 'En Transporte' : 'Entregado'}`);
  };

  // Switch tabs programmatically from Carousel or links
  const handleSelectTab = (tab: 'productos' | 'proveedores' | 'vendedores' | 'actores' | 'app' | 'inicio' | 'templates' | 'login') => {
    setActiveTab(tab);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Filtering Logics
  // Products search
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Providers search
  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.crops.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Sellers search
  const filteredSellers = sellers.filter(s => {
    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.stallNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-rustic-bg flex flex-col font-serif selection:bg-rustic-accent selection:text-rustic-bg">
      
      {/* 1. Header Navigation Bar */}
      <nav className="navbar border-b-4 border-rustic-wood bg-rustic-surface/95 sticky top-0 z-40 backdrop-blur" aria-label="Navegación principal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <button 
            id="nav-brand-logo"
            onClick={() => handleSelectTab('inicio')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            aria-label="Ir a Inicio - MercadoLink B2B"
          >
            <Wheat className="w-6 h-6 text-rustic-accent group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-wider text-rustic-text leading-none">
                MercadoLink <span className="text-rustic-accent font-sans text-xs sm:text-sm font-bold bg-rustic-accent/10 px-1.5 py-0.5 rounded border border-rustic-accent/20">B2B</span>
              </h1>
              <span className="text-[9px] uppercase font-mono tracking-widest text-rustic-muted block mt-0.5">Mercado Mayorista Rústico</span>
            </div>
          </button>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center gap-1.5 font-sans text-sm">
            <button
              id="nav-link-inicio"
              onClick={() => handleSelectTab('inicio')}
              className={`px-2.5 py-2 rounded-md font-medium transition-all cursor-pointer ${activeTab === 'inicio' ? 'bg-rustic-accent text-rustic-bg font-bold shadow' : 'text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2/50'}`}
              aria-label="Ir a Inicio"
            >
              Inicio
            </button>
            <button
              id="nav-link-productos"
              onClick={() => handleSelectTab('productos')}
              className={`px-2.5 py-2 rounded-md font-medium transition-all cursor-pointer ${activeTab === 'productos' ? 'bg-rustic-accent text-rustic-bg font-bold shadow' : 'text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2/50'}`}
              aria-label="Ver catálogo de Productos"
            >
              Productos
            </button>
            <button
              id="nav-link-proveedores"
              onClick={() => handleSelectTab('proveedores')}
              className={`px-2.5 py-2 rounded-md font-medium transition-all cursor-pointer ${activeTab === 'proveedores' ? 'bg-rustic-accent text-rustic-bg font-bold shadow' : 'text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2/50'}`}
              aria-label="Ver lista de Proveedores Rurales"
            >
              Proveedores
            </button>
            <button
              id="nav-link-vendedores"
              onClick={() => handleSelectTab('vendedores')}
              className={`px-2.5 py-2 rounded-md font-medium transition-all cursor-pointer ${activeTab === 'vendedores' ? 'bg-rustic-accent text-rustic-bg font-bold shadow' : 'text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2/50'}`}
              aria-label="Ver lista de Vendedores Minoristas"
            >
              Vendedores
            </button>
            <button
              id="nav-link-actores"
              onClick={() => handleSelectTab('actores')}
              className={`px-2.5 py-2 rounded-md font-medium transition-all cursor-pointer ${activeTab === 'actores' ? 'bg-rustic-accent text-rustic-bg font-bold shadow' : 'text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2/50'}`}
              aria-label="Ver directorio unificado de Actores"
            >
              Actores
            </button>
            <button
              id="nav-link-templates"
              onClick={() => handleSelectTab('templates')}
              className={`px-2.5 py-2 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'templates' ? 'bg-rustic-accent text-rustic-bg font-bold shadow' : 'text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2/50'}`}
              aria-label="Gestor de Plantillas Thymeleaf"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Plantillas</span>
            </button>

            <span className="h-6 w-[2px] bg-rustic-border/30 mx-1.5" />

            {/* Login Status Link */}
            <button
              id="nav-link-login"
              onClick={() => handleSelectTab('login')}
              className={`px-3 py-2 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'login' ? 'bg-rustic-accent2 text-white font-bold shadow' : 'text-rustic-accent hover:text-rustic-text hover:bg-rustic-surface2/50'}`}
              aria-label="Acceso Miembro B2B"
            >
              <UserCircle2 className="w-4 h-4" />
              <span className="max-w-[80px] truncate">
                {session.isLoggedIn ? session.username.split(' ')[0] : 'Ingresar'}
              </span>
            </button>

            <button
              id="nav-link-app-cta"
              onClick={() => handleSelectTab('app')}
              className={`px-3.5 py-2 rounded-full font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-md ${activeTab === 'app' ? 'bg-gradient-to-r from-rustic-green to-emerald-600 text-white border-rustic-border' : 'bg-gradient-to-r from-rustic-accent to-rustic-accent2 text-rustic-bg hover:brightness-110 border border-rustic-wood'}`}
              aria-label="Entrar a Mesa de Despacho"
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="text-xs">Mesa B2B</span>
            </button>
          </div>


          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-rustic-text bg-rustic-surface2/80 rounded-md border border-rustic-border focus:outline-none"
              aria-label="Abrir menú de navegación"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-navigation-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-rustic-surface border-t-2 border-rustic-wood/50 overflow-hidden font-sans"
            >
              <div className="px-4 pt-2 pb-6 space-y-2 text-sm flex flex-col">
                <button
                  id="mobile-link-inicio"
                  onClick={() => { handleSelectTab('inicio'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'inicio' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'text-rustic-muted'}`}
                >
                  Inicio
                </button>
                <button
                  id="mobile-link-productos"
                  onClick={() => { handleSelectTab('productos'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'productos' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'text-rustic-muted'}`}
                >
                  Productos / Cultivos
                </button>
                <button
                  id="mobile-link-proveedores"
                  onClick={() => { handleSelectTab('proveedores'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'proveedores' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'text-rustic-muted'}`}
                >
                  Proveedores Rurales
                </button>
                <button
                  id="mobile-link-vendedores"
                  onClick={() => { handleSelectTab('vendedores'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'vendedores' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'text-rustic-muted'}`}
                >
                  Vendedores de Puestos
                </button>
                <button
                  id="mobile-link-actores"
                  onClick={() => { handleSelectTab('actores'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'actores' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'text-rustic-muted'}`}
                >
                  Directorio de Actores
                </button>
                <button
                  id="mobile-link-templates"
                  onClick={() => { handleSelectTab('templates'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'templates' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'text-rustic-muted'}`}
                >
                  Plantillas Thymeleaf
                </button>
                <button
                  id="mobile-link-login"
                  onClick={() => { handleSelectTab('login'); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeTab === 'login' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'text-rustic-muted'}`}
                >
                  {session.isLoggedIn ? `Mi Perfil (${session.username.split(' ')[0]})` : 'Iniciar Sesión'}
                </button>
                <div className="pt-4 border-t border-rustic-border/20">
                  <button
                    id="mobile-link-app"
                    onClick={() => { handleSelectTab('app'); setIsMobileMenuOpen(false); }}
                    className="w-full justify-center inline-flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-rustic-accent to-rustic-accent2 text-rustic-bg font-bold rounded-lg border border-rustic-wood"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Mesa de Despacho B2B</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. Toast System Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            id="app-toast-alert"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 max-w-sm bg-rustic-surface border-2 border-rustic-accent px-4 py-3 rounded-md shadow-xl text-xs font-sans text-rustic-text flex items-center gap-3"
            role="alert"
          >
            <CheckCircle className="w-5 h-5 text-rustic-green shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* TAB: INICIO (HOME) */}
          {activeTab === 'inicio' && (
            <motion.div
              key="inicio-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              {/* Rustic Hero Banner */}
              <div id="hero-banner" className="relative p-6 sm:p-12 bg-gradient-to-br from-rustic-surface2 to-rustic-surface border-4 border-rustic-border rounded-lg shadow-xl text-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#8b6d47_1px,transparent_1px)] [background-size:16px_16px]" />
                
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rustic-accent/15 text-rustic-accent font-sans text-xs font-semibold uppercase tracking-widest rounded-full border border-rustic-accent/30 mb-4">
                  🌾 Agricultura Directa y Justa
                </span>

                <h2 className="text-3xl sm:text-5xl font-extrabold text-rustic-accent tracking-tight leading-tight max-w-2xl mx-auto drop-shadow">
                  Conectando el Campo con la Tienda Directo al Puesto
                </h2>
                
                <p className="text-sm sm:text-base font-sans text-rustic-text/90 max-w-2xl mx-auto mt-4 leading-relaxed">
                  MercadoLink B2B simplifica el abastecimiento de los mercados mayoristas y minoristas. 
                  Conectamos productores rurales de Jauja, Chanchamayo, Huaral y Cusco con comerciantes de puestos populares. 
                  Sin intermediarios ineficientes, con precios transparentes y entregas directas coordinadas por camión.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button
                    id="hero-app-btn"
                    onClick={() => handleSelectTab('app')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rustic-accent to-rustic-accent2 text-rustic-bg font-sans font-bold text-sm sm:text-base rounded-full border-2 border-rustic-wood shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer custom-focus"
                    aria-label="Comenzar a operar en la plataforma"
                  >
                    <Truck className="w-5 h-5" />
                    <span>Comenzar Ahora</span>
                  </button>
                  <button
                    id="hero-catalog-btn"
                    onClick={() => handleSelectTab('productos')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rustic-surface2/55 hover:bg-rustic-surface2 text-rustic-text font-sans font-bold text-sm sm:text-base rounded-full border border-rustic-border transition-all cursor-pointer custom-focus"
                    aria-label="Ver cultivos de temporada"
                  >
                    <Wheat className="w-5 h-5 text-rustic-accent" />
                    <span>Ver Catálogo</span>
                  </button>
                </div>
              </div>

              {/* Statistics Row - Real-time synchronized from state */}
              <div id="real-time-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-rustic-surface/45 border border-rustic-border p-4 rounded-lg text-center shadow">
                  <div className="text-3xl sm:text-4xl font-extrabold text-rustic-accent">{products.length}</div>
                  <div className="text-[10px] sm:text-xs font-sans text-rustic-muted uppercase tracking-wider mt-1.5">Cultivos Disponibles</div>
                </div>
                <div className="bg-rustic-surface/45 border border-rustic-border p-4 rounded-lg text-center shadow">
                  <div className="text-3xl sm:text-4xl font-extrabold text-rustic-green">{providers.length}</div>
                  <div className="text-[10px] sm:text-xs font-sans text-rustic-muted uppercase tracking-wider mt-1.5">Productores Rurales</div>
                </div>
                <div className="bg-rustic-surface/45 border border-rustic-border p-4 rounded-lg text-center shadow">
                  <div className="text-3xl sm:text-4xl font-extrabold text-rustic-yellow">{sellers.length}</div>
                  <div className="text-[10px] sm:text-xs font-sans text-rustic-muted uppercase tracking-wider mt-1.5">Vendedores de Puestos</div>
                </div>
                <div className="bg-rustic-surface/45 border border-rustic-border p-4 rounded-lg text-center shadow">
                  <div className="text-3xl sm:text-4xl font-extrabold text-rustic-text">{orders.length}</div>
                  <div className="text-[10px] sm:text-xs font-sans text-rustic-muted uppercase tracking-wider mt-1.5">Despachos Históricos</div>
                </div>
              </div>

              {/* FEATURES BENEFITS BENTO GRID */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-rustic-yellow">¿Por qué elegir MercadoLink B2B?</h3>
                  <p className="text-xs sm:text-sm font-sans text-rustic-muted mt-1">Beneficios mutuos para el campo y el puesto de mercado</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="p-5 bg-rustic-surface border-2 border-rustic-border rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-3xl select-none">🌾</span>
                      <h4 className="text-base font-bold text-rustic-text mt-3">Alimentos Directos de Chacra</h4>
                      <p className="text-xs font-sans text-rustic-muted mt-2 leading-relaxed">
                        Papas nativas, hortalizas frescas y café orgánico cosechados el mismo día. Calidad impecable sin pasar por cámaras ni bodegas de terceros.
                      </p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-5 bg-rustic-surface border-2 border-rustic-border rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-3xl select-none">💰</span>
                      <h4 className="text-base font-bold text-rustic-text mt-3">Precios Justos al Productor</h4>
                      <p className="text-xs font-sans text-rustic-muted mt-2 leading-relaxed">
                        Al eliminar al intermediario mayorista no autorizado, el agricultor recibe un 30% más por su cosecha y el comerciante ahorra un 20% en su costo de abastecimiento.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-5 bg-rustic-surface border-2 border-rustic-border rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-3xl select-none">🚚</span>
                      <h4 className="text-base font-bold text-rustic-text mt-3">Logística Rural Coordinada</h4>
                      <p className="text-xs font-sans text-rustic-muted mt-2 leading-relaxed">
                        Coordinamos fletes compartidos para reducir la huella de carbono y optimizar el costo de despacho directo al mercado minorista asignado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* THE CAROUSEL SECTION (Requested feature) */}
              <div id="templates" className="pt-6">
                <Carousel 
                  items={CAROUSEL_TEMPLATES} 
                  onSelectTab={handleSelectTab} 
                />
              </div>

              {/* TESTIMONIALS */}
              <div id="testimonios" className="space-y-6 pt-6">
                <div className="text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-rustic-green">Lo que Dicen Nuestros Usuarios</h3>
                  <p className="text-xs sm:text-sm font-sans text-rustic-muted mt-1">Historias reales del campo y del pabellón comercial</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {TESTIMONIALS.map((t) => (
                    <div 
                      id={`testimonial-${t.id}`}
                      key={t.id} 
                      className="p-6 bg-rustic-surface2/30 border-l-4 border-rustic-green rounded-r-lg relative"
                    >
                      <p className="text-sm font-serif italic text-rustic-text leading-relaxed">
                        {t.text}
                      </p>
                      <div className="text-right mt-4">
                        <strong className="text-xs text-rustic-accent block">{t.author}</strong>
                        <span className="text-[10px] text-rustic-muted font-sans">{t.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB: PRODUCTOS */}
          {activeTab === 'productos' && (
            <motion.div
              key="productos-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Header section with add button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rustic-border/30 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-rustic-accent">Catálogo de Cultivos de Temporada</h2>
                  <p className="text-xs font-sans text-rustic-muted">Explora y compra directo de las chacras asociadas</p>
                </div>

                <button
                  id="add-new-product-btn"
                  onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rustic-accent text-rustic-bg font-sans font-bold text-xs rounded-full border border-rustic-wood hover:brightness-115 active:scale-95 transition-all shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Cultivo</span>
                </button>
              </div>

              {/* Filters Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-rustic-surface2/30 border border-rustic-border/40 p-4 rounded-lg">
                {/* Search query */}
                <div className="relative">
                  <Search className="w-4 h-4 text-rustic-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="product-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar papa, café, naranja, lechuga..."
                    className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent pl-9 pr-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all font-sans"
                    aria-label="Buscar productos por nombre o descripción"
                  />
                </div>

                {/* Categories selector */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-rustic-accent" />
                  <span className="text-xs font-sans text-rustic-muted">Categoría:</span>
                  <select
                    id="category-filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-grow bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-1.5 text-xs text-rustic-text rounded focus:outline-none transition-all font-sans"
                  >
                    <option value="all">Todas las Categorías</option>
                    <option value="Tubérculos">Tubérculos</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Verduras">Verduras</option>
                    <option value="Granos y Abarrotes">Granos y Abarrotes</option>
                  </select>
                </div>

                {/* Counter text */}
                <div className="flex items-center justify-end text-xs font-sans text-rustic-muted">
                  Mostrando <strong className="text-rustic-accent mx-1">{filteredProducts.length}</strong> cultivos disponibles
                </div>
              </div>

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center bg-rustic-surface/30 border border-rustic-border rounded-lg">
                  <ShoppingBag className="w-12 h-12 text-rustic-muted mx-auto mb-3 opacity-55" />
                  <h4 className="text-lg font-bold text-rustic-text">No se encontraron cultivos</h4>
                  <p className="text-xs font-sans text-rustic-muted mt-1">Prueba reajustando la búsqueda o publicando un nuevo cultivo hoy.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => {
                    const provider = providers.find(prov => prov.id === p.providerId);
                    return (
                      <ProductCard
                        key={p.id}
                        product={p}
                        providerName={provider ? provider.name : 'Productor Anon'}
                        onEdit={(prod) => {
                          setEditingProduct(prod);
                          setIsProductModalOpen(true);
                        }}
                        onDelete={handleDeleteProduct}
                        onOrder={(prod) => {
                          setSelectedProductForOrder(prod);
                          setIsOrderModalOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: PROVEEDORES */}
          {activeTab === 'proveedores' && (
            <motion.div
              key="proveedores-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Header section with add button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rustic-border/30 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-rustic-green">Red de Productores Rurales</h2>
                  <p className="text-xs font-sans text-rustic-muted">Sindicato agrario de pequeños agricultores independientes</p>
                </div>

                <button
                  id="add-new-provider-btn"
                  onClick={() => { setEditingProvider(null); setIsProviderModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rustic-green text-white font-sans font-bold text-xs rounded-full border border-rustic-border hover:brightness-115 active:scale-95 transition-all shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Agricultor</span>
                </button>
              </div>

              {/* Search & Statistics Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-rustic-surface2/30 border border-rustic-border/40 p-4 rounded-lg">
                {/* Search */}
                <div className="relative col-span-2">
                  <Search className="w-4 h-4 text-rustic-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="provider-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar productor por nombre, origen (Jauja, Cusco, Cusco...) o cultivo..."
                    className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent pl-9 pr-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all font-sans"
                    aria-label="Buscar agricultores"
                  />
                </div>

                <div className="flex items-center justify-end text-xs font-sans text-rustic-muted">
                  Mostrando <strong className="text-rustic-green mx-1">{filteredProviders.length}</strong> productores integrados
                </div>
              </div>

              {/* Providers Grid */}
              {filteredProviders.length === 0 ? (
                <div className="p-12 text-center bg-rustic-surface/30 border border-rustic-border rounded-lg">
                  <Users className="w-12 h-12 text-rustic-muted mx-auto mb-3 opacity-55" />
                  <h4 className="text-lg font-bold text-rustic-text">No se encontraron productores</h4>
                  <p className="text-xs font-sans text-rustic-muted mt-1">Prueba con otro término de búsqueda o registra un nuevo agricultor rural.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProviders.map((prov) => {
                    const linkedProductsCount = products.filter(p => p.providerId === prov.id).length;
                    return (
                      <ProviderCard
                        key={prov.id}
                        provider={prov}
                        productCount={linkedProductsCount}
                        onEdit={(p) => {
                          setEditingProvider(p);
                          setIsProviderModalOpen(true);
                        }}
                        onDelete={handleDeleteProvider}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: VENDEDORES */}
          {activeTab === 'vendedores' && (
            <motion.div
              key="vendedores-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Header section with add button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rustic-border/30 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-rustic-yellow">Vendedores y Comerciantes de Puestos</h2>
                  <p className="text-xs font-sans text-rustic-muted">Mapeo de minoristas de mercados populares metropolitanos</p>
                </div>

                <button
                  id="add-new-seller-btn"
                  onClick={() => { setEditingSeller(null); setIsSellerModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rustic-accent text-rustic-bg font-sans font-bold text-xs rounded-full border border-rustic-wood hover:brightness-115 active:scale-95 transition-all shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Comerciante</span>
                </button>
              </div>

              {/* Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-rustic-surface2/30 border border-rustic-border/40 p-4 rounded-lg">
                <div className="relative col-span-2">
                  <Search className="w-4 h-4 text-rustic-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="seller-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar comerciante por nombre, mercado o número de puesto..."
                    className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent pl-9 pr-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all font-sans"
                    aria-label="Buscar comerciantes minoristas"
                  />
                </div>

                <div className="flex items-center justify-end text-xs font-sans text-rustic-muted">
                  Mostrando <strong className="text-rustic-yellow mx-1">{filteredSellers.length}</strong> comerciantes registrados
                </div>
              </div>

              {/* Sellers Grid */}
              {filteredSellers.length === 0 ? (
                <div className="p-12 text-center bg-rustic-surface/30 border border-rustic-border rounded-lg">
                  <Store className="w-12 h-12 text-rustic-muted mx-auto mb-3 opacity-55" />
                  <h4 className="text-lg font-bold text-rustic-text">No se encontraron comerciantes</h4>
                  <p className="text-xs font-sans text-rustic-muted mt-1">Prueba reajustando la búsqueda o registra un nuevo comerciante popular.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSellers.map((sell) => {
                    const sellerOrderCount = orders.filter(o => o.sellerId === sell.id).length;
                    return (
                      <SellerCard
                        key={sell.id}
                        seller={sell}
                        orderCount={sellerOrderCount}
                        onEdit={(s) => {
                          setEditingSeller(s);
                          setIsSellerModalOpen(true);
                        }}
                        onDelete={handleDeleteSeller}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: ACTORES (Unified directory) */}
          {activeTab === 'actores' && (
            <motion.div
              key="actores-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-rustic-border/30 pb-4">
                <h2 className="text-2xl font-bold text-rustic-text">Directorio Unificado de Actores</h2>
                <p className="text-xs font-sans text-rustic-muted">Visión colectiva y base de contactos agrarios de MercadoLink</p>
              </div>

              {/* Combined Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-rustic-surface2/30 border border-rustic-border/40 p-4 rounded-lg">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-rustic-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="actors-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, origen, celular o mercado..."
                    className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent pl-9 pr-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all font-sans"
                    aria-label="Buscar actores"
                  />
                </div>

                {/* Role Filter Selector */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-rustic-accent" />
                  <span className="text-xs font-sans text-rustic-muted">Rol:</span>
                  <div className="inline-flex rounded-md border border-rustic-border overflow-hidden text-xs font-sans">
                    <button
                      id="actor-role-all"
                      onClick={() => setActorRoleFilter('all')}
                      className={`px-3 py-1.5 transition-all cursor-pointer ${actorRoleFilter === 'all' ? 'bg-rustic-accent text-rustic-bg font-bold' : 'bg-rustic-surface text-rustic-muted hover:bg-rustic-surface2'}`}
                    >
                      Todos
                    </button>
                    <button
                      id="actor-role-producer"
                      onClick={() => setActorRoleFilter('producer')}
                      className={`px-3 py-1.5 transition-all cursor-pointer ${actorRoleFilter === 'producer' ? 'bg-rustic-green text-white font-bold' : 'bg-rustic-surface text-rustic-muted hover:bg-rustic-surface2'}`}
                    >
                      Productores
                    </button>
                    <button
                      id="actor-role-seller"
                      onClick={() => setActorRoleFilter('seller')}
                      className={`px-3 py-1.5 transition-all cursor-pointer ${actorRoleFilter === 'seller' ? 'bg-rustic-yellow text-rustic-bg font-bold' : 'bg-rustic-surface text-rustic-muted hover:bg-rustic-surface2'}`}
                    >
                      Comerciantes
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs font-sans text-rustic-muted">
                  Contactos listados: <strong className="text-rustic-accent mx-1">{
                    (actorRoleFilter === 'all' ? providers.length + sellers.length :
                     actorRoleFilter === 'producer' ? providers.length : sellers.length)
                  }</strong>
                </div>
              </div>

              {/* Table / Combined grid of actors */}
              <div className="bg-rustic-surface border-2 border-rustic-border rounded-lg overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm font-sans" aria-label="Directorio unificado de actores">
                    <thead>
                      <tr className="bg-rustic-wood/85 border-b-2 border-rustic-border text-rustic-accent font-mono uppercase text-[10px]">
                        <th className="p-4">Retrato / Nombre</th>
                        <th className="p-4">Rol en Cadena</th>
                        <th className="p-4">Ubicación / Mercado</th>
                        <th className="p-4">Contacto Directo</th>
                        <th className="p-4 text-right">Especialidad / Puesto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rustic-border/20 text-rustic-text">
                      {/* 1. Render Providers */}
                      {(actorRoleFilter === 'all' || actorRoleFilter === 'producer') && 
                        providers
                          .filter(prov => prov.name.toLowerCase().includes(searchQuery.toLowerCase()) || prov.location.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((prov) => (
                            <tr id={`actor-row-${prov.id}`} key={prov.id} className="hover:bg-rustic-surface2/40 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <img src={prov.avatar} alt={prov.name} className="w-9 h-9 rounded-full border border-rustic-border object-cover" />
                                <strong className="text-sm font-serif">{prov.name}</strong>
                              </td>
                              <td className="p-4">
                                <span className="bg-rustic-green/10 text-rustic-green font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-rustic-green/20">
                                  Agricultor Rural
                                </span>
                              </td>
                              <td className="p-4 text-rustic-muted">{prov.location}</td>
                              <td className="p-4 font-mono">
                                <a href={`tel:${prov.phone}`} className="hover:text-rustic-accent flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3 text-rustic-accent" /> {prov.phone}
                                </a>
                              </td>
                              <td className="p-4 text-right text-xs text-rustic-accent">
                                {prov.crops.slice(0, 2).join(', ')}...
                              </td>
                            </tr>
                        ))
                      }

                      {/* 2. Render Sellers */}
                      {(actorRoleFilter === 'all' || actorRoleFilter === 'seller') && 
                        sellers
                          .filter(sell => sell.name.toLowerCase().includes(searchQuery.toLowerCase()) || sell.marketName.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((sell) => (
                            <tr id={`actor-row-${sell.id}`} key={sell.id} className="hover:bg-rustic-surface2/40 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <img src={sell.avatar} alt={sell.name} className="w-9 h-9 rounded-full border border-rustic-border object-cover" />
                                <strong className="text-sm font-serif">{sell.name}</strong>
                              </td>
                              <td className="p-4">
                                <span className="bg-rustic-yellow/10 text-rustic-yellow font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-rustic-yellow/20">
                                  Comerciante Minorista
                                </span>
                              </td>
                              <td className="p-4 text-rustic-muted">{sell.marketName}</td>
                              <td className="p-4 font-mono">
                                <a href={`tel:${sell.phone}`} className="hover:text-rustic-accent flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3 text-rustic-accent" /> {sell.phone}
                                </a>
                              </td>
                              <td className="p-4 text-right text-xs text-rustic-accent">
                                {sell.stallNumber}
                              </td>
                            </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: LOGÍSTICA / APP DESPATCH DESK */}
          {activeTab === 'app' && (
            <motion.div
              key="app-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="border-b border-rustic-border/30 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-rustic-accent flex items-center gap-2">
                    <Truck className="w-6 h-6 text-rustic-accent" />
                    <span>Mesa de Logística Rural B2B</span>
                  </h2>
                  <p className="text-xs font-sans text-rustic-muted">Simulador interactivo de despacho y distribución de alimentos</p>
                </div>
              </div>

              {/* Trading Desk layout wrapper */}
              <TradingDesk
                orders={orders}
                sellers={sellers}
                providers={providers}
                products={products}
                onUpdateStatus={handleUpdateOrderStatus}
                onOpenOrderModal={() => {
                  if (products.length === 0) {
                    alert('Debe publicar al menos un cultivo en el catálogo para iniciar compras.');
                    return;
                  }
                  setSelectedProductForOrder(products[0]);
                  setIsOrderModalOpen(true);
                }}
              />
            </motion.div>
          )}

          {/* TAB: PLANTILLAS THYMELEAF */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-rustic-border/30 pb-4">
                <h2 className="text-2xl font-bold text-rustic-accent flex items-center gap-2">
                  <FileCode className="w-6 h-6 text-rustic-accent" />
                  <span>Gestor de Plantillas Agrícolas B2B</span>
                </h2>
                <p className="text-xs font-sans text-rustic-muted">Consola interactiva con motor de interpretación Thymeleaf para fichas técnicas y contratos</p>
              </div>

              <ThymeleafManager
                providers={providers}
                products={products}
                orders={orders}
                onShowToast={showToast}
              />
            </motion.div>
          )}

          {/* TAB: INGRESO / LOGIN STATION */}
          {activeTab === 'login' && (
            <motion.div
              key="login-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-rustic-border/30 pb-4">
                <h2 className="text-2xl font-bold text-rustic-accent flex items-center gap-2 justify-center">
                  <IdCard className="w-6 h-6 text-rustic-accent" />
                  <span>Oficina de Identificación Agraria</span>
                </h2>
                <p className="text-xs font-sans text-rustic-muted text-center">Registra o firma el padrón rústico para habilitar tus permisos de abasto</p>
              </div>

              <LoginStation
                providers={providers}
                sellers={sellers}
                session={session}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onShowToast={showToast}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 4. Rustic Footnote / Footer */}
      <footer className="landing-footer border-t-4 border-rustic-wood bg-rustic-surface mt-12 py-10 text-center font-sans text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          
          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            <button id="foot-link-inicio" onClick={() => handleSelectTab('inicio')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer">Inicio</button>
            <button id="foot-link-productos" onClick={() => handleSelectTab('productos')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer">Productos</button>
            <button id="foot-link-proveedores" onClick={() => handleSelectTab('proveedores')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer">Proveedores</button>
            <button id="foot-link-vendedores" onClick={() => handleSelectTab('vendedores')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer">Vendedores</button>
            <button id="foot-link-actores" onClick={() => handleSelectTab('actores')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer">Actores</button>
            <button id="foot-link-templates" onClick={() => handleSelectTab('templates')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer">Plantillas B2B</button>
            <button id="foot-link-login" onClick={() => handleSelectTab('login')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer">Acceso Socio</button>
            <button id="foot-link-app" onClick={() => handleSelectTab('app')} className="text-rustic-muted hover:text-rustic-accent transition-colors cursor-pointer font-bold">Mesa de Despacho</button>
          </div>

          <div className="border-t border-rustic-border/20 pt-6 text-rustic-muted flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div>
              <p className="font-serif text-sm text-rustic-text">MercadoLink B2B · Mercado Mayorista Rústico</p>
              <p className="text-[10px] mt-1 text-rustic-muted/80">Conectando el campo con los pabellones de la ciudadanía · Aspropa</p>
            </div>
            <div className="text-center md:text-right">
              <p>© 2026 MercadoLink Inc. Todos los derechos reservados.</p>
              <p className="text-[9px] font-mono text-rustic-muted mt-0.5">Local: Lima, Perú · Suministro Rural Coordinado</p>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Modals Container */}
      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
        onSave={handleSaveProduct}
        product={editingProduct}
        providers={providers}
      />

      {/* Provider Form Modal */}
      <ProviderFormModal
        isOpen={isProviderModalOpen}
        onClose={() => { setIsProviderModalOpen(false); setEditingProvider(null); }}
        onSave={handleSaveProvider}
        provider={editingProvider}
      />

      {/* Seller Form Modal */}
      <SellerFormModal
        isOpen={isSellerModalOpen}
        onClose={() => { setIsSellerModalOpen(false); setEditingSeller(null); }}
        onSave={handleSaveSeller}
        seller={editingSeller}
      />

      {/* Order Simulation Modal */}
      <OrderSimulationModal
        isOpen={isOrderModalOpen}
        onClose={() => { setIsOrderModalOpen(false); setSelectedProductForOrder(null); }}
        product={selectedProductForOrder}
        sellers={sellers}
        providers={providers}
        onOrderPlaced={handlePlaceOrder}
      />

    </div>
  );
}
