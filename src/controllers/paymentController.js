const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET || '', { apiVersion: '2022-11-15' });
const subscriptionService = require('../services/subscriptionService');

exports.createCheckout = async (req, res) => {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'planId obrigatório' });
    try {
        const plan = await new Promise((resolve, reject) => {
            req.db.get('SELECT * FROM plans WHERE id = ?', [planId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            client_reference_id: req.user.id,
            line_items: [{ price_data: { currency: 'brl', product_data: { name: plan.name }, unit_amount: Math.round(plan.price*100) }, quantity: 1 }],
            success_url: process.env.PAY_SUCCESS_URL || 'https://example.com/success',
            cancel_url: process.env.PAY_CANCEL_URL || 'https://example.com/cancel'
        });
        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Falha ao criar checkout' });
    }
};

exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.PAY_WEBHOOK_SECRET || '');
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (userId) {
            try {
                await subscriptionService.updateSubscriptionStatus(req.db, userId, 'active');
            } catch (e) {
                console.error('Erro ao atualizar assinatura:', e);
            }
        }
    }

    res.json({ received: true });
};
