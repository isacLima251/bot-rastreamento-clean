const subscriptionService = require('../services/subscriptionService');

module.exports = async (req, res, next) => {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Usuário não autenticado' });
    try {
        const sub = await subscriptionService.getUserSubscription(req.db, userId);
        if (!sub) return res.status(403).json({ error: 'Nenhum plano ativo' });
        await subscriptionService.resetUsageIfNeeded(req.db, sub.id);
        if (sub.status !== 'active') return res.status(403).json({ error: 'Plano inativo' });
        if (sub.monthly_limit !== -1 && sub.usage >= sub.monthly_limit) {
            return res.status(403).json({ error: 'Limite do plano excedido' });
        }
        req.subscription = sub;
        next();
    } catch (e) {
        console.error('Erro no middleware de plano', e);
        res.status(500).json({ error: 'Falha na verificação do plano' });
    }
};

