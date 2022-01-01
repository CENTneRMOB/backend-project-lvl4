// @ts-check

import { Model } from 'objection';

export default class Status extends Model {
  static get tableName() {
    return 'statuses';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['statusName'],
      properties: {
        id: { type: 'integer' },
        statusName: { type: 'string', minLength: 1 },
      },
    };
  }
}
