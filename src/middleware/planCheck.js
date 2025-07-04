const subscriptionService = require('../services/subscriptionService');

module.exports = async (req, res, next) => {
    // Se for admin, não aplica nenhuma restrição.
    if (req.user && req.user.is_admin) {
        return next();
    }

    const userId = req.user && req.user.id;
    if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
        // Passo 1: Apenas busca a assinatura. Não tenta mais criar.
        let sub = await subscriptionService.getUserSubscription(req.db, userId);

        // Se, por algum motivo, o usuário não tiver uma assinatura, bloqueia o acesso.
        // A criação é responsabilidade do fluxo de registo.
        if (!sub) {
            return res.status(403).json({ error: 'Nenhum plano de assinatura ativo foi encontrado para este usuário.' });
        }
        
        // A partir daqui, o código continua como antes, mas de forma mais segura.
        await subscriptionService.resetUsageIfNeeded(req.db, sub.id);
        const subAtualizada = await subscriptionService.getUserSubscription(req.db, userId);

        if (subAtualizada.status !== 'active') {
            return res.status(403).json({ error: 'Seu plano está inativo.' });
        }

        // Verifica se a rota atual é uma que deve ser bloqueada se o limite for atingido.
        const isCreatingOrUpdatingRastreio = 
            (req.method === 'POST' && req.path === '/api/pedidos' && req.body.codigoRastreio) ||
            (req.method.startsWith('TRACKING_CODE_ADDED')) ||
            (req.method === 'PUT' && /^\/api\/pedidos\/\d+$/.test(req.path) && req.body.codigoRastreio && !req.originalPedido?.codigoRastreio);
        
        if (isCreatingOrUpdatingRastreio && subAtualizada.monthly_limit !== -1 && subAtualizada.usage >= subAtualizada.monthly_limit) {
            return res.status(403).json({ error: 'Limite do plano excedido.' });
        }

        req.subscription = subAtualizada;
        next();

    } catch (e) {
        console.error('Erro crítico no middleware de verificação de plano:', e);
        res.status(500).json({ error: 'Falha na verificação do plano.' });
    }
};
