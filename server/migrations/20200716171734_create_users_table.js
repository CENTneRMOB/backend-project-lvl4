// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password_digest').notNullable();
    table.timestamps(true, true);
  })
);

exports.down = (knex) => knex.schema.dropTable('users');
