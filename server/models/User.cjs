// @ts-check

const objectionUnique = require('objection-unique');
const path = require('path');
const BaseModel = require('./BaseModel.cjs');
const encrypt = require('../lib/secure.cjs');

const unique = objectionUnique({ fields: ['email'] });

module.exports = class User extends unique(BaseModel) {
  static get tableName() {
    return 'users';
  }

  static relationMappings = {
    createdTasks: {
      relation: BaseModel.HasManyRelation,
      modelClass: path.join(__dirname, 'Task.cjs'),
      join: {
        from: 'users.id',
        to: 'tasks.creator_id',
      },
    },
    executedTasks: {
      relation: BaseModel.HasManyRelation,
      modelClass: path.join(__dirname, 'Task.cjs'),
      join: {
        from: 'users.id',
        to: 'tasks.executor_id',
      },
    },
  };

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],
      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', minLength: 1 },
        password: { type: 'string', minLength: 3 },
      },
    };
  }

  static get virtualAttributes() {
    return ['fullName'];
  }

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  set password(value) {
    this.passwordDigest = encrypt(value);
  }

  verifyPassword(password) {
    return encrypt(password) === this.passwordDigest;
  }
};
