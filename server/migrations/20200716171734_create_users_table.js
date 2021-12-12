// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').notNullable();
    table.string('password_digest').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  })
);

exports.down = (knex) => knex.schema.dropTable('users');
