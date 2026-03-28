
import React, { useState, useRef } from 'react';
import { Vehicle, Driver, PPEItem } from '../types';

interface Alert {
  id: string;
  source: 'vehicle' | 'driver' | 'ppe';
  assetId: string;
  docId: string; // Para veículos é o ID do doc, para motorista é 'license' ou ID do curso, para PPE é ID do item
  assetName: string;
  assetIdentifier: string;
  label: string;
  date: string;
  type: 'danger' | 'warning';
  hasFile: boolean;
  daysRemaining: number;
}

interface DocumentPanelProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  ppeItems?: PPEItem[];
  onUpdateVehicleDoc?: (vehicleId: string, docId: string, fileUrl: string) => void;
  onUpdateDriverDoc?: (driverId: string, type: string, fileUrl: string) => void;
  onUpdatePPEItemDoc?: (ppeId: string, fileUrl: string) => void;
}

const DocumentPanel: React.FC<DocumentPanelProps> = ({
  vehicles,
  drivers,
  ppeItems = [],
  onUpdateVehicleDoc,
  onUpdateDriverDoc,
  onUpdatePPEItemDoc
}) => {
  const [filter, setFilter] = useState<'all' | 'danger' | 'warning'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getAlerts = (): Alert[] => {
    const alerts: Alert[] = [];
    const today = new Date();

    vehicles.forEach(v => {
      (v.documents || []).forEach(doc => {
        if (doc.status === 'Ativo') {
          const expiryDate = new Date(doc.expiryDate);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          alerts.push({
            id: `v-${v.id}-${doc.id}`,
            source: 'vehicle',
            assetId: v.id,
            docId: doc.id,
            assetName: v.model,
            assetIdentifier: v.plate,
            label: doc.name,
            date: doc.expiryDate,
            type: diffDays <= 15 ? 'danger' : 'warning',
            hasFile: !!doc.fileUrl,
            daysRemaining: diffDays
          });
        }
      });
    });

    drivers.forEach(d => {
      if (d.licenseExpiry) {
        const expiryDate = new Date(d.licenseExpiry);
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `d-${d.id}-CNH`,
          source: 'driver',
          assetId: d.id,
          docId: 'license',
          assetName: d.name,
          assetIdentifier: d.licenseCategory,
          label: 'CNH',
          date: d.licenseExpiry,
          type: diffDays <= 15 ? 'danger' : 'warning',
          hasFile: !!d.licenseFile,
          daysRemaining: diffDays
        });
      }

      d.courses.forEach(c => {
        if (c.expiryDate) {
          const expiryDate = new Date(c.expiryDate);
          const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          alerts.push({
            id: `d-${d.id}-${c.id}`,
            source: 'driver',
            assetId: d.id,
            docId: c.id,
            assetName: d.name,
            assetIdentifier: 'Curso',
            label: c.name,
            date: c.expiryDate,
            type: diffDays <= 15 ? 'danger' : 'warning',
            hasFile: !!c.certificateFile,
            daysRemaining: diffDays
          });
        }
      });
    });

    ppeItems.forEach(item => {
      if (item.caExpiryDate) {
        const expiryDate = new Date(item.caExpiryDate);
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `ppe-${item.id}-CA`,
          source: 'ppe',
          assetId: item.id,
          docId: item.id,
          assetName: item.name,
          assetIdentifier: `CA: ${item.certificateNumber}`,
          label: 'Certificado de Aprovação (CA)',
          date: item.caExpiryDate,
          type: diffDays <= 15 ? 'danger' : 'warning',
          hasFile: !!item.caFileUrl,
          daysRemaining: diffDays
        });
      }
    });

    return alerts
      .filter(a => filter === 'all' || a.type === filter)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedAlert) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileUrl = reader.result as string;
        setPreviewUrl(fileUrl);
        if (selectedAlert.source === 'vehicle' && onUpdateVehicleDoc) {
          onUpdateVehicleDoc(selectedAlert.assetId, selectedAlert.docId, fileUrl);
        } else if (selectedAlert.source === 'driver' && onUpdateDriverDoc) {
          onUpdateDriverDoc(selectedAlert.assetId, selectedAlert.docId, fileUrl);
        } else if (selectedAlert.source === 'ppe' && onUpdatePPEItemDoc) {
          onUpdatePPEItemDoc(selectedAlert.assetId, fileUrl);
        }
        setTimeout(() => {
          alert('Documento atualizado com sucesso!');
          setSelectedAlert(null);
          setPreviewUrl(null);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  const allAlerts = getAlerts();
  const criticalCount = allAlerts.filter(a => a.daysRemaining <= 0).length;
  const warningCount = allAlerts.filter(a => a.daysRemaining > 0 && a.daysRemaining <= 30).length;
  const okCount = allAlerts.filter(a => a.hasFile && a.daysRemaining > 30).length;

  const getRowColor = (days: number) => {
    if (days <= 0) return 'bg-red-50/70 border-l-4 border-l-red-500';
    if (days <= 30) return 'bg-orange-50/50 border-l-4 border-l-orange-400';
    return 'bg-white hover:bg-gray-50';
  };

  const getStatusBadge = (days: number) => {
    if (days <= 0) return <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded uppercase">Vencido</span>;
    if (days <= 30) return <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded uppercase">Urgente</span>;
    return <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded uppercase">Em dia</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header com KPIs integrados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtros Ativos</span>
          <div className="flex mt-3 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('danger')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${filter === 'danger' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
            >
              Críticos
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${filter === 'warning' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
            >
              Atenção
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 border-b-4 border-b-red-500">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Críticos</span>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <p className="text-3xl font-black text-gray-800 mt-2">{criticalCount}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Vencidos ou Irregulares</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 border-b-4 border-b-orange-400">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Atenção</span>
          <p className="text-3xl font-black text-gray-800 mt-2">{warningCount}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Vencendo em 30 dias</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 border-b-4 border-b-emerald-500">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Regularizados</span>
          <p className="text-3xl font-black text-gray-800 mt-2">{okCount}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Arquivos em Conformidade</p>
        </div>
      </div>

      {/* Tabela de Alertas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="sticky top-0 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 z-20">Prazo / Vencimento</th>
                <th className="sticky top-0 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 z-20">Documento Técnico</th>
                <th className="sticky top-0 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 z-20">Ativo Relacionado</th>
                <th className="sticky top-0 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 z-20 text-center">Arquivo</th>
                <th className="sticky top-0 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 z-20 text-right">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {allAlerts.map((alert) => (
                <tr key={alert.id} className={`${getRowColor(alert.daysRemaining)} transition-all group`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(alert.daysRemaining)}
                        <span className={`text-sm font-black ${alert.daysRemaining <= 0 ? 'text-red-700' : 'text-gray-800'}`}>
                          {new Date(alert.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                        {alert.daysRemaining <= 0 ? 'Vencido' : `${alert.daysRemaining} dias para o fim`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-blue-500 transition-colors"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <span className="text-sm font-bold text-gray-800 tracking-tight">{alert.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${alert.source === 'vehicle' ? 'bg-blue-600 text-white' :
                          alert.source === 'driver' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'
                        }`}>
                        {alert.source === 'vehicle' ? 'PLACA' : alert.source === 'driver' ? 'COND' : 'EPI'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase leading-none">{alert.assetIdentifier}</p>
                        <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px] mt-1">{alert.assetName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {alert.hasFile ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        PDF VÁLIDO
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 text-[9px] font-black rounded-full border border-red-200">
                        PENDENTE
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className={`p-2 rounded-lg transition-all ${alert.hasFile ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} hover:scale-105`}
                        title={alert.hasFile ? "Editar/Trocar Documento" : "Subir Documento"}
                      >
                        {alert.hasFile ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allAlerts.length === 0 && (
            <div className="p-24 text-center">
              <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhuma inconformidade encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gerenciamento de Documento */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-6 md:p-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-xl font-black text-gray-800 uppercase tracking-tight">Gerenciar Documento</h4>
              <button onClick={() => { setSelectedAlert(null); setPreviewUrl(null); }} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6 border-b pb-4">{selectedAlert.label}</p>

            <div className="space-y-4">
              {/* Info do ativo */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[9px] font-black text-white shadow-sm ${selectedAlert.source === 'vehicle' ? 'bg-blue-600' : selectedAlert.source === 'driver' ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}>
                  {selectedAlert.source === 'vehicle' ? 'VEÍ' : selectedAlert.source === 'driver' ? 'MOT' : 'EPI'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-800 truncate">{selectedAlert.assetIdentifier}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{selectedAlert.assetName}</p>
                </div>
                {selectedAlert.hasFile ? (
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase shrink-0">Anexado ✓</span>
                ) : (
                  <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase shrink-0">Pendente</span>
                )}
              </div>

              {/* Preview da foto capturada */}
              {previewUrl && previewUrl.startsWith('data:image') && (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-2xl border border-gray-100" />
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                      <span className="text-xs font-black text-gray-600 uppercase">Salvando...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all flex flex-col items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                  {selectedAlert.hasFile ? 'Substituir' : 'Upload PDF'}
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg transition-all flex flex-col items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                  Tirar Foto
                </button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />

              {selectedAlert.hasFile && (
                <button
                  onClick={() => {
                    if (window.confirm('Deseja remover o arquivo digital?')) {
                      if (selectedAlert.source === 'vehicle' && onUpdateVehicleDoc) onUpdateVehicleDoc(selectedAlert.assetId, selectedAlert.docId, '');
                      else if (selectedAlert.source === 'driver' && onUpdateDriverDoc) onUpdateDriverDoc(selectedAlert.assetId, selectedAlert.docId, '');
                      else if (selectedAlert.source === 'ppe' && onUpdatePPEItemDoc) onUpdatePPEItemDoc(selectedAlert.assetId, '');
                      setSelectedAlert(null);
                      setPreviewUrl(null);
                    }
                  }}
                  className="w-full py-3 bg-gray-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                >
                  Remover Arquivo Atual
                </button>
              )}

              <button onClick={() => { setSelectedAlert(null); setPreviewUrl(null); }} className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPanel;
