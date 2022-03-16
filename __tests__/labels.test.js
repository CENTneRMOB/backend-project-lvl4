// @ts-check

import getApp from '../server/index.js';
import { getTestData, prepareData, signIn } from './helpers/index.js';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let models;
  let user;
  let cookies;
  let labelParams;
  let labelId;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
    user = testData.users.existing;
    labelParams = testData.labels.existing;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
    cookies = await signIn(app, user);
    const existingLabel = await models.label.query().findOne({ name: labelParams.name });
    labelId = existingLabel.id;
  });

  describe('positive cases', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('labels'),
        cookies,
      });
      expect(response.statusCode).toBe(200);
    });

    it('new', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newLabel'),
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('create', async () => {
      const newLabel = testData.labels.new;
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createLabel'),
        payload: {
          data: newLabel,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const label = await models.label.query().findOne({ name: newLabel.name });

      expect(label).toMatchObject(newLabel);
    });

    it('edit', async () => {
      const params = testData.labels.existing;
      const label = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editLabel', { id: label.id }),
        payload: {
          data: params,
        },
        cookies,
      });

      expect(response.statusCode).toBe(200);
    });

    it('update', async () => {
      const newParams = testData.labels.updating;
      const params = testData.labels.existing;
      const oldLabel = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateLabel', { id: oldLabel.id }),
        payload: {
          data: newParams,
        },
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(oldLabel.id);

      expect(actual).toMatchObject(newParams);
    });

    it('delete', async () => {
      const params = testData.labels.deleting;
      const existingLabel = await models.label.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: existingLabel.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(existingLabel.id);

      expect(actual).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it.each([
      ['labels', 'GET'],
      ['newLabel', 'GET'],
      ['createLabel', 'POST'],
    ])('%s auth error case without params', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route),
      });

      expect(response.statusCode).toBe(302);
    });

    it.each([
      ['editLabel', 'GET'],
      ['updateLabel', 'PATCH'],
      ['deleteLabel', 'DELETE'],
    ])('%s auth error case with param', async (route, method) => {
      const response = await app.inject({
        method,
        url: app.reverse(route, { id: labelId }),
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(labelId);

      expect(actual).toMatchObject(labelParams);
    });

    it('create', async () => {
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('createLabel'),
        payload: {
          data: {},
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('update', async () => {
      const params = testData.labels.existing;
      const oldLabel = await models.label.query().findOne({ name: params.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('updateLabel', { id: oldLabel.id }),
        payload: {
          data: { name: '' },
        },
        cookies,
      });

      expect(response.statusCode).toBe(422);
    });

    it('delete label on task', async () => {
      const params = testData.labels.labelFromTask;
      const existingLabel = await models.label.query().findOne({ name: params.name });

      const response = await app.inject({
        method: 'DELETE',
        url: app.reverse('deleteLabel', { id: existingLabel.id }),
        cookies,
      });

      expect(response.statusCode).toBe(302);

      const actual = await models.label.query().findById(existingLabel.id);

      expect(actual).toMatchObject(params);
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
