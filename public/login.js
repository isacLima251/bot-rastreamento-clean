document.addEventListener('DOMContentLoaded', () => {
    // Se o utilizador já tem um token, redireciona para o painel.
    if (localStorage.getItem('token')) {
        window.location.href = '/index.html';
        return;
    }

    // --- LÓGICA DO NOVO MODAL DE AVISO ---
    const modalAviso = document.getElementById('modal-aviso-login');
    const modalTitulo = document.getElementById('modal-aviso-login-titulo');
    const modalTexto = document.getElementById('modal-aviso-login-texto');
    const modalOkBtn = document.getElementById('btn-modal-aviso-login-ok');

    function mostrarAviso(titulo, texto) {
        if (modalAviso) {
            modalTitulo.textContent = titulo;
            modalTexto.textContent = texto;
            modalAviso.classList.add('active');
        } else {
            // Fallback para o alert caso o HTML do modal não exista
            alert(`${titulo}: ${texto}`);
        }
    }

    function fecharAviso() {
        if (modalAviso) {
            modalAviso.classList.remove('active');
        }
    }

    if(modalOkBtn) modalOkBtn.onclick = fecharAviso;
    if(modalAviso) modalAviso.onclick = (e) => {
        if (e.target === modalAviso) {
            fecharAviso();
        }
    };
    // --- FIM DA LÓGICA DO MODAL ---

    function parseJwt(t) {
        try {
            return JSON.parse(atob(t.split('.')[1]));
        } catch (e) {
            return {};
        }
    }

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!resp.ok) {
                const dataError = await resp.json().catch(() => ({ error: 'Credenciais incorretas' }));
                throw new Error(dataError.error || 'Credenciais incorretas');
            }

            const data = await resp.json();
            localStorage.setItem('token', data.token);
            const info = parseJwt(data.token);

            if (info.precisa_trocar_senha) {
                window.location.href = '/change-password.html';
            } else {
                window.location.href = '/index.html';
            }
        } catch (err) {
            // SUBSTITUINDO O alert() PELA CHAMADA DA FUNÇÃO DO MODAL
            mostrarAviso('Falha no login', err.message);
        }
    });
});
