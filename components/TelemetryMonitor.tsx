
import React, { useState } from 'react';
import { Vehicle, TelemetryData } from '../types';

interface TelemetryMonitorProps {
  vehicles: Vehicle[];
}

const TelemetryMonitor: React.FC<TelemetryMonitorProps> = ({ vehicles }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(vehicles[0]?.id || null);
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const telemetry = selectedVehicle?.telemetry;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 -m-8 p-8 text-white overflow-hidden animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
           <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
              Live Control Center
           </h3>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Telemetria Avançada • CAN-BUS & GPS</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase">Satélites</span>
                <span className="text-xs font-bold text-emerald-400">12 Ativos</span>
            </div>
            <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase">Status Global</span>
                <span className="text-xs font-bold text-blue-400">Frota Monitorada</span>
            </div>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Lista de Veículos Lateral */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {vehicles.map(v => (
            <div 
              key={v.id}
              onClick={() => setSelectedVehicleId(v.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedVehicleId === v.id 
                  ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-tighter">{v.plate}</span>
                <span className={`w-2 h-2 rounded-full ${v.telemetry?.ignition ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                   <p className="text-sm font-bold truncate max-w-[120px]">{v.model}</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase">{v.brand}</p>
                </div>
                {v.telemetry?.ignition && (
                    <div className="text-right">
                        <span className="text-lg font-black leading-none">{v.telemetry.speed}</span>
                        <span className="text-[8px] font-bold block">KM/H</span>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Painel Central Cockpit */}
        <div className="flex-1 bg-slate-900/50 rounded-[40px] border border-slate-800 p-10 overflow-y-auto">
            {selectedVehicle ? (
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h4 className="text-4xl font-black">{selectedVehicle.plate}</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedVehicle.brand} {selectedVehicle.model}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Score de Segurança</p>
                             <p className={`text-4xl font-black ${getScoreColor(telemetry?.safetyScore || 0)}`}>
                                {telemetry?.safetyScore || '--'}
                             </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                        {/* Speed Gauge Simulation */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-48 h-48 rounded-full border-8 border-slate-800 flex flex-col items-center justify-center bg-slate-900 shadow-2xl overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all"></div>
                                <span className="text-5xl font-black z-10">{telemetry?.speed || 0}</span>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1 z-10">Km/h</span>
                                <div className="absolute bottom-4 text-[9px] font-bold text-slate-500 z-10">VELOCIDADE</div>
                            </div>
                        </div>

                        {/* RPM Gauge Simulation */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-48 h-48 rounded-full border-8 border-slate-800 flex flex-col items-center justify-center bg-slate-900 shadow-2xl overflow-hidden group">
                                <div className="absolute inset-0 bg-emerald-600/10 transition-all"></div>
                                <span className="text-4xl font-black z-10">{telemetry?.rpm || 0}</span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1 z-10">RPM</span>
                                <div className="absolute bottom-4 text-[9px] font-bold text-slate-500 z-10">ROTAÇÃO</div>
                            </div>
                        </div>

                        {/* Temp/Fuel */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Temp. Motor</span>
                                    <span className={`text-sm font-black ${telemetry?.engineTemp && telemetry.engineTemp > 95 ? 'text-red-500' : 'text-white'}`}>
                                        {telemetry?.engineTemp}°C
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${telemetry?.engineTemp || 0}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Tanque de Comb.</span>
                                    <span className="text-sm font-black">{telemetry?.fuelLevel}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${telemetry?.fuelLevel || 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Status Ignição', value: telemetry?.ignition ? 'LIGADA' : 'DESLIGADA', color: telemetry?.ignition ? 'text-emerald-400' : 'text-slate-500' },
                            { label: 'Odômetro Live', value: `${telemetry?.odometer.toLocaleString()} km`, color: 'text-white' },
                            { label: 'Idling (Lenta)', value: `${telemetry?.idlingTime} min`, color: 'text-orange-400' },
                            { label: 'Localização', value: `${telemetry?.latitude.toFixed(3)}, ${telemetry?.longitude.toFixed(3)}`, color: 'text-blue-400' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                <p className={`text-sm font-black mt-1 ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-12">
                        <h5 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Eventos Críticos de Direção</h5>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-900/30 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-black text-red-400 uppercase">Frenagem Brusca</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Há 15 min • Rodovia BR-116</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    <span className="text-xs font-black text-orange-400 uppercase">Excesso Velocidade (85 km/h)</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Há 42 min • Avenida Marginal</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-20"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    <p className="font-black uppercase text-xs tracking-[0.3em]">Selecione um veículo para monitorar</p>
                </div>
            )}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default TelemetryMonitor;
