// ========== CONFIGURACIÓN GLOBAL ==========
const CONFIG = {
    // Animación de red
    NODE_COUNT: 25,
    CONNECTION_THRESHOLD: 0.7,
    ANIMATION_DURATION: 20000,
    
    // Formulario
    MAX_WORDS: 500,
    WARNING_WORDS: 400,
    
    // Preloader
    PRELOADER_DELAY: 1000,
    
    // Cookies
    COOKIE_DELAY: 2000
};

// ========== CLASE PRINCIPAL DE LA APLICACIÓN ==========
class PortfolioApp {
    constructor() {
        this.isInitialized = false;
        this.components = {};
        this.init();
    }

    init() {
        try {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            window.addEventListener('load', () => this.handleWindowLoad());
            window.addEventListener('beforeunload', () => this.handleBeforeUnload());
            
            // Manejo global de errores
            window.addEventListener('error', (e) => this.handleGlobalError(e));
            window.addEventListener('unhandledrejection', (e) => this.handlePromiseRejection(e));
            
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
        }
    }

    initializeApp() {
        if (this.isInitialized) return;
        
        try {
            // Inicializar componentes en orden
            this.components.network = new NetworkAnimation();
            this.components.preloader = new Preloader();
            this.components.scrollProgress = new ScrollProgress();
            this.components.themeManager = new ThemeManager();
            this.components.counters = new AnimatedCounters();
            this.components.cookieConsent = new CookieConsent();
            this.components.contactForm = new ContactForm();
            
            this.setupConsoleMessage();
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error en initializeApp:', error);
        }
    }

    handleWindowLoad() {
        // Componentes que dependen de que la página esté completamente cargada
        setTimeout(() => {
            this.components.preloader?.hide();
        }, CONFIG.PRELOADER_DELAY);
    }

    handleBeforeUnload() {
        // Limpiar recursos antes de salir
        this.components.network?.cleanup();
    }

    handleGlobalError(event) {
        console.error('Error global:', event.error);
        // Aquí podrías enviar el error a un servicio de logging
    }

    handlePromiseRejection(event) {
        console.error('Promise rechazada:', event.reason);
        event.preventDefault();
    }

    setupConsoleMessage() {
        const styles = [
            'color: #049fd9; font-size: 14px; font-weight: bold;',
            'color: #00cc66; font-size: 12px;'
        ];
        
        console.log('%c🔒 ¿Buscas un especialista en ciberseguridad?', styles[0]);
        console.log('%c💼 Contáctame para oportunidades profesionales', styles[1]);
    }

    setupPerformanceMonitoring() {
        // Monitoring básico de performance
        if ('performance' in window) {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('⚡ Tiempo de carga:', Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms');
                }
            }, 0);
        }
    }
}

// ========== ANIMACIÓN DE RED ==========
class NetworkAnimation {
    constructor() {
        this.container = document.getElementById('networkAnimation');
        this.nodes = [];
        this.connections = [];
        this.animationId = null;
        this.init();
    }

    init() {
        if (!this.container) {
            console.warn('Contenedor de animación de red no encontrado');
            return;
        }

        try {
            this.createNodes();
            this.createConnections();
            this.startAnimation();
            this.setupResizeHandler();
        } catch (error) {
            console.error('Error inicializando NetworkAnimation:', error);
        }
    }

