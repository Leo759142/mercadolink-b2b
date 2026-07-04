import React, { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { Tags, Mail, Lock, LogIn, UserPlus, ShieldAlert, Chrome, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google: ' + (err.message || 'Inténtalo de nuevo'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const demoEmail = 'demo@tagcraft.com';
    const demoPassword = 'demopassword123';
    try {
      // Try to sign in first
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
    } catch (err: any) {
      console.error('Demo login error, attempting register fallback:', err);
      // Try to register if login failed
      try {
        const userCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        await updateProfile(userCred.user, {
          displayName: 'Usuario Demo'
        });
      } catch (regErr: any) {
        console.error(regErr);
        // If it was already created, or something else, try to sign in one more time
        try {
          await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        } catch (finalErr: any) {
          setError('Error al iniciar sesión de demostración: ' + (regErr.message || 'Error de Firebase.'));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('El nombre es obligatorio para crear una cuenta.');
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, {
          displayName: name.trim()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = err.message;
      if (err.code === 'auth/invalid-credential') {
        localizedError = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      } else if (err.code === 'auth/email-already-in-use') {
        localizedError = 'Este correo electrónico ya está registrado.';
      } else if (err.code === 'auth/weak-password') {
        localizedError = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'El formato del correo electrónico no es válido.';
      }
      setError(localizedError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" id="auth-screen">
      {/* Decorative Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30">
            <Tags className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          TagCraft Pro
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-mono tracking-wider">
          PLATAFORMA DE ETIQUETAS E INVENTARIO
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-4 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-6" onSubmit={handleEmailAuth}>
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre Completo
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required={isSignUp}
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/10 flex items-center justify-center space-x-2 transition duration-200"
              >
                {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                <span>{isLoading ? 'Cargando...' : isSignUp ? 'Registrarme' : 'Iniciar Sesión'}</span>
              </button>
            </div>
          </form>

          {/* Social Sign In */}
          <div className="mt-6">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase tracking-wider font-mono">o continúa con</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="mt-4 w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800/80 text-white font-bold rounded-xl text-sm border border-slate-800 flex items-center justify-center space-x-2 transition"
            >
              <Chrome className="h-4 w-4 text-rose-500" />
              <span>Inicia con Google</span>
            </button>

            <button
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="mt-3 w-full py-2.5 px-4 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 font-bold rounded-xl text-sm border border-indigo-900/60 flex items-center justify-center space-x-2 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Acceso de Prueba / Cuenta Demo</span>
            </button>
          </div>

          {/* Sign Up Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 focus:outline-none"
            >
              {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
