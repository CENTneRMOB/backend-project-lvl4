// @ts-check

import { describe } from '@jest/globals';
import _ from 'lodash';
import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
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
        url: `/users/${user.id}/edit`,
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const newParams = testData.users.new;
      const params = testData.users.updating;
      const cookies = await signIn(app, params);
      const oldUser = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('editUser', { id: oldUser.id }),
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
      const user = testData.users.deleting;
      const cookies = await signIn(app, user);
      const existUser = await models.user.query().findOne({ email: user.email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existUser.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.user.query().findById(existUser.id);

      expect(expected).toBeUndefined();
    });
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

      expect(response.statusCode).toBe(200);

      const expected = await models.user.query().findById({ email: params.email });

      expect(expected).toBeUndefined();
    });

    it('edit by another user', async () => {
      const params = testData.users.updating;
      const existUser = testData.users.existing;

      const cookies = await signIn(app, params);
      const user = await models.user.query().findOne({ email: existUser.email });
      const response = await app.inject({
        method: 'GET',
        url: `/users/${user.id}/edit`,
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update with user error', async () => {
      const newParams = testData.users.newWithError;
      const params = testData.users.updating;
      const cookies = await signIn(app, params);
      const oldUser = await models.user.query().findOne({ email: params.email });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('editUser', { id: oldUser.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('delete by another user', async () => {
      const user = testData.users.deleting;
      const remover = testData.users.existing;
      const cookies = await signIn(app, remover);
      const existUser = await models.user.query().findOne({ email: user.email });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existUser.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.user.query().findById(existUser.id);

      expect(expected).toMatchObject(existUser);
    });

    it('delete task creator', async () => {
      // const tasks = await models.task.query();
      const user = testData.users.existing;
      // const remover = testData.users.existing;
      const cookies = await signIn(app, user);
      const existUser = await models.user.query().findOne({ email: user.email });
      // console.log(tasks);

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteUser', { id: existUser.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const expected = await models.user.query().findById(existUser.id);

      expect(expected).toMatchObject(existUser);
    });
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
