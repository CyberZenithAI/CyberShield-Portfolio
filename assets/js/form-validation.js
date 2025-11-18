// ========== FORM VALIDATION CLASS ==========
class FormValidator {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.statusElement = document.getElementById('form-status');
        this.isSubmitting = false;
        this.config = {
            maxChars: 1000,
            warningChars: 800,
            minMessageLength: 10,
            minNameLength: 2,
            debounceDelay: 300
        };
        
        this.init();
    }

    init() {
        if (!this.form) {
            console.warn('Formulario de contacto no encontrado');
            return;
        }

        try {
            this.setupEventListeners();
            this.setupRealTimeValidation();
            this.setupCharacterCounter();
            this.setupAccessibility();
            console.log('✅ FormValidator inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando FormValidator:', error);
        }
    }

    setupEventListeners() {
        // Evento de envío del formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Evento para sincronizar email con campo oculto
        const emailField = this.form.querySelector('#email');
        if (emailField) {
            emailField.addEventListener('change', (e) => {
                document.getElementById('email-reply').value = e.target.value;
            });
        }

        // Prevenir envío con Enter en campos no submit
        this.form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                e.preventDefault();
            }
        });
    }

    setupRealTimeValidation() {
        // Validación en tiempo real para campos requeridos
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });

        // Validación específica para email
        const emailField = this.form.querySelector('#email');
        if (emailField) {
            emailField.addEventListener('blur', () => this.validateEmailField(emailField));
        }

        // Validación específica para textarea
        const messageField = this.form.querySelector('#message');
        if (messageField) {
            messageField.addEventListener('blur', () => this.validateMessageField(messageField));
            messageField.addEventListener('input', this.debounce(() => this.updateCharacterCounter(), this.config.debounceDelay));
        }
    }

    setupCharacterCounter() {
        this.updateCharacterCounter();
    }

    setupAccessibility() {
        // Mejorar accesibilidad de los campos
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            const label = field.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                if (!label.querySelector('.required-asterisk')) {
                    const asterisk = document.createElement('span');
                    asterisk.className = 'required-asterisk';
                    asterisk.textContent = ' *';
                    asterisk.setAttribute('aria-hidden', 'true');
                    label.appendChild(asterisk);
                }
            }
            
            field.setAttribute('aria-required', 'true');
        });

        // Agregar descripciones para screen readers
        const messageField = this.form.querySelector('#message');
        if (messageField) {
            messageField.setAttribute('aria-describedby', 'word-counter char-limit');
        }
    }

    // ========== VALIDATION METHODS ==========
    validateField(field) {
        const value = field.value.trim();
        
        switch (field.id) {
            case 'name':
                return this.validateNameField(field, value);
            case 'email':
                return this.validateEmailField(field, value);
            case 'subject':
                return this.validateSelectField(field, value);
            case 'message':
                return this.validateMessageField(field, value);
            default:
                return this.validateRequiredField(field, value);
        }
    }

    validateNameField(field, value) {
        if (!value) {
            this.showFieldError(field, 'El nombre completo es obligatorio.');
            return false;
        }
        
        if (value.length < this.config.minNameLength) {
            this.showFieldError(field, `El nombre debe tener al menos ${this.config.minNameLength} caracteres.`);
            return false;
        }

        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(value)) {
            this.showFieldError(field, 'El nombre solo puede contener letras y espacios.');
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    validateEmailField(field, value) {
        if (!value) {
            this.showFieldError(field, 'El correo electrónico es obligatorio.');
            return false;
        }

        if (!this.isValidEmail(value)) {
            this.showFieldError(field, 'Por favor ingrese un correo electrónico válido.');
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    validateSelectField(field, value) {
        if (!value) {
            this.showFieldError(field, 'Por favor selecciona un asunto.');
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    validateMessageField(field, value) {
        if (!value) {
            this.showFieldError(field, 'El mensaje es obligatorio.');
            return false;
        }

        if (value.length < this.config.minMessageLength) {
            this.showFieldError(field, `El mensaje debe tener al menos ${this.config.minMessageLength} caracteres.`);
            return false;
        }

        if (value.length > this.config.maxChars) {
            this.showFieldError(field, `El mensaje no puede exceder ${this.config.maxChars} caracteres.`);
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    validateRequiredField(field, value) {
        if (!value) {
            this.showFieldError(field, 'Este campo es obligatorio.');
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(String(email).toLowerCase());
    }

    // ========== CHARACTER COUNTER ==========
    updateCharacterCounter() {
        const messageField = this.form.querySelector('#message');
        const wordCounter = this.form.querySelector('#word-counter');
        
        if (!messageField || !wordCounter) return;

        const text = messageField.value;
        const charCount = text.length;
        
        wordCounter.textContent = `${charCount}/${this.config.maxChars} caracteres`;
        wordCounter.className = 'word-counter';
        
        // Actualizar clases según el límite
        if (charCount > this.config.maxChars) {
            wordCounter.classList.add('over-limit');
        } else if (charCount > this.config.warningChars) {
            wordCounter.classList.add('near-limit');
        }
        
        // Actualizar atributos de accesibilidad
        messageField.setAttribute('aria-invalid', charCount > this.config.maxChars ? 'true' : 'false');
    }

    // ========== FORM SUBMISSION ==========
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.isSubmitting) {
            this.showStatus('Por favor espera... estamos procesando tu envío anterior.', 'warning');
            return;
        }

        // Validar todos los campos antes del envío
        if (!this.validateForm()) {
            this.showStatus('Por favor corrige los errores en el formulario antes de enviar.', 'error');
            this.focusFirstInvalidField();
            return;
        }

        this.isSubmitting = true;
        this.setSubmitButtonState(true);

        try {
            const formData = new FormData(this.form);
            
            // Asegurar que los campos ocultos estén actualizados
            formData.set('_subject', `Nuevo mensaje desde Portafolio - Joaquín Ocampo: ${formData.get('subject')}`);
            formData.set('_replyto', formData.get('email'));

            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.handleSuccess();
            } else {
                throw new Error(`Error HTTP: ${response.status}`);
            }

        } catch (error) {
            console.error('Error enviando formulario:', error);
            this.handleError(error);
        } finally {
            this.isSubmitting = false;
            this.setSubmitButtonState(false);
        }
    }

    validateForm() {
        let isValid = true;
        const fieldsToValidate = [
            'name', 'email', 'subject', 'message'
        ];

        fieldsToValidate.forEach(fieldId => {
            const field = this.form.querySelector(`#${fieldId}`);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    focusFirstInvalidField() {
        const firstInvalidField = this.form.querySelector('.error');
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
    }

    setSubmitButtonState(isSubmitting) {
        const submitBtn = this.form.querySelector('#submit-btn');
        const loadingSpinner = this.form.querySelector('#loading-spinner');
        
        if (submitBtn) {
            submitBtn.disabled = isSubmitting;
            
            if (isSubmitting) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                submitBtn.setAttribute('aria-label', 'Enviando mensaje, por favor espera');
            } else {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensaje';
                submitBtn.setAttribute('aria-label', 'Enviar mensaje');
            }
        }

        if (loadingSpinner) {
            loadingSpinner.style.display = isSubmitting ? 'block' : 'none';
        }
    }

    handleSuccess() {
        this.showStatus('¡Mensaje enviado con éxito! Te contactaré pronto. Redirigiendo...', 'success');
        
        // Resetear formulario
        this.form.reset();
        this.updateCharacterCounter();
        this.clearAllFieldErrors();
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = this.form.querySelector('input[name="_next"]').value;
        }, 2000);
    }

    handleError(error) {
        let errorMessage = 'Oops! Hubo un problema al enviar tu mensaje. ';
        
        if (!navigator.onLine) {
            errorMessage += 'Parece que no tienes conexión a internet.';
        } else if (error.message.includes('500')) {
            errorMessage += 'Error del servidor. Por favor, intenta más tarde.';
        } else {
            errorMessage += 'Por favor, verifica tu conexión e intenta nuevamente.';
        }
        
        this.showStatus(errorMessage, 'error');
    }

    // ========== ERROR HANDLING ==========
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.id = `${field.id}-error`;
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'polite');
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        field.setAttribute('aria-invalid', 'false');
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    clearAllFieldErrors() {
        const errorFields = this.form.querySelectorAll('.error');
        errorFields.forEach(field => this.clearFieldError(field));
        
        const errorMessages = this.form.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
    }

    // ========== STATUS MESSAGES ==========
    showStatus(message, type) {
        if (!this.statusElement) return;
        
        this.statusElement.textContent = message;
        this.statusElement.className = `form-status ${type}`;
        this.statusElement.setAttribute('role', 'alert');
        this.statusElement.setAttribute('aria-live', 'polite');
        
        // Scroll suave al mensaje de estado
        this.statusElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
        
        // Auto-ocultar para mensajes de éxito y warning
        if (type === 'success' || type === 'warning') {
            setTimeout(() => {
                this.clearStatus();
            }, type === 'success' ? 5000 : 8000);
        }
    }

    clearStatus() {
        if (this.statusElement) {
            this.statusElement.textContent = '';
            this.statusElement.className = 'form-status';
        }
    }

    // ========== UTILITY METHODS ==========
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ========== PUBLIC METHODS ==========
    resetForm() {
        this.form.reset();
        this.clearAllFieldErrors();
        this.clearStatus();
        this.updateCharacterCounter();
    }

    validateFormAsync() {
        return new Promise((resolve) => {
            const isValid = this.validateForm();
            resolve(isValid);
        });
    }
}

// ========== GLOBAL FUNCTIONS FOR HTML ATTRIBUTES ==========
// Función global para el contador de caracteres (usada en el atributo oninput)
function countWords() {
    const formValidator = window.contactFormValidator;
    if (formValidator && typeof formValidator.updateCharacterCounter === 'function') {
        formValidator.updateCharacterCounter();
    }
}

// ========== INITIALIZATION ==========
// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.contactFormValidator = new FormValidator();
    
    // Exponer funciones globales para retrocompatibilidad
    window.countWords = countWords;
});

// ========== EXPORTS FOR TESTING ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator };
}
