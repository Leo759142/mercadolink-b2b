export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  providerId: string;
  image: string;
  description: string;
}

export interface Provider {
  id: string;
  name: string;
  phone: string;
  location: string;
  section: string;
  crops: string[];
  status: 'active' | 'inactive';
  avatar: string;
}

export interface Seller {
  id: string;
  name: string;
  phone: string;
  marketName: string;
  stallNumber: string;
  balance: number;
  avatar: string;
}

export interface Order {
  id: string;
  sellerId: string;
  providerId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pendiente' | 'coordinado' | 'entregado';
  date: string;
  deliveryDate: string;
}

export interface Testimonial {
  id: string;
  text: string;
  author: string;
  role: string;
}

export interface CarouselItem {
  id: string;
  title: string;
  description: string;
  image: string;
  bullets: string[];
  linkTab: 'productos' | 'proveedores' | 'vendedores' | 'actores' | 'templates' | 'login';
  linkText: string;
}

export interface ThymeleafTemplate {
  id: string;
  name: string;
  target: 'productores' | 'proveedores' | 'productos' | 'pedidos';
  description: string;
  code: string;
  tags: string[];
  lastModified: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  username: string;
  role: 'producer' | 'seller' | 'admin';
  targetId?: string; // e.g. prov-1, sell-1
}
