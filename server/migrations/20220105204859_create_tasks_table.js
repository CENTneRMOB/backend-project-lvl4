// @ts-check

export const up = (knex) => (
  knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description');
    table.integer('status_id').references('statuses.id');
    table.integer('creator_id').references('users.id');
    table.integer('executor_id').references('users.id');
    table.timestamps(true, true);
  })
);

export const down = (knex) => knex.schema.dropTable('tasks');
