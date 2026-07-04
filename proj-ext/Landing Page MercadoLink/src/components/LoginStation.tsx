import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  UserCheck, 
  KeyRound, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  User, 
  Store, 
  Wheat, 
  FileText, 
  IdCard,
  UserCircle2
} from 'lucide-react';
import { Provider, Seller, UserSession } from '../types';

interface LoginStationProps {
  providers: Provider[];
  sellers: Seller[];
  session: UserSession;
  onLogin: (session: UserSession) => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

export default function LoginStation({
  providers,
  sellers,
  session,
  onLogin,
  onLogout,
  onShowToast
}: LoginStationProps) {
  const [activeTab, setActiveTab] = useState<'fast' | 'manual'>('fast');
  
  // Fast login inputs
  const [selectedActorType, setSelectedActorType] = useState<'producer' | 'seller' | 'admin'>('producer');
  const [selectedActorId, setSelectedActorId] = useState<string>(providers[0]?.id || '');

  // Manual login inputs
  const [manualUsername, setManualUsername] = useState('');
  const [manualRole, setManualRole] = useState<'producer' | 'seller' | 'admin'>('producer');
  const [manualPassword, setManualPassword] = useState('');

  // Handle fast login
  const handleFastLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedActorType === 'admin') {
      const adminSession: UserSession = {
        isLoggedIn: true,
        username: 'Administrador Principal B2B',
        role: 'admin'
      };
      onLogin(adminSession);
      onShowToast('Ingresó como Administrador General de Abastos.');
      return;
    }

