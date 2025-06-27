document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login.html'; return; }

    document.getElementById('change-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('new-password').value.trim();
        try {
            const resp = await fetch('/api/users/me/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password })
            });
            if (!resp.ok) throw new Error('Erro ao atualizar senha');
            localStorage.removeItem('token');
            alert('Senha atualizada. Faça login novamente.');
            window.location.href = '/login.html';
        } catch (err) {
            alert(err.message);
        }
    });
});
