export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  ownerId: string;
  createdAt: any; // Firestore Timestamp or ISO string
  updatedAt: any;
  brand: string;
  templateId: string; // 'classic' | 'modern' | 'minimal' | 'neon' | 'industrial' | 'badge'
}

export interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  themeClass: string; // CSS theme styling
}

export interface UserLabelTemplate {
  id: string;
  name: string;
  description: string;
  backgroundColor: string; // Hex color or Tailwind color class
  textColor: string; // Hex color or Tailwind color class
  borderColor: string; // Hex color or Tailwind color class
  borderStyle: 'solid' | 'dashed' | 'double' | 'dotted' | 'none';
  borderWidth: number; // Border thickness
  borderRadius?: number; // Border radius: 0 (none), 4 (sm), 8 (md), 12 (lg), 24 (full)
  paddingStyle?: 'tight' | 'normal' | 'loose'; // Padding density
  fontSizeStyle?: 'compact' | 'standard' | 'large'; // Text scale
  badgeIcon?: 'none' | 'star' | 'crown' | 'leaf' | 'check' | 'premium'; // Mini watermark badge
  fontFamily: 'sans' | 'serif' | 'mono';
  showName: boolean;
  showPrice: boolean;
  showSku: boolean;
  showBrand: boolean;
  showCategory: boolean;
  showBarcode: boolean;
  customNote: string;
  ownerId: string;
  createdAt: any;
  updatedAt: any;
}

export interface PricingSettings {
  id: string;
  ownerId: string;
  markupFactor: number;
  lowStockThreshold: number;
  scarcityMarkup: number;
  highStockDiscount: number;
  bundleDiscount: number;
  updatedAt: any;
}

export interface Dispatch {
  id: string;
  dispatchCode: string;
  ownerId: string;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  products: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }[];
  estimatedArrival: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Bundle {
  id: string;
  ownerId: string;
  primaryProductId: string;
  secondaryProductId: string;
  discount: number;
  isActive: boolean;
  customTitle?: string;
  createdAt: any;
  updatedAt: any;
}

export const AVAILABLE_TEMPLATES: LabelTemplate[] = [
  {
    id: 'classic',
    name: 'Elegante Clásico',
    description: 'Bordes finos negros, tipografía serif, ideal para joyería y vino.',
    themeClass: 'bg-white border-2 border-slate-800 text-slate-900 font-serif'
  },
  {
    id: 'modern',
    name: 'Moderno & Limpio',
    description: 'Estilo sans-serif sans-serif con acento azul, ideal para tecnología.',
    themeClass: 'bg-slate-50 border-t-4 border-blue-600 border-x border-b border-slate-200 text-slate-900 font-sans shadow-sm'
  },
  {
    id: 'minimal',
    name: 'Mínimo Suave',
    description: 'Diseño minimalista con fondo crema y tonos apagados de café.',
    themeClass: 'bg-[#FDFBF7] border border-stone-200 text-stone-800 font-sans'
  },
  {
    id: 'neon',
    name: 'Cyber Neon',
    description: 'Bordes brillantes de neón verde, ideal para gadgets y gaming.',
    themeClass: 'bg-slate-950 border-2 border-emerald-400 text-emerald-400 font-mono shadow-[0_0_10px_rgba(52,211,153,0.3)]'
  },
  {
    id: 'industrial',
    name: 'Industrial Robusto',
    description: 'Fuentes pesadas, bordes amarillos y negros, ideal para herramientas.',
    themeClass: 'bg-[#FFDE4D] border-3 border-stone-900 text-stone-950 font-mono font-bold'
  },
  {
    id: 'badge',
    name: 'Insignia Escarapela',
    description: 'Forma circular o de etiqueta redondeada para productos artesanales.',
    themeClass: 'bg-white border-2 border-rose-500 rounded-2xl text-rose-800 font-sans'
  }
];

export const CATEGORIES = [
  'Tecnología',
  'Alimentos y Bebidas',
  'Ropa y Moda',
  'Hogar y Jardín',
  'Salud y Belleza',
  'Herramientas',
  'Juguetes y Hobbies',
  'Libros y Oficina',
  'Otros'
];

export const RANDOM_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60', // Watch
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60', // Headphones
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60', // Sunglasses
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60', // Sneaker
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60', // Shoes
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=60', // Camera
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop&q=60', // Headset
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60', // Coffee Cup
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&auto=format&fit=crop&q=60', // Laptop
  'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500&auto=format&fit=crop&q=60', // Toys
  'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60', // Bread/Food
  'https://images.unsplash.com/photo-1608248597481-496100c80836?w=500&auto=format&fit=crop&q=60', // Cosmetic Bottle
];
