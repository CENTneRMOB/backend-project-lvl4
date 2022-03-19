// @ts-check

import { Model } from 'objection';
import path from 'path';

export default class Label extends Model {
  static get tableName() {
    return 'labels';
  }

  static relationMappings = {
    labeledTasks: {
      relation: Model.ManyToManyRelation,
      modelClass: path.join(__dirname, 'Task.js'),
      join: {
        from: 'labels.id',
        through: {
          from: 'tasks_labels.label_id',
          to: 'tasks_labels.task_id',
        },
        to: 'tasks.id',
      },
    },
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
      },
    };
  }
}
