// @ts-check

exports.up = (knex) => (
  knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description').notNullable();
    table.integer('status_id').references('id').inTable('statuses');
    table.integer('creator_id').references('id').inTable('users');
    table.integer('executor_id').nullable().references('id').inTable('users');
    table.specificType('labels_id', 'int[]').references('id').inTable('labels');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  })
);

exports.down = (knex) => knex.schema.dropTable('tasks');
