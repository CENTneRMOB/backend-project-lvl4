// @ts-check

import { Model } from 'objection';
import path from 'path';

export default class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static relationMappings = {
    creator: {
      relation: Model.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'User.js'),
      join: {
        from: 'tasks.creator_id',
        to: 'users.id',
      },
    },
    executor: {
      relation: Model.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'User.js'),
      join: {
        from: 'tasks.executor_id',
        to: 'users.id',
      },
    },
    status: {
      relation: Model.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'Status.js'),
      join: {
        from: 'tasks.status_id',
        to: 'statuses.id',
      },
    },
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        description: { type: 'string' },
        statusId: { type: 'integer' },
        creatorId: { type: 'integer' },
        executorId: { type: 'integer' },
      },
    };
  }
}
