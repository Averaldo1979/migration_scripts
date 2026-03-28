
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudDownload, Loader2, LogOut } from 'lucide-react';

interface OfflineIndicatorProps {
  onFullRefresh?: () => void;
  onLogout?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onFullRefresh, onLogout }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(localStorage.getItem('last_data_update') || '---');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkInterval = setInterval(() => {
        const stored = localStorage.getItem('last_data_update');
        if (stored && stored !== lastUpdate) setLastUpdate(stored);
        setIsOnline(navigator.onLine);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, [lastUpdate]);

  const handleFullSync = async () => {
    if (!isOnline || isFullSyncing) return;
    setIsFullSyncing(true);
    
    if (onFullRefresh) {
      try {
        await onFullRefresh();
      } catch (err) {
        console.error('Erro ao atualizar dados:', err);
      }
    }
    
    setIsFullSyncing(false);
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('last_data_update', nowStr);
    setLastUpdate(nowStr);
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente encerrar sua sessão?')) {
      onLogout?.();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] safe-area-inset-bottom">
      <div className={`
        flex items-center justify-between
        px-3 py-2
        border-t shadow-2xl backdrop-blur-xl
        ${!isOnline
          ? 'bg-red-600/95 border-red-500/60 text-white'
          : 'bg-slate-900/95 border-slate-700/60 text-white'
        }
      `}>

        {/* ── Status de conexão ── */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <div className={`
            flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0
            ${!isOnline ? 'bg-red-500/30' : 'bg-emerald-500/20'}
          `}>
            {!isOnline
              ? <WifiOff size={14} className="animate-pulse text-red-200" />
              : <Wifi size={14} className="text-emerald-400" />
            }
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
              {!isOnline ? 'Offline' : 'Online'}
            </span>
            <span className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5 whitespace-nowrap">
              Ref: {lastUpdate}
            </span>
          </div>
        </div>

        {/* ── Ações ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isOnline && (
            <button
              onClick={handleFullSync}
              disabled={isFullSyncing}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-[10px] font-black uppercase tracking-wide
                transition-all active:scale-95
                ${isFullSyncing
                  ? 'bg-sky-500/20 text-sky-300 opacity-70'
                  : 'bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/30'
                }
              `}
            >
              {isFullSyncing
                ? <Loader2 size={12} className="animate-spin" />
                : <CloudDownload size={12} />
              }
              <span>{isFullSyncing ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              text-[10px] font-black uppercase tracking-wide
              bg-red-500/20 hover:bg-red-500/40 text-red-400
              border border-red-500/30
              transition-all active:scale-95
            "
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default OfflineIndicator;
