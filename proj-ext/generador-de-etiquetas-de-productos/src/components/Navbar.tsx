import React from 'react';
import { User, LogOut, Tags, Barcode as BarcodeIcon, Settings } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface NavbarProps {
  currentUser: any;
  onSetTab: (tab: 'dashboard' | 'batch') => void;
  activeTab: 'dashboard' | 'batch';
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onSetTab, activeTab }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800 text-white shadow-md" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 shadow-md shadow-indigo-500/20">
              <Tags className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                TagCraft Pro
              </span>
              <span className="block text-[9px] font-mono tracking-widest text-indigo-400 font-medium uppercase">
                Label Engine & Inventory
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex space-x-1" id="nav-tabs">
              <button
                onClick={() => onSetTab('dashboard')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
                id="tab-dashboard"
              >
                <BarcodeIcon className="h-4 w-4 mr-2" />
                Mis Productos
              </button>
              <button
                onClick={() => onSetTab('batch')}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === 'batch'
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
                id="tab-batch"
              >
                <Tags className="h-4 w-4 mr-2" />
                Impresión por Lote
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-3 border-l border-slate-800 pl-6" id="nav-user-profile">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-200">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  Conectado
                </span>
              </div>
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="h-9 w-9 rounded-full border border-indigo-500/30 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-900 border border-indigo-500/30">
                  <User className="h-4 w-4 text-indigo-300" />
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Cerrar sesión"
              id="logout-button"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
