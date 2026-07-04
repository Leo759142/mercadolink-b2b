import React, { useState, useEffect } from 'react';
import { Provider } from '../types';
import { X, Save, ShieldAlert } from 'lucide-react';

interface ProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: Omit<Provider, 'id'> & { id?: string }) => void;
  provider?: Provider | null;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces'
];

export default function ProviderFormModal({ isOpen, onClose, onSave, provider }: ProviderFormModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [section, setSection] = useState('');
  const [cropsString, setCropsString] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);

  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setPhone(provider.phone);
      setLocation(provider.location);
      setSection(provider.section);
      setCropsString(provider.crops.join(', '));
      setStatus(provider.status);
      setAvatar(provider.avatar);
    } else {
      setName('');
      setPhone('');
      setLocation('');
      setSection('');
      setCropsString('');
      setStatus('active');
      setAvatar(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
    }
  }, [provider, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const crops = cropsString
      .split(',')
      .map((crop) => crop.trim())
      .filter((crop) => crop.length > 0);

    onSave({
      id: provider?.id,
      name,
      phone,
      location,
      section,
      crops,
      status,
      avatar
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="provider-form-title">
      <div className="w-full max-w-lg bg-rustic-surface border-4 border-rustic-border rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-rustic-wood flex items-center justify-between border-b-2 border-rustic-border">
          <h3 id="provider-form-title" className="text-xl font-serif text-rustic-accent flex items-center gap-2">
            <span>🚜</span> {provider ? 'Editar Proveedor Rural' : 'Registrar Nuevo Productor'}
          </h3>
          <button 
            id="close-provider-modal"
            onClick={onClose} 
            className="p-1 text-rustic-muted hover:text-rustic-text hover:bg-rustic-surface2 rounded-full transition-all"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
          {/* Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prov-name">Nombre Completo del Productor</label>
            <input
              id="prov-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Don Justino Choque"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prov-phone">Celular de Contacto</label>
            <input
              id="prov-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +51 999 888 777"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Location / Origin */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prov-location">Origen Agrícola (Chacra / Valle)</label>
            <input
              id="prov-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej. Valle de Urubamba, Cusco"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Section in Wholesale Market */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prov-section">Punto de Acopio / Pabellón de Distribución</label>
            <input
              id="prov-section"
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Ej. Pabellón H - Puesto 18"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Crop Specialties (Comma-separated) */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prov-crops">Cultivos Especialidad (Separados por comas)</label>
            <input
              id="prov-crops"
              type="text"
              value={cropsString}
              onChange={(e) => setCropsString(e.target.value)}
              placeholder="Ej. Choclo Gigante, Quinua Roja, Kiwicha"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
            <p className="text-[10px] font-sans text-rustic-muted mt-1">
              Coloca comas para separar cada tipo de verdura o fruta que cultiva este productor.
            </p>
          </div>

          {/* Status & Profile picture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prov-status">Estado de Suministro</label>
              <select
                id="prov-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
              >
                <option value="active" className="bg-rustic-surface">Activo (Abasteciendo hoy)</option>
                <option value="inactive" className="bg-rustic-surface">Inactivo (Por temporada)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="prov-avatar">Retrato de Productor (Foto)</label>
              <div className="flex gap-2">
                {AVATAR_PRESETS.map((avUrl, i) => (
                  <button
                    id={`btn-avatar-preset-${i}`}
                    key={avUrl}
                    type="button"
                    onClick={() => setAvatar(avUrl)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                      avatar === avUrl ? 'border-rustic-accent scale-110' : 'border-rustic-border/30 hover:border-rustic-border'
                    }`}
                  >
                    <img src={avUrl} alt="Retrato" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-rustic-surface2/60 border-t-2 border-rustic-border/40 flex gap-3 justify-end">
          <button
            id="cancel-provider-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-rustic-surface hover:bg-rustic-bg border border-rustic-border text-xs font-sans font-bold uppercase tracking-wide text-rustic-text rounded transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            id="submit-provider-btn"
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2 bg-gradient-to-r from-rustic-accent to-rustic-accent2 text-rustic-bg font-sans font-bold text-xs uppercase tracking-wide rounded border border-rustic-wood flex items-center gap-1.5 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Productor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
