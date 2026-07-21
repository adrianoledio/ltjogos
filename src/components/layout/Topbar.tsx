import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Wallet, 
  User as UserIcon, 
  Bell, 
  Menu, 
  X, 
  ChevronRight, 
  Crown, 
  MessageSquare, 
  HelpCircle, 
  ShieldCheck, 
  LogOut, 
  Settings, 
  Coins,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showResponsavelModal, setShowResponsavelModal] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full max-w-md left-1/2 -translate-x-1/2 h-16 glass-panel z-50 flex items-center justify-between px-4 shadow-2xl border-b border-border-rgba">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMenuClick}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-card text-text-muted hover:text-text-main hover:bg-surface-card/85 transition-all border border-border-rgba active:scale-95"
          >
            <Menu size={20} />
          </button>
          <Link to="/app" className="relative group">
            <span className="text-xl font-black tracking-tighter text-text-main">
              LT<span className="text-brand-primary">JOGOS</span>
            </span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-brand-primary to-brand-secondary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link 
                to="/app/wallet"
                id="deposit-button"
                className="flex items-center gap-2 bg-surface-card border border-border-rgba pl-3 pr-1 py-1 rounded-2xl hover:border-brand-primary/30 transition-all group"
              >
                <div className="flex flex-col items-end leading-none mr-1">
                  <span className="text-[8px] text-text-muted opacity-80 font-bold uppercase tracking-widest">Saldo</span>
                  <span className="font-display font-bold text-sm text-brand-primary group-hover:text-text-main transition-colors">
                    R$ {user.balance.toFixed(2)}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-black shadow-lg shadow-brand-primary/20">
                  <Wallet size={14} />
                </div>
              </Link>
              
              <div className="relative group">
                <button className="w-10 h-10 rounded-xl bg-surface-card border border-border-rgba flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-card/85 transition-all">
                  <UserIcon size={18} />
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 glass-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50 scale-95 group-hover:scale-100">
                  <div className="p-4 border-b border-border-rgba bg-gradient-to-br from-brand-primary/5 to-transparent rounded-t-2xl">
                    <p className="font-bold text-sm text-text-main truncate">{user.name}</p>
                    <p className="text-[10px] text-text-muted truncate font-medium">{user.phone || user.email}</p>
                  </div>
                  <div className="p-1 space-y-1">
                    {user.role === 'admin' && (
                      <Link to="/app/admin" className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl transition-all">
                        <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
                        Painel Admin
                      </Link>
                    )}
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-text-muted hover:text-text-main hover:bg-white/5 rounded-xl transition-all">
                      <Bell size={14} />
                      Notificações
                    </button>
                    <div className="h-px bg-border-rgba mx-2 my-1" />
                    <button onClick={logout} className="w-full text-left px-3 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all">
                      Sair da Conta
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors">
                ENTRAR
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-xs">
                REGISTRAR
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hamburger Drawer Side Menu Container - Absolute relative to the parent max-w-md frame */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[99] cursor-pointer"
            />

            {/* Sidebar Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute left-0 top-0 bottom-0 w-[290px] bg-surface-card border-r border-border-rgba z-[100] flex flex-col shadow-[10px_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-border-rgba bg-gradient-to-b from-brand-primary/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tighter text-text-main">
                    LT<span className="text-brand-primary">MENU</span>
                  </span>
                </div>
                <button 
                  onClick={closeMenu}
                  className="w-8 h-8 rounded-lg bg-surface-dark border border-border-rgba flex items-center justify-center text-text-muted hover:text-text-main transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Quick Info */}
              <div className="p-4 bg-surface-dark/40 border-b border-border-rgba">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-black font-bold text-sm shadow-md">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="font-bold text-sm text-text-main truncate leading-none mb-1">{user.name}</h4>
                        <span className="text-[10px] text-text-muted truncate font-mono">ID: #{user.id?.substring(0, 6) || 'guest'}</span>
                      </div>
                    </div>

                    {/* Balance box */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 border border-border-rgba flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins size={14} className="text-brand-primary" />
                        <div>
                          <p className="text-[8px] text-text-muted uppercase font-black tracking-widest leading-none">Saldo Disponível</p>
                          <p className="text-xs font-black text-text-main mt-0.5">R$ {user.balance.toFixed(2)}</p>
                        </div>
                      </div>
                      <Link 
                        to="/app/wallet"
                        onClick={closeMenu}
                        className="px-2.5 py-1 rounded-lg bg-brand-primary hover:bg-brand-primary/80 text-[10px] text-black font-black uppercase tracking-wider transition-all"
                      >
                        Depositar
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <p className="text-xs text-text-muted mb-3">Conecte-se para começar a jogar!</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        to="/login" 
                        onClick={closeMenu}
                        className="py-1.5 rounded-lg bg-surface-dark hover:bg-surface-dark/80 text-xs font-bold text-center text-text-main border border-border-rgba transition-all"
                      >
                        Entrar
                      </Link>
                      <Link 
                        to="/register" 
                        onClick={closeMenu}
                        className="py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/80 text-xs text-black font-black text-center transition-all"
                      >
                        Cadastrar
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Items list */}
              <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-hide">
                
                {/* Section: Shortcuts */}
                <div className="space-y-1">
                  <h5 className="px-3 text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-2">Acessos Rápidos</h5>
                  
                  <Link 
                    to="/app" 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Coins size={14} />
                      </div>
                      <span>Todos os Jogos</span>
                    </div>
                    <ChevronRight size={12} className="text-text-muted/30" />
                  </Link>

                  <Link 
                    to="/app/wallet" 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Wallet size={14} />
                      </div>
                      <span>Minha Carteira</span>
                    </div>
                    <ChevronRight size={12} className="text-text-muted/30" />
                  </Link>

                  <Link 
                    to="/app/referral" 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Crown size={14} />
                      </div>
                      <span>Indique e Ganhe</span>
                    </div>
                    <ChevronRight size={12} className="text-text-muted/30" />
                  </Link>

                  <Link 
                    to="/app/events" 
                    onClick={closeMenu}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Bell size={14} />
                      </div>
                      <span>Eventos & Promoções</span>
                    </div>
                    <ChevronRight size={12} className="text-text-muted/30" />
                  </Link>
                </div>

                {/* Section: Appearance / Theme Selector */}
                <div className="space-y-1">
                  <h5 className="px-3 text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-2">Aparência</h5>
                  <div className="px-3 py-2 rounded-xl bg-surface-dark/50 border border-border-rgba flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                      </div>
                      <span className="text-xs font-semibold text-text-main">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                      onClick={toggleTheme}
                      className={`relative w-11 h-6 rounded-full p-1 transition-colors duration-200 outline-none ${theme === 'dark' ? 'bg-brand-primary' : 'bg-black/10'}`}
                      aria-label="Alternar tema"
                    >
                      <div 
                        className={`w-4 h-4 rounded-full bg-white shadow-md transform duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}
                      >
                        {theme === 'dark' ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section: VIP Club */}
                <div className="px-3 py-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 shadow-lg shadow-amber-500/5 relative overflow-hidden">
                  <div className="absolute right-[-10px] bottom-[-10px] text-amber-500/5 rotate-12 pointer-events-none">
                    <Crown size={80} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">CLUBE VIP LT</span>
                  </div>
                  <p className="text-[10px] text-text-main/70 leading-normal mb-2">Suba de nível jogando, ganhe cashback semanal e resgate bônus exclusivos.</p>
                  <button 
                    onClick={() => alert('Em breve: Sistema de Fidelidade VIP com vantagens especiais!')}
                    className="w-full py-1 text-center bg-amber-400 hover:bg-amber-300 text-black font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    Conhecer Benefícios
                  </button>
                </div>

                {/* Section: Help & Support */}
                <div className="space-y-1">
                  <h5 className="px-3 text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-2">Suporte & Segurança</h5>
                  
                  {/* Whatsapp link */}
                  <a 
                    href="https://wa.me/550000000000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-all text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                        <MessageSquare size={14} />
                      </div>
                      <span>Suporte WhatsApp</span>
                    </div>
                    <ChevronRight size={12} className="text-text-muted/30" />
                  </a>

                  {/* Responsavel modal trigger */}
                  <button 
                    onClick={() => {
                      setShowResponsavelModal(true);
                      closeMenu();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-all text-xs font-semibold text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                        <ShieldCheck size={14} />
                      </div>
                      <span>Jogo Responsável</span>
                    </div>
                    <ChevronRight size={12} className="text-text-muted/30" />
                  </button>
                </div>

                {/* Section: Administration (Only if admin) */}
                {user?.role === 'admin' && (
                  <div className="space-y-1">
                    <h5 className="px-3 text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-2">Administração</h5>
                    <Link 
                      to="/app/admin" 
                      onClick={closeMenu}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-all text-xs font-semibold"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-[#FFCC00]/10 flex items-center justify-center text-[#FFCC00]">
                          <Settings size={14} />
                        </div>
                        <span>Painel do Administrador</span>
                      </div>
                      <ChevronRight size={12} className="text-text-muted/30" />
                    </Link>
                  </div>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border-rgba bg-surface-dark/20 space-y-3">
                <div className="flex items-center justify-between text-[10px] text-text-muted opacity-80 font-medium px-1">
                  <span>Versão 1.2.0</span>
                  <span>LT Jogos © 2026</span>
                </div>
                {user && (
                  <button 
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="w-full py-2 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition-all border border-red-500/10"
                  >
                    <LogOut size={14} />
                    Sair da Conta
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Jogo Responsável Information Modal */}
      <AnimatePresence>
        {showResponsavelModal && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResponsavelModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-surface-card border border-border-rgba rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-border-rgba pb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-text-main uppercase tracking-wider">Jogo Responsável</h3>
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Jogue com moderação</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-text-muted leading-relaxed max-h-[220px] overflow-y-auto pr-1">
                <p>Na <strong>LT JOGOS</strong>, acreditamos que o entretenimento deve ser saudável e divertido. O jogo deve ser encarado como uma forma de lazer, e nunca como uma fonte de renda.</p>
                
                <h4 className="font-bold text-text-main text-[11px] uppercase tracking-wide mt-2">Dicas Importantes:</h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Defina limites de tempo e dinheiro antes de começar.</li>
                  <li>Nunca tente recuperar perdas sob impulso emocional.</li>
                  <li>Jogue apenas com fundos que você pode se dar ao luxo de perder.</li>
                  <li>Faça pausas regulares durante as sessões de jogo.</li>
                </ul>

                <p className="text-[10px] text-text-muted/60 mt-3 italic">Se você ou alguém que você conhece precisa de ajuda ou orientação, procure ajuda especializada. Permitido apenas para maiores de 18 anos.</p>
              </div>

              <button 
                onClick={() => setShowResponsavelModal(false)}
                className="w-full py-2.5 bg-surface-dark hover:bg-surface-dark/80 text-text-main font-bold text-xs rounded-xl border border-border-rgba transition-all uppercase tracking-wider mt-2 active:scale-95"
              >
                Entendi, fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
