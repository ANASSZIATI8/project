// Main JavaScript file for Online Examination System
document.addEventListener('DOMContentLoaded', function() {
    // ===== GENERAL FUNCTIONS =====
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Toggle mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Close alerts
    document.querySelectorAll('.alert-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    });

    // Auto-hide flash messages after 5 seconds
    setTimeout(function() {
        document.querySelectorAll('.alert').forEach(alert => {
            if (!alert.querySelector('.alert-close').closest('.alert').classList.contains('alert-danger')) {
                alert.style.opacity = '0';
                setTimeout(() => { alert.style.display = 'none'; }, 500);
            }
        });
    }, 5000);

    // ===== REGISTRATION FORM VALIDATION =====
    
    // Check if we're on the registration page
    const registerForm = document.querySelector('.auth-form');
    if (registerForm && window.location.pathname === '/register') {
        
        // Form elements
        const formSections = document.querySelectorAll('.form-section');
        const progressSteps = document.querySelectorAll('.step');
        const nextBtns = document.querySelectorAll('.next-btn');
        const backBtns = document.querySelectorAll('.back-btn');
        let currentStep = 0;

        // Password elements
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const passwordStrengthBar = document.querySelector('.password-strength-bar');
        const passwordRequirements = document.querySelectorAll('.password-requirements li');

        // Show specific step
        function showStep(n) {
            formSections.forEach(section => section.classList.remove('active'));
            progressSteps.forEach(step => step.classList.remove('active'));
            
            formSections[n].classList.add('active');
            
            for (let i = 0; i <= n; i++) {
                progressSteps[i].classList.add('active');
            }
            
            currentStep = n;
            
            // Reset button states
            const nextBtn = formSections[n].querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.textContent = 'Continuer';
            }
            
            const submitBtn = formSections[n].querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Créer un compte';
            }
        }

        // Validate step
        function validateStep(stepNumber) {
            const currentSection = formSections[stepNumber];
            const inputs = currentSection.querySelectorAll('input[required], select[required]');
            let isValid = true;
            
            // Remove previous error messages
            currentSection.querySelectorAll('.error-message').forEach(msg => msg.remove());
            
            // Validate required fields
            inputs.forEach(input => {
                // Skip hidden radio buttons that are not checked
                if (input.type === 'radio' && !input.checked) {
                    return;
                }
                
                if (!input.value.trim()) {
                    showError(input, 'Ce champ est requis');
                    isValid = false;
                } else {
                    // Specific validation based on field type
                    switch(input.type) {
                        case 'email':
                            if (!isValidEmail(input.value)) {
                                showError(input, 'Adresse email invalide');
                                isValid = false;
                            }
                            break;
                        case 'date':
                            if (!isValidDate(input.value)) {
                                showError(input, 'Date de naissance invalide (âge entre 13 et 100 ans)');
                                isValid = false;
                            }
                            break;
                        case 'password':
                            if (input.id === 'password' && !isStrongPassword(input.value)) {
                                showError(input, 'Le mot de passe ne respecte pas tous les critères');
                                isValid = false;
                            } else if (input.id === 'confirmPassword' && input.value !== password.value) {
                                showError(input, 'Les mots de passe ne correspondent pas');
                                isValid = false;
                            }
                            break;
                    }
                }
            });
            
            // Validate radio groups
            const radioGroups = currentSection.querySelectorAll('[data-radio-group]');
            radioGroups.forEach(group => {
                const radios = group.querySelectorAll('input[type="radio"]');
                const isChecked = Array.from(radios).some(radio => radio.checked);
                if (!isChecked) {
                    showError(group, 'Veuillez faire une sélection');
                    isValid = false;
                }
            });
            
            // Final step specific validations
            if (stepNumber === 3) {
                const termsCheckbox = currentSection.querySelector('#terms');
                const roleRadios = currentSection.querySelectorAll('input[name="typeUtilisateur"]');
                
                const roleSelected = Array.from(roleRadios).some(radio => radio.checked);
                if (!roleSelected) {
                    showError(roleRadios[0].closest('.role-selection'), 'Veuillez sélectionner votre rôle');
                    isValid = false;
                }
                
                if (!termsCheckbox.checked) {
                    showError(termsCheckbox.closest('.form-check'), 'Vous devez accepter les conditions d\'utilisation');
                    isValid = false;
                }
            }
            
            return isValid;
        }

        // Show error message
        function showError(element, message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            
            if (element.closest('.form-group')) {
                element.closest('.form-group').appendChild(errorDiv);
            } else if (element.closest('.role-selection')) {
                element.closest('.role-selection').appendChild(errorDiv);
            } else if (element.closest('.form-check')) {
                element.closest('.form-check').appendChild(errorDiv);
            } else if (element.hasAttribute('data-radio-group')) {
                element.appendChild(errorDiv);
            }
            
            element.classList.add('error');
        }

        // Email validation
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Date validation
        function isValidDate(date) {
            const selectedDate = new Date(date);
            const today = new Date();
            const minAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
            const maxAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
            
            return selectedDate >= minAge && selectedDate <= maxAge;
        }

        // Password strength validation
        function isStrongPassword(password) {
            const minLength = password.length >= 8;
            const hasLowercase = /[a-z]/.test(password);
            const hasUppercase = /[A-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[!@#$%^&*]/.test(password);
            
            return minLength && hasLowercase && hasUppercase && (hasNumber || hasSpecial);
        }

        // Update password strength indicator
        function updatePasswordStrength() {
            const passwordInput = document.getElementById('password');
            if (!passwordInput || !passwordInput.value) return;
            
            const password = passwordInput.value;
            let strength = 0;
            
            if (password.length >= 8) {
                strength += 25;
                if (passwordRequirements[0]) passwordRequirements[0].classList.add('valid');
            } else {
                if (passwordRequirements[0]) passwordRequirements[0].classList.remove('valid');
            }
            
            if (/[a-z]/.test(password)) {
                strength += 25;
                if (passwordRequirements[1]) passwordRequirements[1].classList.add('valid');
            } else {
                if (passwordRequirements[1]) passwordRequirements[1].classList.remove('valid');
            }
            
            if (/[A-Z]/.test(password)) {
                strength += 25;
                if (passwordRequirements[2]) passwordRequirements[2].classList.add('valid');
            } else {
                if (passwordRequirements[2]) passwordRequirements[2].classList.remove('valid');
            }
            
            if (/[0-9!@#$%^&*]/.test(password)) {
                strength += 25;
                if (passwordRequirements[3]) passwordRequirements[3].classList.add('valid');
            } else {
                if (passwordRequirements[3]) passwordRequirements[3].classList.remove('valid');
            }
            
            if (passwordStrengthBar) {
                passwordStrengthBar.style.width = strength + '%';
                
                if (strength < 50) {
                    passwordStrengthBar.style.backgroundColor = '#ff4444';
                } else if (strength < 75) {
                    passwordStrengthBar.style.backgroundColor = '#ffaa00';
                } else {
                    passwordStrengthBar.style.backgroundColor = '#00aa00';
                }
            }
        }

        // Event listeners for navigation buttons
        nextBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (validateStep(currentStep)) {
                    if (currentStep < formSections.length - 1) {
                        showStep(currentStep + 1);
                    }
                }
            });
        });

        backBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (currentStep > 0) {
                    showStep(currentStep - 1);
                }
            });
        });

        // Password strength listener
        if (password) {
            password.addEventListener('input', updatePasswordStrength);
        }

        // Confirm password listener
        if (confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
                
                if (this.value && password.value && this.value !== password.value) {
                    showError(this, 'Les mots de passe ne correspondent pas');
                }
            });
        }

        // Form submission
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let allValid = true;
            for (let i = 0; i < formSections.length; i++) {
                if (!validateStep(i)) {
                    allValid = false;
                    showStep(i);
                    break;
                }
            }
            
            if (allValid) {
                // Add loading state to submit button
                const submitBtn = this.querySelector('[type="submit"]');
                if (submitBtn) {
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = 'Création du compte...';
                    submitBtn.disabled = true;
                    
                    // Submit the form
                    this.submit();
                }
            }
        });

        // Role selection handler
        const roleOptions = document.querySelectorAll('.role-option');
        roleOptions.forEach(option => {
            option.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                const siblings = this.parentElement.querySelectorAll('.role-option');
                
                siblings.forEach(sibling => sibling.classList.remove('active'));
                this.classList.add('active');
                if (radio) radio.checked = true;
            });
        });

        // Remove errors on input
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            });
        });

        // Initialize first step
        showStep(0);
    }

    // ===== ADDITIONAL FEATURES =====
    
    // Clipboard copy functionality
    window.copyToClipboard = function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                showNotification('Copié dans le presse-papiers!', 'success');
            }).catch(function(err) {
                console.error('Erreur lors de la copie:', err);
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    };

    // Fallback copy method for older browsers
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            showNotification('Copié dans le presse-papiers!', 'success');
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
            showNotification('Erreur lors de la copie', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const style = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform: translateY(-50px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        notification.style.cssText = style;
        
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#212529';
                break;
            default:
                notification.style.backgroundColor = '#007bff';
        }
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-50px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Make notification function globally accessible
    window.showNotification = showNotification;

    // Utility function to debounce events
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Print functionality
    window.printPage = function() {
        window.print();
    };

    // Custom event system
    window.eventBus = {
        events: {},
        on: function(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        },
        emit: function(event, data) {
            if (this.events[event]) {
                this.events[event].forEach(callback => callback(data));
            }
        },
        off: function(event, callback) {
            if (this.events[event]) {
                this.events[event] = this.events[event].filter(cb => cb !== callback);
            }
        }
    };

    // Form helper functions
    window.formUtils = {
        // Serialize form data to object
        serializeForm: function(form) {
            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        },
        
        // Validate form elements
        validateForm: function(form) {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.classList.add('error');
                    isValid = false;
                } else {
                    input.classList.remove('error');
                }
            });
            
            return isValid;
        }
    };

    // Theme toggle functionality (if needed)
    const themeToggle = document.querySelector('#theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            this.textContent = isDark ? '☀️' : '🌙';
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.textContent = '☀️';
        }
    }

    // Auto-save form data (for long forms)
    const autoSaveForms = document.querySelectorAll('[data-autosave]');
    autoSaveForms.forEach(form => {
        const saveKey = form.dataset.autosave;
        
        // Load saved data
        const savedData = localStorage.getItem(saveKey);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = data[key];
                    }
                });
            } catch (e) {
                console.error('Error loading saved form data:', e);
            }
        }
        
        // Save data on change
        const debouncedSave = debounce(() => {
            const formData = formUtils.serializeForm(form);
            localStorage.setItem(saveKey, JSON.stringify(formData));
        }, 500);
        
        form.addEventListener('input', debouncedSave);
        
        // Clear saved data on successful submit
        form.addEventListener('submit', function() {
            localStorage.removeItem(saveKey);
        });
    });
});

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global Error:', { message, source, lineno, colno, error });
    
    // Show user-friendly error message
    if (window.showNotification) {
        showNotification('Une erreur est survenue. Veuillez rafraîchir la page.', 'error');
    }
    
    // You can send errors to a logging service here
    // logErrorToServer(message, source, lineno, colno, error);
    
    return false;
};

// Service worker registration (PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
            console.log('SW registered: ', registration);
        }).catch(function(registrationError) {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    const forms = document.querySelectorAll('form[method="POST"]');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            setTimeout(() => {
                window.history.replaceState(null, null, window.location.href);
            }, 100);
        });
    });
}

// Online/Offline status handling
window.addEventListener('online', function() {
    if (window.showNotification) {
        showNotification('Connexion rétablie', 'success');
    }
});

window.addEventListener('offline', function() {
    if (window.showNotification) {
        showNotification('Connexion perdue. Vérifiez votre connexion Internet.', 'warning');
    }
});