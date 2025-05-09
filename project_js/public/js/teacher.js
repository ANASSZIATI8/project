// Script spécifique pour le tableau de bord enseignant
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des fonctionnalités spécifiques à l'enseignant
    initializeExamForm();
    initializeSettingsForm();
    initializeExamFilters();
    initializeExamActions();
});

// Initialisation du formulaire de création d'examen
function initializeExamForm() {
    const createExamForm = document.getElementById('create-exam-form');
    
    if (createExamForm) {
        // Validation améliorée pour le formulaire d'examen
        createExamForm.addEventListener('submit', function(e) {
            const title = document.getElementById('exam-title').value.trim();
            const description = document.getElementById('exam-description').value.trim();
            const audience = document.getElementById('exam-audience').value.trim();
            
            let isValid = true;
            let errors = [];
            
            // Validation détaillée
            if (title === '') {
                isValid = false;
                errors.push('Le titre de l\'examen est requis.');
                document.getElementById('exam-title').classList.add('error');
            } else if (title.length < 5) {
                isValid = false;
                errors.push('Le titre doit contenir au moins 5 caractères.');
                document.getElementById('exam-title').classList.add('error');
            } else {
                document.getElementById('exam-title').classList.remove('error');
            }
            
            if (description === '') {
                isValid = false;
                errors.push('La description de l\'examen est requise.');
                document.getElementById('exam-description').classList.add('error');
            } else if (description.length < 10) {
                isValid = false;
                errors.push('La description doit contenir au moins 10 caractères.');
                document.getElementById('exam-description').classList.add('error');
            } else {
                document.getElementById('exam-description').classList.remove('error');
            }
            
            if (audience === '') {
                isValid = false;
                errors.push('Le public cible est requis.');
                document.getElementById('exam-audience').classList.add('error');
            } else {
                document.getElementById('exam-audience').classList.remove('error');
            }
            
            // Affichage des erreurs
            if (!isValid) {
                e.preventDefault();
                
                // Si un conteneur d'erreurs existe déjà, on le supprime
                const oldErrorContainer = document.querySelector('.exam-form-errors');
                if (oldErrorContainer) {
                    oldErrorContainer.remove();
                }
                
                // Création du conteneur d'erreurs
                const errorContainer = document.createElement('div');
                errorContainer.className = 'alert alert-error exam-form-errors';
                
                // Ajout des messages d'erreur
                errors.forEach(error => {
                    const errorP = document.createElement('p');
                    errorP.textContent = error;
                    errorContainer.appendChild(errorP);
                });
                
                // Insertion du conteneur avant le formulaire
                createExamForm.parentNode.insertBefore(errorContainer, createExamForm);
                
                // Scroll vers le haut du formulaire
                window.scrollTo({
                    top: createExamForm.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
        
        // Suppression de la classe d'erreur lors de la saisie
        const inputs = createExamForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
            });
        });
    }
}

// Initialisation du formulaire de paramètres
function initializeSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    
    if (settingsForm) {
        // Validation simple pour le formulaire de paramètres
        settingsForm.addEventListener('submit', function(e) {
            const firstname = document.getElementById('settings-firstname').value.trim();
            const lastname = document.getElementById('settings-lastname').value.trim();
            
            let isValid = true;
            
            // Validation basique
            if (firstname === '') {
                isValid = false;
                document.getElementById('settings-firstname').classList.add('error');
            } else {
                document.getElementById('settings-firstname').classList.remove('error');
            }
            
            if (lastname === '') {
                isValid = false;
                document.getElementById('settings-lastname').classList.add('error');
            } else {
                document.getElementById('settings-lastname').classList.remove('error');
            }
            
            if (!isValid) {
                e.preventDefault();
                alert('Veuillez remplir les champs obligatoires.');
            }
        });
        
        // Suppression de la classe d'erreur lors de la saisie
        const inputs = settingsForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
            });
        });
    }
}

// Initialisation des filtres pour la liste d'examens
function initializeExamFilters() {
    const searchBox = document.querySelector('.exams-filter .search-box input');
    const filterSelect = document.querySelector('.exams-filter .filter-options select');
    
    if (searchBox && filterSelect) {
        // Fonction de filtrage
        const filterExams = () => {
            const searchTerm = searchBox.value.toLowerCase();
            const filterValue = filterSelect.value;
            
            const examItems = document.querySelectorAll('.exams-list .exam-item');
            let visibleCount = 0;
            
            examItems.forEach(item => {
                const title = item.querySelector('h3').textContent.toLowerCase();
                const description = item.querySelector('p').textContent.toLowerCase();
                const statusElement = item.querySelector('.exam-status');
                const status = statusElement ? statusElement.classList[1] : '';
                
                // Vérification des critères de filtrage
                const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
                let matchesFilter = true;
                
                if (filterValue === 'active') {
                    matchesFilter = status === 'active';
                } else if (filterValue === 'inactive') {
                    matchesFilter = status === 'inactive';
                }
                
                // Affichage ou masquage de l'élément
                if (matchesSearch && matchesFilter) {
                    item.style.display = '';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Gestion de l'état vide
            const emptyState = document.querySelector('.exams-list .empty-state');
            if (emptyState) {
                if (visibleCount === 0 && examItems.length > 0) {
                    emptyState.style.display = 'block';
                    emptyState.querySelector('p').textContent = 'Aucun examen ne correspond à votre recherche.';
                } else {
                    emptyState.style.display = 'none';
                }
            }
        };
        
        // Événements de filtrage
        searchBox.addEventListener('input', filterExams);
        filterSelect.addEventListener('change', filterExams);
    }
}

// Initialisation des actions sur les examens
function initializeExamActions() {
    // Gestion des boutons d'activation/désactivation d'examen
    const toggleButtons = document.querySelectorAll('.exam-actions form button');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Confirmation avant l'action
            if (!confirm('Êtes-vous sûr de vouloir modifier le statut de cet examen ?')) {
                e.preventDefault();
            }
        });
    });
}
