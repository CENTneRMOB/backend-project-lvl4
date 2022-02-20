// @ts-check

import getApp from '../server/index.js';
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
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.existing;
    statusParams = testData.statuses.existing;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
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
        url: app.reverse('postStatus'),
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
        url: app.reverse('patchStatus', { id: oldStatus.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const newStatus = await models.status.query().findById(oldStatus.id);

      expect(newStatus).toMatchObject(newParams);
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

      const expected = await models.status.query().findById(existingStatus.id);

      expect(expected).toBeUndefined();
    });
  });

  describe('error cases', () => {
    const routesWithData = [
      ['statuses', 'GET', '', 302],
      ['newStatus', 'GET', '', 302],
      ['postStatus', 'POST', '', 302],
      ['editStatus', 'GET', statusId, 302],
      ['patchStatus', 'PATCH', statusId, 302],
      ['deleteStatus', 'DELETE', statusId, 302],
    ];

    it.each(routesWithData)('%s auth error case', async (route, method, data, expected) => {
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: `${data}` }),
      });

      expect(response.statusCode).toBe(expected);

      const statusFromDB = await models.status.query().findById(statusId);

      expect(statusFromDB).toMatchObject(statusParams);
    });

    it('create', async () => {
      const newStatus = testData.statuses.newWithError;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('postStatus'),
        payload: {
          data: newStatus,
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);

      const status = await models.status.query().findOne({ name: newStatus.name });

      expect(status).toBeUndefined();
    });

    it('update', async () => {
      const newParams = testData.statuses.updatingWithError;
      const params = testData.statuses.existing;
      const oldStatus = await models.status.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('patchStatus', { id: oldStatus.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);

      const newStatus = await models.status.query().findById(oldStatus.id);

      expect(newStatus).toMatchObject(params);
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

      const expected = await models.status.query().findById(existingStatus.id);

      expect(expected).toMatchObject(params);
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
