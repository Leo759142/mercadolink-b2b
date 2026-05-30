export const TRANSICIONES = {
  BORRADOR: ['PENDIENTE_PAGO', 'CANCELADO'],
  PENDIENTE_PAGO: ['PAGADO', 'RECHAZADO', 'CANCELADO'],
  PAGADO: ['CONFIRMADO', 'EN_DISPUTA'],
  CONFIRMADO: ['EN_DESPACHO', 'CANCELADO', 'EN_DISPUTA'],
  EN_DESPACHO: ['ENTREGADO', 'EN_DISPUTA'],
  ENTREGADO: [],
  CANCELADO: [],
  RECHAZADO: [],
  EN_DISPUTA: ['ENTREGADO', 'CANCELADO'],
};

export const FLUJO_LOGISTICO = [
  'PENDIENTE_PAGO',
  'PAGADO',
  'CONFIRMADO',
  'EN_DESPACHO',
  'ENTREGADO',
];

export function siguientesEstados(estado) {
  return TRANSICIONES[estado] || [];
}

export function pillClass(estado) {
  if (['ENTREGADO', 'PAGADO'].includes(estado)) return 'pill-ok';
  if (['CANCELADO', 'RECHAZADO', 'EN_DISPUTA'].includes(estado)) return 'pill-red';
  if (['PENDIENTE_PAGO', 'BORRADOR'].includes(estado)) return 'pill-pending';
  if (['CONFIRMADO', 'EN_DESPACHO'].includes(estado)) return 'pill-blue';
  return 'pill-grey';
}

export function labelEstado(estado) {
  return estado?.replace(/_/g, ' ') || '—';
}

export function pedidoActivo(p) {
  return !['ENTREGADO', 'CANCELADO', 'RECHAZADO'].includes(p.estado);
}
