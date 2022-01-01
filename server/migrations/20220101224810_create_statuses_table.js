// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('statuses', (table) => {
    table.increments('id').primary();
    table.string('status_name').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('user_id').references('id').inTable('users');
  })
);

exports.down = (knex) => knex.schema.dropTable('statuses');
