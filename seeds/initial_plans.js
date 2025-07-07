exports.seed = async function(knex) {
  // insere plano gratuito padrao se nao existir
  await knex('plans').insert([
    {
      id: 1,
      name: 'Gr\u00e1tis',
      price: 0,
      monthly_limit: 50,
      checkout_url: null
    }
  ]).onConflict('id').ignore();
};
