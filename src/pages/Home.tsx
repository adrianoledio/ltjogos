import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
const JoyrideLazy = React.lazy(() => import('react-joyride').then(module => ({ default: module.Joyride })));
const Joyride = JoyrideLazy as any;
import type { Step } from 'react-joyride';
import { db, GameConfig } from '../data/db';
import { Play, Trophy, Sparkles, Star, RotateCw, ThumbsUp, Search, X } from 'lucide-react';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { CategoryFilter } from '../components/home/CategoryFilter';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RecentWinsFeed } from '../components/home/RecentWinsFeed';
import { requestNotificationPermission, showNotification } from '../lib/notifications';

const steps: Step[] = [
  {
    target: '#deposit-button',
    content: 'Clique aqui para fazer seu depósito e começar a jogar!',
  },
  {
    target: '#games-section',
    content: 'Aqui você encontra todos os nossos jogos disponíveis.',
  },
];

const GameCard: React.FC<{ game: GameConfig, aspect?: string, compact?: boolean, badge?: string }> = ({ game, aspect = 'aspect-[2/3]', compact = false, badge }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative group">
      <Link
        to={`/app/games/${game.id}`}
        className={`block ${aspect} relative overflow-hidden rounded-xl border border-white/10 group-hover:border-brand-primary/40 transition-all duration-300 shadow-xl z-10 bg-surface-dark`}
      >
        {/* Cover Image - completely clean with no zoom, no overlays, and fallback for broken URLs */}
        <div className="absolute inset-0 bg-surface-card flex items-center justify-center">
          {game.thumbnail && !hasError ? (
            <img
              src={game.thumbnail}
              alt={game.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-surface-card to-surface-dark w-full h-full">
              <span className="text-3xl mb-1">🎮</span>
              <span className="text-xs font-black text-white/90 truncate max-w-[90%]">{game.name}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export function Home() {
  const [games, setGames] = useState<GameConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [runTour, setRunTour] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const prevGamesCount = useRef(0);

  useEffect(() => {
    requestNotificationPermission();

    const fetchGames = async () => {
      const allGames = await db.getGames();
      const activeGames = allGames.filter((g) => g.active);
      
      if (prevGamesCount.current > 0 && activeGames.length > prevGamesCount.current) {
        showNotification("Novos Jogos!", "Confira os novos jogos que adicionamos!");
      }
      prevGamesCount.current = activeGames.length;
      setGames(activeGames);
      setIsLoading(false);
    };
    fetchGames();
    
    // Poll for updates every 5 seconds to ensure changes in DB reflect in UI
    const interval = setInterval(fetchGames, 5000);

    // Check tour status
    const seen = localStorage.getItem('tourSeen');
    if (!seen) {
      setRunTour(true);
    }

    // Check daily bonus
    const today = new Date().toISOString().split('T')[0];
    const bonusNotified = localStorage.getItem(`bonusNotified_${today}`);
    const checkBonus = async () => {
      const storedUserId = localStorage.getItem('lt_active_user');
      if (storedUserId) {
        const user = await db.getUser(storedUserId);
        if (user && user.lastPrizeDate !== today && !bonusNotified) {
          showNotification("Bônus Diário", "Seu bônus diário está disponível!");
          localStorage.setItem(`bonusNotified_${today}`, 'true');
        }
      }
    };
    checkBonus();

    return () => clearInterval(interval);
  }, []);

  const categoryFiltered = activeCategory === 'all' 
    ? games 
    : activeCategory === 'popular' 
      ? games.slice(0, 6) 
      : games.filter(g => g.category === activeCategory);

  const filteredGames = searchQuery.trim() === ''
    ? categoryFiltered
    : categoryFiltered.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  return (
    <div className="flex flex-col h-full -m-4 overflow-hidden">
      <React.Suspense fallback={null}>
        <Joyride
          run={runTour}
          steps={steps}
          continuous={true}
          showSkipButton={true}
          callback={(data) => {
            if (data.status === 'finished' || data.status === 'skipped') {
              localStorage.setItem('tourSeen', 'true');
              setRunTour(false);
            }
          }}
          styles={{
            options: {
              primaryColor: '#FFCC00',
              textColor: '#333',
              backgroundColor: '#fff',
            },
          } as any}
        />
      </React.Suspense>
      
      {/* Hero Section */}
      <section className="shrink-0 p-4 pb-0">
        <HeroCarousel />
      </section>

      {/* Categories */}
      <section className="shrink-0 py-4 px-4">
        <CategoryFilter active={activeCategory} onChange={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
        }} />
      </section>

      {/* Search Bar */}
      <section className="shrink-0 px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/80 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar jogos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-card border border-border-rgba text-text-main placeholder:text-text-muted/50 text-xs font-semibold pl-10 pr-10 py-2.5 rounded-xl focus:border-brand-primary/40 focus:outline-none transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-surface-dark transition-all animate-fade-in"
              title="Limpar pesquisa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Game Grid */}
      <section className="flex-1 overflow-y-auto px-4 pt-2 pb-24 scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black flex items-center gap-3 text-white tracking-widest uppercase">
            {activeCategory === 'all' && <Gamepad2 className="text-brand-primary" size={18} />}
            {activeCategory === 'slots' && <Sparkles className="text-brand-secondary" size={18} />}
            {activeCategory === 'roletas' && <RotateCw className="text-[#FFCC00]" size={18} />}
            
            <span className="text-gradient">
              {activeCategory === 'all' ? 'Todos os Jogos' : activeCategory === 'slots' ? 'Slots' : 'Roletas'}
            </span>
          </h2>
          <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded-lg border border-white/5 uppercase tracking-widest">
            {isLoading ? '...' : `${filteredGames.length} Jogos`}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <LoadingSpinner size="md" text="CARREGANDO..." />
          </div>
        ) : (
          <motion.div 
            layout
            id="games-section"
            className="grid grid-cols-3 gap-3 sm:gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredGames.map((game, i) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  badge={i < 3 && activeCategory === 'all' ? 'NEW' : undefined}
                  compact={true}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && filteredGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-white/30">
            <Gamepad2 size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-medium">Nenhum jogo encontrado.</p>
          </div>
        )}

        {/* Live Winners Feed */}
        <div className="mt-8 pb-4 px-4">
          <RecentWinsFeed />
        </div>
      </section>
    </div>
  );
}

// Helper for icon
function Gamepad2({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}
