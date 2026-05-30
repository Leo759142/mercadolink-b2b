export const DEMO_USERS = {
  vendedor: { email: 'vendedor@aspropa.pe', password: 'password123', label: 'Vendedor' },
  proveedor: { email: 'proveedor@aspropa.pe', password: 'password123', label: 'Proveedor' },
  mayorista: { email: 'cliente@aspropa.pe', password: 'password123', label: 'Mayorista' },
  admin: { email: 'admin@aspropa.pe', password: 'password123', label: 'Admin' },
};

const RBAC = {
  vendedor: { dashboard: true, inventario: true, pedidos: true, productos: true, proveedores: false, logistica: true },
  proveedor: { dashboard: true, inventario: false, pedidos: true, productos: true, proveedores: true, logistica: true },
  mayorista: { dashboard: true, inventario: false, pedidos: true, productos: true, proveedores: false, logistica: false },
  admin: { dashboard: true, inventario: true, pedidos: true, productos: true, proveedores: true, logistica: true },
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
