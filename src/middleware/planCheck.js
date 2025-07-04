const subscriptionService = require('../services/subscriptionService');

module.exports = async (req, res, next) => {
    // Se for admin, não aplica nenhuma restrição e sai imediatamente.
    if (req.user && req.user.is_admin) {
        return next();
    }

    const userId = req.user && req.user.id;
    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
        let sub = await subscriptionService.getUserSubscription(req.db, userId);

        // Se o usuário não tem uma assinatura (cenário de primeiro login),
        // cria uma assinatura do plano Grátis (ID 1) para ele.
        if (!sub) {
            console.log(`[PlanCheck] Usuário ${userId} sem assinatura. A criar plano Grátis...`);
            await subscriptionService.createSubscription(req.db, userId, 1);
            // Após criar, busca novamente para ter a certeza de que temos os dados.
            sub = await subscriptionService.getUserSubscription(req.db, userId);
        }

        // Se, mesmo após a tentativa de criação, a assinatura não existir, há um problema.
        if (!sub) {
            return res.status(403).json({ error: 'Não foi possível verificar ou criar um plano para este usuário.' });
        }
        
        // A partir daqui, 'sub' tem a garantia de ser um objeto válido.
        await subscriptionService.resetUsageIfNeeded(req.db, sub.id);
        
        // Recarrega os dados da assinatura para ter o 'usage' mais atualizado.
        const subAtualizada = await subscriptionService.getUserSubscription(req.db, userId);

        if (subAtualizada.status !== 'active') {
            return res.status(403).json({ error: 'Seu plano está inativo. Por favor, contacte o suporte.' });
        }

        // Verifica se a rota atual é uma que deve ser bloqueada se o limite for atingido.
        const isCreatingOrUpdatingRastreio = 
            (req.method === 'POST' && req.path === '/api/pedidos' && req.body.codigoRastreio) ||
            (req.method.startsWith('TRACKING_CODE_ADDED')) ||
            (req.method === 'PUT' && /^\/api\/pedidos\/\d+$/.test(req.path) && req.body.codigoRastreio && !req.originalPedido?.codigoRastreio);
        
        if (isCreatingOrUpdatingRastreio && subAtualizada.monthly_limit !== -1 && subAtualizada.usage >= subAtualizada.monthly_limit) {
            return res.status(403).json({ error: 'Limite do plano excedido. Faça um upgrade para adicionar mais rastreios.' });
        }

        req.subscription = subAtualizada;
        next();

    } catch (e) {
        console.error('Erro crítico no middleware de verificação de plano:', e);
        res.status(500).json({ error: 'Falha na verificação do plano.' });
    }
};
