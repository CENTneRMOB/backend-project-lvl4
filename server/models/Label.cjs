// @ts-check

const path = require('path');
const BaseModel = require('./BaseModel.cjs');

module.exports = class Label extends BaseModel {
  static get tableName() {
    return 'labels';
  }

  static relationMappings = {
    tasks: {
      relation: BaseModel.ManyToManyRelation,
      modelClass: path.join(__dirname, 'Task.cjs'),
      join: {
        from: 'labels.id',
        through: {
          from: 'tasks_labels.label_id',
          to: 'tasks_labels.task_id',
        },
        to: 'tasks.id',
      },
    },
  };

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
};
