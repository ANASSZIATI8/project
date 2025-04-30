
document.addEventListener('DOMContentLoaded', function() {
    // Detect current page to run appropriate scripts
    const currentPath = window.location.pathname;
    
    // Common functionality for all pages
    initializeCommonFunctions();
    
    // Page-specific functionality
    if (currentPath === '/' || currentPath === '/index') {
        initializeIndexPage();
    } else if (currentPath === '/login') {
        initializeLoginPage();
    } else if (currentPath === '/register') {
        initializeRegisterPage();
    }
    
    // Handle alert close buttons on all pages
    const alertElements = document.querySelectorAll('.alert');
    if (alertElements.length > 0) {
        alertElements.forEach(alert => {
            const closeBtn = alert.querySelector('.alert-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    alert.style.opacity = '0';
                    setTimeout(() => {
                        alert.style.display = 'none';
                    }, 300);
                });
            }
            
            // Auto-hide alerts after 5 seconds
            setTimeout(function() {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.style.display = 'none';
                }, 300);
            }, 5000);
        });
    }
    
    // ==================== COMMON FUNCTIONS ====================
    function initializeCommonFunctions() {
        // Smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('.smooth-scroll');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 70,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Navbar scroll effect 
        const navbar = document.querySelector('.main-header');
        if (navbar) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    }
    
    // ==================== INDEX PAGE FUNCTIONS ====================
    function initializeIndexPage() {
        // Animated counter for statistics
        const statElements = document.querySelectorAll('.stat-number');
        
        if (statElements.length > 0) {
            // Observer for animations when elements come into view
            const animateOnScroll = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateValue(entry.target);
                        animateOnScroll.unobserve(entry.target); // Only animate once
                    }
                });
            }, { threshold: 0.3 });
            
            // Function to animate counter
            function animateValue(element) {
                const finalValue = parseInt(element.getAttribute('data-count'));
                const duration = 2000; // Animation duration in milliseconds
                const startTime = performance.now();
                
                const updateCount = (currentTime) => {
                    const elapsedTime = currentTime - startTime;
                    if (elapsedTime > duration) {
                        element.textContent = finalValue.toLocaleString();
                        return;
                    }
                    
                    const progress = elapsedTime / duration;
                    const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out function
                    
                    const currentCount = Math.floor(easedProgress * finalValue);
                    element.textContent = currentCount.toLocaleString();
                    
                    requestAnimationFrame(updateCount);
                };
                
                requestAnimationFrame(updateCount);
            }
            
            // Start observing each stat element
            statElements.forEach(statEl => {
                animateOnScroll.observe(statEl);
            });
        }
        
        // Feature cards hover effect
        const featureCards = document.querySelectorAll('.feature-card');
        
        if (featureCards.length > 0) {
            featureCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    // Create a subtle lift effect
                    this.style.transform = 'translateY(-10px)';
                    this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.05)';
                });
            });
        }
        
        // Testimonial carousel/slider (if you have one)
        const testimonialSlider = document.querySelector('.testimonial-slider');
        
        if (testimonialSlider) {
            let currentSlide = 0;
            const slides = testimonialSlider.querySelectorAll('.testimonial-card');
            const totalSlides = slides.length;
            const nextBtn = document.querySelector('.slider-next');
            const prevBtn = document.querySelector('.slider-prev');
            
            function showSlide(index) {
                // Hide all slides
                slides.forEach(slide => {
                    slide.style.display = 'none';
                });
                
                // Show the current slide
                slides[index].style.display = 'block';
                slides[index].style.animation = 'fadeIn 0.5s ease-out forwards';
            }
            
            function nextSlide() {
                currentSlide = (currentSlide + 1) % totalSlides;
                showSlide(currentSlide);
            }
            
            function prevSlide() {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                showSlide(currentSlide);
            }
            
            // Initialize first slide
            showSlide(currentSlide);
            
            // Add event listeners to buttons
            if (nextBtn && prevBtn) {
                nextBtn.addEventListener('click', nextSlide);
                prevBtn.addEventListener('click', prevSlide);
            }
            
            // Auto slide every 5 seconds
            setInterval(nextSlide, 5000);
        }
    }
    
    // ==================== LOGIN PAGE FUNCTIONS ====================
    function initializeLoginPage() {
        const loginForm = document.querySelector('form.auth-form');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');
        
        // Input validation and formatting
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                const email = this.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (email && !emailRegex.test(email)) {
                    showInputError(this, 'Please enter a valid email address');
                } else {
                    clearInputError(this);
                }
            });
        }
        
        // Remember me functionality using localStorage
        if (rememberCheckbox && emailInput) {
            // Check if we have a saved email
            const savedEmail = localStorage.getItem('rememberedEmail');
            if (savedEmail) {
                emailInput.value = savedEmail;
                rememberCheckbox.checked = true;
            }
        }
        
        // Form submission handling
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                // Validate form
                let isValid = true;
                
                if (!emailInput.value.trim()) {
                    showInputError(emailInput, 'Email is required');
                    isValid = false;
                }
                
                if (!passwordInput.value) {
                    showInputError(passwordInput, 'Password is required');
                    isValid = false;
                }
                
                if (!isValid) {
                    event.preventDefault();
                    return;
                }
                
                // Handle remember me
                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', emailInput.value.trim());
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                
                // Form is submitted if validation passes
            });
        }
        
        // Add password toggle visibility
        const passwordToggle = document.querySelector('.password-toggle');
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', function() {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.innerHTML = '👁️';
                    this.setAttribute('aria-label', 'Hide password');
                } else {
                    passwordInput.type = 'password';
                    this.innerHTML = '👁️';
                    this.setAttribute('aria-label', 'Show password');
                }
            });
        }
        
        // Add animation classes
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.classList.add('animated');
        }
        
        // Autofocus on email input if empty
        if (emailInput && emailInput.value === '') {
            emailInput.focus();
        }
    }
    
    // ==================== REGISTER PAGE FUNCTIONS ====================
    function initializeRegisterPage() {
        const registerForm = document.querySelector('form.auth-form');
        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const roleRadios = document.querySelectorAll('input[name="role"]');
        const termsCheckbox = document.getElementById('terms');
        
        // Multi-step form functionality
        const steps = document.querySelectorAll('.step');
        const formSections = document.querySelectorAll('.form-section');
        const nextBtns = document.querySelectorAll('.next-btn');
        const backBtns = document.querySelectorAll('.back-btn');
        let currentStep = 0;
        
        if (steps.length > 0 && formSections.length > 0) {
            // Initialize the form to show the first section
            updateFormProgress(currentStep);
            
            // Next button event listeners
            nextBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    if (validateCurrentSection(currentStep)) {
                        currentStep++;
                        updateFormProgress(currentStep);
                    }
                });
            });
            
            // Back button event listeners
            backBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    currentStep--;
                    updateFormProgress(currentStep);
                });
            });
            
            function updateFormProgress(step) {
                // Update steps visualization
                steps.forEach((stepEl, index) => {
                    if (index < step) {
                        stepEl.classList.remove('active');
                        stepEl.classList.add('completed');
                    } else if (index === step) {
                        stepEl.classList.add('active');
                        stepEl.classList.remove('completed');
                    } else {
                        stepEl.classList.remove('active', 'completed');
                    }
                });
                
                // Update visible form section
                formSections.forEach((section, index) => {
                    if (index === step) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });
            }
            
            function validateCurrentSection(step) {
                let isValid = true;
                
                // Validate based on which section we're on
                switch(step) {
                    case 0: // Personal information section
                        if (!fullNameInput.value.trim()) {
                            showInputError(fullNameInput, 'Full name is required');
                            isValid = false;
                        }
                        
                        if (emailInput) {
                            const email = emailInput.value.trim();
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            
                            if (!email) {
                                showInputError(emailInput, 'Email is required');
                                isValid = false;
                            } else if (!emailRegex.test(email)) {
                                showInputError(emailInput, 'Please enter a valid email address');
                                isValid = false;
                            }
                        }
                        break;
                        
                    case 1: // Account details section
                        if (passwordInput) {
                            if (!passwordInput.value) {
                                showInputError(passwordInput, 'Password is required');
                                isValid = false;
                            } else if (passwordInput.value.length < 8) {
                                showInputError(passwordInput, 'Password must be at least 8 characters');
                                isValid = false;
                            }
                        }
                        
                        if (confirmPasswordInput) {
                            if (!confirmPasswordInput.value) {
                                showInputError(confirmPasswordInput, 'Please confirm your password');
                                isValid = false;
                            } else if (confirmPasswordInput.value !== passwordInput.value) {
                                showInputError(confirmPasswordInput, 'Passwords do not match');
                                isValid = false;
                            }
                        }
                        break;
                }
                
                return isValid;
            }
        }
        
        // Role selection cards
        const roleOptions = document.querySelectorAll('.role-option');
        
        if (roleOptions.length > 0 && roleRadios.length > 0) {
            roleOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const radioInput = this.querySelector('input[type="radio"]');
                    
                    // Clear active class from all options
                    roleOptions.forEach(opt => {
                        opt.classList.remove('active');
                    });
                    
                    // Set clicked option as active
                    this.classList.add('active');
                    
                    // Check the radio input
                    radioInput.checked = true;
                });
            });
            
            // Set initial active state based on checked radio
            roleRadios.forEach(radio => {
                if (radio.checked) {
                    const parentOption = radio.closest('.role-option');
                    if (parentOption) {
                        parentOption.classList.add('active');
                    }
                }
            });
        }
        
        // Password strength meter
        if (passwordInput) {
            const passwordStrengthBar = document.querySelector('.password-strength-bar');
            const passwordRequirements = document.querySelectorAll('.password-requirements li');
            
            passwordInput.addEventListener('input', function() {
                const password = this.value;
                let strength = calculatePasswordStrength(password);
                
                // Update requirements list
                updatePasswordRequirements(password, passwordRequirements);
                
                // Update strength bar
                if (passwordStrengthBar) {
                    passwordStrengthBar.style.width = strength + '%';
                    
                    if (strength < 25) {
                        passwordStrengthBar.style.backgroundColor = '#ff4d4d'; // Red
                    } else if (strength < 50) {
                        passwordStrengthBar.style.backgroundColor = '#ffa64d'; // Orange
                    } else if (strength < 75) {
                        passwordStrengthBar.style.backgroundColor = '#ffff4d'; // Yellow
                    } else {
                        passwordStrengthBar.style.backgroundColor = '#4dff4d'; // Green
                    }
                }
            });
            
            function calculatePasswordStrength(password) {
                if (!password) return 0;
                
                let strength = 0;
                
                // Length check
                if (password.length >= 8) strength += 25;
                
                // Contains lowercase
                if (/[a-z]/.test(password)) strength += 25;
                
                // Contains uppercase
                if (/[A-Z]/.test(password)) strength += 25;
                
                // Contains number or special character
                if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
                
                return strength;
            }
            
            function updatePasswordRequirements(password, requirementElements) {
                if (!requirementElements || !requirementElements.length) return;
                
                const requirements = [
                    { regex: /.{8,}/, index: 0 }, // At least 8 characters
                    { regex: /[a-z]/, index: 1 }, // Contains lowercase
                    { regex: /[A-Z]/, index: 2 }, // Contains uppercase
                    { regex: /[0-9!@#$%^&*(),.?":{}|<>]/, index: 3 } // Contains number or special character
                ];
                
                requirements.forEach(req => {
                    if (req.index < requirementElements.length) {
                        if (password && req.regex.test(password)) {
                            requirementElements[req.index].classList.add('met');
                        } else {
                            requirementElements[req.index].classList.remove('met');
                        }
                    }
                });
            }
        }
        
        // Form submission validation
        if (registerForm) {
            registerForm.addEventListener('submit', function(event) {
                // Validate all form fields
                let isValid = true;
                
                if (!fullNameInput.value.trim()) {
                    showInputError(fullNameInput, 'Full name is required');
                    isValid = false;
                }
                
                if (emailInput) {
                    const email = emailInput.value.trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    
                    if (!email) {
                        showInputError(emailInput, 'Email is required');
                        isValid = false;
                    } else if (!emailRegex.test(email)) {
                        showInputError(emailInput, 'Please enter a valid email address');
                        isValid = false;
                    }
                }
                
                if (passwordInput) {
                    if (!passwordInput.value) {
                        showInputError(passwordInput, 'Password is required');
                        isValid = false;
                    } else if (passwordInput.value.length < 8) {
                        showInputError(passwordInput, 'Password must be at least 8 characters');
                        isValid = false;
                    }
                }
                
                if (confirmPasswordInput) {
                    if (!confirmPasswordInput.value) {
                        showInputError(confirmPasswordInput, 'Please confirm your password');
                        isValid = false;
                    } else if (confirmPasswordInput.value !== passwordInput.value) {
                        showInputError(confirmPasswordInput, 'Passwords do not match');
                        isValid = false;
                    }
                }
                
                // Check if a role is selected
                let roleSelected = false;
                roleRadios.forEach(radio => {
                    if (radio.checked) roleSelected = true;
                });
                
                if (!roleSelected) {
                    alert('Please select a role (Student or Teacher)');
                    isValid = false;
                }
                
                // Check terms agreement
                if (termsCheckbox && !termsCheckbox.checked) {
                    const termsError = document.createElement('div');
                    termsError.className = 'alert alert-danger';
                    termsError.innerText = 'You must agree to the Terms of Service and Privacy Policy';
                    
                    const existingAlert = document.querySelector('.alert.alert-danger');
                    if (existingAlert) {
                        existingAlert.remove();
                    }
                    
                    registerForm.insertBefore(termsError, registerForm.firstChild);
                    isValid = false;
                }
                
                if (!isValid) {
                    event.preventDefault();
                    window.scrollTo(0, 0);
                }
            });
        }
        
        // Add animation classes
        const registerCard = document.querySelector('.register-card');
        if (registerCard) {
            registerCard.classList.add('animated');
        }
        
        // Autofocus on first input
        if (fullNameInput && fullNameInput.value === '') {
            fullNameInput.focus();
        }
    }
    
    // ==================== HELPER FUNCTIONS ====================
    // These functions are used by multiple pages
    
    function showInputError(inputElement, message) {
        // Clear any existing error
        clearInputError(inputElement);
        
        // Add error class to input
        inputElement.classList.add('is-invalid');
        
        // Create and add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        errorElement.innerText = message;
        
        inputElement.parentNode.appendChild(errorElement);
        
        // Focus on first invalid input
        if (document.querySelectorAll('.is-invalid').length === 1) {
            inputElement.focus();
        }
    }
    
    function clearInputError(inputElement) {
        inputElement.classList.remove('is-invalid');
        
        const existingError = inputElement.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    }
});