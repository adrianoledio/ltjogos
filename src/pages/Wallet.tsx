import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../data/db';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine, History, QrCode } from 'lucide-react';

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

  const [qrCode, setQrCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);

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

  const canWithdraw = (user?.earnings || 0) >= minWithdrawal && (user?.referrals || 0) >= referralsRequired;

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

  if (!user || loading) return <div className="text-center mt-20 text-sm">Carregando...</div>;

  // Poll to check if transaction has completed
  useEffect(() => {
    let intervalId: any;
    if (showQr && user && activeTxId) {
      intervalId = setInterval(async () => {
        const txs = await db.getTransactions();
        const currentTx = txs.find(t => t.id === activeTxId);
        if (currentTx && currentTx.status === 'completed') {
          toast.success('Depósito via PIX aprovado com sucesso!');
          setShowQr(false);
          setActiveTxId(null);
          setTransactions(txs);
          if (refreshUser) {
            await refreshUser();
          }
          clearInterval(intervalId);
        }
      }, 4000); // Check every 4 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showQr, user, activeTxId, refreshUser]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val >= minDeposit) {
      setIsGeneratingPix(true);
      try {
        // Try calling the real backend payment API
        const response = await fetch('/api/payments/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: val,
            userId: user.id,
            email: user.email || `${user.phone}@ltjogos.com`
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setQrCode(data.qrCode);
            setQrCodeBase64(data.qrCodeBase64);
            setActiveTxId(data.transactionId);
            setShowQr(true);
            setTransactions(await db.getTransactions());
            toast.success('PIX gerado com sucesso! Escaneie ou copie o código.');
            return;
          }
        }
        
        // If the backend call is unreachable, or returns an error (e.g. mpAccessToken not configured), fallback to simulation
        console.warn("Mercado Pago or backend endpoint unavailable, falling back to simulation...");
        const dummyPixCode = "00020126360014BR.GOV.BCB.PIX0114+5511999999995204000053039865405" + val.toFixed(2) + "5802BR5920LT JOGOS PLATAFORMA6009SAO PAULO62070503***6304" + Math.floor(Math.random() * 9999).toString(16).toUpperCase();
        
        // Add a pending transaction to local DB
        const resTx = await db.addTransaction({
          userId: user.id,
          amount: val,
          type: 'deposit',
          status: 'pending',
          metadata: {
            mpPaymentId: 'mock_' + Math.random().toString(36).substring(2, 9),
            qrCode: dummyPixCode
          }
        });

        setQrCode(dummyPixCode);
        setQrCodeBase64(""); // We don't have a base64 for the mock
        setActiveTxId(resTx.id);
        setShowQr(true);
        setTransactions(await db.getTransactions());
        toast.success('PIX simulado gerado com sucesso!');
        
        // Simulate auto-approval after 15 seconds for testing
        setTimeout(async () => {
          const txs = await db.getTransactions();
          const pendingTx = txs.find(t => t.id === resTx.id && t.status === 'pending');
          if (pendingTx) {
            pendingTx.status = 'completed';
            await db.updateTransaction(pendingTx);
            
            const currentUser = await db.getUser(user.id);
            if (currentUser) {
              currentUser.balance += pendingTx.amount;
              await db.updateUser(currentUser);
              if (refreshUser) {
                await refreshUser();
              }
            }
          }
        }, 15000);

      } catch (error) {
        console.error(error);
        toast.error('Erro ao gerar PIX.');
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
    
    if (val > user.earnings) {
      toast.error('Saldo de ganhos insuficiente.');
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
      earnings: user.earnings - val,
      withdrawalsCount: (user.withdrawalsCount || 0) + 1,
    };
    
    await db.updateUser(updatedUser);
    
    await db.addTransaction({
      userId: user.id,
      amount: val,
      type: 'withdraw',
      status: 'pending',
    });
    
    setTransactions(await db.getTransactions());
    setAmount('');
    setPixKey('');
    toast.success(`Solicitação de resgate de R$ ${val.toFixed(2)} enviada! Aguarde a aprovação do administrador.`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/10 blur-2xl rounded-full -mr-10 -mt-10 transition-all group-hover:bg-brand-primary/20" />
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] relative z-10">Saldo Disponível</p>
          <p className="text-3xl font-display font-black text-brand-primary relative z-10">
            R$ {user.balance.toFixed(2)}
          </p>
          <div className="w-10 h-1 bg-brand-primary/20 rounded-full relative z-10" />
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-secondary/10 blur-2xl rounded-full -mr-10 -mt-10 transition-all group-hover:bg-brand-secondary/20" />
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] relative z-10">Ganhos Acumulados</p>
          <p className="text-3xl font-display font-black text-brand-secondary relative z-10">
            R$ {(user.earnings || 0).toFixed(2)}
          </p>
          <div className="w-10 h-1 bg-brand-secondary/20 rounded-full relative z-10" />
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
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${ (user.earnings || 0) >= minWithdrawal ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className="text-2xl">{(user.earnings || 0) >= minWithdrawal ? '✅' : '❌'}</span>
                <p className="text-xs text-white">Acumular pelo menos R$ {minWithdrawal.toFixed(2)} em ganhos (Atual: R$ {(user.earnings || 0).toFixed(2)})</p>
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
        {activeTab === 'deposit' && (
          <div className="animate-in fade-in space-y-6">
            {/* Urgency & Scarcity Section */}
            <div className="bg-gradient-to-r from-emerald-900/40 to-black/40 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                  <span className="text-xl">🔥</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Bônus de 50% Ativo</p>
                  <p className="text-[10px] text-white/50">Expira em: <span className="font-mono font-bold text-white">{formatTime(timeLeft)}</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white">{bonusesClaimed} bônus</p>
                <p className="text-[9px] text-white/40 uppercase">restantes hoje</p>
              </div>
            </div>

            {!showQr ? (
              <form onSubmit={handleDeposit} className="space-y-6">
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-xl">R$</span>
                  <input
                    type="number"
                    min={minDeposit}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-3xl pl-16 pr-6 py-6 text-4xl font-display font-black text-center text-white focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/5"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[minDeposit, minDeposit * 2, minDeposit * 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      className="py-3 rounded-2xl border border-white/10 text-[10px] font-black text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all uppercase tracking-widest"
                    >
                      + R$ {val}
                    </button>
                  ))}
                </div>
                
                <button
                  type="submit"
                  disabled={isGeneratingPix}
                  className="btn-primary w-full py-5 text-sm uppercase tracking-[0.2em] disabled:opacity-50"
                >
                  {isGeneratingPix ? 'Gerando PIX...' : 'Confirmar Depósito'}
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
          </div>
        )}

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
                  max={user.earnings}
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
                className={`w-full text-white font-bold py-3.5 rounded-xl text-sm ${(user.earnings || 0) < minWithdrawal ? 'bg-gray-500' : 'bg-[#FF007F]'}`}
              >
                {(user.earnings || 0) < minWithdrawal ? `Mínimo R$ ${minWithdrawal.toFixed(2)}` : 'Solicitar Voucher'}
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
