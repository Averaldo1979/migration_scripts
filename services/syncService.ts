
/**
 * O serviço de sincronização foi desativado conforme solicitação do usuário.
 * O sistema agora opera apenas em modo ONLINE.
 */
export const syncService = {
  init() {
    console.log('SyncService: Desativado (Modo Online-Only Ativado)');
  },
  isOnline: () => navigator.onLine,
  async addToQueue() { /* No-op */ },
  async trySync() { /* No-op */ },
  async processItem() { /* No-op */ },
  async syncFullData() { /* No-op */ },
  async hasPendingChanges() { return false; }
};
