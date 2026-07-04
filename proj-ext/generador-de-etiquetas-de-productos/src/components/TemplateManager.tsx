import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { UserLabelTemplate, Product } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Eye, 
  Palette, 
  Type, 
  Settings, 
  Check, 
  Sparkles, 
  Barcode, 
  FileText,
  Tag,
  AlertTriangle
} from 'lucide-react';

interface TemplateManagerProps {
  currentUser: any;
  products: Product[];
}

const PRESET_BG_COLORS = [
  { name: 'Blanco Puro', value: '#FFFFFF' },
  { name: 'Crema Vintage', value: '#FDFBF7' },
  { name: 'Ceniza Suave', value: '#F8FAFC' },
  { name: 'Rosa Pastel', value: '#FFF1F2' },
  { name: 'Verde Menta', value: '#ECFDF5' },
  { name: 'Azul Hielo', value: '#F0F9FF' },
  { name: 'Oro Viejo', value: '#FFFBEB' },
  { name: 'Pizarra Oscuro', value: '#0F172A' },
  { name: 'Obsidiana Cyber', value: '#020617' }
];

const PRESET_TEXT_COLORS = [
  { name: 'Negro Carbón', value: '#0F172A' },
  { name: 'Pizarra', value: '#334155' },
  { name: 'Marrón Cuero', value: '#451A03' },
  { name: 'Rojo Carmesí', value: '#9F1239' },
  { name: 'Verde Bosque', value: '#064E3B' },
  { name: 'Azul Marino', value: '#1E3A8A' },
  { name: 'Verde Neón', value: '#34D399' },
  { name: 'Gris Plata', value: '#E2E8F0' },
  { name: 'Blanco', value: '#FFFFFF' }
];

