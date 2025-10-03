document.addEventListener('DOMContentLoaded', function () {
    // O professor está GARANTIDO aqui. Não precisa de o criar.
    const STATIC_USERS = [
        { name: 'Leandro Alves', role: 'professor', password: '194001', atletaId: null }
    ];
    let ALL_USERS = [...STATIC_USERS];

    const userSelect = document.getElementById('user-select');
    const passwordInput = document.getElementById('password-input');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    async function initializeLogin() {
        const currentUserSession = localStorage.getItem('currentUserSession');
        if (currentUserSession) {
            window.location.href = 'dashboard.html';
            return;
        }

        try {
            const snapshot = await database.ref('logins').once('value');
            if (snapshot.exists()) {
                const firebaseUsers = Object.values(snapshot.val());
                firebaseUsers.forEach(fbUser => {
                    if (fbUser.role === 'atleta') {
                        // Salva o ID do nó (chave) junto com o usuário
                        const atletaId = Object.keys(snapshot.val()).find(key => snapshot.val()[key] === fbUser);
                        ALL_USERS.push({ ...fbUser, atletaId });
                    }
                });
            }
        } catch (error) {
            console.error("Aviso: Não foi possível carregar alunos do Firebase.", error);
        }

        populateUserSelect();
    }

    function populateUserSelect() {
        if (!userSelect) return;
        userSelect.innerHTML = '<option value="">Selecione o seu utilizador...</option>';
        ALL_USERS.forEach(user => {
            const option = document.createElement('option');
            option.value = user.name;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.textContent = '';
        loginError.style.display = 'none';

        const selectedUserName = userSelect.value;
        const enteredPassword = passwordInput.value;

        if (!selectedUserName) {
            loginError.textContent = 'Por favor, selecione um utilizador.';
            loginError.style.display = 'block';
            return;
        }

        const user = ALL_USERS.find(u => u.name === selectedUserName);

        if (user && user.password === enteredPassword) {
            const sessionData = { name: user.name, role: user.role, atletaId: user.atletaId || null };
            localStorage.setItem('currentUserSession', JSON.stringify(sessionData));
            window.location.href = 'dashboard.html';
        } else {
            loginError.textContent = 'Senha incorreta. Tente novamente.';
            loginError.style.display = 'block';
            passwordInput.value = '';
        }
    });

    initializeLogin();
});
