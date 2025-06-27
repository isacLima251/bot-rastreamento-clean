const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY || '');

async function sendWelcomeEmail(to, password) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY não configurada. Email não será enviado.');
        return;
    }
    const loginUrl = (process.env.APP_URL || 'http://localhost:3000') + '/login.html';
    const html = `<p>Olá,</p>
<p>Bem-vindo ao nosso sistema!<br>
Seu usuário é: <strong>${to}</strong><br>
Senha provisória: <strong>${password}</strong></p>
<p>Acesse <a href="${loginUrl}">${loginUrl}</a> para entrar e trocar sua senha.</p>`;
    try {
        await resend.emails.send({
            from: 'Suporte <no-reply@example.com>',
            to,
            subject: 'Boas-vindas ao sistema',
            html
        });
    } catch (err) {
        console.error('Erro ao enviar email:', err);
    }
}

module.exports = { sendWelcomeEmail };
