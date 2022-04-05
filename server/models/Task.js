// @ts-check

import { Model } from 'objection';
import path from 'path';

export default class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get modifiers() {
    return {
      byStatus(query, statusId) {
        if (statusId) {
          query.where('statusId', Number(statusId));
        }
      },

      byExecutor(query, executorId) {
        if (executorId) {
          query.where('executorId', Number(executorId));
        }
      },

      byCreator(query, isCreator, creatorId) {
        if (isCreator) {
          query.where('creatorId', Number(creatorId));
        }
      },

      byLabel(query, labelId, objection) {
        if (labelId) {
          query.whereExists(objection.knex('tasks_labels').whereRaw('label_id = ?', labelId).whereRaw('tasks_labels.task_id = tasks.id'));
        }
      },
    };
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
    labels: {
      relation: Model.ManyToManyRelation,
      modelClass: path.join(__dirname, 'Label.js'),
      join: {
        from: 'tasks.id',
        through: {
          from: 'tasks_labels.task_id',
          to: 'tasks_labels.label_id',
        },
        to: 'labels.id',
      },
    },
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        statusId: { type: 'integer', minimum: 1 },
        creatorId: { type: 'integer', minimum: 1 },
        executorId: { type: ['integer', 'null'] },
        labels: { type: 'array' },
      },
    };
  }
}
