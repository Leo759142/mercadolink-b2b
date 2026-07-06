export const DEMO_USERS = {
  vendedor: { email: 'vendedor@aspropa.pe', password: 'password123', label: 'Vendedor', sub: 'Puesto A-01' },
  proveedor: { email: 'proveedor@aspropa.pe', password: 'password123', label: 'Proveedor', sub: 'Distribuidora Lima' },
  mayorista: { email: 'cliente@aspropa.pe', password: 'password123', label: 'Mayorista', sub: 'Mercader externo' },
  admin: { email: 'admin@aspropa.pe', password: 'password123', label: 'Admin', sub: 'Aspropa SMP' },
};

const RBAC = {
  // ✅ VENDEDOR: solo ve lo de su puesto, NO "Mis Pedidos" ni "Logística"
  vendedor: { 
    dashboard: true, 
    inventario: true, 
    pedidos: false,        // ← OCULTO: "Mis Pedidos"
    productos: false, 
    proveedores: false, 
    logistica: false,      // ← OCULTO: "Logística"
    proveedorInventario: false, 
    proveedorPedidos: false,
    pedidosVendedor: true,  // ← NUEVO: "Entregas" (pedidos de su puesto)
    chat: true, 
    auditoria: true 
  },
  
  // ✅ PROVEEDOR: solo ve su catálogo y pedidos recibidos, NO "Mis Pedidos" ni "Logística"
  proveedor: { 
    dashboard: true, 
    inventario: false, 
    pedidos: false,        // ← OCULTO: "Mis Pedidos"
    productos: true, 
    proveedores: false, 
    logistica: false,      // ← OCULTO: "Logística"
    proveedorInventario: true, 
    proveedorPedidos: true, // ← "Pedidos recibidos"
    pedidosVendedor: false,
    chat: true, 
    auditoria: true 
  },
  
  // ✅ MAYORISTA: cliente que compra
  mayorista: { 
    dashboard: true, 
    inventario: false, 
    pedidos: true,         // ← "Mis Pedidos" (sus compras)
    productos: true, 
    proveedores: false, 
    logistica: false,      // ← OCULTO
    proveedorInventario: false, 
    proveedorPedidos: false,
    pedidosVendedor: false,
    chat: true, 
    auditoria: true 
  },
  
  // ✅ ADMIN: ve todo
  admin: { 
    dashboard: true, 
    inventario: true, 
    pedidos: true, 
    productos: true, 
    proveedores: true, 
    logistica: true, 
    proveedorInventario: true, 
    proveedorPedidos: true,
    pedidosVendedor: true,
    chat: true, 
    auditoria: true 
  },
};

export function rolToKey(rol) {
  switch (rol) {
    case 'VENDEDOR':
      return 'vendedor';
    case 'PROVEEDOR':
      return 'proveedor';
    case 'ADMINISTRADOR':
      return 'admin';
    case 'CLIENTE_MAYORISTA':
    default:
      return 'mayorista';
  }
}

export function canAccess(module, rol) {
  const key = rolToKey(rol);
  return RBAC[key]?.[module] ?? false;
}

export function persistSession(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('nombreComercial', data.nombreComercial || '');
  localStorage.setItem('rol', data.rol || '');
  localStorage.setItem('actorId', data.actorId || '');
  if (data.puestoId) {
    localStorage.setItem('puestoId', data.puestoId);
  } else {
    localStorage.removeItem('puestoId');
  }
  window.dispatchEvent(new Event('auth-change'));
}

export function clearSession() {
  ['token', 'nombreComercial', 'rol', 'actorId', 'puestoId'].forEach((k) =>
    localStorage.removeItem(k)
  );
  window.dispatchEvent(new Event('auth-change'));
}

export function getSession() {
  return {
    token: localStorage.getItem('token'),
    nombreComercial: localStorage.getItem('nombreComercial'),
    rol: localStorage.getItem('rol'),
    actorId: localStorage.getItem('actorId'),
    puestoId: localStorage.getItem('puestoId'),
  };
}

export function badgeClassForRol(rol) {
  switch (rolToKey(rol)) {
    case 'vendedor':
      return 'badge-blue';
    case 'proveedor':
      return 'badge-purple';
    case 'admin':
      return 'badge-orange';
    default:
      return 'badge-green';
  }
}