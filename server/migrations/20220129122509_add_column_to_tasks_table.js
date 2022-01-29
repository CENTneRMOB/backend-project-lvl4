// @ts-check

exports.up = (knex) => (
  knex.schema.table('tasks', (table) => {
    table.integer('labels_id').references('id').inTable('labels');
  })
);

exports.down = (knex) => knex.schema.table('tasks', (table) => {
  table.dropColumn('labels_id');
});
