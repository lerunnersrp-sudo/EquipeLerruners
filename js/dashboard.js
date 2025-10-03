document.addEventListener('DOMContentLoaded', function () {
    // --- Seletores do DOM ---
    const userNameElement = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const professorView = document.getElementById('professor-view');
    const atletaView = document.getElementById('atleta-view');
    
    // Sub-views Professor
    const hubSubView = document.getElementById('hub-sub-view');
    const managementSubView = document.getElementById('management-sub-view');
    const backToHubBtn = document.getElementById('back-to-hub-btn');
    const managementAthleteName = document.getElementById('management-athlete-name');
    
    // Formulário Add Aluno
    const showAddAthleteBtn = document.getElementById('show-add-athlete-form-btn');
    const addAthleteContainer = document.getElementById('add-athlete-container');
    const cancelAddAthleteBtn = document.getElementById('cancel-add-athlete-btn');
    const addAthleteForm = document.getElementById('add-athlete-form');
    const athleteGridContainer = document.getElementById('athlete-grid-container');

    // Painel de Gestão
    const prescribeTrainingForm = document.getElementById('prescribe-training-form');
    const trainingPlanList = document.getElementById('training-plan-list');
    const athleteProfileForm = document.getElementById('athlete-profile-form');

    // Painel do Atleta
    const myTrainingPlanList = document.getElementById('my-training-plan-list');
    const myProfileForm = document.getElementById('my-profile-form');

    // Modal de Feedback
    const feedbackModal = document.getElementById('feedback-modal');
    const closeFeedbackModalBtn = document.getElementById('close-feedback-modal');
    const feedbackTrainingDetails = document.getElementById('feedback-training-details');
    const feedbackHistory = document.getElementById('feedback-history');
    const feedbackForm = document.getElementById('feedback-form');

    // Variáveis de estado
    let currentManagingAthleteId = null;
    let currentFeedbackTrainingId = null;
    let currentUser = null;

    // --- Lógica Principal de Inicialização ---
    function checkSessionAndInitialize() {
        const sessionDataString = localStorage.getItem('currentUserSession');
        if (!sessionDataString) {
            window.location.href = 'index.html';
            return;
        }
        currentUser = JSON.parse(sessionDataString);
        initializeDashboard(currentUser);
    }

    function initializeDashboard(userData) {
        userNameElement.textContent = `Olá, ${userData.name}`;
        if (userData.role === 'professor') {
            professorView.style.display = 'block';
            showProfessorSubView('hub');
            setupProfessorEventListeners();
            loadAthletesGrid();
        } else if (userData.role === 'atleta') {
            atletaView.style.display = 'block';
            loadAthleteDashboard(userData.atletaId);
        }
    }

    function showProfessorSubView(subViewName) {
        hubSubView.style.display = subViewName === 'hub' ? 'block' : 'none';
        managementSubView.style.display = subViewName === 'management' ? 'block' : 'none';
    }
    
    // --- Funções do Professor ---
    function setupProfessorEventListeners() {
        showAddAthleteBtn.addEventListener('click', () => {
            addAthleteContainer.style.display = 'block';
            showAddAthleteBtn.style.display = 'none';
        });

        cancelAddAthleteBtn.addEventListener('click', () => {
            addAthleteContainer.style.display = 'none';
            showAddAthleteBtn.style.display = 'block';
            addAthleteForm.reset();
        });

        addAthleteForm.addEventListener('submit', handleAddAthlete);
        backToHubBtn.addEventListener('click', () => showProfessorSubView('hub'));

        athleteGridContainer.addEventListener('click', (e) => {
            const manageButton = e.target.closest('.manage-athlete-btn');
            if (manageButton) {
                openManagementPanel(manageButton.dataset.atletaId);
            }
        });
        
        prescribeTrainingForm.addEventListener('submit', handlePrescribeTraining);
        athleteProfileForm.addEventListener('submit', handleUpdateProfile);

        // Listeners do Modal de Feedback
        closeFeedbackModalBtn.addEventListener('click', () => feedbackModal.style.display = 'none');
        feedbackForm.addEventListener('submit', handlePostFeedback);
        window.addEventListener('click', (event) => {
            if (event.target == feedbackModal) {
                feedbackModal.style.display = 'none';
            }
        });
    }

    async function handleAddAthlete(e) {
        e.preventDefault();
        const name = document.getElementById('athlete-name').value.trim();
        const password = document.getElementById('athlete-password').value.trim();
        if (!name || !password) return;

        try {
            const newLoginRef = database.ref('logins').push();
            await newLoginRef.set({ name, password, role: 'atleta' });

            const athleteKey = newLoginRef.key;
            await database.ref('atletas/' + athleteKey).set({
                nome: name,
                perfil: { objetivo: 'Não definido', rp5k: '' }
            });

            alert(`Atleta '${name}' cadastrado com sucesso!`);
            addAthleteForm.reset();
            cancelAddAthleteBtn.click();
            loadAthletesGrid();
        } catch (error) {
            console.error("Erro ao cadastrar atleta:", error);
            alert("Falha ao cadastrar atleta.");
        }
    }

    function loadAthletesGrid() {
        const atletasRef = database.ref('atletas');
        atletasRef.on('value', (snapshot) => {
            athleteGridContainer.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const atleta = childSnapshot.val();
                    const atletaId = childSnapshot.key;
                    athleteGridContainer.innerHTML += `
                        <div class="athlete-card">
                            <h3 class="font-bold text-xl">${atleta.nome}</h3>
                            <p class="text-sm text-gray-600 mt-2"><strong>Objetivo:</strong> ${atleta.perfil?.objetivo || 'Não definido'}</p>
                            <div class="mt-4 text-right">
                                <button data-atleta-id="${atletaId}" class="form-button manage-athlete-btn">Gerir Atleta</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                athleteGridContainer.innerHTML = '<p>Nenhum atleta cadastrado.</p>';
            }
        });
    }
    
    // --- Funções do Painel de Gestão Individual ---
    function openManagementPanel(athleteId) {
        currentManagingAthleteId = athleteId;
        showProfessorSubView('management');

        const atletaRef = database.ref('atletas/' + athleteId);
        atletaRef.on('value', (snapshot) => {
            if (!snapshot.exists()) return;
            const atleta = snapshot.val();
            managementAthleteName.textContent = `Gerindo: ${atleta.nome}`;
            loadProfileDataForProfessor(atleta.perfil);
            loadTrainingPlanForProfessor(athleteId);
        });
    }

    function loadProfileDataForProfessor(perfil) {
        document.getElementById('athlete-goal').value = perfil?.objetivo || '';
        document.getElementById('athlete-rp-5k').value = perfil?.rp5k || '';
    }

    function loadTrainingPlanForProfessor(athleteId) {
        const planRef = database.ref(`atletas/${athleteId}/plano_treino`).orderByChild('data');
        planRef.on('value', (snapshot) => {
            trainingPlanList.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const treino = childSnapshot.val();
                    const treinoId = childSnapshot.key;
                    const statusClass = treino.status === 'realizado' ? 'status-realizado' : 'status-agendado';
                    const statusText = treino.status === 'realizado' ? 'Realizado' : 'Agendado';
                    
                    trainingPlanList.innerHTML += `
                        <div class="training-item ${statusClass}">
                            <div>
                                <p><strong>${new Date(treino.data + 'T03:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}:</strong> ${treino.tipo}</p>
                                <p class="text-sm text-gray-600">${treino.descricao}</p>
                            </div>
                            <div>
                                <span class="text-sm font-bold mr-4">${statusText}</span>
                                <button data-treino-id="${treinoId}" data-treino-details="${treino.tipo} em ${treino.data}" class="feedback-btn form-button" style="width: auto; padding: 0.25rem 0.75rem;">Feedback</button>
                            </div>
                        </div>
                    `;
                });

                document.querySelectorAll('.feedback-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => openFeedbackModal(e.currentTarget.dataset));
                });

            } else {
                trainingPlanList.innerHTML = '<p>Nenhum treino agendado.</p>';
            }
        });
    }
    
    async function handlePrescribeTraining(e) {
        e.preventDefault();
        if (!currentManagingAthleteId) return;

        const newTraining = {
            data: document.getElementById('training-date').value,
            tipo: document.getElementById('training-type').value,
            descricao: document.getElementById('training-description').value,
            status: 'agendado'
        };

        try {
            await database.ref(`atletas/${currentManagingAthleteId}/plano_treino`).push().set(newTraining);
            alert('Treino agendado com sucesso!');
            prescribeTrainingForm.reset();
        } catch (error) {
            console.error("Erro ao agendar treino:", error);
            alert('Falha ao agendar treino.');
        }
    }

    async function handleUpdateProfile(e) {
        e.preventDefault();
        if (!currentManagingAthleteId) return;

        const updatedProfile = {
            objetivo: document.getElementById('athlete-goal').value,
            rp5k: document.getElementById('athlete-rp-5k').value
        };

        try {
            await database.ref(`atletas/${currentManagingAthleteId}/perfil`).update(updatedProfile);
            alert('Perfil do atleta atualizado com sucesso!');
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert('Falha ao atualizar perfil.');
        }
    }

    // --- Funções de Feedback (Professor) ---
    function openFeedbackModal(dataset) {
        currentFeedbackTrainingId = dataset.treinoId;
        feedbackTrainingDetails.textContent = dataset.treinoDetails;
        feedbackModal.style.display = 'flex';
        feedbackHistory.innerHTML = 'Carregando feedbacks...';

        const feedbackRef = database.ref(`atletas/${currentManagingAthleteId}/plano_treino/${currentFeedbackTrainingId}/feedback`);
        feedbackRef.on('value', snapshot => {
            feedbackHistory.innerHTML = '';
            if(snapshot.exists()) {
                snapshot.forEach(child => {
                    const fb = child.val();
                    feedbackHistory.innerHTML += `<p class="text-sm p-1"><strong>${fb.autor}:</strong> ${fb.texto}</p>`;
                });
            } else {
                feedbackHistory.innerHTML = '<p class="text-sm text-gray-500">Nenhum feedback ainda.</p>';
            }
        });
    }

    async function handlePostFeedback(e) {
        e.preventDefault();
        const texto = document.getElementById('feedback-text').value.trim();
        if (!texto || !currentManagingAthleteId || !currentFeedbackTrainingId) return;
        
        const newFeedback = {
            autor: currentUser.name,
            texto: texto,
            timestamp: new Date().toISOString()
        };

        try {
            await database.ref(`atletas/${currentManagingAthleteId}/plano_treino/${currentFeedbackTrainingId}/feedback`).push().set(newFeedback);
            feedbackForm.reset();
        } catch (error) {
            console.error('Erro ao enviar feedback:', error);
            alert('Falha ao enviar feedback.');
        }
    }

    // --- Funções do Atleta ---
    function loadAthleteDashboard(athleteId) {
        const atletaRef = database.ref('atletas/' + athleteId);
        atletaRef.on('value', (snapshot) => {
            if (!snapshot.exists()) return;
            const atleta = snapshot.val();
            loadMyProfileData(atleta.perfil);
            loadMyTrainingPlan(athleteId);
        });

        myProfileForm.addEventListener('submit', (e) => handleUpdateMyProfile(e, athleteId));
        
        myTrainingPlanList.addEventListener('click', (e) => {
            const markDoneBtn = e.target.closest('.mark-as-done-btn');
            if (markDoneBtn) {
                updateTrainingStatus(athleteId, markDoneBtn.dataset.treinoId, 'realizado');
            }
        });
    }

    function loadMyProfileData(perfil) {
        document.getElementById('my-goal').value = perfil?.objetivo || '';
        document.getElementById('my-rp-5k').value = perfil?.rp5k || '';
    }

    function loadMyTrainingPlan(athleteId) {
        const planRef = database.ref(`atletas/${athleteId}/plano_treino`).orderByChild('data');
        planRef.on('value', (snapshot) => {
            myTrainingPlanList.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const treino = childSnapshot.val();
                    const treinoId = childSnapshot.key;
                    const isDone = treino.status === 'realizado';
                    
                    let feedbackHtml = '<div class="mt-2 text-xs text-gray-500">Nenhum feedback do treinador.</div>';
                    if(treino.feedback) {
                        feedbackHtml = '<div class="mt-2 text-xs bg-blue-50 p-2 rounded">';
                        Object.values(treino.feedback).forEach(fb => {
                            feedbackHtml += `<p><strong>${fb.autor}:</strong> ${fb.texto}</p>`;
                        });
                        feedbackHtml += '</div>';
                    }

                    myTrainingPlanList.innerHTML += `
                        <div class="p-3 rounded ${isDone ? 'bg-green-100' : 'bg-yellow-100'}">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p><strong>${new Date(treino.data + 'T03:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}:</strong> ${treino.tipo}</p>
                                    <p class="text-sm text-gray-700">${treino.descricao}</p>
                                </div>
                                ${!isDone ? `<button data-treino-id="${treinoId}" class="mark-as-done-btn form-button">Marcar como Feito</button>` : '<span class="font-bold text-green-700">Realizado</span>'}
                            </div>
                            ${feedbackHtml}
                        </div>
                    `;
                });
            } else {
                myTrainingPlanList.innerHTML = '<p>Nenhum treino agendado.</p>';
            }
        });
    }

    async function handleUpdateMyProfile(e, athleteId) {
        e.preventDefault();
        const updatedProfile = {
            objetivo: document.getElementById('my-goal').value,
            rp5k: document.getElementById('my-rp-5k').value
        };

        try {
            await database.ref(`atletas/${athleteId}/perfil`).update(updatedProfile);
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert('Falha ao atualizar perfil.');
        }
    }
    
    async function updateTrainingStatus(athleteId, trainingId, status) {
        try {
            await database.ref(`atletas/${athleteId}/plano_treino/${trainingId}`).update({ status });
            alert('Treino marcado como realizado!');
        } catch (error) {
            console.error("Erro ao marcar treino:", error);
            alert('Falha ao marcar treino.');
        }
    }

    // --- Funções Gerais ---
    function logoutUser() {
        localStorage.removeItem('currentUserSession');
        window.location.href = 'index.html';
    }

    logoutBtn.addEventListener('click', logoutUser);
    checkSessionAndInitialize();
});
