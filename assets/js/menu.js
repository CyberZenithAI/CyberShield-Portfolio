// Script mejorado para funcionalidades del portafolio
document.addEventListener('DOMContentLoaded', function() {
    // Configuración global
    const CONFIG = {
        MOBILE_BREAKPOINT: 768,
        SCROLL_THRESHOLD: 300,
        MAX_WORDS: 500,
        WARNING_WORDS: 400
    };

    // Elementos del DOM
    const elements = {
        menuToggle: document.getElementById('menuToggle'),
        navLinks: document.getElementById('navLinks'),
        backToTopBtn: document.getElementById('backToTop'),
        contactForm: document.getElementById('contact-form'),
        formStatus: document.getElementById('form-status')
    };

    // Validar que los elementos esenciales existen
    if (!elements.menuToggle || !elements.navLinks) {
        console.error('Elementos esenciales del menú no encontrados');
        return;
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
            
            // Mejora de accesibilidad
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
            
            // Mover foco al principio de la página para accesibilidad
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
            
            if (this.form) {
                this.init();
            }
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Contador de palabras en tiempo real
            const messageTextarea = this.form.querySelector('#message');
            if (messageTextarea) {
                messageTextarea.addEventListener('input', () => this.countWords());
                
                // Inicializar contador
                this.countWords();
            }

            // Validación en tiempo real
            this.setupRealTimeValidation();
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

            // Validar campos requeridos
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

        async handleSubmit(event) {
            event.preventDefault();
            
            if (this.isSubmitting) return;
            
            // Validaciones finales
            if (!this.validateForm()) {
                return;
            }

            this.isSubmitting = true;
            const submitBtn = this.form.querySelector('#submit-btn');
            
            try {
                // Actualizar estado del botón
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                }

                // Preparar datos del formulario
                const formData = new FormData(this.form);
                formData.append('_subject', 'Nuevo mensaje desde Portafolio CiberElite');
                formData.append('_replyto', formData.get('email'));
                formData.append('_format', 'plain');

                // Enviar formulario
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
                    this.countWords(); // Resetear contador
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

        showStatus(message, type) {
            if (!this.status) return;
            
            this.status.textContent = message;
            this.status.className = `form-status ${type}`;
            this.status.setAttribute('role', 'alert');
            
            // Scroll al mensaje de estado
            this.status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Ocultar después de 5 segundos para mensajes de éxito
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
        // Inicializar menú móvil
        const mobileMenu = new MobileMenu(elements.menuToggle, elements.navLinks);
        
        // Inicializar botón volver arriba
        const backToTop = new BackToTop(elements.backToTopBtn);
        
        // Inicializar formulario de contacto
        const contactForm = new ContactForm(elements.contactForm, elements.formStatus);
        
        // Mejoras adicionales de rendimiento
        this.setupPerformanceOptimizations();
        
    } catch (error) {
        console.error('Error durante la inicialización:', error);
    }
});

// Optimizaciones de rendimiento
function setupPerformanceOptimizations() {
    // Usar Intersection Observer para elementos que aparecen al hacer scroll
    if ('IntersectionObserver' in window) {
        const lazyLoader = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Aquí puedes cargar contenido lazy cuando sea necesario
                    lazyLoader.unobserve(entry.target);
                }
            });
        });
    }

    // Throttle para eventos de scroll y resize
    function throttle(func, limit) {
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

    // Aplicar throttle a eventos pesados
    window.addEventListener('scroll', throttle(() => {}, 100));
    window.addEventListener('resize', throttle(() => {}, 100));
}

// Manejo de errores global
window.addEventListener('error', function(e) {
    console.error('Error global capturado:', e.error);
});

// Exportar para tests (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileMenu, BackToTop, ContactForm };
}
