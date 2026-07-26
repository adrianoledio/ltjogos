import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('O aplicativo LT Jogos já está instalado no seu dispositivo!');
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback prompt guidance
      alert('Para instalar o aplicativo:\n\n1. Abra o menu do seu navegador (⋮ ou Safari)\n2. Selecione "Instalar Aplicativo" ou "Adicionar à Tela de Início".');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          isInstalled
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-gradient-to-r from-brand-primary/15 to-brand-secondary/10 hover:from-brand-primary/25 hover:to-brand-secondary/20 text-brand-primary border border-brand-primary/30 shadow-md'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isInstalled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-primary/20 text-brand-primary'}`}>
            {isInstalled ? <Check size={14} /> : <Download size={14} />}
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="font-bold">{isInstalled ? 'App Instalado' : 'Instalar Web App'}</span>
            <span className="text-[9px] text-text-muted/70 font-medium">
              {isInstalled ? 'Pronto para uso off-line' : 'Adicione à tela de início'}
            </span>
          </div>
        </div>
        {!isInstalled && (
          <span className="px-2 py-0.5 rounded-md bg-brand-primary text-black text-[9px] font-black uppercase tracking-wider">
            Baixar
          </span>
        )}
      </button>

      {/* iOS Installation Instruction Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-surface-card border border-border-rgba rounded-3xl p-5 shadow-2xl relative z-10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-border-rgba pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-text-main">Instalar no iPhone / iPad</h3>
                    <p className="text-[10px] text-text-muted">Siga as etapas abaixo no Safari</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="w-8 h-8 rounded-xl bg-surface-dark border border-border-rgba flex items-center justify-center text-text-muted hover:text-text-main"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-text-muted">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-dark border border-border-rgba">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                  <p className="leading-snug">Toque no botão <strong>Compartilhar <Share size={12} className="inline mx-1 text-blue-400" /></strong> na barra inferior do Safari.</p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-dark border border-border-rgba">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <p className="leading-snug">Role o menu de opções para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-dark border border-border-rgba">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                  <p className="leading-snug">Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-black font-black text-xs rounded-xl transition-all uppercase tracking-wider"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
