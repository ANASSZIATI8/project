// Script principal pour tous les écrans de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur la page d'inscription (formulaire multi-étapes)
    if (document.querySelector('.register-form')) {
        initMultiStepForm();
    }
    
    // Initialisation des éléments d'interface pour les tableaux de bord
    if (document.querySelector('.sidebar')) {
        initializeSidebar();
        initializeNotifications();
        initializeUserInfo();
        initializeLogout();
    }
    
    // Pour la page enseignant
    if (document.getElementById('create-first-exam')) {
        initializeTeacherDashboard();
    }
    
    // Pour la page étudiant
    if (document.getElementById('results-section')) {
        initializeStudentDashboard();
    }
});

// Initialisation du formulaire d'inscription multi-étapes
function initMultiStepForm() {
    // Gestion des étapes du formulaire
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const formSections = document.querySelectorAll('.form-section');
    const progressSteps = document.querySelectorAll('.progress-bar .step');
    
    // Gestion des boutons "Suivant"
    nextButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            formSections[index].classList.remove('active');
            formSections[index + 1].classList.add('active');
            
            // Mise à jour de la barre de progression
            progressSteps[index].classList.remove('active');
            progressSteps[index + 1].classList.add('active');
        });
    });
    
    // Gestion des boutons "Retour"
    backButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            // Pour les boutons "Retour", l'index est décalé (ils commencent à l'étape 2)
            const currentStepIndex = index + 1;
            formSections[currentStepIndex].classList.remove('active');
            formSections[currentStepIndex - 1].classList.add('active');
            
            // Mise à jour de la barre de progression
            progressSteps[currentStepIndex].classList.remove('active');
            progressSteps[currentStepIndex - 1].classList.add('active');
        });
    });
    
    // Gestion des sélections de rôle et de sexe
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Trouver le parent .role-selection
            const roleSelection = this.closest('.role-selection');
            
            // Désactiver toutes les options dans ce groupe
            roleSelection.querySelectorAll('.role-option').forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Activer l'option cliquée
            this.classList.add('active');
            
            // Cocher le radio button
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
            }
        });
    });
    
    // Ajout de la validation de mot de passe
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrengthBar = document.querySelector('.password-strength-bar');
    const passwordRequirements = document.querySelectorAll('.password-requirements li');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validatePassword(this.value);
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            checkPasswordMatch();
        });
    }
    
    function validatePassword(password) {
        // Critères de validation
        const criteria = [
            password.length >= 8,                             // Au moins 8 caractères
            /[a-z]/.test(password),                           // Contient des minuscules
            /[A-Z]/.test(password),                           // Contient des majuscules
            /[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)  // Contient des chiffres ou caractères spéciaux
        ];
        
        // Mettre à jour les items de la liste des exigences
        criteria.forEach((met, index) => {
            if (passwordRequirements[index]) {
                if (met) {
                    passwordRequirements[index].classList.add('met');
                } else {
                    passwordRequirements[index].classList.remove('met');
                }
            }
        });
        
        // Calculer la force du mot de passe (0-100%)
        const strength = criteria.filter(Boolean).length * 25;
        
        // Mettre à jour la barre de force
        if (passwordStrengthBar) {
            passwordStrengthBar.style.width = strength + '%';
            
            // Changer la couleur en fonction de la force
            if (strength <= 25) {
                passwordStrengthBar.style.backgroundColor = '#ff4d4d'; // Rouge
            } else if (strength <= 50) {
                passwordStrengthBar.style.backgroundColor = '#ffa64d'; // Orange
            } else if (strength <= 75) {
                passwordStrengthBar.style.backgroundColor = '#ffff4d'; // Jaune
            } else {
                passwordStrengthBar.style.backgroundColor = '#4dff4d'; // Vert
            }
        }
    }
    
    function checkPasswordMatch() {
        if (passwordInput && confirmPasswordInput) {
            if (passwordInput.value === confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('');
            } else {
                confirmPasswordInput.setCustomValidity('Les mots de passe ne correspondent pas');
            }
        }
    }
}

