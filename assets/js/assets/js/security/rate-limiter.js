/**
 * Sistema Avanzado de Limitación de Tasas
 * Protección contra ataques de fuerza bruta y DDoS
 */

class AdvancedRateLimiter {
    constructor() {
        this.attempts = new Map();
        this.maxAttempts = 5;
        this.timeWindow = 15 * 60 * 1000; // 15 minutos
        this.penaltyBox = new Map();
    }

    // Verificación de intentos
    checkAttempt(identifier) {
        this.cleanupOldAttempts();

        if (this.penaltyBox.has(identifier)) {
            return { allowed: false, reason: 'IP en lista de bloqueo' };
        }

        const userAttempts = this.attempts.get(identifier) || [];
        const recentAttempts = userAttempts.filter(
            attempt => Date.now() - attempt < this.timeWindow
        );

        if (recentAttempts.length >= this.maxAttempts) {
            this.addToPenaltyBox(identifier);
            return { allowed: false, reason: 'Límite de intentos excedido' };
        }

        userAttempts.push(Date.now());
        this.attempts.set(identifier, userAttempts);

        return { allowed: true, remaining: this.maxAttempts - recentAttempts.length - 1 };
    }

    // Añadir a lista de bloqueo
    addToPenaltyBox(identifier) {
        this.penaltyBox.set(identifier, Date.now());
        
        // Auto-eliminación después de 1 hora
        setTimeout(() => {
            this.penaltyBox.delete(identifier);
        }, 60 * 60 * 1000);
    }

    // Limpieza de intentos antiguos
    cleanupOldAttempts() {
        const now = Date.now();
        
        for (const [identifier, attempts] of this.attempts.entries()) {
            const recentAttempts = attempts.filter(
                attempt => now - attempt < this.timeWindow
            );
            
            if (recentAttempts.length === 0) {
                this.attempts.delete(identifier);
            } else {
                this.attempts.set(identifier, recentAttempts);
            }
        }
    }
}
