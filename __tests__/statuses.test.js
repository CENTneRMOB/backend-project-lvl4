// @ts-check

import fastify from 'fastify';
import init from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let user;
  let cookies;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({ logger: { prettyPrint: true } });
    await init(app);

    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.existing;
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
    cookies = await signIn(app, user);
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
      const { name } = testData.statuses.existing;
      const { id: statusId } = await models.status.query().findOne({ name });

      const response = await app.inject({
        method,
        url: app.reverse(route, { id: statusId }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(statusId);

      expect(actual).not.toBeUndefined();
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
      const { name } = testData.statuses.existing;
      const { id } = await models.status.query().findOne({ name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateStatus', { id }),
        payload: {
          data: { name: '' },
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('delete status on task', async () => {
      const { name } = testData.statuses.existing;
      const { id: statusId } = await models.status.query().findOne({ name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteStatus', { id: statusId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(statusId);

      expect(actual).not.toBeUndefined();
    });
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
      const data = testData.statuses.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createStatus'),
        payload: {
          data,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const status = await models.status.query().findOne({ name: data.name });

      expect(status).toMatchObject(data);
    });

    it('edit', async () => {
      const { name } = testData.statuses.existing;
      const { id } = await models.status.query().findOne({ name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editStatus', { id }),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const data = testData.statuses.updating;
      const { name } = testData.statuses.existing;
      const { id } = await models.status.query().findOne({ name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateStatus', { id }),
        payload: {
          data,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(id);

      expect(actual).toMatchObject(data);
    });

    it('delete', async () => {
      const { name } = testData.statuses.deleting;
      const { id: statusId } = await models.status.query().findOne({ name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteStatus', { id: statusId }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.status.query().findById(statusId);

      expect(actual).toBeUndefined();
    });
  });

  afterAll(() => app.close());
});
