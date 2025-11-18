// Script mejorado para funcionalidades del portafolio con manejo de errores HTTP
document.addEventListener('DOMContentLoaded', function() {
    // Configuración global
    const CONFIG = {
        MOBILE_BREAKPOINT: 768,
        SCROLL_THRESHOLD: 300,
        MAX_WORDS: 500,
        WARNING_WORDS: 400,
        ERROR_PAGES: {
            404: '/errors/404.html',
            500: '/errors/500.html',
            403: '/errors/403.html',
            400: '/errors/400.html',
            OFFLINE: '/errors/offline.html',
            MAINTENANCE: '/errors/maintenance.html',
            GENERIC: '/errors/error.html'
        },
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    };

    // Elementos del DOM
    const elements = {
        menuToggle: document.getElementById('menuToggle'),
        navLinks: document.getElementById('navLinks'),
        backToTopBtn: document.getElementById('backToTop'),
        contactForm: document.getElementById('contact-form'),
        formStatus: document.getElementById('form-status')
    };

    // ========== MANEJADOR GLOBAL DE ERRORES ==========
    class ErrorHandler {
        constructor() {
            this.init();
        }

        init() {
            // Manejar errores de JavaScript
            window.addEventListener('error', (e) => this.handleRuntimeError(e));
            window.addEventListener('unhandledrejection', (e) => this.handlePromiseRejection(e));
            
            // Manejar estado de conexión
            window.addEventListener('online', () => this.handleOnlineStatus());
            window.addEventListener('offline', () => this.handleOfflineStatus());
            
            // Interceptar fetch errors
            this.interceptFetch();
            
            // Manejar errores de recursos
            this.handleResourceErrors();
        }

        handleRuntimeError(error) {
            console.error('Error de runtime:', error);
            
            // No redirigir por errores menores, solo registrar
            if (this.isMinorError(error)) {
                return;
            }
            
            this.redirectToErrorPage(500, {
                error: error.message,
                file: error.filename,
                line: error.lineno,
                column: error.colno
            });
        }

        handlePromiseRejection(event) {
            console.error('Promise rechazada:', event.reason);
            
            // Para errores de red en promesas
            if (event.reason && event.reason.name === 'TypeError' && 
                event.reason.message.includes('fetch')) {
                this.redirectToErrorPage('OFFLINE');
                return;
            }
            
            this.logError({
                type: 'PROMISE_REJECTION',
                reason: event.reason?.message || 'Unknown promise rejection',
                stack: event.reason?.stack
            });
        }

        handleOnlineStatus() {
            // Ocultar cualquier notificación de offline
            this.hideOfflineNotification();
            console.log('Conexión restaurada');
        }

        handleOfflineStatus() {
            this.showOfflineNotification();
            console.warn('Sin conexión a internet');
        }

        showOfflineNotification() {
            // Crear notificación de offline
            const notification = document.createElement('div');
            notification.id = 'offline-notification';
            notification.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff6b6b; color: white; padding: 10px; text-align: center; z-index: 10000;">
                    <i class="fas fa-wifi"></i> Sin conexión a internet. Algunas funciones pueden no estar disponibles.
                </div>
            `;
            document.body.appendChild(notification);
        }

        hideOfflineNotification() {
            const notification = document.getElementById('offline-notification');
            if (notification) {
                notification.remove();
            }
        }

        interceptFetch() {
            const originalFetch = window.fetch;
            const self = this;

            window.fetch = function(...args) {
                return originalFetch.apply(this, args)
                    .then(response => {
                        if (!response.ok) {
                            self.handleHttpError(response);
                        }
                        return response;
                    })
                    .catch(error => {
                        console.error('Error en fetch:', error);
                        self.handleNetworkError(error);
                        throw error;
                    });
            };
        }

        handleHttpError(response) {
            console.error(`Error HTTP ${response.status}: ${response.statusText}`);
            
            const errorData = {
                url: response.url,
                status: response.status,
                statusText: response.statusText
            };

            // Redirigir según el código de error
            switch (response.status) {
                case 400:
                    this.redirectToErrorPage(400, errorData);
                    break;
                case 403:
                    this.redirectToErrorPage(403, errorData);
                    break;
                case 404:
                    this.redirectToErrorPage(404, errorData);
                    break;
                case 500:
                case 502:
                case 503:
                    this.redirectToErrorPage(500, errorData);
                    break;
                default:
                    this.redirectToErrorPage('GENERIC', errorData);
            }
        }

        handleNetworkError(error) {
            if (!navigator.onLine) {
                this.redirectToErrorPage('OFFLINE', {
                    error: error.message
                });
            } else {
                this.redirectToErrorPage('GENERIC', {
                    error: error.message,
                    type: 'NETWORK_ERROR'
                });
            }
        }

        handleResourceErrors() {
            document.addEventListener('DOMContentLoaded', () => {
                const resources = document.querySelectorAll('img, script, link[rel="stylesheet"]');
                
                resources.forEach(resource => {
                    resource.addEventListener('error', (e) => {
                        console.error(`Error cargando recurso: ${e.target.src || e.target.href}`);
                        
                        // Para imágenes, mostrar imagen de placeholder
                        if (e.target.tagName === 'IMG') {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+';
                            e.target.alt = 'Imagen no disponible';
                        }
                    });
                });
            });
        }

        redirectToErrorPage(errorType, errorData = {}) {
            // Prevenir redirecciones múltiples
            if (sessionStorage.getItem('errorRedirected') === 'true') {
                return;
            }

            const errorPage = CONFIG.ERROR_PAGES[errorType] || CONFIG.ERROR_PAGES.GENERIC;
            
            // Guardar información del error para la página de destino
            sessionStorage.setItem('lastError', JSON.stringify({
                type: errorType,
                data: errorData,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            }));

            sessionStorage.setItem('errorRedirected', 'true');

            // Redirigir a la página de error
            setTimeout(() => {
                window.location.href = errorPage;
            }, 100);
        }

        isMinorError(error) {
            // Errores que no requieren redirección
            const minorErrors = [
                'Script error',
                'ResizeObserver loop',
                'Loading CSS'
            ];
            
            return minorErrors.some(minorError => 
                error.message && error.message.includes(minorError)
            );
        }

        logError(errorInfo) {
            // Enviar errores a un servicio de logging si está disponible
            if (typeof gtag !== 'undefined') {
                gtag('event', 'exception', {
                    description: errorInfo.reason || errorInfo.error,
                    fatal: false
                });
            }
            
            // También guardar en localStorage para debugging
            const errors = JSON.parse(localStorage.getItem('clientErrors') || '[]');
            errors.push({
                ...errorInfo,
                timestamp: new Date().toISOString()
            });
            
            // Mantener solo los últimos 10 errores
            if (errors.length > 10) {
                errors.shift();
            }
            
            localStorage.setItem('clientErrors', JSON.stringify(errors));
        }
    }

    // ========== MENÚ DESPLEGABLE ==========
    class MobileMenu {
        constructor(toggleElement, menuElement) {
            this.toggle = toggleElement;
            this.menu = menuElement;
            this.navItems = menuElement.querySelectorAll('a');
            this.isOpen = false;
            
            this.init();
        }

        init() {
            if (!this.toggle || !this.menu) {
                console.error('Elementos del menú no encontrados');
                return;
            }

            this.toggle.addEventListener('click', () => this.toggleMenu());
            this.navItems.forEach(item => {
                item.addEventListener('click', () => this.closeOnLinkClick());
            });
            
            window.addEventListener('resize', () => this.handleResize());
            document.addEventListener('click', (e) => this.handleOutsideClick(e));
            document.addEventListener('keydown', (e) => this.handleEscapeKey(e));
        }

        toggleMenu() {
            this.isOpen = !this.isOpen;
            this.toggle.classList.toggle('active', this.isOpen);
            this.menu.classList.toggle('active', this.isOpen);
            this.toggle.setAttribute('aria-expanded', this.isOpen);
        }

        closeMenu() {
            this.isOpen = false;
            this.toggle.classList.remove('active');
            this.menu.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
        }

        closeOnLinkClick() {
            if (window.innerWidth <= CONFIG.MOBILE_BREAKPOINT) {
                this.closeMenu();
            }
        }

        handleResize() {
            if (window.innerWidth > CONFIG.MOBILE_BREAKPOINT) {
                this.closeMenu();
            }
        }

        handleOutsideClick(event) {
            if (this.isOpen && 
                !this.menu.contains(event.target) && 
                !this.toggle.contains(event.target)) {
                this.closeMenu();
            }
        }

        handleEscapeKey(event) {
            if (this.isOpen && event.key === 'Escape') {
                this.closeMenu();
            }
        }
    }

    // ========== BOTÓN VOLVER ARRIBA ==========
    class BackToTop {
        constructor(button) {
            this.button = button;
            this.isVisible = false;
            
            this.init();
        }

        init() {
            if (!this.button) return;

            this.button.addEventListener('click', () => this.scrollToTop());
            window.addEventListener('scroll', () => this.toggleVisibility());
            
            this.button.setAttribute('aria-label', 'Volver al inicio de la página');
        }

        toggleVisibility() {
            const shouldBeVisible = window.pageYOffset > CONFIG.SCROLL_THRESHOLD;
            
            if (shouldBeVisible !== this.isVisible) {
                this.isVisible = shouldBeVisible;
                this.button.classList.toggle('visible', this.isVisible);
                this.button.setAttribute('aria-hidden', !this.isVisible);
            }
        }

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            const mainContent = document.querySelector('main') || document.body;
            mainContent.setAttribute('tabindex', '-1');
            mainContent.focus();
            mainContent.removeAttribute('tabindex');
        }
    }

    // ========== FORMULARIO DE CONTACTO ==========
    class ContactForm {
        constructor(formElement, statusElement) {
            this.form = formElement;
            this.status = statusElement;
            this.isSubmitting = false;
            this.retryCount = 0;
            
            if (this.form) {
                this.init();
            }
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            const messageTextarea = this.form.querySelector('#message');
            if (messageTextarea) {
                messageTextarea.addEventListener('input', () => this.countWords());
                this.countWords();
            }

            this.setupRealTimeValidation();
        }

        async handleSubmit(event) {
            event.preventDefault();
            
            if (this.isSubmitting) return;
            
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

                const response = await this.sendWithRetry(this.form.action, formData);

                if (response.ok) {
                    this.showStatus('¡Mensaje enviado con éxito! Me pondré en contacto contigo pronto.', 'success');
                    this.form.reset();
                    this.countWords();
                    this.retryCount = 0;
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

            } catch (error) {
                console.error('Error en el envío:', error);
                
                if (this.retryCount < CONFIG.RETRY_ATTEMPTS) {
                    this.retryCount++;
                    this.showStatus(`Reintentando envío... (${this.retryCount}/${CONFIG.RETRY_ATTEMPTS})`, 'warning');
                    setTimeout(() => this.handleSubmit(event), CONFIG.RETRY_DELAY);
                    return;
                }

                this.showStatus(
                    'Oops! Hubo un problema al enviar tu mensaje. Por favor, intenta nuevamente más tarde.', 
                    'error'
                );
                this.retryCount = 0;
            } finally {
                this.isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensaje';
                }
            }
        }

        async sendWithRetry(url, formData) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                return response;
            } catch (error) {
                if (this.retryCount < CONFIG.RETRY_ATTEMPTS) {
                    await this.delay(CONFIG.RETRY_DELAY);
                    return this.sendWithRetry(url, formData);
                }
                throw error;
            }
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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
                emailField.addEventListener('blur', () => {
                    if (emailField.value && !this.validateEmail(emailField.value)) {
                        this.showFieldError(emailField, 'Por favor ingrese un email válido.');
                    } else {
                        this.clearFieldError(emailField);
                    }
                });
            }

            const requiredFields = this.form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                field.addEventListener('blur', () => {
                    if (!field.value.trim()) {
                        this.showFieldError(field, 'Este campo es obligatorio.');
                    } else {
                        this.clearFieldError(field);
                    }
                });
            });
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

        validateForm() {
            let isValid = true;
            
            const requiredFields = this.form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    this.showFieldError(field, 'Este campo es obligatorio.');
                    isValid = false;
                }
            });

            const emailField = this.form.querySelector('#email');
            if (emailField && emailField.value && !this.validateEmail(emailField.value)) {
                this.showFieldError(emailField, 'Por favor ingrese un email válido.');
                isValid = false;
            }

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

        showStatus(message, type) {
            if (!this.status) return;
            
            this.status.textContent = message;
            this.status.className = `form-status ${type}`;
            this.status.setAttribute('role', 'alert');
            
            this.status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            if (type === 'success') {
                setTimeout(() => {
                    this.status.textContent = '';
                    this.status.className = 'form-status';
                }, 5000);
            }
        }
    }

    // ========== INICIALIZACIÓN ==========
    try {
        // Inicializar manejador de errores primero
        const errorHandler = new ErrorHandler();
        
        // Inicializar componentes
        const mobileMenu = new MobileMenu(elements.menuToggle, elements.navLinks);
        const backToTop = new BackToTop(elements.backToTopBtn);
        const contactForm = new ContactForm(elements.contactForm, elements.formStatus);
        
        // Limpiar flag de redirección de error al cargar la página
        sessionStorage.removeItem('errorRedirected');
        
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        // En caso de error crítico en inicialización
        errorHandler.redirectToErrorPage(500, {
            error: 'Initialization Error',
            message: error.message
        });
    }
});

// Código para las páginas de error - se ejecuta solo en páginas de error
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('/errors/')) {
        initializeErrorPage();
    }
});

function initializeErrorPage() {
    // Recuperar información del error
    const errorData = JSON.parse(sessionStorage.getItem('lastError') || '{}');
    
    // Mostrar información del error en la página (para debugging)
    const errorDetails = document.getElementById('error-details');
    if (errorDetails && errorData) {
        errorDetails.textContent = `Error ${errorData.type} - ${new Date(errorData.timestamp).toLocaleString()}`;
    }
    
    // Botón de volver atrás
    const backButton = document.getElementById('error-back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            history.back();
        });
    }
    
    // Botón de recargar
    const reloadButton = document.getElementById('error-reload-button');
    if (reloadButton) {
        reloadButton.addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    // Botón de ir al inicio
    const homeButton = document.getElementById('error-home-button');
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    
    // Limpiar datos del error después de mostrarlos
    setTimeout(() => {
        sessionStorage.removeItem('lastError');
    }, 5000);
}
