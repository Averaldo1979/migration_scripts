
import React, { useState } from 'react';
import { FuelStation } from '../types';

interface FuelStationManagementProps {
  stations: FuelStation[];
  onAddStation: (station: Omit<FuelStation, 'id'>) => void;
  onUpdateStation: (station: FuelStation) => void;
  onDeleteStation: (id: string) => void;
}

const FuelStationManagement: React.FC<FuelStationManagementProps> = ({ stations, onAddStation, onUpdateStation, onDeleteStation }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<FuelStation, 'id'>>({
    name: '',
    address: '',
    brand: '',
    latitude: '',
    longitude: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      alert("Nome e Endereço são obrigatórios.");
      return;
    }

    if (editingId) {
      onUpdateStation({ id: editingId, ...formData });
    } else {
      onAddStation(formData);
    }

    handleCancel();
  };

  const handleEdit = (station: FuelStation) => {
    const { id, ...data } = station;
    setEditingId(id);
    setFormData(data);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', address: '', brand: '', latitude: '', longitude: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Postos de Abastecimento Credenciados</h3>
          <p className="text-sm text-gray-500">Gestão da rede de postos para controle de consumo.</p>
        </div>
        <button 
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className={`px-6 py-2.5 rounded-xl shadow-lg transition-all font-semibold flex items-center gap-2 ${
            showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showForm ? 'Cancelar' : 'Cadastrar Novo Posto'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
            {editingId ? 'Editar Posto' : 'Novo Posto de Abastecimento'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Posto *</label>
                <input 
                  type="text" placeholder="Ex: Posto Graal Jundiaí"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bandeira / Marca</label>
                <input 
                  type="text" placeholder="Ex: Petrobras, Shell, Ipiranga"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço Completo *</label>
                <input 
                  type="text" placeholder="Av. das Nações, 100 - Centro"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude (GPS)</label>
                <input 
                  type="text" placeholder="-23.5505"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude (GPS)</label>
                <input 
                  type="text" placeholder="-46.6333"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <button 
                 type="submit"
                 className="px-12 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
               >
                 {editingId ? 'Salvar Alterações' : 'Cadastrar Posto'}
               </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.map((station) => (
          <div key={station.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 flex items-center justify-center pt-8 pr-8 opacity-50">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
            </div>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700`}>
                {station.brand || 'Posto Credenciado'}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleEdit(station)} className="text-blue-600 hover:text-blue-800"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                <button onClick={() => onDeleteStation(station.id)} className="text-red-500 hover:text-red-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
              </div>
            </div>
            <h4 className="font-bold text-gray-800 text-lg mb-1">{station.name}</h4>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{station.address}</p>
            {station.latitude && (
              <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/></svg>
                {station.latitude}, {station.longitude}
              </div>
            )}
          </div>
        ))}
      </div>
      {stations.length === 0 && <div className="text-center p-12 text-gray-400 italic">Nenhum posto cadastrado.</div>}
    </div>
  );
};

export default FuelStationManagement;
