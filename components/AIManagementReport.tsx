
import React, { useState, useMemo } from 'react';
import {
    RadialBarChart, RadialBar, ResponsiveContainer,
    XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { getFullManagementReport, AIManagementReportData, AIReportSection } from '../services/geminiService';
import {
    Vehicle, VehicleStatus, Collaborator, FuelLog, MaintenanceLog,
    WashingLog, PPEItem, PPEMovement, Tyre, TyreStatus, OdometerLog,
    HREvent, Equipment, EquipmentMaintenanceLog
} from '../types';

interface AIManagementReportProps {
    vehicles: Vehicle[];
    collaborators: Collaborator[];
    fuelLogs: FuelLog[];
    maintenanceLogs: MaintenanceLog[];
    washingLogs: WashingLog[];
    ppeItems: PPEItem[];
    ppeMovements: PPEMovement[];
    tyres: Tyre[];
    odometerLogs: OdometerLog[];
    hrEvents: HREvent[];
    equipments: Equipment[];
    equipmentLogs: EquipmentMaintenanceLog[];
}

const statusConfig = {
    critical: { label: 'Crítico', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', ring: 'ring-red-500' },
    warning: { label: 'Atenção', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-500' },
    good: { label: 'Bom', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'ring-blue-500' },
    excellent: { label: 'Excelente', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-500' }
};

const severityConfig = {
    high: { label: 'Alto', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z' },
    medium: { label: 'Médio', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z' },
    low: { label: 'Baixo', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', icon: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z' }
};

const ScoreGauge: React.FC<{ score: number; status: string; size?: 'sm' | 'lg' }> = ({ score, status, size = 'sm' }) => {
    const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.good;
    const dim = size === 'lg' ? 'h-40 w-40' : 'h-24 w-24';
    const textSize = size === 'lg' ? 'text-3xl' : 'text-xl';
    return (
        <div className={`relative ${dim} flex items-center justify-center`}>
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="65%"
                    outerRadius="100%"
                    data={[{ value: score, fill: cfg.color }]}
                    startAngle={90}
                    endAngle={-270}
                >
                    <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${textSize} font-black`} style={{ color: cfg.color }}>{score}</span>
                {size === 'lg' && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Score</span>}
            </div>
        </div>
    );
};

const SectionCard: React.FC<{ section: AIReportSection; icon: React.ReactNode }> = ({ section, icon }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = statusConfig[section.status] || statusConfig.good;

    return (
        <div
            className={`bg-white rounded-3xl border ${cfg.border} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
        >
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`w-11 h-11 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                            <div className={cfg.text}>{icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-gray-800 text-sm uppercase tracking-tight">{section.title}</h3>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                    {cfg.label}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{section.summary}</p>
                        </div>
                    </div>
                    <ScoreGauge score={section.score} status={section.status} size="sm" />
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-4 w-full flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors py-2"
                >
                    {expanded ? 'Recolher' : 'Ver Análise Detalhada'}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            </div>

            {expanded && (
                <div className={`border-t ${cfg.border} ${cfg.bg} p-6 space-y-5`}>
                    <div>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${cfg.text} mb-3 flex items-center gap-2`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            Insights da IA
                        </h4>
                        <ul className="space-y-2">
                            {section.insights.map((insight, i) => (
                                <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600 font-medium">
                                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0`} style={{ background: cfg.color }}></span>
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${cfg.text} mb-3 flex items-center gap-2`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="22 4 12 14.01 9 11.01" /><path d="M10 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" /></svg>
                            Recomendações
                        </h4>
                        <ul className="space-y-2">
                            {section.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`${cfg.text} shrink-0 mt-0.5`}><polyline points="20 6 9 17 4 12" /></svg>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

const sectionIcons: Record<string, React.ReactNode> = {
    fleet: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>,
    financial: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    maintenance: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
    humanResources: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>,
    safety: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    operations: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
};

const AIManagementReport: React.FC<AIManagementReportProps> = ({
    vehicles, collaborators, fuelLogs, maintenanceLogs, washingLogs,
    ppeItems, ppeMovements, tyres, odometerLogs, hrEvents, equipments, equipmentLogs
}) => {
    const [report, setReport] = useState<AIManagementReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState(0);

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // ── Construir contexto completo para a IA ──────────────────────────────────
    const context = useMemo(() => {
        const available = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
        const inUse = vehicles.filter(v => v.status === VehicleStatus.IN_USE).length;
        const inMaintenance = vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;

        const fuelCost = fuelLogs.reduce((s, l) => s + l.cost, 0);
        const fuelLiters = fuelLogs.reduce((s, l) => s + l.liters, 0);
        const mainCost = maintenanceLogs.reduce((s, l) => s + l.cost, 0);
        const maintPreventive = maintenanceLogs.filter(l => l.type === 'Preventiva').length;
        const maintCorrective = maintenanceLogs.filter(l => l.type === 'Corretiva').length;
        const washCost = washingLogs.reduce((s, l) => s + l.cost, 0);

        const activeCollabs = collaborators.filter(c => c.status === 'Ativo').length;
        const cnhExpiring = collaborators.filter(c => {
            if (!c.licenseExpiry) return false;
            const exp = new Date(c.licenseExpiry);
            const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 90;
        }).length;

        const birthdays = collaborators.filter(c => {
            if (!c.admissionDate) return false;
            const dob = new Date(c.admissionDate);
            return dob.getMonth() === currentMonth;
        }).length;

        const ppeUnderStock = ppeItems.filter(p => p.currentStock < p.minStock).length;
        const ppeCaExpiring = ppeItems.filter(p => {
            const exp = new Date(p.caExpiryDate);
            const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 60;
        }).length;

        const tyresStock = tyres.filter(t => t.status === TyreStatus.STOCK).length;
        const tyresMounted = tyres.filter(t => t.status === TyreStatus.MOUNTED).length;
        const tyresScrap = tyres.filter(t => t.status === TyreStatus.SCRAP).length;

        const totalTripKm = odometerLogs.reduce((s, l) => s + (l.tripKm || 0), 0);

        const hrThisMonth = hrEvents.filter(e => {
            const d = new Date(e.startDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const equipDown = equipments.filter(e => e.status === 'Parado').length;

        return {
            dataRelatorio: today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            frota: {
                total_veiculos: vehicles.length,
                disponiveis: available,
                em_operacao: inUse,
                em_manutencao: inMaintenance,
                taxa_disponibilidade: vehicles.length > 0 ? (available / vehicles.length) * 100 : 0,
                veiculos_placa: vehicles.map(v => ({ placa: v.plate, modelo: v.model, status: v.status, km: v.km }))
            },
            financeiro: {
                custo_combustivel: fuelCost,
                litros_abastecidos: fuelLiters,
                custo_manutencao: mainCost,
                custo_lavagem: washCost,
                custo_total_opex: fuelCost + mainCost + washCost,
                registros_combustivel: fuelLogs.length,
                km_total_rodado: totalTripKm
            },
            manutencao: {
                total_registros: maintenanceLogs.length,
                preventivas: maintPreventive,
                corretivas: maintCorrective,
                proporcao_preventiva: maintenanceLogs.length > 0 ? Math.round((maintPreventive / maintenanceLogs.length) * 100) : 0,
                custo_medio_por_registro: maintenanceLogs.length > 0 ? Math.round(mainCost / maintenanceLogs.length) : 0
            },
            rh: {
                total_colaboradores: collaborators.length,
                ativos: activeCollabs,
                afastados: collaborators.filter(c => c.status === 'Afastado').length,
                ferias: collaborators.filter(c => c.status === 'Férias').length,
                cnh_vencendo_90_dias: cnhExpiring,
                aniversariantes_mes: birthdays,
                eventos_rh_mes: hrThisMonth
            },
            seguranca: {
                epis_estoque_baixo: ppeUnderStock,
                epis_ca_vencendo: ppeCaExpiring,
                total_epis: ppeItems.length,
                movimentacoes_epi: ppeMovements.length,
                checklists_realizados: 0
            },
            pneus: {
                total: tyres.length,
                em_estoque: tyresStock,
                montados: tyresMounted,
                descarte: tyresScrap
            },
            operacoes: {
                total_lavagens: washingLogs.length,
                registros_odometro: odometerLogs.length,
                km_total_rodado: totalTripKm,
                equipamentos_parados: equipDown,
                total_equipamentos: equipments.length
            }
        };
    }, [vehicles, collaborators, fuelLogs, maintenanceLogs, washingLogs, ppeItems, ppeMovements, tyres, odometerLogs, hrEvents, equipments]);

    // Score radar data for bar chart
    const radarData = useMemo(() => {
        if (!report) return [];
        return (Object.values(report.sections) as AIReportSection[]).map(s => ({
            name: s.title.split(' ')[0],
            score: s.score,
            fill: statusConfig[s.status as keyof typeof statusConfig]?.color || '#3b82f6'
        }));
    }, [report]);

    const loadingMessages = [
        "Coletando dados de todos os módulos...",
        "Processando KPIs financeiros e operacionais...",
        "Analisando padrões de manutenção e frota...",
        "Cruzando métricas de RH e segurança...",
        "Gerando análise estratégica com IA...",
        "Estruturando relatório executivo...",
    ];

    const handleGenerateReport = async () => {
        setLoading(true);
        setLoadingPhase(0);
        const interval = setInterval(() => {
            setLoadingPhase(p => Math.min(p + 1, loadingMessages.length - 1));
        }, 1200);

        try {
            const result = await getFullManagementReport(context);
            setReport(result);
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    };

    // Overall score color
    const overallStatus = report
        ? report.overallScore >= 85 ? 'excellent'
            : report.overallScore >= 70 ? 'good'
                : report.overallScore >= 50 ? 'warning'
                    : 'critical'
        : 'good';

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">

            {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[32px] p-8 shadow-2xl">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full border border-white/5"></div>
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                                <path d="m4.93 4.93 4.24 4.24" />
                                <path d="m14.83 9.17 4.24-4.24" />
                                <path d="m14.83 14.83 4.24 4.24" />
                                <path d="m9.17 14.83-4.24 4.24" />
                                <circle cx="12" cy="12" r="4" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-white tracking-tight">Relatório de Gestão (IA)</h2>
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-full">
                                    Powered by Gemini
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">
                                Análise executiva completa — todos os módulos integrados em tempo real
                            </p>
                            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">
                                Referência: {today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {' · '}{today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Context summary pills */}
                        <div className="hidden lg:flex flex-col gap-2">
                            {[
                                { label: 'Veículos', value: vehicles.length },
                                { label: 'Colaboradores', value: collaborators.length },
                                { label: 'Registros', value: fuelLogs.length + maintenanceLogs.length + washingLogs.length },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}:</span>
                                    <span className="text-sm font-black text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            id="btn-generate-ai-report"
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="group relative flex items-center gap-3 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-black text-sm px-6 py-3.5 rounded-2xl transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:cursor-wait disabled:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                    </svg>
                                    {report ? 'Atualizar Relatório' : 'Gerar Relatório com IA'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Loading progress */}
                {loading && (
                    <div className="relative z-10 mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                            <p className="text-[11px] font-bold text-slate-300">{loadingMessages[loadingPhase]}</p>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-400 to-violet-400 rounded-full transition-all duration-1000"
                                style={{ width: `${((loadingPhase + 1) / loadingMessages.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── SNAPSHOT DE DADOS (sempre visível) ──────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total Frota', value: vehicles.length, icon: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', color: 'blue' },
                    { label: 'Em Operação', value: vehicles.filter(v => v.status === VehicleStatus.IN_USE).length, icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', color: 'emerald' },
                    { label: 'Manutenção', value: vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length, icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', color: 'amber' },
                    { label: 'Colaboradores', value: collaborators.filter(c => c.status === 'Ativo').length, icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', color: 'violet' },
                    { label: 'OPEX Total', value: `R$${((fuelLogs.reduce((s, l) => s + l.cost, 0) + maintenanceLogs.reduce((s, l) => s + l.cost, 0)) / 1000).toFixed(0)}k`, icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', color: 'red' },
                    { label: 'Pneus', value: tyres.length, icon: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', color: 'slate' },
                ].map((card, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                        <div className={`w-9 h-9 rounded-xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-500 mb-3`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={card.icon} /></svg>
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                        <p className="text-xl font-black text-gray-800 mt-0.5">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* ── RELATÓRIO IA ────────────────────────────────────────────────────── */}
            {!report && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">Pronto para Análise</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                        Clique em <strong>"Gerar Relatório com IA"</strong> para que o Gemini analise todos os dados do sistema e gere um relatório executivo completo com insights estratégicos e recomendações.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        {['Frota', 'Financeiro', 'RH', 'Manutenção', 'Segurança', 'Operações'].map((m, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>{m}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {report && (
                <>
                    {/* ── SCORE GERAL + SUMÁRIO EXECUTIVO ──────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Score geral */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Score Geral do Sistema</p>
                            <ScoreGauge score={report.overallScore} status={overallStatus} size="lg" />
                            <div className="mt-6 space-y-1">
                                <span className={`text-sm font-black uppercase tracking-widest ${statusConfig[overallStatus].text}`}>
                                    {statusConfig[overallStatus].label}
                                </span>
                                <p className="text-[10px] text-gray-400 font-bold">
                                    Gerado em {new Date(report.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        {/* Sumário executivo */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Briefing Executivo</p>
                                        <p className="text-[9px] text-slate-500 font-bold">Análise gerada por Inteligência Artificial</p>
                                    </div>
                                </div>
                                <p className="text-white text-base font-medium leading-relaxed">
                                    "{report.executiveSummary}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── SCORES POR MÓDULO (gráfico de barras) ────────────────────── */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-gray-800 uppercase tracking-tight">Desempenho por Módulo</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Score de 0 a 100 por área</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {(['critical', 'warning', 'good', 'excellent'] as const).map(s => (
                                    <div key={s} className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ background: statusConfig[s].color }}></span>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">{statusConfig[s].label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={radarData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '800', fill: '#94a3b8', textTransform: 'uppercase' }} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                                        formatter={(val: any) => [`${val}/100`, 'Score']}
                                        labelStyle={{ fontWeight: '900', fontSize: '12px', color: '#1e293b', textTransform: 'uppercase' }}
                                    />
                                    <Bar dataKey="score" radius={[10, 10, 0, 0]}>
                                        {radarData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── ALERTAS PRINCIPAIS ────────────────────────────────────────── */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-black text-gray-800 uppercase tracking-tight">Alertas Identificados</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pontos críticos detectados pela IA</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {report.topAlerts.map((alert, i) => {
                                const cfg = severityConfig[alert.severity];
                                return (
                                    <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${cfg.bg}`} style={{ borderColor: `${cfg.color}30` }}>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg.color}15` }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5">
                                                <path d={cfg.icon} />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase">{alert.module}</span>
                                            </div>
                                            <p className={`text-sm font-semibold ${cfg.text}`}>{alert.message}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── GRID DE SEÇÕES ────────────────────────────────────────────── */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
                                    <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
                                    <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-black text-gray-800 uppercase tracking-tight">Análise por Módulo</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Clique em cada seção para ver insights e recomendações</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {(Object.entries(report.sections) as [string, AIReportSection][]).map(([key, section]) => (
                                <SectionCard key={key} section={section} icon={sectionIcons[key]} />
                            ))}
                        </div>
                    </div>

                    {/* ── OPORTUNIDADES ESTRATÉGICAS ────────────────────────────────── */}
                    <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl"></div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase tracking-tight">Oportunidades Estratégicas</h3>
                                    <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">Identificadas pela análise de IA</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {report.strategicOpportunities.map((opp, i) => (
                                    <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/15 transition-colors">
                                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-sm mb-3">
                                            {i + 1}
                                        </div>
                                        <p className="text-white text-sm font-semibold leading-relaxed">{opp}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── RODAPÉ DO RELATÓRIO ───────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><circle cx="12" cy="12" r="4" /></svg>
                            Relatório gerado por Google Gemini AI · FrotaControl Torre de Controle
                        </div>
                        <button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
                            </svg>
                            Atualizar
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIManagementReport;
