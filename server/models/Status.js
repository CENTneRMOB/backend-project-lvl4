// @ts-check

import { Model } from 'objection';
import path from 'path';

export default class Status extends Model {
  static get tableName() {
    return 'statuses';
  }

  static relationMappings = {
    taskStatus: {
      relation: Model.HasManyRelation,
      modelClass: path.join(__dirname, 'Task.js'),
      join: {
        from: 'statuses.id',
        to: 'tasks.status_id',
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
