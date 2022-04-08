// @ts-check

const path = require('path');
const BaseModel = require('./BaseModel.cjs');

module.exports = class Status extends BaseModel {
  static get tableName() {
    return 'statuses';
  }

  static relationMappings = {
    tasks: {
      relation: BaseModel.HasManyRelation,
      modelClass: path.join(__dirname, 'Task.cjs'),
      join: {
        from: 'statuses.id',
        to: 'tasks.status_id',
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
