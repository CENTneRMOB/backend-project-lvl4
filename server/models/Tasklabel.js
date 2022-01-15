// @ts-check

import { Model } from 'objection';

export default class Tasklabel extends Model {
  static get tableName() {
    return 'tasks_labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['taskId', 'labelId'],
      properties: {
        taskId: { type: 'integer' },
        labelId: { type: 'integer' },
      },
    };
  }
}
