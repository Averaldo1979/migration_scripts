
/**
 * Retorna a data local atual no formato YYYY-MM-DD
 */
export const getTodayLocalDate = (): string => {
  return new Date().toLocaleDateString('en-CA');
};

/**
 * Formata uma string de data (YYYY-MM-DD) para exibição (DD/MM/YYYY)
 * sem sofrer desvios por fuso horário.
 */
export const formatSafeDate = (dateStr: string): string => {
  if (!dateStr) return '---';
  // Troca espaço por T para garantir formato ISO (ex: postgres -> ISO)
  const isoStr = dateStr.replace(' ', 'T');
  const date = isoStr.includes('T') ? new Date(isoStr) : new Date(isoStr + 'T12:00:00');
  return isNaN(date.getTime()) ? 'Invalid' : date.toLocaleDateString('pt-BR');
};

/**
 * Retorna o "agora" local formatado para datetime-local (YYYY-MM-DDTHH:mm)
 */
export const getLocalNowISO = (): string => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
};
