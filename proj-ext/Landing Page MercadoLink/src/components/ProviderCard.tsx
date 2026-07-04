import React from 'react';
import { Provider } from '../types';
import { Edit2, Trash2, Phone, MapPin, Tag, Landmark } from 'lucide-react';

interface ProviderCardProps {
  key?: React.Key;
  provider: Provider;
  productCount: number;
  onEdit: (p: Provider) => void;
  onDelete: (id: string) => void;
}

export default function ProviderCard({ provider, productCount, onEdit, onDelete }: ProviderCardProps) {
  const isInactive = provider.status === 'inactive';

  return (
    <div 
      id={`provider-card-${provider.id}`}
      className={`bg-rustic-surface border-2 rounded-lg p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg ${
        isInactive ? 'border-rustic-border/30 opacity-70' : 'border-rustic-border hover:border-rustic-accent'
      }`}
    >
      <div>
        {/* Header: Avatar + Status */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-rustic-border shrink-0">
            <img 
              src={provider.avatar} 
              alt={provider.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="text-lg font-serif text-rustic-text flex items-center gap-2">
              {provider.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isInactive ? 'bg-rustic-red' : 'bg-rustic-green'}`} />
              <span className="text-[10px] uppercase font-mono text-rustic-muted">
                {isInactive ? 'Inactivo' : 'Suministro Activo'}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2 text-xs font-sans text-rustic-muted">
            <MapPin className="w-3.5 h-3.5 text-rustic-accent mt-0.5 shrink-0" />
            <span>Origen: <strong>{provider.location}</strong></span>
          </div>
          <div className="flex items-start gap-2 text-xs font-sans text-rustic-muted">
            <Landmark className="w-3.5 h-3.5 text-rustic-accent mt-0.5 shrink-0" />
            <span>Distribución: <strong>{provider.section}</strong></span>
          </div>
          <div className="flex items-start gap-2 text-xs font-sans text-rustic-muted">
            <Phone className="w-3.5 h-3.5 text-rustic-accent mt-0.5 shrink-0" />
            <a 
              href={`tel:${provider.phone}`}
              className="hover:text-rustic-accent transition-colors"
              aria-label={`Llamar a ${provider.name}`}
            >
              Llamar: {provider.phone}
            </a>
          </div>
        </div>

        {/* Crops specialties */}
        <div className="mt-4">
          <div className="text-[10px] font-mono uppercase text-rustic-muted mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-rustic-accent" /> Cultivos Especialidad
          </div>
          <div className="flex flex-wrap gap-1.5">
            {provider.crops.map((crop, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-sans px-2 py-0.5 bg-rustic-surface2 text-rustic-text border border-rustic-border/30 rounded"
              >
                🌾 {crop}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer statistics and controls */}
      <div className="mt-5 pt-3 border-t border-rustic-border/30 flex items-center justify-between">
        <div className="text-xs font-sans text-rustic-muted">
          Cultivos registrados: <strong className="text-rustic-accent">{productCount}</strong>
        </div>
        <div className="flex gap-2">
          <button
            id={`btn-edit-prov-${provider.id}`}
            onClick={() => onEdit(provider)}
            className="p-1.5 bg-rustic-surface2 hover:bg-rustic-accent hover:text-rustic-bg text-rustic-muted border border-rustic-border rounded-md transition-all custom-focus"
            aria-label={`Editar proveedor ${provider.name}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-delete-prov-${provider.id}`}
            onClick={() => onDelete(provider.id)}
            className="p-1.5 bg-rustic-surface2 hover:bg-rustic-red hover:text-white text-rustic-muted border border-rustic-border rounded-md transition-all custom-focus"
            aria-label={`Eliminar proveedor ${provider.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
