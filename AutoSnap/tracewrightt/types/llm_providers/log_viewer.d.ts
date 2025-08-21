export declare class LogViewer {
    private logDir;
    constructor();
    /**
     * Display a summary of all API calls
     */
    showSummary(): void;
    /**
     * Display detailed logs for a specific provider
     */
    showDetailedLogs(provider?: 'gemini' | 'openai'): void;
    /**
     * Show the latest API call details
     */
    showLatestCall(provider?: 'gemini' | 'openai'): void;
    /**
     * Export logs to a readable format
     */
    exportLogs(provider?: 'gemini' | 'openai', format?: 'json' | 'txt'): void;
    /**
     * Clear all logs
     */
    clearLogs(provider?: 'gemini' | 'openai'): void;
}
