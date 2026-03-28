import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend, RadialBarChart, RadialBar
} from 'recharts';
import {
  Vehicle, VehicleStatus, Unit, FuelLog, MaintenanceLog, WashingLog,
  Collaborator, PPEItem, Tyre, ChecklistSession, PPEMovement
} from '../types';

interface DashboardProps {
  vehicles: Vehicle[];
  units: Unit[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  washingLogs: WashingLog[];
  collaborators?: Collaborator[];
  ppeItems?: PPEItem[];
  tyres?: Tyre[];
  checklistSessions?: ChecklistSession[];
  ppeMovements?: PPEMovement[];
}
const Dashboard: React.FC<DashboardProps> = ({
  vehicles, units, fuelLogs, maintenanceLogs, washingLogs,
  collaborators = [], ppeItems = [], tyres = [], checklistSessions = [],
  ppeMovements = []
}) => {

  const analytics = useMemo(() => {
    // Cálculos Operacionais
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
    const inMaintenance = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
    const inUse = vehicles.filter(v => v.status === VehicleStatus.IN_USE).length;

    const availabilityRate = totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0;

    // Cálculos Financeiros (Últimos registros)
    const fuelCost = (fuelLogs || []).reduce((acc, log) => acc + (Number(log.cost) || 0), 0);
    const maintenanceCost = (maintenanceLogs || []).reduce((acc, log) => acc + (Number(log.cost) || 0), 0);
    const washingCost = (washingLogs || []).reduce((acc, log) => acc + (Number(log.cost) || 0), 0);
    const tyreCost = (tyres || []).reduce((acc, t) => acc + (Number(t.unitValue) || 0), 0);
    const ppeCost = (ppeMovements || [])
      .filter(m => m.type === 'Saída')
      .reduce((acc, m) => acc + (Number(m.totalValue) || (Number(m.quantity) * (Number(m.unitValue) || 0))), 0);

    const totalCost = fuelCost + maintenanceCost + washingCost + tyreCost + ppeCost;

    const statusData = [
      { name: 'Disponível', value: availableVehicles, fill: '#e3222a' },
      { name: 'Em Operação', value: inUse, fill: '#a24246' },
      { name: 'Manutenção', value: inMaintenance, fill: '#bf8b94' }
    ];

    const costDistribution = [
      { name: 'Combustível', value: fuelCost, fill: '#e3222a' },
      { name: 'Manutenção', value: maintenanceCost, fill: '#bf8b94' },
      { name: 'Pneus', value: tyreCost, fill: '#334155' },
      { name: 'Lavagem', value: washingCost, fill: '#0ea5e9' },
      { name: 'EPIs', value: ppeCost, fill: '#f59e0b' }
    ];

    const laborCost = (maintenanceLogs || [])
      .filter(log => log.description?.toLowerCase().includes('mao de obra') || log.description?.toLowerCase().includes('mão de obra'))
      .reduce((acc, log) => acc + (Number(log.cost) || 0), 0);

    const vehicleExpenses: Record<string, number> = {};

    fuelLogs.forEach(log => {
      const cost = Number(log.cost) || 0;
      vehicleExpenses[log.vehicleId] = (vehicleExpenses[log.vehicleId] || 0) + cost;
    });

    maintenanceLogs.forEach(log => {
      const cost = Number(log.cost) || 0;
      vehicleExpenses[log.vehicleId] = (vehicleExpenses[log.vehicleId] || 0) + cost;
    });

    washingLogs.forEach(log => {
      const cost = Number(log.cost) || 0;
      vehicleExpenses[log.vehicleId] = (vehicleExpenses[log.vehicleId] || 0) + cost;
    });

    const topExpenses = Object.entries(vehicleExpenses)
      .map(([vehicleId, total]) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return { plate: vehicle ? vehicle.plate : 'Desconhecida', total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Histórico de Custos por Mês (Dinâmico)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        costs: 0
      };
    }).reverse();

    fuelLogs.forEach(log => {
      const logDate = new Date(log.date);
      const monthIdx = last6Months.findIndex(m => m.monthNum === logDate.getMonth() && m.year === logDate.getFullYear());
      if (monthIdx !== -1) {
        last6Months[monthIdx].costs += Number(log.cost) || 0;
      }
    });

    maintenanceLogs.forEach(log => {
      const logDate = new Date(log.date);
      const monthIdx = last6Months.findIndex(m => m.monthNum === logDate.getMonth() && m.year === logDate.getFullYear());
      if (monthIdx !== -1) {
        last6Months[monthIdx].costs += Number(log.cost) || 0;
      }
    });

    washingLogs.forEach(log => {
      const logDate = new Date(log.date);
      const monthIdx = last6Months.findIndex(m => m.monthNum === logDate.getMonth() && m.year === logDate.getFullYear());
      if (monthIdx !== -1) {
        last6Months[monthIdx].costs += Number(log.cost) || 0;
      }
    });

    const trendData = last6Months;

    // Cálculo de Conformidade de Checklists
    let totalItems = 0;
    let okItems = 0;
    checklistSessions.forEach(session => {
      session.items.forEach(item => {
        totalItems++;
        if (item.status === 'OK') okItems++;
      });
    });
    const checklistCompliance = totalItems > 0 ? Math.round((okItems / totalItems) * 100) : 100;

    return {
      totalVehicles,
      availabilityRate,
      totalCost,
      statusData,
      costDistribution,
      trendData,
      inUse,
      inMaintenance,
      laborCost,
      topExpenses,
      checklistCompliance,
      washingCost,
      tyreCost,
      ppeCost,
      ppeUsageCount: (ppeMovements || []).filter(m => m.type === 'Saída').length
    };
  }, [vehicles, fuelLogs, maintenanceLogs, checklistSessions, tyres, ppeMovements, washingLogs]);

