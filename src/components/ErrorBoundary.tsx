import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-white">Ops, algo inesperado ocorreu</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ocorreu um erro temporário na visualização desta tela. Clique no botão abaixo para restaurar a página.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-400 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-brand-primary text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Recarregar
              </button>
              <button
                onClick={() => {
                  window.location.href = '/app';
                }}
                className="py-3 px-4 bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                <Home size={14} /> Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
