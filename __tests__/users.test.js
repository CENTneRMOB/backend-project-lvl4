// @ts-check

import fastify from 'fastify';
import { describe } from '@jest/globals';
import _ from 'lodash';
import init from '../server/index.js';
import encrypt from '../server/lib/secure.cjs';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);

    knex = app.objection.knex;
    models = app.objection.models;
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  describe('error casses', () => {
    it('create', async () => {
      const params = testData.users.newWithError;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('users'),
        payload: {
          data: params,
        },
      });

      expect(response.statusCode).toBe(422);

      const expected = await models.user.query().findById({ email: params.email });

      expect(expected).toBeUndefined();
    });

    it('edit by another user', async () => {
      const params = testData.users.deleting;
      const { email } = testData.users.existing;

      const cookies = await signIn(app, params);
      const user = await models.user.query().findOne({ email });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editUser', { id: user.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);
    });

    it('update with user error', async () => {
      const newParams = testData.users.newWithError;
      const params = testData.users.updating;
      const cookies = await signIn(app, params);
      const oldUser = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateUser', { id: oldUser.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('delete user by another user', async () => {
      const { email } = testData.users.deleting;
      const cookies = await signIn(app, testData.users.existing);
      const { id: userId } = await models.user.query().findOne({ email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: userId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.user.query().findById(userId);

      expect(actual).not.toBeUndefined();
    });

    it('delete task creator', async () => {
      const { email } = testData.users.existing;
      const cookies = await signIn(app, testData.users.existing);
      const { id: userId } = await models.user.query().findOne({ email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: userId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.user.query().findById(userId);

      expect(actual).not.toBeUndefined();
    });
  });

  describe('positive cases', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('users'),
      });

      expect(response.statusCode).toBe(200);
    });

    it('new', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newUser'),
      });

      expect(response.statusCode).toBe(200);
    });

    it('create', async () => {
      const params = testData.users.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('users'),
        payload: {
          data: params,
        },
      });

      expect(response.statusCode).toBe(302);
      const expected = {
        ..._.omit(params, 'password'),
        passwordDigest: encrypt(params.password),
      };
      const user = await models.user.query().findOne({ email: params.email });
      expect(user).toMatchObject(expected);
    });

    it('edit', async () => {
      const params = testData.users.updating;
      const cookies = await signIn(app, params);
      const user = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editUser', { id: user.id }),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const params = testData.users.existing;
      const newParams = testData.users.updating;
      const cookies = await signIn(app, params);
      const oldUser = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateUser', { id: oldUser.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const newUser = await models.user.query().findById(oldUser.id);
      const expected = {
        ..._.omit(newParams, 'password'),
        passwordDigest: encrypt(newParams.password),
      };

      expect(newUser).toMatchObject(expected);
    });

    it('delete', async () => {
      const { email } = testData.users.deleting;
      const cookies = await signIn(app, testData.users.deleting);
      const { id: userId } = await models.user.query().findOne({ email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: userId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.user.query().findById(userId);

      expect(actual).toBeUndefined();
    });
  });

  afterAll(() => app.close());
});
