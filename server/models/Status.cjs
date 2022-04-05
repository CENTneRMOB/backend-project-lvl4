// @ts-check

import { Model } from 'objection';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(path.dirname(import.meta.url));

export default class Status extends Model {
  static get tableName() {
    return 'statuses';
  }

  static relationMappings = {
    tasks: {
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
