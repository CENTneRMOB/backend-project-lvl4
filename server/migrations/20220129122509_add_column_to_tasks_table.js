// @ts-check

export const up = (knex) => (
  knex.schema.table('tasks', (table) => {
    table.string('labels_id');
  })
);

export const down = (knex) => knex.schema.table('tasks', (table) => {
  table.dropColumn('labels_id');
});
