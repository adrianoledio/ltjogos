import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, Transaction } from '../data/db';
import { toast } from 'sonner';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  QrCode,
  ShieldCheck, 
  Zap, 
  Flame, 
  Gift, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  HelpCircle,
  Clock,
  ChevronDown,
  Lock,
  MessageCircle
} from 'lucide-react';

import { LoadingSpinner } from '../components/LoadingSpinner';

export function Wallet() {
  const { user, updateBalance, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [bonusesClaimed, setBonusesClaimed] = useState(12);
  const [settings, setSettings] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const [qrCode, setQrCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [settingsData, txsData] = await Promise.all([
          db.getSettings(),
          db.getTransactions()
        ]);
        setSettings(settingsData);
        setTransactions(txsData.filter((tx) => tx.userId === user.id));
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const minDeposit = settings?.minDeposit || 20;
  const minWithdrawal = settings?.minWithdrawal || 60;
  const referralsRequired = settings?.referralsForFirstWithdrawal || 3;

  const canWithdraw = (user?.balance || 0) >= minWithdrawal && (user?.referrals || 0) >= referralsRequired;

  const handleWithdrawClick = () => {
    if (!canWithdraw) {
      setShowModal(true);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Poll to check if transaction has completed
  useEffect(() => {
    let intervalId: any;

    const checkPayment = async () => {
      if (!user) return;
      try {
        // 1. Query server status check API (queries Mercado Pago directly if pending)
        const statusRes = await fetch(`/api/payments/check-status?userId=${user.id}${activeTxId ? `&txId=${activeTxId}` : ''}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.approved) {
            toast.success('Depósito via PIX aprovado com sucesso! Saldo creditado.');
            setShowQr(false);
            setActiveTxId(null);
            const updatedTxs = await db.getTransactions();
            setTransactions(updatedTxs.filter(t => t.userId === user.id));
            if (refreshUser) {
              await refreshUser();
            }
            return;
          }
        }
      } catch (err) {
        console.warn("Status check failed:", err);
      }

      // 2. Fallback check local transactions list
      try {
        const txs = await db.getTransactions();
        const userTxs = txs.filter(t => t.userId === user.id);
        const currentTx = activeTxId ? userTxs.find(t => t.id === activeTxId) : null;
        if (currentTx && currentTx.status === 'completed' && showQr) {
          toast.success('Depósito via PIX aprovado com sucesso! Saldo creditado.');
          setShowQr(false);
          setActiveTxId(null);
          setTransactions(userTxs);
          if (refreshUser) {
            await refreshUser();
          }
        }
      } catch (e) {
        console.warn("Local tx search error:", e);
      }
    };

    if (user) {
      checkPayment();
    }

    if (showQr && user) {
      intervalId = setInterval(checkPayment, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showQr, user, activeTxId, refreshUser]);

  if (!user || loading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="CARREGANDO..." />
    </div>
  );

  const calculateBonus = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val) || val < minDeposit) return 0;
    if (val >= 200) return val * 0.75;
    return val * 0.5;
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val >= minDeposit) {
      setIsGeneratingPix(true);
      const bonusVal = calculateBonus(amount);
      try {
        const settings = await db.getSettings().catch(() => ({} as any));
        const mpAccessToken = (settings?.mpAccessToken || '').trim();

        let isSuccess = false;

        try {
          const response = await fetch('/api/payments/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: val,
              bonus: bonusVal,
              userId: user.id,
              email: user.email || `${user.phone || 'usuario'}@ltjogos.com`,
              mpAccessToken
            })
          });

          const contentType = response.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            const data = await response.json();
            if (response.ok && data.success) {
              setQrCode(data.qrCode);
              setQrCodeBase64(data.qrCodeBase64);
              setActiveTxId(data.transactionId);
              setShowQr(true);
              setTransactions(await db.getTransactions());
              toast.success('PIX gerado com sucesso! Escaneie ou copie o código.');
              isSuccess = true;
            } else if (data.error) {
              toast.error('Erro ao gerar PIX: ' + data.error);
              isSuccess = true;
            }
          }
        } catch (apiErr) {
          console.warn("Backend API not reachable, attempting direct fallback...", apiErr);
        }

        if (!isSuccess && mpAccessToken) {
          try {
            const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${mpAccessToken}`,
                "X-Idempotency-Key": Math.random().toString(36).substring(2, 15)
              },
              body: JSON.stringify({
                transaction_amount: val,
                description: "Depósito na Plataforma LT JOGOS",
                payment_method_id: "pix",
                payer: {
                  email: user.email && user.email.includes('@') ? user.email : "usuario@ltjogos.com",
                  first_name: "Usuario",
                  last_name: "LTJogos"
                }
              })
            });

            const mpData = await mpRes.json();
            if (mpRes.ok) {
              const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
              const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;

              const newTx = await db.addTransaction({
                userId: user.id,
                type: 'deposit',
                amount: val,
                status: 'pending',
                metadata: {
                  mpPaymentId: mpData.id,
                  qrCode,
                  qrCodeBase64,
                  bonus: bonusVal
                }
              });

              setQrCode(qrCode);
              setQrCodeBase64(qrCodeBase64);
              setActiveTxId(newTx.id);
              setShowQr(true);
              setTransactions(await db.getTransactions());
              toast.success('PIX gerado com sucesso!');
              isSuccess = true;
            } else {
              const errorMsg = mpData.message || mpData.cause?.[0]?.description || mpData.error || 'Erro ao gerar PIX no Mercado Pago.';
              toast.error('Erro ao gerar PIX: ' + errorMsg);
              isSuccess = true;
            }
          } catch (directErr: any) {
            console.error("Direct fetch failed:", directErr);
          }
        }

        if (!isSuccess && !mpAccessToken) {
          toast.error('Access Token do Mercado Pago não encontrado. Acesse o Painel Admin > Configurações e salve seu Token do Mercado Pago.');
        } else if (!isSuccess) {
          toast.error('Não foi possível gerar o PIX. Verifique seu Access Token do Mercado Pago nas Configurações.');
        }

      } catch (error: any) {
        console.error("Erro no depósito PIX:", error);
        toast.error('Erro de conexão ao solicitar o PIX.');
      } finally {
        setIsGeneratingPix(false);
      }
    } else {
      toast.warning(`O valor mínimo para depósito é R$ ${minDeposit.toFixed(2)}`);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (val < minWithdrawal) {
      toast.warning(`O valor mínimo para resgate é R$ ${minWithdrawal.toFixed(2)}.`);
      return;
    }
    
    if (val > user.balance) {
      toast.error('Saldo disponível insuficiente.');
      return;
    }

    // Check referral requirement
    if (user.referrals < referralsRequired) {
      toast.error(`Você precisa indicar pelo menos ${referralsRequired} amigos para realizar um resgate!`);
      return;
    }

    // Process withdrawal
    const updatedUser = { 
      ...user, 
      balance: user.balance - val,
      withdrawalsCount: (user.withdrawalsCount || 0) + 1,
    };
    
    await db.updateUser(updatedUser);
    
    await db.addTransaction({
      userId: user.id,
      amount: val,
      type: 'withdraw',
      status: 'pending',
    });
    
    if (refreshUser) {
      await refreshUser();
    }
    
    setTransactions(await db.getTransactions());
    setAmount('');
    setPixKey('');
    toast.success(`Solicitação de resgate de R$ ${val.toFixed(2)} enviada! Aguarde a aprovação do administrador.`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1">
        <div className="glass-card p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden group w-full">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/10 blur-2xl rounded-full -mr-10 -mt-10 transition-all group-hover:bg-brand-primary/20" />
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] relative z-10">Saldo Disponível</p>
          <p className="text-3.5xl font-display font-black text-brand-primary relative z-10">
            R$ {user.balance.toFixed(2)}
          </p>
          <div className="w-16 h-1 bg-brand-primary/20 rounded-full relative z-10" />
        </div>
      </div>

      <div className="flex gap-2 glass-panel p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            activeTab === 'deposit' ? 'bg-brand-primary text-surface-dark shadow-lg shadow-brand-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArrowDownToLine size={14} /> Depósito
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            activeTab === 'withdraw' ? 'bg-brand-secondary text-white shadow-lg shadow-brand-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArrowUpFromLine size={14} /> Resgatar
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            activeTab === 'history' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <History size={14} /> Histórico
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151020] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white text-center">Requisitos para Resgate</h3>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${ (user.balance || 0) >= minWithdrawal ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className="text-2xl">{(user.balance || 0) >= minWithdrawal ? '✅' : '❌'}</span>
                <p className="text-xs text-white">Acumular pelo menos R$ {minWithdrawal.toFixed(2)} em saldo disponível (Atual: R$ {(user.balance || 0).toFixed(2)})</p>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${user.referrals >= referralsRequired ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className="text-2xl">{user.referrals >= referralsRequired ? '✅' : '❌'}</span>
                <p className="text-xs text-white">Indicar pelo menos {referralsRequired} amigos (Atual: {user.referrals})</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-white/10 text-white font-bold py-3 rounded-xl text-sm hover:bg-white/20"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#151020] rounded-2xl p-4 border border-white/5">
        {activeTab === 'deposit' && (() => {
          const currentAmountFloat = parseFloat(amount) || 0;
          const calculatedBonusValue = calculateBonus(amount);
          const totalPlayableBalance = currentAmountFloat + calculatedBonusValue;
          
          const depositPacks = [
            { amt: 20, bonus: 10, title: 'Pacote Bronze', badge: 'Popular', icon: Zap, bg: 'from-blue-600/10 to-transparent' },
            { amt: 50, bonus: 25, title: 'Pacote Prata', badge: 'Mais Comprado 🔥', icon: Flame, bg: 'from-amber-600/10 to-transparent', premium: true },
            { amt: 100, bonus: 50, title: 'Pacote Ouro', badge: 'Melhor Oferta ✨', icon: Sparkles, bg: 'from-emerald-600/10 to-transparent' },
            { amt: 200, bonus: 150, title: 'Pacote Lendário', badge: '+75% Extra VIP', icon: Gift, bg: 'from-purple-600/15 to-transparent', vvip: true }
          ];

          const tickerEvents = [
            { text: "👤 Matheus S. depositou R$ 50 e faturou R$ 350 no Yakuza Ink!", time: "Agora mesmo" },
            { text: "👤 Karina R. depositou R$ 20 e já resgatou Voucher de R$ 120!", time: "Há 1 min" },
            { text: "👤 Felipe G. depositou R$ 100 e recebeu R$ 50 de bônus!", time: "Há 3 min" },
            { text: "👤 Bruna L. depositou R$ 200 e garantiu R$ 350 de saldo!", time: "Há 5 min" },
            { text: "👤 Thiago M. acabou de faturar R$ 800 de prêmio no Tattoo Cash!", time: "Há 10 min" }
          ];

          const faqs = [
            {
              q: "Como funciona o bônus de depósito?",
              a: "Ao depositar qualquer valor a partir de R$ 20, você recebe automaticamente +50% de bônus na hora! Em depósitos de R$ 200 ou mais, seu bônus é turbinado para +75%!"
            },
            {
              q: "O saldo de bônus é liberado imediatamente?",
              a: "Sim! Assim que o seu pagamento via PIX for efetuado, tanto o valor depositado quanto o bônus serão creditados juntos em sua conta no mesmo segundo."
            },
            {
              q: "Como converter meu saldo em vouchers de tatuagem?",
              a: "A qualquer momento, você pode ir na aba 'Resgatar' e solicitar a conversão do seu saldo de vitória para um voucher exclusivo que pode ser utilizado diretamente no estúdio de tatuagem de alta qualidade de Adriano!"
            },
            {
              q: "É seguro depositar?",
              a: "Sim, 100% seguro! Nossos pagamentos via PIX são totalmente processados através do Banco Central e criptografados de ponta a ponta, oferecendo máxima segurança ao jogador."
            }
          ];

          return (
            <div className="animate-in fade-in space-y-6">
              {/* Urgency & Promotion Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-black/60 border border-brand-primary/30 rounded-2xl p-5 shadow-[0_4px_25px_rgba(255,204,0,0.15)]">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-primary/10 blur-3xl rounded-full" />
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-[9px] font-black uppercase tracking-widest text-brand-primary animate-pulse">
                      <Flame size={10} className="text-brand-primary" /> Bônus de Depósito Ativo
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-white/70 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                      <Clock size={11} className="text-brand-primary animate-spin" /> {formatTime(timeLeft)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-black text-white leading-tight uppercase tracking-wide">
                      Multiplique sua banca em até <span className="text-brand-primary font-black">+75% EXTRA</span>!
                    </h3>
                    <p className="text-[10px] text-white/60 mt-1">
                      Deposite agora para turbinar suas chances nos jogos e garantir seu voucher de tatuagem muito mais rápido!
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] text-white/40">
                    <span>Apenas <strong className="text-brand-primary font-bold">{bonusesClaimed} pacotes promocionais</strong> restantes hoje</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Social Proof Live Ticker */}
              <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 overflow-hidden">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">Atividade Recente:</span>
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <p className="text-[10px] text-brand-primary font-semibold truncate animate-pulse">
                    {tickerEvents[tickerIndex].text}
                  </p>
                </div>
                <span className="text-[8px] font-mono text-white/30 shrink-0">
                  {tickerEvents[tickerIndex].time}
                </span>
              </div>

              {!showQr ? (
                <form onSubmit={handleDeposit} className="space-y-6">
                  {/* Package Cards Selector */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted/70">Escolha um Pacote Recomendado para Iniciar</p>
                    <div className="grid grid-cols-2 gap-3">
                      {depositPacks.map((pack) => {
                        const isSelected = currentAmountFloat === pack.amt;
                        const PackIcon = pack.icon;
                        return (
                          <button
                            key={pack.amt}
                            type="button"
                            onClick={() => setAmount(pack.amt.toString())}
                            className={`relative text-left p-4 rounded-2xl border bg-gradient-to-br ${pack.bg} transition-all duration-300 overflow-hidden flex flex-col justify-between h-[100px] group ${
                              isSelected
                                ? 'border-brand-primary shadow-[0_0_15px_rgba(255,204,0,0.15)] bg-brand-primary/[0.04]'
                                : pack.premium
                                ? 'border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/[0.02]'
                                : pack.vvip
                                ? 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/[0.02]'
                                : 'border-white/5 hover:border-white/20 hover:bg-white/[0.01]'
                            }`}
                          >
                            <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-30 transition-opacity">
                              <PackIcon size={36} className={isSelected ? "text-brand-primary" : "text-white"} />
                            </div>
                            
                            <div className="flex items-center justify-between w-full relative z-10">
                              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{pack.title}</span>
                              <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                pack.vvip ? 'bg-purple-500/20 text-purple-400' : pack.premium ? 'bg-amber-500/20 text-amber-400' : 'bg-brand-primary/20 text-brand-primary'
                              }`}>
                                {pack.badge}
                              </span>
                            </div>

                            <div className="mt-auto relative z-10">
                              <p className="text-xl font-display font-black text-white">R$ {pack.amt}</p>
                              <p className={`text-[9px] font-bold ${isSelected ? "text-brand-primary" : "text-emerald-400"}`}>
                                + R$ {pack.bonus} de bônus (Jogue com R$ {pack.amt + pack.bonus})
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Input Container */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted/70">Ou Insira outro valor para depositar</p>
                      <span className="text-[8px] font-bold text-white/30">Mínimo R$ {minDeposit.toFixed(2)}</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-xl">R$</span>
                      <input
                        type="number"
                        min={minDeposit}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-3xl pl-16 pr-6 py-5 text-3xl font-display font-black text-center text-white focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/5"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Interactive Multiplier Simulator */}
                  {currentAmountFloat >= minDeposit && (
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom duration-300">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <TrendingUp size={12} className="text-brand-primary animate-pulse" /> Simulador de Banca
                        </span>
                        <span className="text-[9px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase">
                          {currentAmountFloat >= 200 ? 'Bônus VIP 75% Ativo!' : 'Bônus 50% Ativo!'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-white/[0.01] border border-white/5">
                          <p className="text-[8px] text-white/40 uppercase font-black">Depósito</p>
                          <p className="text-sm font-black text-white mt-1">R$ {currentAmountFloat.toFixed(2)}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.01] border border-white/5">
                          <p className="text-[8px] text-white/40 uppercase font-black">Bônus Creditado</p>
                          <p className="text-sm font-black text-brand-primary mt-1">+ R$ {calculatedBonusValue.toFixed(2)}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-[8px] text-emerald-400 uppercase font-black">Saldo Total</p>
                          <p className="text-sm font-black text-emerald-400 mt-1">R$ {totalPlayableBalance.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-brand-primary/5 border border-brand-primary/10 rounded-xl">
                        <Gift size={14} className="text-brand-primary shrink-0 animate-bounce" />
                        <p className="text-[9px] text-white/80 leading-snug">
                          Incrível! Você receberá um saldo extra de <strong className="text-brand-primary">R$ {calculatedBonusValue.toFixed(2)}</strong> gratuito! Sua banca terá <strong className="text-emerald-400">R$ {totalPlayableBalance.toFixed(2)}</strong> para multiplicar nos jogos!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submission Button */}
                  <button
                    type="submit"
                    disabled={isGeneratingPix}
                    className="w-full bg-brand-primary text-surface-dark hover:bg-brand-primary-hover font-display font-black py-4 rounded-2xl text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_4px_25px_rgba(255,204,0,0.2)] hover:shadow-[0_4px_35px_rgba(255,204,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGeneratingPix ? (
                      <>
                        <div className="w-4 h-4 border-2 border-surface-dark border-t-transparent rounded-full animate-spin" />
                        Gerando PIX...
                      </>
                    ) : (
                      <>
                        <Zap size={14} /> Ativar Bônus e Depositar via PIX
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-6 py-6 animate-in fade-in">
                  <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl shadow-emerald-500/20">
                    {qrCodeBase64 ? (
                      <img src={`data:image/jpeg;base64,${qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
                    ) : (
                      <QrCode size={150} className="text-black" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/70 font-bold uppercase tracking-widest">Escaneie o QR Code</p>
                    <p className="text-[10px] text-white/40">ou copie o código PIX abaixo</p>
                  </div>
                  
                  {qrCode && (
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                      <p className="text-[10px] font-mono text-white/60 truncate flex-1">{qrCode}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(qrCode);
                          toast.success('Código PIX copiado!');
                        }}
                        className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl hover:bg-emerald-500/30 transition-all"
                      >
                        Copiar
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-3 text-emerald-400">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Aguardando pagamento...</span>
                  </div>
                  
                  <button 
                    onClick={() => setShowQr(false)}
                    className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold mt-4"
                  >
                    Voltar
                  </button>
                </div>
              )}

              {/* Trust & Guarantee Badges Grid */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                <div className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wide">PIX Instantâneo</h4>
                    <p className="text-[9px] text-white/55 leading-snug mt-0.5">Crédito liberado na sua carteira de forma 100% automática em segundos.</p>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                  <Lock size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wide">Ambiente Seguro</h4>
                    <p className="text-[9px] text-white/55 leading-snug mt-0.5">Criptografia SSL de nível bancário assegurada pelo Banco Central do Brasil.</p>
                  </div>
                </div>
                <div className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wide">Vouchers Garantidos</h4>
                    <p className="text-[9px] text-white/55 leading-snug mt-0.5">Todos os seus lucros acumulados se transformam em cupons reais de tatuagem.</p>
                  </div>
                </div>
                <a 
                  href="https://wa.me/5521982331392" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-emerald-500/50 transition-all"
                >
                  <MessageCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wide">Suporte WhatsApp</h4>
                    <p className="text-[9px] text-white/55 leading-snug mt-0.5">+55 21 98233-1392</p>
                  </div>
                </a>
                <a 
                  href="https://whatsapp.com/channel/0029Vb8bwdNChq6OZUleSz2T" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex gap-2.5 p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-emerald-500/50 transition-all"
                >
                  <MessageCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-wide">Nosso Canal</h4>
                    <p className="text-[9px] text-white/55 leading-snug mt-0.5">Fique por dentro de todas as novidades.</p>
                  </div>
                </a>
              </div>

              {/* Persuasive FAQ Accordion */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/70 flex items-center gap-1">
                  <HelpCircle size={11} className="text-brand-primary" /> Dúvidas Frequentes
                </h4>
                <div className="space-y-2">
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-3.5 text-left text-[11px] font-bold text-white hover:bg-white/[0.01] transition-all"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown size={14} className={`text-text-muted/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 text-[10px] text-white/60 leading-relaxed border-t border-white/5 pt-2 bg-black/20 animate-in fade-in duration-300">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'withdraw' && (
          <div className="animate-in fade-in">
            <h2 className="text-lg font-bold mb-2 text-center">Resgatar Voucher</h2>
            <p className="text-xs text-white/50 text-center mb-4 px-4">
              Seu saldo será convertido em um voucher para tatuagem. Informe seus dados para contato.
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <input
                  type="number"
                  min={minWithdrawal}
                  max={user.balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono text-center text-white focus:outline-none focus:border-[#FF007F]"
                  placeholder="Valor do Voucher"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF007F]"
                  placeholder="Seu WhatsApp ou Instagram"
                  required
                />
              </div>
              <button
                type="submit"
                onClick={(e) => {
                  if (!canWithdraw) {
                    e.preventDefault();
                    handleWithdrawClick();
                  }
                }}
                className={`w-full text-white font-bold py-3.5 rounded-xl text-sm ${(user.balance || 0) < minWithdrawal ? 'bg-gray-500' : 'bg-[#FF007F]'}`}
              >
                {(user.balance || 0) < minWithdrawal ? `Mínimo R$ ${minWithdrawal.toFixed(2)}` : 'Solicitar Voucher'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in">
            <h2 className="text-lg font-bold mb-4">Histórico</h2>
            {transactions.length === 0 ? (
              <p className="text-center text-xs text-white/50 py-4">Nenhuma transação.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === 'deposit' || tx.type === 'win' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'win' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-medium capitalize">{tx.type === 'win' ? 'Prêmio' : tx.type === 'bet' ? 'Aposta' : tx.type === 'deposit' ? 'Depósito' : 'Resgate'}</p>
                        <p className="text-[10px] text-white/50">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`font-numeric font-bold text-sm ${
                        tx.type === 'deposit' || tx.type === 'win' ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </div>
                      <span className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-full ${
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.status === 'pending' ? 'Pendente' : tx.status === 'completed' ? 'Concluído' : 'Rejeitado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
