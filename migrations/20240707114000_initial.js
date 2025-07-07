exports.up = async function(knex) {
  // pedidos
  await knex.schema.createTable('pedidos', table => {
    table.increments('id').primary();
    table.integer('cliente_id');
    table.text('nome');
    table.text('email');
    table.text('telefone').unique().notNullable();
    table.text('produto');
    table.text('codigoRastreio');
    table.text('dataPostagem');
    table.text('statusInterno');
    table.text('ultimaAtualizacao');
    table.text('ultimaLocalizacao');
    table.text('origemUltimaMovimentacao');
    table.text('destinoUltimaMovimentacao');
    table.text('descricaoUltimoEvento');
    table.text('mensagemUltimoStatus');
    table.text('fotoPerfilUrl');
    table.timestamp('dataCriacao').defaultTo(knex.fn.now());
    table.integer('mensagensNaoLidas').defaultTo(0).notNullable();
    table.text('ultimaMensagem');
    table.datetime('dataUltimaMensagem');
    table.text('notas');
  });

  await knex.schema.createTable('historico_mensagens', table => {
    table.increments('id').primary();
    table.integer('pedido_id').notNullable();
    table.integer('cliente_id');
    table.text('mensagem').notNullable();
    table.text('tipo_mensagem');
    table.text('origem').notNullable();
    table.timestamp('data_envio').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('logs', table => {
    table.increments('id').primary();
    table.integer('cliente_id');
    table.text('acao').notNullable();
    table.text('detalhe');
    table.timestamp('data_criacao').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('integration_history', table => {
    table.increments('id').primary();
    table.integer('user_id');
    table.text('client_name');
    table.text('client_cell');
    table.text('product_name');
    table.text('status');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('automacoes', table => {
    table.text('gatilho');
    table.integer('cliente_id');
    table.integer('ativo').notNullable().defaultTo(0);
    table.text('mensagem');
    table.primary(['gatilho','cliente_id']);
  });

  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.text('email').unique().notNullable();
    table.text('password').notNullable();
    table.text('api_key').unique();
    table.integer('is_admin').defaultTo(0).notNullable();
    table.integer('is_active').defaultTo(1).notNullable();
    table.integer('precisa_trocar_senha').defaultTo(1).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('integration_settings', table => {
    table.integer('user_id').primary();
    table.text('postback_secret');
    table.text('rastreio_api_key');
    table.text('webhook_url');
  });

  await knex.schema.createTable('user_settings', table => {
    table.integer('user_id').primary();
    table.integer('create_contact_on_message').defaultTo(1);
  });

  await knex.schema.createTable('plans', table => {
    table.increments('id').primary();
    table.text('name').notNullable();
    table.decimal('price').notNullable();
    table.integer('monthly_limit').notNullable();
    table.text('checkout_url');
  });

  await knex.schema.createTable('subscriptions', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.integer('plan_id').notNullable();
    table.text('status').defaultTo('active').notNullable();
    table.integer('usage').defaultTo(0).notNullable();
    table.timestamp('renewal_date');
  });

  await knex.schema.createTable('integrations', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.text('platform').notNullable();
    table.text('name').notNullable();
    table.text('unique_path').unique().notNullable();
    table.text('secret_key');
    table.text('status').defaultTo('active');
  });
};

exports.down = async function(knex) {
  await knex.schema
    .dropTableIfExists('integrations')
    .dropTableIfExists('subscriptions')
    .dropTableIfExists('plans')
    .dropTableIfExists('user_settings')
    .dropTableIfExists('integration_settings')
    .dropTableIfExists('users')
    .dropTableIfExists('automacoes')
    .dropTableIfExists('integration_history')
    .dropTableIfExists('logs')
    .dropTableIfExists('historico_mensagens')
    .dropTableIfExists('pedidos');
};
