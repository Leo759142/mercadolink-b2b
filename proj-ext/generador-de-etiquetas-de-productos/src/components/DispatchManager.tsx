import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { Product, Dispatch } from '../types';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  AlertCircle, 
  Printer, 
  Package, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Barcode,
  Barcode as BarcodeIcon,
  Search,
  X
} from 'lucide-react';

interface DispatchManagerProps {
  currentUser: any;
  products: Product[];
}

export const DispatchManager: React.FC<DispatchManagerProps> = ({ currentUser, products }) => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [dispatchesLoading, setDispatchesLoading] = useState(true);
  
  // Form State
  const [destination, setDestination] = useState('Almacén Central (Lima)');
  const [notes, setNotes] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [selectedProductSearch, setSelectedProductSearch] = useState('');

  // UI state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDispatchDetail, setActiveDispatchDetail] = useState<Dispatch | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load dispatches
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'dispatches'),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Dispatch[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Dispatch);
      });
      // Sort by newest
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setDispatches(list);
      setDispatchesLoading(false);
    }, (error) => {
      console.error("Error loading dispatches:", error);
      setErrorMessage("No se pudieron cargar los despachos.");
      setDispatchesLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Set default arrival date (tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setEstimatedArrival(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Filtered dispatches
  const filteredDispatches = dispatches.filter(d => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  // Add Item to Shipment form
  const handleAddItem = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const exists = selectedItems.find(item => item.productId === productId);
    if (exists) {
      // Check if exceeding stock
      if (exists.quantity >= prod.stock) {
        alert(`No puedes despachar más del stock disponible (${prod.stock} unidades).`);
        return;
      }
      setSelectedItems(prev => prev.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setSelectedItems(prev => [...prev, { productId, quantity: 1 }]);
    }
  };

  // Remove Item from shipment form
  const handleRemoveItem = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, qty: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (qty > prod.stock) {
      alert(`El stock máximo es de ${prod.stock} unidades.`);
      qty = prod.stock;
    }

    setSelectedItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: qty } 
        : item
    ));
  };

  // Submit Dispatch Creation
  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (selectedItems.length === 0) {
      setErrorMessage("Debes añadir al menos un producto al despacho.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const dispatchCode = `DESP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Map selected items to final format with names/skus/prices
    const dispatchProducts = selectedItems.map(item => {
      const p = products.find(prod => prod.id === item.productId)!;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        quantity: item.quantity,
        price: p.price
      };
    });

    const dispatchData = {
      dispatchCode,
      ownerId: currentUser.uid,
      destination,
      status: 'pending',
      products: dispatchProducts,
      estimatedArrival,
      notes: notes.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      // Deduct stock in catalog
      for (const item of selectedItems) {
        const productRef = doc(db, 'products', item.productId);
        const prod = products.find(p => p.id === item.productId)!;
        const nextStock = Math.max(0, prod.stock - item.quantity);
        await updateDoc(productRef, {
          stock: nextStock,
          updatedAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, 'dispatches'), dispatchData);
      setSuccessMessage(`¡Despacho comercial ${dispatchCode} creado y lote de inventario descontado con éxito!`);
      setSelectedItems([]);
      setNotes('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error creating dispatch:", err);
      setErrorMessage("Ocurrió un error al registrar el despacho. Permiso denegado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (dispatchId: string, status: 'pending' | 'in_transit' | 'delivered' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'dispatches', dispatchId), {
        status,
        updatedAt: serverTimestamp()
      });
      if (activeDispatchDetail && activeDispatchDetail.id === dispatchId) {
        setActiveDispatchDetail(prev => prev ? { ...prev, status } : null);
      }
      setSuccessMessage("Estado del despacho actualizado correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("No se pudo actualizar el estado de entrega.");
    }
  };

  const handleDeleteDispatch = async (dispatch: Dispatch) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el registro del despacho ${dispatch.dispatchCode}? No restaurará el stock automáticamente.`)) return;
    try {
      await deleteDoc(doc(db, 'dispatches', dispatch.id));
      if (activeDispatchDetail?.id === dispatch.id) {
        setActiveDispatchDetail(null);
      }
      setSuccessMessage("Registro de despacho eliminado.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error al eliminar.");
    }
  };

  // Filter products for dropdown
  const filteredProductsToSelect = products.filter(p => {
    if (p.stock <= 0) return false;
    const s = selectedProductSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s);
  });

  // Calculate stats
  const totalDispatchedMoney = dispatches
    .filter(d => d.status !== 'cancelled')
    .reduce((acc, d) => acc + d.products.reduce((sum, p) => sum + (p.price * p.quantity), 0), 0);

  const pendingCount = dispatches.filter(d => d.status === 'pending').length;
  const transitCount = dispatches.filter(d => d.status === 'in_transit').length;
  const deliveredCount = dispatches.filter(d => d.status === 'delivered').length;

  return (
    <div className="space-y-8" id="dispatch-logistics-workspace">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Truck className="h-3.5 w-3.5" /> Logística Integrada de Etiquetado
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Despachos & Lotes de Salida
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Agrupa productos en lotes de distribución, calcula costos totales de mercancía con sus etiquetas de código de barras impresas y distribúyelos a tus puntos de venta autorizados de forma fluida.
          </p>
        </div>
        <Truck className="hidden lg:block absolute right-12 top-4 h-32 w-32 text-slate-800/40" />
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI mini row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Flujo Total Despachado</span>
          <span className="text-lg font-black font-mono text-slate-800">${totalDispatchedMoney.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Pendientes de Salida</span>
          <span className="text-lg font-black font-mono text-amber-500">{pendingCount} despachos</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">En Tránsito / Ruta</span>
          <span className="text-lg font-black font-mono text-indigo-500">{transitCount} envíos</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Entregados con éxito</span>
          <span className="text-lg font-black font-mono text-emerald-600">{deliveredCount} entregas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Create Dispatch (Lote de Salida) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCreateDispatch} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Nueva Orden de Despacho (Packing List)
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Establecimiento Destino</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Almacén Central (Lima)">Almacén Central (Lima)</option>
                  <option value="Sucursal Norte (Chiclayo)">Sucursal Norte (Chiclayo)</option>
                  <option value="Sucursal Sur (Arequipa)">Sucursal Sur (Arequipa)</option>
                  <option value="Distribuidor Autorizado (Rímac)">Distribuidor Autorizado (Rímac)</option>
                  <option value="Envío Directo a Cliente Final">Envío Directo a Cliente Final</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Salida</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600">
                    Hoy (Inmediato)
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Llegada Estimada</label>
                  <input
                    type="date"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Product Selector for Dispatch */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Añadir Artículos al Despacho</label>
                
                {/* Micro search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={selectedProductSearch}
                    onChange={(e) => setSelectedProductSearch(e.target.value)}
                    placeholder="Escribe para buscar (ej. Teclado, SKU)..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="max-h-[160px] overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 divide-y divide-slate-100 p-1">
                  {filteredProductsToSelect.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-4">No se encontraron productos disponibles con stock.</p>
                  ) : (
                    filteredProductsToSelect.map(p => {
                      const addedItem = selectedItems.find(item => item.productId === p.id);
                      const currentQty = addedItem?.quantity || 0;
                      return (
                        <div key={p.id} className="p-2 flex justify-between items-center text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="block font-bold text-slate-700 truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Stock: {p.stock} u. | {p.sku}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddItem(p.id)}
                            disabled={currentQty >= p.stock}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                              currentQty >= p.stock 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            <Plus className="h-3 w-3" /> {currentQty > 0 ? `+${currentQty}` : 'Añadir'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected items with quantity editor */}
              {selectedItems.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Productos Seleccionados</span>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {selectedItems.map(item => {
                      const p = products.find(prod => prod.id === item.productId);
                      if (!p) return null;
                      return (
                        <div key={item.productId} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="min-w-0 pr-2">
                            <span className="block font-bold text-slate-700 text-xs truncate leading-snug">{p.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">P. Unit: ${p.price.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="1"
                              max={p.stock}
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 0)}
                              className="w-12 text-center py-1 border border-slate-200 rounded-lg text-xs font-bold font-mono bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notas / Observaciones del Chofer</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Llevar etiquetas térmicas de repuesto para caja master."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 shadow-md flex items-center justify-center gap-2 transition uppercase tracking-wider"
              >
                <Check className="h-4 w-4" />
                {isSubmitting ? 'Registrando Despacho...' : 'Aprobar & Despachar'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: List & Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dispatch List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-500" />
                Órdenes de Despacho Registradas ({dispatches.length})
              </h3>

              {/* Status Filter */}
              <div className="flex gap-1">
                {['all', 'pending', 'in_transit', 'delivered'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition ${
                      filterStatus === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {s === 'all' && 'Todos'}
                    {s === 'pending' && 'Pendiente'}
                    {s === 'in_transit' && 'Ruta'}
                    {s === 'delivered' && 'Entregado'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {dispatchesLoading ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <div className="h-6 w-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Cargando logística...</p>
                </div>
              ) : filteredDispatches.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Truck className="h-10 w-10 text-slate-200 mx-auto" />
                  <p className="text-xs italic">No hay despachos comerciales {filterStatus !== 'all' ? 'con este estado' : 'creados'}.</p>
                </div>
              ) : (
                filteredDispatches.map((disp) => {
                  const itemsCount = disp.products.reduce((acc, p) => acc + p.quantity, 0);
                  const totalVal = disp.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
                  return (
                    <div 
                      key={disp.id} 
                      onClick={() => setActiveDispatchDetail(disp)}
                      className={`p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition ${activeDispatchDetail?.id === disp.id ? 'bg-indigo-50/20 border-l-4 border-indigo-500 pl-3' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-950">{disp.dispatchCode}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            disp.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            disp.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                            disp.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {disp.status === 'pending' && 'Por Salir'}
                            {disp.status === 'in_transit' && 'En Ruta'}
                            {disp.status === 'delivered' && 'Recibido'}
                            {disp.status === 'cancelled' && 'Anulado'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 shrink-0" /> {disp.destination}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Package className="h-3 w-3 shrink-0" /> {itemsCount} bultos</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <span className="block font-mono font-extrabold text-xs text-slate-900">${totalVal.toFixed(2)}</span>
                          <span className="block text-[9px] text-slate-400 font-medium">Llegada: {disp.estimatedArrival}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detailed Dispatch Waybill Modal style */}
          {activeDispatchDetail && (
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-lg space-y-4 relative animate-scaleUp">
              <button
                type="button"
                onClick={() => setActiveDispatchDetail(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="border-b border-dashed border-slate-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold font-mono tracking-widest uppercase">Packing Waybill</span>
                    <h4 className="text-lg font-black text-slate-900 mt-1">Guía Oficial de Despacho</h4>
                    <span className="text-xs font-bold text-indigo-600 font-mono">{activeDispatchDetail.dispatchCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5 self-start">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition"
                    >
                      <Printer className="h-3.5 w-3.5" /> Imprimir Guía
                    </button>
                    <button
                      onClick={() => handleDeleteDispatch(activeDispatchDetail)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                      title="Eliminar Registro"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-semibold text-slate-600">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Destino</p>
                    <p className="text-slate-800 flex items-center gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {activeDispatchDetail.destination}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Llegada Estimada</p>
                    <p className="text-slate-800 flex items-center gap-1 mt-0.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /> {activeDispatchDetail.estimatedArrival}</p>
                  </div>
                </div>
              </div>

              {/* Items listing */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Artículos Incorporados</span>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                  {activeDispatchDetail.products.map((p, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <BarcodeIcon className="h-3 w-3" /> SKU: {p.sku} | Unit: ${p.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{p.quantity} uds</span>
                        <p className="font-mono text-[11px] font-bold text-slate-900 mt-1">${(p.price * p.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activeDispatchDetail.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="block font-bold text-slate-400 uppercase text-[9px] mb-1">Notas Internas</span>
                  <p className="text-slate-600 font-medium italic">"{activeDispatchDetail.notes}"</p>
                </div>
              )}

              {/* Action row to update shipping status */}
              <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Cambiar de Estado</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleUpdateStatus(activeDispatchDetail.id, 'in_transit')}
                    disabled={activeDispatchDetail.status === 'in_transit'}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                  >
                    Marcar En Tránsito
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(activeDispatchDetail.id, 'delivered')}
                    disabled={activeDispatchDetail.status === 'delivered'}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                  >
                    Marcar Entregado
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(activeDispatchDetail.id, 'cancelled')}
                    disabled={activeDispatchDetail.status === 'cancelled'}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                  >
                    Anular Guía
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
