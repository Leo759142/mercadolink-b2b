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
  list: () => apiClient.get('/productos'),
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
  obtener: (id) => apiClient.get(`/pedidos/${id}`),
  cambiarEstado: (id, estado) =>
    apiClient.patch(`/pedidos/${id}/estado`, { estado }),
};

export const pagosAPI = {
  iniciar: (pedidoId) => apiClient.post(`/pagos/iniciar/${pedidoId}`),
  obtener: (orderId) => apiClient.get(`/pagos/${orderId}`),
};

export const izipayAPI = {
  firmar: (payload) => apiClient.post('/izipay/firmar', payload),
  webhook: (payload) => apiClient.post('/izipay/webhook', payload),
};
