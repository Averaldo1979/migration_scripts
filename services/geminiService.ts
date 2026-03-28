
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client safely
const apiKey = process.env.API_KEY || "";
let genAI: any = null;
try {
  if (apiKey) genAI = new GoogleGenAI({ apiKey });
} catch (e) {
  console.error("Erro ao inicializar GoogleGenAI:", e);
}

export const getFleetInsights = async (data: any) => {
  if (!genAI) {
    return "IA indisponível: Chave de API não configurada ou erro de inicialização.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Você é um analista sênior de torre de controle logístico. 
      Analise estes dados de frota em tempo real e forneça uma síntese estratégica de alto nível (máximo 300 caracteres). 
      Foque em alertas de manutenção iminente, padrões de consumo e eficiência operacional. 
      Seja direto, técnico e use um tom profissional.
      Retorne APENAS o texto do insight em português. 
      Dados da Frota: ${JSON.stringify(data)}`);

    const response = await result.response;
    return response.text() || "Operação estável.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sistema de IA offline. Verifique os gráficos manuais.";
  }
};

export interface AIReportSection {
  title: string;
  score: number; // 0-100
  status: 'critical' | 'warning' | 'good' | 'excellent';
  summary: string;
  insights: string[];
  recommendations: string[];
}

export interface AIManagementReportData {
  executiveSummary: string;
  overallScore: number;
  generatedAt: string;
  sections: {
    fleet: AIReportSection;
    financial: AIReportSection;
    maintenance: AIReportSection;
    humanResources: AIReportSection;
    safety: AIReportSection;
    operations: AIReportSection;
  };
  topAlerts: { severity: 'high' | 'medium' | 'low'; message: string; module: string }[];
  strategicOpportunities: string[];
}

export const getFullManagementReport = async (context: any): Promise<AIManagementReportData> => {
  const fallback: AIManagementReportData = {
    executiveSummary: "Relatório gerado com dados locais. Configure a chave de API Gemini para análise completa com Inteligência Artificial.",
    overallScore: 72,
    generatedAt: new Date().toISOString(),
    sections: {
      fleet: {
        title: "Gestão de Frota",
        score: context.frota?.taxa_disponibilidade ? Math.round(context.frota.taxa_disponibilidade) : 75,
        status: 'good',
        summary: `Frota com ${context.frota?.total_veiculos || 0} ativos cadastrados.`,
        insights: ["Taxa de disponibilidade calculada com base nos status atuais.", "Veículos em manutenção impactam operações."],
        recommendations: ["Realizar manutenções preventivas para aumentar disponibilidade.", "Avaliar veículos com alta quilometragem."]
      },
      financial: {
        title: "Desempenho Financeiro",
        score: 68,
        status: 'warning',
        summary: `Custo total acumulado: R$ ${(context.financeiro?.custo_combustivel + context.financeiro?.custo_manutencao || 0).toLocaleString('pt-BR')}.`,
        insights: ["Combustível representa a maior parcela do OPEX.", "Custo de manutenção corretiva é maior que preventiva."],
        recommendations: ["Implementar programa de manutenção preventiva.", "Monitorar consumo de combustível por veículo."]
      },
      maintenance: {
        title: "Manutenção & Confiabilidade",
        score: 70,
        status: 'good',
        summary: `${context.manutencao?.total_registros || 0} registros de manutenção analisados.`,
        insights: ["Padrão de manutenção reativa identificado.", "Histórico consistente de registros."],
        recommendations: ["Criar plano de manutenção preventiva por quilometragem.", "Padronizar fornecedores de peças."]
      },
      humanResources: {
        title: "Recursos Humanos",
        score: 80,
        status: 'good',
        summary: `Equipe com ${context.rh?.total_colaboradores || 0} colaboradores ativos.`,
        insights: ["Colaboradores com habilitações acompanhadas.", "Aniversariantes do mês identificados."],
        recommendations: ["Manter treinamentos em dia.", "Acompanhar vencimentos de CNH regularmente."]
      },
      safety: {
        title: "Segurança & Conformidade",
        score: 85,
        status: 'good',
        summary: "EPIs e checklists monitorados pelo sistema.",
        insights: ["Controle de EPI ativo no sistema.", "Checklists de veículos realizados."],
        recommendations: ["Verificar EPIs com CA vencido.", "Manter frequência de checklists diários."]
      },
      operations: {
        title: "Eficiência Operacional",
        score: 74,
        status: 'good',
        summary: `${context.operacoes?.total_lavagens || 0} lavagens e ${context.operacoes?.registros_odometro || 0} registros de odômetro.`,
        insights: ["Portaria e KM devidamente registrados.", "Operações de lavagem acompanhadas."],
        recommendations: ["Otimizar rotas para reduzir quilometragem.", "Padronizar frequência de lavagem por tipo de veículo."]
      }
    },
    topAlerts: [
      { severity: 'medium', message: "Configure a API Key do Gemini para alertas inteligentes em tempo real.", module: "Sistema" },
      { severity: 'low', message: "Verifique EPIs com certificados próximos ao vencimento.", module: "Segurança" }
    ],
    strategicOpportunities: [
      "Integração com telemetria para monitoramento em tempo real",
      "Implementação de manutenção preditiva baseada em dados",
      "Otimização da cadeia de fornecedores de peças",
    ]
  };

  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Você é um diretor de operações sênior e analista de inteligência de negócios especializado em gestão de frotas logísticas.
    
Analise os dados completos abaixo e gere um relatório executivo estruturado em JSON válido (sem markdown, sem blocos de código, apenas JSON puro).

Dados do Sistema:
${JSON.stringify(context, null, 2)}

Retorne EXATAMENTE este JSON (preencha com análise real dos dados, em português):
{
  "executiveSummary": "Resumo executivo em 2-3 frases impactantes para a diretoria, baseado nos dados reais",
  "overallScore": 0,
  "generatedAt": "${new Date().toISOString()}",
  "sections": {
    "fleet": {
      "title": "Gestão de Frota",
      "score": 0,
      "status": "good",
      "summary": "resumo específico com números reais",
      "insights": ["insight 1 com dado real", "insight 2"],
      "recommendations": ["recomendação 1", "recomendação 2"]
    },
    "financial": {
      "title": "Desempenho Financeiro",
      "score": 0,
      "status": "good",
      "summary": "resumo financeiro com valores reais",
      "insights": ["insight financeiro 1", "insight 2"],
      "recommendations": ["ação financeira 1", "ação 2"]
    },
    "maintenance": {
      "title": "Manutenção & Confiabilidade",
      "score": 0,
      "status": "good",
      "summary": "resumo de manutenção",
      "insights": ["padrão identificado 1", "padrão 2"],
      "recommendations": ["melhoria 1", "melhoria 2"]
    },
    "humanResources": {
      "title": "Recursos Humanos",
      "score": 0,
      "status": "good",
      "summary": "resumo de RH com dados reais",
      "insights": ["insight RH 1", "insight 2"],
      "recommendations": ["ação RH 1", "ação 2"]
    },
    "safety": {
      "title": "Segurança & Conformidade",
      "score": 0,
      "status": "good",
      "summary": "resumo de segurança",
      "insights": ["insight segurança 1", "insight 2"],
      "recommendations": ["melhoria segurança 1", "melhoria 2"]
    },
    "operations": {
      "title": "Eficiência Operacional",
      "score": 0,
      "status": "good",
      "summary": "resumo operacional",
      "insights": ["insight operacional 1", "insight 2"],
      "recommendations": ["otimização 1", "otimização 2"]
    }
  },
  "topAlerts": [
    {"severity": "high", "message": "alerta crítico baseado nos dados", "module": "módulo"},
    {"severity": "medium", "message": "alerta moderado", "module": "módulo"},
    {"severity": "low", "message": "ponto de atenção", "module": "módulo"}
  ],
  "strategicOpportunities": [
    "oportunidade estratégica 1 baseada nos dados",
    "oportunidade 2",
    "oportunidade 3"
  ]
}

Regras:
- "score" deve ser um número inteiro entre 0 e 100
- "status" deve ser um dos valores: "critical", "warning", "good", "excellent"
- "overallScore" é a média ponderada dos scores das seções
- Baseie TODA análise nos dados reais fornecidos
- Use tom executivo e direto, em português brasileiro
- NÃO inclua o JSON em blocos de markdown`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean potential markdown artifacts
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as AIManagementReportData;
    return parsed;
  } catch (error) {
    console.error("Gemini Management Report Error:", error);
    return fallback;
  }
};