// Gestion des sections du tableau de bord
function initializeSidebar() {
    // Navigation entre les sections
    const navItems = document.querySelectorAll('.sidebar-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    const sectionTitle = document.getElementById('section-title');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Mise à jour de l'élément actif dans la sidebar
            navItems.forEach(navItem => {
                navItem.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
            
            // Affichage de la section correspondante
            const targetSection = this.getAttribute('data-section');
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${targetSection}-section`).classList.add('active');
            
            // Mise à jour du titre
            sectionTitle.textContent = this.querySelector('.text').textContent;
        });
    });
    
    // Gestion du menu hamburger en mode responsive
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Fermeture du menu en mode responsive lors du clic à l'extérieur
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && e.target !== hamburgerBtn) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Gestion des notifications
function initializeNotifications() {
    const notificationsBtn = document.getElementById('notifications-btn');
    
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', function() {
            alert('Fonctionnalité de notifications en cours de développement.');
        });
    }
}

// Initialisation des informations utilisateur
function initializeUserInfo() {
    const userInitials = document.getElementById('user-initials');
    const userName = document.getElementById('user-name');
    
    // Cette fonction peut être étendue pour charger les informations utilisateur
    // via une requête AJAX si nécessaire
    if (userName && userName.textContent === 'Chargement...') {
        // Si les données utilisateur ne sont pas disponibles dans le template EJS,
        // on pourrait faire une requête API ici pour les récupérer
        // Pour l'instant, on laisse le comportement par défaut
    }
}

// Gestion de la déconnexion
function initializeLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Redirection vers la route de déconnexion
            window.location.href = '/logout';
        });
    }
}

// Fonctions spécifiques au tableau de bord enseignant
function initializeTeacherDashboard() {
    const createFirstExamBtn = document.getElementById('create-first-exam');
    const newExamBtn = document.getElementById('new-exam-btn');
    
    // Redirection vers la section "Créer un examen"
    if (createFirstExamBtn) {
        createFirstExamBtn.addEventListener('click', function() {
            // Sélection de l'onglet "Créer un examen"
            const createExamTab = document.querySelector('a[data-section="create-exam"]');
            if (createExamTab) {
                createExamTab.click();
            }
        });
    }
    
    // Redirection vers la section "Créer un examen"
    if (newExamBtn) {
        newExamBtn.addEventListener('click', function() {
            // Sélection de l'onglet "Créer un examen"
            const createExamTab = document.querySelector('a[data-section="create-exam"]');
            if (createExamTab) {
                createExamTab.click();
            }
        });
    }
    
    // Validation du formulaire de création d'examen
    const createExamForm = document.getElementById('create-exam-form');
    if (createExamForm) {
        createExamForm.addEventListener('submit', function(e) {
            const title = document.getElementById('exam-title').value.trim();
            const description = document.getElementById('exam-description').value.trim();
            const audience = document.getElementById('exam-audience').value.trim();
            
            let isValid = true;
            
            // Validation simple côté client
            if (title === '') {
                isValid = false;
                alert('Veuillez saisir un titre pour l\'examen.');
            } else if (description === '') {
                isValid = false;
                alert('Veuillez saisir une description pour l\'examen.');
            } else if (audience === '') {
                isValid = false;
                alert('Veuillez préciser le public cible de l\'examen.');
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    }
}

// Fonctions spécifiques au tableau de bord étudiant
function initializeStudentDashboard() {
    // Recherche et filtrage des examens
    const examSearch = document.querySelector('.exams-filter .search-box input');
    const examFilter = document.querySelector('.exams-filter .filter-options select');
    
    if (examSearch) {
        examSearch.addEventListener('input', function() {
            filterExamsList();
        });
    }
    
    if (examFilter) {
        examFilter.addEventListener('change', function() {
            filterExamsList();
        });
    }
    
    // Recherche et filtrage des résultats
    const resultSearch = document.querySelector('.results-filter .search-box input');
    const resultFilter = document.querySelector('.results-filter .filter-options select');
    
    if (resultSearch) {
        resultSearch.addEventListener('input', function() {
            filterResultsList();
        });
    }
    
    if (resultFilter) {
        resultFilter.addEventListener('change', function() {
            filterResultsList();
        });
    }
}

// Filtrage des examens en fonction de la recherche et du filtre
function filterExamsList() {
    const searchInput = document.querySelector('.exams-filter .search-box input');
    const filterSelect = document.querySelector('.exams-filter .filter-options select');
    
    if (!searchInput || !filterSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    
    const examItems = document.querySelectorAll('.exams-list .exam-item');
    
    examItems.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        const statusElement = item.querySelector('.exam-status');
        const status = statusElement ? statusElement.classList[1] : '';
        
        // Vérification de la correspondance avec la recherche
        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        
        // Vérification de la correspondance avec le filtre
        let matchesFilter = true;
        if (filterValue !== 'all') {
            matchesFilter = status === filterValue;
        }
        
        // Affichage ou masquage de l'élément
        if (matchesSearch && matchesFilter) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Affichage de l'état vide si aucun résultat
    const emptyState = document.querySelector('.exams-list .empty-state');
    const hasVisibleItems = Array.from(examItems).some(item => item.style.display !== 'none');
    
    if (emptyState) {
        if (!hasVisibleItems) {
            emptyState.style.display = 'block';
            emptyState.querySelector('p').textContent = 'Aucun examen ne correspond à votre recherche.';
        } else {
            emptyState.style.display = 'none';
        }
    }
}

// Filtrage des résultats en fonction de la recherche et du filtre
function filterResultsList() {
    const searchInput = document.querySelector('.results-filter .search-box input');
    const filterSelect = document.querySelector('.results-filter .filter-options select');
    
    if (!searchInput || !filterSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    
    const resultItems = document.querySelectorAll('.results-list .result-item');
    
    resultItems.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        const score = item.querySelector('.score');
        const isPassing = score.classList.contains('passing');
        
        // Vérification de la correspondance avec la recherche
        const matchesSearch = title.includes(searchTerm);
        
        // Vérification de la correspondance avec le filtre
        let matchesFilter = true;
        if (filterValue === 'passing') {
            matchesFilter = isPassing;
        } else if (filterValue === 'failing') {
            matchesFilter = !isPassing;
        }
        
        // Affichage ou masquage de l'élément
        if (matchesSearch && matchesFilter) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Affichage de l'état vide si aucun résultat
    const emptyState = document.querySelector('.results-list .empty-state');
    const hasVisibleItems = Array.from(resultItems).some(item => item.style.display !== 'none');
    
    if (emptyState) {
        if (!hasVisibleItems) {
            emptyState.style.display = 'block';
            emptyState.querySelector('p').textContent = 'Aucun résultat ne correspond à votre recherche.';
        } else {
            emptyState.style.display = 'none';
        }
    }
}

// Gestion des alertes
document.addEventListener('DOMContentLoaded', function() {
    // Fermeture des alertes
    const alertCloseButtons = document.querySelectorAll('.alert-close');
    
    alertCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.closest('.alert');
            if (alert) {
                alert.style.display = 'none';
            }
        });
    });
});