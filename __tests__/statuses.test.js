// @ts-check

import fastify from 'fastify';
import init from '../server/plugin.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let user;
  let cookies;
  let statusParams;
  let statusId;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: false } });
    await init(app);

    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.existing;
    statusParams = testData.statuses.existing;
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
    cookies = await signIn(app, user);
    const existingStatus = await models.status.query().findOne({ name: statusParams.name });
    statusId = existingStatus.id;
  });

  describe('positive cases', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('statuses'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('new', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newStatus'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('create', async () => {
      const newStatus = testData.statuses.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createStatus'),
        payload: {
          data: newStatus,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const status = await models.status.query().findOne({ name: newStatus.name });

      expect(status).toMatchObject(newStatus);
    });

    it('edit', async () => {
      const params = testData.statuses.existing;
      const status = await models.status.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editStatus', { id: status.id }),
        payload: {
          data: params,
        },
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const newParams = testData.statuses.updating;
      const params = testData.statuses.existing;
      const oldStatus = await models.status.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateStatus', { id: oldStatus.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(oldStatus.id);

      expect(actual).toMatchObject(newParams);
    });

    it('delete', async () => {
      const params = testData.statuses.deleting;
      const existingStatus = await models.status.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteStatus', { id: existingStatus.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(existingStatus.id);

      expect(actual).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it.each([
      ['statuses', 'GET'],
      ['newStatus', 'GET'],
      ['createStatus', 'POST'],
    ])('%s auth error case without params', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route),
      });

      expect(response.statusCode).toBe(302);
    });

    it.each([
      ['editStatus', 'GET'],
      ['updateStatus', 'PATCH'],
      ['deleteStatus', 'DELETE'],
    ])('%s auth error case with param', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: statusId }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(statusId);

      expect(actual).toMatchObject(statusParams);
    });

    it('create', async () => {
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createStatus'),
        payload: {
          data: {},
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('update', async () => {
      const params = testData.statuses.existing;
      const oldStatus = await models.status.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateStatus', { id: oldStatus.id }),
        payload: {
          data: { name: '' },
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('delete status on task', async () => {
      const params = testData.statuses.existing;
      const existingStatus = await models.status.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteStatus', { id: existingStatus.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(existingStatus.id);

      expect(actual).toMatchObject(params);
    });
  });

  afterAll(async () => {
    app.close();
  });
});
