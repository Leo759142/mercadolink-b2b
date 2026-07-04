import { Product, Provider, Seller, Order, Testimonial, CarouselItem } from './types';

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'prov-1',
    name: 'María Huayhua',
    phone: '+51 987 654 321',
    location: 'Valle de Jauja, Junín',
    section: 'Pabellón A - Puesto 12 (Tubérculos)',
    crops: ['Papas Nativas', 'Oca', 'Mashua'],
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'prov-2',
    name: 'Rómulo Quispe',
    phone: '+51 912 345 678',
    location: 'Chanchamayo, Junín',
    section: 'Pabellón C - Puesto 04 (Frutas Exóticas)',
    crops: ['Café Orgánico', 'Naranjas de Mesa', 'Granadilla'],
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'prov-3',
    name: 'Carlos Mamani',
    phone: '+51 954 123 987',
    location: 'Huaral, Lima Provincias',
    section: 'Pabellón B - Puesto 22 (Verduras Frescas)',
    crops: ['Zanahoria', 'Brócoli', 'Lechuga Orgánica'],
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'prov-4',
    name: 'Ana Choque',
    phone: '+51 933 888 777',
    location: 'Urubamba, Valle Sagrado, Cusco',
    section: 'Pabellón D - Puesto 15 (Granos Andinos)',
    crops: ['Maíz Choclo Gigante', 'Quinua Roja', 'Kiwicha'],
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces'
  }
];

export const INITIAL_SELLERS: Seller[] = [
  {
    id: 'sell-1',
    name: 'Don Teófilo Condori',
    phone: '+51 944 555 666',
    marketName: 'Mercado Mayorista de Santa Anita',
    stallNumber: 'Giro de Tubérculos - Puesto B-15',
    balance: 4500.00,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'sell-2',
    name: 'Doña Gregoria Puma',
    phone: '+51 966 777 888',
    marketName: 'Mercado Central de Abastos de Lima',
    stallNumber: 'Pabellón de Frutas - Puesto 142',
    balance: 2800.00,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces'
  },
  {
    id: 'sell-3',
    name: 'Juana Calisaya',
    phone: '+51 977 444 111',
    marketName: 'Mercado Ciudad de Dios, San Juan de Miraflores',
    stallNumber: 'Sección Verduras - Puesto 12-A',
    balance: 3150.00,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Papa Amarilla Tumbay',
    category: 'Tubérculos',
    price: 3.80,
    unit: 'kg',
    stock: 1200,
    providerId: 'prov-1',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60',
    description: 'Papa de textura arenosa perfecta para puré, causa limeña y frituras. Cosechada a más de 3,200 msnm de manera tradicional.'
  },
  {
    id: 'prod-2',
    name: 'Café Orgánico de Chanchamayo',
    category: 'Granos y Abarrotes',
    price: 18.00,
    unit: 'saco 1kg',
    stock: 250,
    providerId: 'prov-2',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60',
    description: 'Granos seleccionados con tostado medio. Notas cítricas y de chocolate dulce, cultivados bajo sombra de bosques nativos.'
  },
  {
    id: 'prod-3',
    name: 'Naranjas Huando',
    category: 'Frutas',
    price: 2.20,
    unit: 'kg',
    stock: 3500,
    providerId: 'prov-2',
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&auto=format&fit=crop&q=60',
    description: 'Naranjas sin pepa, sumamente jugosas y dulces. Directas del fundo frutícola de Chanchamayo.'
  },
  {
    id: 'prod-4',
    name: 'Lechuga Orgánica Crespa',
    category: 'Verduras',
    price: 1.50,
    unit: 'unidad',
    stock: 400,
    providerId: 'prov-3',
    image: 'https://images.unsplash.com/photo-1622484211148-7174984f23e0?w=500&auto=format&fit=crop&q=60',
    description: 'Lechugas frescas cosechadas en la madrugada de Huaral. Riego controlado con aguas de manantial puro.'
  },
  {
    id: 'prod-5',
    name: 'Maíz Choclo Gigante de Urubamba',
    category: 'Granos y Abarrotes',
    price: 4.50,
    unit: 'kg',
    stock: 800,
    providerId: 'prov-4',
    image: 'https://images.unsplash.com/photo-1551754625-70c90487d8a6?w=500&auto=format&fit=crop&q=60',
    description: 'Granos gigantes, tiernos y dulces del Valle Sagrado de los Incas. Ideal para comer con queso o preparar pasteles.'
  },
  {
    id: 'prod-6',
    name: 'Quinua Roja Real',
    category: 'Granos y Abarrotes',
    price: 9.50,
    unit: 'kg',
    stock: 600,
    providerId: 'prov-4',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
    description: 'Grano andino de alto valor proteico. Procesada y lavada artesanalmente para eliminar la saponina.'
  },
  {
    id: 'prod-7',
    name: 'Zanahorias de Huaral',
    category: 'Verduras',
    price: 1.80,
    unit: 'kg',
    stock: 1500,
    providerId: 'prov-3',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=60',
    description: 'Zanahorias dulces y crujientes de gran tamaño, seleccionadas a mano.'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    sellerId: 'sell-1',
    providerId: 'prov-1',
    productId: 'prod-1',
    productName: 'Papa Amarilla Tumbay',
    quantity: 300,
    totalPrice: 1140.00,
    status: 'entregado',
    date: '2026-07-02',
    deliveryDate: '2026-07-03'
  },
  {
    id: 'ord-2',
    sellerId: 'sell-2',
    providerId: 'prov-2',
    productId: 'prod-3',
    productName: 'Naranjas Huando',
    quantity: 500,
    totalPrice: 1100.00,
    status: 'coordinado',
    date: '2026-07-03',
    deliveryDate: '2026-07-05'
  },
  {
    id: 'ord-3',
    sellerId: 'sell-3',
    providerId: 'prov-3',
    productId: 'prod-4',
    productName: 'Lechuga Orgánica Crespa',
    quantity: 150,
    totalPrice: 225.00,
    status: 'pendiente',
    date: '2026-07-04',
    deliveryDate: '2026-07-06'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    text: '“MercadoLink transformó mi forma de comprar. Ya no espero semanas por productos, todo llega directo del campo a mi puesto en excelente estado.”',
    author: 'Don Rómulo Quispe',
    role: 'Vendedor Minorista, Mercado Central'
  },
  {
    id: 'test-2',
    text: '“Como productora puedo subir mi catálogo al toque y recibir pedidos sin necesidad de moverme del campo. Mis ventas aumentaron 40% en dos meses.”',
    author: 'Doña María Huayhua',
    role: 'Agricultora, Valle de Jauja'
  },
  {
    id: 'test-3',
    text: '“La logística rural coordinada es impecable. Las entregas llegan directo al puesto y el control de pedidos me ayuda a no quedarme sin mercadería.”',
    author: 'Carlos Mamani',
    role: 'Mayorista de Huaral'
  },
  {
    id: 'test-4',
    text: '“Interfaz ágil, fácil de usar y 100% en español. Una bendición para organizar las compras colectivas de los puestos rurales.”',
    author: 'Doña Ana Choque',
    role: 'Delegada del Pabellón de Granos'
  }
];

