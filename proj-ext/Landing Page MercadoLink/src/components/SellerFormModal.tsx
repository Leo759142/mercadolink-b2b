import React, { useState, useEffect } from 'react';
import { Seller } from '../types';
import { X, Save } from 'lucide-react';

interface SellerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (seller: Omit<Seller, 'id'> & { id?: string }) => void;
  seller?: Seller | null;
}

const SELLER_AVATARS = [
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150&h=150&fit=crop&crop=faces'
];

export default function SellerFormModal({ isOpen, onClose, onSave, seller }: SellerFormModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketName, setMarketName] = useState('');
  const [stallNumber, setStallNumber] = useState('');
  const [balance, setBalance] = useState(2500);
  const [avatar, setAvatar] = useState(SELLER_AVATARS[0]);

  useEffect(() => {
    if (seller) {
      setName(seller.name);
      setPhone(seller.phone);
      setMarketName(seller.marketName);
      setStallNumber(seller.stallNumber);
      setBalance(seller.balance);
      setAvatar(seller.avatar);
    } else {
      setName('');
      setPhone('');
      setMarketName('');
      setStallNumber('');
      setBalance(2500);
      setAvatar(SELLER_AVATARS[Math.floor(Math.random() * SELLER_AVATARS.length)]);
    }
  }, [seller, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: seller?.id,
      name,
      phone,
      marketName,
      stallNumber,
      balance: Number(balance),
      avatar
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="seller-form-title">
      <div className="w-full max-w-lg bg-rustic-surface border-4 border-rustic-border rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-rustic-wood flex items-center justify-between border-b-2 border-rustic-border">
          <h3 id="seller-form-title" className="text-xl font-serif text-rustic-accent flex items-center gap-2">
            <span>🏪</span> {seller ? 'Editar Comerciante' : 'Registrar Comerciante / Vendedor'}
          </h3>
          <button 
            id="close-seller-modal"
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
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="sel-name">Nombre Completo del Comerciante</label>
            <input
              id="sel-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Doña Felicitas Calisaya"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="sel-phone">Celular de Contacto</label>
            <input
              id="sel-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +51 912 345 678"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Market name */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="sel-market">Mercado de Destino (Ubicación en Ciudad)</label>
            <input
              id="sel-market"
              type="text"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              placeholder="Ej. Mercado Central de Abastos o San Anita"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Stall Number */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="sel-stall">Número de Puesto y Giro Comercial</label>
            <input
              id="sel-stall"
              type="text"
              value={stallNumber}
              onChange={(e) => setStallNumber(e.target.value)}
              placeholder="Ej. Puesto 45 - Pabellón Frutas"
              className="w-full bg-rustic-bg border border-rustic-border/60 hover:border-rustic-accent focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="sel-balance">Línea de Crédito Comercial / Saldo Inicial (S/.)</label>
            <input
              id="sel-balance"
              type="number"
              min="0"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              required
              className="w-full bg-rustic-bg border border-rustic-border/60 focus:border-rustic-accent px-3 py-2 text-sm text-rustic-text rounded focus:outline-none transition-all"
            />
          </div>

          {/* Avatar Presets */}
          <div>
            <label className="block text-xs font-mono uppercase text-rustic-muted mb-1" htmlFor="sel-avatar">Foto de Perfil</label>
            <div className="flex gap-2">
              {SELLER_AVATARS.map((avUrl, i) => (
                <button
                  id={`btn-seller-avatar-${i}`}
                  key={avUrl}
                  type="button"
                  onClick={() => setAvatar(avUrl)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                    avatar === avUrl ? 'border-rustic-accent scale-110' : 'border-rustic-border/30 hover:border-rustic-border'
                  }`}
                >
                  <img src={avUrl} alt="Foto" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-rustic-surface2/60 border-t-2 border-rustic-border/40 flex gap-3 justify-end">
          <button
            id="cancel-seller-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-rustic-surface hover:bg-rustic-bg border border-rustic-border text-xs font-sans font-bold uppercase tracking-wide text-rustic-text rounded transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            id="submit-seller-btn"
            type="submit"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-5 py-2 bg-gradient-to-r from-rustic-accent to-rustic-accent2 text-rustic-bg font-sans font-bold text-xs uppercase tracking-wide rounded border border-rustic-wood flex items-center gap-1.5 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Comerciante</span>
          </button>
        </div>
      </div>
    </div>
  );
}
