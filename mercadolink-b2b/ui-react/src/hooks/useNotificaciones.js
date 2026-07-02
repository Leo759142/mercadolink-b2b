import { useEffect, useState } from 'react';
import { notificacionesAPI } from '../api';

export function useNotificaciones(pollMs = 30000) {
  const [noLeidas, setNoLeidas] = useState(0);
  const [lista, setLista] = useState([]);

  const cargar = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificacionesAPI.contarNoLeidas(),
        notificacionesAPI.listar(),
      ]);
      setNoLeidas(Number(countRes.data) || 0);
      setLista(Array.isArray(listRes.data) ? listRes.data : []);
    } catch {
      // backend no disponible
    }
  };

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  return { noLeidas, lista, recargar: cargar };
}
