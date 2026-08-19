import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Gamepad2, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Coins, 
  Gift, 
  Flame, 
  HelpCircle,
  Eye
} from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  badge: string;
  description: string;
  tip: string;
  position: 'bottom' | 'top' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'deposit-button',
    badge: '1. CARTEIRA & PIX',
    title: 'Sua Carteira e Saldo',
    description: 'Aqui você visualiza seu saldo em tempo real. Clique a qualquer momento para abrir a carteira, depositar via PIX com aprovação instantânea e receber até +75% de bônus promocional!',
    tip: 'Depósitos a partir de R$ 20 ganham +50% de bônus, e a partir de R$ 200 ganham +75% VIP.',
    position: 'bottom'
  },
  {
    targetId: 'menu-drawer-btn',
    badge: '2. MENU PRINCIPAL',
    title: 'Navegação e Benefícios',
    description: 'Abra o menu lateral para conferir seus vouchers de tatuagem, promoções ativas, eventos da semana, programa Indique & Ganhe e suporte 24h via WhatsApp.',
    tip: 'Você também pode alternar entre o tema Escuro e Claro no menu.',
    position: 'bottom'
  },
  {
    targetId: 'hero-section',
    badge: '3. DESTAQUES & BANNERS',
    title: 'Novidades e Lançamentos',
    description: 'Fique por dentro dos jogos mais quentes da semana, jackpots acumulados e promoções especiais exibidas nos banners principais.',
    tip: 'Clique no botão "JOGAR AGORA" do banner para ir direto para o jogo.',
    position: 'bottom'
  },
  {
    targetId: 'category-filter-section',
    badge: '4. CATEGORIAS',
    title: 'Filtre seus Jogos Favoritos',
    description: 'Organize o catálogo rapidamente entre Slots Temáticos, Roletas de Prêmios, Jogos em Destaque ou visualize a coleção completa.',
    tip: 'Novos jogos são adicionados regularmente com artes exclusivas!',
    position: 'bottom'
  },
  {
    targetId: 'search-section',
    badge: '5. BUSCA RÁPIDA',
    title: 'Encontre Jogos Instantaneamente',
    description: 'Digite o nome do seu jogo preferido (como Tattoo Slot, Yakuza Ink ou Mystic Ink) para localizá-lo em segundos.',
    tip: 'Use a busca quando quiser encontrar seu jogo favorito sem rolar a página.',
    position: 'bottom'
  },
  {
    targetId: 'games-section',
    badge: '6. CATÁLOGO DE JOGOS',
    title: 'Jogos & Apostas',
    description: 'Cada jogo possui regras próprias, multiplicadores progressivos e rodadas bônus. Basta clicar em qualquer jogo para definir sua aposta e começar a girar!',
    tip: 'Todos os jogos são otimizados para celular e computador com sons imersivos.',
    position: 'top'
  },
  {
    targetId: 'recent-wins-section',
    badge: '7. GANHOS AO VIVO',
    title: 'Feed de Vitórias em Tempo Real',
    description: 'Acompanhe as vitórias recentes de outros jogadores da plataforma, multiplicadores atingidos e prêmios em dinheiro e vouchers resgatados.',
    tip: 'Seus grandes prêmios também aparecem no mural de ganhadores!',
    position: 'top'
  }
];

