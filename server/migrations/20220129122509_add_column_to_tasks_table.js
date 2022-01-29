// @ts-check

exports.up = (knex) => (
  knex.schema.table('tasks', (table) => {
    table.specificType('labels_id', 'int[]').references('id').inTable('labels');
  })
);

exports.down = (knex) => knex.schema.table('tasks', (table) => {
  table.dropColumn('labels_id');
});
