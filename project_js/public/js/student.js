// Script spécifique pour le tableau de bord enseignant
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des fonctionnalités spécifiques à l'enseignant
    initializeExamForm();
    initializeSettingsForm();
    initializeExamFilters();
    initializeQuestionFilters();
    initializeExamActions();
    initializeQuestionActions();
    setupDateTimeValidation();
});

// Initialisation du formulaire de création d'examen
function initializeExamForm() {
    const createExamForm = document.getElementById('create-exam-form');
    
    if (createExamForm) {
        // Validation améliorée pour le formulaire d'examen
        createExamForm.addEventListener('submit', function(e) {
            const title = document.getElementById('exam-title').value.trim();
            const subject = document.getElementById('exam-subject').value.trim();
            const major = document.getElementById('exam-major').value.trim();
            const duration = document.getElementById('exam-duration').value.trim();
            const totalMarks = document.getElementById('exam-total-marks').value.trim();
            const passingMarks = document.getElementById('exam-passing-marks').value.trim();
            const startTime = document.getElementById('exam-start-time').value.trim();
            const endTime = document.getElementById('exam-end-time').value.trim();
            
            let isValid = true;
            let errors = [];
            
            // Validation détaillée
            if (title === '') {
                isValid = false;
                errors.push('Le titre de l\'examen est requis.');
                document.getElementById('exam-title').classList.add('error');
            } else {
                document.getElementById('exam-title').classList.remove('error');
            }
            
            if (subject === '') {
                isValid = false;
                errors.push('La matière est requise.');
                document.getElementById('exam-subject').classList.add('error');
            } else {
                document.getElementById('exam-subject').classList.remove('error');
            }
            
            if (major === '') {
                isValid = false;
                errors.push('La filière/public cible est requis.');
                document.getElementById('exam-major').classList.add('error');
            } else {
                document.getElementById('exam-major').classList.remove('error');
            }
            
            if (duration === '' || parseInt(duration) < 1) {
                isValid = false;
                errors.push('La durée doit être d\'au moins 1 minute.');
                document.getElementById('exam-duration').classList.add('error');
            } else {
                document.getElementById('exam-duration').classList.remove('error');
            }
            
            if (totalMarks === '' || parseInt(totalMarks) < 1) {
                isValid = false;
                errors.push('Le total des points doit être d\'au moins 1.');
                document.getElementById('exam-total-marks').classList.add('error');
            } else {
                document.getElementById('exam-total-marks').classList.remove('error');
            }
            
            if (passingMarks === '' || parseInt(passingMarks) < 1) {
                isValid = false;
                errors.push('La note de passage doit être d\'au moins 1.');
                document.getElementById('exam-passing-marks').classList.add('error');
            } else if (parseInt(passingMarks) > parseInt(totalMarks)) {
                isValid = false;
                errors.push('La note de passage ne peut pas être supérieure au total des points.');
                document.getElementById('exam-passing-marks').classList.add('error');
            } else {
                document.getElementById('exam-passing-marks').classList.remove('error');
            }
            
            if (startTime === '') {
                isValid = false;
                errors.push('La date et l\'heure de début sont requises.');
                document.getElementById('exam-start-time').classList.add('error');
            } else {
                document.getElementById('exam-start-time').classList.remove('error');
            }
            
            if (endTime === '') {
                isValid = false;
                errors.push('La date et l\'heure de fin sont requises.');
                document.getElementById('exam-end-time').classList.add('error');
            } else {
                document.getElementById('exam-end-time').classList.remove('error');
            }
            
            // Vérification des dates
            if (startTime && endTime) {
                const startDate = new Date(startTime);
                const endDate = new Date(endTime);
                
                if (startDate >= endDate) {
                    isValid = false;
                    errors.push('La date de fin doit être postérieure à la date de début.');
                    document.getElementById('exam-end-time').classList.add('error');
                }
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
        const inputs = createExamForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
            });
        });
    }
}