export function HomeTourModal() {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'games' | 'bonuses'>('wallet');
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check first-time visit
  useEffect(() => {
    const hasSeen = localStorage.getItem('lt_has_seen_home_tour_v1');
    if (!hasSeen) {
      // Small timeout for smooth entry after UI renders
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual trigger (e.g. from topbar menu or help button)
  useEffect(() => {
    const handleOpenTour = () => {
      setShowModal(true);
    };

    window.addEventListener('open-home-tour', handleOpenTour);
    return () => window.removeEventListener('open-home-tour', handleOpenTour);
  }, []);

  // Measure target bounding rect for interactive tour spotlight
  useEffect(() => {
    if (!isTourActive) {
      setTargetRect(null);
      return;
    }

    const currentStep = TOUR_STEPS[currentStepIdx];
    if (!currentStep) return;

    const updatePosition = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        // Smoothly scroll target into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        // Fallback if element not found
        setTargetRect(null);
      }
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isTourActive, currentStepIdx]);

  const handleFinishAll = () => {
    localStorage.setItem('lt_has_seen_home_tour_v1', 'true');
    setShowModal(false);
    setIsTourActive(false);
  };

  const handleStartTour = () => {
    setShowModal(false);
    setIsTourActive(true);
    setCurrentStepIdx(0);
  };

  const handleNextStep = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleFinishAll();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const currentStep = TOUR_STEPS[currentStepIdx];

  return (
    <>
      {/* 1. MODAL INFORMATIVO COMPLETO DE APRESENTAÇÃO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-md bg-neutral-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden my-auto"
            >
              {/* Subtle ambient glow top */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-amber-500/20 to-transparent blur-3xl pointer-events-none" />

              {/* Header with badge & close */}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/25">
                    <Sparkles size={20} className="fill-black" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      <Zap size={10} /> GUIA DA PLATAFORMA
                    </span>
                    <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                      Bem-vindo à LT JOGOS!
                    </h3>
                  </div>
                </div>

                <button
                  onClick={handleFinishAll}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Subtitle */}
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Veja como funciona nossa carteira de depósitos PIX, os jogos temáticos exclusivos e como faturar prêmios reais na plataforma:
              </p>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/5 mb-4">
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'wallet'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Wallet size={13} />
                  <span>Carteira</span>
                </button>
                <button
                  onClick={() => setActiveTab('games')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'games'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Gamepad2 size={13} />
                  <span>Jogos</span>
                </button>
                <button
                  onClick={() => setActiveTab('bonuses')}
                  className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'bonuses'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Gift size={13} />
                  <span>Bônus</span>
                </button>
              </div>

              {/* Content Panel based on Active Tab */}
              <div className="min-h-[220px] mb-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'wallet' && (
                    <motion.div
                      key="tab-wallet"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-3"
                    >
                      <div className="p-3 rounded-2xl bg-neutral-950/80 border border-amber-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                          <Zap size={14} className="fill-amber-400" />
                          <span>Depósito Instantâneo via PIX</span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          Deposite a partir de <strong>R$ 20</strong> através do QR Code ou chave Copia & Cola oficial do Mercado Pago. O saldo é creditado no mesmo segundo na sua conta.
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-neutral-950/80 border border-emerald-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                          <ShieldCheck size={14} />
                          <span>Saques Rápidos & Vouchers</span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          Seus prêmios acumulados podem ser sacados diretamente para sua chave PIX cadastrada ou resgatados em vouchers para tatuar no estúdio!
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'games' && (
                    <motion.div
                      key="tab-games"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-3"
                    >
                      <div className="p-3 rounded-2xl bg-neutral-950/80 border border-purple-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-purple-400 text-xs font-black">
                          <Gamepad2 size={14} />
                          <span>Slots Temáticos & Roletas</span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          Descubra slots lendários como <strong>Tattoo Slot</strong>, <strong>Yakuza Ink</strong>, <strong>Mystic Ink</strong> e <strong>Calavera Ink</strong> com temas imersivos e alta taxa de retorno.
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-neutral-950/80 border border-pink-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-pink-400 text-xs font-black">
                          <Flame size={14} className="fill-pink-400" />
                          <span>Multiplicadores & Giros Bônus</span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          Acerte combinações raras ou símbolos Scatter para desbloquear giros grátis com multiplicadores acumulativos que turbinam seus ganhos!
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'bonuses' && (
                    <motion.div
                      key="tab-bonuses"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-3"
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <Gift size={13} /> +50% a +75% no Depósito
                          </span>
                          <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md">
                            Automático
                          </span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          Depósitos a partir de R$ 20 ganham <strong>+50% extras</strong> na banca. Depósitos acima de R$ 200 recebem <strong>+75% VIP</strong> na hora!
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-neutral-950/80 border border-blue-500/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                            <Coins size={13} /> Recompensa Diária
                          </span>
                          <span className="text-[9px] font-black uppercase text-blue-300 bg-blue-400/20 px-2 py-0.5 rounded-md">
                            Depositantes
                          </span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          Jogadores que já depositaram na plataforma ganham um bônus diário exclusivo ao fazer login todos os dias.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleStartTour}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3 px-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Eye size={16} />
                  <span>Fazer Tour Passo a Passo na Tela</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  onClick={handleFinishAll}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors text-center"
                >
                  Entendi Tudo, Ir para os Jogos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. TOUR INTERATIVO PASSO A PASSO COM FOCO NA TELA */}
      <AnimatePresence>
        {isTourActive && (
          <div className="fixed inset-0 z-[120] pointer-events-auto">
            {/* Dark overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleFinishAll}
              className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
            />

            {/* Target Highlight Box (Spotlight outline around targeted element) */}
            {targetRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  top: targetRect.top - 6,
                  left: targetRect.left - 6,
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="absolute rounded-2xl border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6),inset_0_0_15px_rgba(245,158,11,0.3)] pointer-events-none z-[125]"
              />
            )}

            {/* Floating Tooltip Box */}
            <div className="absolute inset-x-0 bottom-4 sm:bottom-8 flex justify-center px-4 z-[130] pointer-events-none">
              <motion.div
                key={`tour-step-${currentStepIdx}`}
                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-sm bg-neutral-900 border border-amber-500/40 rounded-3xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.2)] pointer-events-auto relative overflow-hidden"
              >
                {/* Progress bar top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                    style={{ width: `${((currentStepIdx + 1) / TOUR_STEPS.length) * 100}%` }}
                  />
                </div>

                {/* Step Header */}
                <div className="flex items-center justify-between mb-2 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {currentStep.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-white/50">
                      {currentStepIdx + 1} de {TOUR_STEPS.length}
                    </span>
                    <button
                      onClick={handleFinishAll}
                      className="text-white/40 hover:text-white transition-colors p-1"
                      title="Fechar Tour"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <h4 className="text-base font-black text-white tracking-tight mb-1.5">
                  {currentStep.title}
                </h4>
                <p className="text-xs text-white/80 leading-relaxed mb-3">
                  {currentStep.description}
                </p>

                {/* Tip Box */}
                {currentStep.tip && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4 flex items-start gap-2">
                    <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200/90 leading-tight font-medium">
                      {currentStep.tip}
                    </p>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleFinishAll}
                    className="text-[11px] font-bold text-white/40 hover:text-white transition-colors"
                  >
                    Pular Tour
                  </button>

                  <div className="flex items-center gap-2">
                    {currentStepIdx > 0 && (
                      <button
                        onClick={handlePrevStep}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <ChevronLeft size={14} />
                        <span>Anterior</span>
                      </button>
                    )}

                    <button
                      onClick={handleNextStep}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <span>{currentStepIdx === TOUR_STEPS.length - 1 ? 'Concluir' : 'Próximo'}</span>
                      {currentStepIdx === TOUR_STEPS.length - 1 ? <CheckCircle2 size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
