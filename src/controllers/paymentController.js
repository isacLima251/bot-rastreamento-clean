const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET || '', { apiVersion: '2022-11-15' });

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
