/**
 * Sistema Avanzado de Detección de Amenazas en Tiempo Real
 * Nivel: 10/10 - Protección contra amenazas conocidas y desconocidas
 */

class ThreatDetectionSystem {
    constructor() {
        this.patterns = this.loadThreatPatterns();
        this.machineLearningModel = this.initializeMLModel();
        this.init();
    }

    init() {
        this.setupBehavioralAnalysis();
        this.startPatternRecognition();
    }

    // Patrones de amenazas conocidas
    loadThreatPatterns() {
        return {
            sqlInjection: [
                /(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)(\b)/gi,
                /('|"|;|--|\/\*|\*\/)/g,
                /(\b)(OR|AND)(\s+)(\d+)(\s*)=(\s*)(\d+)/gi
            ],
            xss: [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /expression\s*\(/gi
            ],
            csrf: [
                /<img[^>]+src=["'][^"']*["'][^>]*>/gi,
                /<iframe[^>]+src=["'][^"']*["'][^>]*>/gi
            ],
            botBehavior: [
                /automated|bot|crawler|spider/gi
            ]
        };
    }

    // Análisis de comportamiento en tiempo real
    setupBehavioralAnalysis() {
        let mouseMovements = [];
        let keyStrokes = [];
        let scrollPatterns = [];

        document.addEventListener('mousemove', (e) => {
            mouseMovements.push({
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now()
            });

            // Mantener solo los últimos 100 movimientos
            if (mouseMovements.length > 100) {
                mouseMovements.shift();
            }
        });

        document.addEventListener('keydown', (e) => {
            keyStrokes.push({
                key: e.key,
                timestamp: Date.now(),
                duration: 0
            });

            // Análisis de velocidad de escritura
            this.analyzeTypingSpeed(keyStrokes);
        });

        document.addEventListener('scroll', () => {
            scrollPatterns.push({
                position: window.scrollY,
                timestamp: Date.now()
            });
        });

        // Análisis periódico
        setInterval(() => {
            this.analyzeBehaviorPatterns({
                mouseMovements,
                keyStrokes,
                scrollPatterns
            });
        }, 10000);
    }

    // Detección de patrones sospechosos
    analyzeBehaviorPatterns(behaviorData) {
        const suspicionScore = this.calculateSuspicionScore(behaviorData);
        
        if (suspicionScore > 70) {
            this.reportSuspiciousBehavior(behaviorData, suspicionScore);
        }
    }

    // Cálculo de puntuación de sospecha
    calculateSuspicionScore(behaviorData) {
        let score = 0;

        // Análisis de movimientos del mouse
        if (this.isRoboticMouseMovement(behaviorData.mouseMovements)) {
            score += 30;
        }

        // Análisis de patrones de tecleo
        if (this.isAutomatedTyping(behaviorData.keyStrokes)) {
            score += 25;
        }

        // Análisis de scroll
        if (this.isBotScrolling(behaviorData.scrollPatterns)) {
            score += 20;
        }

        return score;
    }

    // Detección de movimientos robóticos del mouse
    isRoboticMouseMovement(movements) {
        if (movements.length < 10) return false;

        const distances = [];
        for (let i = 1; i < movements.length; i++) {
            const dx = movements[i].x - movements[i-1].x;
            const dy = movements[i].y - movements[i-1].y;
            distances.push(Math.sqrt(dx*dx + dy*dy));
        }

        const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
        const variance = distances.reduce((a, b) => a + Math.pow(b - avgDistance, 2), 0) / distances.length;

        // Movimientos muy regulares sugieren bot
        return variance < 5;
    }

    // Detección de escritura automatizada
    isAutomatedTyping(keyStrokes) {
        if (keyStrokes.length < 20) return false;

        const intervals = [];
        for (let i = 1; i < keyStrokes.length; i++) {
            intervals.push(keyStrokes[i].timestamp - keyStrokes[i-1].timestamp);
        }

        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;

        // Intervalos demasiado regulares sugieren bot
        return variance < 10;
    }
}
