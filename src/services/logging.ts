// Singleton para logging
export class Logger {
    private static instance: Logger;
    private constructor() {}
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    public log(message: string): void {
        const event = new CustomEvent('log-message', { detail: message });
        window.dispatchEvent(event);
    }
}