    if (selectedActorType === 'producer') {
      const prov = providers.find(p => p.id === selectedActorId) || providers[0];
      if (!prov) return;
      const userSession: UserSession = {
        isLoggedIn: true,
        username: prov.name,
        role: 'producer',
        targetId: prov.id
      };
      onLogin(userSession);
      onShowToast(`Sesión iniciada: Productor "${prov.name}" autorizado.`);
    } else {
      const sell = sellers.find(s => s.id === selectedActorId) || sellers[0];
      if (!sell) return;
      const userSession: UserSession = {
        isLoggedIn: true,
        username: sell.name,
        role: 'seller',
        targetId: sell.id
      };
      onLogin(userSession);
      onShowToast(`Sesión iniciada: Comerciante "${sell.name}" autorizado.`);
    }
  };

  // Handle manual login
  const handleManualLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUsername.trim()) {
      alert('Por favor ingrese un nombre de usuario.');
      return;
    }

    const customSession: UserSession = {
      isLoggedIn: true,
      username: manualUsername.trim(),
      role: manualRole
    };

    onLogin(customSession);
    onShowToast(`Cuenta rústica creada. ¡Bienvenido, ${manualUsername}!`);
  };

  // Find info of logged-in user if available
  let userAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces';
  let userDetails = 'Miembro del Mercado Mayorista';
  let userSubDetails = 'Sin puesto asignado';

  if (session.isLoggedIn) {
    if (session.role === 'admin') {
      userAvatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces';
      userDetails = 'Pabellón de Control de Gestión';
      userSubDetails = 'Administrador de Servidores B2B';
    } else if (session.role === 'producer' && session.targetId) {
      const prov = providers.find(p => p.id === session.targetId);
      if (prov) {
        userAvatar = prov.avatar;
        userDetails = prov.location;
        userSubDetails = prov.section;
      }
    } else if (session.role === 'seller' && session.targetId) {
      const sell = sellers.find(s => s.id === session.targetId);
      if (sell) {
        userAvatar = sell.avatar;
        userDetails = sell.marketName;
        userSubDetails = sell.stallNumber;
      }
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {!session.isLoggedIn ? (
        /* NOT LOGGED IN VIEW */
        <div className="bg-[#3a281a] border-4 border-[#5d462d] rounded-xl shadow-2xl overflow-hidden text-left">
          
          {/* Header */}
          <div className="bg-[#4a3422] p-5 border-b-2 border-[#8b6d47]/50 text-center relative">
            <div className="absolute top-4 right-4 text-[#d4a35e]">
              <Lock className="w-5 h-5" />
            </div>
            <div className="inline-flex p-2.5 bg-black/25 rounded-full border border-[#8b6d47]/40 mb-2">
              <IdCard className="w-6 h-6 text-[#d4a35e]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#f0e6d2] font-serif">
              Registro y Control de Acceso
            </h3>
            <p className="text-xs text-[#c9b494] font-sans mt-1">
              Firma el padrón del mercado para desbloquear acciones autorizadas
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="grid grid-cols-2 border-b border-[#8b6d47]/35 text-xs font-sans">
            <button
              onClick={() => setActiveTab('fast')}
              className={`py-3 text-center transition-all font-bold cursor-pointer ${activeTab === 'fast' ? 'bg-[#3a281a] text-[#d4a35e] border-b-2 border-[#d4a35e]' : 'bg-black/15 text-[#c9b494] hover:text-[#f0e6d2]'}`}
            >
              Ingreso Rápido (Socio B2B)
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`py-3 text-center transition-all font-bold cursor-pointer ${activeTab === 'manual' ? 'bg-[#3a281a] text-[#d4a35e] border-b-2 border-[#d4a35e]' : 'bg-black/15 text-[#c9b494] hover:text-[#f0e6d2]'}`}
            >
              Registro Manual de Cuenta
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'fast' ? (
              /* FAST LOGIN FORM */
              <form onSubmit={handleFastLoginSubmit} className="space-y-4">
                <div className="text-xs text-[#c9b494] bg-black/10 p-3 rounded border border-[#8b6d47]/20 font-sans leading-relaxed">
                  Consiste en simular el ingreso como uno de los actores precargados de la base de datos para ver su entorno o panel específico.
                </div>

                <div className="space-y-1.5 text-xs font-sans">
                  <label className="block text-[#f0e6d2] font-bold">Tipo de Miembro:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedActorType('producer');
                        const firstP = providers[0]?.id || '';
                        setSelectedActorId(firstP);
                      }}
                      className={`py-2 rounded border font-medium flex flex-col items-center justify-center gap-1 transition-all ${selectedActorType === 'producer' ? 'bg-[#d4a35e]/15 border-[#d4a35e] text-[#d4a35e]' : 'bg-black/20 border-[#8b6d47]/30 text-[#c9b494] hover:text-[#f0e6d2]'}`}
                    >
                      <Wheat className="w-4 h-4" />
                      <span>Productor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedActorType('seller');
                        const firstS = sellers[0]?.id || '';
                        setSelectedActorId(firstS);
                      }}
                      className={`py-2 rounded border font-medium flex flex-col items-center justify-center gap-1 transition-all ${selectedActorType === 'seller' ? 'bg-[#d4a35e]/15 border-[#d4a35e] text-[#d4a35e]' : 'bg-black/20 border-[#8b6d47]/30 text-[#c9b494] hover:text-[#f0e6d2]'}`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Comerciante</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedActorType('admin')}
                      className={`py-2 rounded border font-medium flex flex-col items-center justify-center gap-1 transition-all ${selectedActorType === 'admin' ? 'bg-[#d4a35e]/15 border-[#d4a35e] text-[#d4a35e]' : 'bg-black/20 border-[#8b6d47]/30 text-[#c9b494] hover:text-[#f0e6d2]'}`}
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Administrador</span>
                    </button>
                  </div>
                </div>

                {selectedActorType !== 'admin' && (
                  <div className="space-y-1.5 text-xs font-sans">
                    <label className="block text-[#f0e6d2] font-bold">Seleccionar Identidad:</label>
                    <select
                      value={selectedActorId}
                      onChange={(e) => setSelectedActorId(e.target.value)}
                      className="w-full bg-black/35 border border-[#8b6d47]/60 rounded px-3 py-2 text-[#f0e6d2] focus:outline-none focus:border-[#d4a35e]"
                    >
                      {selectedActorType === 'producer' ? (
                        providers.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                        ))
                      ) : (
                        sellers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.marketName})</option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-gradient-to-r from-[#d4a35e] to-[#b47a4a] hover:brightness-110 text-[#2d1e14] font-bold font-sans rounded-lg shadow-lg border border-[#5d462d] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar de Forma Segura</span>
                </button>
              </form>
            ) : (
              /* MANUAL LOGIN FORM */
              <form onSubmit={handleManualLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 text-xs font-sans">
                  <label className="block text-[#f0e6d2] font-bold">Nombre o Razón Social *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={manualUsername}
                      onChange={(e) => setManualUsername(e.target.value)}
                      placeholder="Ej. Cooperativa Agropecuaria Cusco"
                      className="w-full bg-black/25 border border-[#8b6d47]/60 rounded pl-9 pr-3 py-2 text-[#f0e6d2] focus:outline-none focus:border-[#d4a35e] placeholder-[#c9b494]/50"
                    />
                    <User className="w-3.5 h-3.5 text-[#c9b494] absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-sans">
                  <label className="block text-[#f0e6d2] font-bold">Rol Asignado *</label>
                  <select
                    value={manualRole}
                    onChange={(e) => setManualRole(e.target.value as any)}
                    className="w-full bg-black/35 border border-[#8b6d47]/60 rounded px-3 py-2 text-[#f0e6d2] focus:outline-none focus:border-[#d4a35e]"
                  >
                    <option value="producer">Productor Rural / Agricultor</option>
                    <option value="seller">Comerciante de Abasto Minorista</option>
                    <option value="admin">Administrador / Enlace Mayorista</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs font-sans">
                  <label className="block text-[#f0e6d2] font-bold">Clave Secreta Agraria (Opcional)</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/25 border border-[#8b6d47]/60 rounded pl-9 pr-3 py-2 text-[#f0e6d2] focus:outline-none focus:border-[#d4a35e] placeholder-[#c9b494]/50"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#c9b494] absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-gradient-to-r from-[#7cae5f] to-[#5a8b41] hover:brightness-110 text-white font-bold font-sans rounded-lg shadow-lg border border-[#3b5d25] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Firmar Padrón y Registrar</span>
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* LOGGED IN VIEW - CREDENTIAL CARD */
        <div className="bg-[#3a281a] border-4 border-[#5d462d] rounded-xl shadow-2xl text-left relative overflow-hidden">
          
          {/* Top hanging rope detail for aesthetic rustic badge */}
          <div className="h-2.5 bg-gradient-to-r from-[#5d462d] via-[#8b6d47] to-[#5d462d] w-full" />
          
          <div className="p-6 text-center space-y-4">
            <span className="px-3 py-1 bg-emerald-950/45 text-[#7cae5f] font-mono text-[9px] font-bold uppercase tracking-widest rounded-full border border-[#7cae5f]/30 inline-flex items-center gap-1 shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Socio B2B Autenticado</span>
            </span>

            {/* Profile Avatar & Badge Details */}
            <div className="relative w-28 h-28 mx-auto">
              <img
                src={userAvatar}
                alt={session.username}
                className="w-full h-full rounded-full border-4 border-[#8b6d47] object-cover shadow-lg"
              />
              <div className="absolute -bottom-1.5 -right-1.5 bg-[#d4a35e] p-2 rounded-full border-2 border-[#3a281a] text-[#2d1e14] shadow-md">
                {session.role === 'producer' ? (
                  <Wheat className="w-4 h-4" />
                ) : session.role === 'seller' ? (
                  <Store className="w-4 h-4" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* User Title */}
            <div>
              <h3 className="text-xl font-extrabold font-serif text-[#f0e6d2]">
                {session.username}
              </h3>
              <p className="text-xs text-[#d4a35e] font-mono font-bold uppercase tracking-wide mt-1">
                {session.role === 'producer' ? 'Productor Rural Certificado' :
                 session.role === 'seller' ? 'Comerciante de Puesto Minorista' :
                 'Supervisor General del Mercado'}
              </p>
            </div>

            {/* Physical Credential Specifications */}
            <div className="bg-[#2d1e14]/75 border border-[#8b6d47]/40 rounded-lg p-3 text-xs font-sans space-y-1.5 text-left text-[#c9b494]">
              <div className="flex justify-between">
                <span className="uppercase font-mono text-[9px]">Ubicación / Fundo:</span>
                <span className="text-[#f0e6d2] font-semibold">{userDetails}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase font-mono text-[9px]">Asignación / Pabellón:</span>
                <span className="text-[#f0e6d2] font-semibold">{userSubDetails}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase font-mono text-[9px]">ID del Padrón:</span>
                <span className="text-[#e8c15e] font-mono font-bold">
                  {session.targetId ? `B2B-${session.targetId.toUpperCase()}` : 'B2B-GENERIC-ADMIN'}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#8b6d47]/20 pt-1.5 mt-1">
                <span className="uppercase font-mono text-[9px]">Estado de Conexión:</span>
                <span className="text-[#7cae5f] font-bold">PERMITIDO / LOCAL</span>
              </div>
            </div>

            {/* Informational help context */}
            <p className="text-[10px] font-sans text-[#c9b494] italic leading-normal px-2">
              Se han habilitado tus permisos específicos de la Mesa de Despacho. Puedes ver tus datos en el catálogo y operar bajo tu firma.
            </p>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onShowToast('Sesión de abastos finalizada de forma segura.');
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rustic-red/20 hover:bg-rustic-red/30 border border-rustic-red text-red-200 font-sans font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión Segura</span>
              </button>
            </div>

          </div>

          {/* Cardboard border lines */}
          <div className="absolute left-1.5 top-1.5 right-1.5 bottom-1.5 border border-[#8b6d47]/20 rounded-lg pointer-events-none" />
        </div>
      )}
    </div>
  );
}