const SAMPLE_PRODUCT: Partial<Product> = {
  name: 'Mesa Ratona Escandinava',
  sku: 'MESA-ESC-482',
  brand: 'Estilo Nórdico',
  price: 189.90,
  category: 'Hogar y Jardín',
  stock: 12
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({ currentUser, products }) => {
  const [templates, setTemplates] = useState<UserLabelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#0F172A');
  const [borderColor, setBorderColor] = useState('#0F172A');
  const [borderStyle, setBorderStyle] = useState<'solid' | 'dashed' | 'double' | 'dotted' | 'none'>('solid');
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderRadius, setBorderRadius] = useState<number>(8);
  const [paddingStyle, setPaddingStyle] = useState<'tight' | 'normal' | 'loose'>('normal');
  const [fontSizeStyle, setFontSizeStyle] = useState<'compact' | 'standard' | 'large'>('standard');
  const [badgeIcon, setBadgeIcon] = useState<'none' | 'star' | 'crown' | 'leaf' | 'check' | 'premium'>('none');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [customNote, setCustomNote] = useState('Garantía de Calidad Premium');

  // Real-time listener for user templates
  useEffect(() => {
    if (!currentUser) return;

    const templatesRef = collection(db, 'templates');
    const q = query(
      templatesRef,
      where('ownerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserLabelTemplate[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as UserLabelTemplate);
        });
        setTemplates(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar plantillas:', err);
        setLoading(false);
        setError('No se pudieron sincronizar las plantillas de etiquetas.');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Handle open creation mode
  const handleOpenCreate = () => {
    setCurrentId(null);
    setName('Nueva Plantilla Personalizada');
    setDescription('Plantilla creada para productos específicos.');
    setBackgroundColor('#FFFFFF');
    setTextColor('#0F172A');
    setBorderColor('#0F172A');
    setBorderStyle('solid');
    setBorderWidth(2);
    setBorderRadius(8);
    setPaddingStyle('normal');
    setFontSizeStyle('standard');
    setBadgeIcon('none');
    setFontFamily('sans');
    setShowName(true);
    setShowPrice(true);
    setShowSku(true);
    setShowBrand(true);
    setShowCategory(true);
    setShowBarcode(true);
    setCustomNote('Producto Seleccionado');
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  // Handle load template to form for editing
  const handleOpenEdit = (t: UserLabelTemplate) => {
    setCurrentId(t.id);
    setName(t.name);
    setDescription(t.description || '');
    setBackgroundColor(t.backgroundColor || '#FFFFFF');
    setTextColor(t.textColor || '#0F172A');
    setBorderColor(t.borderColor || '#0F172A');
    setBorderStyle(t.borderStyle || 'solid');
    setBorderWidth(t.borderWidth || 2);
    setBorderRadius(t.borderRadius !== undefined ? t.borderRadius : 8);
    setPaddingStyle(t.paddingStyle || 'normal');
    setFontSizeStyle(t.fontSizeStyle || 'standard');
    setBadgeIcon(t.badgeIcon || 'none');
    setFontFamily(t.fontFamily || 'sans');
    setShowName(t.showName !== undefined ? t.showName : true);
    setShowPrice(t.showPrice !== undefined ? t.showPrice : true);
    setShowSku(t.showSku !== undefined ? t.showSku : true);
    setShowBrand(t.showBrand !== undefined ? t.showBrand : true);
    setShowCategory(t.showCategory !== undefined ? t.showCategory : true);
    setShowBarcode(t.showBarcode !== undefined ? t.showBarcode : true);
    setCustomNote(t.customNote || '');
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  // Handle delete
  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta plantilla? Los productos asociados volverán a usar la plantilla clásica.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'templates', id));
      setSuccess('Plantilla eliminada correctamente.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `templates/${id}`);
    }
  };

  // Save Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la plantilla es obligatorio.');
      return;
    }

    setError(null);
    setSuccess(null);

    const templateData = {
      name: name.trim(),
      description: description.trim(),
      backgroundColor,
      textColor,
      borderColor,
      borderStyle,
      borderWidth: Number(borderWidth),
      borderRadius: Number(borderRadius),
      paddingStyle,
      fontSizeStyle,
      badgeIcon,
      fontFamily,
      showName,
      showPrice,
      showSku,
      showBrand,
      showCategory,
      showBarcode,
      customNote: customNote.trim(),
      ownerId: currentUser.uid,
      updatedAt: serverTimestamp()
    };

    try {
      if (currentId) {
        // Edit existing
        const docRef = doc(db, 'templates', currentId);
        await updateDoc(docRef, {
          ...templateData
        });
        setSuccess('Plantilla actualizada correctamente.');
      } else {
        // Create new
        const collRef = collection(db, 'templates');
        await addDoc(collRef, {
          ...templateData,
          createdAt: serverTimestamp()
        });
        setSuccess('Plantilla creada correctamente.');
      }
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      handleFirestoreError(err, currentId ? OperationType.UPDATE : OperationType.CREATE, currentId ? `templates/${currentId}` : 'templates');
    }
  };

  // Helper styles for preview
  const getFontClass = () => {
    switch (fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  const getPaddingClass = () => {
    switch (paddingStyle) {
      case 'tight': return 'p-3 min-h-[180px]';
      case 'loose': return 'p-8 min-h-[260px]';
      default: return 'p-6 min-h-[220px]';
    }
  };

  const getFontSizeClasses = () => {
    switch (fontSizeStyle) {
      case 'compact': return { title: 'text-sm', price: 'text-lg', text: 'text-[10px]' };
      case 'large': return { title: 'text-xl', price: 'text-3xl', text: 'text-xs' };
      default: return { title: 'text-base sm:text-lg font-extrabold', price: 'text-2xl font-black font-mono', text: 'text-[11px]' };
    }
  };

  const fontSizes = getFontSizeClasses();

  // Visual style for label
  const labelStyle = {
    backgroundColor: backgroundColor,
    color: textColor,
    borderColor: borderColor,
    borderStyle: borderStyle,
    borderWidth: `${borderWidth}px`,
    borderRadius: `${borderRadius}px`,
  };

  return (
    <div className="space-y-6" id="templates-workspace">
      {/* Header and Introduction */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Palette className="h-6 w-6 text-indigo-600" /> Diseño de Plantillas Personalizadas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Diseña el formato visual de tus etiquetas con colores, bordes y fuentes personalizadas. Aplícalas dinámicamente a tus productos.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/15 flex items-center gap-1.5 transition"
          >
            <Plus className="h-4 w-4" /> Crear Nueva Plantilla
          </button>
        )}
      </div>

      {/* Message banners */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Editor / Left */}
          <form onSubmit={handleSaveTemplate} className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-600" /> 
                {currentId ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[700px] overflow-y-auto">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre de Plantilla</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Minimalista Crema"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción Corta</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Ideal para productos rústicos"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Style Presets & Palette */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-indigo-500" /> Estilo y Colores
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fondo de Etiqueta</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {PRESET_BG_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          title={color.name}
                          onClick={() => setBackgroundColor(color.value)}
                          className="w-4 h-4 rounded-full border border-slate-300 transition-transform hover:scale-125"
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Color del Texto</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {PRESET_TEXT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          title={color.name}
                          onClick={() => setTextColor(color.value)}
                          className="w-4 h-4 rounded-full border border-slate-300 transition-transform hover:scale-125"
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipografía (Fuente)</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="sans">Sans Serif (Inter)</option>
                      <option value="serif">Elegant Serif (Georgia)</option>
                      <option value="mono">Código Mono (Fira Code)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estilo del Borde</label>
                    <select
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="solid">Línea Continua</option>
                      <option value="dashed">Segmentado (Dashed)</option>
                      <option value="double">Doble Borde</option>
                      <option value="dotted">Punteado</option>
                      <option value="none">Sin Borde</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Borde ({borderWidth}px)</label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={borderWidth}
                      onChange={(e) => setBorderWidth(Number(e.target.value))}
                      className="w-full mt-2 accent-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Color del Borde</label>
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Esquinas Redondeadas ({borderRadius}px)</label>
                    <select
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="0">Recto (0px)</option>
                      <option value="4">Suave (4px)</option>
                      <option value="8">Medio (8px)</option>
                      <option value="12">Redondeado (12px)</option>
                      <option value="16">Estilo Tarjeta (16px)</option>
                      <option value="24">Píldora (24px)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sello / Ícono de Distinción</label>
                    <select
                      value={badgeIcon}
                      onChange={(e) => setBadgeIcon(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="none">Ninguno</option>
                      <option value="star">★ Estrella (Garantía)</option>
                      <option value="crown">👑 Corona (Premium)</option>
                      <option value="leaf">🍃 Eco (Artesanal/Ecológico)</option>
                      <option value="check">✔ Verificado (Original)</option>
                      <option value="premium">✨ Destello (Destacado)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Espaciado (Padding)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['tight', 'normal', 'loose'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaddingStyle(mode)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition ${
                            paddingStyle === mode
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {mode === 'tight' ? 'Ajustado' : mode === 'normal' ? 'Medio' : 'Espacio'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Escala de Letra</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['compact', 'standard', 'large'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFontSizeStyle(mode)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition ${
                            fontSizeStyle === mode
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {mode === 'compact' ? 'Chica' : mode === 'standard' ? 'Estándar' : 'Grande'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Elements Visiblity & Custom Note */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-indigo-500" /> Contenido de Etiqueta
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showName}
                      onChange={(e) => setShowName(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Nombre de Producto</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Precio</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showSku}
                      onChange={(e) => setShowSku(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Código SKU / Texto</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showBrand}
                      onChange={(e) => setShowBrand(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Marca</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showCategory}
                      onChange={(e) => setShowCategory(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Categoría</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showBarcode}
                      onChange={(e) => setShowBarcode(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Gráfico de Código de Barras</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nota o Sello en Pie de Etiqueta</label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Ej. Hecho a mano, 100% Algodón, etc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition"
              >
                <Save className="h-3.5 w-3.5" /> Guardar Diseño
              </button>
            </div>
          </form>

          {/* Visual Live Label Canvas Preview / Right */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-indigo-50/50 rounded-2xl p-8 border border-indigo-100 min-h-[450px]">
            <span className="text-[10px] font-mono font-bold text-indigo-600 mb-6 tracking-widest flex items-center gap-1.5 uppercase">
              <Eye className="h-4 w-4 animate-pulse" /> Vista Previa en Tiempo Real de Plantilla
            </span>

            {/* Label Card */}
            <div 
              style={labelStyle}
              className={`w-72 sm:w-80 shadow-xl transition-all duration-300 relative select-none flex flex-col justify-between ${getPaddingClass()} ${getFontClass()}`}
            >
              {/* Distinct Badge Seal */}
              {badgeIcon !== 'none' && (
                <div 
                  className="absolute -top-3.5 -right-3.5 flex items-center justify-center bg-white/95 backdrop-blur-xs w-8 h-8 rounded-full border shadow-md font-bold text-lg select-none hover:scale-110 transition cursor-help"
                  style={{ borderColor: borderColor }}
                  title="Sello de distinción de plantilla"
                >
                  {badgeIcon === 'star' && '⭐'}
                  {badgeIcon === 'crown' && '👑'}
                  {badgeIcon === 'leaf' && '🍃'}
                  {badgeIcon === 'check' && '✅'}
                  {badgeIcon === 'premium' && '✨'}
                </div>
              )}

              {/* Card top branding */}
              <div className="flex justify-between items-start gap-2 mb-2 border-b border-dashed pb-2 opacity-85" style={{ borderColor: textColor }}>
                {showBrand && (
                  <span className={`${fontSizes.text} font-bold tracking-widest uppercase`}>
                    {SAMPLE_PRODUCT.brand}
                  </span>
                )}
                {showCategory && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold bg-black/5">
                    {SAMPLE_PRODUCT.category}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="my-auto space-y-2">
                {showName && (
                  <h3 className={`${fontSizes.title} leading-tight tracking-tight font-extrabold`}>
                    {SAMPLE_PRODUCT.name}
                  </h3>
                )}

                {showPrice && (
                  <p className={`${fontSizes.price}`}>
                    ${SAMPLE_PRODUCT.price?.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Barcode representation */}
              {showBarcode && (
                <div className="mt-3 flex flex-col items-center justify-center bg-white/95 p-2 rounded-lg text-black">
                  <div className="w-full flex justify-between items-stretch h-8 px-1 mb-1" id="mock-barcode-lines">
                    <span className="w-[2px] bg-black"></span>
                    <span className="w-[1px] bg-black"></span>
                    <span className="w-[4px] bg-black"></span>
                    <span className="w-[1px] bg-transparent"></span>
                    <span className="w-[2px] bg-black"></span>
                    <span className="w-[1px] bg-black"></span>
                    <span className="w-[3px] bg-black"></span>
                    <span className="w-[2px] bg-transparent"></span>
                    <span className="w-[1px] bg-black"></span>
                    <span className="w-[4px] bg-black"></span>
                    <span className="w-[2px] bg-transparent"></span>
                    <span className="w-[3px] bg-black"></span>
                    <span className="w-[1px] bg-black"></span>
                    <span className="w-[2px] bg-black"></span>
                    <span className="w-[1px] bg-transparent"></span>
                    <span className="w-[4px] bg-black"></span>
                    <span className="w-[1px] bg-black"></span>
                    <span className="w-[2px] bg-black"></span>
                  </div>
                  {showSku && (
                    <span className="font-mono text-[9px] tracking-[4px] font-bold">
                      {SAMPLE_PRODUCT.sku}
                    </span>
                  )}
                </div>
              )}

              {/* Custom Note or Seal */}
              {customNote && (
                <div className="mt-4 pt-2 border-t border-dashed text-center text-[9px] font-semibold tracking-wider uppercase opacity-80" style={{ borderColor: textColor }}>
                  {customNote}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-slate-400 text-[11px] max-w-xs text-center leading-relaxed">
              <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>Los colores y bordes que elijas se aplicarán dinámicamente usando código nativo y CSS.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Template List Mode */
        <div className="space-y-6">
          {loading ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
              <div className="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 mt-2">Sincronizando plantillas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Built-in Defaults Information card */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-600 tracking-wider uppercase">Por Defecto</span>
                  <h3 className="font-bold text-slate-800 text-sm mt-2">Plantillas del Sistema</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    TagCraft Pro viene con 6 diseños integrados de fábrica (Elegante Clásico, Cyber Neon, Mínimo Suave, Industrial, etc.) accesibles en la pestaña de edición de cualquier producto.
                  </p>
                </div>
                <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-indigo-600 font-semibold flex items-center gap-1">
                  <span>Listas para aplicar a productos</span>
                </div>
              </div>

              {/* User created templates */}
              {templates.map((t) => {
                const associatedProducts = products.filter(p => p.templateId === t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenEdit(t)}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between relative group"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 tracking-wider uppercase">Diseño Personalizado</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTemplate(t.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mt-2">{t.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {t.description || 'Diseño de etiqueta personalizable con bordes, fuentes y campos habilitados.'}
                      </p>

                      {/* Micro Preview Circle */}
                      <div className="mt-4 flex items-center gap-3">
                        <div 
                          className="w-10 h-7 rounded border shadow-sm"
                          style={{
                            backgroundColor: t.backgroundColor,
                            borderColor: t.borderColor,
                            borderStyle: t.borderStyle as any,
                            borderWidth: `${t.borderWidth}px`
                          }}
                        />
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">
                          {t.fontFamily} • {t.backgroundColor}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-slate-300" /> 
                        {associatedProducts.length} productos asignados
                      </span>
                      <span className="text-[10px] text-slate-300">ID: {t.id.substring(0, 5)}...</span>
                    </div>
                  </div>
                );
              })}

              {/* Blank state - Create card */}
              {templates.length === 0 && (
                <div 
                  onClick={handleOpenCreate}
                  className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 transition cursor-pointer flex flex-col items-center justify-center text-center py-10 min-h-[200px]"
                >
                  <Palette className="h-8 w-8 text-slate-300 mb-2 group-hover:text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700">Diseña tu primera etiqueta</span>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                    Configura la combinación perfecta de tipografías y colores que resalten tu marca y productos.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