// Configuration de la validation des dates et heures
function setupDateTimeValidation() {
    const startTimeInput = document.getElementById('exam-start-time');
    const endTimeInput = document.getElementById('exam-end-time');
    
    if (startTimeInput && endTimeInput) {
        // Définir la date minimale à aujourd'hui
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        
        const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        startTimeInput.setAttribute('min', minDateTime);
        
        // Mettre à jour la date minimale de fin lorsque la date de début change
        startTimeInput.addEventListener('change', function() {
            if (this.value) {
                endTimeInput.setAttribute('min', this.value);
                
                // Si la date de fin est antérieure à la date de début, la mettre à jour
                if (endTimeInput.value && new Date(endTimeInput.value) <= new Date(this.value)) {
                    // Ajouter une heure à la date de début pour la date de fin
                    const startDate = new Date(this.value);
                    startDate.setHours(startDate.getHours() + 1);
                    
                    const endYear = startDate.getFullYear();
                    const endMonth = String(startDate.getMonth() + 1).padStart(2, '0');
                    const endDay = String(startDate.getDate()).padStart(2, '0');
                    const endHours = String(startDate.getHours()).padStart(2, '0');
                    const endMinutes = String(startDate.getMinutes()).padStart(2, '0');
                    
                    endTimeInput.value = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
                }
            }
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
                const subject = item.querySelector('.exam-subject') ? 
                    item.querySelector('.exam-subject').textContent.toLowerCase() : '';
                const major = item.querySelector('.exam-major') ? 
                    item.querySelector('.exam-major').textContent.toLowerCase() : '';
                const statusElement = item.querySelector('.exam-status');
                const status = statusElement ? statusElement.classList[1] : '';
                
                // Vérification des critères de filtrage
                const matchesSearch = title.includes(searchTerm) || 
                                     description.includes(searchTerm) ||
                                     subject.includes(searchTerm) ||
                                     major.includes(searchTerm);
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

// Initialisation des filtres pour la banque de questions
function initializeQuestionFilters() {
    const searchBox = document.querySelector('.questions-filter .search-box input');
    const filterSelects = document.querySelectorAll('.questions-filter .filter-options select');
    
    if (searchBox && filterSelects.length > 0) {
        // Fonction de filtrage
        const filterQuestions = () => {
            const searchTerm = searchBox.value.toLowerCase();
            const subjectFilter = filterSelects[0].value;
            const typeFilter = filterSelects[1].value;
            const difficultyFilter = filterSelects[2].value;
            
            const questionItems = document.querySelectorAll('.questions-list .question-item');
            let visibleCount = 0;
            
            questionItems.forEach(item => {
                const questionText = item.querySelector('h3').textContent.toLowerCase();
                const subjectElement = item.querySelector('.question-subject');
                const subject = subjectElement ? subjectElement.textContent.toLowerCase() : '';
                const typeElement = item.querySelector('.question-type');
                const type = typeElement ? typeElement.classList[1] : '';
                const difficultyElement = item.querySelector('.question-difficulty');
                const difficulty = difficultyElement ? difficultyElement.classList[1] : '';
                
                // Vérification des critères de filtrage
                const matchesSearch = questionText.includes(searchTerm) || subject.includes(searchTerm);
                
                let matchesSubject = true;
                if (subjectFilter !== 'all') {
                    matchesSubject = subject.includes(subjectFilter.toLowerCase());
                }
                
                let matchesType = true;
                if (typeFilter !== 'all') {
                    matchesType = type === typeFilter;
                }
                
                let matchesDifficulty = true;
                if (difficultyFilter !== 'all') {
                    matchesDifficulty = difficulty === difficultyFilter;
                }
                
                // Affichage ou masquage de l'élément
                if (matchesSearch && matchesSubject && matchesType && matchesDifficulty) {
                    item.style.display = '';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Gestion de l'état vide
            const emptyState = document.querySelector('.questions-list .empty-state');
            if (emptyState) {
                if (visibleCount === 0 && questionItems.length > 0) {
                    emptyState.style.display = 'block';
                    emptyState.querySelector('p').textContent = 'Aucune question ne correspond à votre recherche.';
                } else {
                    emptyState.style.display = 'none';
                }
            }
        };
        
        // Événements de filtrage
        searchBox.addEventListener('input', filterQuestions);
        filterSelects.forEach(select => {
            select.addEventListener('change', filterQuestions);
        });
    }
}

// Initialisation des actions sur les examens
function initializeExamActions() {
    // Gestion des boutons d'activation/désactivation d'examen
    const toggleButtons = document.querySelectorAll('.exam-actions form button');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Confirmation avant l'action
            const action = button.textContent.trim() === 'Activer' ? 'activer' : 'désactiver';
            if (!confirm(`Êtes-vous sûr de vouloir ${action} cet examen ?`)) {
                e.preventDefault();
            }
        });
    });
    
    // Navigation entre les onglets via les boutons
    const createFirstExamBtn = document.getElementById('create-first-exam');
    const newExamBtn = document.getElementById('new-exam-btn');
    
    if (createFirstExamBtn) {
        createFirstExamBtn.addEventListener('click', function() {
            document.querySelector('a[data-section="create-exam"]').click();
        });
    }
    
    if (newExamBtn) {
        newExamBtn.addEventListener('click', function() {
            document.querySelector('a[data-section="create-exam"]').click();
        });
    }
}

// Initialisation des actions sur les questions
function initializeQuestionActions() {
    // Gestion du bouton de création de question
    const createFirstQuestionBtn = document.getElementById('create-first-question');
    const newQuestionBtn = document.getElementById('new-question-btn');
    
    if (createFirstQuestionBtn) {
        createFirstQuestionBtn.addEventListener('click', function() {
            window.location.href = '/teacher/questions/create';
        });
    }
    
    if (newQuestionBtn) {
        newQuestionBtn.addEventListener('click', function() {
            window.location.href = '/teacher/questions/create';
        });
    }
    
    // Confirmation avant la suppression d'une question
    const deleteButtons = document.querySelectorAll('.delete-form button');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.')) {
                e.preventDefault();
            }
        });
    });
}