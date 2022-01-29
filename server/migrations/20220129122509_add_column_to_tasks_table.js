// @ts-check

exports.up = (knex) => (
  knex.schema.table('tasks', (table) => {
    table.string('labels_id').nullable();
  })
);

exports.down = (knex) => knex.schema.table('tasks', (table) => {
  table.dropColumn('labels_id');
});
