/**
 * Online Examination System - Main JavaScript
 * Handles form validation, multi-step navigation, and UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initMultiStepForm();
    initPasswordStrengthMeter();
    initRoleSelection();
    initAlertHandlers();
    
    // Set up any other global functionality
    setupEventListeners();
});

/**
 * Initialize the multi-step registration form
 */
function initMultiStepForm() {
    const formSections = document.querySelectorAll('.form-section');
    const steps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    
    // Handle next button clicks
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentSection = this.closest('.form-section');
            const currentIndex = Array.from(formSections).indexOf(currentSection);
            
            // Basic form validation before proceeding
            if (!validateSection(currentSection)) {
                return false;
            }
            
            // Hide current section, show next one
            currentSection.classList.remove('active');
            formSections[currentIndex + 1].classList.add('active');
            
            // Update progress indicator
            steps[currentIndex].classList.add('completed');
            steps[currentIndex + 1].classList.add('active');
            
            // Scroll to top of form
            document.querySelector('.register-card').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Handle back button clicks
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentSection = this.closest('.form-section');
            const currentIndex = Array.from(formSections).indexOf(currentSection);
            
            // Hide current section, show previous one
            currentSection.classList.remove('active');
            formSections[currentIndex - 1].classList.add('active');
            
            // Update progress indicator
            steps[currentIndex].classList.remove('active');
            steps[currentIndex - 1].classList.add('active');
            
            // Scroll to top of form
            document.querySelector('.register-card').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

/**
 * Validate the current form section
 */
function validateSection(section) {
    const requiredInputs = section.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    // Reset previous validation state
    section.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Check all required fields
    requiredInputs.forEach(input => {
        // Remove existing error styling
        input.classList.remove('input-error');
        
        // Validate empty fields
        if (!input.value.trim()) {
            markInputAsInvalid(input, 'Ce champ est obligatoire');
            isValid = false;
        }
        
        // Validate email format
        if (input.type === 'email' && input.value.trim() && !isValidEmail(input.value)) {
            markInputAsInvalid(input, 'Veuillez entrer une adresse email valide');
            isValid = false;
        }
        
        // Validate password confirmation
        if (input.id === 'confirmPassword') {
            const password = document.getElementById('password').value;
            if (input.value !== password) {
                markInputAsInvalid(input, 'Les mots de passe ne correspondent pas');
                isValid = false;
            }
        }
    });
    
    // Check if date of birth is valid
    const dobInput = section.querySelector('#dateNaissance');
    if (dobInput && dobInput.value) {
        const dob = new Date(dobInput.value);
        const now = new Date();
        const minAge = 10; // Minimum age requirement
        
        // Set date to same day but minAge years ago
        now.setFullYear(now.getFullYear() - minAge);
        
        if (dob > now) {
            markInputAsInvalid(dobInput, 'Vous devez avoir au moins ' + minAge + ' ans');
            isValid = false;
        }
    }
    
    return isValid;
}

/**
 * Mark an input as invalid and show error message
 */
function markInputAsInvalid(input, message) {
    // Add error class to input
    input.classList.add('input-error');
    
    // Create and insert error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Insert after the input or its parent label
    const insertAfter = input.closest('.form-group');
    insertAfter.appendChild(errorElement);
    
    // Focus the first invalid input
    if (document.querySelectorAll('.input-error').length === 1) {
        input.focus();
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Initialize the password strength meter
 */
function initPasswordStrengthMeter() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    const strengthBar = document.querySelector('.password-strength-bar');
    const requirementsList = document.querySelectorAll('.password-requirements li');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        
        // Requirements check
        const requirements = [
            { regex: /.{8,}/, index: 0 },            // At least 8 characters
            { regex: /[a-z]/, index: 1 },            // Has lowercase
            { regex: /[A-Z]/, index: 2 },            // Has uppercase
            { regex: /[0-9!@#$%^&*(),.?":{}|<>]/, index: 3 } // Has number or special char
        ];
        
        // Calculate strength based on requirements met
        requirements.forEach(requirement => {
            if (requirement.regex.test(password)) {
                strength += 25;
                requirementsList[requirement.index].classList.add('met');
            } else {
                requirementsList[requirement.index].classList.remove('met');
            }
        });
        
        // Update strength bar
        strengthBar.style.width = strength + '%';
        
        // Set color based on strength
        if (strength <= 25) {
            strengthBar.style.backgroundColor = '#e74c3c'; // Red - Weak
        } else if (strength <= 50) {
            strengthBar.style.backgroundColor = '#f39c12'; // Orange - Fair
        } else if (strength <= 75) {
            strengthBar.style.backgroundColor = '#f1c40f'; // Yellow - Good
        } else {
            strengthBar.style.backgroundColor = '#2ecc71'; // Green - Strong
        }
    });
    
    // Check password confirmation match
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (passwordInput.value !== this.value) {
                this.classList.add('input-error');
            } else {
                this.classList.remove('input-error');
            }
        });
    }
}

/**
 * Initialize role selection UI interactions
 */
function initRoleSelection() {
    // Handle role option selections (for both user type and sex)
    const roleOptions = document.querySelectorAll('.role-option');
    
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Find all options in this selection group
            const container = this.closest('.role-selection');
            const options = container.querySelectorAll('.role-option');
            const input = this.querySelector('input[type="radio"]');
            
            // Update UI state
            options.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Update radio button state
            input.checked = true;
        });
    });
}

/**
 * Initialize alert handler (close button)
 */
function initAlertHandlers() {
    const alertCloseButtons = document.querySelectorAll('.alert-close');
    
    alertCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.alert').style.display = 'none';
        });
    });
}

/**
 * Set up miscellaneous event listeners
 */
function setupEventListeners() {
    // Form submission handler
    const registrationForm = document.querySelector('.auth-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(event) {
            // Final validation before submission
            const allSections = this.querySelectorAll('.form-section');
            let formIsValid = true;
            
            allSections.forEach(section => {
                if (!validateSection(section)) {
                    formIsValid = false;
                }
            });
            
            // Check terms acceptance
            const termsCheckbox = document.getElementById('terms');
            if (termsCheckbox && !termsCheckbox.checked) {
                markInputAsInvalid(termsCheckbox, 'Vous devez accepter les conditions');
                formIsValid = false;
            }
            
            // Prevent submission if validation fails
            if (!formIsValid) {
                event.preventDefault();
                
                // Show the section with errors
                const sectionWithError = document.querySelector('.form-section:has(.input-error)');
                if (sectionWithError) {
                    const allSections = document.querySelectorAll('.form-section');
                    const steps = document.querySelectorAll('.step');
                    
                    // Hide all sections
                    allSections.forEach(s => s.classList.remove('active'));
                    // Show section with error
                    sectionWithError.classList.add('active');
                    
                    // Update progress indicator
                    const errorIndex = Array.from(allSections).indexOf(sectionWithError);
                    steps.forEach((step, index) => {
                        step.classList.remove('active');
                        if (index < errorIndex) {
                            step.classList.add('completed');
                        } else if (index === errorIndex) {
                            step.classList.add('active');
                        }
                    });
                }
            }
        });
    }
    
    // Add any other global event listeners here
}