    createNodes() {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
            const node = document.createElement('div');
            node.className = 'network-node';
            node.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: rgba(4, 159, 217, 0.8);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                pointer-events: none;
                z-index: 1;
            `;
            
            this.nodes.push({
                element: node,
                x: Math.random() * 100,
                y: Math.random() * 100,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5
            });
            
            fragment.appendChild(node);
        }
        
        this.container.appendChild(fragment);
    }

    createConnections() {
        const fragment = document.createDocumentFragment();
        
        this.nodes.forEach((nodeA, indexA) => {
            this.nodes.forEach((nodeB, indexB) => {
                if (indexA >= indexB) return;
                
                const distance = this.calculateDistance(nodeA, nodeB);
                const maxDistance = 30; // Porcentaje del contenedor
                
                if (distance < maxDistance && Math.random() > CONFIG.CONNECTION_THRESHOLD) {
                    const connection = document.createElement('div');
                    connection.className = 'network-connection';
                    connection.style.cssText = `
                        position: absolute;
                        height: 1px;
                        background: rgba(4, 159, 217, 0.3);
                        transform-origin: 0 0;
                        pointer-events: none;
                        z-index: 0;
                    `;
                    
                    this.connections.push({
                        element: connection,
                        nodeA: nodeA,
                        nodeB: nodeB
                    });
                    
                    fragment.appendChild(connection);
                }
            });
        });
        
        this.container.appendChild(fragment);
    }

    calculateDistance(nodeA, nodeB) {
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    updateConnections() {
        this.connections.forEach(connection => {
            const dx = connection.nodeB.x - connection.nodeA.x;
            const dy = connection.nodeB.y - connection.nodeA.y;
            const distance = this.calculateDistance(connection.nodeA, connection.nodeB);
            
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            connection.element.style.width = `${distance * width / 100}px`;
            connection.element.style.left = `${connection.nodeA.x * width / 100}px`;
            connection.element.style.top = `${connection.nodeA.y * height / 100}px`;
            connection.element.style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
            
            // Opacity basada en distancia
            const opacity = 0.5 * (1 - distance / 30);
            connection.element.style.opacity = Math.max(0.1, opacity);
        });
    }

    animate() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.nodes.forEach(node => {
            // Actualizar posición
            node.x += node.vx;
            node.y += node.vy;
            
            // Rebote en bordes
            if (node.x <= 0 || node.x >= 100) node.vx *= -1;
            if (node.y <= 0 || node.y >= 100) node.vy *= -1;
            
            // Mantener dentro de los límites
            node.x = Math.max(0, Math.min(100, node.x));
            node.y = Math.max(0, Math.min(100, node.y));
            
            // Aplicar posición
            node.element.style.left = `${node.x}%`;
            node.element.style.top = `${node.y}%`;
        });
        
        this.updateConnections();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateConnections();
            }, 250);
        });
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// ========== PRELOADER ==========
class Preloader {
    constructor() {
        this.preloader = document.getElementById('preloader');
        this.init();
    }

    init() {
        if (!this.preloader) return;
        
        // Asegurar que el preloader se muestre inicialmente
        this.preloader.style.display = 'flex';
        this.preloader.style.opacity = '1';
    }

    hide() {
        if (!this.preloader) return;
        
        this.preloader.style.opacity = '0';
        setTimeout(() => {
            this.preloader.style.display = 'none';
        }, 500);
    }
}

// ========== BARRA DE PROGRESO DE SCROLL ==========
class ScrollProgress {
    constructor() {
        this.progressBar = document.getElementById('progress-bar');
        this.isActive = false;
        this.init();
    }

    init() {
        if (!this.progressBar) return;
        
        this.throttledScroll = this.throttle(() => this.updateProgress(), 16);
        window.addEventListener('scroll', this.throttledScroll);
        this.isActive = true;
    }

    updateProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        this.progressBar.style.width = `${scrolled}%`;
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    destroy() {
        if (this.throttledScroll) {
            window.removeEventListener('scroll', this.throttledScroll);
        }
    }
}

// ========== GESTOR DE TEMA ==========
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.currentTheme = this.getSavedTheme();
        this.init();
    }

    init() {
        if (!this.themeToggle) return;
        
        this.applyTheme(this.currentTheme);
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Escuchar cambios de tema del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.isThemeManuallySet()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    getSavedTheme() {
        const saved = localStorage.getItem('portfolio-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return saved || (systemPrefersDark ? 'dark' : 'light');
    }

    isThemeManuallySet() {
        return localStorage.getItem('portfolio-theme') !== null;
    }

    applyTheme(theme) {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        
        const icon = this.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.currentTheme = theme;
        localStorage.setItem('portfolio-theme', theme);
        
        // Actualizar meta theme-color
        this.updateThemeColor(isLight);
    }

    updateThemeColor(isLight) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const color = isLight ? '#ffffff' : '#1a1a1a';
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', color);
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
}

// ========== CONTADORES ANIMADOS ==========
class AnimatedCounters {
    constructor() {
        this.counters = {
            cert: { element: document.getElementById('cert-count'), target: 8 },
            project: { element: document.getElementById('project-count'), target: 12 },
            skill: { element: document.getElementById('skill-count'), target: 18 },
            client: { element: document.getElementById('client-count'), target: 5 }
        };
        this.hasAnimated = false;
        this.init();
    }

    init() {
        if (!this.hasCounters()) return;
        
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            { 
                threshold: 0.5,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            this.observer.observe(statsContainer);
        }
    }

    hasCounters() {
        return Object.values(this.counters).every(counter => counter.element);
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.hasAnimated) {
                this.animateAllCounters();
                this.hasAnimated = true;
                this.observer.disconnect();
            }
        });
    }

    animateAllCounters() {
        Object.values(this.counters).forEach(counter => {
            this.animateCounter(counter.element, counter.target, 2000);
        });
    }

    animateCounter(element, target, duration) {
        const startTime = performance.now();
        const startValue = 0;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function para animación más suave
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const value = Math.floor(easeOutQuart * (target - startValue) + startValue);
            
            element.textContent = value;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target; // Asegurar el valor final
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
}

// ========== CONSENTIMIENTO DE COOKIES ==========
class CookieConsent {
    constructor() {
        this.consentBanner = document.getElementById('cookie-consent');
        this.acceptBtn = document.getElementById('cookie-accept');
        this.declineBtn = document.getElementById('cookie-decline');
        this.init();
    }

    init() {
        if (!this.consentBanner || this.areCookiesAccepted()) return;
        
        setTimeout(() => {
            this.showBanner();
        }, CONFIG.COOKIE_DELAY);
        
        this.setupEventListeners();
    }

    areCookiesAccepted() {
        return localStorage.getItem('cookiesAccepted') === 'true';
    }

    showBanner() {
        this.consentBanner.classList.add('show');
        this.consentBanner.setAttribute('aria-hidden', 'false');
    }

    hideBanner() {
        this.consentBanner.classList.remove('show');
        this.consentBanner.setAttribute('aria-hidden', 'true');
    }

    setupEventListeners() {
        this.acceptBtn?.addEventListener('click', () => this.handleAccept());
        this.declineBtn?.addEventListener('click', () => this.handleDecline());
        
        // Mejorar accesibilidad
        this.consentBanner?.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleDecline();
            }
        });
    }

    handleAccept() {
        localStorage.setItem('cookiesAccepted', 'true');
        this.hideBanner();
        this.trackConsent(true);
    }

    handleDecline() {
        this.hideBanner();
        this.trackConsent(false);
    }

    trackConsent(accepted) {
        // Aquí podrías enviar el consentimiento a Google Analytics o similar
        console.log(`Consentimiento de cookies ${accepted ? 'aceptado' : 'rechazado'}`);
    }
}

// ========== FORMULARIO DE CONTACTO ==========
class ContactForm {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.statusElement = document.getElementById('form-status');
        this.isSubmitting = false;
        this.init();
    }

    init() {
        if (!this.form) return;
        
        this.setupWordCounter();
        this.setupRealTimeValidation();
        this.setupFormSubmission();
    }

    setupWordCounter() {
        const messageTextarea = this.form.querySelector('#message');
        if (messageTextarea) {
            messageTextarea.addEventListener('input', () => this.countWords());
            // Inicializar contador
            this.countWords();
        }
    }

    countWords() {
        const messageTextarea = this.form.querySelector('#message');
        const wordCounter = this.form.querySelector('#word-counter');
        const submitBtn = this.form.querySelector('#submit-btn');
        
        if (!messageTextarea || !wordCounter) return;

        const text = messageTextarea.value.trim();
        const wordCount = text === '' ? 0 : text.split(/\s+/).length;
        
        wordCounter.textContent = `${wordCount}/${CONFIG.MAX_WORDS} palabras`;
        wordCounter.className = 'word-counter';
        
        if (wordCount > CONFIG.MAX_WORDS) {
            wordCounter.classList.add('over-limit');
            if (submitBtn) submitBtn.disabled = true;
        } else if (wordCount > CONFIG.WARNING_WORDS) {
            wordCounter.classList.add('near-limit');
            if (submitBtn) submitBtn.disabled = false;
        } else {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    setupRealTimeValidation() {
        const emailField = this.form.querySelector('#email');
        if (emailField) {
            emailField.addEventListener('blur', () => this.validateEmailField(emailField));
        }

        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => this.validateRequiredField(field));
        });
    }

    validateEmailField(field) {
        if (field.value && !this.validateEmail(field.value)) {
            this.showFieldError(field, 'Por favor ingrese un email válido.');
        } else {
            this.clearFieldError(field);
        }
    }

    validateRequiredField(field) {
        if (!field.value.trim()) {
            this.showFieldError(field, 'Este campo es obligatorio.');
        } else {
            this.clearFieldError(field);
        }
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('error');
        
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isSubmitting) {
            this.showStatus('Por favor espera...', 'warning');
            return;
        }
        
        if (!this.validateForm()) {
            return;
        }

        this.isSubmitting = true;
        const submitBtn = this.form.querySelector('#submit-btn');
        
        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            }

            const formData = new FormData(this.form);
            formData.append('_subject', 'Nuevo mensaje desde Portafolio CiberElite');
            formData.append('_replyto', formData.get('email'));
            formData.append('_format', 'plain');

            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.showStatus('¡Mensaje enviado con éxito! Me pondré en contacto contigo pronto.', 'success');
                this.form.reset();
                this.countWords();
                this.clearAllFieldErrors();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

        } catch (error) {
            console.error('Error en el envío:', error);
            this.showStatus(
                'Oops! Hubo un problema al enviar tu mensaje. Por favor, intenta nuevamente.', 
                'error'
            );
        } finally {
            this.isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensaje';
            }
        }
    }

    validateForm() {
        let isValid = true;
        
        // Validar campos requeridos
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'Este campo es obligatorio.');
                isValid = false;
            }
        });

        // Validar email
        const emailField = this.form.querySelector('#email');
        if (emailField && emailField.value && !this.validateEmail(emailField.value)) {
            this.showFieldError(emailField, 'Por favor ingrese un email válido.');
            isValid = false;
        }

        // Validar límite de palabras
        const messageField = this.form.querySelector('#message');
        if (messageField) {
            const text = messageField.value.trim();
            const wordCount = text === '' ? 0 : text.split(/\s+/).length;
            
            if (wordCount > CONFIG.MAX_WORDS) {
                this.showFieldError(messageField, `El mensaje excede el límite de ${CONFIG.MAX_WORDS} palabras.`);
                isValid = false;
            }
        }

        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(String(email).toLowerCase());
    }

    clearAllFieldErrors() {
        const fields = this.form.querySelectorAll('.error');
        fields.forEach(field => this.clearFieldError(field));
    }

    showStatus(message, type) {
        if (!this.statusElement) return;
        
        this.statusElement.textContent = message;
        this.statusElement.className = `form-status ${type}`;
        this.statusElement.setAttribute('role', 'alert');
        
        // Scroll suave al mensaje
        this.statusElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-ocultar para mensajes de éxito
        if (type === 'success') {
            setTimeout(() => {
                this.statusElement.textContent = '';
                this.statusElement.className = 'form-status';
            }, 5000);
        }
    }
}

// ========== INICIALIZACIÓN DE LA APLICACIÓN ==========
// Inicializar la aplicación cuando el script se carga
const portfolioApp = new PortfolioApp();

// Exportar para tests (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PortfolioApp,
        NetworkAnimation,
        ThemeManager,
        ContactForm,
        AnimatedCounters
    };
}