export const CAROUSEL_TEMPLATES: CarouselItem[] = [
  {
    id: 'slide-products',
    title: 'Catálogo de Productos',
    description: 'Visualiza tu catálogo de abastos completo en formato de tarjetas rústicas con imágenes de alta calidad, precios y stock real.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=60',
    bullets: [
      'Búsqueda rápida por nombre y categoría',
      'Asociación directa con el productor rural',
      'Alertas de stock bajo e indicador de disponibilidad',
      'Filtros interactivos por tipo de cultivo'
    ],
    linkTab: 'productos',
    linkText: 'Ver Productos'
  },
  {
    id: 'slide-providers',
    title: 'Proveedores Rurales',
    description: 'Administra la red de agricultores y proveedores locales con datos de contacto, ubicación geográfica y cultivos activos.',
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=60',
    bullets: [
      'Ubicación exacta de origen y puesto de distribución',
      'Listado de cultivos de temporada',
      'Estado activo de suministro en tiempo real',
      'Contacto directo vía celular con un clic'
    ],
    linkTab: 'proveedores',
    linkText: 'Ver Proveedores'
  },
  {
    id: 'slide-sellers',
    title: 'Vendedores y Comerciantes',
    description: 'Controla los puestos de destino de los mercados populares y gestiona su balance para un intercambio seguro.',
    image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&auto=format&fit=crop&q=60',
    bullets: [
      'Mapeo de mercados de destino principales',
      'Asignación del número de puesto y giro comercial',
      'Monitoreo de saldo de crédito comercial',
      'Historial de pedidos despachados'
    ],
    linkTab: 'vendedores',
    linkText: 'Ver Vendedores'
  },
  {
    id: 'slide-actors',
    title: 'Directorio de Actores',
    description: 'Panel unificado para cruzar roles, gestionar contactos colectivos y coordinar el acopio de mercancías sin intermediarios.',
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&auto=format&fit=crop&q=60',
    bullets: [
      'Vista cruzada de productores y comerciantes',
      'Búsqueda global por región o mercado',
      'Estadísticas agregadas por rol',
      'Acciones rápidas para iniciar pedidos de acopio'
    ],
    linkTab: 'actores',
    linkText: 'Ver Directorio'
  }
];