  // Formatar valores monetários de forma compacta
  const fmtCurrency = (val: any): string => {
    const n = Number(val) || 0;
    if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
    if (n >= 1_000) return `R$ ${(n / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`;
    return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">

      {/* SEÇÃO 0: BRANDING / LOGO DA EMPRESA */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between overflow-hidden relative">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-cca-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-cca-primary/20">
            CCA
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Grupo CCA - Logística & Transportes</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Portal de Gestão de Frota e Torre de Controle</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end text-right pr-4">
          <span className="text-[10px] font-black text-cca-primary uppercase tracking-widest bg-cca-primary/5 px-3 py-1 rounded-full">Operação Oficial</span>
          <p className="text-[9px] text-gray-300 font-bold mt-2 uppercase">Unidade de Controle Central v3.0</p>
        </div>
        {/* Decorativo de fundo suave */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cca-light to-transparent -z-10"></div>
      </div>

      {/* SEÇÃO 1: CABEÇALHO E RELATÓRIO / RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col justify-center h-full">
          <h3 className="text-xl font-black text-gray-800 tracking-tight mb-2">Top 10 Maiores Gastos 📊</h3>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Custos Operacionais por Placa (Combustível + Manutenção)</p>
          <div className="overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Rank</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Placa</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topExpenses.map((expense, idx) => (
                  <tr key={expense.plate} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-bold text-gray-500 text-xs w-10">#{idx + 1}</td>
                    <td className="py-2.5 font-black text-blue-600 text-xs">{expense.plate}</td>
                    <td className="py-2.5 font-black text-gray-800 text-xs text-right">
                      {expense.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))}
                {analytics.topExpenses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-xs text-gray-400">Sem dados suficientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-blue-50 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-4 z-10">Disponibilidade Real</span>
          <div className="h-44 w-44 z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: 'Disp.', value: analytics.availabilityRate, fill: '#e3222a' }]} startAngle={90} endAngle={450}>
                <RadialBar background dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center z-10">
            <p className="text-3xl font-black text-gray-800">{analytics.availabilityRate.toFixed(1)}%</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Prontos para operação</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {(() => {
          const cards = [
            { label: 'Frota', value: `${analytics.totalVehicles}`, sub: 'Ativos', color: 'slate', icon: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', shadow: 'shadow-slate-100' },
            { label: 'OPEX Total', value: fmtCurrency(analytics.totalCost), sub: 'Geral', color: 'cca-primary', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', shadow: 'shadow-red-50' },
            { label: 'Pneus', value: fmtCurrency(analytics.tyreCost), sub: 'Gestão Ativa', color: 'slate', icon: 'M12 2a10 10 0 1 1-10 10A10 10 0 0 1 12 2zm0 4a6 6 0 1 0 6 6 6 6 0 0 0-6-6z', shadow: 'shadow-slate-100' },
            { label: 'EPIs', value: fmtCurrency(analytics.ppeCost), sub2: `${analytics.ppeUsageCount} entregas`, sub: 'Consumo Real', color: 'amber', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', shadow: 'shadow-amber-50' },
            { label: 'Lavagem', value: fmtCurrency(analytics.washingCost), sub2: `${washingLogs.length} ordens`, sub: 'Serviços', color: 'sky', icon: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z', shadow: 'shadow-sky-50' },
            { label: 'Conformidade', value: `${analytics.checklistCompliance}%`, sub: 'Checklists', color: 'emerald', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14', shadow: 'shadow-emerald-50' },
            { label: 'Mão de Obra', value: fmtCurrency(analytics.laborCost), sub: 'Serviços', color: 'indigo', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', shadow: 'shadow-indigo-50' },
            { label: 'Em Uso', value: `${analytics.inUse}`, sub: 'Operando', color: 'blue', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', shadow: 'shadow-blue-50' },
          ];

          return cards.map((card: any, idx: number) => (
            <div key={idx} className={`bg-white p-4 rounded-[28px] border border-gray-50 flex flex-col justify-between hover:scale-[1.02] transition-all hover:border-${card.color}-200 ${card.shadow} group min-h-[120px]`}>
              <div className={`w-9 h-9 rounded-xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600 mb-3 group-hover:rotate-6 transition-transform flex-shrink-0`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={card.icon} /></svg>
              </div>
              <div className="min-w-0">
                <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest leading-none mb-1 truncate">{card.label}</p>
                <h4 className={`font-black text-gray-800 leading-tight ${card.value.length > 8 ? 'text-xs' : 'text-sm'} break-words`} title={card.value}>{card.value}</h4>
                {card.sub2 && (
                  <p className="text-[9px] font-bold text-gray-500 mt-0.5 truncate">{card.sub2}</p>
                )}
                <p className={`text-[8px] font-bold uppercase mt-1 text-${card.color}-500/70 truncate`}>{card.sub}</p>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* SEÇÃO 3: GRÁFICOS DE TENDÊNCIA E COMPOSIÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Tendência Mensal */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">Performance Mensal</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Correlação entre KM e Custos</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-[9px] font-black text-gray-500 uppercase">Custos</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.trendData}>
                <defs>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e3222a" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#e3222a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  tickFormatter={(val) => fmtCurrency(val)}
                />
                <Tooltip
                  formatter={(val: number) => [val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Custo']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="costs" stroke="#e3222a" strokeWidth={4} fillOpacity={1} fill="url(#colorCosts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráficos de Composição e Saúde */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center">
            <h4 className="text-sm font-black text-gray-800 uppercase mb-6 tracking-widest w-full">Mix de Despesas</h4>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.costDistribution}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {analytics.costDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {analytics.costDistribution.map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase">{item.name}</p>
                  <p className="text-sm font-black text-gray-800">{fmtCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h4 className="text-sm font-black text-gray-800 uppercase mb-6 tracking-widest">Status dos Ativos</h4>
            <div className="space-y-6">
              {analytics.statusData.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase">{item.name}</span>
                    <span className="text-xs font-black text-gray-800">{item.value} unid.</span>
                  </div>
                  <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(item.value / analytics.totalVehicles) * 100}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-50">
                <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">
                  Manutenção Preventiva reduz o TCO (Custo Total de Propriedade) em média 18%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
