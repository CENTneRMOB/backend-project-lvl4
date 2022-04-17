// @ts-check

const path = require('path');
const BaseModel = require('./BaseModel.cjs');

module.exports = class Task extends BaseModel {
  static get tableName() {
    return 'tasks';
  }

  static get modifiers() {
    return {
      byStatus(query, statusId) {
        query.where('statusId', statusId);
      },

      byExecutor(query, executorId) {
        query.where('executorId', executorId);
      },

      byCreator(query, creatorId) {
        query.where('creatorId', creatorId);
      },

      byLabel(query, labelId) {
        query.where('labels.id', labelId);
      },
    };
  }

  static relationMappings = {
    creator: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'User.cjs'),
      join: {
        from: 'tasks.creator_id',
        to: 'users.id',
      },
    },
    executor: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'User.cjs'),
      join: {
        from: 'tasks.executor_id',
        to: 'users.id',
      },
    },
    status: {
      relation: BaseModel.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'Status.cjs'),
      join: {
        from: 'tasks.status_id',
        to: 'statuses.id',
      },
    },
    labels: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: path.join(__dirname, 'Label.cjs'),
      join: {
        from: 'tasks.id',
        through: {
          from: 'tasks_labels.task_id',
          to: 'tasks_labels.label_id',
        },
        to: 'labels.id',
      },
    },
  };

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
};
