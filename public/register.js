document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        try {
            const resp = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await resp.json();

            if (!resp.ok) {
                throw new Error(result.error || 'Falha ao registar. O email pode já estar em uso.');
            }

            alert('Conta criada com sucesso! Será redirecionado para a página de login.');

            // Redirecionamento CORRETO
            window.location.href = '/login.html';

        } catch (err) {
            alert('Erro: ' + err.message);
        }
    });
});
