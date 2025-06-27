document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }
    function parseJwt(t){try{return JSON.parse(atob(t.split('.')[1]));}catch(e){return {};}}
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
            if (!resp.ok) throw new Error('Credenciais incorretas');
            const data = await resp.json();
            localStorage.setItem('token', data.token);
            const info = parseJwt(data.token);
            if (info.precisa_trocar_senha) {
                window.location.href = '/change-password.html';
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            alert('Falha no login: ' + err.message);
        }
    });
});

