import axios from 'axios';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? '/api/v1' : '/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;
    if (detail) {
      return Promise.reject(new Error(detail));
    }
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  register: (nombre, email, password, documento, rol) =>
    apiClient.post('/auth/register', {
      nombreComercial: nombre,
      email,
      password,
      documento,
      rol,
    }),
};

export const productosAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.tag) query.set('tag', params.tag);
    if (params.busqueda) query.set('busqueda', params.busqueda);
    const qs = query.toString();
    return apiClient.get(`/productos${qs ? `?${qs}` : ''}`);
  },
  misProductos: () => apiClient.get('/productos/mis-productos'),
  crear: (data) => apiClient.post('/productos', data),
  actualizarEtiquetas: (productoId, etiquetas) =>
    apiClient.patch(`/productos/${productoId}/etiquetas`, { etiquetas }),
  sugerenciasEtiquetas: () => apiClient.get('/productos/sugerencias-etiquetas'),
};

export const etiquetasAPI = {
  list: () => apiClient.get('/etiquetas'),
  buscar: (q) => apiClient.get(`/etiquetas/buscar?q=${encodeURIComponent(q)}`),
  populares: () => apiClient.get('/etiquetas/populares'),
  crear: (nombre) => apiClient.post('/etiquetas', { nombre }),
  renombrar: (id, nombre) => apiClient.patch(`/etiquetas/${id}`, { nombre }),
  eliminar: (id) => apiClient.delete(`/etiquetas/${id}`),
};

export const puestosAPI = {
  list: () => apiClient.get('/puestos'),
};

export const inventarioAPI = {
  porPuesto: (puestoId) => apiClient.get(`/inventario/puesto/${puestoId}`),
  actualizar: (productoId, puestoId, cantidadActual, cantidadMinima) =>
    apiClient.put(`/inventario/${productoId}/puesto/${puestoId}`, {
      cantidadActual,
      cantidadMinima,
    }),
};

export const pedidosAPI = {
  crear: (items, observaciones, idempotencyKey) =>
    apiClient.post(
      '/pedidos',
      { items, observaciones },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    ),
  misPedidos: () => apiClient.get('/pedidos/mios'),
  miosProveedor: () => apiClient.get('/pedidos/proveedor/mios'),
  obtener: (id) => apiClient.get(`/pedidos/${id}`),
  cambiarEstado: (id, estado) =>
    apiClient.patch(`/pedidos/${id}/estado`, { estado }),
  confirmarSurtimiento: (pedidoId, itemId) =>
    apiClient.patch(`/pedidos/${pedidoId}/surtir/${itemId}`),
  miosPorPuesto: () => apiClient.get('/pedidos/puesto/mios'),
};


export const pagosAPI = {
  iniciar: (pedidoId) => apiClient.post(`/pagos/iniciar/${pedidoId}`),
  obtener: (orderId) => apiClient.get(`/pagos/${orderId}`),
};

export const izipayAPI = {
  firmar: (payload) => apiClient.post('/izipay/firmar', payload),
  webhook: (payload) => apiClient.post('/izipay/webhook', payload),
};

export const culqiAPI = {
  iniciar: (pedidoId, monto) => apiClient.post(`/culqi/iniciar/${pedidoId}`, null, { params: { monto } }),
  firmar: (payload) => apiClient.post('/culqi/firmar', payload),
  webhook: (payload) => apiClient.post('/culqi/webhook', payload),
  config: () => apiClient.get('/culqi/config'),
};

export const proveedoresAPI = {
  listar: () => apiClient.get('/proveedores'),
  crear: (data) => apiClient.post('/proveedores', data),
  actualizar: (id, data) => apiClient.put(`/proveedores/${id}`, data),
  cambiarEstado: (id, body) => apiClient.patch(`/proveedores/${id}/estado`, body),
};

export const logisticaAPI = {
  envios: {
    listar: () => apiClient.get('/logistica/envios'),
    crear: (data) => apiClient.post('/logistica/envios', data),
  },
  recepciones: {
    listar: () => apiClient.get('/logistica/recepciones'),
    crear: (data) => apiClient.post('/logistica/recepciones', data),
    actualizarEstado: (id, estado) => apiClient.patch(`/logistica/recepciones/${id}/estado`, { estado_recepcion: estado }),
  },
  noConformidades: {
    listar: () => apiClient.get('/logistica/no-conformidades'),
    crear: (data) => apiClient.post('/logistica/no-conformidades', data),
    resolver: (id) => apiClient.patch(`/logistica/no-conformidades/${id}/resolver`),
  },
  seguimiento: {
    avanzarEtapa: (envioId, etapa) => apiClient.patch(`/logistica/envios/${envioId}/etapa`, { etapa }),
  },
};

export const auditoriaAPI = {
  listar: () => apiClient.get('/auditoria'),
};
export const chatAPI = {
  contactos: () => apiClient.get('/chat/contactos'),
  conversacion: (contactoId) => apiClient.get(`/chat/conversacion/${contactoId}`),
  marcarLeidos: (contactoId) => apiClient.post(`/chat/leer/${contactoId}`),
  noLeidos: () => apiClient.get('/chat/no-leidos'),
};

export const notificacionesAPI = {
  listar: () => apiClient.get('/notificaciones'),
  contarNoLeidas: () => apiClient.get('/notificaciones/no-leidas'),
};
