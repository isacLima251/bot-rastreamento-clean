const subscriptionService = require('../services/subscriptionService');

module.exports = async (req, res, next) => {
    // Se for admin, não aplica nenhuma restrição
    if (req.user && req.user.is_admin) {
        return next();
    }

    const userId = req.user && req.user.id;
    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
        let sub = await subscriptionService.getUserSubscription(req.db, userId);
        if (!sub) {
            // Se não tiver assinatura, talvez seja um usuário recém-criado, vamos criar uma gratuita
            await subscriptionService.createSubscription(req.db, userId, 1); // ID 1 = Plano Grátis
            sub = await subscriptionService.getUserSubscription(req.db, userId);
        }

        await subscriptionService.resetUsageIfNeeded(req.db, sub.id);
        sub = await subscriptionService.getUserSubscription(req.db, userId); // Recarrega para ter o 'usage' atualizado

        if (sub.status !== 'active') {
            return res.status(403).json({ error: 'Seu plano está inativo. Por favor, contacte o suporte.' });
        }

        // Verifica se a ROTA ATUAL é uma que deve ser bloqueada se o limite for atingido
        const isCreatingOrUpdatingRastreio =
            (req.method === 'POST' && req.path === '/api/pedidos' && req.body.codigoRastreio) ||
            (req.method === 'POST' && req.path.startsWith('/api/postback/') && req.body.tracking_code) ||
            (req.method === 'PUT' && /^\/api\/pedidos\/\d+$/.test(req.path) && req.body.codigoRastreio && !req.originalPedido?.codigoRastreio);

        // Se a ação é uma que consome o limite E o limite foi atingido
        if (isCreatingOrUpdatingRastreio && sub.monthly_limit !== -1 && sub.usage >= sub.monthly_limit) {
            return res.status(403).json({ error: 'Limite do plano excedido. Faça um upgrade para adicionar mais rastreios.' });
        }

        // Para todas as outras rotas (como GET /api/pedidos), permite o acesso
        req.subscription = sub;
        next();

    } catch (e) {
        console.error('Erro crítico no middleware de verificação de plano:', e);
        res.status(500).json({ error: 'Falha na verificação do plano.' });
    }
};
