import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, User, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; surname: string; vendedor?: boolean } | null>(null);
  const [profileView, setProfileView] = useState<'initial' | 'login' | 'register'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const profileRefDesktop = useRef<HTMLDivElement>(null);
  const profileRefMobile = useRef<HTMLDivElement>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ 
              name: data.nome, 
              surname: data.sobrenome,
              vendedor: data.vendedor || firebaseUser.email === "matheusenge2@gmail.com"
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: 'Início', id: 'home' },
    { name: 'Minhas compras', id: 'orders' },
    ...(user?.vendedor ? [{ name: 'Vendedor', id: 'seller' }] : []),
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideDesktop = profileRefDesktop.current && !profileRefDesktop.current.contains(target);
      const isOutsideMobile = profileRefMobile.current && !profileRefMobile.current.contains(target);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileOpen(false);
        // Reset view when closing
        setTimeout(() => setProfileView('initial'), 300);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsProfileOpen(false);
      setProfileView('initial');
    } catch (err: any) {
      setError('Email ou senha incorretos.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const nome = formData.get('nome') as string;
    const sobrenome = formData.get('sobrenome') as string;
    const telefone = formData.get('telefone') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Save to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        nome,
        sobrenome,
        telefone,
        email,
        createdAt: new Date().toISOString()
      });

      setIsProfileOpen(false);
      setProfileView('initial');
    } catch (err: any) {
      setError('Erro ao criar conta. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileOpen(false);
      onNavigate('home');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <img 
            src="https://raw.githubusercontent.com/brutafinance-maker/brt1/main/Brutamed.png" 
            alt="BrutaMed Logo"
            className="h-8 md:h-9 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-extrabold text-xl tracking-tighter">BRUTAMED</span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`text-sm font-medium transition-colors hover:text-gray-500 ${
                currentPage === link.id ? 'text-black' : 'text-gray-400'
              }`}
            >
              {link.name}
            </button>
          ))}
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <ShoppingCart size={20} />
              <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
            </button>

            {/* Profile Dropdown Container */}
            <div className="relative" ref={profileRefDesktop}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
              >
                <User size={20} />
                {isLoggedIn && user && (
                  <span className="text-xs font-bold hidden lg:block">{user.name}</span>
                )}
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="p-6">
                      {isLoggedIn ? (
                        <div className="space-y-4">
                          <div className="pb-4 border-b border-gray-50">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bem-vindo</p>
                            <p className="text-lg font-black tracking-tight">{user?.name} {user?.surname}</p>
                          </div>
                          <button 
                            onClick={() => {
                              onNavigate('orders');
                              setIsProfileOpen(false);
                            }}
                            className="w-full text-left text-sm font-bold hover:text-gray-500 transition-colors py-2"
                          >
                            Minhas compras
                          </button>
                          {user?.vendedor && (
                            <button 
                              onClick={() => {
                                onNavigate('seller');
                                setIsProfileOpen(false);
                              }}
                              className="w-full text-left text-sm font-bold hover:text-gray-500 transition-colors py-2"
                            >
                              Painel Vendedor
                            </button>
                          )}
                          <button 
                            onClick={handleLogout}
                            className="w-full text-left text-sm font-bold text-red-500 hover:text-red-600 transition-colors py-2"
                          >
                            Sair
                          </button>
                        </div>
                      ) : (
                        <>
                          {profileView === 'initial' && (
                            <div className="space-y-3">
                              <h3 className="text-lg font-black tracking-tight mb-4">Sua conta</h3>
                              <button 
                                onClick={() => setProfileView('login')}
                                className="w-full bg-black text-white py-3 rounded-full font-bold text-sm hover:bg-gray-800 transition-all"
                              >
                                Entrar
                              </button>
                              <button 
                                onClick={() => setProfileView('register')}
                                className="w-full bg-white text-black border border-gray-200 py-3 rounded-full font-bold text-sm hover:bg-gray-50 transition-all"
                              >
                                Criar conta
                              </button>
                            </div>
                          )}

                          {profileView === 'login' && (
                            <form onSubmit={handleLogin} className="space-y-4">
                              <div className="flex items-center gap-2 mb-4">
                                <button type="button" onClick={() => { setProfileView('initial'); setError(null); }} className="p-1 hover:bg-gray-100 rounded-full">
                                  <ArrowLeft size={16} />
                                </button>
                                <h3 className="text-lg font-black tracking-tight">Entrar</h3>
                              </div>
                              {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                              <input 
                                name="email"
                                type="email" 
                                placeholder="Email" 
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm"
                              />
                              <input 
                                name="password"
                                type="password" 
                                placeholder="Senha" 
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm"
                              />
                              <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white py-3 rounded-full font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                              >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
                              </button>
                            </form>
                          )}

                          {profileView === 'register' && (
                            <form onSubmit={handleRegister} className="space-y-3">
                              <div className="flex items-center gap-2 mb-4">
                                <button type="button" onClick={() => { setProfileView('initial'); setError(null); }} className="p-1 hover:bg-gray-100 rounded-full">
                                  <ArrowLeft size={16} />
                                </button>
                                <h3 className="text-lg font-black tracking-tight">Criar conta</h3>
                              </div>
                              {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  name="nome"
                                  type="text" 
                                  placeholder="Nome" 
                                  required
                                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm"
                                />
                                <input 
                                  name="sobrenome"
                                  type="text" 
                                  placeholder="Sobrenome" 
                                  required
                                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm"
                                />
                              </div>
                              <input 
                                name="telefone"
                                type="tel" 
                                placeholder="Telefone" 
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm"
                              />
                              <input 
                                name="email"
                                type="email" 
                                placeholder="Email" 
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm"
                              />
                              <input 
                                name="password"
                                type="password" 
                                placeholder="Senha" 
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black text-sm"
                              />
                              <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-black text-white py-3 rounded-full font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                              >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Criar conta'}
                              </button>
                            </form>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button className="p-2 relative">
            <ShoppingCart size={20} />
            <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
          </button>
          
          <div className="relative" ref={profileRefMobile}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-2"
            >
              <User size={24} />
            </button>
            
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Same content as desktop dropdown */}
                    {isLoggedIn ? (
                      <div className="space-y-4">
                        <div className="pb-4 border-b border-gray-50">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bem-vindo</p>
                          <p className="text-lg font-black tracking-tight">{user?.name} {user?.surname}</p>
                        </div>
                        <button 
                          onClick={() => {
                            onNavigate('orders');
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left text-sm font-bold py-2"
                        >
                          Minhas compras
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left text-sm font-bold text-red-500 py-2"
                        >
                          Sair
                        </button>
                      </div>
                    ) : (
                      <>
                        {profileView === 'initial' && (
                          <div className="space-y-3">
                            <h3 className="text-lg font-black tracking-tight mb-4">Sua conta</h3>
                            <button onClick={() => setProfileView('login')} className="w-full bg-black text-white py-3 rounded-full font-bold text-sm">Entrar</button>
                            <button onClick={() => setProfileView('register')} className="w-full bg-white text-black border border-gray-200 py-3 rounded-full font-bold text-sm">Criar conta</button>
                          </div>
                        )}
                        {profileView === 'login' && (
                          <form onSubmit={handleLogin} className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <button type="button" onClick={() => { setProfileView('initial'); setError(null); }} className="p-1"><ArrowLeft size={16} /></button>
                              <h3 className="text-lg font-black tracking-tight">Entrar</h3>
                            </div>
                            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                            <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-sm" />
                            <input name="password" type="password" placeholder="Senha" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-sm" />
                            <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2">
                              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
                            </button>
                          </form>
                        )}
                        {profileView === 'register' && (
                          <form onSubmit={handleRegister} className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                              <button type="button" onClick={() => { setProfileView('initial'); setError(null); }} className="p-1"><ArrowLeft size={16} /></button>
                              <h3 className="text-lg font-black tracking-tight">Criar conta</h3>
                            </div>
                            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                            <div className="grid grid-cols-2 gap-2">
                              <input name="nome" type="text" placeholder="Nome" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-sm" />
                              <input name="sobrenome" type="text" placeholder="Sobrenome" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-sm" />
                            </div>
                            <input name="telefone" type="tel" placeholder="Telefone" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-sm" />
                            <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-sm" />
                            <input name="password" type="password" placeholder="Senha" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none text-sm" />
                            <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2">
                              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Criar conta'}
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-white border-b border-gray-100 md:hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setIsMenuOpen(false);
                  }}
                  className={`text-lg font-semibold text-left ${
                    currentPage === link.id ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
