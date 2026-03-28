
import React, { useState } from 'react';
import { Team, Unit, Collaborator, Attendance, AttendanceStatus, HREvent, StaffFunction, TeamRoleValue, Carga } from '../types';
import { getTodayLocalDate, formatSafeDate } from '../services/dateUtils';

interface TeamRegistryProps {
  teams: Team[];
  units: Unit[];
  collaborators: Collaborator[];
  attendance: Attendance[];
  onAddTeam: (team: Omit<Team, 'id'>) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
  onDeleteAllTeams: () => void;
  onUpdateAttendance: (attendance: Attendance) => void;
  onDeleteAttendance: (id: string) => void;
  onUpdateCollaborator: (collaborator: Collaborator) => void;
  onAddHREvent: (event: Omit<HREvent, 'id'>) => void;
  roleValues: TeamRoleValue[];
  userRole: string;
  cargas?: Carga[];
}

const TeamRegistry = ({ 
  teams = [], units = [], collaborators = [], attendance = [], 
  onAddTeam, onUpdateTeam, onDeleteTeam, onDeleteAllTeams, onUpdateAttendance,
  onDeleteAttendance, onUpdateCollaborator, onAddHREvent, roleValues = [], userRole, cargas = []
}: TeamRegistryProps) => {
  const [showForm, setShowForm] = useState(false);

  // Helper para formatar data sem erro de fuso horário
  const formatDisplayDateLocal = (dateStr: string) => {
    return formatSafeDate(dateStr);
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getRoleBadge = (role: StaffFunction | string | undefined | null) => {
    switch(role) {
      case 'Motorista': return 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50';
      case 'Apanhador': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50';
      case 'Batedor': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-50';
      case 'Encarregado': return 'bg-purple-50 text-purple-600 border-purple-100 shadow-sm shadow-purple-50';
      case 'Supervisor': return 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm shadow-indigo-50';
      case 'Gerente': return 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-50';
      default: return 'bg-gray-100 text-gray-500 border-gray-200 shadow-sm shadow-gray-100';
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Team, 'id'>>({
    name: '',
    number: '',
    unitId: '',
    status: 'Ativa',
    targetStaff: {}
  });
  const [newStaffEntry, setNewStaffEntry] = useState({ role: '', meta: 0, salary: 0 });

  const [maximizedTeamId, setMaximizedTeamId] = useState<string | null>(null);
  const [activeCardTabs, setActiveCardTabs] = useState<Record<string, 'info' | 'chamada' | 'historico'>>({});
  const [rollCallDate, setRollCallDate] = useState(getTodayLocalDate());

  // Estados de filtro
  const [searchTeam, setSearchTeam] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [filterUnitId, setFilterUnitId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [roleChangeData, setRoleChangeData] = useState<{
    collaboratorId: string;
    newName: string;
    currentRole: string;
    newRole: string;
    changeDate: string;
  } | null>(null);

  const handleRoleChangeSubmit = () => {
    if (!roleChangeData) return;
    const coll = (collaborators || []).find((c: any) => String(c.id) === String(roleChangeData.collaboratorId));
    if (!coll) return;

    // Atualizar registro do colaborador
    onUpdateCollaborator({
      ...coll,
      role: roleChangeData.newRole as StaffFunction,
      funcao: roleChangeData.newRole
    });

    // Registrar evento de RH
    onAddHREvent({
      collaboratorId: coll.id,
      type: 'Alteração de Função',
      startDate: roleChangeData.changeDate,
      description: `Alteração de função: de ${roleChangeData.currentRole} para ${roleChangeData.newRole}`,
      responsible: 'Sistema / Gestão de Equipes',
      createdAt: getTodayLocalDate()
    });

    setRoleChangeData(null);
    alert('Função atualizada e registrada no histórico de RH com sucesso!');
  };

  const [historyFilter, setHistoryFilter] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toLocaleDateString('en-CA'), 
    end: getTodayLocalDate() 
  });

  const [diaristaPrompt, setDiaristaPrompt] = useState<{
    collaboratorId: string;
    teamId: string;
    status: AttendanceStatus;
  } | null>(null);
  
  const [diaristaNameInput, setDiaristaNameInput] = useState('');
  
  // Estados para Atestado
  const [certificateFile, setCertificateFile] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleUpdateStatus = (collaboratorId: string, teamId: string, status: AttendanceStatus, replacedByDiarista?: boolean, diaristaName?: string, certificateUrl?: string) => {
    // Buscar equipe para calcular meta
    const team = (teams || []).find(t => String(t.id) === String(teamId) || String(t.number) === String(teamId));
    
    // Meta robusta (Aceita objeto {meta, salary} ou apenas o número legado)
    const metaTotal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
      const valorMeta = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
      return acc + valorMeta;
    }, 0);
    
    // Calcular presenças atuais hoje (Excluindo o colaborador atual para ver se precisamos de substituição ou se já estourou)
    const presencaHojeSemAtual = (attendance || []).filter(a => 
      (String(a.teamId) === String(team?.id) || String(a.teamId) === String(team?.number)) && 
      (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate &&
      (a.status === 'Presente' || a.replacedByDiarista === true) &&
      String(a.collaboratorId) !== String(collaboratorId)
    ).length;



    // Lógica de DIARISTA baseada no SALDO (Total - Ausências)
    if (['Falta', 'Atestado', 'Folga'].includes(status) && replacedByDiarista === undefined) {
      const activeTeamMembersCount = (collaborators || []).filter(c => 
        (String(c.teamId) === String(team?.id) || String(c.teamId) === String(team?.number)) && 
        c.status === 'Ativo'
      ).length;

      const currentAbsences = (attendance || []).filter(a => 
        (String(a.teamId) === String(team?.id) || String(a.teamId) === String(team?.number)) && 
        (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate &&
        ['Falta', 'Atestado', 'Folga'].includes(a.status) &&
        String(a.collaboratorId) !== String(collaboratorId)
      ).length;

      const newSaldo = activeTeamMembersCount - (currentAbsences + 1);

      if (newSaldo < metaTotal && metaTotal > 0) {
        setDiaristaPrompt({ collaboratorId, teamId, status });
        return;
      } else if (metaTotal > 0) {
        alert("Equipe completa. Consulte a Gerência para validação.");
      }
      // Se saldo for suficiente ou metaTotal for 0, segue para registrar a falta sem popup
    }

    const existingRecord = (attendance || []).find(a => 
      String(a.collaboratorId) === String(collaboratorId) && 
      (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate
    );

    const newRecord: Attendance = {
      id: existingRecord?.id || crypto.randomUUID(),
      collaboratorId,
      teamId,
      date: rollCallDate,
      status,
      recordedBy: 'Sistema',
      replacedByDiarista,
      diaristaName,
      certificateUrl: certificateUrl || certificateFile || undefined,
      certificateType: certificateFile ? (certificateFile.startsWith('data:image') ? 'photo' : 'file') : undefined,
      isExtra: false,
      createdAt: existingRecord?.createdAt || getTodayLocalDate()
    };
    onUpdateAttendance(newRecord);
    setDiaristaPrompt(null);
    setDiaristaNameInput('');
    setCertificateFile(null);
    setIsCapturingPhoto(false);
  };

  const startCamera = async () => {
    setIsCapturingPhoto(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Câmera não disponível ou permissão negada.");
      setIsCapturingPhoto(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsCapturingPhoto(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCertificateFile(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificateFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportExcel = (team: any, filteredAttendance: any[]) => {
    const headers = ['Data', 'Colaborador', 'Função', 'Nº Cargas', 'Valor p/ Carga', 'Valor Total', 'Status'];
    const rows = filteredAttendance
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map(a => {
        const m = (collaborators || []).find(c => String(c.id) === String(a.collaboratorId));
        const role = m?.role || m?.funcao || '';
        const aDateStr = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
        const teamCargas = (cargas || []).filter(c => 
          (String(c.teamId).trim() === String(team.id).trim() || String(c.teamId).trim() === String(team.number).trim()) && 
          (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === aDateStr
        );
        const totalCargasCount = teamCargas.reduce((acc, curr) => acc + (curr.cargasCount || 0), 0);
        const roleValDef = roleValues.find(rv => rv.role?.toLowerCase() === role?.toLowerCase() && rv.active);
        const valorCarga = roleValDef ? (roleValDef.loadValue || 0) : 0;
        
        // Regra de Meta da Equipe Unificada
        const teamMetaTotal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
          const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
          return acc + v;
        }, 0);
        
        const dayPresence = new Set((attendance || [])
          .filter(at => 
            (String(at.teamId).trim() === String(team.id).trim() || String(at.teamId).trim() === String(team.number).trim()) && 
            (at.date?.includes('T') ? at.date.split('T')[0] : at.date) === aDateStr &&
            (at.status === 'Presente' || at.replacedByDiarista === true)
          )
          .map(at => at.collaboratorId)
        ).size;

        const isBelowMeta = teamMetaTotal > 0 && dayPresence < teamMetaTotal;
        const isPayable = (a.status === 'Presente' || a.replacedByDiarista === true);
        const valorTotal = isPayable ? totalCargasCount * valorCarga : 0;
        
        return [
          formatSafeDate(a.date),
          (m?.name || '---').toUpperCase(),
          (role || '---').toString().toUpperCase(),
          totalCargasCount.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
          valorCarga.toFixed(2),
          valorTotal.toFixed(2),
          `${a.status}${a.replacedByDiarista ? ` (DIARISTA: ${a.diaristaName})` : ''}`
        ];
      });

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico_frequencia_${team.number}_${historyFilter.start}_${historyFilter.end}.csv`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExportPDF = (team: any, filteredAttendance: any[]) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("O seu navegador bloqueou a janela de exportação. Por favor, autorize popups para este site.");
        return;
      }

      if (filteredAttendance.length === 0) {
        alert("Não há registros no período selecionado para exportar.");
        printWindow.close();
        return;
      }

    let totalPeriodo = 0;

    const rowsHtml = filteredAttendance
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map(a => {
        const m = (collaborators || []).find(c => String(c.id) === String(a.collaboratorId));
        const role = m?.role || m?.funcao || '';
        const aDateStr = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
        const teamCargas = (cargas || []).filter(c => 
          (String(c.teamId).trim() === String(team.id).trim() || String(c.teamId).trim() === String(team.number).trim()) && 
          (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === aDateStr
        );
        const totalCargasCount = teamCargas.reduce((acc, curr) => acc + (curr.cargasCount || 0), 0);
        const roleValDef = roleValues.find(rv => rv.role?.toLowerCase() === role?.toLowerCase() && rv.active);
        const valorCarga = roleValDef ? (roleValDef.loadValue || 0) : 0;
        
        // Regra de Meta
        const teamMetaTotal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
          const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
          return acc + v;
        }, 0);
        
        const dayPresence = new Set((attendance || [])
          .filter(at => 
            (String(at.teamId).trim() === String(team.id).trim() || String(at.teamId).trim() === String(team.number).trim()) && 
            (at.date?.includes('T') ? at.date.split('T')[0] : at.date) === aDateStr &&
            (at.status === 'Presente' || at.replacedByDiarista === true)
          )
          .map(at => at.collaboratorId)
        ).size;

        const isBelowMeta = teamMetaTotal > 0 && dayPresence < teamMetaTotal;
        const isPayable = (a.status === 'Presente' || a.replacedByDiarista === true);
        const valorTotal = isPayable ? totalCargasCount * valorCarga : 0;
        
        totalPeriodo += valorTotal;

        return `
          <tr>
            <td>${formatSafeDate(a.date)}</td>
            <td>${(m?.name || '---').toUpperCase()}</td>
            <td>${(role || '---').toString().toUpperCase()}</td>
            <td style="text-align: center;">${totalCargasCount.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
            <td style="text-align: right;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCarga)}</td>
            <td style="text-align: right;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}</td>
            <td>${a.status}${a.replacedByDiarista ? `<br><small>(Diarista: ${a.diaristaName})</small>` : ''}</td>
          </tr>
        `;
      }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Frequência - Equipe ${team.number}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #1e1b4b; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
            .sub-header { color: #64748b; font-size: 12px; font-weight: bold; margin-top: 5px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; font-size: 9px; }
            th { background-color: #f8fafc; color: #475569; font-weight: 900; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .total-box { margin-top: 40px; text-align: right; padding: 25px; background: #1e1b4b; border-radius: 20px; color: white; }
            .total-label { font-size: 10px; font-weight: 900; color: #818cf8; text-transform: uppercase; letter-spacing: 1px; }
            .total-value { font-size: 24px; font-weight: 900; margin-top: 5px; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Frequência</h1>
            <div class="sub-header">Equipe: ${team.name} (${team.number}) | Período: ${formatSafeDate(historyFilter.start)} até ${formatSafeDate(historyFilter.end)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Colaborador</th>
                <th>Função</th>
                <th style="text-align: center;">Nº Cargas</th>
                <th style="text-align: right;">Valor Carga</th>
                <th style="text-align: right;">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="total-box">
            <div class="total-label">Investimento Total no Período</div>
            <div class="total-value">${formatCurrency(totalPeriodo)}</div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    } catch (error) {
       console.error("Erro ao exportar PDF:", error);
       alert("Ocorreu um erro inesperado ao gerar o PDF.");
    }
  };

  const handleExportMembersExcel = (team: any, members: any[]) => {
    const headers = ['Equipe', 'Colaborador', 'Função'];
    const rows = members
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map(m => [
        team.number,
        (m.name || '---').toUpperCase(),
        (m.role || m.funcao || '---').toString().toUpperCase()
      ]);

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `membros_vinculados_${team.number}.csv`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExportMembersPDF = (team: any, members: any[]) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("O seu navegador bloqueou a janela de exportação. Por favor, autorize popups para este site.");
        return;
      }

      if (members.length === 0) {
        alert("Não há membros vinculados para exportar.");
        printWindow.close();
        return;
      }

      const rowsHtml = members
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .map(m => `
          <tr>
            <td>${(m.name || '---').toUpperCase()}</td>
            <td>${(m.role || m.funcao || '---').toString().toUpperCase()}</td>
          </tr>
        `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório de Membros - Equipe ${team.number}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
              .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { color: #1e1b4b; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
              .sub-header { color: #64748b; font-size: 12px; font-weight: bold; margin-top: 5px; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; font-size: 10px; }
              th { background-color: #f8fafc; color: #475569; font-weight: 900; text-transform: uppercase; }
              tr:nth-child(even) { background-color: #f8fafc; }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Membros Vinculados</h1>
              <div class="sub-header">Equipe: ${team.name} (${team.number}) | Total: ${members.length} Colaboradores</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Função</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <script>
              window.onload = () => { setTimeout(() => { window.print(); }, 500); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Ocorreu um erro inesperado ao gerar o PDF.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.number || !formData.unitId) {
      alert("Por favor, preencha o Nome, Número da Equipe e a Unidade vinculada.");
      return;
    }

    if (editingId) {
      onUpdateTeam({ id: editingId, ...formData });
    } else {
      onAddTeam(formData);
    }

    handleCancel();
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setFormData({
      name: team.name,
      number: team.number,
      unitId: team.unitId,
      status: team.status,
      targetStaff: team.targetStaff || {}
    });
    setShowForm(true);
    setMaximizedTeamId(null); // Fecha o modal se estiver aberto
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola até o formulário
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', number: '', unitId: '', status: 'Ativa', targetStaff: {} });
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Cadastro de Equipes</h3>
          <p className="text-sm text-gray-500 font-medium">Definição de números de equipe e vínculo com unidades operacionais.</p>
        </div>
        <div className="flex gap-2">
          {teams.length > 0 && !showForm && userRole === 'Administrador' && (
            <button
              onClick={() => {
                if (window.confirm("ATENÇÃO: Deseja realmente excluir TODAS as equipes cadastradas? Esta ação não pode ser desfeita.")) {
                  onDeleteAllTeams();
                }
              }}
              className="px-6 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-all font-black text-xs uppercase tracking-widest border border-red-100"
            >
              Limpar Tudo
            </button>
          )}
          <button
            onClick={() => showForm ? handleCancel() : setShowForm(true)}
            className={`px-6 py-3 rounded-2xl shadow-lg transition-all font-black text-xs uppercase tracking-widest ${showForm ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
              }`}
          >
            {showForm ? 'Cancelar' : 'Nova Equipe'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-indigo-50 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome da Equipe *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                  placeholder="Ex: Equipe de Manutenção Noturna"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Número/ID Equipe *</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-600"
                  placeholder="Ex: EQ-001"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Unidade / Centro de Custo *</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-gray-700"
                >
                  <option value="">Selecione a Unidade...</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Status Operacional</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-gray-700"
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Inativa">Inativa</option>
                </select>
              </div>
            </div>
            
            <div className="bg-indigo-50/30 p-8 rounded-[32px] border border-indigo-100/50">
               <h5 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Configuração do Quadro Operacional (Definir Metas)
               </h5>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Formulário de Adição */}
                  <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Adicionar Cargo ao Quadro</p>
                        <label className="block text-[9px] font-black text-indigo-400 uppercase mb-1 ml-1">Cargo / Função</label>
                        <datalist id="roles-suggestion">
                           {['Motorista', 'Apanhador', 'Batedor', 'Encarregado', 'Gerente', 'Supervisor', 'Auxiliar'].map(r => <option key={r} value={r} />)}
                        </datalist>
                        <input
                           type="text"
                           list="roles-suggestion"
                           value={newStaffEntry.role}
                           onChange={(e) => setNewStaffEntry({ ...newStaffEntry, role: e.target.value })}
                           className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 uppercase text-xs"
                           placeholder="DIGITE O CARGO..."
                        />
                     </div>
                     <div>
                        <label className="block text-[9px] font-black text-indigo-400 uppercase mb-1 ml-1">Meta (Quantidade)</label>
                        <input
                           type="number"
                           min="0"
                           value={newStaffEntry.meta || ''}
                           onChange={(e) => setNewStaffEntry({ ...newStaffEntry, meta: parseInt(e.target.value) || 0 })}
                           className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-600"
                           placeholder="0"
                        />
                     </div>
                     <div>
                        <label className="block text-[9px] font-black text-indigo-400 uppercase mb-1 ml-1">Remuneração (R$)</label>
                        <input
                           type="number"
                           step="0.01"
                           min="0"
                           value={newStaffEntry.salary || ''}
                           onChange={(e) => setNewStaffEntry({ ...newStaffEntry, salary: parseFloat(e.target.value) || 0 })}
                           className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-emerald-600"
                           placeholder="0,00"
                        />
                     </div>
                     <button
                        type="button"
                        onClick={() => {
                           if (!newStaffEntry.role) {
                             alert("Digite o nome do cargo");
                             return;
                           }
                           setFormData({
                              ...formData,
                              targetStaff: {
                                 ...(formData.targetStaff || {}),
                                 [newStaffEntry.role]: {
                                    meta: newStaffEntry.meta,
                                    salary: newStaffEntry.salary
                                 }
                              }
                           });
                           setNewStaffEntry({ role: '', meta: 0, salary: 0 });
                        }}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                     >
                        Confirmar Cargo e Meta
                     </button>
                  </div>

                  {/* Listagem do Quadro */}
                  <div className="lg:col-span-2 space-y-3">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Cargos e Metas Definidos</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(formData.targetStaff || {}).map(([role, val]) => {
                           const meta = typeof val === 'object' && val !== null ? (val as any).meta : val;
                           const salary = typeof val === 'object' && val !== null ? (val as any).salary : 0;
                           return (
                           <div key={role} className="bg-white p-4 rounded-2xl border border-indigo-50 flex items-center justify-between group shadow-sm hover:border-indigo-200 transition-colors">
                              <div className="flex-1">
                                 <p className="text-[10px] font-black text-gray-700 uppercase">{role}</p>
                                 <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-1">
                                       <span className="text-[9px] font-bold text-indigo-500 uppercase">Meta:</span>
                                       <span className="text-xs font-black text-indigo-700">{meta}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <span className="text-[9px] font-bold text-emerald-500 uppercase">Remuneração:</span>
                                       <span className="text-xs font-black text-emerald-700">{formatCurrency(salary)}</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex gap-1 group-hover:opacity-100 transition-all">
                                 <button
                                    type="button"
                                    onClick={() => setNewStaffEntry({ role, meta, salary })}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                 >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => {
                                       const updated = { ...(formData.targetStaff || {}) };
                                       delete updated[role];
                                       setFormData({ ...formData, targetStaff: updated });
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                 >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                                 </button>
                              </div>
                           </div>
                        );})}
                        {Object.keys(formData.targetStaff || {}).length === 0 && (
                           <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 italic text-xs">
                              Nenhuma meta definida para esta equipe.
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-50">
               {editingId && (formData.status === 'Ativa' || formData.status === 'Ativo') && (['Administrador', 'Gerente', 'Operador'].includes(userRole)) && (
                 <button
                   type="button"
                   onClick={() => {
                     if (window.confirm(`Deseja realmente inativar a equipe ${formData.name}?`)) {
                       onUpdateTeam({ ...teams.find(t => t.id === editingId)!, status: 'Inativa' });
                       handleCancel();
                     }
                   }}
                   className="px-8 py-5 bg-red-50 text-red-600 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
                 >
                   Inativar Equipe Agora
                 </button>
               )}
               <button
                 type="submit"
                 className="px-16 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl shadow-indigo-100 ml-auto"
               >
                 {editingId ? 'Salvar Alterações' : 'Cadastrar Equipe'}
               </button>
             </div>
          </form>
        </div>
      )}

      {/* Barra de Filtros */}
      {!showForm && teams.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          {/* Busca por nome ou número */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou NÂº da equipe..."
              value={searchTeam}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTeam(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm"
            />
          </div>

          {/* Filtro por Unidade */}
          <select
            value={filterUnitId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterUnitId(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm appearance-none cursor-pointer"
          >
            <option value="">Todas as Unidades</option>
            {units.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={filterStatus}
            onChange={(e: any) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm appearance-none cursor-pointer"
          >
            <option value="">Todos os Status</option>
            <option value="Ativa">Ativa</option>
            <option value="Inativa">Inativa</option>
          </select>

          {/* Limpar filtros */}
          {(searchTeam || filterUnitId || filterStatus) && (
            <button
              onClick={() => { setSearchTeam(''); setFilterUnitId(''); setFilterStatus(''); }}
              className="px-4 py-2.5 text-xs font-black text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition uppercase tracking-widest whitespace-nowrap"
            >
              Limpar
            </button>
          )}

          {/* Contador */}
          <div className="flex items-center px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl shrink-0">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">
              {(() => {
                const q = searchTeam.toLowerCase();
                return (teams || []).filter(t => {
                  const nameOk = !q || (t.name || '').toLowerCase().includes(q) || (t.number || '').toLowerCase().includes(q);
                  const unitOk = !filterUnitId || String(t.unitId) === String(filterUnitId);
                  const statusOk = !filterStatus || t.status === filterStatus;
                  return nameOk && unitOk && statusOk;
                }).length;
              })()} / {(teams || []).length} equipe(s)
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-6">
        {(teams || [])
          .filter(team => {
            const q = (searchTeam || '').toLowerCase();
            const nameOk = !q || (team.name || '').toLowerCase().includes(q) || (team.number || '').toLowerCase().includes(q);
            const unitOk = !filterUnitId || String(team.unitId) === String(filterUnitId);
            const statusOk = !filterStatus || team.status === filterStatus;
            return nameOk && unitOk && statusOk;
          })
          .sort((a, b) => {
            const na = parseInt(a.number || '0');
            const nb = parseInt(b.number || '0');
            return isNaN(na) || isNaN(nb) ? (a.number || '').localeCompare(b.number || '') : na - nb;
          })
          .map((team) => {
          const unit = (units || []).find(u => String(u.id) === String(team.unitId));
          const activeTeamMembers = (collaborators || []).filter(c => {
            const isAssigned = (c.teamId && String(c.teamId) === String(team.id)) || 
                             (c.equipe && team.number && String(c.equipe) === String(team.number));
            const status = (c.status || 'Ativo').toString().toLowerCase().trim();
            const isActive = !['inativo', 'inativa', 'desativado', 'desligado'].includes(status);
            return isAssigned && isActive;
          });
          const activeTab = activeCardTabs[team.id] || 'info';

          return (
            <div key={team.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 pb-4 flex justify-between items-start border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black relative">
                    {team.number}
                    {(() => {
                        const hoje = getTodayLocalDate();
                        const cargasHojeCount = (cargas || []).filter(c => 
                          (String(c.teamId) === String(team.id) || String(c.teamId) === String(team.number)) && 
                          (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === hoje
                        ).reduce((acc, curr) => acc + (curr.cargasCount || 0), 0);
                        return cargasHojeCount > 0 ? (
                           <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm ring-1 ring-emerald-100">{cargasHojeCount.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                        ) : null;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 text-lg leading-tight">{team.name}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${team.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {team.status}
                    </span>
                  </div>
                </div>
                 <div className="flex gap-1 group-hover:opacity-100 transition-all">
                  <button onClick={() => setMaximizedTeamId(team.id)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg" title="Expandir">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  </button>
                   {(team.status === 'Ativa' || team.status === 'Ativo') && (['Administrador', 'Gerente', 'Operador', 'Admin'].includes(userRole)) && (
                     <button 
                       onClick={(e: any) => {
                         e.stopPropagation();
                         if (window.confirm(`Deseja inativar a equipe ${team.name}?`)) {
                           onUpdateTeam({ ...team, status: 'Inativa' });
                         }
                       }}
                       className="p-2 text-red-500 hover:bg-red-50 rounded-lg" 
                       title="Inativar Equipe"
                     >
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                     </button>
                   )}
                  <button onClick={() => handleEdit(team)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                  </button>
                  <button onClick={() => onDeleteTeam(team.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Excluir">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </button>
                </div>
              </div>

              {/* Tabs Selector */}
              <div className="flex border-b border-gray-50 bg-gray-50/50 p-1 mx-6 mt-4 rounded-xl">
                 <button 
                  onClick={() => setActiveCardTabs({...activeCardTabs, [team.id]: 'info'})}
                  className={`flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'info' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 >Info</button>
                 <button 
                  onClick={() => setActiveCardTabs({...activeCardTabs, [team.id]: 'chamada'})}
                  className={`flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'chamada' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 >Chamada</button>
                 <button 
                  onClick={() => setActiveCardTabs({...activeCardTabs, [team.id]: 'historico'})}
                  className={`flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'historico' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                 >Histórico</button>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 min-h-[300px]">
                {activeTab === 'info' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                           {(team.status === 'Ativa' || team.status === 'Ativo') && (['Administrador', 'Gerente', 'Operador', 'Admin'].includes(userRole)) && (
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-3">
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2 text-center">Gestão de Status</p>
                          <button 
                            onClick={(e: any) => {
                              e.stopPropagation();
                              if (window.confirm(`Deseja realmente inativar a equipe ${team.name}?`)) {
                                onUpdateTeam({ ...team, status: 'Inativa' });
                              }
                            }}
                            className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                          >
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                             Inativar esta Equipe
                          </button>
                        </div>
                      )}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Unidade / Centro de Custo Vinculado</p>
                        <p className="text-xs font-black text-slate-700">{unit ? `${unit.name} (${unit.code})` : 'Não vinculada'}</p>
                      </div>
                    <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50 flex-1 overflow-hidden flex flex-col">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 text-center">Quadro Operacional (Real x Meta)</p>
                      <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1 custom-scrollbar">
                        {(['Motorista', 'Apanhador', 'Batedor', 'Encarregado', 'Gerente', 'Supervisor'] as StaffFunction[]).map(role => {
                          const currentCount = activeTeamMembers.filter(m => m.role === role || m.funcao === role).length;
                          const targetObj = team.targetStaff?.[role];
                          const targetCount = typeof targetObj === 'object' && targetObj !== null ? (targetObj as any).meta : (targetObj || 0);
                          if (targetCount === 0 && currentCount === 0) return null;
                          return (
                            <div key={role} className="bg-white/50 p-2 rounded-xl border border-indigo-100/30 px-3 flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-600 uppercase leading-none">{role}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-black leading-none ${currentCount < targetCount ? 'text-red-500' : 'text-emerald-600'}`}>{currentCount}</span>
                                  <span className="text-[8px] font-bold text-gray-300">/</span>
                                  <span className="text-[10px] font-black text-indigo-400 leading-none">{targetCount}</span>
                                </div>
                              </div>
                              {typeof team.targetStaff?.[role] === 'object' && team.targetStaff?.[role] !== null && (
                                <div className="flex justify-between border-t border-indigo-50/50 pt-1 mt-0.5">
                                  <span className="text-[8px] font-bold text-gray-400 uppercase">Remuneração:</span>
                                  <span className="text-[9px] font-black text-emerald-600 uppercase italic">
                                    {formatCurrency((team.targetStaff?.[role] as any)?.salary || 0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-indigo-100/50 flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-indigo-900 uppercase">Total do Quadro</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-700">{activeTeamMembers.length}</span>
                            <span className="text-[10px] font-bold text-gray-300">/</span>
                            <span className="text-xs font-black text-indigo-600">
                              {Object.values(team.targetStaff || {}).reduce((acc: number, val: any) => {
                                 const metaVal = typeof val === 'object' && val !== null ? (val as any).meta : val;
                                 return acc + (Number(metaVal) || 0);
                               }, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-indigo-50/10 p-4 rounded-2xl border border-indigo-100/30 flex flex-col mt-4">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 text-center">Membros Vinculados</p>
                      <div className="space-y-2 overflow-y-auto max-h-[150px] pr-1 custom-scrollbar">
                        {activeTeamMembers.map(m => (
                          <div key={m.id} className="flex justify-between items-center bg-white/50 p-2 rounded-xl border border-indigo-100/20">
                             <div className="min-w-0 flex-1">
                               <p className="text-[9px] font-black text-gray-700 truncate uppercase leading-none">{m.name}</p>
                               <p className="text-[7px] font-bold text-gray-400 uppercase italic mt-0.5">{String(m.role || m.funcao || '---').toUpperCase()}</p>
                             </div>
                             <button
                               onClick={(e: any) => {
                                 e.stopPropagation();
                                 if (window.confirm(`Deseja realmente inativar o colaborador ${m.name}?`)) {
                                   onUpdateCollaborator({ ...m, status: 'Inativo' });
                                 }
                               }}
                               className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[7px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-red-200"
                             >
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Inativar
                             </button>
                          </div>
                        ))}
                        {activeTeamMembers.length === 0 && (
                          <p className="text-[9px] text-gray-400 italic text-center py-4">Nenhum membro vinculado</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chamada' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Presença do Dia</p>
                       <input 
                        type="date" 
                        value={rollCallDate} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRollCallDate(e.target.value)}
                        className="text-[10px] font-black p-1 border rounded-lg bg-gray-50"
                       />
                    </div>
                    <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
                       {(activeTeamMembers || []).map(m => {
                        const rec = (attendance || []).find(a => String(a.collaboratorId) === String(m.id) && (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate);
                        return (
                          <div key={m.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-black text-gray-700 truncate block uppercase leading-none">{(m.name || '---').toUpperCase()}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase italic leading-none mt-1 block">{(m.role || m.funcao || '---').toString().toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {rec && (
                                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                                    rec.status === 'Presente' ? 'bg-emerald-100 text-emerald-600' :
                                    rec.status === 'Falta' ? 'bg-red-100 text-red-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>{rec.status.substring(0, 3)}</span>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRoleChangeData({
                                      collaboratorId: m.id,
                                      newName: m.name,
                                      currentRole: m.role || m.funcao || '',
                                      newRole: m.role || m.funcao || '',
                                      changeDate: getTodayLocalDate()
                                    });
                                  }}
                                  className="px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[7px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm"
                                  title="Mudar Função"
                                >
                                  Função
                                </button>
                                <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (window.confirm(`Deseja realmente inativar o colaborador ${m.name}?`)) {
                                       onUpdateCollaborator({ ...m, status: 'Inativo' });
                                     }
                                   }}
                                   className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-[7px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-red-200 shadow-sm"
                                   title="Inativar Colaborador"
                                 >
                                   <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                   Inativar
                                 </button>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {(['Presente', 'Falta', 'Atestado', 'Folga'] as AttendanceStatus[]).map(st => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateStatus(m.id, team.id, st)}
                                  disabled={userRole !== 'Administrador' && !!rec}
                                  className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg border transition-all ${
                                    rec?.status === st ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                                  } ${userRole !== 'Administrador' && !!rec ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >{st.charAt(0)}</button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {activeTeamMembers.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 italic">Nenhum membro ativo vinculado à equipe #{team.number}</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'historico' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase ml-1">De</label>
                        <input 
                          type="date" 
                          value={historyFilter.start} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHistoryFilter({...historyFilter, start: e.target.value})}
                          className="w-full text-[9px] font-black p-1.5 border border-gray-100 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Até</label>
                        <input 
                          type="date" 
                          value={historyFilter.end} 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHistoryFilter({...historyFilter, end: e.target.value})}
                          className="w-full text-[9px] font-black p-1.5 border border-gray-100 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                      <table className="w-full text-[9px]">
                        <thead className="sticky top-0 bg-white border-b border-gray-100">
                          <tr>
                            <th className="text-left py-1 text-gray-400 uppercase font-black">Data</th>
                            <th className="text-left py-1 text-gray-400 uppercase font-black">Func.</th>
                            <th className="text-left py-1 text-gray-400 uppercase font-black">Função</th>
                            <th className="text-center py-1 text-gray-400 uppercase font-black">Nº Cargas</th>
                            <th className="text-right py-1 text-gray-400 uppercase font-black">Valor/Carga</th>
                            <th className="text-right py-1 text-gray-400 uppercase font-black">Total</th>
                            <th className="text-center py-1 text-gray-400 uppercase font-black">Status</th>
                            <th className="text-right py-1 text-gray-400 uppercase font-black">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {attendance
                            .filter(a => {
                              const adate = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                              return (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && adate >= historyFilter.start && adate <= historyFilter.end;
                            })
                            .sort((a,b) => (b.date || '').localeCompare(a.date || ''))
                            .map(a => {
                              const m = collaborators.find(c => c.id === a.collaboratorId);
                              const role = m?.role || m?.funcao || '';
                              
                              const aDateStr = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                              const teamCargas = (cargas || []).filter(c => 
                                (String(c.teamId).trim() === String(team.id).trim() || String(c.teamId).trim() === String(team.number).trim()) && 
                                (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === aDateStr
                              );
                              const totalCargasCount = teamCargas.reduce((acc, curr) => acc + (curr.cargasCount || 0), 0);
                              
                              const roleValDef = roleValues.find(rv => rv.role?.toLowerCase() === role?.toLowerCase() && rv.active);
                              const valorCarga = roleValDef ? (roleValDef.loadValue || 0) : 0;

                              // Lógica Abaixo Meta
                              const teamMetaTotal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
                                const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
                                return acc + v;
                              }, 0);
                              
                              const dayPresence = new Set((attendance || [])
                                .filter(at => 
                                  (String(at.teamId).trim() === String(team.id).trim() || String(at.teamId).trim() === String(team.number).trim()) && 
                                  (at.date?.includes('T') ? at.date.split('T')[0] : at.date) === aDateStr &&
                                  (at.status === 'Presente' || at.replacedByDiarista === true)
                                )
                                .map(at => at.collaboratorId)
                              ).size;

                              const isBelowMeta = teamMetaTotal > 0 && dayPresence < teamMetaTotal;
                              const isPayable = a.status === 'Presente' || a.replacedByDiarista === true;
                              const valorTotal = isPayable ? totalCargasCount * valorCarga : 0;

                              return (
                                <tr key={a.id}>
                                  <td className="py-2 text-gray-500 font-bold">{formatDisplayDateLocal(a.date)}</td>
                                  <td className="py-2 text-gray-700 font-black truncate max-w-[80px]">{m?.name || '---'}</td>
                                  <td className="py-2 text-gray-400 font-bold italic truncate max-w-[60px] text-[8px]">{role || '---'}</td>
                                  <td className="py-2 text-center text-indigo-600 font-black text-[10px]">{totalCargasCount.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                  <td className="py-2 text-right text-slate-500 font-bold text-[9px]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCarga)}</td>
                                  <td className="py-2 text-right font-black text-[10px] text-emerald-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                                  </td>
                                  <td className="py-2 text-center">
                                    <span className={`font-black uppercase text-[7px] ${
                                      a.status === 'Presente' ? 'text-emerald-600' :
                                      a.status === 'Falta' ? 'text-red-500' :
                                      'text-blue-500'
                                    }`}>{a.status}</span>
                                  </td>
                                  <td className="py-2 text-right">
                                    {userRole === 'Administrador' && (
                                      <button 
                                        onClick={() => {
                                          if (window.confirm("Deseja excluir este registro de presença?")) {
                                            onDeleteAttendance(a.id);
                                          }
                                        }}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 border-t border-indigo-50 pt-2 flex justify-between items-center px-2 bg-indigo-50/20 rounded-lg">
                          <span className="text-[10px] font-black text-indigo-900 uppercase">Total Período</span>
                          <span className="text-[10px] font-black text-emerald-600">
                            {formatCurrency(
                              attendance
                                .filter(a => {
                                  const adate = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                                  return (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && adate >= historyFilter.start && adate <= historyFilter.end;
                                })
                                .reduce((acc, a) => {
                                   const m = (collaborators || []).find(c => String(c.id) === String(a.collaboratorId));
                                   const role = m?.role || m?.funcao || '';
                                   const aDateStr = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                                   const teamCargas = (cargas || []).filter(c => 
                                     (String(c.teamId) === String(team.id) || String(c.teamId) === String(team.number)) && 
                                     (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === aDateStr
                                   );
                                   const totalCargasCount = teamCargas.reduce((acc, curr) => acc + (curr.cargasCount || 0), 0);
                                   const roleValDef = roleValues.find(rv => rv.role?.toLowerCase() === role?.toLowerCase() && rv.active);
                                   const valorCarga = roleValDef ? (roleValDef.loadValue || 0) : 0;

                                   const teamMetaTotal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
                                     const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
                                     return acc + v;
                                   }, 0);
                                   
                                   const dayPresence = new Set((attendance || [])
                                     .filter(at => 
                                       (String(at.teamId).trim() === String(team.id).trim() || String(at.teamId).trim() === String(team.number).trim()) && 
                                       (at.date?.includes('T') ? at.date.split('T')[0] : at.date) === aDateStr &&
                                       (at.status === 'Presente' || at.replacedByDiarista === true)
                                     )
                                     .map(at => at.collaboratorId)
                                   ).size;

                                   const isBelowMeta = teamMetaTotal > 0 && dayPresence < teamMetaTotal;
                                   const isPayable = a.status === 'Presente' || a.replacedByDiarista === true;
                                   return acc + (isPayable ? (totalCargasCount * valorCarga) : 0);
                                }, 0)
                            )}
                          </span>
                        </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {teams.filter((team: any) => {
          const q = searchTeam.toLowerCase();
          const nameOk = !q || (team.name || '').toLowerCase().includes(q) || (team.number || '').toLowerCase().includes(q);
          const unitOk = !filterUnitId || team.unitId === filterUnitId;
          const statusOk = !filterStatus || team.status === filterStatus;
          return nameOk && unitOk && statusOk;
        }).length === 0 && (
          <div className="col-span-full p-20 text-center text-gray-300 italic font-medium border-2 border-dashed border-gray-100 rounded-[40px]">
            {teams.length === 0 ? 'Nenhuma equipe cadastrada no sistema.' : 'Nenhuma equipe encontrada com os filtros selecionados.'}
          </div>
        )}
      </div>

      {maximizedTeamId && (() => {
        const team = (teams || []).find(t => String(t.id) === String(maximizedTeamId));
        if (!team) return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl text-center">
                    <p className="text-gray-500 font-bold mb-4 uppercase text-xs">Equipe não encontrada ou removida do filtro</p>
                    <button onClick={() => setMaximizedTeamId(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase">Fechar</button>
                </div>
            </div>
        );
        const unit = (units || []).find(u => String(u.id) === String(team.unitId));
        const activeTeamMembers = (collaborators || []).filter(c => {
          const isAssigned = (c.teamId && String(c.teamId) === String(team.id)) || 
                           (c.equipe && team.number && String(c.equipe) === String(team.number));
          const status = (c.status || 'Ativo').toString().toLowerCase().trim();
          const isActive = !['inativo', 'inativa', 'desativado', 'desligado'].includes(status);
          return isAssigned && isActive;
        });
        const displayedMembers = activeTeamMembers.filter(m => 
          !memberSearch || (m.name || '').toLowerCase().includes(memberSearch.toLowerCase())
        );
        const activeTab = activeCardTabs[team.id] || 'info';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-7xl h-full max-h-[96vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
              {/* Header Consolidado */}
              <div className="p-8 pb-6 border-b border-gray-200 bg-white flex flex-col lg:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[28px] bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100 shrink-0">
                    {team.number}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">{team.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{unit?.name || 'Unidade não vinculada'}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${team.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                         Status: {team.status}
                       </span>
                       {(team.status === 'Ativa' || team.status === 'Ativo') && (['Administrador', 'Gerente', 'Operador', 'Admin'].includes(userRole)) && (
                         <button 
                           onClick={() => {
                             if (window.confirm(`Deseja realmente inativar a equipe ${team.name}?`)) {
                               onUpdateTeam({ ...team, status: 'Inativa' });
                             }
                           }}
                           className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
                         >
                           Inativar Equipe
                         </button>
                       )}
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="flex flex-wrap justify-center gap-4 flex-1 max-w-2xl px-8 border-x border-gray-100 hidden xl:flex">
                  <div className="px-6 py-2 border-r border-gray-50 last:border-0 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Membros</p>
                    <p className="text-xl font-black text-gray-800">{activeTeamMembers.length}</p>
                  </div>
                  <div className="px-6 py-2 border-r border-gray-50 last:border-0 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Meta Total</p>
                    <p className="text-xl font-black text-indigo-600">
                      {Object.values(team.targetStaff || {}).reduce((acc: number, val: any) => {
                        const metaVal = typeof val === 'object' && val !== null ? (val as any).meta : (Number(val) || 0);
                        return acc + (Number(metaVal) || 0);
                      }, 0)}
                    </p>
                  </div>
                  <div className="px-6 py-2 border-r border-gray-50 last:border-0 text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Presença Hoje</p>
                    <p className="text-xl font-black text-emerald-600">
                      {activeTeamMembers.length - (attendance || []).filter(a => String(a.teamId) === String(team.id) && (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === getTodayLocalDate() && ['Falta', 'Atestado', 'Folga'].includes(a.status)).length}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setMaximizedTeamId(null)}
                  className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center shrink-0 shadow-sm"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Navigation Tabs Bar */}
              <div className="px-8 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[20px] shadow-inner">
                  {[
                    { id: 'info', label: 'Dashboard & Membros', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 20v-6M6 20V10M18 20V4"/></svg> },
                    { id: 'chamada', label: 'Folha de Chamada', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                    { id: 'historico', label: 'Histórico de Presença', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
                  ].map((tab) => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveCardTabs({...activeCardTabs, [team.id]: tab.id as any})}
                      className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-3 ${
                        activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md transform scale-[1.02]' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Lateral: Metas e Quadro */}
                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-white p-8 rounded-[40px] border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                           <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest">Metas Operacionais</h5>
                           {userRole === 'Administrador' && (
                              <button 
                                 onClick={() => handleEdit(team)}
                                 className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                 Ajustar
                              </button>
                           )}
                        </div>
                        <div className="space-y-4">
                           {Array.from(new Set([
                              ...Object.keys(team.targetStaff || {}),
                              ...activeTeamMembers.map(m => m.role || m.funcao || '').filter(Boolean)
                           ])).map(role => {
                              const currentCount = activeTeamMembers.filter(m => m.role === role || m.funcao === role).length;
                              const targetObj = team.targetStaff?.[role];
                              const targetCount = typeof targetObj === 'object' && targetObj !== null ? (targetObj as any).meta : (targetObj || 0);
                              const salary = typeof targetObj === 'object' && targetObj !== null ? (targetObj as any).salary : 0;
                              const isMissing = targetCount > 0 && currentCount < targetCount;

                              return (
                                <div key={role} className="group">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{(role || '').toString().toUpperCase()}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-black ${isMissing ? 'text-red-500' : 'text-emerald-600'}`}>{currentCount}</span>
                                      <span className="text-gray-300 text-[10px]">/</span>
                                      <span className="text-xs font-black text-indigo-600">{targetCount || '—'}</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                                    <div 
                                      className={`h-full transition-all duration-1000 ${isMissing ? 'bg-red-400' : 'bg-emerald-400'}`}
                                      style={{ width: `${targetCount > 0 ? Math.min((currentCount / targetCount) * 100, 100) : 0}%` }}
                                    />
                                  </div>
                                  {salary > 0 && (
                                    <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase text-right">Custo Ref: {formatCurrency(salary)}</p>
                                  )}
                                </div>
                              );
                           })}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-end">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status Geral</p>
                              <p className="text-xs font-black text-gray-700 tracking-tight">Cobertura de {Math.round((activeTeamMembers.length / Math.max(1, Object.values(team.targetStaff || {}).reduce((acc: number, val: any) => acc + (Number(typeof val === 'object' && val !== null ? val.meta : val) || 0), 0) as number)) * 100)}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-gray-400 uppercase">Custo Estimado/Dia</p>
                              <p className="text-lg font-black text-emerald-600 leading-none">
                                {formatCurrency(Object.entries(team.targetStaff || {}).reduce((acc: number, [_role, val]: [string, any]) => {
                                   const meta = typeof val === 'object' && val !== null ? (Number(val.meta) || 0) : (Number(val) || 0);
                                   const sal = typeof val === 'object' && val !== null ? (Number(val.salary) || 0) : 0;
                                   return acc + (meta * sal);
                                 }, 0))}
                              </p>
                            </div>
                        </div>
                      </div>

                      <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                        <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Ações Rápidas</h5>
                        <div className="grid grid-cols-1 gap-2">
                          <button onClick={() => handleEdit(team)} className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all text-left flex justify-between items-center group/btn">
                            Editar Equipe <svg className="group-hover/btn:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                          </button>
                          <button onClick={() => { setActiveCardTabs({...activeCardTabs, [team.id]: 'chamada'}); }} className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all text-left flex justify-between items-center group/btn">
                            Fazer Chamada <svg className="group-hover/btn:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                          </button>
                          <button onClick={() => { setActiveCardTabs({...activeCardTabs, [team.id]: 'historico'}); }} className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all text-left flex justify-between items-center group/btn">
                            Ver Histórico <svg className="group-hover/btn:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                          </button>
                           {(team.status === 'Ativa' || team.status === 'Ativo') && (['Administrador', 'Gerente', 'Operador', 'Admin'].includes(userRole)) && (
                             <button 
                               onClick={() => {
                                 if (window.confirm(`Deseja realmente inativar a equipe ${team.name}?`)) {
                                   onUpdateTeam({ ...team, status: 'Inativa' });
                                 }
                               }} 
                               className="w-full py-4 px-6 bg-red-500/20 hover:bg-red-500/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-100 transition-all text-left flex justify-between items-center group/btn border border-red-500/20"
                             >
                               Inativar Equipe <svg className="group-hover/btn:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                             </button>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-8 bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm flex flex-col min-h-[600px] overflow-hidden">
                        <div className="flex justify-between items-center mb-8 shrink-0">
                           <div>
                             <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Membros Vinculados</h5>
                             <p className="text-xl font-black text-gray-900 tracking-tight">{displayedMembers.length} Colaboradores Ativos</p>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => handleExportMembersExcel(team, displayedMembers)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm group relative" title="Exportar Excel" aria-label="Exportar Excel">
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all bg-emerald-700 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-50 pointer-events-none">Excel</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </button>
                              <button onClick={() => handleExportMembersPDF(team, displayedMembers)} className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 flex items-center justify-center shrink-0 shadow-sm group relative" title="Exportar PDF" aria-label="Exportar PDF">
                                <span className="absolute -top-10 left-1/2 -translate-x-1/2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all bg-rose-700 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-50 pointer-events-none">PDF</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><path d="M10 9H8"/></svg>
                              </button>
                              <input
                                type="text"
                                placeholder="Filtrar por nome..."
                                value={memberSearch}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberSearch(e.target.value)}
                                className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64 uppercase placeholder:normal-case shadow-inner placeholder-gray-400 text-gray-800"
                              />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-6 overflow-y-auto flex-1 pr-2 custom-scrollbar pb-8">
                           {displayedMembers.map((m: Collaborator) => (
                             <div key={m.id} className="flex flex-col p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-indigo-300 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all group/mem relative overflow-hidden"
                             >
                               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover/mem:opacity-100 transition-opacity" />
                               <div className="flex items-center gap-4 mb-4 relative z-10">
                                 <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                 {m.profilePhoto 
                                   ? <img src={m.profilePhoto} alt={m.name} className="w-full h-full object-cover" />
                                   : <span className="text-xl font-black text-gray-200">{(m.name || '---').charAt(0).toUpperCase()}</span>
                                 }
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-xs font-black text-gray-900 truncate uppercase">{(m.name || '---').toUpperCase()}</p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5 tracking-tight">{(m.role || m.funcao || '---').toString().toUpperCase()}</p>
                               </div>
                               </div>

                               <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                                 <div className="p-2 bg-white/50 rounded-xl border border-gray-100">
                                   <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Admissão</p>
                                   <p className="text-[9px] font-black text-gray-700">{m.admissionDate ? formatSafeDate(m.admissionDate) : '—'}</p>
                                 </div>
                                 <div className="p-2 bg-white/50 rounded-xl border border-gray-100">
                                   <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Status</p>
                                   <p className={`text-[9px] font-black ${m.status === 'Ativo' ? 'text-emerald-600' : 'text-amber-600'}`}>{m.status || 'Ativo'}</p>
                                 </div>
                               </div>

                               <div className="flex gap-2 relative z-10">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setRoleChangeData({
                                       collaboratorId: m.id,
                                       newName: m.name,
                                       currentRole: m.role || m.funcao || '',
                                       newRole: m.role || m.funcao || '',
                                       changeDate: getTodayLocalDate()
                                     });
                                   }}
                                   className="flex-1 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                 >
                                   Mudar Função
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (window.confirm(`Deseja realmente inativar o colaborador ${m.name}? Ele não aparecerá mais nos cartões de equipe.`)) {
                                       onUpdateCollaborator({ ...m, status: 'Inativo' });
                                     }
                                   }}
                                   className="flex-1 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                 >
                                   Inativar
                                 </button>
                               </div>
                             </div>
                           ))}
                           {activeTeamMembers.length === 0 ? (
                             <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                               <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nenhum membro ativo vinculado a esta equipe.</p>
                               <p className="text-[10px] text-gray-400 mt-1">Verifique o cadastro de colaboradores ou o status da equipe.</p>
                             </div>
                      ) : (
                         displayedMembers.length === 0 && (
                           <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                             <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nenhum colaborador encontrado</p>
                             <p className="text-[10px] text-gray-400 mt-1">Verifique o filtro ou vincule membros no cadastro</p>
                           </div>
                         )
                       )}
                     </div>
                   </div>
                 </div>
                )}

                {activeTab === 'chamada' && (
                  <div className="mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-2 bg-white p-2 px-8 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </div>
                          <div>
                            <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">Registro de Frequência</h4>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none">Confirme a presença abaixo</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 bg-gray-50 p-1 px-4 rounded-xl border border-gray-100">
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Data</span>
                         <input
                           type="date"
                           value={rollCallDate}
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRollCallDate(e.target.value)}
                           className="px-3 py-1 bg-white border border-gray-100 rounded-lg font-black text-indigo-600 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none hover:border-indigo-200 transition-all text-[10px]"
                         />
                       </div>
                    </div>

                     <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                           <table className="w-full text-left border-collapse">
                              <thead className="sticky top-0 bg-gray-900 z-20">
                                 <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Colaborador</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Função</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-center">Registro de Presença</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-right">Status Atual</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-right">Ações</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                 {(activeTeamMembers || []).length > 0 ? (activeTeamMembers || []).map(m => {
                                    const rec = (attendance || []).find(a => String(a.collaboratorId) === String(m.id) && (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate);
                                    return (
                                       <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors group/row">
                                          <td className="px-8 py-1">
                                             <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-indigo-600 overflow-hidden shadow-sm">
                                                   {m.profilePhoto ? <img src={m.profilePhoto} className="w-full h-full object-cover" alt="" /> : (m.name || '').charAt(0)}
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tighter group-hover/row:text-indigo-600 transition-colors">
                                                   {(m.name || '---').toUpperCase()}
                                                </span>
                                             </div>
                                          </td>
                                          <td className="px-8 py-1">
                                             <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter ${getRoleBadge(m.role as StaffFunction)}`}>
                                                {(m.role || m.funcao || '---').toString().toUpperCase()}
                                             </span>
                                          </td>
                                          <td className="px-8 py-1">
                                             <div className="flex justify-center gap-1">
                                                {[
                                                   { status: 'Presente' as AttendanceStatus, label: 'P', color: 'emerald' },
                                                   { status: 'Falta' as AttendanceStatus, label: 'F', color: 'red' },
                                                   { status: 'Atestado' as AttendanceStatus, label: 'A', color: 'amber' },
                                                   { status: 'Folga' as AttendanceStatus, label: 'L', color: 'indigo' }
                                                ].map(({ status: st, label, color }) => (
                                                   <button
                                                      key={st}
                                                      onClick={() => handleUpdateStatus(m.id, team.id, st)}
                                                      disabled={userRole !== 'Administrador' && !!rec}
                                                      className={`w-9 h-7 flex flex-col items-center justify-center rounded-md border transition-all ${
                                                         rec?.status === st
                                                         ? `bg-${color}-600 text-white border-${color}-600 shadow-md ring-1 ring-${color}-100`
                                                         : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-white hover:border-indigo-200 hover:text-indigo-600'
                                                      } ${userRole !== 'Administrador' && !!rec ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                      title={st}
                                                   >
                                                      <span className="text-[9px] font-black leading-none">{label}</span>
                                                      <span className="text-[5px] font-bold uppercase tracking-tighter opacity-60 leading-none">{st}</span>
                                                   </button>
                                                ))}
                                             </div>
                                          </td>
                                          <td className="px-8 py-1 text-right">
                                             {rec ? (
                                                <div className="flex items-center justify-end gap-1.5 text-[8px]">
                                                   <div className={`w-1 h-1 rounded-full animate-pulse ${
                                                      rec.status === 'Presente' ? 'bg-emerald-500' :
                                                      rec.status === 'Falta' ? 'bg-red-500' : 'bg-indigo-500'
                                                   }`} />
                                                   <span className="font-black text-gray-700 uppercase">{(rec.status || '---').toUpperCase()}</span>
                                                </div>
                                             ) : (
                                                <span className="text-[8px] font-black text-gray-300 uppercase italic">Pendente</span>
                                             )}
                                           </td>
                                           <td className="px-8 py-1 text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRoleChangeData({
                                                      collaboratorId: m.id,
                                                      newName: m.name,
                                                      currentRole: m.role || m.funcao || '',
                                                      newRole: m.role || m.funcao || '',
                                                      changeDate: getTodayLocalDate()
                                                    });
                                                  }}
                                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                  title="Mudar Função"
                                                >
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7"/></svg>
                                                </button>
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Deseja realmente inativar o colaborador ${m.name}?`)) {
                                                      onUpdateCollaborator({ ...m, status: 'Inativo' });
                                                    }
                                                  }}
                                                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-200 shadow-sm"
                                                  title="Inativar Colaborador"
                                                >
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                              </div>
                                           </td>
                                       </tr>
                                    );
                                 }) : (
                                   <tr>
                                     <td colSpan={5} className="px-8 py-12 text-center bg-gray-50/30">
                                       <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">Nenhum membro ativo para chamada.</p>
                                     </td>
                                   </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                        {activeTeamMembers.length === 0 && (
                           <div className="flex-1 flex flex-col items-center justify-center p-20 bg-gray-50/30">
                              <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">Sem membros para chamada</p>
                           </div>
                        )}
                     </div>

                     <div className="mt-2 p-2 px-8 bg-indigo-900 rounded-2xl text-white flex justify-between items-center shadow-xl shadow-indigo-100 shrink-0">
                        <div className="flex flex-wrap gap-x-12 gap-y-2 py-1">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-8 bg-indigo-400/30 rounded-full"></div>
                              <div>
                                 <p className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mb-0">Total Membros</p>
                                 <p className="text-sm font-black text-white">{activeTeamMembers.length}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-8 bg-pink-400/30 rounded-full"></div>
                              <div>
                                 <p className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mb-0">Ausências (F/A/L)</p>
                                 <p className="text-sm font-black text-pink-200">
                                   {(-1) * attendance.filter(a => 
                                     (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && 
                                     (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate && 
                                     ['Falta', 'Atestado', 'Folga'].includes(a.status)
                                   ).length}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-8 bg-cyan-400/30 rounded-full"></div>
                              <div>
                                 <p className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mb-0">Saldo de Membros</p>
                                 <p className="text-sm font-black text-cyan-200">
                                   {(() => {
                                     const totalAbs = attendance.filter(a => 
                                       (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && 
                                       (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate && 
                                       ['Falta', 'Atestado', 'Folga'].includes(a.status)
                                     ).length;
                                     return activeTeamMembers.length - totalAbs;
                                   })()}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-8 bg-yellow-400/30 rounded-full"></div>
                              <div>
                                 <p className="text-[7px] font-black text-indigo-300 uppercase tracking-widest mb-0">Meta da Carga</p>
                                 <p className="text-sm font-black text-yellow-200">
                                   {Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
                                      const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
                                      return acc + v;
                                   }, 0)}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Status da Equipe */}
                        <div className="flex items-center gap-4">
                           {(() => {
                             const totalAbs = attendance.filter(a => 
                               (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && 
                               (a.date?.includes('T') ? a.date.split('T')[0] : a.date) === rollCallDate && 
                               ['Falta', 'Atestado', 'Folga'].includes(a.status)
                             ).length;
                             const metaVal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
                               const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
                               return acc + v;
                             }, 0);
                             const saldo = activeTeamMembers.length - totalAbs;
                             const isBelow = saldo < metaVal && metaVal > 0;
                             
                             return isBelow ? (
                               <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg border border-red-400">
                                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                 <span className="text-[10px] font-black uppercase tracking-tight">Equipe Abaixo da Meta</span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl shadow-lg border border-emerald-50">
                                 <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                 <span className="text-[10px] font-black uppercase tracking-tight text-emerald-800">Equipe Adequada</span>
                               </div>
                             );
                           })()}
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'historico' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                     <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                        <div>
                          <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Relatório Consolidado de Chamadas</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Análise detalhada por período</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-4 bg-gray-50 p-3 px-6 rounded-2xl border border-gray-100">
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Início</span>
                               <input type="date" value={historyFilter.start} onChange={(e) => setHistoryFilter({...historyFilter, start: e.target.value})} className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0" />
                             </div>
                             <div className="w-[1px] h-8 bg-gray-200"></div>
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Fim</span>
                               <input type="date" value={historyFilter.end} onChange={(e) => setHistoryFilter({...historyFilter, end: e.target.value})} className="bg-transparent border-none text-[11px] font-black focus:ring-0 p-0" />
                             </div>
                          </div>
                           <div className="flex gap-2">
                             <button
                               onClick={() => {
                                 const filtered = (attendance || []).filter(a => {
                                   const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
                                   return (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && d >= historyFilter.start && d <= historyFilter.end;
                                 });
                                 handleExportPDF(team, filtered);
                               }}
                               className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center gap-2"
                             >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                PDF
                             </button>
                             <button
                               onClick={() => {
                                 const filtered = (attendance || []).filter(a => {
                                   const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
                                   return (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && d >= historyFilter.start && d <= historyFilter.end;
                                 });
                                 handleExportExcel(team, filtered);
                               }}
                               className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2"
                             >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                EXCEL (CSV)
                             </button>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden shadow-xl flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                          <table className="w-full text-left border-collapse">
                             <thead className="sticky top-0 bg-gray-900 z-10">
                                <tr>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Data</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Colaborador</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Função</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-center">Nº Cargas</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-right">Valor Carga</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-right">Total</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-center">Status</th>
                                   <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-right">Ações</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 bg-white">
                                {(attendance || [])
                                  .filter(a => {
                                    const adate = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                                    return (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && adate >= historyFilter.start && adate <= historyFilter.end;
                                  })
                                  .sort((a,b) => (b.date || '').localeCompare(a.date || ''))
                                  .map(a => {
                                    const m = (collaborators || []).find(c => String(c.id) === String(a.collaboratorId));
                                    const role = m?.role || m?.funcao || '';
                                    
                                    const aDateStr = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                                    const teamCargas = (cargas || []).filter(c => 
                                      (String(c.teamId) === String(team.id) || String(c.teamId) === String(team.number)) && 
                                      (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === aDateStr
                                    );
                                    const totalCargasCount = teamCargas.reduce((acc, curr) => acc + (curr.cargasCount || 0), 0);
                                    
                                    const roleValDef = roleValues.find(rv => rv.role?.toLowerCase() === role?.toLowerCase() && rv.active);
                                    const valorCarga = roleValDef ? (roleValDef.loadValue || 0) : 0;
                                    
                                    // Lógica Abaixo Meta
                                    const teamMetaTotal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
                                      const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
                                      return acc + v;
                                    }, 0);
                                    
                                    const dayPresence = new Set((attendance || [])
                                      .filter(at => 
                                        (String(at.teamId).trim() === String(team.id).trim() || String(at.teamId).trim() === String(team.number).trim()) && 
                                        (at.date?.includes('T') ? at.date.split('T')[0] : at.date) === aDateStr &&
                                        (at.status === 'Presente' || at.replacedByDiarista === true)
                                      )
                                      .map(at => at.collaboratorId)
                                    ).size;

                                    const isBelowMeta = teamMetaTotal > 0 && dayPresence < teamMetaTotal;
                                    const isPayable = a.status === 'Presente' || a.replacedByDiarista === true;
                                    const valorTotal = isPayable ? totalCargasCount * valorCarga : 0;

                                    return (
                                      <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors group/row">
                                         <td className="px-8 py-5 text-xs font-black text-gray-500 uppercase">{formatDisplayDateLocal(a.date)}</td>
                                         <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                               <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[10px] font-black text-indigo-600 overflow-hidden shadow-sm">
                                                  {m?.profilePhoto ? <img src={m.profilePhoto} className="w-full h-full object-cover" alt="" /> : (m?.name || '').charAt(0)}
                                               </div>
                                               <span className="text-xs font-black text-gray-800 uppercase tracking-tighter group-hover/row:text-indigo-600 transition-colors">
                                                  {m ? (m.name || '---').toString().toUpperCase() : '---'}
                                               </span>
                                            </div>
                                         </td>
                                         <td className="px-8 py-5">
                                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${getRoleBadge(m?.role as StaffFunction)}`}>
                                             {role || '---'}
                                          </span>
                                       </td>
                                        <td className="px-8 py-5 text-center text-indigo-600 font-black text-[11px]">{totalCargasCount.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</td>
                                        <td className="px-8 py-5 text-right text-slate-500 font-bold text-[10px]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCarga)}</td>
                                        <td className={`px-8 py-5 text-right font-black text-[11px] text-emerald-600`}>
                                          {formatCurrency(valorTotal)}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                              a.status === 'Presente' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50' :
                                              a.status === 'Falta' ? 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-50' :
                                              'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50'
                                            }`}>{a.status}</span>
                                         </td>
                                         <td className="px-8 py-5 text-right">
                                            {userRole === 'Administrador' && (
                                              <button 
                                                onClick={() => {
                                                  if(window.confirm('Excluir este registro?')) onDeleteAttendance(a.id);
                                                }}
                                                className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                              >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4" /></svg>
                                              </button>
                                            )}
                                         </td>
                                      </tr>
                                    );
                                  })}
                             </tbody>
                          </table>
                        </div>
                        {(attendance || []).filter(a => {
                          const adate = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                          return String(a.teamId) === String(team.id) && adate >= historyFilter.start && adate <= historyFilter.end;
                        }).length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center p-20 bg-gray-50/30">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 mb-4 shadow-sm border border-gray-100">
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                            </div>
                            <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">Nenhum registro encontrado no período.</p>
                          </div>
                        )}
                        
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center px-10">
                           <div className="flex gap-8">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Total de Membros</span>
                               <span className="text-xl font-black text-gray-800 leading-none">{activeTeamMembers.length}</span>
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Dias Registrados</span>
                               <span className="text-xl font-black text-gray-800 leading-none">
                                 {new Set((attendance || []).filter(a => String(a.teamId) === String(team.id)).map(a => a.date)).size}
                               </span>
                             </div>
                           </div>
                           <div className="flex gap-10 items-center">
                               <div className="w-[1px] h-10 bg-gray-200"></div>
                               <div className="flex flex-col text-right">
                                  <span className="text-[9px] font-black text-emerald-400 uppercase leading-none mb-1">Investimento Total no Período</span>
                                  <span className="text-2xl font-black text-emerald-600 leading-none">
                                    {formatCurrency(
                                       (attendance || [])
                                        .filter(a => {
                                           const adate = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                                           return (String(a.teamId) === String(team.id) || String(a.teamId) === String(team.number)) && adate >= historyFilter.start && adate <= historyFilter.end;
                                        })
                                        .reduce((acc, a) => {
                                           const m = (collaborators || []).find(c => String(c.id) === String(a.collaboratorId));
                                           const role = m?.role || m?.funcao || '';
                                           const aDateStr = (a.date?.includes('T') ? a.date.split('T')[0] : a.date);
                                            const teamCargas = (cargas || []).filter(c => 
                                              (String(c.teamId) === String(team.id) || String(c.teamId) === String(team.number)) && 
                                              (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === aDateStr
                                            );
                                            const totalCargasCount = teamCargas.reduce((acc, curr) => acc + (curr.cargasCount || 0), 0);
                                           const roleValDef = roleValues.find(rv => rv.role?.toLowerCase() === role?.toLowerCase() && rv.active);
                                           const valorCarga = roleValDef ? (roleValDef.loadValue || 0) : 0;

                                           // Lógica Abaixo Meta para Soma total
                                           const teamMetaTotal = Object.values(team?.targetStaff || {}).reduce((acc: number, val: any) => {
                                             const v = (val && typeof val === 'object') ? (val.meta || 0) : (Number(val) || 0);
                                             return acc + v;
                                           }, 0);
                                           
                                           const dayPresence = new Set((attendance || [])
                                             .filter(at => 
                                               (String(at.teamId).trim() === String(team.id).trim() || String(at.teamId).trim() === String(team.number).trim()) && 
                                               (at.date?.includes('T') ? at.date.split('T')[0] : at.date) === aDateStr &&
                                               (at.status === 'Presente' || at.replacedByDiarista === true)
                                             )
                                             .map(at => at.collaboratorId)
                                           ).size;

                                           const isBelowMeta = teamMetaTotal > 0 && dayPresence < teamMetaTotal;
                                           const isPayable = a.status === 'Presente' || a.replacedByDiarista === true;
                                           return acc + (isPayable ? (totalCargasCount * valorCarga) : 0);
                                        }, 0)
                                    )}
                                  </span>
                               </div>
                            </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
            );
          })()}

      {/* Modal de Alteração de Função */}
      {roleChangeData && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Alteração de Função</h4>
                    <p className="text-[10px] font-bold opacity-80 uppercase">{roleChangeData.newName}</p>
                  </div>
               </div>
               <button onClick={() => setRoleChangeData(null)} className="text-white/60 hover:text-white transition-colors">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
               </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Função Atual</label>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-500 uppercase italic">
                  {roleChangeData.currentRole}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Nova Função / Cargo *</label>
                <select 
                  value={roleChangeData.newRole}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleChangeData({...roleChangeData, newRole: e.target.value})}
                  className="w-full p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-700 uppercase text-xs"
                >
                  {(roleValues && roleValues.length > 0 
                    ? [...new Set(roleValues.map(rv => rv.role))]
                    : ['Motorista', 'Apanhador', 'Batedor', 'Encarregado', 'Supervisor', 'Gerente']
                  ).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Data da Alteração *</label>
                <input 
                  type="date"
                  value={roleChangeData.changeDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleChangeData({...roleChangeData, changeDate: e.target.value})}
                  className="w-full p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-700"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setRoleChangeData(null)}
                  className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition"
                >Cancelar</button>
                <button 
                  onClick={handleRoleChangeSubmit}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >Confirmar Alteração</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Diarista */}
      {diaristaPrompt && (() => {
        // Buscar carga do dia para esta equipe
        const cargasDoDia = (cargas || []).filter(c => 
          (String(c.teamId) === String(diaristaPrompt.teamId) || (teams.find(t => t.id === diaristaPrompt.teamId)?.number === c.teamId)) && 
          (c.date?.includes('T') ? c.date.split('T')[0] : c.date) === rollCallDate
        );
        const collaboratorName = collaborators.find(c => c.id === diaristaPrompt.collaboratorId)?.name || '';

        return (
          <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-indigo-100">
              {/* Header */}
              <div className="p-6 bg-slate-800 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-indigo-400 mb-1">Registro de {diaristaPrompt.status}</h4>
                    <p className="text-sm font-black text-white uppercase">{(collaboratorName || '---').toUpperCase()}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Data: {rollCallDate.split('-').reverse().join('/')}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${diaristaPrompt.status === 'Falta' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {diaristaPrompt.status}
                  </span>
                </div>
              </div>

              {/* Cargas encontradas na data */}
                <div className="px-6 pt-5 pb-0">
                  {cargasDoDia.length > 0 ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl h-16 shadow-sm shadow-indigo-50">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                         <span className="text-sm font-black italic">{cargasDoDia.reduce((acc, curr) => acc + (curr.cargasCount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <h5 className="text-[9px] font-black text-indigo-700 uppercase tracking-widest leading-none mb-1">Cargas Identificadas</h5>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter leading-none italic">Produtividade total da equipe nesta data</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-2xl">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <p className="text-[10px] font-bold text-yellow-700">
                        Nenhuma carga registrada para esta equipe em <strong>{rollCallDate.split('-').reverse().join('/')}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              
              {/* Seção de Atestado */}
              {diaristaPrompt.status === 'Atestado' && (
                <div className="px-6 py-4 bg-blue-50/50 border-y border-blue-100/50 space-y-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">Documentação de Atestado</p>
                  
                  {!isCapturingPhoto && !certificateFile && (
                    <div className="flex gap-3">
                      <label className="flex-1 flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-50 transition cursor-pointer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span className="text-[9px] font-black text-blue-500 uppercase">Anexar Arquivo</span>
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                      </label>
                      <button 
                        onClick={startCamera}
                        className="flex-1 flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-blue-200 rounded-2xl hover:bg-blue-50 transition"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mb-2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <span className="text-[9px] font-black text-blue-500 uppercase">Tirar Foto</span>
                      </button>
                    </div>
                  )}

                  {isCapturingPhoto && (
                    <div className="space-y-3">
                      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-blue-500 shadow-xl">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={stopCamera} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[9px] uppercase tracking-widest">Cancelar Câmera</button>
                        <button onClick={capturePhoto} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-200">Capturar Foto</button>
                      </div>
                    </div>
                  )}

                  {certificateFile && (
                    <div className="relative p-2 bg-white border border-blue-200 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden">
                          {certificateFile.startsWith('data:image') ? (
                            <img src={certificateFile} alt="Certificado" className="w-full h-full object-cover" />
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-blue-600 uppercase">Documento pronto!</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase italic">O arquivo será salvo com o registro</p>
                        </div>
                        <button onClick={() => setCertificateFile(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pergunta diarista */}
              <div className="p-6 space-y-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Ocorreu substituição por diarista?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(diaristaPrompt.collaboratorId, diaristaPrompt.teamId, diaristaPrompt.status, false)}
                    className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition border border-red-100"
                  >Não</button>
                  <button 
                    onClick={() => {
                      const name = prompt("Digite o nome do diarista:");
                      if (name) {
                        handleUpdateStatus(diaristaPrompt.collaboratorId, diaristaPrompt.teamId, diaristaPrompt.status, true, name);
                      } else {
                        alert("Nome do diarista é obrigatório para substituição.");
                      }
                    }}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                  >Sim</button>
                </div>
                <button 
                  onClick={() => {
                    setDiaristaPrompt(null);
                    setCertificateFile(null);
                    setIsCapturingPhoto(false);
                  }}
                  className="w-full py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition"
                >Cancelar Registro</button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </>
  );
};

export default TeamRegistry;
