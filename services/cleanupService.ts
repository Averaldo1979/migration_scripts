
/**
 * Serviço de Gerenciamento de Limpeza
 * Responsável por eliminar rastros temporários e liberar memória ao encerrar o sistema.
 */
export const cleanupTemporaryData = () => {
    try {
        // 1. Limpa o SessionStorage (dados voláteis da aba atual)
        sessionStorage.clear();

        // 2. Procura e limpa chaves de cache específicas que podem ser recriadas
        const keysToClean = ['temp_upload_cache', 'last_search_context'];
        keysToClean.forEach(key => localStorage.removeItem(key));

        // 3. O navegador limpa automaticamente ObjectURLs, mas forçamos uma sinalização
        console.log("🧹 Sistema de limpeza: Arquivos temporários e cache de sessão eliminados.");
    } catch (error) {
        console.error("Falha ao executar limpeza de encerramento:", error);
    }
};

/**
 * Hook para monitorar o fechamento do sistema
 */
export const useSystemCleanup = () => {
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', cleanupTemporaryData);
    }
};
